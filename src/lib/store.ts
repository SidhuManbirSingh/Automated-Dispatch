import { logger } from "./logger";

export interface SiteConfig {
  code: string;
  name: string;
  region: string;
  colorBg: string;
  colorText: string;
  colorBorder: string;
}

export interface MockPerson {
  id: string;
  externalId: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  region: string;
  trainedSites: string[];
  equipmentTypes: string[];
  status: "ACTIVE" | "INACTIVE" | "SUSPENDED" | "DNC_DO_NOT_CALL";
  dncFlag: boolean;
  eligibilityCodes: string[];
  guardActive: boolean;
  dncReason?: string | null;
  dncTimestamp?: Date | null;
  reliabilityScore: number;
  totalShiftsCompleted: number;
}

export interface MockShift {
  id: string;
  externalId: string;
  siteCode: string;
  siteLocation: string;
  dateLabel: string;
  startHour: string;
  endHour: string;
  timeWindow: string;
  shiftDate: Date;
  startTime: Date;
  endTime: Date;
  durationHours: number;
  pickupLocation: string;
  dropoffLocation: string;
  equipmentType: string;
  requiredEligibility: string[];
  payRateHourly: number;
  priority: number;
  status:
    | "OPEN"
    | "OUTREACH_ACTIVE"
    | "DISPATCH_IN_PROGRESS"
    | "PENDING_APPROVAL"
    | "PENDING_DISPATCHER_APPROVAL"
    | "ASSIGNED"
    | "IN_PROGRESS"
    | "COMPLETED"
    | "CANCELLED";
  version: number;
}

export interface MockCallLog {
  id: string;
  shiftId: string;
  shiftExternalId: string;
  siteCode: string;
  personId: string;
  guardExternalId: string;
  guardName: string;
  phone: string;
  retellCallId: string;
  direction: "OUTBOUND" | "INBOUND";
  status: "SCHEDULED" | "INITIATED" | "RINGING" | "IN_PROGRESS" | "COMPLETED" | "FAILED" | "NO_ANSWER" | "VOICEMAIL" | "BUSY";
  outcome?: string;
  attemptNumber: number;
  maxAttempts: number;
  durationSeconds: number;
  eligibilityCodes: string[];
  guardActive: boolean;
  timestamp: string;
  transcript?: string;
  summary?: string;
  sentimentScore?: number;
  costUsd?: number;
  createdAt: Date;
}

