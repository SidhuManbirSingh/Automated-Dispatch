"""
Guardteck Security - GUARDTECK DISPATCH CONSOLE Local Server
Built with Python 3.12, FastAPI, and Uvicorn.
Serves the multi-page tree application (/login, /, /scheduling, /queue, /records)
and operational JSON endpoints.
"""

import os
import time
from datetime import datetime, timedelta
from typing import Dict, Any, List
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
# COLOR-CODED SITE SCHEMA (AAA - FFF)
# -----------------------------------------------------------------------------

SITES: List[Dict[str, str]] = [
    {
        "code": "AAA",
        "name": "Vancouver Harbour Terminal, Gate B",
        "region": "Vancouver",
        "colorBg": "#e0f2fe",
        "colorText": "#0369a1",
        "colorBorder": "#bae6fd",
    },
    {
        "code": "BBB",
        "name": "Surrey Civic Plaza, Security Desk",
        "region": "Surrey",
        "colorBg": "#d1fae5",
        "colorText": "#065f46",
        "colorBorder": "#a7f3d0",
    },
    {
        "code": "CCC",
        "name": "Victoria Inner Harbour Dock",
        "region": "Victoria",
        "colorBg": "#ede9fe",
        "colorText": "#5b21b6",
        "colorBorder": "#ddd6fe",
    },
    {
        "code": "DDD",
        "name": "Kelowna Regional Health Campus",
        "region": "Kelowna",
        "colorBg": "#fef3c7",
        "colorText": "#92400e",
        "colorBorder": "#fde68a",
    },
    {
        "code": "EEE",
        "name": "Burnaby Corporate Campus, Tower A",
        "region": "Burnaby",
        "colorBg": "#ffe4e6",
        "colorText": "#9f1239",
        "colorBorder": "#fecdd3",
    },
    {
        "code": "FFF",
        "name": "New Westminster Transit Concierge",
        "region": "New Westminster",
        "colorBg": "#e2e8f0",
        "colorText": "#1e293b",
        "colorBorder": "#cbd5e1",
    },
]

SITE_MAP = {s["code"]: s for s in SITES}

CHANNEL_DEFS = [
    {"index": 1, "lineLabel": "Line 01", "region": "VAN", "phone": "+18885550101"},
    {"index": 2, "lineLabel": "Line 02", "region": "VAN", "phone": "+18885550102"},
    {"index": 3, "lineLabel": "Line 03", "region": "VAN", "phone": "+18885550103"},
    {"index": 4, "lineLabel": "Line 04", "region": "VAN", "phone": "+18885550104"},
    {"index": 5, "lineLabel": "Line 05", "region": "VAN", "phone": "+18885550105"},
]

# -----------------------------------------------------------------------------
# GENERATED PERSONNEL ROSTER (20 ACTIVE TRAINED OFFICERS PER SITE = 120+)
# Employee IDs: 9-digit numbers starting with 2
# -----------------------------------------------------------------------------

_FIRST_NAMES = [
    "Manbir", "Elena", "David", "Claire", "Robert", "Priya", "Hannah", "Lucas",
    "Nathan", "Sofia", "Ethan", "Maya", "Owen", "Chloe", "Liam", "Zoe",
    "Caleb", "Nora", "Daniel", "Grace", "Noah", "Amara", "Isaac", "Leah",
]

_LAST_NAMES = [
    "Singh", "Reyes", "Chen", "Bennett", "Kowalski", "Nair", "Morales", "Patel",
    "Brooks", "Kim", "Gill", "Fraser", "Dhillon", "Mercer", "Nguyen", "Bains",
    "Foster", "Kaur", "Reid", "Campbell", "Sidhu", "Hussain", "Grewal", "Park",
]

_ELIGIBILITY_POOLS = [
    ["ST", "OFA1"],
    ["ST", "OFA2"],
    ["ST", "OFA1", "OFA2"],
    ["ST", "OFA1"],
    ["OFA1", "OFA2"],
]

_AREA_CODES = {
    "Vancouver": "604",
    "Surrey": "604",
    "Victoria": "250",
    "Kelowna": "250",
    "Burnaby": "778",
    "New Westminster": "604",
}


