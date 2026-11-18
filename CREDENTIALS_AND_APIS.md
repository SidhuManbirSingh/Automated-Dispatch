# Required Credentials and API Documentation

This document catalogues every external service, credential, and environment variable required for the Guardteck Security Automated Dispatch & Scheduling Agent.

---

## 1. Credentials Summary

| Service | Environment Variable | Format / Example | Description |
| :--- | :--- | :--- | :--- |
| **MySQL 8** | `DATABASE_URL` | `mysql://user:pass@host:3306/db` | Relational database connection string |
| **Retell AI** | `RETELL_API_KEY` | `YOUR_RETELL_API_KEY_HERE` | Outbound AI conversational telephony engine API key |
| **Retell AI** | `RETELL_AGENT_ID` | `YOUR_RETELL_AGENT_ID_HERE` | Provisioned Guardteck Dispatch Bot identifier |
| **Retell AI** | `RETELL_WEBHOOK_SECRET` | `YOUR_RETELL_WEBHOOK_SECRET_HERE` | HMAC-SHA256 signature secret for inbound call-complete webhooks |
| **Twilio** | `TWILIO_ACCOUNT_SID` | `YOUR_TWILIO_ACCOUNT_SID_HERE` | Twilio master account SID |
| **Twilio** | `TWILIO_AUTH_TOKEN` | `YOUR_TWILIO_AUTH_TOKEN_HERE` | Twilio authorization token |
| **Twilio** | `TWILIO_SIP_REGION` | `us-west-2` | Twilio NA-West SIP edge optimized for BC, Canada (`umatilla`) |
| **Twilio** | `TWILIO_PHONE_POOL` | `+18885550101,...,+18885550105` | Comma-delimited list of 5 E.164 Toll-Free PSTN numbers |
| **Microsoft Teams** | `TEAMS_APPROVAL_WEBHOOK_URL` | `https://outlook.office.com/webhook/YOUR_...` | Incoming webhook connector or Bot Framework endpoint |
| **Microsoft Teams** | `TEAMS_BOT_APP_ID` | `YOUR_TEAMS_BOT_APP_ID_HERE` | Bot Framework Application ID |
| **Microsoft Teams** | `TEAMS_BOT_APP_PASSWORD` | `YOUR_TEAMS_BOT_APP_PASSWORD_HERE` | Bot Framework Application Password |
| **Microsoft Entra ID** | `AZURE_TENANT_ID` | `YOUR_AZURE_TENANT_ID_HERE` | Microsoft 365 / Azure Active Directory Tenant ID |
| **Microsoft Entra ID** | `AZURE_CLIENT_ID` | `YOUR_AZURE_CLIENT_ID_HERE` | Registered App Registration Client / Application ID |
| **Microsoft Entra ID** | `AZURE_CLIENT_SECRET` | `YOUR_AZURE_CLIENT_SECRET_HERE` | App Registration Client Secret Value |

---

## 2. Safety and Guardrail Parameters

| Parameter | Environment Variable | Default Value | Purpose |
| :--- | :--- | :--- | :--- |
| **Daily Cost Ceiling** | `DAILY_COST_CEILING_USD` | `25.00` | Automated emergency stop if daily telephony spend exceeds this limit |
| **Line Concurrency** | `MAX_CONCURRENT_CALLS` | `5` | Strict semaphore ceiling on simultaneous toll-free PSTN channels |
| **Carrier Pacing** | `CALL_PACING_MS` | `1200` | Inter-call delay enforcing carrier rate limit of 1 CPS |
| **Max Call Duration** | `MAX_CALL_DURATION_MINUTES` | `6` | Automatic lease expiry and hang-up safeguard |
| **Retry Cooldown** | `MIN_RETRY_DELAY_MINUTES` | `45` | Minimum delay before re-attempting a candidate |