export interface MockApprovalQueue {
  id: string;
  callLogId: string;
  shiftId: string;
  personId: string;
  status: "PENDING" | "APPROVED" | "REJECTED" | "DECLINED" | "EXPIRED" | "CANCELLED_BY_SYSTEM";
  dispatcherId?: string | null;
  dispatcherName?: string | null;
  dispatcherNotes?: string | null;
  actionTimestamp?: Date | null;
  expiresAt: Date;
  calendarEventId?: string | null;
  emailMessageId?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ChannelDef {
  index: number;
  lineLabel: string;
  region: string;
  phone: string;
}

export interface ActiveLease {
  callId: string;
  shiftId: string;
  shiftExternalId: string;
  siteCode: string;
  personId: string;
  guardExternalId: string;
  guardName: string;
  durationSeconds: number;
  startedAt: number;
}

export const SITES_CONFIG: SiteConfig[] = [
  { code: "AAA", name: "Vancouver Harbour Terminal, Gate B", region: "Vancouver", colorBg: "#e0f2fe", colorText: "#0369a1", colorBorder: "#bae6fd" },
  { code: "BBB", name: "Surrey Civic Plaza, Security Desk", region: "Surrey", colorBg: "#d1fae5", colorText: "#065f46", colorBorder: "#a7f3d0" },
  { code: "CCC", name: "Victoria Inner Harbour Dock", region: "Victoria", colorBg: "#ede9fe", colorText: "#5b21b6", colorBorder: "#ddd6fe" },
  { code: "DDD", name: "Kelowna Regional Health Campus", region: "Kelowna", colorBg: "#fef3c7", colorText: "#92400e", colorBorder: "#fde68a" },
  { code: "EEE", name: "Burnaby Corporate Campus, Tower A", region: "Burnaby", colorBg: "#ffe4e6", colorText: "#9f1239", colorBorder: "#fecdd3" },
  { code: "FFF", name: "New Westminster Transit Concierge", region: "New Westminster", colorBg: "#e2e8f0", colorText: "#1e293b", colorBorder: "#cbd5e1" },
];

export const CHANNEL_DEFS: ChannelDef[] = [
  { index: 1, lineLabel: "Line 01", region: "VAN", phone: "+18885550101" },
  { index: 2, lineLabel: "Line 02", region: "VAN", phone: "+18885550102" },
  { index: 3, lineLabel: "Line 03", region: "VAN", phone: "+18885550103" },
  { index: 4, lineLabel: "Line 04", region: "VAN", phone: "+18885550104" },
  { index: 5, lineLabel: "Line 05", region: "VAN", phone: "+18885550105" },
];

const FIRST_NAMES = [
  "Manbir", "Elena", "David", "Claire", "Robert", "Priya", "Hannah", "Lucas",
  "Nathan", "Sofia", "Ethan", "Maya", "Owen", "Chloe", "Liam", "Zoe",
  "Caleb", "Nora", "Daniel", "Grace", "Noah", "Amara", "Isaac", "Leah",
];
const LAST_NAMES = [
  "Singh", "Reyes", "Chen", "Bennett", "Kowalski", "Nair", "Morales", "Patel",
  "Brooks", "Kim", "Gill", "Fraser", "Dhillon", "Mercer", "Nguyen", "Bains",
  "Foster", "Kaur", "Reid", "Campbell", "Sidhu", "Hussain", "Grewal", "Park",
];
const ELIG_POOLS = [
  ["ST", "OFA1"],
  ["ST", "OFA2"],
  ["ST", "OFA1", "OFA2"],
  ["ST", "OFA1"],
  ["OFA1", "OFA2"],
];
const AREA_CODES: Record<string, string> = {
  Vancouver: "604",
  Surrey: "604",
  Victoria: "250",
  Kelowna: "250",
  Burnaby: "778",
  "New Westminster": "604",
};

function generateRoster(): MockPerson[] {
  const list: MockPerson[] = [];
  let emp = 200001042;
  SITES_CONFIG.forEach((site, sIdx) => {
    const area = AREA_CODES[site.region] || "604";
    const nextSite = SITES_CONFIG[(sIdx + 1) % SITES_CONFIG.length]!.code;
    for (let i = 0; i < 20; i++) {
      const isFirst = sIdx === 0 && i === 0;
      const firstName = isFirst ? "Manbir" : FIRST_NAMES[(sIdx * 5 + i) % FIRST_NAMES.length]!;
      const lastName = isFirst ? "Singh" : LAST_NAMES[(sIdx * 7 + i * 3) % LAST_NAMES.length]!;
      const email = isFirst ? "m.sidhu412@guardteck.com" : `${firstName.toLowerCase()}.${lastName.toLowerCase()}.${emp}@guardteck.com`;
      const suffix = String(1000 + sIdx * 100 + i).slice(-4);
      const trainedSites = i % 4 !== 0 ? [site.code] : [site.code, nextSite];
      list.push({
        id: `p-${sIdx + 1}-${String(i + 1).padStart(2, "0")}`,
        externalId: String(emp),
        firstName,
        lastName,
        phone: `+1${area}555${suffix}`,
        email,
        region: site.region,
        trainedSites,
        equipmentTypes: ["PATROL_VEHICLE", "SITE_ACCESS"],
        status: "ACTIVE",
        dncFlag: false,
        eligibilityCodes: ELIG_POOLS[(sIdx + i) % ELIG_POOLS.length]!,
        guardActive: true,
        reliabilityScore: Number((0.88 + (i % 11) * 0.01).toFixed(2)),
        totalShiftsCompleted: 35 + ((sIdx * 17 + i * 9) % 120),
      });
      emp++;
    }
  });

  // Add Marcus Vance as DNC sample officer (200001162) -> 121 total officers
  list.push({
    id: "p-dnc-01",
    externalId: String(emp),
    firstName: "Marcus",
    lastName: "Vance",
    phone: "+17785559919",
    email: "marcus.vance@guardteck.com",
    region: "Burnaby",
    trainedSites: ["FFF"],
    equipmentTypes: ["SITE_ACCESS"],
    status: "DNC_DO_NOT_CALL",
    dncFlag: true,
    dncReason: "Requested DNC opt-out via previous automated outreach",
    eligibilityCodes: ["ST"],
    guardActive: false,
    reliabilityScore: 0.81,
    totalShiftsCompleted: 30,
  });

  return list;
}

const SHIFT_WINDOWS: Array<{ start: string; end: string }> = [
  { start: "0700", end: "1500" },
  { start: "0800", end: "1600" },
  { start: "1500", end: "2300" },
  { start: "1600", end: "0000" },
  { start: "0000", end: "0800" },
];

const SITE_ROLES: Record<string, string[]> = {
  AAA: ["Patrol Vehicle (Class 5)", "Gate & Perimeter Patrol", "Gate & Terminal Security"],
  BBB: ["Site Access & CCTV Monitor", "Civic Concierge Officer", "Evening Security Desk"],
  CCC: ["Mobile Patrol Unit", "Harbour Dock Patrol", "Night Dock Watch"],
  DDD: ["Hospital Campus Security", "Campus Triage Support", "Day Security Lead"],
  EEE: ["Concierge & Access Control", "Lobby & Badge Desk", "Corporate Tower Patrol"],
  FFF: ["Transit Patrol Officer", "Platform Safety Officer", "Evening Transit Concierge"],
};

const SITE_BASE_PAY: Record<string, number> = {
  AAA: 32.5,
  BBB: 35.5,
  CCC: 34.0,
  DDD: 33.0,
  EEE: 33.75,
  FFF: 35.0,
};

function formatLocalDate(date: Date): string {
  const yr = date.getFullYear();
  const mo = String(date.getMonth() + 1).padStart(2, "0");
  const dy = String(date.getDate()).padStart(2, "0");
  return `${yr}-${mo}-${dy}`;
}

function buildTimestampsForWindow(dayOffset: number, startHour: string): {
  dateLabel: string;
  shiftDate: Date;
  startTime: Date;
  endTime: Date;
} {
  const base = new Date();
  base.setHours(0, 0, 0, 0);
  base.setDate(base.getDate() + dayOffset);
  const dateLabel = formatLocalDate(base);
  const sh = Number(startHour.slice(0, 2));
  const sm = Number(startHour.slice(2, 4));
  const startTime = new Date(base);
  startTime.setHours(sh, sm, 0, 0);
  const endTime = new Date(startTime.getTime() + 8 * 3600 * 1000);
  return { dateLabel, shiftDate: base, startTime, endTime };
}

function generateFiftyShifts(): MockShift[] {
  const result: MockShift[] = [];

  // First 18 shifts: 3 per site (s-01..s-18) matching canonical IDs and statuses
  const initialPlan: Array<{
    siteIdx: number;
    seq: number;
    dayOffset: number;
    winIdx: number;
    status: MockShift["status"];
    payOffset: number;
    priority: number;
  }> = [
    // Site AAA (s-01..s-03)
    { siteIdx: 0, seq: 1, dayOffset: 1, winIdx: 0, status: "PENDING_APPROVAL", payOffset: 0.0, priority: 2 },
    { siteIdx: 0, seq: 2, dayOffset: 1, winIdx: 1, status: "OPEN", payOffset: 0.0, priority: 3 },
    { siteIdx: 0, seq: 3, dayOffset: 1, winIdx: 2, status: "OPEN", payOffset: 0.75, priority: 2 },
    // Site BBB (s-04..s-06)
    { siteIdx: 1, seq: 1, dayOffset: 1, winIdx: 0, status: "OUTREACH_ACTIVE", payOffset: 0.5, priority: 3 },
    { siteIdx: 1, seq: 2, dayOffset: 1, winIdx: 1, status: "OPEN", payOffset: 0.0, priority: 2 },
    { siteIdx: 1, seq: 3, dayOffset: 1, winIdx: 3, status: "OPEN", payOffset: 0.75, priority: 1 },
    // Site CCC (s-07..s-09)
    { siteIdx: 2, seq: 1, dayOffset: 1, winIdx: 1, status: "PENDING_APPROVAL", payOffset: 0.0, priority: 2 },
    { siteIdx: 2, seq: 2, dayOffset: 1, winIdx: 0, status: "OPEN", payOffset: 0.0, priority: 2 },
    { siteIdx: 2, seq: 3, dayOffset: 2, winIdx: 4, status: "OPEN", payOffset: 1.0, priority: 1 },
    // Site DDD (s-10..s-12)
    { siteIdx: 3, seq: 1, dayOffset: 1, winIdx: 0, status: "ASSIGNED", payOffset: 0.0, priority: 3 },
    { siteIdx: 3, seq: 2, dayOffset: 1, winIdx: 2, status: "OPEN", payOffset: 0.5, priority: 2 },
    { siteIdx: 3, seq: 3, dayOffset: 2, winIdx: 1, status: "OPEN", payOffset: -2.0, priority: 1 },
    // Site EEE (s-13..s-15)
    { siteIdx: 4, seq: 1, dayOffset: 1, winIdx: 3, status: "PENDING_APPROVAL", payOffset: 0.0, priority: 2 },
    { siteIdx: 4, seq: 2, dayOffset: 1, winIdx: 0, status: "OPEN", payOffset: 0.0, priority: 2 },
    { siteIdx: 4, seq: 3, dayOffset: 1, winIdx: 1, status: "OPEN", payOffset: 0.5, priority: 1 },
    // Site FFF (s-16..s-18)
    { siteIdx: 5, seq: 1, dayOffset: 1, winIdx: 0, status: "OPEN", payOffset: 0.0, priority: 3 },
    { siteIdx: 5, seq: 2, dayOffset: 1, winIdx: 1, status: "OPEN", payOffset: 0.0, priority: 2 },
    { siteIdx: 5, seq: 3, dayOffset: 1, winIdx: 2, status: "OPEN", payOffset: 0.5, priority: 1 },
  ];

  let shiftNum = 1;
  for (const item of initialPlan) {
    const site = SITES_CONFIG[item.siteIdx]!;
    const win = SHIFT_WINDOWS[item.winIdx]!;
    const ts = buildTimestampsForWindow(item.dayOffset, win.start);
    const roles = SITE_ROLES[site.code]!;
    const jobNumber = (item.siteIdx + 1) * 10000 + item.seq;

    result.push({
      id: `s-${String(shiftNum).padStart(2, "0")}`,
      externalId: `${site.code}-${jobNumber}`,
      siteCode: site.code,
      siteLocation: site.name,
      dateLabel: ts.dateLabel,
      startHour: win.start,
      endHour: win.end,
      timeWindow: `${ts.dateLabel} ${win.start}-${win.end}`,
      shiftDate: ts.shiftDate,
      startTime: ts.startTime,
      endTime: ts.endTime,
      durationHours: 8.0,
      pickupLocation: site.name,
      dropoffLocation: site.name,
      equipmentType: roles[(item.seq - 1) % roles.length]!,
      requiredEligibility: ELIG_POOLS[(item.siteIdx + item.seq) % ELIG_POOLS.length]!,
      payRateHourly: Number(((SITE_BASE_PAY[site.code] || 33.0) + item.payOffset).toFixed(2)),
      priority: item.priority,
      status: item.status,
      version: 1,
    });
    shiftNum++;
  }

  // Remaining 32 shifts across days 2..7 -> total 50 shifts (AAA=9, BBB=9, CCC=8, DDD=8, EEE=8, FFF=8)
  const extraCounts = [6, 6, 5, 5, 5, 5]; // sum = 32 -> total = 50
  for (let siteIdx = 0; siteIdx < SITES_CONFIG.length; siteIdx++) {
    const site = SITES_CONFIG[siteIdx]!;
    const roles = SITE_ROLES[site.code]!;
    const extraTotal = extraCounts[siteIdx]!;
    for (let k = 0; k < extraTotal; k++) {
      const seq = 4 + k;
      const dayOffset = 2 + (k % 6); // Days 2..7
      const win = SHIFT_WINDOWS[(siteIdx + k) % SHIFT_WINDOWS.length]!;
      const ts = buildTimestampsForWindow(dayOffset, win.start);
      const jobNumber = (siteIdx + 1) * 10000 + seq;
      result.push({
        id: `s-${String(shiftNum).padStart(2, "0")}`,
        externalId: `${site.code}-${jobNumber}`,
        siteCode: site.code,
        siteLocation: site.name,
        dateLabel: ts.dateLabel,
        startHour: win.start,
        endHour: win.end,
        timeWindow: `${ts.dateLabel} ${win.start}-${win.end}`,
        shiftDate: ts.shiftDate,
        startTime: ts.startTime,
        endTime: ts.endTime,
        durationHours: 8.0,
        pickupLocation: site.name,
        dropoffLocation: site.name,
        equipmentType: roles[k % roles.length]!,
        requiredEligibility: ELIG_POOLS[(siteIdx + k) % ELIG_POOLS.length]!,
        payRateHourly: Number(((SITE_BASE_PAY[site.code] || 33.0) + (k % 3) * 0.5).toFixed(2)),
        priority: (k % 3) + 1,
        status: "OPEN",
        version: 1,
      });
      shiftNum++;
    }
  }

  return result;
}

function formatSqlTs(date: Date): string {
  return date.toISOString().replace("T", " ").slice(0, 19);
}

export class InMemoryStore {
  public sites: SiteConfig[] = SITES_CONFIG;
  public persons: MockPerson[] = generateRoster();
  public shifts: MockShift[] = generateFiftyShifts();
  public callLogs: MockCallLog[] = [];
  public approvals: MockApprovalQueue[] = [];
  public activeLeases: Map<number, ActiveLease> = new Map();