def _build_personnel() -> List[Dict[str, Any]]:
    roster: List[Dict[str, Any]] = []
    emp_num = 200001042

    for site_idx, site in enumerate(SITES):
        code = site["code"]
        region = site["region"]
        area = _AREA_CODES.get(region, "604")
        next_site = SITES[(site_idx + 1) % len(SITES)]["code"]

        for i in range(20):
            if site_idx == 0 and i == 0:
                fname, lname = "Manbir", "Singh"
                email = "m.sidhu412@guardteck.com"
            else:
                fname = _FIRST_NAMES[(site_idx * 5 + i) % len(_FIRST_NAMES)]
                lname = _LAST_NAMES[(site_idx * 7 + i * 3) % len(_LAST_NAMES)]
                email = f"{fname.lower()}.{lname.lower()}.{emp_num}@guardteck.com"

            suffix = f"{1000 + (site_idx * 100) + i:04d}"[-4:]
            phone = f"+1{area}555{suffix}"
            trained = [code] if i % 4 != 0 else [code, next_site]

            roster.append({
                "id": f"p-{site_idx + 1}-{i + 1:02d}",
                "externalId": str(emp_num),
                "firstName": fname,
                "lastName": lname,
                "phone": phone,
                "email": email,
                "region": region,
                "trainedSites": trained,
                "status": "ACTIVE",
                "dncFlag": False,
                "eligibilityCodes": _ELIGIBILITY_POOLS[(site_idx + i) % len(_ELIGIBILITY_POOLS)],
                "guardActive": True,
                "reliabilityScore": round(0.88 + ((i % 11) * 0.01), 2),
                "totalShiftsCompleted": 35 + ((site_idx * 17 + i * 9) % 120),
            })
            emp_num += 1

    # Add one DNC officer on site FFF for compliance toggle demonstration
    roster.append({
        "id": "p-dnc-01",
        "externalId": str(emp_num),
        "firstName": "Jamal",
        "lastName": "Washington",
        "phone": "+17785559919",
        "email": "jamal.washington@guardteck.com",
        "region": "Burnaby",
        "trainedSites": ["FFF"],
        "status": "DNC_DO_NOT_CALL",
        "dncFlag": True,
        "eligibilityCodes": ["ST"],
        "guardActive": False,
        "reliabilityScore": 0.81,
        "totalShiftsCompleted": 30,
    })
    return roster


persons = _build_personnel()

# -----------------------------------------------------------------------------
# SHIFTS ACROSS ALL 6 SITES (50 SHIFTS OVER 7 DAYS, 8-HOUR WINDOWS)
# -----------------------------------------------------------------------------

_SHIFT_WINDOWS = [
    ("0700", "1500"),
    ("0800", "1600"),
    ("1500", "2300"),
    ("1600", "0000"),
    ("0000", "0800"),
]

_SITE_ROLES = {
    "AAA": ["Patrol Vehicle (Class 5)", "Gate & Perimeter Patrol", "Gate & Terminal Security"],
    "BBB": ["Site Access & CCTV Monitor", "Civic Concierge Officer", "Evening Security Desk"],
    "CCC": ["Mobile Patrol Unit", "Harbour Dock Patrol", "Night Dock Watch"],
    "DDD": ["Hospital Campus Security", "Campus Triage Support", "Day Security Lead"],
    "EEE": ["Concierge & Access Control", "Lobby & Badge Desk", "Corporate Tower Patrol"],
    "FFF": ["Transit Patrol Officer", "Platform Safety Officer", "Evening Transit Concierge"],
}

_SITE_BASE_PAY = {
    "AAA": 32.50,
    "BBB": 35.50,
    "CCC": 34.00,
    "DDD": 33.00,
    "EEE": 33.75,
    "FFF": 35.00,
}

