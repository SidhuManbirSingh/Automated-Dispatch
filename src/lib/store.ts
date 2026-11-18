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
  dncReason?: string | null;
  dncTimestamp?: Date | null;
  reliabilityScore: number;
  totalShiftsCompleted: number;
}

export interface MockShift {
  id: string;
  externalId: string;
  shiftDate: Date;
  startTime: Date;
  endTime: Date;
  durationHours: number;
  pickupLocation: string;
  dropoffLocation: string;
  equipmentType: string;
  payRateHourly: number;
  priority: number;
  status: "OPEN" | "DISPATCH_IN_PROGRESS" | "PENDING_DISPATCHER_APPROVAL" | "ASSIGNED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
  version: number;
}

export interface MockCallLog {
  id: string;
  shiftId: string;
  personId: string;
  retellCallId: string;
  direction: "OUTBOUND" | "INBOUND";
  status: "SCHEDULED" | "INITIATED" | "RINGING" | "IN_PROGRESS" | "COMPLETED" | "FAILED" | "NO_ANSWER" | "VOICEMAIL" | "BUSY";
  outcome?: string;
  attemptNumber: number;
  maxAttempts: number;
  durationSeconds: number;
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
  status: "PENDING" | "APPROVED" | "DECLINED" | "EXPIRED" | "CANCELLED_BY_SYSTEM";
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
      externalId: "PER-1042",
      firstName: "Marcus",
      lastName: "Vance",
      phone: "+16045550198",
      email: "marcus.vance@guardteck.com",
      region: "VAN",
      equipmentTypes: ["PATROL_VEHICLE", "SITE_ACCESS"],
      status: "ACTIVE",
      dncFlag: false,
      reliabilityScore: 0.98,
      totalShiftsCompleted: 142,
    },
    {
      id: "p-02",
      externalId: "PER-1043",
      firstName: "Elena",
      lastName: "Reyes",
      phone: "+16045550144",
      email: "elena.reyes@guardteck.com",
      region: "SUR",
      equipmentTypes: ["CONCIERGE", "SITE_ACCESS"],
      status: "ACTIVE",
      dncFlag: false,
      reliabilityScore: 0.95,
      totalShiftsCompleted: 98,
    },
    {
      id: "p-03",
      externalId: "PER-1044",
      firstName: "David",
      lastName: "Chen",
      phone: "+12505550188",
      email: "david.chen@guardteck.com",
      region: "VIC",
      equipmentTypes: ["PATROL_VEHICLE"],
      status: "ACTIVE",
      dncFlag: false,
      reliabilityScore: 0.92,
      totalShiftsCompleted: 76,
    },
    {
      id: "p-04",
      externalId: "PER-1045",
      firstName: "Sarah",
      lastName: "Jenkins",
      phone: "+12505550162",
      email: "sarah.jenkins@guardteck.com",
      region: "KEL",
      equipmentTypes: ["SITE_ACCESS", "CONCIERGE"],
      status: "ACTIVE",
      dncFlag: false,
      reliabilityScore: 0.89,
      totalShiftsCompleted: 54,
    },
    {
      id: "p-05",
      externalId: "PER-1046",
      firstName: "Jamal",
      lastName: "Washington",
      phone: "+17785550119",
      email: "jamal.washington@guardteck.com",
      region: "BUR",
      equipmentTypes: ["PATROL_VEHICLE"],
      status: "DNC_DO_NOT_CALL",
      dncFlag: true,
      reliabilityScore: 0.81,
      totalShiftsCompleted: 30,
    },
    {
      id: "p-06",
      externalId: "PER-1047",
      firstName: "Robert",
      lastName: "Kowalski",
      phone: "+16045550173",
      email: "robert.kowalski@guardteck.com",
      region: "VAN",
      equipmentTypes: ["PATROL_VEHICLE", "CONCIERGE"],
      status: "ACTIVE",
      dncFlag: false,
      reliabilityScore: 0.96,
      totalShiftsCompleted: 110,
    },
  ];

  public shifts: MockShift[] = [
    {
      id: "s-01",
      externalId: "SH-2024-8841",
      shiftDate: new Date(Date.now() + 86400000),
      startTime: new Date(Date.now() + 86400000),
      endTime: new Date(Date.now() + 86400000 + 8 * 3600000),
      durationHours: 8.0,
      pickupLocation: "Vancouver Harbour Terminal, Gate B",
      dropoffLocation: "Burnaby Corporate Campus",
      equipmentType: "Patrol Vehicle (Class 5)",
      payRateHourly: 32.50,
      priority: 2,
      status: "PENDING_DISPATCHER_APPROVAL",
      version: 1,
    },
    {
      id: "s-02",
      externalId: "SH-2024-8842",
      shiftDate: new Date(Date.now() + 86400000),
      startTime: new Date(Date.now() + 86400000 + 2 * 3600000),
      endTime: new Date(Date.now() + 86400000 + 10 * 3600000),
      durationHours: 8.0,
      pickupLocation: "Surrey Civic Plaza, Security Desk",
      dropoffLocation: "Surrey Transit Exchange",
      equipmentType: "Site Access & CCTV Monitor",
      payRateHourly: 36.00,
      priority: 3,
      status: "OPEN",
      version: 1,
    },
    {
      id: "s-03",
      externalId: "SH-2024-8843",
      shiftDate: new Date(Date.now() + 2 * 86400000),
      startTime: new Date(Date.now() + 2 * 86400000),
      endTime: new Date(Date.now() + 2 * 86400000 + 10 * 3600000),
      durationHours: 10.0,
      pickupLocation: "Victoria Inner Harbour Dock",
      dropoffLocation: "Langford Commercial Park",
      equipmentType: "Mobile Patrol Unit",
      payRateHourly: 34.00,
      priority: 1,
      status: "OPEN",
      version: 1,
    },
    {
      id: "s-04",
      externalId: "SH-2024-8844",
      shiftDate: new Date(Date.now() + 86400000),
      startTime: new Date(Date.now() + 86400000 + 4 * 3600000),
      endTime: new Date(Date.now() + 86400000 + 12 * 3600000),
      durationHours: 8.0,
      pickupLocation: "Kelowna Regional Health Campus",
      dropoffLocation: "West Kelowna Logistics Yard",
      equipmentType: "Site Security Guard",
      payRateHourly: 31.00,
      priority: 1,
      status: "ASSIGNED",
      version: 1,
    },
  ];

  public callLogs: MockCallLog[] = [
    {
      id: "c-01",
      shiftId: "s-01",
      personId: "p-01",
      retellCallId: "call_9841f3e72089a42cb901",
      direction: "OUTBOUND",
      status: "COMPLETED",
      outcome: "TENTATIVE_ACCEPT",
      attemptNumber: 1,
      maxAttempts: 3,
      durationSeconds: 102,
      transcript: "Guardteck Dispatch Bot: Hi, is this Marcus?\nMarcus: Yeah, speaking. Who's this?\nGuardteck Dispatch Bot: Hi Marcus, this is Guardteck Dispatch Bot with Guardteck Security automated dispatch. We have an 8-hour shift tomorrow starting at 6:00 AM Pacific at Vancouver Harbour Terminal, Gate B at $32.50 per hour. Are you open to taking this shift?\nMarcus: Yeah, put me down for it. I can cover that tomorrow morning.\nGuardteck Dispatch Bot: Excellent! Thank you, Marcus. I have logged your tentative interest and submitted this to our human dispatch team for final review and approval. You will receive an official confirmation via email once approved. Take care!\nMarcus: Sounds good, thanks. Bye.",
      sentimentScore: 0.85,
      summary: "Guardteck Dispatch Bot contacted Marcus Vance regarding shift SH-2024-8841 (Vancouver Harbour Terminal, 8 hrs at $32.50/hr). Person tentatively accepted the shift. Agent confirmed human-in-the-loop dispatch review and concluded call.",
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
    logger.info("In-Memory Store initialized with Guardteck Security BC baseline records");
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
