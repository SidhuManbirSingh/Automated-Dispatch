"""
Guardteck Security - GUARDTECK DISPATCH CONSOLE Local Server
Built with Python 3.12, FastAPI, and Uvicorn.
Serves the multi-page tree application (/login, /, /queue, /records)
and operational JSON endpoints.
"""

import os
import time
from datetime import datetime, timedelta
from typing import Dict, Any, Optional
from fastapi import FastAPI, Request, HTTPException
from fastapi.responses import HTMLResponse
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

app = FastAPI(title="GUARDTECK DISPATCH CONSOLE", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -----------------------------------------------------------------------------
# IN-MEMORY OPERATIONAL STORE (MYSQL-READY SAMPLE DATA)
# -----------------------------------------------------------------------------

SIP_REGION = "us-west-2"

CHANNEL_DEFS = [
    {"index": 1, "lineLabel": "Line 01", "region": "VAN", "phone": "+18885550101"},
    {"index": 2, "lineLabel": "Line 02", "region": "VAN", "phone": "+18885550102"},
    {"index": 3, "lineLabel": "Line 03", "region": "VAN", "phone": "+18885550103"},
    {"index": 4, "lineLabel": "Line 04", "region": "VAN", "phone": "+18885550104"},
    {"index": 5, "lineLabel": "Line 05", "region": "VAN", "phone": "+18885550105"},
]

persons = [
    {
        "id": "p-01",
        "externalId": "200001042",
        "firstName": "Manbir",
        "lastName": "Singh",
        "phone": "+16045550198",
        "email": "m.sidhu412@guardteck.com",
        "region": "Vancouver",
        "status": "ACTIVE",
        "dncFlag": False,
        "eligibilityCodes": ["ST", "OFA1"],
        "guardActive": True,
        "reliabilityScore": 0.98,
        "totalShiftsCompleted": 142,
    },
    {
        "id": "p-02",
        "externalId": "200001043",
        "firstName": "Elena",
        "lastName": "Reyes",
        "phone": "+16045550144",
        "email": "elena.reyes@guardteck.com",
        "region": "Surrey",
        "status": "ACTIVE",
        "dncFlag": False,
        "eligibilityCodes": ["ST", "OFA2"],
        "guardActive": True,
        "reliabilityScore": 0.95,
        "totalShiftsCompleted": 98,
    },
    {
        "id": "p-03",
        "externalId": "200001044",
        "firstName": "David",
        "lastName": "Chen",
        "phone": "+12505550188",
        "email": "david.chen@guardteck.com",
        "region": "Victoria",
        "status": "ACTIVE",
        "dncFlag": False,
        "eligibilityCodes": ["ST", "OFA1", "OFA2"],
        "guardActive": True,
        "reliabilityScore": 0.92,
        "totalShiftsCompleted": 76,
    },
    {
        "id": "p-04",
        "externalId": "200001045",
        "firstName": "Claire",
        "lastName": "Bennett",
        "phone": "+12505550162",
        "email": "claire.bennett@guardteck.com",
        "region": "Kelowna",
        "status": "ACTIVE",
        "dncFlag": False,
        "eligibilityCodes": ["OFA1"],
        "guardActive": True,
        "reliabilityScore": 0.94,
        "totalShiftsCompleted": 64,
    },
    {
        "id": "p-05",
        "externalId": "200001046",
        "firstName": "Robert",
        "lastName": "Kowalski",
        "phone": "+16045550173",
        "email": "robert.kowalski@guardteck.com",
        "region": "Burnaby",
        "status": "ACTIVE",
        "dncFlag": False,
        "eligibilityCodes": ["ST", "OFA1"],
        "guardActive": True,
        "reliabilityScore": 0.96,
        "totalShiftsCompleted": 110,
    },
    {
        "id": "p-06",
        "externalId": "200001047",
        "firstName": "Priya",
        "lastName": "Nair",
        "phone": "+17785550134",
        "email": "priya.nair@guardteck.com",
        "region": "Vancouver",
        "status": "ACTIVE",
        "dncFlag": False,
        "eligibilityCodes": ["OFA2"],
        "guardActive": True,
        "reliabilityScore": 0.97,
        "totalShiftsCompleted": 88,
    },
    {
        "id": "p-07",
        "externalId": "200001048",
        "firstName": "Hannah",
        "lastName": "Morales",
        "phone": "+16045550151",
        "email": "hannah.morales@guardteck.com",
        "region": "New Westminster",
        "status": "ACTIVE",
        "dncFlag": False,
        "eligibilityCodes": ["ST", "OFA1"],
        "guardActive": True,
        "reliabilityScore": 0.91,
        "totalShiftsCompleted": 52,
    },
    {
        "id": "p-08",
        "externalId": "200001049",
        "firstName": "Jamal",
        "lastName": "Washington",
        "phone": "+17785550119",
        "email": "jamal.washington@guardteck.com",
        "region": "Burnaby",
        "status": "DNC_DO_NOT_CALL",
        "dncFlag": True,
        "eligibilityCodes": ["ST"],
        "guardActive": False,
        "reliabilityScore": 0.81,
        "totalShiftsCompleted": 30,
    },
]

shifts = [
    {
        "id": "s-01",
        "externalId": "AAA-10001",
        "siteLocation": "Vancouver Harbour Terminal, Gate B",
        "timeWindow": "2026-11-19 06:00 - 14:00 PST",
        "shiftDate": (datetime.now() + timedelta(days=1)).isoformat(),
        "durationHours": 8.0,
        "equipmentType": "Patrol Vehicle (Class 5)",
        "payRateHourly": 32.50,
        "currency": "CAD",
        "priority": 2,
        "status": "PENDING_APPROVAL",
    },
    {
        "id": "s-02",
        "externalId": "BBB-10002",
        "siteLocation": "Surrey Civic Plaza, Security Desk",
        "timeWindow": "2026-11-19 08:00 - 16:00 PST",
        "shiftDate": (datetime.now() + timedelta(days=1)).isoformat(),
        "durationHours": 8.0,
        "equipmentType": "Site Access & CCTV Monitor",
        "payRateHourly": 36.00,
        "currency": "CAD",
        "priority": 3,
        "status": "OUTREACH_ACTIVE",
    },
    {
        "id": "s-03",
        "externalId": "CCC-10003",
        "siteLocation": "Victoria Inner Harbour Dock",
        "timeWindow": "2026-11-19 14:00 - 22:00 PST",
        "shiftDate": (datetime.now() + timedelta(days=1)).isoformat(),
        "durationHours": 8.0,
        "equipmentType": "Mobile Patrol Unit",
        "payRateHourly": 34.00,
        "currency": "CAD",
        "priority": 2,
        "status": "PENDING_APPROVAL",
    },
    {
        "id": "s-04",
        "externalId": "DDD-10004",
        "siteLocation": "Kelowna Regional Health Campus",
        "timeWindow": "2026-11-20 06:00 - 14:00 PST",
        "shiftDate": (datetime.now() + timedelta(days=2)).isoformat(),
        "durationHours": 8.0,
        "equipmentType": "Site Security Guard",
        "payRateHourly": 31.00,
        "currency": "CAD",
        "priority": 1,
        "status": "ASSIGNED",
    },
    {
        "id": "s-05",
        "externalId": "EEE-10005",
        "siteLocation": "Burnaby Corporate Campus, Tower A",
        "timeWindow": "2026-11-19 18:00 - 02:00 PST",
        "shiftDate": (datetime.now() + timedelta(days=1)).isoformat(),
        "durationHours": 8.0,
        "equipmentType": "Concierge & Access Control",
        "payRateHourly": 33.75,
        "currency": "CAD",
        "priority": 3,
        "status": "OUTREACH_ACTIVE",
    },
    {
        "id": "s-06",
        "externalId": "FFF-10006",
        "siteLocation": "New Westminster Transit Concierge",
        "timeWindow": "2026-11-20 22:00 - 06:00 PST",
        "shiftDate": (datetime.now() + timedelta(days=2)).isoformat(),
        "durationHours": 8.0,
        "equipmentType": "Transit Patrol Officer",
        "payRateHourly": 35.00,
        "currency": "CAD",
        "priority": 2,
        "status": "OPEN",
    },
]

now = datetime.now()

call_logs = [
    {
        "id": "c-01",
        "shiftId": "s-01",
        "shiftExternalId": "AAA-10001",
        "personId": "p-01",
        "guardExternalId": "200001042",
        "guardName": "Manbir Singh",
        "phone": "+16045550198",
        "retellCallId": "call_9841f3e72089a42cb901",
        "direction": "OUTBOUND",
        "status": "COMPLETED",
        "outcome": "Tentative Accept",
        "attemptNumber": 1,
        "durationSeconds": 102,
        "eligibilityCodes": ["ST", "OFA1"],
        "guardActive": True,
        "timestamp": (now - timedelta(minutes=14)).strftime("%Y-%m-%d %H:%M:%S"),
        "transcript": (
            "Guardteck Dispatch Bot: Hi, is this Manbir?\n"
            "Manbir Singh: Yeah, speaking. Who is calling?\n"
            "Guardteck Dispatch Bot: Hi Manbir, this is Guardteck Dispatch Bot with Guardteck Security automated dispatch. We have an 8-hour shift tomorrow from 06:00 to 14:00 PST at Vancouver Harbour Terminal, Gate B at $32.50 CAD per hour. Are you tentatively available?\n"
            "Manbir Singh: Yes, Vancouver Harbour works well for me. Put me down for it.\n"
            "Guardteck Dispatch Bot: Thank you. I have logged your tentative interest and submitted this to our human dispatch team for final review and approval. You will receive official confirmation once approved.\n"
            "Manbir Singh: Sounds good, thanks. Bye."
        ),
        "summary": "Manbir Singh confirmed tentative availability for Vancouver Harbour Terminal, Gate B (06:00-14:00 PST) at $32.50/hr with no schedule conflicts.",
    },
    {
        "id": "c-02",
        "shiftId": "s-03",
        "shiftExternalId": "CCC-10003",
        "personId": "p-03",
        "guardExternalId": "200001044",
        "guardName": "David Chen",
        "phone": "+12505550188",
        "retellCallId": "call_9841f3e72089a42cb902",
        "direction": "OUTBOUND",
        "status": "COMPLETED",
        "outcome": "Tentative Accept",
        "attemptNumber": 1,
        "durationSeconds": 88,
        "eligibilityCodes": ["ST", "OFA1", "OFA2"],
        "guardActive": True,
        "timestamp": (now - timedelta(minutes=9)).strftime("%Y-%m-%d %H:%M:%S"),
        "transcript": (
            "Guardteck Dispatch Bot: Hi, is this David?\n"
            "David Chen: Yes, speaking.\n"
            "Guardteck Dispatch Bot: Hi David, calling from Guardteck Security about an open 8-hour Mobile Patrol shift at Victoria Inner Harbour Dock tomorrow 14:00 to 22:00 PST at $34.00 per hour. Are you tentatively open to cover it?\n"
            "David Chen: Yes, I am free in the afternoon tomorrow and have my Class 5 patrol cert ready.\n"
            "Guardteck Dispatch Bot: Understood. I have logged your tentative interest for dispatcher verification and approval. Thank you for your time."
        ),
        "summary": "David Chen accepted tentative coverage for Victoria Inner Harbour Dock (14:00-22:00 PST) at $34.00/hr and confirmed active patrol certification.",
    },
    {
        "id": "c-03",
        "shiftId": "s-05",
        "shiftExternalId": "EEE-10005",
        "personId": "p-07",
        "guardExternalId": "200001048",
        "guardName": "Hannah Morales",
        "phone": "+16045550151",
        "retellCallId": "call_9841f3e72089a42cb903",
        "direction": "OUTBOUND",
        "status": "COMPLETED",
        "outcome": "Tentative Accept",
        "attemptNumber": 2,
        "durationSeconds": 115,
        "eligibilityCodes": ["ST", "OFA1"],
        "guardActive": True,
        "timestamp": (now - timedelta(minutes=6)).strftime("%Y-%m-%d %H:%M:%S"),
        "transcript": (
            "Guardteck Dispatch Bot: Hello, is this Hannah Morales?\n"
            "Hannah Morales: Hi, yes this is Hannah.\n"
            "Guardteck Dispatch Bot: Guardteck Security has an evening Concierge & Access Control shift at Burnaby Corporate Campus, Tower A tomorrow 18:00 to 02:00 PST paying $33.75 per hour. Would you like me to submit your interest?\n"
            "Hannah Morales: Sure, I can cover Tower A tomorrow night. Do I check in at the main lobby?\n"
            "Guardteck Dispatch Bot: Yes, check-in details will be included on your confirmation brief once dispatch approves. I have logged your tentative interest for review."
        ),
        "summary": "Hannah Morales tentatively accepted the evening shift at Burnaby Corporate Campus, Tower A (18:00-02:00 PST) at $33.75/hr on attempt #2.",
    },
    {
        "id": "c-04",
        "shiftId": "s-02",
        "shiftExternalId": "BBB-10002",
        "personId": "p-02",
        "guardExternalId": "200001043",
        "guardName": "Elena Reyes",
        "phone": "+16045550144",
        "retellCallId": "call_9841f3e72089a42cb904",
        "direction": "OUTBOUND",
        "status": "IN_PROGRESS",
        "outcome": "In Progress",
        "attemptNumber": 1,
        "durationSeconds": 84,
        "eligibilityCodes": ["ST", "OFA2"],
        "guardActive": True,
        "timestamp": now.strftime("%Y-%m-%d %H:%M:%S"),
        "transcript": "Call currently in progress on Line 01 regarding BBB-10002 (Surrey Civic Plaza).",
        "summary": "Active outreach call in progress on Line 01.",
    },
    {
        "id": "c-05",
        "shiftId": "s-05",
        "shiftExternalId": "EEE-10005",
        "personId": "p-05",
        "guardExternalId": "200001046",
        "guardName": "Robert Kowalski",
        "phone": "+16045550173",
        "retellCallId": "call_9841f3e72089a42cb905",
        "direction": "OUTBOUND",
        "status": "IN_PROGRESS",
        "outcome": "In Progress",
        "attemptNumber": 1,
        "durationSeconds": 47,
        "eligibilityCodes": ["ST", "OFA1"],
        "guardActive": True,
        "timestamp": now.strftime("%Y-%m-%d %H:%M:%S"),
        "transcript": "Call currently in progress on Line 02 regarding EEE-10005 (Burnaby Corporate Campus).",
        "summary": "Active outreach call in progress on Line 02.",
    },
    {
        "id": "c-06",
        "shiftId": "s-01",
        "shiftExternalId": "AAA-10001",
        "personId": "p-06",
        "guardExternalId": "200001047",
        "guardName": "Priya Nair",
        "phone": "+17785550134",
        "retellCallId": "call_9841f3e72089a42cb906",
        "direction": "OUTBOUND",
        "status": "COMPLETED",
        "outcome": "Declined",
        "attemptNumber": 1,
        "durationSeconds": 28,
        "eligibilityCodes": ["OFA2"],
        "guardActive": True,
        "timestamp": (now - timedelta(minutes=24)).strftime("%Y-%m-%d %H:%M:%S"),
        "transcript": (
            "Guardteck Dispatch Bot: Hi, is this Priya?\n"
            "Priya Nair: Speaking.\n"
            "Guardteck Dispatch Bot: Calling about an 8-hour morning shift tomorrow at Vancouver Harbour Terminal at $32.50/hr.\n"
            "Priya Nair: Sorry, I have another commitment tomorrow morning so I have to pass.\n"
            "Guardteck Dispatch Bot: No problem at all, I will mark you unavailable for this shift. Have a great day."
        ),
        "summary": "Priya Nair declined due to morning schedule conflict; shift returned to outreach queue.",
    },
    {
        "id": "c-07",
        "shiftId": "s-02",
        "shiftExternalId": "BBB-10002",
        "personId": "p-04",
        "guardExternalId": "200001045",
        "guardName": "Claire Bennett",
        "phone": "+12505550162",
        "retellCallId": "call_9841f3e72089a42cb907",
        "direction": "OUTBOUND",
        "status": "VOICEMAIL",
        "outcome": "Voicemail Left",
        "attemptNumber": 1,
        "durationSeconds": 19,
        "eligibilityCodes": ["OFA1"],
        "guardActive": True,
        "timestamp": (now - timedelta(minutes=31)).strftime("%Y-%m-%d %H:%M:%S"),
        "transcript": "[AMD Machine Detected] Dropped standard Guardteck Security callback voicemail message.",
        "summary": "Answering machine detected via Twilio AMD; concise callback voicemail left.",
    },
    {
        "id": "c-08",
        "shiftId": "s-03",
        "shiftExternalId": "CCC-10003",
        "personId": "p-07",
        "guardExternalId": "200001048",
        "guardName": "Hannah Morales",
        "phone": "+16045550151",
        "retellCallId": "call_9841f3e72089a42cb908",
        "direction": "OUTBOUND",
        "status": "NO_ANSWER",
        "outcome": "No Answer",
        "attemptNumber": 1,
        "durationSeconds": 30,
        "eligibilityCodes": ["ST", "OFA1"],
        "guardActive": True,
        "timestamp": (now - timedelta(minutes=42)).strftime("%Y-%m-%d %H:%M:%S"),
        "transcript": "[Ring Timeout 30s] No answer from candidate device; line released.",
        "summary": "No answer after 30-second ring timeout.",
    },
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
        "actionTimestamp": None,
        "expiresAt": (now + timedelta(minutes=18)).isoformat(),
    },
    {
        "id": "appr-02",
        "callLogId": "c-02",
        "shiftId": "s-03",
        "personId": "p-03",
        "status": "PENDING",
        "dispatcherId": None,
        "dispatcherName": None,
        "actionTimestamp": None,
        "expiresAt": (now + timedelta(minutes=21)).isoformat(),
    },
    {
        "id": "appr-03",
        "callLogId": "c-03",
        "shiftId": "s-05",
        "personId": "p-07",
        "status": "PENDING",
        "dispatcherId": None,
        "dispatcherName": None,
        "actionTimestamp": None,
        "expiresAt": (now + timedelta(minutes=24)).isoformat(),
    },
]

