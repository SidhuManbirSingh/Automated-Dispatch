import { FastifyInstance, FastifyPluginAsync } from "fastify";
import { inMemoryStore } from "../lib/store";
import { isDbConnected, prisma } from "../lib/prisma";
import { logger } from "../lib/logger";
import { config } from "../config";

export const dashboardRoutes: FastifyPluginAsync = async (app: FastifyInstance) => {
  app.get("/api/v1/dashboard/stats", async (_req, reply) => {
    const pendingCount = inMemoryStore.approvals.filter((a) => a.status === "PENDING").length;
    return reply.status(200).send({
      pendingApprovals: pendingCount,
      activeOutboundLines: inMemoryStore.getActiveLineCount(),
      maxLines: config.MAX_CONCURRENT_CALLS,
      totalCallRecords: inMemoryStore.callLogs.length,
      openShiftsCount: inMemoryStore.shifts.filter((s) => s.status === "OPEN").length,
      totalSites: inMemoryStore.sites.length,
      totalOfficers: inMemoryStore.persons.length,
      sipRegion: config.TWILIO_SIP_REGION,
    });
  });

  app.get("/api/v1/dashboard/shifts", async (_req, reply) => {
    return reply.status(200).send(inMemoryStore.shifts);
  });

  app.post("/api/v1/dashboard/shifts/:id/hours", async (req, reply) => {
    const { id } = req.params as { id: string };
    const shift = inMemoryStore.getShift(id);
    if (!shift) {
      return reply.status(404).send({ error: "Shift not found" });
    }
    const body = (req.body as { startHour?: string; endHour?: string; dateLabel?: string; durationHours?: number }) || {};
    const startH = (body.startHour || shift.startHour).replace(":", "").padStart(4, "0");
    const endH = (body.endHour || shift.endHour).replace(":", "").padStart(4, "0");
    const dateLabel = body.dateLabel || shift.dateLabel;
    shift.startHour = startH;
    shift.endHour = endH;
    shift.dateLabel = dateLabel;

    const parts = dateLabel.split("-").map(Number);
    if (parts.length === 3 && parts.every((n) => Number.isFinite(n))) {
      const [yr, mo, dy] = parts as [number, number, number];
      const baseDate = new Date(yr, mo - 1, dy, 0, 0, 0, 0);
      if (!Number.isNaN(baseDate.getTime())) {
        const sh = Number(startH.slice(0, 2));
        const sm = Number(startH.slice(2, 4));
        const startTime = new Date(baseDate);
        startTime.setHours(sh, sm, 0, 0);
        const durHours = body.durationHours ? Number(body.durationHours) : shift.durationHours;
        const endTime = new Date(startTime.getTime() + durHours * 3600 * 1000);
        shift.shiftDate = baseDate;
        shift.startTime = startTime;
        shift.endTime = endTime;
      }
    }

    if (body.durationHours) shift.durationHours = Number(body.durationHours);
    shift.timeWindow = `${dateLabel} ${startH}-${endH}`;

    if (isDbConnected()) {
      try {
        await prisma.shift.update({
          where: { id: shift.id },
          data: {
            timeWindow: shift.timeWindow,
            shiftDate: shift.shiftDate,
            startTime: shift.startTime,
            endTime: shift.endTime,
            durationHours: shift.durationHours,
          },
        });
      } catch (err) {
        logger.warn({ err, shiftId: shift.id }, "Failed to persist shift hour update to MySQL");
      }
    }

    return reply.status(200).send(shift);
  });

  app.get("/api/v1/dashboard/persons", async (_req, reply) => {
    return reply.status(200).send(inMemoryStore.persons);
  });

  app.get("/api/v1/dashboard/calls", async (_req, reply) => {
    return reply.status(200).send(inMemoryStore.callLogs);
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
    person.guardActive = !person.dncFlag;
    person.status = person.dncFlag ? "DNC_DO_NOT_CALL" : "ACTIVE";

    if (isDbConnected()) {
      try {
        await prisma.person.update({
          where: { id: person.id },
          data: {
            dncFlag: person.dncFlag,
            status: person.status,
          },
        });
      } catch (err) {
        logger.warn({ err, personId: person.id }, "Failed to persist DNC toggle in MySQL");
      }
    }

    return reply.status(200).send(person);
  });
};
