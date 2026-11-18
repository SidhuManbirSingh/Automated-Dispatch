# Guardteck Dispatch Console | Guardteck Security Automated Scheduling & Human-in-the-Loop Agent

Autonomous outbound conversational agent (**Guardteck Dispatch Bot**) checking open shift availability across a 5-line Toll-Free PSTN pool for **Guardteck Security** (BC, Canada) with strictly enforced human dispatcher confirmation.

---

## Architecture Overview

1. **Telephony & Conversational AI**:
   - Retell AI Voice Engine (**Guardteck Dispatch Bot**)
   - Twilio Elastic SIP Trunking via NA-West (`us-west-2` Oregon / Umatilla edge optimized for BC, Canada)
   - 5-Line Toll-Free PSTN Pool (`+18885550101` through `+18885550105`)
   - Answering Machine Detection (AMD) audio drops
   - Leaky-bucket carrier pacing (1 CPS / 1,200ms delay)

2. **Human-in-the-Loop (HITL) Dispatch Review**:
   - Zero-commit AI conversational boundary
   - Interactive Microsoft Teams Adaptive Card v1.5 with one-click Approve / Decline
   - Microsoft Graph API (automatic Outlook calendar `.ics` generation & confirmation emails from `@guardteck.com`)

3. **Data Layer**:
   - MySQL 8.0+ via Prisma ORM
   - Resilient in-memory simulation store fallback for offline development

4. **UI Console**:
   - "Software" Design System: Host Grotesk & Instrument Sans typography (1.2X scale), electric-blue action accents, white panels, and dark telephony passages. Zero emojis.

---

## Quick Start

### 1. Launch with Python (Zero Setup)
```powershell
py .\server.py
```
Open **`http://localhost:3000`** in your browser.

### 2. Launch with Node.js & Fastify
```powershell
npm install
npm run dev
```

### 3. Launch with Docker Compose
```powershell
docker compose up -d
```