def _build_fifty_shifts() -> List[Dict[str, Any]]:
    result: List[Dict[str, Any]] = []
    initial_plan = [
        # (site_idx, seq, day_offset, win_idx, status, pay_offset, priority)
        (0, 1, 1, 0, "PENDING_APPROVAL", 0.0, 2),
        (0, 2, 1, 1, "OPEN", 0.0, 3),
        (0, 3, 1, 2, "OPEN", 0.75, 2),
        (1, 1, 1, 0, "OUTREACH_ACTIVE", 0.5, 3),
        (1, 2, 1, 1, "OPEN", 0.0, 2),
        (1, 3, 1, 3, "OPEN", 0.75, 1),
        (2, 1, 1, 1, "PENDING_APPROVAL", 0.0, 2),
        (2, 2, 1, 0, "OPEN", 0.0, 2),
        (2, 3, 2, 4, "OPEN", 1.0, 1),
        (3, 1, 1, 0, "ASSIGNED", 0.0, 3),
        (3, 2, 1, 2, "OPEN", 0.5, 2),
        (3, 3, 2, 1, "OPEN", -2.0, 1),
        (4, 1, 1, 3, "PENDING_APPROVAL", 0.0, 2),
        (4, 2, 1, 0, "OPEN", 0.0, 2),
        (4, 3, 1, 1, "OPEN", 0.5, 1),
        (5, 1, 1, 0, "OPEN", 0.0, 3),
        (5, 2, 1, 1, "OPEN", 0.0, 2),
        (5, 3, 1, 2, "OPEN", 0.5, 1),
    ]

    shift_num = 1
    for site_idx, seq, day_offset, win_idx, status, pay_offset, priority in initial_plan:
        site = SITES[site_idx]
        code = site["code"]
        start_h, end_h = _SHIFT_WINDOWS[win_idx]
        date_label = (datetime.now() + timedelta(days=day_offset)).strftime("%Y-%m-%d")
        roles = _SITE_ROLES[code]
        job_num = (site_idx + 1) * 10000 + seq
        result.append({
            "id": f"s-{shift_num:02d}",
            "externalId": f"{code}-{job_num}",
            "siteCode": code,
            "siteLocation": site["name"],
            "dateLabel": date_label,
            "startHour": start_h,
            "endHour": end_h,
            "timeWindow": f"{date_label} {start_h}-{end_h}",
            "durationHours": 8.0,
            "equipmentType": roles[(seq - 1) % len(roles)],
            "requiredEligibility": _ELIGIBILITY_POOLS[(site_idx + seq) % len(_ELIGIBILITY_POOLS)],
            "payRateHourly": round(_SITE_BASE_PAY[code] + pay_offset, 2),
            "currency": "CAD",
            "priority": priority,
            "status": status,
        })
        shift_num += 1

    extra_counts = [6, 6, 5, 5, 5, 5]
    for site_idx, extra_total in enumerate(extra_counts):
        site = SITES[site_idx]
        code = site["code"]
        roles = _SITE_ROLES[code]
        for k in range(extra_total):
            seq = 4 + k
            day_offset = 2 + (k % 6)
            start_h, end_h = _SHIFT_WINDOWS[(site_idx + k) % len(_SHIFT_WINDOWS)]
            date_label = (datetime.now() + timedelta(days=day_offset)).strftime("%Y-%m-%d")
            job_num = (site_idx + 1) * 10000 + seq
            result.append({
                "id": f"s-{shift_num:02d}",
                "externalId": f"{code}-{job_num}",
                "siteCode": code,
                "siteLocation": site["name"],
                "dateLabel": date_label,
                "startHour": start_h,
                "endHour": end_h,
                "timeWindow": f"{date_label} {start_h}-{end_h}",
                "durationHours": 8.0,
                "equipmentType": roles[k % len(roles)],
                "requiredEligibility": _ELIGIBILITY_POOLS[(site_idx + k) % len(_ELIGIBILITY_POOLS)],
                "payRateHourly": round(_SITE_BASE_PAY[code] + (k % 3) * 0.5, 2),
                "currency": "CAD",
                "priority": (k % 3) + 1,
                "status": "OPEN",
            })
            shift_num += 1

    return result

tomorrow_str = (datetime.now() + timedelta(days=1)).strftime("%Y-%m-%d")
shifts: List[Dict[str, Any]] = _build_fifty_shifts()

now = datetime.now()

p_aaa_01 = persons[0]      # Manbir Singh (200001042)
p_bbb_01 = persons[20]     # BBB trained officer
p_ccc_01 = persons[40]     # CCC trained officer
p_eee_01 = persons[80]     # EEE trained officer
p_aaa_02 = persons[1]
p_bbb_02 = persons[21]
p_ccc_02 = persons[41]