# Active channel leases: Line 01 and Line 02 pre-populated as Busy
active_leases: Dict[int, Dict[str, Any]] = {
    1: {
        "callId": "c-04",
        "shiftId": "s-02",
        "shiftExternalId": "BBB-10002",
        "personId": "p-02",
        "guardExternalId": "200001043",
        "guardName": "Elena Reyes",
        "durationSeconds": 84,
        "startedAt": time.time() - 84,
    },
    2: {
        "callId": "c-05",
        "shiftId": "s-05",
        "shiftExternalId": "EEE-10005",
        "personId": "p-05",
        "guardExternalId": "200001046",
        "guardName": "Robert Kowalski",
        "durationSeconds": 47,
        "startedAt": time.time() - 47,
    },
}

# -----------------------------------------------------------------------------
# PAGE ROUTES (TREE MULTI-PAGE APPLICATION)
# -----------------------------------------------------------------------------

def serve_console_html() -> HTMLResponse:
    html_path = os.path.join(os.path.dirname(__file__), "src", "views", "dashboard.html")
    if os.path.exists(html_path):
        with open(html_path, "r", encoding="utf-8") as f:
            return HTMLResponse(
                content=f.read(),
                headers={"Cache-Control": "no-cache, no-store, must-revalidate"},
            )
    return HTMLResponse(content="<h1>GUARDTECK DISPATCH CONSOLE</h1>", status_code=200)

