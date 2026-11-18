import { FastifyInstance, FastifyPluginAsync } from "fastify";
import { config } from "../config";
import { inMemoryStore } from "../lib/store";
import { DispatchTriggerSchema } from "../schemas";

const TOLL_FREE_POOL = [
  { channelIndex: 1, lineLabel: "Line 01", status: "Idle", shiftId: null, shiftExternalId: null, guardExternalId: null, guardName: null, durationSeconds: 0, allocatedPhoneNumber: config.TWILIO_TOLLFREE_LINE_1 },
  { channelIndex: 2, lineLabel: "Line 02", status: "Idle", shiftId: null, shiftExternalId: null, guardExternalId: null, guardName: null, durationSeconds: 0, allocatedPhoneNumber: config.TWILIO_TOLLFREE_LINE_2 },
  { channelIndex: 3, lineLabel: "Line 03", status: "Idle", shiftId: null, shiftExternalId: null, guardExternalId: null, guardName: null, durationSeconds: 0, allocatedPhoneNumber: config.TWILIO_TOLLFREE_LINE_3 },
  { channelIndex: 4, lineLabel: "Line 04", status: "Idle", shiftId: null, shiftExternalId: null, guardExternalId: null, guardName: null, durationSeconds: 0, allocatedPhoneNumber: config.TWILIO_TOLLFREE_LINE_4 },
  { channelIndex: 5, lineLabel: "Line 05", status: "Idle", shiftId: null, shiftExternalId: null, guardExternalId: null, guardName: null, durationSeconds: 0, allocatedPhoneNumber: config.TWILIO_TOLLFREE_LINE_5 },
];

export const dispatchRoutes: FastifyPluginAsync = async (app: FastifyInstance) => {
  app.get("/api/v1/dispatch/lines", async (_req, reply) => {
    return reply.status(200).send({
      totalChannels: 5,
      activeCount: 0,
      lines: TOLL_FREE_POOL,
    });
  });

  app.post("/api/v1/dispatch/trigger", async (req, reply) => {
    const parse = DispatchTriggerSchema.safeParse(req.body);
    if (!parse.success) {
      return reply.status(400).send({ error: "Invalid payload", details: parse.error.errors });
    }
    const { shiftId } = parse.data;
    const shift = inMemoryStore.getShift(shiftId);
    if (!shift) {
      return reply.status(404).send({ error: "Shift not found" });
    }

    const candidate = inMemoryStore.persons.find((p) => p.status === "ACTIVE" && !p.dncFlag);
    if (!candidate) {
      return reply.status(200).send({ status: "NO_CANDIDATES" });
    }

    shift.status = "OUTREACH_ACTIVE";

    return reply.status(200).send({
      status: "INITIATED",
      shiftExternalId: shift.externalId,
      guardExternalId: candidate.externalId,
      guardName: `${candidate.firstName} ${candidate.lastName}`,
    });
  });
};
