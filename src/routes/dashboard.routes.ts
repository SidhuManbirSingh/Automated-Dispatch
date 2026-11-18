import { FastifyInstance, FastifyPluginAsync } from "fastify";
import { inMemoryStore } from "../lib/store";
import { isDbConnected } from "../lib/prisma";
import { config } from "../config";

export const dashboardRoutes: FastifyPluginAsync = async (app: FastifyInstance) => {
  app.get("/api/v1/dashboard/stats", async (_req, reply) => {
    const pendingCount = inMemoryStore.approvals.filter((a) => a.status === "PENDING").length;
    const filledCount = inMemoryStore.shifts.filter((s) => s.status === "ASSIGNED").length;

    return reply.status(200).send({
      activeCapacityHours: 40000,
      filledShiftsToday: filledCount,
      targetDailyShifts: 10,
      pendingApprovals: pendingCount,
      activeOutboundLines: 0,
      maxLines: config.MAX_CONCURRENT_CALLS,
      sipRegion: config.TWILIO_SIP_REGION,
      spend: {
        totalCostUsd: 14.20,
        ceilingUsd: config.DAILY_COST_CEILING_USD,
        totalCalls: 82,
      },
      databaseMode: isDbConnected() ? "MYSQL_ONLINE" : "SIMULATION_STORE",
    });
  });

  app.get("/api/v1/dashboard/shifts", async (_req, reply) => {
    return reply.status(200).send(inMemoryStore.shifts);
  });

  app.get("/api/v1/dashboard/persons", async (_req, reply) => {
    return reply.status(200).send(inMemoryStore.persons);
  });

  app.get("/api/v1/dashboard/approvals", async (_req, reply) => {
    const enriched = inMemoryStore.approvals.map((a) => {
      const shift = inMemoryStore.getShift(a.shiftId);
      const person = inMemoryStore.getPerson(a.personId);
      const callLog = inMemoryStore.callLogs.find((c) => c.id === a.callLogId || c.retellCallId === a.callLogId);
      return { ...a, shift, person, callLog };
    });
    return reply.status(200).send(enriched);
  });

  app.post("/api/v1/dashboard/persons/:id/toggle-dnc", async (req, reply) => {
    const { id } = req.params as { id: string };
    const person = inMemoryStore.getPerson(id);
    if (!person) {
      return reply.status(404).send({ error: "Person not found" });
    }
    person.dncFlag = !person.dncFlag;
    person.status = person.dncFlag ? "DNC_DO_NOT_CALL" : "ACTIVE";
    return reply.status(200).send(person);
  });
};
