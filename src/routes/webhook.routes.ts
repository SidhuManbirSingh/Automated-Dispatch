import { FastifyInstance, FastifyPluginAsync } from "fastify";
import { logger } from "../lib/logger";
import { inMemoryStore } from "../lib/store";
import { isDbConnected, prisma, toDbCallOutcome, toDbShiftStatus } from "../lib/prisma";
import { RetellWebhookEventSchema } from "../schemas";

function formatOutcomeLabel(code: string): string {
  switch (code) {
    case "TENTATIVE_ACCEPT":
      return "Tentative Accept";
    case "DECLINE":
      return "Declined";
    case "NO_ANSWER":
      return "No Answer";
    case "VOICEMAIL_LEFT":
      return "Voicemail";
    case "CALLBACK_REQUESTED":
      return "Callback Requested";
    case "DNC_REQUEST":
      return "DNC Opt-Out";
    default:
      return code;
  }
}

export const webhookRoutes: FastifyPluginAsync = async (app: FastifyInstance) => {
  app.post("/webhook/retell-call-complete", async (req, reply) => {
    const parse = RetellWebhookEventSchema.safeParse(req.body);
    if (!parse.success) {
      return reply.status(400).send({ error: "Invalid payload", details: parse.error.errors });
    }

    const { call_id, duration_ms, transcript, retell_llm_dynamic_variables, call_analysis } = parse.data;
    const durationSeconds = Math.round((duration_ms || 0) / 1000);
    const outcome = call_analysis?.custom_analysis_data?.outcome_code || "INCONCLUSIVE";
    const shift = inMemoryStore.getShift(retell_llm_dynamic_variables.shift_id);
    const person = inMemoryStore.getPerson(retell_llm_dynamic_variables.person_id);

    const existingCall = inMemoryStore.callLogs.find(
      (c) => c.retellCallId === call_id || c.id === call_id
    );

    if (existingCall && existingCall.status === "COMPLETED") {
      logger.info({ callId: call_id, outcome }, "Duplicate Retell webhook ignored (call already COMPLETED)");
      return reply.status(200).send({
        status: "already_processed",
        callId: call_id,
        outcome,
        shiftId: existingCall.shiftId,
      });
    }

    const transcriptText =
      transcript && transcript.length > 0
        ? transcript.map((t) => `${t.role}: ${t.content}`).join("\n")
        : `Call ${call_id} completed with outcome ${outcome}.`;
    const summaryText =
      call_analysis?.call_summary ||
      `${retell_llm_dynamic_variables.person_name} call outcome: ${formatOutcomeLabel(outcome)}.`;
    const nowDate = new Date();
    const logId = existingCall ? existingCall.id : `c-wh-${Date.now()}`;

    inMemoryStore.releaseLineByCallId(logId);
    inMemoryStore.releaseLineByCallId(call_id);

    if (existingCall) {
      existingCall.status = "COMPLETED";
      existingCall.outcome = formatOutcomeLabel(outcome);
      existingCall.durationSeconds = durationSeconds;
      existingCall.transcript = transcriptText;
      existingCall.summary = summaryText;
    } else {
      inMemoryStore.addCallLog({
        id: logId,
        shiftId: shift?.id || retell_llm_dynamic_variables.shift_id,
        shiftExternalId: shift?.externalId || retell_llm_dynamic_variables.shift_id,
        siteCode: shift?.siteCode || retell_llm_dynamic_variables.shift_id.split("-")[0] || "AAA",
        personId: person?.id || retell_llm_dynamic_variables.person_id,
        guardExternalId: person?.externalId || retell_llm_dynamic_variables.person_id,
        guardName: person ? `${person.firstName} ${person.lastName}` : retell_llm_dynamic_variables.person_name,
        phone: person?.phone || retell_llm_dynamic_variables.contact_phone,
        retellCallId: call_id,
        direction: "OUTBOUND",
        status: "COMPLETED",
        outcome: formatOutcomeLabel(outcome),
        attemptNumber: 1,
        maxAttempts: 3,
        durationSeconds,
        eligibilityCodes: person?.eligibilityCodes || ["ST"],
        guardActive: person ? person.guardActive : true,
        timestamp: nowDate.toISOString().replace("T", " ").slice(0, 19),
        transcript: transcriptText,
        summary: summaryText,
        costUsd: 0.12,
        createdAt: nowDate,
      });
    }

    if (isDbConnected()) {
      try {
        await prisma.activeLineLease.updateMany({
          where: { callId: { in: [logId, call_id] }, releasedAt: null },
          data: { releasedAt: nowDate },
        });
      } catch (err) {
        logger.warn({ err, callId: logId }, "Failed to release ActiveLineLease in MySQL on webhook completion");
      }

      if (shift && person) {
        try {
          await prisma.callLog.upsert({
            where: { retellCallId: call_id },
            create: {
              id: logId,
              shiftId: shift.id,
              personId: person.id,
              retellCallId: call_id,
              direction: "OUTBOUND",
              status: "COMPLETED",
              outcome: toDbCallOutcome(outcome),
              durationSeconds,
              transcript: transcriptText,
              summary: summaryText,
            },
            update: {
              status: "COMPLETED",
              outcome: toDbCallOutcome(outcome),
              durationSeconds,
              transcript: transcriptText,
              summary: summaryText,
            },
          });
        } catch (err) {
          logger.warn({ err, callId: call_id }, "Failed to upsert CallLog in MySQL on webhook completion");
        }
      }
    }

    if (outcome === "TENTATIVE_ACCEPT" && shift && person) {
      shift.status = "PENDING_APPROVAL";
      const existingAppr = inMemoryStore.approvals.find((a) => a.callLogId === logId);
      const apprId = existingAppr ? existingAppr.id : `appr-wh-${Date.now()}`;
      const expiresAt = new Date(Date.now() + 20 * 60000);

      if (!existingAppr) {
        inMemoryStore.addApproval({
          id: apprId,
          callLogId: logId,
          shiftId: shift.id,
          personId: person.id,
          status: "PENDING",
          expiresAt,
          createdAt: nowDate,
          updatedAt: nowDate,
        });
      }

      if (isDbConnected()) {
        try {
          await prisma.shift.update({
            where: { id: shift.id },
            data: { status: toDbShiftStatus(shift.status) },
          });
        } catch (err) {
          logger.warn({ err, shiftId: shift.id }, "Failed to update Shift status to PENDING_DISPATCHER_APPROVAL in MySQL");
        }

        try {
          await prisma.approvalQueue.upsert({
            where: { callLogId: logId },
            create: {
              id: apprId,
              callLogId: logId,
              shiftId: shift.id,
              personId: person.id,
              status: "PENDING",
              expiresAt,
            },
            update: {
              status: "PENDING",
              expiresAt,
            },
          });
        } catch (err) {
          logger.warn({ err, approvalId: apprId, callLogId: logId }, "Failed to upsert ApprovalQueue in MySQL");
        }
      }
    } else if (outcome === "DNC_REQUEST" && person) {
      person.dncFlag = true;
      person.guardActive = false;
      person.status = "DNC_DO_NOT_CALL";
      if (isDbConnected()) {
        try {
          await prisma.person.update({
            where: { id: person.id },
            data: { dncFlag: true, status: "DNC_DO_NOT_CALL" },
          });
        } catch (err) {
          logger.warn({ err, personId: person.id }, "Failed to set DNC flag on Person in MySQL");
        }
      }
    }

    logger.info({ callId: call_id, outcome, durationSeconds }, "Retell call complete webhook processed");

    return reply.status(200).send({
      status: "processed",
      callId: call_id,
      outcome,
      shiftId: shift?.id ?? retell_llm_dynamic_variables.shift_id,
    });
  });
};
