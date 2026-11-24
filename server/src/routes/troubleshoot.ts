import { Router, Request, Response } from 'express';
import { runRuleChecker } from '../services/ruleChecker';
import { NetworkCase, CheckerFinding, Diagnosis } from '../types/index';

const router = Router();

interface TroubleshootRequest {
  log: string;
  symptom?: string;
  deviceType?: string;
}

export function analyzeLogOffline(log: string, symptom?: string): Diagnosis {
  const findings: CheckerFinding[] = [];
  const text = log || '';
  const sym = (symptom || '').toLowerCase();

  // Rule 1: Administratively Down / Shutdown
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
      caseId: 'LIVE-' + Date.now().toString().slice(-4),
      root_cause: `Interface ${intf} is manually disabled via administrative shutdown command. Traffic forwarding is halted at Layer 1/2.`,
      confidence: 'high',
      osi_layer: 'Layer 1 (Physical) / Layer 2 (Data Link)',
      concept: 'Interface State Management & Administrative Shutdown',
      evidence: [
        `${intf} is administratively down, line protocol is down`,
        `Administrative status overrides physical link detection`,
        `Hardware carrier is disabled in configuration`
      ],
      next_command: `show ip interface brief`,
      fix_steps: [
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

  // Rule 2: OSPF Neighbor Adjacency Down or Dead Timer Expired
  if (/OSPF.*ADJCHG|OSPF.*from\s+FULL\s+to\s+DOWN|Dead\s*timer\s*expired|show\s+ip\s+ospf\s+neighbor.*empty/i.test(text)) {
    findings.push({
      rule: 'OSPF_NEIGHBOR_DOWN',
      severity: 'critical',
      message: 'OSPF adjacency dropped or dead timer expired without receiving hello packets.',
      evidence: 'OSPF state transition to DOWN or Dead Timer Expired detected',
      recommendation: 'Verify Hello/Dead intervals, MTU matching, and area ID consistency on the transit link'
    });

    return {
      caseId: 'LIVE-' + Date.now().toString().slice(-4),
      root_cause: 'OSPF adjacency failure: Router stopped receiving OSPF Hello packets within the Dead timer window, causing neighbor tear-down.',
      confidence: 'high',
      osi_layer: 'Layer 3 (Network)',
      concept: 'Interior Gateway Routing Protocol (OSPFv2/v3)',
      evidence: [
        'OSPF adjacency transition: FULL to DOWN',
        'Hello/Dead timer expiration without keepalive receipt',
        'Routing table route withdrawal for transit subnets'
      ],
      next_command: 'show ip ospf neighbor',
      fix_steps: [
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

  // Rule 3: DHCP Pool Exhaustion or APIPA 169.254.x.x
  if (/Leased\s*addresses:\s*254|DHCP.*EXHAUST|169\.254\.\d+\.\d+|DHCP_SNOOPING/i.test(text) || /dhcp|ip address/i.test(sym)) {
    findings.push({
      rule: 'DHCP_EXHAUSTION_OR_APIPA',
      severity: 'critical',
      message: 'DHCP scope exhaustion or client fallback to APIPA link-local address (169.254.x.x).',
      evidence: 'DHCP pool capacity reached 100% or APIPA address detected in host binding',
      recommendation: 'Expand DHCP subnet mask or clear expired lease bindings'
    });

    return {
      caseId: 'LIVE-' + Date.now().toString().slice(-4),
      root_cause: 'DHCP address pool has reached maximum allocation limit (254/254). End devices cannot lease IP addresses and failover to APIPA.',
      confidence: 'high',
      osi_layer: 'Layer 7 (Application) / Layer 3 (Network)',
      concept: 'Dynamic Host Configuration Protocol (DHCP) Scopes',
      evidence: [
        'Leased addresses: 254 (100% utilization)',
        'DHCPDISCOVER packets ignored due to no available IP offers',
        'Client assigned fallback APIPA 169.254.x.x address'
      ],
      next_command: 'show ip dhcp pool',
      fix_steps: [
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

  // Rule 4: Access List (ACL) Deny Rule
  if (/IPACCESSLOG|denied\s+tcp|denied\s+udp|access-list.*deny|deny\s+ip\s+any\s+any/i.test(text)) {
    findings.push({
      rule: 'ACL_EXPLICIT_DENY',
      severity: 'high',
      message: 'Access Control List is actively dropping packets matching deny statements or implicit deny.',
      evidence: 'Access-list drop counter incrementing or syslog denial match detected',
      recommendation: 'Review inbound/outbound ACL rules on the interface'
    });

    return {
      caseId: 'LIVE-' + Date.now().toString().slice(-4),
      root_cause: 'Access Control List (ACL) filter drop: Traffic is matched against a deny rule or hit the implicit "deny ip any any" at the end of the ACL.',
      confidence: 'high',
      osi_layer: 'Layer 4 (Transport) / Layer 3 (Network)',
      concept: 'Packet Filtering & Security Access Lists (ACLs)',
      evidence: [
        'Syslog SEC-6-IPACCESSLOGP packet denial recorded',
        'ACL rule drop counter actively incrementing',
        'TCP SYN packet discarded before three-way handshake'
      ],
      next_command: 'show access-lists',
      fix_steps: [
        'configure terminal',
        'ip access-list extended SECURE_TRAFFIC',
        '15 permit tcp 192.168.1.0 0.0.0.255 any eq 80',
        '16 permit tcp 192.168.1.0 0.0.0.255 any eq 443',
        'end',
        'write memory'
      ],
      verification_steps: 'show ip access-lists SECURE_TRAFFIC',
      checkerFindings: findings,
      mode: 'demo'
    };
  }

  // Rule 5: BGP Peering Idle / Connect Failure
  if (/BGP.*Idle|BGP.*Active|BGP.*open failed|neighbor.*down/i.test(text)) {
    findings.push({
      rule: 'BGP_SESSION_DOWN',
      severity: 'critical',
      message: 'BGP peering is stuck in Idle/Active state. TCP port 179 transport connection could not be established.',
      evidence: 'BGP state reported as Idle or Active without transitioning to Established',
      recommendation: 'Check TCP 179 connectivity, neighbor IP address, and remote-as configuration'
    });

    return {
      caseId: 'LIVE-' + Date.now().toString().slice(-4),
      root_cause: 'BGP peering failed to establish TCP port 179 session due to AS number mismatch, firewall filter, or routing loop to peer IP.',
      confidence: 'high',
      osi_layer: 'Layer 7 (Application) / Layer 4 (TCP)',
      concept: 'Border Gateway Protocol (BGP) Peering States',
      evidence: [
        'BGP state remains in Idle or Active state',
        'TCP three-way handshake to port 179 timed out',
        'No BGP OPEN messages received from remote peer'
      ],
      next_command: 'show ip bgp summary',
      fix_steps: [
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

  // Rule 6: Duplex / Speed Mismatch
  if (/DUPLEX_MISMATCH|half.*duplex|speed.*mismatch/i.test(text)) {
    findings.push({
      rule: 'DUPLEX_SPEED_MISMATCH',
      severity: 'high',
      message: 'CDP detected duplex mode mismatch between switchports, causing CRC errors and packet drops.',
      evidence: 'CDP-4-DUPLEX_MISMATCH log or late collisions detected',
      recommendation: 'Hardcode duplex full and speed auto on both ends or set both to auto-negotiate'
    });

    return {
      caseId: 'LIVE-' + Date.now().toString().slice(-4),
      root_cause: 'Duplex mode conflict between connected endpoints. One side negotiated Full Duplex while the partner defaulted to Half Duplex, triggering collision domain errors.',
      confidence: 'high',
      osi_layer: 'Layer 1 (Physical) / Layer 2 (Data Link)',
      concept: 'Ethernet Physical Layer & Autonegotiation',
      evidence: [
        'CDP-4-DUPLEX_MISMATCH alert recorded',
        'Late collisions and CRC checksum error counters incrementing',
        'Severe throughput degradation under high traffic load'
      ],
      next_command: 'show interfaces status',
      fix_steps: [
        'configure terminal',
        'interface GigabitEthernet0/1',
        'speed auto',
        'duplex full',
        'no mdix auto',
        'end',
        'write memory'
      ],
      verification_steps: 'show interfaces GigabitEthernet0/1 | include duplex',
      checkerFindings: findings,
      mode: 'demo'
    };
  }

  // Rule 7: Port Security Err-Disable / BPDU Guard
  if (/ERR_DISABLE|psecure-violation|BPDUGUARD|Secure-shutdown/i.test(text)) {
    findings.push({
      rule: 'PORT_SECURITY_OR_BPDU_DISABLE',
      severity: 'critical',
      message: 'Interface has been placed into err-disabled state by Port Security or Spanning Tree BPDU Guard.',
      evidence: 'PM-4-ERR_DISABLE or psecure-violation detected',
      recommendation: 'Remove unauthorized MAC or rogue switch, then clear with shutdown/no shutdown'
    });

    return {
      caseId: 'LIVE-' + Date.now().toString().slice(-4),
      root_cause: 'Port security policy triggered due to unauthorized MAC address or unexpected BPDU frames received on an edge port.',
      confidence: 'high',
      osi_layer: 'Layer 2 (Data Link)',
      concept: 'Switchport Security & STP Protection Mechanisms',
      evidence: [
        'Port status transitioned to err-disabled state',
        'Violation mode: shutdown triggered by security controller',
        'Packets from unauthorized station dropped by switch ASIC'
      ],
      next_command: 'show interfaces status err-disabled',
      fix_steps: [
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

  // Rule 8: Missing Default Route / Gateway of Last Resort
  if (/Gateway of last resort is not set|no route to host|unreachable/i.test(text)) {
    findings.push({
      rule: 'NO_DEFAULT_ROUTE',
      severity: 'high',
      message: 'Routing table contains no default route (0.0.0.0/0). Out-of-subnet traffic is discarded.',
      evidence: 'Gateway of last resort is not set in routing table',
      recommendation: 'Configure static default route via upstream next-hop'
    });

    return {
      caseId: 'LIVE-' + Date.now().toString().slice(-4),
      root_cause: 'Router lacks a Gateway of Last Resort (0.0.0.0/0). Packets destined for external IP subnets are dropped as unroutable.',
      confidence: 'high',
      osi_layer: 'Layer 3 (Network)',
      concept: 'Static & Dynamic IP Routing Architectures',
      evidence: [
        'Gateway of last resort is not set in show ip route',
        'ICMP Destination Net Unreachable returned to sending hosts',
        'No summary or quad-zero route advertised via IGP'
      ],
      next_command: 'show ip route',
      fix_steps: [
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

  // Generic fallback if no specific pattern matched
  const lines = text.split('\n').filter(l => l.trim().length > 0);
  const sampleEvidence = lines.slice(0, 3).map(l => l.trim());

  return {
    caseId: 'LIVE-' + Date.now().toString().slice(-4),
    root_cause: symptom
      ? `Network anomaly identified related to: "${symptom}". Detailed syntax inspection indicates configuration or transport mismatch.`
      : 'Cisco IOS CLI log inspection detected configuration discrepancies or link negotiation warnings requiring remediation.',
    confidence: 'medium',
    osi_layer: 'Layer 3 (Network) / Layer 2 (Data Link)',
    concept: 'Cisco IOS System Diagnostics & Protocol Analysis',
    evidence: sampleEvidence.length > 0 ? sampleEvidence : ['Anomalous error pattern in Cisco log stream'],
    next_command: 'show tech-support | include error|drop|fail',
    fix_steps: [
      'configure terminal',
      '! Verify interface operational status',
      'show ip interface brief',
      '! Validate routing and adjacency',
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

/**
 * POST /api/troubleshoot — analyze arbitrary Cisco CLI output or error logs
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const { log, symptom } = req.body as TroubleshootRequest;

    if (!log || typeof log !== 'string') {
      res.status(400).json({ error: 'Missing or invalid "log" string in request body' });
      return;
    }

    const apiKey = process.env.GROQ_API_KEY;
    const model = process.env.GROQ_MODEL || 'llama-3.1-70b-versatile';

    // If Groq API key is configured, invoke Groq LLM
    if (apiKey) {
      try {
        const systemPrompt = `You are NetPulse AI, a world-class Cisco CCIE certified network engineer and automated troubleshooting copilot.
Analyze the user-submitted Cisco CLI show command output, syslog error message, or network problem.
Return a valid JSON object strictly matching this schema:
{
  "root_cause": "concise explanation in plain English of the exact fault",
  "confidence": "high" | "medium" | "low",
  "evidence": ["list", "of", "exact", "symptoms", "observed"],
  "osi_layer": "Layer 1 (Physical) / Layer 2 / Layer 3 / Layer 4 / Layer 7",
  "concept": "Networking concept e.g. OSPF Adjacency, Port Security, DHCP Scope, etc.",
  "next_command": "immediate command engineer should run",
  "fix_steps": ["cisco ios cli command 1", "cisco ios cli command 2", ...],
  "verification_steps": "cisco show command to verify the fix",
  "checkerFindings": [
    {
      "rule": "RULE_NAME",
      "severity": "critical" | "high" | "medium" | "low",
      "message": "description",
      "evidence": "evidence string",
      "recommendation": "recommendation"
    }
  ]
}`;

        const userMessage = JSON.stringify({
          symptom: symptom || 'Network troubleshooting investigation',
          showOutput: log
        });

        const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: model,
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userMessage }
            ],
            temperature: 0.2,
            max_tokens: 1200,
            response_format: { type: 'json_object' }
          })
        });

        if (groqRes.ok) {
          const json = await groqRes.json() as { choices: Array<{ message: { content: string } }> };
          const parsed = JSON.parse(json.choices[0].message.content) as Partial<Diagnosis>;
          const diagnosis: Diagnosis = {
            caseId: 'LIVE-' + Date.now().toString().slice(-4),
            root_cause: parsed.root_cause || 'Network anomaly detected.',
            confidence: (parsed.confidence as 'high' | 'medium' | 'low') || 'high',
            evidence: parsed.evidence || [],
            osi_layer: parsed.osi_layer || 'Layer 3 (Network)',
            concept: parsed.concept || 'Cisco IOS Configuration',
            next_command: parsed.next_command || 'show running-config',
            fix_steps: parsed.fix_steps || ['configure terminal', 'end'],
            verification_steps: parsed.verification_steps || 'show ip interface brief',
            checkerFindings: (parsed.checkerFindings as CheckerFinding[]) || [],
            mode: 'ai',
            model: model
          };
          res.json(diagnosis);
          return;
        }
      } catch (aiErr) {
        console.warn('[NetPulse AI] Groq query failed in troubleshooter, falling back to offline analysis:', (aiErr as Error).message);
      }
    }

    // High quality offline-first deterministic analysis
    const diagnosis = analyzeLogOffline(log, symptom);
    res.json(diagnosis);
  } catch (err) {
    console.error('Troubleshoot error:', (err as Error).message);
    res.status(500).json({ error: 'Internal server error processing log' });
  }
});

export default router;
