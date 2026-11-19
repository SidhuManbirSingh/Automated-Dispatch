import { buildApp } from "./app";
import { config } from "./config";
import { logger } from "./lib/logger";
import { checkDatabaseConnection } from "./lib/prisma";
import { ensureDatabaseSchemaAndSeed } from "./lib/seed-db";

async function main() {
  const app = buildApp();

  const dbConnected = await checkDatabaseConnection();
  if (dbConnected) {
    logger.info("MySQL Database connected successfully via Prisma ORM");
    try {
      await ensureDatabaseSchemaAndSeed();
    } catch (err) {
      logger.error({ err }, "Failed during MySQL schema verification/seeding; continuing with in-memory store fallback");
    }
  } else {
    logger.info("Running in resilient standalone mode (In-Memory simulation store active)");
  }

  try {
    const address = await app.listen({
      port: config.PORT,
      host: config.HOST,
    });
    logger.info(`Guardteck Security Dispatch Agent live at: ${address}`);
    logger.info(`Guardteck Dispatch Console: ${address}/`);
    logger.info(`Health check endpoint: ${address}/health/readiness`);
  } catch (err) {
    logger.fatal({ err }, "Fatal error starting server");
    process.exit(1);
  }

  const shutdown = async (signal: string) => {
    logger.info({ signal }, "Received shutdown signal, terminating server gracefully...");
    try {
      await app.close();
      logger.info("HTTP server closed.");
      process.exit(0);
    } catch (err) {
      logger.error({ err }, "Error during graceful shutdown");
      process.exit(1);
    }
  };

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
}

main().catch((err) => {
  logger.fatal({ err }, "Top-level unhandled exception");
  process.exit(1);
});
