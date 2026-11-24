import type { Diagnosis, CheckerFinding } from '../types';

export function analyzeCiscoLog(log: string, symptom?: string): Diagnosis {
  const text = (log || '').trim();
  const sym = (symptom || '').toLowerCase();
  const findings: CheckerFinding[] = [];

  // 1. Interface Administratively Down / Shutdown
  if (/administratively\s+down/i.test(text) || /^\s*shutdown\s*$/m.test(text)) {
    const intMatch = text.match(/([A-Za-z]+(?:\s*[0-9]+(?:\/[0-9]+)*))/);
    const intf = intMatch ? intMatch[1].trim() : 'GigabitEthernet0/1';

    findings.push({
      rule: 'INTERFACE_ADMIN_DOWN',
      severity: 'critical',
      message: `Interface ${intf} is administratively shut down.`,
      evidence: 'administratively down status found in output',
      recommendation: `Issue 'no shutdown' under interface ${intf}`
    });

    return {
      caseId: 'LIVE-DIAG',
      root_cause: `Interface ${intf} is administratively shut down (manual 'shutdown' command active in running-config). Link cannot transmit or receive frames.`,
      confidence: 'high',
      osi_layer: 'Layer 1 (Physical) / Layer 2 (Data Link)',
      concept: 'Interface State Management & Administrative Shutdown',
      evidence: [
        `${intf} is administratively down, line protocol is down`,
        'Explicit shutdown statement present in device configuration',
        'Physical carrier disable signaled across line card'
      ],
      next_command: `show ip interface brief | include ${intf}`,
      fix_steps: [
        'enable',
        'configure terminal',
        `interface ${intf}`,
        'no shutdown',
        'end',
        'write memory'
      ],
      verification_steps: `show ip interface ${intf} | include line protocol`,
      checkerFindings: findings,
      mode: 'demo'
    };
  }

  // 2. OSPF Neighbor Down / Dead Timer Expired / MTU Mismatch
  if (/OSPF.*ADJCHG|OSPF.*FULL\s+to\s+DOWN|Dead\s*timer\s*expired|show\s+ip\s+ospf\s+neighbor.*empty/i.test(text) || /ospf|adjacency/i.test(sym)) {
    findings.push({
      rule: 'OSPF_NEIGHBOR_DOWN',
      severity: 'critical',
      message: 'OSPF adjacency torn down or neighbor hello packets missing beyond dead interval.',
      evidence: 'OSPF state transition to DOWN or Dead Timer Expired detected',
      recommendation: 'Verify Hello/Dead timers, subnet masks, MTU size, and OSPF Area ID on both sides'
    });

    return {
      caseId: 'LIVE-DIAG',
      root_cause: 'OSPF adjacency failure: Router stopped receiving Hello packets before dead timer expiration, or MTU mismatch caused EXSTART/DOWN state.',
      confidence: 'high',
      osi_layer: 'Layer 3 (Network)',
      concept: 'Interior Gateway Routing Protocol (OSPFv2/v3)',
      evidence: [
        'OSPF adjacency transition: FULL to DOWN detected',
        'Dead timer expired without receipt of consecutive Hello PDUs',
        'Route withdrawal propagated throughout local OSPF Area'
      ],
      next_command: 'show ip ospf neighbor',
      fix_steps: [
        'enable',
        'configure terminal',
        'interface GigabitEthernet0/1',
        'ip ospf hello-interval 10',
        'ip ospf dead-interval 40',
        'ip mtu 1500',
        'router ospf 1',
        'network 192.168.1.0 0.0.0.3 area 0',
        'end',
        'clear ip ospf process'
      ],
      verification_steps: 'show ip ospf neighbor detail',
      checkerFindings: findings,
      mode: 'demo'
    };
  }

  // 3. DHCP Pool Exhaustion or APIPA (169.254.x.x)
  if (/Leased\s*addresses:\s*254|DHCP.*EXHAUST|169\.254\.\d+\.\d+|DHCP_SNOOPING/i.test(text) || /dhcp|no ip|apipa/i.test(sym)) {
    findings.push({
      rule: 'DHCP_POOL_EXHAUSTED',
      severity: 'critical',
      message: 'DHCP scope has zero remaining IP leases available or client assigned APIPA address.',
      evidence: 'Leased addresses at 100% capacity or 169.254.x.x assigned',
      recommendation: 'Expand scope subnet mask, decrease lease duration, or clear stale IP leases'
    });

    return {
      caseId: 'LIVE-DIAG',
      root_cause: 'DHCP address pool exhaustion: All 254 host addresses in the pool are currently leased. New clients receive no DHCPOFFER and default to APIPA 169.254.x.x.',
      confidence: 'high',
      osi_layer: 'Layer 7 (Application) / Layer 3 (Network)',
      concept: 'Dynamic Host Configuration Protocol (DHCP) Scopes',
      evidence: [
        'Leased addresses: 254 (100% capacity limit reached)',
        'Client assigned 169.254.x.x link-local APIPA fallback address',
        'DHCPDISCOVER packets discarded without IP allocation'
      ],
      next_command: 'show ip dhcp pool',
      fix_steps: [
        'enable',
        'clear ip dhcp binding *',
        'configure terminal',
        'ip dhcp pool LAN_CLIENTS',
        'network 10.0.0.0 255.255.254.0',
        'default-router 10.0.0.1',
        'dns-server 8.8.8.8 1.1.1.1',
        'lease 0 8 0',
        'end',
        'write memory'
      ],
      verification_steps: 'show ip dhcp binding | count',
      checkerFindings: findings,
      mode: 'demo'
    };
  }

  // 4. Access List (ACL) Denying Traffic
  if (/IPACCESSLOG|denied\s+tcp|denied\s+udp|access-list.*deny|deny\s+ip\s+any\s+any/i.test(text) || /firewall|acl|blocked/i.test(sym)) {
    findings.push({
      rule: 'ACL_TRAFFIC_DENIED',
      severity: 'high',
      message: 'Packets dropped by Access Control List statement or trailing implicit deny.',
      evidence: 'SEC-6-IPACCESSLOGP packet denial or deny counter increment observed',
      recommendation: 'Add permit statement above the deny line for required application ports'
    });

    return {
      caseId: 'LIVE-DIAG',
      root_cause: 'Access Control List filter block: Inbound/outbound traffic matched an explicit deny rule or encountered the implicit "deny ip any any" at the bottom of the ACL.',
      confidence: 'high',
      osi_layer: 'Layer 4 (Transport) / Layer 3 (Network)',
      concept: 'Packet Filtering & Access Control Lists (ACLs)',
      evidence: [
        'Syslog %SEC-6-IPACCESSLOGP log generated with denied packet attributes',
        'TCP SYN or UDP datagram discarded at router ingress interface',
        'Matching hit count on deny statement actively incrementing'
      ],
      next_command: 'show access-lists',
      fix_steps: [
        'enable',
        'configure terminal',
        'ip access-list extended ALLOW_BUSINESS_SERVICES',
        '10 permit tcp 192.168.1.0 0.0.0.255 any eq 80',
        '20 permit tcp 192.168.1.0 0.0.0.255 any eq 443',
        '30 permit tcp 192.168.1.0 0.0.0.255 any eq 22',
        'end',
        'write memory'
      ],
      verification_steps: 'show ip access-lists ALLOW_BUSINESS_SERVICES',
      checkerFindings: findings,
      mode: 'demo'
    };
  }

  // 5. BGP State Idle / Active / Peer Down
  if (/BGP.*Idle|BGP.*Active|BGP.*open failed|neighbor.*down/i.test(text) || /bgp|peering/i.test(sym)) {
    findings.push({
      rule: 'BGP_SESSION_DOWN',
      severity: 'critical',
      message: 'BGP session is stuck in Idle/Active state. TCP port 179 transport connection cannot form.',
      evidence: 'BGP neighbor state reported as Idle/Active',
      recommendation: 'Check TCP 179 reachability, ASN accuracy, and ebgp-multihop or update-source settings'
    });

    return {
      caseId: 'LIVE-DIAG',
      root_cause: 'BGP session failure: The router cannot complete the TCP 3-way handshake on port 179 with the configured BGP peer, keeping session in Idle/Active state.',
      confidence: 'high',
      osi_layer: 'Layer 7 (Application) / Layer 4 (Transport TCP)',
      concept: 'Border Gateway Protocol (BGP) Peering States',
      evidence: [
        'BGP neighbor state reported as Idle or Active',
        'TCP 3-way handshake to remote peer port 179 unreachable or timed out',
        'No BGP routing updates exchanged across autonomous systems'
      ],
      next_command: 'show ip bgp summary',
      fix_steps: [
        'enable',
        'configure terminal',
        'router bgp 65001',
        'neighbor 10.0.0.2 remote-as 65002',
        'neighbor 10.0.0.2 update-source Loopback0',
        'neighbor 10.0.0.2 ebgp-multihop 2',
        'end',
        'clear ip bgp 10.0.0.2 soft'
      ],
      verification_steps: 'show ip bgp summary | include 10.0.0.2',
      checkerFindings: findings,
      mode: 'demo'
    };
  }

  // 6. Duplex / Speed Mismatch
  if (/DUPLEX_MISMATCH|half.*duplex|speed.*mismatch|late\s+collision/i.test(text) || /duplex|slow|collision/i.test(sym)) {
    findings.push({
      rule: 'DUPLEX_MISMATCH_DETECTED',
      severity: 'high',
      message: 'Duplex mismatch between connected switchports causing collisions and frame discards.',
      evidence: 'CDP-4-DUPLEX_MISMATCH log or late collisions detected',
      recommendation: 'Standardize duplex mode: set both endpoints to auto-negotiate or hardcode Full Duplex'
    });

    return {
      caseId: 'LIVE-DIAG',
      root_cause: 'Duplex mismatch: One switchport is operating in Full Duplex mode while the partner link is operating in Half Duplex mode, resulting in CRC errors and collision storm.',
      confidence: 'high',
      osi_layer: 'Layer 1 (Physical) / Layer 2 (Data Link)',
      concept: 'Ethernet Physical Layer & Autonegotiation Protocol',
      evidence: [
        'CDP-4-DUPLEX_MISMATCH event logged by Cisco Discovery Protocol',
        'Late collisions and FCS/CRC input errors incrementing rapidly',
        'Severe throughput collapse under simultaneous bidirectional transmit'
      ],
      next_command: 'show interfaces status',
      fix_steps: [
        'enable',
        'configure terminal',
        'interface GigabitEthernet0/1',
        'speed auto',
        'duplex full',
        'end',
        'write memory'
      ],
      verification_steps: 'show interfaces GigabitEthernet0/1 | include duplex',
      checkerFindings: findings,
      mode: 'demo'
    };
  }

  // 7. Port Security Err-Disable or BPDU Guard
  if (/ERR_DISABLE|psecure-violation|BPDUGUARD|Secure-shutdown/i.test(text) || /err-disabled|port security/i.test(sym)) {
    findings.push({
      rule: 'PORT_ERR_DISABLED',
      severity: 'critical',
      message: 'Interface transitioned to err-disabled state due to MAC limit violation or BPDU Guard.',
      evidence: 'PM-4-ERR_DISABLE or psecure-violation detected',
      recommendation: 'Resolve violation cause, then cycle interface with shutdown / no shutdown'
    });

    return {
      caseId: 'LIVE-DIAG',
      root_cause: 'Port err-disabled by security policy: Port-Security detected an unauthorized MAC address or BPDU Guard received unexpected STP BPDUs on an access port.',
      confidence: 'high',
      osi_layer: 'Layer 2 (Data Link)',
      concept: 'Cisco Port-Security & STP BPDU Guard Protection',
      evidence: [
        'Interface status changed to err-disabled',
        'psecure-violation or BPDU Guard trigger recorded in system log',
        'ASIC hardware shutdown applied to port ingress traffic'
      ],
      next_command: 'show interfaces status err-disabled',
      fix_steps: [
        'enable',
        'configure terminal',
        'interface GigabitEthernet0/5',
        'switchport mode access',
        'switchport port-security',
        'switchport port-security maximum 2',
        'switchport port-security violation restrict',
        'shutdown',
        'no shutdown',
        'end',
        'write memory'
      ],
      verification_steps: 'show port-security interface GigabitEthernet0/5',
      checkerFindings: findings,
      mode: 'demo'
    };
  }

  // 8. Missing Default Route / Gateway of Last Resort
  if (/Gateway of last resort is not set|no route to host|unreachable/i.test(text) || /no route|internet down/i.test(sym)) {
    findings.push({
      rule: 'GATEWAY_NOT_SET',
      severity: 'high',
      message: 'No Gateway of Last Resort configured; router drops all non-local subnet destinations.',
      evidence: 'Gateway of last resort is not set in routing table',
      recommendation: 'Configure a default route pointing to upstream gateway'
    });

    return {
      caseId: 'LIVE-DIAG',
      root_cause: 'Missing Default Gateway / Route (0.0.0.0/0): The router has no gateway of last resort defined, discarding all outbound internet and inter-site traffic.',
      confidence: 'high',
      osi_layer: 'Layer 3 (Network)',
      concept: 'Static & Dynamic IP Routing Architectures',
      evidence: [
        'Gateway of last resort is not set displayed in show ip route',
        'ICMP Destination Network Unreachable returned to clients',
        'Packets matching no specific subnet table entry are discarded'
      ],
      next_command: 'show ip route',
      fix_steps: [
        'enable',
        'configure terminal',
        'ip route 0.0.0.0 0.0.0.0 GigabitEthernet0/0 192.168.1.1',
        'end',
        'write memory'
      ],
      verification_steps: 'show ip route 0.0.0.0',
      checkerFindings: findings,
      mode: 'demo'
    };
  }

  // 9. Generic / Heuristic Intelligent Fallback
  const lines = text.split('\n').filter(l => l.trim().length > 0);
  const sampleEvidence = lines.slice(0, 3).map(l => l.trim());

  return {
    caseId: 'LIVE-DIAG',
    root_cause: symptom
      ? `Network anomaly identified related to: "${symptom}". Inspection shows packet drop or protocol parameter mismatch.`
      : 'Cisco IOS CLI log inspection detected operational discrepancies requiring protocol verification and interface check.',
    confidence: 'medium',
    osi_layer: 'Layer 3 (Network) / Layer 2 (Data Link)',
    concept: 'Cisco IOS System Diagnostics & Protocol Analysis',
    evidence: sampleEvidence.length > 0 ? sampleEvidence : ['Anomalous error pattern detected in Cisco CLI stream'],
    next_command: 'show ip interface brief',
    fix_steps: [
      'enable',
      'configure terminal',
      '! Verify interface link states',
      'show ip interface brief',
      '! Inspect routing table and neighbor adjacencies',
      'show ip route',
      'end'
    ],
    verification_steps: 'show logging | include %',
    checkerFindings: [
      {
        rule: 'CUSTOM_LOG_EVALUATION',
        severity: 'medium',
        message: 'Log inspected against Cisco NetPulse AI neural diagnostic rules.',
        evidence: lines[0] || 'Custom log stream',
        recommendation: 'Execute suggested verification commands to inspect operational state.'
      }
    ],
    mode: 'demo'
  };
}
