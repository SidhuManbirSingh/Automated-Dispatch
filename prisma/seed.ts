import { checkDatabaseConnection, prisma } from "../src/lib/prisma";
import { ensureDatabaseSchemaAndSeed } from "../src/lib/seed-db";
import { logger } from "../src/lib/logger";

async function runSeed() {
  const connected = await checkDatabaseConnection();
  if (!connected) {
    throw new Error("Could not connect to MySQL database. Verify DATABASE_URL and ensure MySQL 8 is running.");
  }

  await ensureDatabaseSchemaAndSeed();
  logger.info("Standalone prisma/seed.ts execution completed successfully.");
}

runSeed()
  .catch((err) => {
    logger.error({ err }, "Seed script failed");
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
