# NetSage AI

AI-Powered Evidence-Based Network Troubleshooting

## Overview

NetSage AI is an intelligent network troubleshooting platform designed to help engineers diagnose Cisco-style networking problems using symptoms, topology information, command evidence, deterministic diagnostics, AI-assisted reasoning, and human validation.

## Core Capabilities

- **AI-assisted network diagnosis**: Evidence-backed root cause, confidence scoring, and fix recommendation generation.
- **Evidence-based troubleshooting**: Cisco-style command output parsing and correlation.
- **Deterministic rule checking**: Pre-execution Python diagnostic engine checking 20+ deterministic networking constraints.
- **Cisco-style command evidence analysis**: Interface status, routing tables, VLAN brief, trunking, ACLs, NAT stats, and OSPF neighbors.
- **OSI layer identification**: Precise categorization across Layer 1 to Layer 7.
- **Root cause analysis**: Clear, actionable technical diagnosis.
- **Next-command recommendation**: Suggested diagnostic CLI verification steps.
- **Fix recommendations**: Step-by-step Cisco IOS remediation commands.
- **Human-in-the-loop validation**: Engineer control with Approve, Correct, and Reject actions.
- **Approved / Corrected / Rejected workflows**: Interactive human review lifecycle.
- **Responsible AI audit logging**: Immutable audit trail tracking human overrides and rationale for model safety & RLHF fine-tuning.
- **Troubleshooting case dataset**: 34 realistic enterprise and campus networking incident scenarios.
- **Evaluation analytics**: Comparative benchmarks for AI vs Human agreement, severity breakdowns, and category coverage.
- **Network issue categorization**: Interfaces, VLANs, Trunks, Routing, OSPF, BGP, DHCP, DNS, ACL, NAT/PAT, Wireless, Voice, and Security.
- **Severity analysis**: Critical, High, Medium, and Low risk prioritization.

## Architecture

```
React (Vite / Tailwind CSS)
    ↓
Node.js / Express API
    ↓
MongoDB (or In-Memory Fallback)
    ↓
Diagnostic Rule Engine (Python)
    ↓
AI Diagnosis Service (Groq API / LLaMA 3.1)
    ↓
Human Review (Approve / Correct / Reject)
    ↓
Responsible AI Audit Log
```

*For the current hackathon demo, local simulated data and mock services are integrated to ensure instant, deterministic performance across all 34 cases without external API latency.*

## Technology Stack

- **Frontend**: React 18, Vite, Tailwind CSS, React Router v6, Axios, Recharts, Lucide React
- **Backend**: Node.js, Express.js, MongoDB, Mongoose
- **AI Integration**: Groq API / LLM-based structured diagnosis
- **Diagnostic Engine**: Python deterministic rule checker (`checker.py`)
- **Development**: Git, GitHub, npm
- **Deployment**: Vercel / Render / Local Node.js

## Troubleshooting Workflow

1. **Select case**: Choose from 34 realistic network incidents.
2. **Examine symptom**: Review reported network failure.
3. **Examine topology**: Visualize path across PC, Switch, Router, Firewall, Server, and WLC.
4. **Inspect command evidence**: Analyze raw Cisco CLI outputs (`show ip route`, `show vlan brief`, etc.).
5. **Run deterministic checks**: Execute automated rule engine analysis for known faults.
6. **Generate AI diagnosis**: Run evidence-backed LLM inference for root cause and remediation.
7. **Review evidence**: Verify AI claims against CLI output.
8. **Human approves, corrects or rejects**: Expert engineer validates or overrides the diagnosis.
9. **Store responsible-AI audit record**: Log decision to the audit dataset.
10. **Evaluate system results**: Benchmark performance on the Evaluation Dashboard.

## Responsible AI

AI recommendations in NetSage AI are strictly advisory. Enterprise network changes require human validation before applying commands to production infrastructure. The Human-in-the-Loop review system maintains engineer authority while capturing valuable RLHF correction data.

## Future Development

- Production Node.js API deployment
- Distributed MongoDB cluster persistence
- Direct Groq API production key integration
- Microservice Python rule engine worker nodes
- Live Cisco Packet Tracer (`.pkt`) & SSH Netmiko/NAPALM integration
- Multi-tenant enterprise authentication & SSO
- Role-based access control (RBAC)
- Enterprise SIEM audit log integration
- Continuous historical RLHF fine-tuning pipeline
