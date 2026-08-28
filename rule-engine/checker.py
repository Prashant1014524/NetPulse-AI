#!/usr/bin/env python3
"""
NetSage AI — Deterministic Rule Checker
Reads a case JSON from stdin, outputs findings as JSON to stdout.
No external dependencies required.
"""

import sys
import json
import re

def check_rules(case_data):
    """Run deterministic networking rules against the case evidence."""
    findings = []
    show_output = case_data.get("showOutput", "")
    symptom = case_data.get("symptom", "").lower()
    category = case_data.get("category", "")

    # Rule 1: Interface administratively down
    if re.search(r"administratively\s+down", show_output, re.IGNORECASE):
        findings.append({
            "rule": "INTERFACE_ADMIN_DOWN",
            "severity": "critical",
            "message": "Interface is administratively shut down (shutdown command present)",
            "evidence": "administratively down detected in show output",
            "recommendation": "Use 'no shutdown' to enable the interface"
        })

    # Rule 2: Shutdown command in config
    if re.search(r"^\s*shutdown\s*$", show_output, re.MULTILINE):
        findings.append({
            "rule": "SHUTDOWN_CONFIGURED",
            "severity": "high",
            "message": "Explicit 'shutdown' command found in interface configuration",
            "evidence": "shutdown command in running-config",
            "recommendation": "Remove shutdown with 'no shutdown'"
        })

    # Rule 3: Line protocol down
    if re.search(r"line protocol is down", show_output, re.IGNORECASE):
        findings.append({
            "rule": "LINE_PROTOCOL_DOWN",
            "severity": "high",
            "message": "Line protocol is down — possible physical or L2 issue",
            "evidence": "line protocol is down in show output",
            "recommendation": "Check cable, SFP, and duplex/speed settings"
        })

    # Rule 4: Wrong default gateway
    if re.search(r"gateway.*wrong|incorrect.*gateway", symptom) or \
       re.search(r"Gateway:\s*\d+\.\d+\.\d+\.\d+", show_output):
        gw_match = re.findall(r"Gateway:\s*(\d+\.\d+\.\d+\.\d+)", show_output)
        if gw_match:
            findings.append({
                "rule": "GATEWAY_CHECK",
                "severity": "medium",
                "message": f"Default gateway found: {', '.join(gw_match)} — verify correctness",
                "evidence": f"Gateway values: {', '.join(gw_match)}",
                "recommendation": "Verify gateway matches the router subinterface IP for the VLAN"
            })

    # Rule 5: VLAN 1 (default) assignment
    if re.search(r"Access Mode VLAN:\s*1\s*\(default\)", show_output):
        findings.append({
            "rule": "DEFAULT_VLAN_ASSIGNMENT",
            "severity": "high",
            "message": "Port is in VLAN 1 (default) — may need to be assigned to correct VLAN",
            "evidence": "Access Mode VLAN: 1 (default)",
            "recommendation": "Assign port to correct VLAN with 'switchport access vlan <id>'"
        })

    # Rule 6: Trunk VLAN restriction
    trunk_vlans = re.search(r"Vlans allowed on trunk\s*\n\S+\s+([\d,]+)", show_output)
    if trunk_vlans:
        allowed = trunk_vlans.group(1)
        findings.append({
            "rule": "TRUNK_VLAN_FILTER",
            "severity": "medium",
            "message": f"Trunk allows only VLANs: {allowed} — verify all required VLANs are included",
            "evidence": f"Vlans allowed on trunk: {allowed}",
            "recommendation": "Add missing VLANs with 'switchport trunk allowed vlan add <id>'"
        })

    # Rule 7: ACL deny rules
    deny_matches = re.findall(r"\d+\s+deny\s+\S+\s+.*", show_output)
    for deny in deny_matches:
        findings.append({
            "rule": "ACL_DENY_DETECTED",
            "severity": "medium",
            "message": f"ACL deny rule found: {deny.strip()}",
            "evidence": deny.strip(),
            "recommendation": "Verify this deny rule is intentional and not blocking required traffic"
        })

    # Rule 8: DHCP pool exhaustion
    if re.search(r"Leased addresses:\s*254", show_output):
        findings.append({
            "rule": "DHCP_POOL_EXHAUSTED",
            "severity": "critical",
            "message": "DHCP pool fully exhausted (254/254 leased)",
            "evidence": "Leased addresses: 254",
            "recommendation": "Clear stale bindings or expand the DHCP pool"
        })

    # Rule 9: APIPA/link-local addressing
    if re.search(r"169\.254\.\d+\.\d+", show_output):
        findings.append({
            "rule": "APIPA_DETECTED",
            "severity": "high",
            "message": "APIPA address (169.254.x.x) detected — DHCP failure",
            "evidence": "169.254.x.x address in output",
            "recommendation": "Verify DHCP server is running and reachable"
        })

    # Rule 10: Native VLAN mismatch
    if re.search(r"NATIVE_VLAN_MISMATCH", show_output):
        findings.append({
            "rule": "NATIVE_VLAN_MISMATCH",
            "severity": "high",
            "message": "CDP detected native VLAN mismatch between trunk endpoints",
            "evidence": "CDP-4-NATIVE_VLAN_MISMATCH log entry",
            "recommendation": "Configure matching native VLANs on both trunk endpoints"
        })

    # Rule 11: NAT translations empty
    if re.search(r"show ip nat translations", show_output) and \
       re.search(r"\(empty\)", show_output):
        findings.append({
            "rule": "NAT_NO_TRANSLATIONS",
            "severity": "high",
            "message": "NAT translation table is empty — NAT may not be matching traffic",
            "evidence": "show ip nat translations — (empty)",
            "recommendation": "Verify NAT ACL matches the source network"
        })

    # Rule 12: OSPF no neighbors
    if re.search(r"show ip ospf neighbor", show_output) and \
       re.search(r"show ip ospf neighbor\s*\n\s*\n", show_output):
        findings.append({
            "rule": "OSPF_NO_NEIGHBORS",
            "severity": "critical",
            "message": "OSPF has no neighbors — adjacency not forming",
            "evidence": "show ip ospf neighbor returned empty",
            "recommendation": "Check area IDs, network statements, and interface connectivity"
        })

    # Rule 13: OSPF area mismatch
    area_matches = re.findall(r"Area\s+(\d+)", show_output)
    if len(area_matches) >= 2:
        unique_areas = set(area_matches)
        if len(unique_areas) > 1:
            findings.append({
                "rule": "OSPF_AREA_MISMATCH",
                "severity": "critical",
                "message": f"Multiple OSPF areas detected: {', '.join(unique_areas)} — possible mismatch",
                "evidence": f"Areas found: {', '.join(area_matches)}",
                "recommendation": "Ensure both routers are in the same OSPF area on the shared link"
            })

    # Rule 14: Port security violation
    if re.search(r"Secure-shutdown|PSECURE_VIOLATION", show_output):
        findings.append({
            "rule": "PORT_SECURITY_VIOLATION",
            "severity": "high",
            "message": "Port security violation detected — port is in error-disabled state",
            "evidence": "Secure-shutdown / PSECURE_VIOLATION in output",
            "recommendation": "Investigate MAC addresses, then shutdown/no shutdown to recover"
        })

    # Rule 15: BGP Idle state
    if re.search(r"State.*Idle|never\s+Idle", show_output):
        findings.append({
            "rule": "BGP_IDLE",
            "severity": "high",
            "message": "BGP neighbor in Idle state — session not established",
            "evidence": "BGP state: Idle",
            "recommendation": "Check BGP configuration, authentication, and reachability"
        })

    # Rule 16: Duplicate MAC/IP
    arp_entries = re.findall(r"(\d+\.\d+\.\d+\.\d+)\s+\d+\s+(\S+)\s+ARPA", show_output)
    ip_to_macs = {}
    for ip, mac in arp_entries:
        if ip not in ip_to_macs:
            ip_to_macs[ip] = []
        ip_to_macs[ip].append(mac)
    for ip, macs in ip_to_macs.items():
        if len(macs) > 1:
            findings.append({
                "rule": "DUPLICATE_IP",
                "severity": "critical",
                "message": f"Duplicate IP {ip} with MACs: {', '.join(macs)}",
                "evidence": f"Multiple ARP entries for {ip}",
                "recommendation": "Resolve IP conflict — check for static IP assignments"
            })

    # Rule 17: Voice VLAN not configured
    if re.search(r"Voice VLAN:\s*none", show_output):
        findings.append({
            "rule": "VOICE_VLAN_MISSING",
            "severity": "medium",
            "message": "Voice VLAN is not configured on the port",
            "evidence": "Voice VLAN: none",
            "recommendation": "Configure voice VLAN with 'switchport voice vlan <id>'"
        })

    # Rule 18: RADIUS timeout
    if re.search(r"Status:\s*Timeout", show_output):
        findings.append({
            "rule": "RADIUS_TIMEOUT",
            "severity": "critical",
            "message": "RADIUS server is timing out — authentication will fail",
            "evidence": "RADIUS Status: Timeout",
            "recommendation": "Verify RADIUS server IP address and shared secret"
        })

    # Rule 19: Interface flapping
    updown_count = len(re.findall(r"UPDOWN.*changed state", show_output))
    if updown_count >= 2:
        findings.append({
            "rule": "INTERFACE_FLAPPING",
            "severity": "high",
            "message": f"Interface flapping detected ({updown_count} state changes)",
            "evidence": f"{updown_count} UPDOWN log entries",
            "recommendation": "Check physical layer: cable, SFP, duplex/speed"
        })

    # Rule 20: No trunking ports
    if re.search(r"no ports in trunking mode", show_output, re.IGNORECASE):
        findings.append({
            "rule": "NO_TRUNK_PORTS",
            "severity": "critical",
            "message": "No trunk ports configured — inter-VLAN traffic will be blocked",
            "evidence": "show interfaces trunk: no ports in trunking mode",
            "recommendation": "Configure uplink as trunk with 'switchport mode trunk'"
        })

    # If no findings, add a generic note
    if not findings:
        findings.append({
            "rule": "NO_DETERMINISTIC_MATCH",
            "severity": "info",
            "message": "No deterministic rule matched — AI analysis will provide diagnosis",
            "evidence": "No matching rule patterns in show output",
            "recommendation": "Review AI diagnosis for non-rule-based analysis"
        })

    return findings


if __name__ == "__main__":
    try:
        input_data = sys.stdin.read()
        case_data = json.loads(input_data)
        findings = check_rules(case_data)
        print(json.dumps(findings))
    except Exception as e:
        print(json.dumps([{
            "rule": "CHECKER_ERROR",
            "severity": "info",
            "message": f"Rule checker error: {str(e)}",
            "evidence": "Error during rule checking",
            "recommendation": "Check input format"
        }]))