  constructor() {
    const now = new Date();
    const pAaa01 = this.persons[0]!; // Manbir Singh (200001042)
    const pAaa02 = this.persons[1]!;
    const pBbb01 = this.persons[20]!;
    const pBbb02 = this.persons[21]!;
    const pCcc01 = this.persons[40]!;
    const pCcc02 = this.persons[41]!;
    const pEee01 = this.persons[80]!;

    this.callLogs = [
      {
        id: "c-01",
        shiftId: "s-01",
        shiftExternalId: "AAA-10001",
        siteCode: "AAA",
        personId: pAaa01.id,
        guardExternalId: pAaa01.externalId,
        guardName: `${pAaa01.firstName} ${pAaa01.lastName}`,
        phone: pAaa01.phone,
        retellCallId: "call_aaa_10001_01",
        direction: "OUTBOUND",
        status: "COMPLETED",
        outcome: "Tentative Accept",
        attemptNumber: 1,
        maxAttempts: 3,
        durationSeconds: 102,
        eligibilityCodes: pAaa01.eligibilityCodes,
        guardActive: true,
        timestamp: formatSqlTs(new Date(now.getTime() - 14 * 60000)),
        transcript:
          `Guardteck Dispatch Bot: Hi, is this ${pAaa01.firstName}?\n` +
          `${pAaa01.firstName} ${pAaa01.lastName}: Yeah, speaking. Who is calling?\n` +
          `Guardteck Dispatch Bot: Hi ${pAaa01.firstName}, this is Guardteck Dispatch Bot with Guardteck Security. We have an 8-hour shift tomorrow from 0700-1500 at Vancouver Harbour Terminal, Gate B at $32.50 CAD per hour. Are you tentatively available?\n` +
          `${pAaa01.firstName} ${pAaa01.lastName}: Yes, 0700-1500 at Vancouver Harbour works for me. Put me down.\n` +
          "Guardteck Dispatch Bot: Thank you. I have logged your tentative interest for human dispatcher approval.",
        sentimentScore: 0.85,
        summary: `${pAaa01.firstName} ${pAaa01.lastName} confirmed tentative availability for AAA-10001 (0700-1500) at Vancouver Harbour Terminal, Gate B.`,
        costUsd: 0.174,
        createdAt: new Date(now.getTime() - 14 * 60000),
      },
      {
        id: "c-02",
        shiftId: "s-07",
        shiftExternalId: "CCC-30001",
        siteCode: "CCC",
        personId: pCcc01.id,
        guardExternalId: pCcc01.externalId,
        guardName: `${pCcc01.firstName} ${pCcc01.lastName}`,
        phone: pCcc01.phone,
        retellCallId: "call_ccc_30001_01",
        direction: "OUTBOUND",
        status: "COMPLETED",
        outcome: "Tentative Accept",
        attemptNumber: 1,
        maxAttempts: 3,
        durationSeconds: 88,
        eligibilityCodes: pCcc01.eligibilityCodes,
        guardActive: true,
        timestamp: formatSqlTs(new Date(now.getTime() - 9 * 60000)),
        transcript:
          `Guardteck Dispatch Bot: Hi, is this ${pCcc01.firstName}?\n` +
          `${pCcc01.firstName} ${pCcc01.lastName}: Yes, speaking.\n` +
          "Guardteck Dispatch Bot: Guardteck Security has an open 8-hour shift tomorrow 0800-1600 at Victoria Inner Harbour Dock paying $34.00/hr.\n" +
          `${pCcc01.firstName} ${pCcc01.lastName}: Yes, I can cover 0800-1600 tomorrow.\n` +
          "Guardteck Dispatch Bot: Logged for dispatcher review and confirmation.",
        sentimentScore: 0.82,
        summary: `${pCcc01.firstName} ${pCcc01.lastName} accepted tentative coverage for CCC-30001 (0800-1600) at Victoria Inner Harbour Dock.`,
        costUsd: 0.15,
        createdAt: new Date(now.getTime() - 9 * 60000),
      },
      {
        id: "c-03",
        shiftId: "s-13",
        shiftExternalId: "EEE-50001",
        siteCode: "EEE",
        personId: pEee01.id,
        guardExternalId: pEee01.externalId,
        guardName: `${pEee01.firstName} ${pEee01.lastName}`,
        phone: pEee01.phone,
        retellCallId: "call_eee_50001_01",
        direction: "OUTBOUND",
        status: "COMPLETED",
        outcome: "Tentative Accept",
        attemptNumber: 1,
        maxAttempts: 3,
        durationSeconds: 94,
        eligibilityCodes: pEee01.eligibilityCodes,
        guardActive: true,
        timestamp: formatSqlTs(new Date(now.getTime() - 6 * 60000)),
        transcript:
          `Guardteck Dispatch Bot: Hello ${pEee01.firstName}, Guardteck Security calling about Burnaby Corporate Campus 1600-0000 tomorrow at $33.75/hr.\n` +
          `${pEee01.firstName} ${pEee01.lastName}: Sure, submit me for the 1600-0000 shift.\n` +
          "Guardteck Dispatch Bot: Submitted to dispatch for approval.",
        sentimentScore: 0.8,
        summary: `${pEee01.firstName} ${pEee01.lastName} tentatively accepted EEE-50001 (1600-0000) at Burnaby Corporate Campus.`,
        costUsd: 0.16,
        createdAt: new Date(now.getTime() - 6 * 60000),
      },
      {
        id: "c-04",
        shiftId: "s-04",
        shiftExternalId: "BBB-20001",
        siteCode: "BBB",
        personId: pBbb01.id,
        guardExternalId: pBbb01.externalId,
        guardName: `${pBbb01.firstName} ${pBbb01.lastName}`,
        phone: pBbb01.phone,
        retellCallId: "call_bbb_20001_01",
        direction: "OUTBOUND",
        status: "IN_PROGRESS",
        outcome: "In Progress",
        attemptNumber: 1,
        maxAttempts: 3,
        durationSeconds: 84,
        eligibilityCodes: pBbb01.eligibilityCodes,
        guardActive: true,
        timestamp: formatSqlTs(now),
        transcript: "Active outreach call on Line 01 regarding BBB-20001 (Surrey Civic Plaza, 0700-1500).",
        summary: "Active outreach call on Line 01.",
        costUsd: 0.12,
        createdAt: now,
      },
      {
        id: "c-05",
        shiftId: "s-04",
        shiftExternalId: "BBB-20001",
        siteCode: "BBB",
        personId: pBbb02.id,
        guardExternalId: pBbb02.externalId,
        guardName: `${pBbb02.firstName} ${pBbb02.lastName}`,
        phone: pBbb02.phone,
        retellCallId: "call_bbb_20001_02",
        direction: "OUTBOUND",
        status: "IN_PROGRESS",
        outcome: "In Progress",
        attemptNumber: 1,
        maxAttempts: 3,
        durationSeconds: 47,
        eligibilityCodes: pBbb02.eligibilityCodes,
        guardActive: true,
        timestamp: formatSqlTs(now),
        transcript: "Active outreach call on Line 02 regarding BBB-20001 (Surrey Civic Plaza, 0700-1500).",
        summary: "Active outreach call on Line 02.",
        costUsd: 0.08,
        createdAt: now,
      },
      {
        id: "c-06",
        shiftId: "s-01",
        shiftExternalId: "AAA-10001",
        siteCode: "AAA",
        personId: pAaa02.id,
        guardExternalId: pAaa02.externalId,
        guardName: `${pAaa02.firstName} ${pAaa02.lastName}`,
        phone: pAaa02.phone,
        retellCallId: "call_aaa_10001_02",
        direction: "OUTBOUND",
        status: "COMPLETED",
        outcome: "Declined",
        attemptNumber: 1,
        maxAttempts: 3,
        durationSeconds: 28,
        eligibilityCodes: pAaa02.eligibilityCodes,
        guardActive: true,
        timestamp: formatSqlTs(new Date(now.getTime() - 24 * 60000)),
        transcript: `Guardteck Dispatch Bot offered AAA-10001 (0700-1500); ${pAaa02.firstName} ${pAaa02.lastName} declined due to schedule conflict.`,
        summary: "Officer declined due to prior commitment.",
        costUsd: 0.05,
        createdAt: new Date(now.getTime() - 24 * 60000),
      },
      {
        id: "c-07",
        shiftId: "s-07",
        shiftExternalId: "CCC-30001",
        siteCode: "CCC",
        personId: pCcc02.id,
        guardExternalId: pCcc02.externalId,
        guardName: `${pCcc02.firstName} ${pCcc02.lastName}`,
        phone: pCcc02.phone,
        retellCallId: "call_ccc_30001_02",
        direction: "OUTBOUND",
        status: "NO_ANSWER",
        outcome: "No Answer",
        attemptNumber: 1,
        maxAttempts: 3,
        durationSeconds: 30,
        eligibilityCodes: pCcc02.eligibilityCodes,
        guardActive: true,
        timestamp: formatSqlTs(new Date(now.getTime() - 31 * 60000)),
        transcript: "[Ring Timeout 30s] No answer from candidate device.",
        summary: "No answer after 30s ring timeout.",
        costUsd: 0.02,
        createdAt: new Date(now.getTime() - 31 * 60000),
      },
    ];

    this.approvals = [
      {
        id: "appr-01",
        callLogId: "c-01",
        shiftId: "s-01",
        personId: pAaa01.id,
        status: "PENDING",
        expiresAt: new Date(now.getTime() + 18 * 60000),
        createdAt: now,
        updatedAt: now,
      },
      {
        id: "appr-02",
        callLogId: "c-02",
        shiftId: "s-07",
        personId: pCcc01.id,
        status: "PENDING",
        expiresAt: new Date(now.getTime() + 21 * 60000),
        createdAt: now,
        updatedAt: now,
      },
      {
        id: "appr-03",
        callLogId: "c-03",
        shiftId: "s-13",
        personId: pEee01.id,
        status: "PENDING",
        expiresAt: new Date(now.getTime() + 24 * 60000),
        createdAt: now,
        updatedAt: now,
      },
    ];

    const nowEpoch = Date.now() / 1000;
    this.activeLeases.set(1, {
      callId: "c-04",
      shiftId: "s-04",
      shiftExternalId: "BBB-20001",
      siteCode: "BBB",
      personId: pBbb01.id,
      guardExternalId: pBbb01.externalId,
      guardName: `${pBbb01.firstName} ${pBbb01.lastName}`,
      durationSeconds: 84,
      startedAt: nowEpoch - 84,
    });
    this.activeLeases.set(2, {
      callId: "c-05",
      shiftId: "s-04",
      shiftExternalId: "BBB-20001",
      siteCode: "BBB",
      personId: pBbb02.id,
      guardExternalId: pBbb02.externalId,
      guardName: `${pBbb02.firstName} ${pBbb02.lastName}`,
      durationSeconds: 47,
      startedAt: nowEpoch - 47,
    });

    logger.info(
      { totalOfficers: this.persons.length, totalShifts: this.shifts.length },
      "In-Memory Store initialized with Phase 2 dataset (6 sites, 121 officers, 50 shifts)"
    );
  }