@app.get("/", response_class=HTMLResponse)
def page_root():
    return serve_console_html()

@app.get("/login", response_class=HTMLResponse)
def page_login():
    return serve_console_html()

@app.get("/queue", response_class=HTMLResponse)
def page_queue():
    return serve_console_html()

@app.get("/records", response_class=HTMLResponse)
def page_records():
    return serve_console_html()

# -----------------------------------------------------------------------------
# OPERATIONAL & HEALTH API ROUTES
# -----------------------------------------------------------------------------

@app.get("/health")
def health():
    return {
        "status": "OK",
        "timestamp": datetime.now().isoformat(),
        "service": "guardteck-dispatch-console",
    }

@app.get("/health/readiness")
def readiness():
    return {
        "status": "READY",
        "activeLines": len(active_leases),
        "maxLines": 5,
        "sipRegion": SIP_REGION,
    }

@app.get("/health/liveness")
def liveness():
    return {"status": "LIVE", "timestamp": datetime.now().isoformat()}

@app.get("/api/v1/dashboard/stats")
def get_stats():
    pending_appr = len([a for a in approvals if a["status"] == "PENDING"])
    return {
        "pendingApprovals": pending_appr,
        "activeOutboundLines": len(active_leases),
        "maxLines": 5,
        "totalCallRecords": len(call_logs),
        "openShiftsCount": len([s for s in shifts if s["status"] != "ASSIGNED"]),
        "sipRegion": SIP_REGION,
    }

