import { logger } from "./logger";

export interface MockPerson {
  id: string;
  externalId: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  region: string;
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
  siteLocation: string;
  timeWindow: string;
  shiftDate: Date;
  startTime: Date;
  endTime: Date;
  durationHours: number;
  pickupLocation: string;
  dropoffLocation: string;
  equipmentType: string;
  payRateHourly: number;
  priority: number;
  status: "OPEN" | "OUTREACH_ACTIVE" | "DISPATCH_IN_PROGRESS" | "PENDING_APPROVAL" | "PENDING_DISPATCHER_APPROVAL" | "ASSIGNED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
  version: number;
}

export interface MockCallLog {
  id: string;
  shiftId: string;
  shiftExternalId: string;
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

export class InMemoryStore {
  public persons: MockPerson[] = [
    {
      id: "p-01",
      externalId: "200001042",
      firstName: "Manbir",
      lastName: "Singh",
      phone: "+16045550198",
      email: "m.sidhu412@guardteck.com",
      region: "Vancouver",
      equipmentTypes: ["PATROL_VEHICLE", "SITE_ACCESS"],
      status: "ACTIVE",
      dncFlag: false,
      eligibilityCodes: ["ST", "OFA1"],
      guardActive: true,
      reliabilityScore: 0.98,
      totalShiftsCompleted: 142,
    },
    {
      id: "p-02",
      externalId: "200001043",
      firstName: "Elena",
      lastName: "Reyes",
      phone: "+16045550144",
      email: "elena.reyes@guardteck.com",
      region: "Surrey",
      equipmentTypes: ["CONCIERGE", "SITE_ACCESS"],
      status: "ACTIVE",
      dncFlag: false,
      eligibilityCodes: ["ST", "OFA2"],
      guardActive: true,
      reliabilityScore: 0.95,
      totalShiftsCompleted: 98,
    },
    {
      id: "p-03",
      externalId: "200001044",
      firstName: "David",
      lastName: "Chen",
      phone: "+12505550188",
      email: "david.chen@guardteck.com",
      region: "Victoria",
      equipmentTypes: ["PATROL_VEHICLE"],
      status: "ACTIVE",
      dncFlag: false,
      eligibilityCodes: ["ST", "OFA1", "OFA2"],
      guardActive: true,
      reliabilityScore: 0.92,
      totalShiftsCompleted: 76,
    },
    {
      id: "p-04",
      externalId: "200001045",
      firstName: "Claire",
      lastName: "Bennett",
      phone: "+12505550162",
      email: "claire.bennett@guardteck.com",
      region: "Kelowna",
      equipmentTypes: ["SITE_ACCESS", "CONCIERGE"],
      status: "ACTIVE",
      dncFlag: false,
      eligibilityCodes: ["OFA1"],
      guardActive: true,
      reliabilityScore: 0.94,
      totalShiftsCompleted: 64,
    },
    {
      id: "p-05",
      externalId: "200001046",
      firstName: "Robert",
      lastName: "Kowalski",
      phone: "+16045550173",
      email: "robert.kowalski@guardteck.com",
      region: "Burnaby",
      equipmentTypes: ["PATROL_VEHICLE", "CONCIERGE"],
      status: "ACTIVE",
      dncFlag: false,
      eligibilityCodes: ["ST", "OFA1"],
      guardActive: true,
      reliabilityScore: 0.96,
      totalShiftsCompleted: 110,
    },
    {
      id: "p-06",
      externalId: "200001047",
      firstName: "Priya",
      lastName: "Nair",
      phone: "+17785550134",
      email: "priya.nair@guardteck.com",
      region: "Vancouver",
      equipmentTypes: ["SITE_ACCESS"],
      status: "ACTIVE",
      dncFlag: false,
      eligibilityCodes: ["OFA2"],
      guardActive: true,
      reliabilityScore: 0.97,
      totalShiftsCompleted: 88,
    },
  ];

