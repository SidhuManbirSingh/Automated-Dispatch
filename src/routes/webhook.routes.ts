import { FastifyInstance, FastifyPluginAsync } from "fastify";
import { logger } from "../lib/logger";
import { RetellWebhookEventSchema } from "../schemas";

export const webhookRoutes: FastifyPluginAsync = async (app: FastifyInstance) => {
  app.post("/webhook/retell-call-complete", async (req, reply) => {
    const parse = RetellWebhookEventSchema.safeParse(req.body);
    if (!parse.success) {
      return reply.status(400).send({ error: "Invalid payload", details: parse.error.errors });
    }

    const { call_id, duration_ms, call_analysis } = parse.data;
    const durationSeconds = Math.round((duration_ms || 0) / 1000);
    const outcome = call_analysis?.custom_analysis_data?.outcome_code || "INCONCLUSIVE";

    logger.info({ callId: call_id, outcome, durationSeconds }, "Retell call complete webhook processed");

    return reply.status(200).send({
      status: "processed",
      callId: call_id,
      outcome,
    });
  });
};