@app.get("/api/v1/dispatch/lines")
def get_lines():
    results = []
    current_ts = time.time()
    for ch in CHANNEL_DEFS:
        idx = ch["index"]
        lease = active_leases.get(idx)
        if lease:
            elapsed = int(current_ts - lease.get("startedAt", current_ts))
            results.append({
                "channelIndex": idx,
                "lineLabel": ch["lineLabel"],
                "status": "Busy",
                "regionServed": ch["region"],
                "allocatedPhoneNumber": ch["phone"],
                "shiftId": lease["shiftId"],
                "shiftExternalId": lease["shiftExternalId"],
                "guardExternalId": lease["guardExternalId"],
                "guardName": lease["guardName"],
                "durationSeconds": max(1, elapsed),
                "callId": lease["callId"],
            })
        else:
            results.append({
                "channelIndex": idx,
                "lineLabel": ch["lineLabel"],
                "status": "Idle",
                "regionServed": ch["region"],
                "allocatedPhoneNumber": ch["phone"],
                "shiftId": None,
                "shiftExternalId": None,
                "guardExternalId": None,
                "guardName": None,
                "durationSeconds": 0,
                "callId": None,
            })
    return {"totalChannels": 5, "activeCount": len(active_leases), "lines": results}

@app.post("/api/v1/dispatch/trigger")
async def trigger_dispatch(req: Request):
    data = await req.json()
    shift_id = data.get("shiftId")
    shift = next((s for s in shifts if s["id"] == shift_id or s["externalId"] == shift_id), None)
    if not shift:
        raise HTTPException(status_code=404, detail="Shift not found")

    free_ch = next((c for c in CHANNEL_DEFS if c["index"] not in active_leases), None)
    if not free_ch:
        return {"status": "BACKPRESSURE", "message": "All outbound lines currently busy"}

    busy_person_ids = {lease["personId"] for lease in active_leases.values()}
    candidate = next(
        (p for p in persons if p["status"] == "ACTIVE" and not p["dncFlag"] and p["id"] not in busy_person_ids),
        None,
    )
    if not candidate:
        return {"status": "NO_CANDIDATES"}

    call_id = f"c-{int(time.time())}"
    guard_name = f"{candidate['firstName']} {candidate['lastName']}"
    active_leases[free_ch["index"]] = {
        "callId": call_id,
        "shiftId": shift["id"],
        "shiftExternalId": shift["externalId"],
        "personId": candidate["id"],
        "guardExternalId": candidate["externalId"],
        "guardName": guard_name,
        "durationSeconds": 1,
        "startedAt": time.time(),
    }
    shift["status"] = "OUTREACH_ACTIVE"

    call_logs.insert(0, {
        "id": call_id,
        "shiftId": shift["id"],
        "shiftExternalId": shift["externalId"],
        "personId": candidate["id"],
        "guardExternalId": candidate["externalId"],
        "guardName": guard_name,
        "phone": candidate["phone"],
        "retellCallId": f"call_{int(time.time())}",
        "direction": "OUTBOUND",
        "status": "IN_PROGRESS",
        "outcome": "In Progress",
        "attemptNumber": 1,
        "durationSeconds": 1,
        "eligibilityCodes": candidate.get("eligibilityCodes", ["ST"]),
        "guardActive": candidate["guardActive"],
        "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "transcript": f"Call currently active on {free_ch['lineLabel']} for {shift['externalId']}.",
        "summary": f"Outreach initiated to {guard_name} ({candidate['externalId']}) for shift {shift['externalId']}.",
    })

    return {
        "status": "INITIATED",
        "shiftExternalId": shift["externalId"],
        "lineLabel": free_ch["lineLabel"],
        "guardExternalId": candidate["externalId"],
        "guardName": guard_name,
    }

