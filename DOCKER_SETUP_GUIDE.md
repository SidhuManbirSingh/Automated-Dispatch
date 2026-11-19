# Docker Setup, Phase 2 Persistence & Ingress Guide

This project includes full multi-container Docker Compose support using `docker-compose.yml` and a multi-stage `Dockerfile` for **GUARDTECK DISPATCH CONSOLE**.

---

## 1. Quick Start with Docker Compose

```powershell
# 1. Prepare environment variables (if not already present)
Copy-Item .env.example .env

# 2. Build and start MySQL 8.0, Fastify App, and n8n in background
docker compose up -d --build

# 3. Verify running containers and health status
docker compose ps

# 4. View application logs (confirm MySQL connection & Phase 2 auto-seeding)
docker compose logs -f app
```

---

## 2. Docker Services & Phase 2 Persistence Overview

- **`mysql` (`guardteck_dispatch_mysql`)**: MySQL 8.0 server on port `3306` (`automated_dispatch` database, persistent volume `mysql_data`). Initialized via `prisma/init.sql` and auto-seeded on `app` startup via `src/lib/seed-db.ts` (or manually via `npm run prisma:seed` / `prisma/seed.ts`) with:
  - `6` color-coded Sites (`AAA`–`FFF`)
  - `121` Security Officers (`20+` active site-trained officers per site + `1` DNC opt-out fixture)
  - `50` Shifts spanning 7 days across standard 8-hour shift blocks (`0000-0800`, `0700-1500`, `0800-1600`, `1500-2300`, `1600-0000`)
- **`app` (`guardteck_dispatch_app`)**: Node.js 20 Fastify application + Prisma ORM running on `http://localhost:3000`.
- **`n8n` (`guardteck_dispatch_n8n`)**: Self-hosted n8n orchestrator on `http://localhost:5678`, with Phase 2 webhook workflow template mounted at `/home/node/.n8n/workflows` from `n8n/guardteck_dispatch_webhook_workflow.json`.

---

## 3. Importing the Phase 2 n8n Workflow & Verification Queries

1. Open n8n at `http://localhost:5678`.
2. Go to **Workflows -> Import from File** and import `n8n/guardteck_dispatch_webhook_workflow.json` (mounted read-only inside the container at `/home/node/.n8n/workflows/guardteck_dispatch_webhook_workflow.json`).
3. Create a MySQL credential in n8n pointing to host `mysql`, port `3306`, database `automated_dispatch`, user `dispatch_user`, password `dispatch_secure_pass`, and link it to the **Query MySQL Shift Record** node.
4. Activate the workflow to expose `POST http://localhost:5678/webhook/retell-call-events`, which classifies call outcomes and forwards events to `http://app:3000/webhook/retell-call-complete`.

### Verify Seeded MySQL Counts
```powershell
docker exec guardteck_dispatch_mysql mysql -udispatch_user -pdispatch_secure_pass automated_dispatch -e "SELECT (SELECT COUNT(*) FROM Site) AS sites, (SELECT COUNT(*) FROM Person) AS persons, (SELECT COUNT(*) FROM Shift) AS shifts, (SELECT COUNT(*) FROM PersonSiteTraining) AS trainings;"
```

---

## 4. Public Webhook Ingress (Phase 2 Tunneling)

To expose local port `3000` (Fastify webhook endpoint `/webhook/retell-call-complete`) or port `5678` (n8n) to Retell AI / external webhooks:

### Option A: Cloudflare Tunnel (Quick Tunnel)
```powershell
cloudflared tunnel --url http://localhost:3000
```

### Option B: ngrok
```powershell
ngrok http 3000
```

Verify ingress reachability once the tunnel starts by calling `<public-tunnel-url>/health/readiness`.

---

## 5. Standalone Local Development (Without Docker)

- Python fallback server: `py .\server.py` (`http://localhost:3000`)
- Node.js TypeScript dev server: `npm run dev` (`http://localhost:3000`)
- Manual Prisma seed against running MySQL: `npm run prisma:seed`
