import { FastifyInstance, FastifyPluginAsync } from "fastify";
import { config } from "../config";
import { inMemoryStore } from "../lib/store";
import { DispatchTriggerSchema } from "../schemas";

const TOLL_FREE_POOL = [
  { channelIndex: 1, regionServed: "VAN", allocatedPhoneNumber: config.TWILIO_TOLLFREE_LINE_1, status: "IDLE" },
  { channelIndex: 2, regionServed: "SUR", allocatedPhoneNumber: config.TWILIO_TOLLFREE_LINE_2, status: "IDLE" },
  { channelIndex: 3, regionServed: "VIC", allocatedPhoneNumber: config.TWILIO_TOLLFREE_LINE_3, status: "IDLE" },
  { channelIndex: 4, regionServed: "KEL", allocatedPhoneNumber: config.TWILIO_TOLLFREE_LINE_4, status: "IDLE" },
  { channelIndex: 5, regionServed: "OVERFLOW", allocatedPhoneNumber: config.TWILIO_TOLLFREE_LINE_5, status: "IDLE" },
];

export const dispatchRoutes: FastifyPluginAsync = async (app: FastifyInstance) => {
  app.get("/api/v1/dispatch/lines", async (_req, reply) => {
    return reply.status(200).send({
      totalChannels: 5,
      activeCount: 0,
      sipRegion: config.TWILIO_SIP_REGION,
      tollFreePool: true,
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

    shift.status = "DISPATCH_IN_PROGRESS";

    return reply.status(200).send({
      shiftId: shift.id,
      shiftExternalId: shift.externalId,
      candidatesContacted: 1,
      callsInitiated: [
        {
          personName: `${candidate.firstName} ${candidate.lastName}`,
          phone: candidate.phone,
          channelIndex: 1,
          callerId: config.TWILIO_TOLLFREE_LINE_1,
        },
      ],
    });
  });
};