@app.get("/api/v1/dashboard/approvals")
def get_approvals():
    enriched = []
    for a in approvals:
        shift = next((s for s in shifts if s["id"] == a["shiftId"]), None)
        person = next((p for p in persons if p["id"] == a["personId"]), None)
        call_log = next((c for c in call_logs if c["id"] == a["callLogId"]), None)
        enriched.append({**a, "shift": shift, "person": person, "callLog": call_log})
    return enriched

@app.post("/api/v1/approvals/action")
async def handle_approval_action(req: Request):
    data = await req.json()
    action = (data.get("action") or "").upper()
    approval_id = data.get("approvalQueueId")
    shift_id = data.get("shiftId")
    person_id = data.get("personId")
    dispatcher_name = data.get("dispatcherName") or "Authenticated Operator"
    dispatcher_id = data.get("dispatcherId") or "operator@guardteck.com"

    approval = next((a for a in approvals if a["id"] == approval_id), None)
    shift = next((s for s in shifts if s["id"] == shift_id or s.get("externalId") == shift_id), None)
    person = next((p for p in persons if p["id"] == person_id), None)

    if not approval:
        raise HTTPException(status_code=404, detail="Approval item not found")

    for ch_idx, lease in list(active_leases.items()):
        if lease.get("shiftId") == shift_id:
            active_leases.pop(ch_idx, None)

    approval["dispatcherName"] = dispatcher_name
    approval["dispatcherId"] = dispatcher_id
    approval["actionTimestamp"] = datetime.now().isoformat()

    if action == "APPROVE":
        approval["status"] = "APPROVED"
        if shift:
            shift["status"] = "ASSIGNED"
        if person:
            person["totalShiftsCompleted"] = person.get("totalShiftsCompleted", 0) + 1
        return {"status": "APPROVED", "dispatcherName": dispatcher_name}
    elif action in ("REJECT", "DECLINE"):
        approval["status"] = "REJECTED" if action == "REJECT" else "DECLINED"
        if shift:
            shift["status"] = "OPEN"
        return {"status": approval["status"], "dispatcherName": dispatcher_name}

    raise HTTPException(status_code=400, detail="Unsupported action")

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
    p["guardActive"] = not p["dncFlag"]
    p["status"] = "DNC_DO_NOT_CALL" if p["dncFlag"] else "ACTIVE"
    return p

@app.get("/api/v1/dashboard/calls")
def get_calls():
    return call_logs

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 3000))
    print(f"================================================================================")
    print(f"GUARDTECK DISPATCH CONSOLE starting at http://localhost:{port}")
    print(f"Routes: /login, /, /queue, /records")
    print(f"================================================================================")
    uvicorn.run("server:app", host="0.0.0.0", port=port, reload=False)
