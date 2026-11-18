# 04. Phased Implementation Roadmap & Engineering Plan

## 6-Phase Engineering Breakdown: Inception to Production Go-Live

---

### Executive Milestone Timeline

| Phase | Milestone | Focus Areas | Primary Deliverables | Status |
| :--- | :--- | :--- | :--- | :--- |
| **Phase 1** | **Architectural Blueprint & Scaffolding** | Specifications, MySQL schemas, project tooling, health probes | Reference specs, Prisma schema, Fastify foundation, config schemas | **In Progress** |
| **Phase 2** | **Local Sandbox & Persistence** | MySQL 8.0, Prisma migrations, mock data, public ingress | Containerized DB, seed data (25 persons, 50 shifts), n8n workflow | Planned |
| **Phase 3** | **Voice Agent & Telephony** | Retell AI, Twilio SIP (`us-west-2` BC Canada), guardrails | Prompt engineering, 5-line toll-free pool, AMD detection | Planned |
| **Phase 4** | **HITL & Microsoft 365** | Webhooks, Teams Adaptive Cards, Graph API | Dispatcher review queue, 1-click booking, Outlook calendar sync | Planned |
| **Phase 5** | **Concurrency & Scale** | 5-line pool, 1 CPS pacing, race cancellation | Semaphore pool, cost guard ($25/day cap), mid-burst cancellation | Planned |
| **Phase 6** | **Production Hardening** | Observability, load testing, dispatcher UAT | Structured logging, metrics, operator runbook, production cutover | Planned |

---

### Phase 1: Architectural Blueprint & Local Scaffolding

#### Objectives
Establish the complete foundational contracts, database schemas, telephony parameters, and developer workspace tooling for Guardteck Security.

#### Detailed Engineering Deliverables
1. **Architectural Specifications (`docs/`)**:
   - `01_system_architecture.md`: Data flow, 5-line toll-free concurrency, fallback matrix, cost model.
   - `02_telephony_voice_spec.md`: Guardteck Dispatch Bot prompts, behavioral guardrails, AMD script, dynamic variables, RAG KB schema.
   - `03_data_models_and_schemas.md`: Prisma ORM definitions, Retell webhook JSON, Teams Adaptive Card v1.5, MS Graph payloads.
   - `04_implementation_roadmap.md`: Phased engineering work breakdown structure.
2. **Repository Tooling Scaffolding**:
   - `package.json`: TypeScript, Fastify, Prisma, Zod, Graph SDK, Twilio, Retell SDKs.
   - `tsconfig.json`: Node.js ES2022, CommonJS module resolution, strict type-checking.
   - `.env.example`: Standardized environment variable template with clearly labeled placeholders.
   - `docker-compose.yml`: Multi-container development configuration (MySQL 8, n8n orchestrator).
   - `Dockerfile`: Multi-stage production container build for Fastify application.
3. **Database Schema & Migration Definition**:
   - `prisma/schema.prisma`: Native MySQL provider, relational models for Person, Shift, CallLog, ApprovalQueue, ShiftAssignment, LineLease, DailyCostSpend.
   - `prisma/init.sql`: Standalone native MySQL 8 DDL script.
4. **Configuration & Validation Schemas**:
   - `src/config/`: Strict environment variable parsing and validation via Zod schemas.
   - `src/schemas/`: Typed Zod schemas for Telephony, Webhook, Approval, Dispatch payloads.
   - `src/lib/`: Structured logger, Prisma client wrapper, fallback in-memory store.
5. **Application Core & Health Probes**:
   - `src/app.ts`: Fastify application factory with route registration, CORS, and centralized error handling.
   - `src/index.ts`: Application entry point with graceful shutdown on SIGINT and SIGTERM.
   - `src/routes/health.routes.ts`: Health and readiness endpoints (`/health`, `/health/readiness`, `/health/liveness`).
   - `server.py`: Lightweight standalone Python 3.12 / FastAPI server providing health probes, mock store, and dispatcher console.

#### Acceptance Criteria
- All 4 reference markdown specifications committed, consistent, and validated.
- Environment configuration complete with clearly documented placeholders for all third-party API credentials.
- Prisma schema valid for MySQL 8 with zero syntax errors.
- Fastify application and standalone Python fallback server start cleanly and return HTTP 200 on health probes.

---

### Phase 2: Local Sandbox & Persistence Setup

#### Objectives
Stand up a fully reproducible local testing sandbox with simulated seed data and public tunneling.

#### Detailed Engineering Steps
1. **Containerized Persistence Initialization**:
   - Start local MySQL 8 container with persistent named volume.
   - Initialize Prisma with MySQL provider and apply schema definitions.
   - Execute initial migration to establish database tables.
2. **Realistic Seed Data Generation (`prisma/seed.ts`)**:
   - Seed 25 mock persons across Vancouver, Surrey, Burnaby, Victoria, and Kelowna (BC, Canada) with valid phone formatting, security certifications, and reliability scores.
   - Seed 50 open security shifts spanning upcoming 7 calendar days with varying pay rates, site needs, and priority tiers.
3. **n8n Orchestration Environment**:
   - Spin up self-hosted n8n container bound to port 5678.
   - Configure MySQL credentials within n8n.
   - Build initial webhook listener node in n8n for mock call payloads.
4. **Tunneling & Ingress Setup**:
   - Configure ngrok or Cloudflare Tunnel to expose local Fastify server for public webhook receipt.

#### Acceptance Criteria
- Database query for Person records returns 25 verified candidate entries.
- n8n dashboard accessible with active database connection.
- Inbound tunnel request successfully reaches the application health endpoint.