call_logs: List[Dict[str, Any]] = [
    {
        "id": "c-01",
        "shiftId": "s-01",
        "shiftExternalId": "AAA-10001",
        "siteCode": "AAA",
        "personId": p_aaa_01["id"],
        "guardExternalId": p_aaa_01["externalId"],
        "guardName": f"{p_aaa_01['firstName']} {p_aaa_01['lastName']}",
        "phone": p_aaa_01["phone"],
        "retellCallId": "call_aaa_10001_01",
        "direction": "OUTBOUND",
        "status": "COMPLETED",
        "outcome": "Tentative Accept",
        "attemptNumber": 1,
        "durationSeconds": 102,
        "eligibilityCodes": p_aaa_01["eligibilityCodes"],
        "guardActive": True,
        "timestamp": (now - timedelta(minutes=14)).strftime("%Y-%m-%d %H:%M:%S"),
        "transcript": (
            f"Guardteck Dispatch Bot: Hi, is this {p_aaa_01['firstName']}?\n"
            f"{p_aaa_01['firstName']} {p_aaa_01['lastName']}: Yeah, speaking. Who is calling?\n"
            f"Guardteck Dispatch Bot: Hi {p_aaa_01['firstName']}, this is Guardteck Dispatch Bot with Guardteck Security. We have an 8-hour shift tomorrow from 0700-1500 at Vancouver Harbour Terminal, Gate B at $32.50 CAD per hour. Are you tentatively available?\n"
            f"{p_aaa_01['firstName']} {p_aaa_01['lastName']}: Yes, 0700-1500 at Vancouver Harbour works for me. Put me down.\n"
            "Guardteck Dispatch Bot: Thank you. I have logged your tentative interest for human dispatcher approval."
        ),
        "summary": f"{p_aaa_01['firstName']} {p_aaa_01['lastName']} confirmed tentative availability for AAA-10001 (0700-1500) at Vancouver Harbour Terminal, Gate B.",
    },
    {
        "id": "c-02",
        "shiftId": "s-07",
        "shiftExternalId": "CCC-30001",
        "siteCode": "CCC",
        "personId": p_ccc_01["id"],
        "guardExternalId": p_ccc_01["externalId"],
        "guardName": f"{p_ccc_01['firstName']} {p_ccc_01['lastName']}",
        "phone": p_ccc_01["phone"],
        "retellCallId": "call_ccc_30001_01",
        "direction": "OUTBOUND",
        "status": "COMPLETED",
        "outcome": "Tentative Accept",
        "attemptNumber": 1,
        "durationSeconds": 88,
        "eligibilityCodes": p_ccc_01["eligibilityCodes"],
        "guardActive": True,
        "timestamp": (now - timedelta(minutes=9)).strftime("%Y-%m-%d %H:%M:%S"),
        "transcript": (
            f"Guardteck Dispatch Bot: Hi, is this {p_ccc_01['firstName']}?\n"
            f"{p_ccc_01['firstName']} {p_ccc_01['lastName']}: Yes, speaking.\n"
            "Guardteck Dispatch Bot: Guardteck Security has an open 8-hour shift tomorrow 0800-1600 at Victoria Inner Harbour Dock paying $34.00/hr.\n"
            f"{p_ccc_01['firstName']} {p_ccc_01['lastName']}: Yes, I can cover 0800-1600 tomorrow.\n"
            "Guardteck Dispatch Bot: Logged for dispatcher review and confirmation."
        ),
        "summary": f"{p_ccc_01['firstName']} {p_ccc_01['lastName']} accepted tentative coverage for CCC-30001 (0800-1600) at Victoria Inner Harbour Dock.",
    },
    {
        "id": "c-03",
        "shiftId": "s-13",
        "shiftExternalId": "EEE-50001",
        "siteCode": "EEE",
        "personId": p_eee_01["id"],
        "guardExternalId": p_eee_01["externalId"],
        "guardName": f"{p_eee_01['firstName']} {p_eee_01['lastName']}",
        "phone": p_eee_01["phone"],
        "retellCallId": "call_eee_50001_01",
        "direction": "OUTBOUND",
        "status": "COMPLETED",
        "outcome": "Tentative Accept",
        "attemptNumber": 1,
        "durationSeconds": 94,
        "eligibilityCodes": p_eee_01["eligibilityCodes"],
        "guardActive": True,
        "timestamp": (now - timedelta(minutes=6)).strftime("%Y-%m-%d %H:%M:%S"),
        "transcript": (
            f"Guardteck Dispatch Bot: Hello {p_eee_01['firstName']}, Guardteck Security calling about Burnaby Corporate Campus 1600-0000 tomorrow at $33.75/hr.\n"
            f"{p_eee_01['firstName']} {p_eee_01['lastName']}: Sure, submit me for the 1600-0000 shift.\n"
            "Guardteck Dispatch Bot: Submitted to dispatch for approval."
        ),
        "summary": f"{p_eee_01['firstName']} {p_eee_01['lastName']} tentatively accepted EEE-50001 (1600-0000) at Burnaby Corporate Campus.",
    },
    {
        "id": "c-04",
        "shiftId": "s-04",
        "shiftExternalId": "BBB-20001",
        "siteCode": "BBB",
        "personId": p_bbb_01["id"],
        "guardExternalId": p_bbb_01["externalId"],
        "guardName": f"{p_bbb_01['firstName']} {p_bbb_01['lastName']}",
        "phone": p_bbb_01["phone"],
        "retellCallId": "call_bbb_20001_01",
        "direction": "OUTBOUND",
        "status": "IN_PROGRESS",
        "outcome": "In Progress",
        "attemptNumber": 1,
        "durationSeconds": 84,
        "eligibilityCodes": p_bbb_01["eligibilityCodes"],
        "guardActive": True,
        "timestamp": now.strftime("%Y-%m-%d %H:%M:%S"),
        "transcript": "Active outreach call on Line 01 regarding BBB-20001 (Surrey Civic Plaza, 0700-1500).",
        "summary": "Active outreach call on Line 01.",
    },
    {
        "id": "c-05",
        "shiftId": "s-04",
        "shiftExternalId": "BBB-20001",
        "siteCode": "BBB",
        "personId": p_bbb_02["id"],
        "guardExternalId": p_bbb_02["externalId"],
        "guardName": f"{p_bbb_02['firstName']} {p_bbb_02['lastName']}",
        "phone": p_bbb_02["phone"],
        "retellCallId": "call_bbb_20001_02",
        "direction": "OUTBOUND",
        "status": "IN_PROGRESS",
        "outcome": "In Progress",
        "attemptNumber": 1,
        "durationSeconds": 47,
        "eligibilityCodes": p_bbb_02["eligibilityCodes"],
        "guardActive": True,
        "timestamp": now.strftime("%Y-%m-%d %H:%M:%S"),
        "transcript": "Active outreach call on Line 02 regarding BBB-20001 (Surrey Civic Plaza, 0700-1500).",
        "summary": "Active outreach call on Line 02.",
    },
    {
        "id": "c-06",
        "shiftId": "s-01",
        "shiftExternalId": "AAA-10001",
        "siteCode": "AAA",
        "personId": p_aaa_02["id"],
        "guardExternalId": p_aaa_02["externalId"],
        "guardName": f"{p_aaa_02['firstName']} {p_aaa_02['lastName']}",
        "phone": p_aaa_02["phone"],
        "retellCallId": "call_aaa_10001_02",
        "direction": "OUTBOUND",
        "status": "COMPLETED",
        "outcome": "Declined",
        "attemptNumber": 1,
        "durationSeconds": 28,
        "eligibilityCodes": p_aaa_02["eligibilityCodes"],
        "guardActive": True,
        "timestamp": (now - timedelta(minutes=24)).strftime("%Y-%m-%d %H:%M:%S"),
        "transcript": f"Guardteck Dispatch Bot offered AAA-10001 (0700-1500); {p_aaa_02['firstName']} {p_aaa_02['lastName']} declined due to schedule conflict.",
        "summary": "Officer declined due to prior commitment.",
    },
    {
        "id": "c-07",
        "shiftId": "s-07",
        "shiftExternalId": "CCC-30001",
        "siteCode": "CCC",
        "personId": p_ccc_02["id"],
        "guardExternalId": p_ccc_02["externalId"],
        "guardName": f"{p_ccc_02['firstName']} {p_ccc_02['lastName']}",
        "phone": p_ccc_02["phone"],
        "retellCallId": "call_ccc_30001_02",
        "direction": "OUTBOUND",
        "status": "NO_ANSWER",
        "outcome": "No Answer",
        "attemptNumber": 1,
        "durationSeconds": 30,
        "eligibilityCodes": p_ccc_02["eligibilityCodes"],
        "guardActive": True,
        "timestamp": (now - timedelta(minutes=31)).strftime("%Y-%m-%d %H:%M:%S"),
        "transcript": "[Ring Timeout 30s] No answer from candidate device.",
        "summary": "No answer after 30s ring timeout.",
    },
]

