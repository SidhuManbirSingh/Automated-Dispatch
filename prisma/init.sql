-- =============================================================================
-- Native MySQL 8.0 DDL Initialization Script (Guardteck Security Dispatch)
-- =============================================================================

CREATE DATABASE IF NOT EXISTS automated_dispatch CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE automated_dispatch;

CREATE TABLE IF NOT EXISTS Person (
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS Shift (
  id VARCHAR(36) PRIMARY KEY,
  externalId VARCHAR(64) NOT NULL UNIQUE,
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
  INDEX idx_shift_status_date (status, shiftDate),
  INDEX idx_shift_priority_status (priority, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS CallLog (
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS ApprovalQueue (
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS ShiftAssignment (
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS ActiveLineLease (
  id VARCHAR(36) PRIMARY KEY,
  callId VARCHAR(128) NOT NULL UNIQUE,
  shiftId VARCHAR(36) NOT NULL,
  personId VARCHAR(36) NOT NULL,
  channelIndex INT NOT NULL,
  acquiredAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  expiresAt DATETIME(3) NOT NULL,
  releasedAt DATETIME(3) NULL,
  INDEX idx_lease_expiry (releasedAt, expiresAt)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS EligibilityCode (
  id VARCHAR(36) PRIMARY KEY,
  code VARCHAR(32) NOT NULL UNIQUE,
  label VARCHAR(128) NOT NULL,
  createdAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS PersonEligibility (
  id VARCHAR(36) PRIMARY KEY,
  personId VARCHAR(36) NOT NULL,
  eligibilityCodeId VARCHAR(36) NOT NULL,
  verifiedAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  expiresAt DATETIME(3) NULL,
  FOREIGN KEY (personId) REFERENCES Person(id) ON DELETE CASCADE,
  FOREIGN KEY (eligibilityCodeId) REFERENCES EligibilityCode(id) ON DELETE CASCADE,
  UNIQUE KEY unq_person_eligibility (personId, eligibilityCodeId),
  INDEX idx_person_eligibility_person (personId)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO EligibilityCode (id, code, label) VALUES
  (UUID(), 'ST', 'Steel Toe Footwear'),
  (UUID(), 'OFA1', 'Occupational First Aid Level 1'),
  (UUID(), 'OFA2', 'Occupational First Aid Level 2');