  public getShift(shiftId: string): MockShift | undefined {
    return this.shifts.find((s) => s.id === shiftId || s.externalId === shiftId);
  }

  public getPerson(personId: string): MockPerson | undefined {
    return this.persons.find((p) => p.id === personId || p.externalId === personId);
  }

  public getEligiblePersons(_equipmentType?: string, limit: number = 25): MockPerson[] {
    return this.persons
      .filter((p) => p.status === "ACTIVE" && !p.dncFlag)
      .slice(0, limit);
  }

  public addCallLog(log: MockCallLog): void {
    this.callLogs.unshift(log);
  }

  public addApproval(appr: MockApprovalQueue): void {
    this.approvals.unshift(appr);
  }

  public getActiveLineCount(): number {
    return this.activeLeases.size;
  }

  public allocateIdleLine(lease: Omit<ActiveLease, "startedAt">): { channelIndex: number; lineLabel: string } | null {
    const free = CHANNEL_DEFS.find((ch) => !this.activeLeases.has(ch.index));
    if (!free) return null;
    this.activeLeases.set(free.index, {
      ...lease,
      startedAt: Date.now() / 1000,
    });
    return { channelIndex: free.index, lineLabel: free.lineLabel };
  }

  public releaseLineByCallId(callId: string): number | null {
    for (const [idx, lease] of this.activeLeases.entries()) {
      if (lease.callId === callId) {
        this.activeLeases.delete(idx);
        return idx;
      }
    }
    return null;
  }

