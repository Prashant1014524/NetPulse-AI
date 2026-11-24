# NetPulse AI

**Autonomous Evidence-Based Network Diagnostics & Incident Intelligence**

---

## 🌐 Overview

**NetPulse AI** is a Cisco network troubleshooting app. It analyzes CLI output from bundled practice cases or logs you paste into the Live Troubleshooter. A diagnosis can include a likely cause, supporting evidence, suggested commands, and a verification step.

---

## ⚡ Core Capabilities

- **Case Diagnosis** — Runs Python rules and uses Groq when configured, with bundled demo diagnoses available without a key.
- **Optional Redis Caching** — Caches case rule findings and diagnoses when Redis is available.
- **Evidence-Based Cisco Analysis**: Correlates raw outputs from `show ip route`, `show vlan brief`, `show ip ospf neighbor`, `show interfaces`, `show access-lists`, and `show ip nat translations`.
- **Human-in-the-Loop (HITL) Oversight**: Engineer validation workflow supporting **Approve**, **Correct**, and **Reject** decisions before executing any changes.
- **Review History** — Records engineer decisions and correction notes. MongoDB can persist server-side records between restarts.
- **34 Practice Scenarios** — Browse by category, severity, and local review status. Bookmark a filtered list and reveal the expected fault after reading the evidence.
- **Live Troubleshooter** — Analyzes pasted logs with Groq when available or pattern-based matching on the server or in the browser.
- **Fix Approval Lab** — Demonstrates a full engineer-approved remediation workflow against three isolated simulated faults. Commands change simulator state only. The lab does not connect to a router.

---

## 🏗️ System Architecture

```
React + Vite → Express API
  Practice case → Python rule checker → Groq or bundled demo diagnosis
  Pasted log    → Groq or server-side log matching
  Case review   → MongoDB or in-memory history

  Redis can cache practice-case rule findings and diagnoses.
  The browser has bundled cases and local log matching if the API is unavailable.
```

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 18, TypeScript, Vite, Tailwind CSS, Recharts, Lucide React, Axios |
| **Backend API** | Node.js, Express.js (TypeScript), ts-node, Mongoose |
| **Caching Tier** | Optional Redis (`ioredis`) |
| **Diagnostic Engine** | Python 3 (`checker.py` deterministic analyzer) |
| **AI Inference** | Optional Groq API with a configurable model |
| **Database** | MongoDB with seamless in-memory fallback |

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- Python 3.8+
- Redis *(optional — system automatically runs in fallback mode if Redis is offline)*

### Installation

```bash
# 1. Clone repository
git clone https://github.com/Prashant1014524/netsage-ai.git
cd netsage-ai

# 2. Install dependencies (root, backend, and frontend)
npm install
npm run install-all
```

### Environment Configuration
For demo mode, skip environment configuration. To configure optional services, copy `.env.example` to `server/.env`. Keep the API port at `5001` to match the Vite proxy.

```env
PORT=5001
MONGODB_URI=mongodb://localhost:27017/netsage
REDIS_URL=redis://localhost:6379
GROQ_API_KEY=
```
With a Groq key configured, the server can send case evidence and pasted logs to Groq for analysis. Without MongoDB, server-side review history is kept in memory for the current process.

### Running the Application

```bash
# Start both backend and frontend concurrently
npm run dev

# Or start individually:
npm run dev:server    # Backend API on http://localhost:5001
npm run dev:client    # Vite frontend on http://localhost:3000
```

Open `http://localhost:3000/cases/NS-001`. Read the symptom and device evidence, then expand **Reveal expected fault** to check your answer. Select **Run AI Diagnosis** to get a diagnosis and record a review. For a log-based walkthrough, open **Live Troubleshooter** and try the **Interface Admin Down** preset.

To demonstrate a supervised change, open **Fix Approval Lab**, choose a fault, review the evidence and listed commands, then approve the simulated fix. The verification result and activity trail show the simulated outcome. This teaching workflow does not deploy device configurations.

### Building for Production

```bash
# Type-check and compile both backend and frontend
npm run build
```

---

## 🛡️ Responsible AI & Safety

The app displays command suggestions for human review. For library cases, the Python checker provides rule findings alongside the diagnosis. The evaluation page summarizes agreement with reviewed diagnoses. Confidence labels and agreement rates do not establish diagnostic accuracy.

---

## 📄 License
MIT License. Created by Prashant Uniyal.
