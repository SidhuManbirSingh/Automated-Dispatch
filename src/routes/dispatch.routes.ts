import { FastifyInstance, FastifyPluginAsync } from "fastify";
import { inMemoryStore } from "../lib/store";
import { isDbConnected, prisma, toDbShiftStatus } from "../lib/prisma";
import { logger } from "../lib/logger";
import { DispatchTriggerSchema } from "../schemas";

export const dispatchRoutes: FastifyPluginAsync = async (app: FastifyInstance) => {
  app.get("/api/v1/dispatch/sites", async (_req, reply) => {
    const enriched = inMemoryStore.sites.map((s) => ({
      ...s,
      trainedOfficerCount: inMemoryStore.persons.filter((p) => p.trainedSites.includes(s.code) && !p.dncFlag).length,
      openShiftCount: inMemoryStore.shifts.filter((sh) => sh.siteCode === s.code && sh.status === "OPEN").length,
    }));
    return reply.status(200).send(enriched);
  });

  app.get("/api/v1/dispatch/sites/:siteCode/trained", async (req, reply) => {
    const { siteCode } = req.params as { siteCode: string };
    const code = siteCode.toUpperCase();
    const site = inMemoryStore.sites.find((s) => s.code === code);
    if (!site) {
      return reply.status(404).send({ error: "Site not found" });
    }
    const officers = inMemoryStore.persons.filter((p) => p.trainedSites.includes(code));
    return reply.status(200).send({ site, totalTrained: officers.length, officers });
  });

  app.get("/api/v1/dispatch/lines", async (_req, reply) => {
    return reply.status(200).send(inMemoryStore.getLinesPayload());
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

    const candidates = inMemoryStore.persons.filter(
      (p) => p.trainedSites.includes(shift.siteCode) && p.status === "ACTIVE" && !p.dncFlag
    );
    if (candidates.length === 0) {
      return reply.status(200).send({
        status: "NO_CANDIDATES",
        siteCode: shift.siteCode,
        message: `No active trained officers found for site ${shift.siteCode}.`,
      });
    }

    const batchTs = Date.now();
    shift.status = "OUTREACH_ACTIVE";

    if (isDbConnected()) {
      try {
        await prisma.shift.update({
          where: { id: shift.id },
          data: { status: toDbShiftStatus(shift.status) },
        });
      } catch (err) {
        logger.warn({ err, shiftId: shift.id }, "Failed to update Shift status to DISPATCH_IN_PROGRESS in MySQL");
      }
    }

    const linesAssigned: string[] = [];
    const callsCreated: Array<{ guardExternalId: string; guardName: string; status: string }> = [];

    for (let idx = 0; idx < candidates.length; idx++) {
      const officer = candidates[idx]!;
      const callId = `c-${batchTs}-${idx + 1}`;
      const guardName = `${officer.firstName} ${officer.lastName}`;
      const allocated = inMemoryStore.allocateIdleLine({
        callId,
        shiftId: shift.id,
        shiftExternalId: shift.externalId,
        siteCode: shift.siteCode,
        personId: officer.id,
        guardExternalId: officer.externalId,
        guardName,
        durationSeconds: 1,
      });

      const lineLabel = allocated?.lineLabel ?? null;
      const channelIndex = allocated?.channelIndex ?? null;
      const callStatus = lineLabel ? "IN_PROGRESS" : "SCHEDULED";
      const outcome = lineLabel ? "In Progress" : "Queued";
      const transcript = lineLabel
        ? `Active call on ${lineLabel} for ${shift.externalId} (${shift.siteCode}) offering shift hours ${shift.timeWindow} (${shift.durationHours} hrs) at $${shift.payRateHourly.toFixed(2)}/hr.`
        : `Queued in ${shift.siteCode} site dispatch batch for ${shift.externalId} (${shift.timeWindow}, $${shift.payRateHourly.toFixed(2)}/hr).`;
      const nowDate = new Date();
      const retellCallId = `call_${batchTs}_${idx + 1}`;
      const summary = `Outreach for site ${shift.siteCode} (${shift.timeWindow}) to ${guardName} (${officer.externalId}).`;

      inMemoryStore.addCallLog({
        id: callId,
        shiftId: shift.id,
        shiftExternalId: shift.externalId,
        siteCode: shift.siteCode,
        personId: officer.id,
        guardExternalId: officer.externalId,
        guardName,
        phone: officer.phone,
        retellCallId,
        direction: "OUTBOUND",
        status: callStatus,
        outcome,
        attemptNumber: 1,
        maxAttempts: 3,
        durationSeconds: lineLabel ? 1 : 0,
        eligibilityCodes: officer.eligibilityCodes,
        guardActive: officer.guardActive,
        timestamp: nowDate.toISOString().replace("T", " ").slice(0, 19),
        transcript,
        summary,
        costUsd: lineLabel ? 0.05 : 0.0,
        createdAt: nowDate,
      });

      if (isDbConnected()) {
        try {
          await prisma.callLog.create({
            data: {
              id: callId,
              shiftId: shift.id,
              personId: officer.id,
              retellCallId,
              direction: "OUTBOUND",
              status: callStatus,
              outcome: null,
              attemptNumber: 1,
              maxAttempts: 3,
              durationSeconds: lineLabel ? 1 : 0,
              transcript,
              summary,
            },
          });
        } catch (err) {
          logger.warn({ err, callId }, "Failed to persist CallLog in MySQL during dispatch trigger");
        }

        if (channelIndex !== null) {
          try {
            await prisma.activeLineLease.create({
              data: {
                callId,
                shiftId: shift.id,
                personId: officer.id,
                channelIndex,
                expiresAt: new Date(Date.now() + 6 * 60000),
              },
            });
          } catch (err) {
            logger.warn({ err, callId, channelIndex }, "Failed to persist ActiveLineLease in MySQL during dispatch trigger");
          }
        }
      }

      if (lineLabel) linesAssigned.push(lineLabel);
      callsCreated.push({
        guardExternalId: officer.externalId,
        guardName,
        status: outcome,
      });
    }

    return reply.status(200).send({
      status: "INITIATED",
      siteCode: shift.siteCode,
      shiftExternalId: shift.externalId,
      timeWindow: shift.timeWindow,
      totalTrainedContacted: callsCreated.length,
      activeLinesAssigned: linesAssigned,
      queuedCount: callsCreated.length - linesAssigned.length,
      calls: callsCreated,
    });
  });
};