  public shifts: MockShift[] = [
    {
      id: "s-01",
      externalId: "AAA-10001",
      siteLocation: "Vancouver Harbour Terminal, Gate B",
      timeWindow: "2026-11-19 06:00 - 14:00 PST",
      shiftDate: new Date(Date.now() + 86400000),
      startTime: new Date(Date.now() + 86400000),
      endTime: new Date(Date.now() + 86400000 + 8 * 3600000),
      durationHours: 8.0,
      pickupLocation: "Vancouver Harbour Terminal, Gate B",
      dropoffLocation: "Burnaby Corporate Campus",
      equipmentType: "Patrol Vehicle (Class 5)",
      payRateHourly: 32.50,
      priority: 2,
      status: "PENDING_APPROVAL",
      version: 1,
    },
    {
      id: "s-02",
      externalId: "BBB-10002",
      siteLocation: "Surrey Civic Plaza, Security Desk",
      timeWindow: "2026-11-19 08:00 - 16:00 PST",
      shiftDate: new Date(Date.now() + 86400000),
      startTime: new Date(Date.now() + 86400000 + 2 * 3600000),
      endTime: new Date(Date.now() + 86400000 + 10 * 3600000),
      durationHours: 8.0,
      pickupLocation: "Surrey Civic Plaza, Security Desk",
      dropoffLocation: "Surrey Transit Exchange",
      equipmentType: "Site Access & CCTV Monitor",
      payRateHourly: 36.00,
      priority: 3,
      status: "OUTREACH_ACTIVE",
      version: 1,
    },
    {
      id: "s-03",
      externalId: "CCC-10003",
      siteLocation: "Victoria Inner Harbour Dock",
      timeWindow: "2026-11-19 14:00 - 22:00 PST",
      shiftDate: new Date(Date.now() + 86400000),
      startTime: new Date(Date.now() + 86400000 + 8 * 3600000),
      endTime: new Date(Date.now() + 86400000 + 16 * 3600000),
      durationHours: 8.0,
      pickupLocation: "Victoria Inner Harbour Dock",
      dropoffLocation: "Langford Commercial Park",
      equipmentType: "Mobile Patrol Unit",
      payRateHourly: 34.00,
      priority: 2,
      status: "PENDING_APPROVAL",
      version: 1,
    },
  ];

  public callLogs: MockCallLog[] = [
    {
      id: "c-01",
      shiftId: "s-01",
      shiftExternalId: "AAA-10001",
      personId: "p-01",
      guardExternalId: "200001042",
      guardName: "Manbir Singh",
      phone: "+16045550198",
      retellCallId: "call_9841f3e72089a42cb901",
      direction: "OUTBOUND",
      status: "COMPLETED",
      outcome: "Tentative Accept",
      attemptNumber: 1,
      maxAttempts: 3,
      durationSeconds: 102,
      eligibilityCodes: ["ST", "OFA1"],
      guardActive: true,
      timestamp: new Date().toISOString(),
      transcript: "Guardteck Dispatch Bot: Hi, is this Manbir?\nManbir Singh: Yeah, speaking.\nGuardteck Dispatch Bot: We have an 8-hour shift at Vancouver Harbour Terminal, Gate B at $32.50/hr.\nManbir Singh: Yes, put me down for it.\nGuardteck Dispatch Bot: Thank you. I have logged your tentative interest for human dispatch review.",
      sentimentScore: 0.85,
      summary: "Manbir Singh confirmed tentative availability for Vancouver Harbour Terminal, Gate B at $32.50/hr.",
      costUsd: 0.174,
      createdAt: new Date(),
    },
  ];

  public approvals: MockApprovalQueue[] = [
    {
      id: "appr-01",
      callLogId: "c-01",
      shiftId: "s-01",
      personId: "p-01",
      status: "PENDING",
      expiresAt: new Date(Date.now() + 18 * 60000),
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  constructor() {
    logger.info("In-Memory Store initialized with Guardteck Security BC operational records");
  }

  public getShift(shiftId: string): MockShift | undefined {
    return this.shifts.find((s) => s.id === shiftId || s.externalId === shiftId);
  }

  public getPerson(personId: string): MockPerson | undefined {
    return this.persons.find((p) => p.id === personId || p.externalId === personId);
  }

  public getEligiblePersons(_equipmentType?: string, limit: number = 5): MockPerson[] {
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
}

export const inMemoryStore = new InMemoryStore();