approvals: List[Dict[str, Any]] = [
    {
        "id": "appr-01",
        "callLogId": "c-01",
        "shiftId": "s-01",
        "personId": p_aaa_01["id"],
        "status": "PENDING",
        "dispatcherId": None,
        "dispatcherName": None,
        "actionTimestamp": None,
        "expiresAt": (now + timedelta(minutes=18)).isoformat(),
    },
    {
        "id": "appr-02",
        "callLogId": "c-02",
        "shiftId": "s-07",
        "personId": p_ccc_01["id"],
        "status": "PENDING",
        "dispatcherId": None,
        "dispatcherName": None,
        "actionTimestamp": None,
        "expiresAt": (now + timedelta(minutes=21)).isoformat(),
    },
    {
        "id": "appr-03",
        "callLogId": "c-03",
        "shiftId": "s-13",
        "personId": p_eee_01["id"],
        "status": "PENDING",
        "dispatcherId": None,
        "dispatcherName": None,
        "actionTimestamp": None,
        "expiresAt": (now + timedelta(minutes=24)).isoformat(),
    },
]

active_leases: Dict[int, Dict[str, Any]] = {
    1: {
        "callId": "c-04",
        "shiftId": "s-04",
        "shiftExternalId": "BBB-20001",
        "siteCode": "BBB",
        "personId": p_bbb_01["id"],
        "guardExternalId": p_bbb_01["externalId"],
        "guardName": f"{p_bbb_01['firstName']} {p_bbb_01['lastName']}",
        "durationSeconds": 84,
        "startedAt": time.time() - 84,
    },
    2: {
        "callId": "c-05",
        "shiftId": "s-04",
        "shiftExternalId": "BBB-20001",
        "siteCode": "BBB",
        "personId": p_bbb_02["id"],
        "guardExternalId": p_bbb_02["externalId"],
        "guardName": f"{p_bbb_02['firstName']} {p_bbb_02['lastName']}",
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

@app.get("/scheduling", response_class=HTMLResponse)
def page_scheduling():
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
        "sipRegion": "us-west-2",
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
        "openShiftsCount": len([s for s in shifts if s["status"] == "OPEN"]),
        "totalSites": len(SITES),
        "totalOfficers": len(persons),
        "sipRegion": "us-west-2",
    }

@app.get("/api/v1/dispatch/sites")
def get_sites():
    enriched = []
    for s in SITES:
        code = s["code"]
        trained_count = len([p for p in persons if code in p.get("trainedSites", []) and not p["dncFlag"]])
        open_count = len([sh for sh in shifts if sh["siteCode"] == code and sh["status"] == "OPEN"])
        enriched.append({
            **s,
            "trainedOfficerCount": trained_count,
            "openShiftCount": open_count,
        })
    return enriched

@app.get("/api/v1/dispatch/sites/{site_code}/trained")
def get_site_trained_officers(site_code: str):
    code = site_code.upper()
    site = SITE_MAP.get(code)
    if not site:
        raise HTTPException(status_code=404, detail="Site not found")
    officers = [p for p in persons if code in p.get("trainedSites", [])]
    return {"site": site, "totalTrained": len(officers), "officers": officers}

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
                "siteCode": lease.get("siteCode"),
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
                "siteCode": None,
                "guardExternalId": None,
                "guardName": None,
                "durationSeconds": 0,
                "callId": None,
            })
    return {"totalChannels": 5, "activeCount": len(active_leases), "lines": results}

