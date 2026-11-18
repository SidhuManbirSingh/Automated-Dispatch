# Docker Setup & Installation Guide

This project includes complete multi-container Docker support using `docker-compose.yml` and a production multi-stage `Dockerfile`.

---

## 1. Quick Start with Docker

When Docker is installed on your host system:

```powershell
# 1. Copy environment template
Copy-Item .env.example .env

# 2. Build and start containers in background
docker compose up -d

# 3. View running services
docker compose ps

# 4. View logs
docker compose logs -f app
```

---

## 2. Docker Services Overview

- **`mysql`**: MySQL 8.0 community server on port `3306` with persistent volume `mysql_data`.
- **`app`**: Node.js 20+ Fastify application running on port `3000`.
- **`n8n`**: Self-hosted workflow automation orchestrator on port `5678`.

---

## 3. Installing Docker on Windows

If Docker is not currently installed on your computer:

### Option A: Install Docker Desktop via Windows Package Manager (Winget)
```powershell
winget install Docker.DockerDesktop
```

### Option B: Standalone Docker CLI Only
```powershell
winget install Docker.DockerCLI
```

### Option C: Local Non-Docker Development
If you prefer to run locally without Docker:
- Run with Python: `py .\server.py`
- Run with Node.js: `npm run dev`
