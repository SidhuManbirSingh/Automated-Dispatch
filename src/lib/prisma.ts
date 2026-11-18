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