def _calc_duration_hours(start_hhmm: str, end_hhmm: str) -> float:
    sh, sm = int(start_hhmm[:2]), int(start_hhmm[2:])
    eh, em = int(end_hhmm[:2]), int(end_hhmm[2:])
    start_m = sh * 60 + sm
    end_m = eh * 60 + em
    if end_m <= start_m:
        end_m += 24 * 60
    return round((end_m - start_m) / 60.0, 2)

@app.post("/api/v1/dashboard/shifts/{shift_id}/hours")
async def update_shift_hours(shift_id: str, req: Request):
    data = await req.json()
    shift = next((s for s in shifts if s["id"] == shift_id or s["externalId"] == shift_id), None)
    if not shift:
        raise HTTPException(status_code=404, detail="Shift not found")

    start_h = str(data.get("startHour", shift["startHour"])).replace(":", "").strip().zfill(4)
    end_h = str(data.get("endHour", shift["endHour"])).replace(":", "").strip().zfill(4)
    if len(start_h) != 4 or len(end_h) != 4 or not start_h.isdigit() or not end_h.isdigit():
        raise HTTPException(status_code=400, detail="Hours must be formatted as 4 digits (e.g. 0700 and 1500)")

    date_label = data.get("dateLabel") or shift.get("dateLabel") or tomorrow_str
    dur = data.get("durationHours")
    duration = float(dur) if dur else _calc_duration_hours(start_h, end_h)

    shift["startHour"] = start_h
    shift["endHour"] = end_h
    shift["dateLabel"] = date_label
    shift["durationHours"] = duration
    shift["timeWindow"] = f"{date_label} {start_h}-{end_h}"
    return shift

