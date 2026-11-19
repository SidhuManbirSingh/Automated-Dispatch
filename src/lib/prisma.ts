import { PrismaClient } from "@prisma/client";
import { logger } from "./logger";

declare global {
  var prismaGlobal: PrismaClient | undefined;
}

export const prisma =
  globalThis.prismaGlobal ??
  new PrismaClient({
    log: [
      { emit: "event", level: "error" },
      { emit: "event", level: "warn" },
    ],
  });

if (process.env.NODE_ENV !== "production") {
  globalThis.prismaGlobal = prisma;
}

let isConnected = false;

export async function checkDatabaseConnection(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    isConnected = true;
    logger.info("MySQL database connection established successfully");
    return true;
  } catch (err) {
    isConnected = false;
    logger.warn("Database connection could not be established. Running with local in-memory store.");
    return false;
  }
}

export function isDbConnected(): boolean {
  return isConnected;
}

export type DbShiftStatus =
  | "OPEN"
  | "DISPATCH_IN_PROGRESS"
  | "PENDING_DISPATCHER_APPROVAL"
  | "ASSIGNED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELLED";

export function toDbShiftStatus(status: string): DbShiftStatus {
  if (status === "OUTREACH_ACTIVE") return "DISPATCH_IN_PROGRESS";
  if (status === "PENDING_APPROVAL") return "PENDING_DISPATCHER_APPROVAL";
  if (
    status === "OPEN" ||
    status === "DISPATCH_IN_PROGRESS" ||
    status === "PENDING_DISPATCHER_APPROVAL" ||
    status === "ASSIGNED" ||
    status === "IN_PROGRESS" ||
    status === "COMPLETED" ||
    status === "CANCELLED"
  ) {
    return status;
  }
  return "OPEN";
}

export type DbCallOutcome =
  | "TENTATIVE_ACCEPT"
  | "DECLINE"
  | "CALLBACK_REQUESTED"
  | "VOICEMAIL_LEFT"
  | "NO_ANSWER"
  | "DNC_REQUEST"
  | "HOSTILE_ABUSIVE"
  | "INCONCLUSIVE"
  | "ERROR";

export function toDbCallOutcome(outcome?: string | null): DbCallOutcome | null {
  if (!outcome) return null;
  const upper = outcome.toUpperCase().replace(/\s+/g, "_");
  if (upper === "TENTATIVE_ACCEPT") return "TENTATIVE_ACCEPT";
  if (upper === "DECLINE" || upper === "DECLINED") return "DECLINE";
  if (upper === "CALLBACK_REQUESTED") return "CALLBACK_REQUESTED";
  if (upper === "VOICEMAIL_LEFT") return "VOICEMAIL_LEFT";
  if (upper === "NO_ANSWER") return "NO_ANSWER";
  if (upper === "DNC_REQUEST") return "DNC_REQUEST";
  if (upper === "HOSTILE_ABUSIVE") return "HOSTILE_ABUSIVE";
  if (upper === "ERROR") return "ERROR";
  if (upper === "INCONCLUSIVE") return "INCONCLUSIVE";
  return null;
}

export type DbApprovalStatus =
  | "PENDING"
  | "APPROVED"
  | "DECLINED"
  | "EXPIRED"
  | "CANCELLED_BY_SYSTEM";

export function toDbApprovalStatus(status: string): DbApprovalStatus {
  if (status === "REJECTED" || status === "REJECT" || status === "DECLINE") return "DECLINED";
  if (
    status === "PENDING" ||
    status === "APPROVED" ||
    status === "DECLINED" ||
    status === "EXPIRED" ||
    status === "CANCELLED_BY_SYSTEM"
  ) {
    return status;
  }
  return "PENDING";
}
