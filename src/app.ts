import fastify, { FastifyInstance } from "fastify";
import cors from "@fastify/cors";
import { logger } from "./lib/logger";
import { healthRoutes } from "./routes/health.routes";
import { uiRoutes } from "./routes/ui.routes";
import { dashboardRoutes } from "./routes/dashboard.routes";
import { dispatchRoutes } from "./routes/dispatch.routes";
import { approvalRoutes } from "./routes/approval.routes";
import { simulatorRoutes } from "./routes/simulator.routes";
import { webhookRoutes } from "./routes/webhook.routes";

export function buildApp(): FastifyInstance {
  const app = fastify({
    logger: false,
    trustProxy: true,
  });

  app.register(cors, {
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  });

  app.register(healthRoutes);
  app.register(uiRoutes);
  app.register(dashboardRoutes);
  app.register(dispatchRoutes);
  app.register(approvalRoutes);
  app.register(simulatorRoutes);
  app.register(webhookRoutes);

  app.setErrorHandler((error, _request, reply) => {
    logger.error({ err: error }, "Unhandled HTTP error");
    reply.status(error.statusCode || 500).send({
      error: error.name || "InternalServerError",
      message: error.message || "An unexpected error occurred",
      statusCode: error.statusCode || 500,
    });
  });

  return app;
}