  public releaseLinesForShift(shiftId: string): void {
    for (const [idx, lease] of this.activeLeases.entries()) {
      if (lease.shiftId === shiftId || lease.shiftExternalId === shiftId) {
        this.activeLeases.delete(idx);
      }
    }
  }

  public getLinesPayload() {
    const nowEpoch = Date.now() / 1000;
    const lines = CHANNEL_DEFS.map((ch) => {
      const lease = this.activeLeases.get(ch.index);
      if (lease) {
        const elapsed = Math.max(1, Math.floor(nowEpoch - lease.startedAt));
        return {
          channelIndex: ch.index,
          lineLabel: ch.lineLabel,
          status: "Busy",
          regionServed: ch.region,
          allocatedPhoneNumber: ch.phone,
          shiftId: lease.shiftId,
          shiftExternalId: lease.shiftExternalId,
          siteCode: lease.siteCode,
          guardExternalId: lease.guardExternalId,
          guardName: lease.guardName,
          durationSeconds: elapsed,
          callId: lease.callId,
        };
      }
      return {
        channelIndex: ch.index,
        lineLabel: ch.lineLabel,
        status: "Idle",
        regionServed: ch.region,
        allocatedPhoneNumber: ch.phone,
        shiftId: null,
        shiftExternalId: null,
        siteCode: null,
        guardExternalId: null,
        guardName: null,
        durationSeconds: 0,
        callId: null,
      };
    });

    return {
      totalChannels: 5,
      activeCount: this.activeLeases.size,
      lines,
    };
  }
}

export const inMemoryStore = new InMemoryStore();