@app.post("/api/v1/dispatch/trigger")
async def trigger_dispatch(req: Request):
    data = await req.json()
    shift_id = data.get("shiftId")
    shift = next((s for s in shifts if s["id"] == shift_id or s["externalId"] == shift_id), None)
    if not shift:
        raise HTTPException(status_code=404, detail="Shift not found")

    site_code = shift["siteCode"]
    trained_candidates = [
        p for p in persons
        if site_code in p.get("trainedSites", []) and p["status"] == "ACTIVE" and not p["dncFlag"]
    ]

    if not trained_candidates:
        return {"status": "NO_CANDIDATES", "siteCode": site_code, "message": f"No active trained officers found for site {site_code}."}

    batch_ts = int(time.time() * 1000)
    shift["status"] = "OUTREACH_ACTIVE"

    calls_created: List[Dict[str, Any]] = []
    lines_assigned: List[str] = []

    for idx, officer in enumerate(trained_candidates):
        call_id = f"c-{batch_ts}-{idx + 1}"
        guard_name = f"{officer['firstName']} {officer['lastName']}"

        # Assign to an idle line if available (up to 5 active trunks)
        free_ch = next((c for c in CHANNEL_DEFS if c["index"] not in active_leases), None)
        if free_ch:
            active_leases[free_ch["index"]] = {
                "callId": call_id,
                "shiftId": shift["id"],
                "shiftExternalId": shift["externalId"],
                "siteCode": site_code,
                "personId": officer["id"],
                "guardExternalId": officer["externalId"],
                "guardName": guard_name,
                "durationSeconds": 1,
                "startedAt": time.time(),
            }
            lines_assigned.append(free_ch["lineLabel"])
            call_status = "IN_PROGRESS"
            outcome = "In Progress"
            transcript = (
                f"Active call on {free_ch['lineLabel']} for {shift['externalId']} ({site_code}) "
                f"offering shift hours {shift['timeWindow']} ({shift['durationHours']} hrs) at ${shift['payRateHourly']:.2f}/hr."
            )
        else:
            call_status = "SCHEDULED"
            outcome = "Queued"
            transcript = (
                f"Queued in {site_code} site dispatch batch for {shift['externalId']} "
                f"({shift['timeWindow']}, ${shift['payRateHourly']:.2f}/hr)."
            )

        record = {
            "id": call_id,
            "shiftId": shift["id"],
            "shiftExternalId": shift["externalId"],
            "siteCode": site_code,
            "personId": officer["id"],
            "guardExternalId": officer["externalId"],
            "guardName": guard_name,
            "phone": officer["phone"],
            "retellCallId": f"call_{batch_ts}_{idx + 1}",
            "direction": "OUTBOUND",
            "status": call_status,
            "outcome": outcome,
            "attemptNumber": 1,
            "durationSeconds": 1 if free_ch else 0,
            "eligibilityCodes": officer.get("eligibilityCodes", ["ST"]),
            "guardActive": officer["guardActive"],
            "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "transcript": transcript,
            "summary": f"Outreach for site {site_code} ({shift['timeWindow']}) to {guard_name} ({officer['externalId']}).",
        }
        call_logs.insert(0, record)
        calls_created.append({
            "guardExternalId": officer["externalId"],
            "guardName": guard_name,
            "status": outcome,
        })

    return {
        "status": "INITIATED",
        "siteCode": site_code,
        "shiftExternalId": shift["externalId"],
        "timeWindow": shift["timeWindow"],
        "totalTrainedContacted": len(calls_created),
        "activeLinesAssigned": lines_assigned,
        "queuedCount": len(calls_created) - len(lines_assigned),
        "calls": calls_created,
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
    print(f"Routes: /login, /, /scheduling, /queue, /records")
    print(f"================================================================================")
    uvicorn.run("server:app", host="0.0.0.0", port=port, reload=False)
