import { prisma, toDbApprovalStatus, toDbCallOutcome, toDbShiftStatus } from "./prisma";
import {
  inMemoryStore,
  MockApprovalQueue,
  MockCallLog,
  MockPerson,
  MockShift,
  SITES_CONFIG,
} from "./store";
import { logger } from "./logger";

const DDL_STATEMENTS: string[] = [
  `CREATE TABLE IF NOT EXISTS Person (
    id VARCHAR(36) PRIMARY KEY,
    externalId VARCHAR(64) NOT NULL UNIQUE,
    firstName VARCHAR(128) NOT NULL,
    lastName VARCHAR(128) NOT NULL,
    phone VARCHAR(32) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    region VARCHAR(32) NOT NULL,
    equipmentTypes JSON NOT NULL,
    status ENUM('ACTIVE', 'INACTIVE', 'SUSPENDED', 'DNC_DO_NOT_CALL') NOT NULL DEFAULT 'ACTIVE',
    dncFlag BOOLEAN NOT NULL DEFAULT FALSE,
    dncReason VARCHAR(255) NULL,
    dncTimestamp DATETIME NULL,
    preferredContactStart VARCHAR(16) NULL,
    preferredContactEnd VARCHAR(16) NULL,
    timezone VARCHAR(64) NOT NULL DEFAULT 'America/Vancouver',
    reliabilityScore DOUBLE NOT NULL DEFAULT 1.0,
    totalShiftsCompleted INT NOT NULL DEFAULT 0,
    notes TEXT NULL,
    createdAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updatedAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    INDEX idx_person_region_status (region, status),
    INDEX idx_person_phone (phone)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  `CREATE TABLE IF NOT EXISTS Site (
    id VARCHAR(36) PRIMARY KEY,
    code VARCHAR(16) NOT NULL UNIQUE,
    name VARCHAR(128) NOT NULL,
    region VARCHAR(64) NOT NULL,
    colorBg VARCHAR(16) NOT NULL,
    colorText VARCHAR(16) NOT NULL,
    colorBorder VARCHAR(16) NOT NULL,
    createdAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  `CREATE TABLE IF NOT EXISTS PersonSiteTraining (
    id VARCHAR(36) PRIMARY KEY,
    personId VARCHAR(36) NOT NULL,
    siteId VARCHAR(36) NOT NULL,
    isPrimary BOOLEAN NOT NULL DEFAULT TRUE,
    trainedAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    FOREIGN KEY (personId) REFERENCES Person(id) ON DELETE CASCADE,
    FOREIGN KEY (siteId) REFERENCES Site(id) ON DELETE CASCADE,
    UNIQUE KEY unq_person_site_training (personId, siteId),
    INDEX idx_site_training_site (siteId)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  `CREATE TABLE IF NOT EXISTS Shift (
    id VARCHAR(36) PRIMARY KEY,
    externalId VARCHAR(64) NOT NULL UNIQUE,
    siteCode VARCHAR(16) NOT NULL,
    timeWindow VARCHAR(64) NULL,
    shiftDate DATETIME NOT NULL,
    startTime DATETIME NOT NULL,
    endTime DATETIME NOT NULL,
    durationHours DOUBLE NOT NULL,
    pickupLocation VARCHAR(255) NOT NULL,
    dropoffLocation VARCHAR(255) NOT NULL,
    equipmentType VARCHAR(64) NOT NULL,
    payRateHourly DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(8) NOT NULL DEFAULT 'CAD',
    specialInstructions TEXT NULL,
    priority INT NOT NULL DEFAULT 1,
    status ENUM('OPEN', 'DISPATCH_IN_PROGRESS', 'PENDING_DISPATCHER_APPROVAL', 'ASSIGNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED') NOT NULL DEFAULT 'OPEN',
    requiredCertifications JSON NOT NULL,
    version INT NOT NULL DEFAULT 1,
    createdAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updatedAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    FOREIGN KEY (siteCode) REFERENCES Site(code) ON DELETE RESTRICT,
    INDEX idx_shift_status_date (status, shiftDate),
    INDEX idx_shift_priority_status (priority, status),
    INDEX idx_shift_site_status (siteCode, status)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  `CREATE TABLE IF NOT EXISTS CallLog (
    id VARCHAR(36) PRIMARY KEY,
    shiftId VARCHAR(36) NOT NULL,
    personId VARCHAR(36) NOT NULL,
    retellCallId VARCHAR(128) NOT NULL UNIQUE,
    twilioCallSid VARCHAR(128) NULL UNIQUE,
    direction ENUM('OUTBOUND', 'INBOUND') NOT NULL DEFAULT 'OUTBOUND',
    status ENUM('SCHEDULED', 'INITIATED', 'RINGING', 'IN_PROGRESS', 'COMPLETED', 'FAILED', 'NO_ANSWER', 'VOICEMAIL', 'BUSY') NOT NULL DEFAULT 'INITIATED',
    outcome ENUM('TENTATIVE_ACCEPT', 'DECLINE', 'CALLBACK_REQUESTED', 'VOICEMAIL_LEFT', 'NO_ANSWER', 'DNC_REQUEST', 'HOSTILE_ABUSIVE', 'INCONCLUSIVE', 'ERROR') NULL,
    attemptNumber INT NOT NULL DEFAULT 1,
    maxAttempts INT NOT NULL DEFAULT 3,
    startedAt DATETIME(3) NULL,
    endedAt DATETIME(3) NULL,
    durationSeconds INT NOT NULL DEFAULT 0,
    recordingUrl VARCHAR(512) NULL,
    transcript MEDIUMTEXT NULL,
    sentimentScore DOUBLE NULL,
    summary TEXT NULL,
    personFeedbackNotes TEXT NULL,
    costUsd DECIMAL(6, 4) NULL,
    createdAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    FOREIGN KEY (shiftId) REFERENCES Shift(id) ON DELETE CASCADE,
    FOREIGN KEY (personId) REFERENCES Person(id) ON DELETE CASCADE,
    INDEX idx_calllog_shift_status (shiftId, status),
    INDEX idx_calllog_person_created (personId, createdAt)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  `CREATE TABLE IF NOT EXISTS ApprovalQueue (
    id VARCHAR(36) PRIMARY KEY,
    callLogId VARCHAR(36) NOT NULL UNIQUE,
    shiftId VARCHAR(36) NOT NULL,
    personId VARCHAR(36) NOT NULL,
    status ENUM('PENDING', 'APPROVED', 'DECLINED', 'EXPIRED', 'CANCELLED_BY_SYSTEM') NOT NULL DEFAULT 'PENDING',
    teamsMessageId VARCHAR(128) NULL,
    teamsCardPayload JSON NULL,
    dispatcherId VARCHAR(255) NULL,
    dispatcherName VARCHAR(128) NULL,
    dispatcherNotes TEXT NULL,
    actionTimestamp DATETIME(3) NULL,
    expiresAt DATETIME(3) NOT NULL,
    calendarEventId VARCHAR(128) NULL,
    emailMessageId VARCHAR(128) NULL,
    createdAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updatedAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    FOREIGN KEY (callLogId) REFERENCES CallLog(id) ON DELETE CASCADE,
    FOREIGN KEY (shiftId) REFERENCES Shift(id) ON DELETE CASCADE,
    FOREIGN KEY (personId) REFERENCES Person(id) ON DELETE CASCADE,
    INDEX idx_approval_status_expiry (status, expiresAt)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  `CREATE TABLE IF NOT EXISTS ShiftAssignment (
    id VARCHAR(36) PRIMARY KEY,
    shiftId VARCHAR(36) NOT NULL,
    personId VARCHAR(36) NOT NULL,
    approvalQueueId VARCHAR(36) NOT NULL UNIQUE,
    status ENUM('TENTATIVE', 'CONFIRMED', 'ACTIVE', 'COMPLETED', 'CANCELLED') NOT NULL DEFAULT 'CONFIRMED',
    confirmedAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    outlookCalendarId VARCHAR(128) NULL,
    icsUid VARCHAR(128) NULL,
    createdAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updatedAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    FOREIGN KEY (shiftId) REFERENCES Shift(id) ON DELETE RESTRICT,
    FOREIGN KEY (personId) REFERENCES Person(id) ON DELETE RESTRICT,
    UNIQUE KEY unq_shift_person (shiftId, personId),
    INDEX idx_assignment_person_status (personId, status)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  `CREATE TABLE IF NOT EXISTS ActiveLineLease (
    id VARCHAR(36) PRIMARY KEY,
    callId VARCHAR(128) NOT NULL UNIQUE,
    shiftId VARCHAR(36) NOT NULL,
    personId VARCHAR(36) NOT NULL,
    channelIndex INT NOT NULL,
    acquiredAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    expiresAt DATETIME(3) NOT NULL,
    releasedAt DATETIME(3) NULL,
    INDEX idx_lease_expiry (releasedAt, expiresAt)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  `CREATE TABLE IF NOT EXISTS EligibilityCode (
    id VARCHAR(36) PRIMARY KEY,
    code VARCHAR(32) NOT NULL UNIQUE,
    label VARCHAR(128) NOT NULL,
    createdAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  `CREATE TABLE IF NOT EXISTS PersonEligibility (
    id VARCHAR(36) PRIMARY KEY,
    personId VARCHAR(36) NOT NULL,
    eligibilityCodeId VARCHAR(36) NOT NULL,
    verifiedAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    expiresAt DATETIME(3) NULL,
    FOREIGN KEY (personId) REFERENCES Person(id) ON DELETE CASCADE,
    FOREIGN KEY (eligibilityCodeId) REFERENCES EligibilityCode(id) ON DELETE CASCADE,
    UNIQUE KEY unq_person_eligibility (personId, eligibilityCodeId),
    INDEX idx_person_eligibility_person (personId)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
];

async function migrateOutdatedVolumeIfNeeded(): Promise<void> {
  const shiftTableCheck = await prisma.$queryRawUnsafe<Array<{ cnt: bigint | number }>>(
    `SELECT COUNT(*) AS cnt FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'Shift'`
  );
  const hasShiftTable = Number(shiftTableCheck[0]?.cnt ?? 0) > 0;
  if (!hasShiftTable) return;

  const siteCodeCheck = await prisma.$queryRawUnsafe<Array<{ cnt: bigint | number }>>(
    `SELECT COUNT(*) AS cnt FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'Shift' AND COLUMN_NAME = 'siteCode'`
  );
  const hasSiteCode = Number(siteCodeCheck[0]?.cnt ?? 0) > 0;
  if (hasSiteCode) return;

  logger.warn("Detected pre-Phase-2 Shift table without siteCode column; recreating schema cleanly...");
  for (const tbl of ["ApprovalQueue", "ShiftAssignment", "CallLog", "ActiveLineLease", "Shift"]) {
    await prisma.$executeRawUnsafe(`DROP TABLE IF EXISTS ${tbl}`);
  }
}

export async function ensureDatabaseSchemaAndSeed(): Promise<void> {
  await migrateOutdatedVolumeIfNeeded();

  for (const stmt of DDL_STATEMENTS) {
    await prisma.$executeRawUnsafe(stmt);
  }

  const eligibilitySeed = [
    { code: "ST", label: "Steel Toe Footwear" },
    { code: "OFA1", label: "Occupational First Aid Level 1" },
    { code: "OFA2", label: "Occupational First Aid Level 2" },
  ];

  for (const item of eligibilitySeed) {
    await prisma.eligibilityCode.upsert({
      where: { code: item.code },
      create: item,
      update: { label: item.label },
    });
  }

  for (const site of SITES_CONFIG) {
    await prisma.site.upsert({
      where: { code: site.code },
      create: site,
      update: {
        name: site.name,
        region: site.region,
        colorBg: site.colorBg,
        colorText: site.colorText,
        colorBorder: site.colorBorder,
      },
    });
  }

  const dbSites = await prisma.site.findMany();
  const siteIdByCode = new Map(dbSites.map((s) => [s.code, s.id]));

  const dbEligs = await prisma.eligibilityCode.findMany();
  const eligIdByCode = new Map(dbEligs.map((e) => [e.code, e.id]));

  await prisma.person.createMany({
    data: inMemoryStore.persons.map((p) => ({
      id: p.id,
      externalId: p.externalId,
      firstName: p.firstName,
      lastName: p.lastName,
      phone: p.phone,
      email: p.email,
      region: p.region,
      equipmentTypes: p.equipmentTypes,
      status: p.status,
      dncFlag: p.dncFlag,
      dncReason: p.dncReason ?? null,
      reliabilityScore: p.reliabilityScore,
      totalShiftsCompleted: p.totalShiftsCompleted,
    })),
    skipDuplicates: true,
  });

  const trainingRows: Array<{ personId: string; siteId: string; isPrimary: boolean }> = [];
  const personEligRows: Array<{ personId: string; eligibilityCodeId: string }> = [];

  for (const p of inMemoryStore.persons) {
    p.trainedSites.forEach((code, idx) => {
      const siteId = siteIdByCode.get(code);
      if (siteId) {
        trainingRows.push({
          personId: p.id,
          siteId,
          isPrimary: idx === 0,
        });
      }
    });
    for (const code of p.eligibilityCodes) {
      const eligibilityCodeId = eligIdByCode.get(code);
      if (eligibilityCodeId) {
        personEligRows.push({
          personId: p.id,
          eligibilityCodeId,
        });
      }
    }
  }

  if (trainingRows.length > 0) {
    await prisma.personSiteTraining.createMany({
      data: trainingRows,
      skipDuplicates: true,
    });
  }

  if (personEligRows.length > 0) {
    await prisma.personEligibility.createMany({
      data: personEligRows,
      skipDuplicates: true,
    });
  }

  await prisma.shift.createMany({
    data: inMemoryStore.shifts.map((s) => ({
      id: s.id,
      externalId: s.externalId,
      siteCode: s.siteCode,
      timeWindow: s.timeWindow,
      shiftDate: s.shiftDate,
      startTime: s.startTime,
      endTime: s.endTime,
      durationHours: s.durationHours,
      pickupLocation: s.pickupLocation,
      dropoffLocation: s.dropoffLocation,
      equipmentType: s.equipmentType,
      payRateHourly: s.payRateHourly,
      currency: "CAD",
      priority: s.priority,
      status: toDbShiftStatus(s.status),
      requiredCertifications: s.requiredEligibility,
      version: s.version,
    })),
    skipDuplicates: true,
  });

  await prisma.callLog.createMany({
    data: inMemoryStore.callLogs.map((c) => ({
      id: c.id,
      shiftId: c.shiftId,
      personId: c.personId,
      retellCallId: c.retellCallId,
      direction: c.direction,
      status: c.status,
      outcome: toDbCallOutcome(c.outcome),
      attemptNumber: c.attemptNumber,
      maxAttempts: c.maxAttempts,
      durationSeconds: c.durationSeconds,
      transcript: c.transcript ?? null,
      summary: c.summary ?? null,
      sentimentScore: c.sentimentScore ?? null,
      costUsd: c.costUsd ?? null,
    })),
    skipDuplicates: true,
  });

  await prisma.approvalQueue.createMany({
    data: inMemoryStore.approvals.map((a) => ({
      id: a.id,
      callLogId: a.callLogId,
      shiftId: a.shiftId,
      personId: a.personId,
      status: toDbApprovalStatus(a.status),
      expiresAt: a.expiresAt,
    })),
    skipDuplicates: true,
  });

  const leasesToSeed = Array.from(inMemoryStore.activeLeases.entries()).map(([channelIndex, lease]) => ({
    id: `lease-${String(channelIndex).padStart(2, "0")}`,
    callId: lease.callId,
    shiftId: lease.shiftId,
    personId: lease.personId,
    channelIndex,
    expiresAt: new Date(Date.now() + 6 * 60000),
  }));

  if (leasesToSeed.length > 0) {
    await prisma.activeLineLease.createMany({
      data: leasesToSeed,
      skipDuplicates: true,
    });
  }

  await hydrateStoreFromDatabase();

  logger.info(
    {
      sites: SITES_CONFIG.length,
      persons: inMemoryStore.persons.length,
      shifts: inMemoryStore.shifts.length,
      callLogs: inMemoryStore.callLogs.length,
      approvals: inMemoryStore.approvals.length,
      activeLines: inMemoryStore.activeLeases.size,
      trainings: trainingRows.length,
    },
    "Phase 2 MySQL schema verified, seeded, and hydrated into store"
  );
}

function fromDbShiftStatus(status: string): MockShift["status"] {
  if (status === "DISPATCH_IN_PROGRESS") return "OUTREACH_ACTIVE";
  if (status === "PENDING_DISPATCHER_APPROVAL") return "PENDING_APPROVAL";
  if (
    status === "OPEN" ||
    status === "OUTREACH_ACTIVE" ||
    status === "PENDING_APPROVAL" ||
    status === "ASSIGNED" ||
    status === "IN_PROGRESS" ||
    status === "COMPLETED" ||
    status === "CANCELLED"
  ) {
    return status;
  }
  return "OPEN";
}

function formatDbOutcome(outcome: string | null, callStatus: string): string {
  switch (outcome) {
    case "TENTATIVE_ACCEPT":
      return "Tentative Accept";
    case "DECLINE":
      return "Declined";
    case "NO_ANSWER":
      return "No Answer";
    case "VOICEMAIL_LEFT":
      return "Voicemail";
    case "CALLBACK_REQUESTED":
      return "Callback Requested";
    case "DNC_REQUEST":
      return "DNC Opt-Out";
    default:
      if (callStatus === "IN_PROGRESS") return "In Progress";
      if (callStatus === "SCHEDULED") return "Queued";
      return outcome || callStatus;
  }
}

function formatLocalSqlDate(d: Date): string {
  const yr = d.getFullYear();
  const mo = String(d.getMonth() + 1).padStart(2, "0");
  const dy = String(d.getDate()).padStart(2, "0");
  return `${yr}-${mo}-${dy}`;
}

function formatLocalHhmm(d: Date): string {
  return `${String(d.getHours()).padStart(2, "0")}${String(d.getMinutes()).padStart(2, "0")}`;
}

function formatLocalTimestamp(d: Date): string {
  return `${formatLocalSqlDate(d)} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}:${String(d.getSeconds()).padStart(2, "0")}`;
}

export async function hydrateStoreFromDatabase(): Promise<void> {
  const dbSites = await prisma.site.findMany({ orderBy: { code: "asc" } });
  const dbEligs = await prisma.eligibilityCode.findMany();
  const siteCodeById = new Map(dbSites.map((s) => [s.id, s.code]));
  const siteByCode = new Map(dbSites.map((s) => [s.code, s]));
  const eligCodeById = new Map(dbEligs.map((e) => [e.id, e.code]));

  if (dbSites.length > 0) {
    inMemoryStore.sites = dbSites.map((s) => ({
      code: s.code,
      name: s.name,
      region: s.region,
      colorBg: s.colorBg,
      colorText: s.colorText,
      colorBorder: s.colorBorder,
    }));
  }

  const dbPersons = await prisma.person.findMany({
    orderBy: { externalId: "asc" },
    include: {
      siteTrainings: { orderBy: { isPrimary: "desc" } },
      eligibilities: true,
    },
  });

  if (dbPersons.length > 0) {
    const hydratedPersons: MockPerson[] = dbPersons.map((p) => {
      const trainedSites = p.siteTrainings
        .map((t) => siteCodeById.get(t.siteId))
        .filter((c): c is string => Boolean(c));
      const eligibilityCodes = p.eligibilities
        .map((e) => eligCodeById.get(e.eligibilityCodeId))
        .filter((c): c is string => Boolean(c));
      const equipList = Array.isArray(p.equipmentTypes) ? p.equipmentTypes.map(String) : ["SITE_ACCESS"];

      return {
        id: p.id,
        externalId: p.externalId,
        firstName: p.firstName,
        lastName: p.lastName,
        phone: p.phone,
        email: p.email,
        region: p.region,
        trainedSites,
        equipmentTypes: equipList,
        status: p.status,
        dncFlag: p.dncFlag,
        eligibilityCodes: eligibilityCodes.length > 0 ? eligibilityCodes : ["ST"],
        guardActive: !p.dncFlag,
        dncReason: p.dncReason,
        dncTimestamp: p.dncTimestamp,
        reliabilityScore: p.reliabilityScore,
        totalShiftsCompleted: p.totalShiftsCompleted,
      };
    });
    inMemoryStore.persons = hydratedPersons;
  }

  const dbShifts = await prisma.shift.findMany({ orderBy: { id: "asc" } });
  if (dbShifts.length > 0) {
    const hydratedShifts: MockShift[] = dbShifts.map((s) => {
      let dateLabel = formatLocalSqlDate(s.shiftDate);
      let startHour = formatLocalHhmm(s.startTime);
      let endHour = formatLocalHhmm(s.endTime);

      if (s.timeWindow) {
        const parts = s.timeWindow.trim().split(/\s+/);
        if (parts.length === 2 && parts[1]?.includes("-")) {
          dateLabel = parts[0]!;
          const [sh, eh] = parts[1].split("-");
          if (sh && eh) {
            startHour = sh;
            endHour = eh;
          }
        } else if (parts[0]?.includes("-")) {
          const [sh, eh] = parts[0].split("-");
          if (sh && eh) {
            startHour = sh;
            endHour = eh;
          }
        }
      }

      const reqCerts = Array.isArray(s.requiredCertifications)
        ? s.requiredCertifications.map(String)
        : ["ST"];

      return {
        id: s.id,
        externalId: s.externalId,
        siteCode: s.siteCode,
        siteLocation: siteByCode.get(s.siteCode)?.name || s.pickupLocation,
        dateLabel,
        startHour,
        endHour,
        timeWindow: s.timeWindow || `${dateLabel} ${startHour}-${endHour}`,
        shiftDate: s.shiftDate,
        startTime: s.startTime,
        endTime: s.endTime,
        durationHours: s.durationHours,
        pickupLocation: s.pickupLocation,
        dropoffLocation: s.dropoffLocation,
        equipmentType: s.equipmentType,
        requiredEligibility: reqCerts,
        payRateHourly: Number(s.payRateHourly),
        priority: s.priority,
        status: fromDbShiftStatus(s.status),
        version: s.version,
      };
    });
    inMemoryStore.shifts = hydratedShifts;
  }

  const personById = new Map(inMemoryStore.persons.map((p) => [p.id, p]));
  const shiftById = new Map(inMemoryStore.shifts.map((s) => [s.id, s]));

  const dbCalls = await prisma.callLog.findMany({ orderBy: { createdAt: "desc" } });
  if (dbCalls.length > 0) {
    const hydratedCalls: MockCallLog[] = dbCalls.map((c) => {
      const person = personById.get(c.personId);
      const shift = shiftById.get(c.shiftId);
      return {
        id: c.id,
        shiftId: c.shiftId,
        shiftExternalId: shift?.externalId || c.shiftId,
        siteCode: shift?.siteCode || "AAA",
        personId: c.personId,
        guardExternalId: person?.externalId || c.personId,
        guardName: person ? `${person.firstName} ${person.lastName}` : "Officer",
        phone: person?.phone || "",
        retellCallId: c.retellCallId,
        direction: c.direction,
        status: c.status,
        outcome: formatDbOutcome(c.outcome, c.status),
        attemptNumber: c.attemptNumber,
        maxAttempts: c.maxAttempts,
        durationSeconds: c.durationSeconds,
        eligibilityCodes: person?.eligibilityCodes || ["ST"],
        guardActive: person ? !person.dncFlag : true,
        timestamp: formatLocalTimestamp(c.createdAt),
        transcript: c.transcript ?? undefined,
        summary: c.summary ?? undefined,
        sentimentScore: c.sentimentScore ?? undefined,
        costUsd: c.costUsd ? Number(c.costUsd) : undefined,
        createdAt: c.createdAt,
      };
    });
    inMemoryStore.callLogs = hydratedCalls;
  }

  const dbApprovals = await prisma.approvalQueue.findMany({ orderBy: { createdAt: "desc" } });
  if (dbApprovals.length > 0) {
    const hydratedApprovals: MockApprovalQueue[] = dbApprovals.map((a) => ({
      id: a.id,
      callLogId: a.callLogId,
      shiftId: a.shiftId,
      personId: a.personId,
      status: a.status,
      dispatcherId: a.dispatcherId,
      dispatcherName: a.dispatcherName,
      dispatcherNotes: a.dispatcherNotes,
      actionTimestamp: a.actionTimestamp,
      expiresAt: a.expiresAt,
      calendarEventId: a.calendarEventId,
      emailMessageId: a.emailMessageId,
      createdAt: a.createdAt,
      updatedAt: a.updatedAt,
    }));
    inMemoryStore.approvals = hydratedApprovals;
  }

  const dbLeases = await prisma.activeLineLease.findMany({
    where: { releasedAt: null },
    orderBy: { channelIndex: "asc" },
  });
  inMemoryStore.activeLeases.clear();
  for (const l of dbLeases) {
    if (l.channelIndex >= 1 && l.channelIndex <= 5) {
      const person = personById.get(l.personId);
      const shift = shiftById.get(l.shiftId);
      const elapsedSec = Math.max(1, Math.floor((Date.now() - l.acquiredAt.getTime()) / 1000));
      inMemoryStore.activeLeases.set(l.channelIndex, {
        callId: l.callId,
        shiftId: l.shiftId,
        shiftExternalId: shift?.externalId || l.shiftId,
        siteCode: shift?.siteCode || "AAA",
        personId: l.personId,
        guardExternalId: person?.externalId || l.personId,
        guardName: person ? `${person.firstName} ${person.lastName}` : "Officer",
        durationSeconds: elapsedSec,
        startedAt: l.acquiredAt.getTime() / 1000,
      });
    }
  }
}