---

### Phase 3: Voice Agent Configuration & Prompt Engineering

#### Objectives
Configure the Retell AI voice agent, connect the Twilio SIP trunk, and validate human-in-the-loop guardrails via live telephone tests.

#### Detailed Engineering Steps
1. **Twilio SIP Trunking Setup**:
   - Provision 5 Twilio toll-free numbers with E.164 compliance routed via NA-West (`us-west-2` Oregon edge for BC, Canada).
   - Bind numbers to Retell AI SIP trunking endpoint.
   - Enable Answering Machine Detection (AMD) with DetectMessageEnd.
2. **Retell AI Agent Provisioning**:
   - Create Guardteck Dispatch Bot Retell Agent via REST API with Deepgram Nova-2 (STT) and Cartesia Sonic (TTS).
   - Ingest production system prompt and behavioral guardrails defined in `02_telephony_voice_spec.md`.
   - Mount the Guardteck Security FAQ Knowledge Base corpus.
3. **Live Personal Phone Pilot Calls**:
   - Trigger manual test call to engineer's mobile device.
   - Test Case 3A (Happy Path): Person asks about detention pay, accepts tentatively; Agent logs preference without booking, states HITL closing script.
   - Test Case 3B (Decline Path): Person declines; Agent politely marks unavailable, ends call under 30 seconds.
   - Test Case 3C (Guardrail Stress Test): Person demands immediate confirmation; Agent strictly deflects: "I cannot finalize schedules. I have logged this for dispatch review."
   - Test Case 3D (AMD Test): Send call directly to voicemail; Agent detects AMD, leaves 15-second audio drop, hangs up.

#### Acceptance Criteria
- 100% of test calls strictly obey the non-finalization guardrail.
- Knowledge base correctly answers detention pay and equipment questions.
- Average call latency from speech end to agent response under 850 milliseconds.

---

### Phase 4: Microsoft Teams & Outlook Webhook Integration

#### Objectives
Connect the end-to-end event bridge: Retell webhook ingestion to Teams Adaptive Card posting to Dispatcher 1-click action to MS Graph Outlook calendar and email creation.

#### Detailed Engineering Steps
1. **Fastify Webhook Receiver Service**:
   - Build webhook handler with Zod schema validation and HMAC signature verification.
   - Extract call analysis outcome code.
   - Update CallLog and create ApprovalQueue row in MySQL.
2. **Microsoft Teams Adaptive Card Pipeline**:
   - Implement card templating utility that renders Adaptive Card v1.5 JSON.
   - Post interactive card to dispatch Teams channel when outcome code is TENTATIVE_ACCEPT.
3. **Dispatcher Action Endpoint**:
   - Implement approval action endpoint handling Teams Action.Execute.
   - On Approve: Lock shift row, update status to ASSIGNED, create Outlook calendar event, and send confirmation email.
   - On Decline: Update approval status to DECLINED, return shift to OPEN pool, and update Teams card state.

#### Acceptance Criteria
- Approving via Teams creates calendar event in Outlook within 3 seconds.
- Duplicate clicks on card return idempotent notification.

---

### Phase 5: Concurrency Scaling & Surge Load Testing

#### Objectives
Implement the 5-line concurrent toll-free execution pool, leaky-bucket CPS rate limiter, and mid-burst race condition cancellation.

#### Detailed Engineering Steps
1. **5-Line Semaphore & Lease Management**:
   - Implement LinePoolManager with atomic MySQL lease acquisition across 5 toll-free trunks.
   - Enforce maximum 5 simultaneous in-progress or ringing calls.
   - Build automated TTL reaper releasing abandoned leases after 6 minutes.
2. **Leaky-Bucket Rate Limiter**:
   - Enforce 1,200ms inter-call dispatch pacing to guarantee carrier compliance with Twilio 1 CPS.
3. **Mid-Burst Slot Cancellation Engine**:
   - Simulate rush dispatch scenario: multiple people called simultaneously for 1 urgent shift.
   - When Person A tentatively accepts, system immediately cancels remaining ringing lines for other candidates.
4. **Cost Circuit Breaker**:
   - Implement real-time daily cost accumulator.
   - If cumulative daily API spend reaches 22.50 USD (90% of 25.00 USD ceiling), halt automated outbound dialing and send high-priority alert.

#### Acceptance Criteria
- Burst test of 20 queued calls processes strictly 5 at a time without exceeding 1.0 CPS.
- Mid-burst acceptance immediately revokes remaining ringing calls under 1,500 milliseconds.
- Zero Twilio rate-limit errors during stress testing.

---

### Phase 6: Production Hardening, Logging & Dispatcher UAT

#### Objectives
Deploy to production environment, instrument complete observability, and execute User Acceptance Testing with live dispatchers.

#### Detailed Engineering Steps
1. **Observability & Health Checks**:
   - Implement structured JSON logging using pino.
   - Expose liveness and readiness health endpoints.
   - Instrument system metrics: active calls, call duration, pending approvals, daily spend.
2. **Dispatcher User Acceptance Testing**:
   - Run 3-day supervised pilot during morning dispatch shift.
   - Dispatchers review and process shifts using Teams Adaptive Cards.
   - Gather feedback on transcript readability, call summary accuracy, and button responsiveness.
3. **Runbook & Operations Documentation**:
   - Finalize operator runbook detailing troubleshooting, manual overrides, and DNC audit processes.

#### Acceptance Criteria
- 100% of shifts filled during UAT executed via HITL approval flow without manual phone tag.
- Zero unauthorized bookings generated by the voice agent.
- Dispatcher approval latency average under 90 seconds from call completion.
