import { FastifyInstance, FastifyPluginAsync } from "fastify";
import { config } from "../config";
import { isDbConnected } from "../lib/prisma";

export const healthRoutes: FastifyPluginAsync = async (app: FastifyInstance) => {
  app.get("/health", async (_req, reply) => {
    return reply.status(200).send({
      status: "OK",
      timestamp: new Date().toISOString(),
      service: "guardteck-automated-dispatch",
      company: "Guardteck Security",
      botName: "Guardteck Dispatch Bot",
      uptime: process.uptime(),
    });
  });

  app.get("/health/liveness", async (_req, reply) => {
    return reply.status(200).send({
      status: "LIVE",
      timestamp: new Date().toISOString(),
    });
  });

  app.get("/health/readiness", async (_req, reply) => {
    const dbStatus = isDbConnected() ? "CONNECTED" : "IN_MEMORY_SIMULATION";
    return reply.status(200).send({
      status: "READY",
      timestamp: new Date().toISOString(),
      database: dbStatus,
      maxLines: config.MAX_CONCURRENT_CALLS,
      sipRegion: config.TWILIO_SIP_REGION,
      tollFreePool: true,
      costCeilingStatus: "HEALTHY",
    });
  });
};
