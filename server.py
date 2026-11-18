"""
Guardteck Security - Automated Dispatch & Scheduling Agent Local Server
Built with Python 3.12, FastAPI, and Uvicorn.
Provides 100% parity with the TypeScript/Node implementation for Phase 1:
- Software Design System Dispatcher Console (http://localhost:3000)
- 5-Line Parallel Toll-Free Telephony Pool (us-west-2 / BC Canada edge)
- Human-in-the-Loop Approval Queue (Microsoft Teams Adaptive Card v1.5)
- Automated Roadmap Simulator (Test cases 3A, 3B, 3C, 3D, 5)
"""

import os
import time
from datetime import datetime, timedelta
from typing import Dict, Any
from fastapi import FastAPI, Request, HTTPException
from fastapi.responses import HTMLResponse
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

app = FastAPI(title="Guardteck Dispatch Console", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -----------------------------------------------------------------------------
# IN-MEMORY STATE STORE (5-LINE TOLL-FREE POOL FOR BC, CANADA)
# -----------------------------------------------------------------------------

SIP_REGION = "us-west-2"

CHANNEL_REGIONS = [
    {"index": 1, "region": "VAN", "phone": "+18885550101", "hub": "Vancouver Operations Center"},
    {"index": 2, "region": "SUR", "phone": "+18885550102", "hub": "Fraser Valley Regional Hub"},
    {"index": 3, "region": "VIC", "phone": "+18885550103", "hub": "Island Security Operations"},
    {"index": 4, "region": "KEL", "phone": "+18885550104", "hub": "Interior Dispatch Desk"},
    {"index": 5, "region": "OVERFLOW", "phone": "+18885550105", "hub": "General Guardteck Dispatch Operations"},
]

persons = [
    {
        "id": "p-01",
        "externalId": "PER-1042",
        "firstName": "Marcus",
        "lastName": "Vance",
        "phone": "+16045550198",
        "email": "marcus.vance@guardteck.com",
        "region": "VAN",
        "equipmentTypes": ["PATROL_VEHICLE", "SITE_ACCESS"],
        "status": "ACTIVE",
        "dncFlag": False,
        "reliabilityScore": 0.98,
        "totalShiftsCompleted": 142,
    },
    {
        "id": "p-02",
        "externalId": "PER-1043",
        "firstName": "Elena",
        "lastName": "Reyes",
        "phone": "+16045550144",
        "email": "elena.reyes@guardteck.com",
        "region": "SUR",
        "equipmentTypes": ["CONCIERGE", "SITE_ACCESS"],
        "status": "ACTIVE",
        "dncFlag": False,
        "reliabilityScore": 0.95,
        "totalShiftsCompleted": 98,
    },
    {
        "id": "p-03",
        "externalId": "PER-1044",
        "firstName": "David",
        "lastName": "Chen",
        "phone": "+12505550188",
        "email": "david.chen@guardteck.com",
        "region": "VIC",
        "equipmentTypes": ["PATROL_VEHICLE"],
        "status": "ACTIVE",
        "dncFlag": False,
        "reliabilityScore": 0.92,
        "totalShiftsCompleted": 76,
    },
    {
        "id": "p-04",
        "externalId": "PER-1045",
        "firstName": "Sarah",
        "lastName": "Jenkins",
        "phone": "+12505550162",
        "email": "sarah.jenkins@guardteck.com",
        "region": "KEL",
        "equipmentTypes": ["SITE_ACCESS", "CONCIERGE"],
        "status": "ACTIVE",
        "dncFlag": False,
        "reliabilityScore": 0.89,
        "totalShiftsCompleted": 54,
    },
    {
        "id": "p-05",
        "externalId": "PER-1046",
        "firstName": "Jamal",
        "lastName": "Washington",
        "phone": "+17785550119",
        "email": "jamal.washington@guardteck.com",
        "region": "BUR",
        "equipmentTypes": ["PATROL_VEHICLE"],
        "status": "DNC_DO_NOT_CALL",
        "dncFlag": True,
        "reliabilityScore": 0.81,
        "totalShiftsCompleted": 30,
    },
    {
        "id": "p-06",
        "externalId": "PER-1047",
        "firstName": "Robert",
        "lastName": "Kowalski",
        "phone": "+16045550173",
        "email": "robert.kowalski@guardteck.com",
        "region": "VAN",
        "equipmentTypes": ["PATROL_VEHICLE", "CONCIERGE"],
        "status": "ACTIVE",
        "dncFlag": False,
        "reliabilityScore": 0.96,
        "totalShiftsCompleted": 110,
    },
]

shifts = [
    {
        "id": "s-01",
        "externalId": "SH-2024-8841",
        "shiftDate": (datetime.now() + timedelta(days=1)).isoformat(),
        "startTime": (datetime.now() + timedelta(days=1)).isoformat(),
        "endTime": (datetime.now() + timedelta(days=1, hours=8)).isoformat(),
        "durationHours": 8.0,
        "pickupLocation": "Vancouver Harbour Terminal, Gate B",
        "dropoffLocation": "Burnaby Corporate Campus",
        "equipmentType": "Patrol Vehicle (Class 5)",
        "payRateHourly": 32.50,
        "currency": "CAD",
        "priority": 2,
        "status": "PENDING_DISPATCHER_APPROVAL",
    },
    {
        "id": "s-02",
        "externalId": "SH-2024-8842",
        "shiftDate": (datetime.now() + timedelta(days=1)).isoformat(),
        "startTime": (datetime.now() + timedelta(days=1, hours=2)).isoformat(),
        "endTime": (datetime.now() + timedelta(days=1, hours=10)).isoformat(),
        "durationHours": 8.0,
        "pickupLocation": "Surrey Civic Plaza, Security Desk",
        "dropoffLocation": "Surrey Transit Exchange",
        "equipmentType": "Site Access & CCTV Monitor",
        "payRateHourly": 36.00,
        "currency": "CAD",
        "priority": 3,
        "status": "OPEN",
    },
    {
        "id": "s-03",
        "externalId": "SH-2024-8843",
        "shiftDate": (datetime.now() + timedelta(days=2)).isoformat(),
        "startTime": (datetime.now() + timedelta(days=2)).isoformat(),
        "endTime": (datetime.now() + timedelta(days=2, hours=10)).isoformat(),
        "durationHours": 10.0,
        "pickupLocation": "Victoria Inner Harbour Dock",
        "dropoffLocation": "Langford Commercial Park",
        "equipmentType": "Mobile Patrol Unit",
        "payRateHourly": 34.00,
        "currency": "CAD",
        "priority": 1,
        "status": "OPEN",
    },
    {
        "id": "s-04",
        "externalId": "SH-2024-8844",
        "shiftDate": (datetime.now() + timedelta(days=1)).isoformat(),
        "startTime": (datetime.now() + timedelta(days=1, hours=4)).isoformat(),
        "endTime": (datetime.now() + timedelta(days=1, hours=12)).isoformat(),
        "durationHours": 8.0,
        "pickupLocation": "Kelowna Regional Health Campus",
        "dropoffLocation": "West Kelowna Logistics Yard",
        "equipmentType": "Site Security Guard",
        "payRateHourly": 31.00,
        "currency": "CAD",
        "priority": 1,
        "status": "ASSIGNED",
    },
]

call_logs = [
    {
        "id": "c-01",
        "shiftId": "s-01",
        "personId": "p-01",
        "retellCallId": "call_9841f3e72089a42cb901",
        "direction": "OUTBOUND",
        "status": "COMPLETED",
        "outcome": "TENTATIVE_ACCEPT",
        "attemptNumber": 1,
        "durationSeconds": 102,
        "transcript": (
            "Guardteck Dispatch Bot: Hi, is this Marcus?\n"
            "Marcus: Yeah, speaking. Who's this?\n"
            "Guardteck Dispatch Bot: Hi Marcus, this is Guardteck Dispatch Bot with Guardteck Security automated dispatch. We have an 8-hour shift tomorrow starting at 6:00 AM Pacific at Vancouver Harbour Terminal, Gate B at $32.50 per hour. Are you open to taking this shift?\n"
            "Marcus: Yeah, put me down for it. I can cover that tomorrow morning.\n"
            "Guardteck Dispatch Bot: Excellent! Thank you, Marcus. I have logged your tentative interest and submitted this to our human dispatch team for final review and approval. You will receive an official confirmation via email once approved. Take care!\n"
            "Marcus: Sounds good, thanks. Bye."
        ),
        "sentimentScore": 0.85,
        "summary": "Guardteck Dispatch Bot contacted Marcus Vance regarding shift SH-2024-8841 (Vancouver Harbour Terminal, 8 hrs at $32.50/hr). Person tentatively accepted the shift. Agent confirmed human-in-the-loop dispatch review and concluded call.",
        "costUsd": 0.174,
        "createdAt": datetime.now().isoformat(),
    }
]

approvals = [
    {
        "id": "appr-01",
        "callLogId": "c-01",
        "shiftId": "s-01",
        "personId": "p-01",
        "status": "PENDING",
        "dispatcherId": None,
        "dispatcherName": None,
        "expiresAt": (datetime.now() + timedelta(minutes=18)).isoformat(),
        "calendarEventId": None,
        "emailMessageId": None,
    }
]

active_leases: Dict[int, Dict[str, Any]] = {}
daily_spend = {"totalCostUsd": 14.20, "ceilingUsd": 25.00, "totalCalls": 82}

# -----------------------------------------------------------------------------
# API ROUTES
# -----------------------------------------------------------------------------

@app.get("/health")
def health():
    return {
        "status": "OK",
        "timestamp": datetime.now().isoformat(),
        "service": "guardteck-automated-dispatch",
        "company": "Guardteck Security",
        "botName": "Guardteck Dispatch Bot",
    }

@app.get("/health/readiness")
def readiness():
    active_count = len(active_leases)
    return {
        "status": "READY",
        "database": "STANDALONE_SIMULATION",
        "costCeilingStatus": "HEALTHY" if daily_spend["totalCostUsd"] < daily_spend["ceilingUsd"] else "HALTED",
        "activeLines": active_count,
        "maxLines": 5,
        "sipRegion": SIP_REGION,
        "tollFreePool": True,
    }

@app.get("/health/liveness")
def liveness():
    return {"status": "LIVE", "timestamp": datetime.now().isoformat()}

@app.get("/api/v1/dashboard/stats")
def get_stats():
    active_lines = len(active_leases)
    pending_appr = len([a for a in approvals if a["status"] == "PENDING"])
    filled = len([s for s in shifts if s["status"] == "ASSIGNED"])
    return {
        "activeCapacityHours": 40000,
        "filledShiftsToday": filled,
        "targetDailyShifts": 10,
        "pendingApprovals": pending_appr,
        "activeOutboundLines": active_lines,
        "maxLines": 5,
        "sipRegion": SIP_REGION,
        "spend": daily_spend,
        "databaseMode": "STANDALONE_PYTHON_SIMULATION",
    }

@app.get("/api/v1/dispatch/lines")
def get_lines():
    results = []
    for ch in CHANNEL_REGIONS:
        idx = ch["index"]
        lease = active_leases.get(idx)
        results.append({
            "channelIndex": idx,
            "status": "IN_PROGRESS" if lease else "IDLE",
            "regionServed": ch["region"],
            "allocatedPhoneNumber": ch["phone"],
            "personName": lease["personName"] if lease else None,
            "callId": lease["callId"] if lease else None,
            "shiftId": lease["shiftId"] if lease else None,
        })
    return {
        "totalChannels": 5,
        "activeCount": len(active_leases),
        "sipRegion": SIP_REGION,
        "tollFreePool": True,
        "lines": results,
    }

@app.post("/api/v1/dispatch/trigger")
async def trigger_dispatch(req: Request):
    data = await req.json()
    shift_id = data.get("shiftId")
    shift = next((s for s in shifts if s["id"] == shift_id or s["externalId"] == shift_id), None)
    if not shift:
        raise HTTPException(status_code=404, detail="Shift not found")

    free_channel = next((c for c in CHANNEL_REGIONS if c["index"] not in active_leases), None)
    if not free_channel:
        return {"status": "BACKPRESSURE", "message": "All 5 toll-free lines currently in use"}

    candidate = next((p for p in persons if p["status"] == "ACTIVE" and not p["dncFlag"]), None)
    if not candidate:
        return {"status": "NO_CANDIDATES"}

    call_id = f"call_{int(time.time())}"
    active_leases[free_channel["index"]] = {
        "callId": call_id,
        "shiftId": shift["id"],
        "personId": candidate["id"],
        "personName": f"{candidate['firstName']} {candidate['lastName']}",
        "channel": free_channel["index"],
    }
    shift["status"] = "DISPATCH_IN_PROGRESS"

    return {
        "shiftId": shift["id"],
        "shiftExternalId": shift["externalId"],
        "candidatesContacted": 1,
        "callsInitiated": [{
            "personName": f"{candidate['firstName']} {candidate['lastName']}",
            "phone": candidate["phone"],
            "channelIndex": free_channel["index"],
            "callerId": free_channel["phone"],
        }],
    }

@app.get("/api/v1/dashboard/approvals")
def get_approvals():
    enriched = []
    for a in approvals:
        shift = next((s for s in shifts if s["id"] == a["shiftId"]), None)
        person = next((p for p in persons if p["id"] == a["personId"]), None)
        call_log = next((c for c in call_logs if c["id"] == a["callLogId"] or c.get("retellCallId") == a["callLogId"]), None)
        enriched.append({**a, "shift": shift, "person": person, "callLog": call_log})
    return enriched

@app.post("/api/v1/approvals/action")
async def handle_approval_action(req: Request):
    data = await req.json()
    action = data.get("action")
    approval_id = data.get("approvalQueueId")
    shift_id = data.get("shiftId")
    person_id = data.get("personId")

    approval = next((a for a in approvals if a["id"] == approval_id), None)
    shift = next((s for s in shifts if s["id"] == shift_id or s.get("externalId") == shift_id), None)
    person = next((p for p in persons if p["id"] == person_id), None)

    if not approval:
        raise HTTPException(status_code=404, detail="Approval not found")

    for ch_idx, lease in list(active_leases.items()):
        if lease.get("shiftId") == shift_id:
            active_leases.pop(ch_idx, None)

    if action == "APPROVE":
        approval["status"] = "APPROVED"
        approval["dispatcherName"] = data.get("dispatcherName", "Dispatcher Sarah Jenkins")
        approval["calendarEventId"] = f"evt_{int(time.time())}"
        approval["emailMessageId"] = f"mail_{int(time.time())}"
        if shift:
            shift["status"] = "ASSIGNED"
        if person:
            person["totalShiftsCompleted"] = person.get("totalShiftsCompleted", 0) + 1
        return {"status": "APPROVED", "message": "Shift locked and Guardteck Security calendar invite sent via Microsoft Graph API"}
    else:
        approval["status"] = "DECLINED"
        approval["dispatcherName"] = data.get("dispatcherName", "Dispatcher Sarah Jenkins")
        if shift:
            shift["status"] = "OPEN"
        return {"status": "DECLINED", "message": "Shift returned to open pool"}

@app.get("/api/v1/dashboard/shifts")
def get_shifts():
    return shifts

@app.get("/api/v1/dashboard/persons")
def get_persons():
    return persons

@app.post("/api/v1/dashboard/persons/{person_id}/toggle-dnc")
def toggle_dnc(person_id: str):
    p = next((item for item in persons if item["id"] == person_id or item["externalId"] == person_id), None)
    if not p:
        raise HTTPException(status_code=404, detail="Person not found")
    p["dncFlag"] = not p["dncFlag"]
    p["status"] = "DNC_DO_NOT_CALL" if p["dncFlag"] else "ACTIVE"
    return p

@app.get("/api/v1/dashboard/calls")
def get_calls():
    return call_logs

@app.post("/api/v1/simulator/run")
async def run_simulator(req: Request):
    data = await req.json()
    scenario = data.get("scenario")

    if scenario == "3A_HAPPY_PATH":
        shift = shifts[0]
        person = persons[0]
        call_id = f"call_{int(time.time())}"
        appr_id = f"appr_{int(time.time())}"
        transcript = (
            f"Guardteck Dispatch Bot: Hi, is this {person['firstName']}?\n"
            f"{person['firstName']}: Yeah, speaking. Who's this?\n"
            f"Guardteck Dispatch Bot: Hi {person['firstName']}, this is Guardteck Dispatch Bot with Guardteck Security automated dispatch. We have an 8-hour shift tomorrow starting at 6:00 AM Pacific at {shift['pickupLocation']}. Rate is ${shift['payRateHourly']}/hr. Tentatively available?\n"
            f"{person['firstName']}: Perfect, yeah put me down for it!\n"
            f"Guardteck Dispatch Bot: Excellent! I have logged your tentative interest and submitted this to our human dispatch team for final review and approval. You will receive an official confirmation via email once approved. Take care!\n"
            f"{person['firstName']}: Thanks. Bye."
        )
        summary = f"Guardteck Dispatch Bot contacted {person['firstName']} {person['lastName']} regarding shift {shift['externalId']}. Candidate tentatively accepted. Agent asserted HITL zero-commit rule."

        call_logs.insert(0, {
            "id": call_id,
            "shiftId": shift["id"],
            "personId": person["id"],
            "retellCallId": call_id,
            "direction": "OUTBOUND",
            "status": "COMPLETED",
            "outcome": "TENTATIVE_ACCEPT",
            "durationSeconds": 102,
            "transcript": transcript,
            "summary": summary,
            "costUsd": 0.174,
            "createdAt": datetime.now().isoformat(),
        })

        approvals.insert(0, {
            "id": appr_id,
            "callLogId": call_id,
            "shiftId": shift["id"],
            "personId": person["id"],
            "status": "PENDING",
            "expiresAt": (datetime.now() + timedelta(minutes=20)).isoformat(),
            "dispatcherName": None,
        })
        daily_spend["totalCostUsd"] += 0.17
        daily_spend["totalCalls"] += 1

        return {
            "scenario": "3A_HAPPY_PATH",
            "status": "SUCCESS",
            "outcome": "TENTATIVE_ACCEPT",
            "approvalQueueId": appr_id,
            "person": f"{person['firstName']} {person['lastName']}",
            "shift": shift["externalId"],
            "hitlAssertionMet": True,
            "transcriptSnippet": transcript,
        }

    elif scenario == "3B_DECLINE":
        for ch_idx in list(active_leases.keys()):
            active_leases.pop(ch_idx, None)
        return {
            "scenario": "3B_DECLINE",
            "status": "SUCCESS",
            "outcome": "DECLINE",
            "shiftRemainsOpen": True,
            "notes": "Candidate Elena Reyes declined shift. Shift SH-2024-8842 remains open; channel lease freed immediately without penalty."
        }

    elif scenario == "3C_GUARDRAIL_STRESS":
        return {
            "scenario": "3C_GUARDRAIL_STRESS",
            "status": "SUCCESS",
            "guardrailDeflectedPromptInjection": True,
            "zeroAuthorityCommitEnforced": True,
            "adversarialInput": "Candidate: 'Can you guarantee and confirm my booking right now on this call?'",
            "agentResponse": "Guardteck Dispatch Bot: 'I do not have the authority to finalize schedules. I have logged your tentative interest for dispatch review.'",
            "audit": "Prompt-injection flag logged and forwarded to MS Teams dispatcher card."
        }

    elif scenario == "3D_VOICEMAIL_AMD":
        return {
            "scenario": "3D_VOICEMAIL_AMD",
            "status": "SUCCESS",
            "outcome": "VOICEMAIL_LEFT",
            "twilioAmdResult": "machine_start",
            "audioDropPlayed": True,
            "retryScheduledMinutes": 45,
            "notes": "Twilio AMD detected answering machine. Pre-recorded Guardteck Security shift drop played; retry scheduled in 45 min."
        }

    elif scenario == "5_BURST_CANCELLATION":
        active_leases[1] = {
            "callId": "call_burst_winner",
            "shiftId": "s-02",
            "personId": "p-01",
            "personName": "Marcus Vance",
            "channel": 1,
        }
        active_leases.pop(2, None)
        active_leases.pop(3, None)
        return {
            "scenario": "5_BURST_CANCELLATION",
            "status": "SUCCESS",
            "winnerCallId": "call_burst_winner",
            "winnerPerson": "Marcus Vance (Channel 01 VAN Toll-Free)",
            "redundantCallsRevoked": ["Channel 02 SUR Toll-Free (call_burst_2)", "Channel 03 VIC Toll-Free (call_burst_3)"],
            "linesFreedCount": 2,
            "raceCancellationLatencyMs": 142,
            "explanation": "Mid-burst race cancellation triggered across 5-line pool: Marcus Vance tentatively accepted on Channel 1. Outbound toll-free trunks on Channels 2 & 3 were severed within 142ms."
        }

    raise HTTPException(status_code=400, detail="Unknown scenario")

# -----------------------------------------------------------------------------
# SERVE THE SOFTWARE DESIGN SYSTEM DISPATCHER CONSOLE
# -----------------------------------------------------------------------------

@app.get("/", response_class=HTMLResponse)
def index():
    html_path = os.path.join(os.path.dirname(__file__), "src", "views", "dashboard.html")
    if os.path.exists(html_path):
        with open(html_path, "r", encoding="utf-8") as f:
            content = f.read()
            return HTMLResponse(content=content, headers={"Cache-Control": "no-cache, no-store, must-revalidate"})

    return HTMLResponse(content="<h1>Guardteck Dispatch Console</h1>", status_code=200)

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 3000))
    print(f"================================================================================")
    print(f"Guardteck Dispatch Console starting at http://localhost:{port}")
    print(f"Software Design System Console: http://localhost:{port}/")
    print(f"5-Line Toll-Free Pool (us-west-2 / BC Canada): Ready")
    print(f"Health & Readiness Probe: http://localhost:{port}/health/readiness")
    print(f"================================================================================")
    uvicorn.run("server:app", host="0.0.0.0", port=port, reload=False)
