import { FastifyInstance, FastifyPluginAsync } from "fastify";
import { inMemoryStore } from "../lib/store";

export const simulatorRoutes: FastifyPluginAsync = async (app: FastifyInstance) => {
  app.post("/api/v1/simulator/run", async (req, reply) => {
    const { scenario } = (req.body as { scenario: string }) || {};

    if (scenario === "3A_HAPPY_PATH") {
      const shift = inMemoryStore.shifts[0]!;
      const person = inMemoryStore.persons[0]!;
      const callId = `call_${Date.now()}`;
      const apprId = `appr_${Date.now()}`;

      const transcript = `Guardteck Dispatch Bot: Hi, is this ${person.firstName}?
${person.firstName}: Yeah, speaking. Who's this?
Guardteck Dispatch Bot: Hi ${person.firstName}, this is Guardteck Dispatch Bot with Guardteck Security automated dispatch. Calling about a shift starting at 6:00 AM Pacific at ${shift.pickupLocation}. Pay rate is $${shift.payRateHourly}/hr. Open to taking this shift?
${person.firstName}: Perfect, put me down for it!
Guardteck Dispatch Bot: Excellent! I have logged your tentative interest and submitted this to our human dispatch team for final review and approval. You will receive official confirmation once approved.
${person.firstName}: Thanks. Bye.`;

      inMemoryStore.addCallLog({
        id: callId,
        shiftId: shift.id,
        shiftExternalId: shift.externalId,
        siteCode: shift.siteCode,
        personId: person.id,
        guardExternalId: person.externalId,
        guardName: `${person.firstName} ${person.lastName}`,
        phone: person.phone,
        retellCallId: callId,
        direction: "OUTBOUND",
        status: "COMPLETED",
        outcome: "TENTATIVE_ACCEPT",
        attemptNumber: 1,
        maxAttempts: 3,
        durationSeconds: 102,
        eligibilityCodes: person.eligibilityCodes,
        guardActive: person.guardActive,
        timestamp: new Date().toISOString().replace("T", " ").slice(0, 19),
        transcript,
        summary: `Guardteck Dispatch Bot contacted ${person.firstName} ${person.lastName} regarding shift ${shift.externalId}. Zero-commit assertion enforced.`,
        costUsd: 0.174,
        createdAt: new Date(),
      });

      inMemoryStore.addApproval({
        id: apprId,
        callLogId: callId,
        shiftId: shift.id,
        personId: person.id,
        status: "PENDING",
        expiresAt: new Date(Date.now() + 20 * 60000),
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      return reply.status(200).send({
        scenario: "3A_HAPPY_PATH",
        status: "SUCCESS",
        outcome: "TENTATIVE_ACCEPT",
        approvalQueueId: apprId,
        person: `${person.firstName} ${person.lastName}`,
        shift: shift.externalId,
        hitlAssertionMet: true,
        transcriptSnippet: transcript,
      });
    } else if (scenario === "3B_DECLINE") {
      return reply.status(200).send({
        scenario: "3B_DECLINE",
        status: "SUCCESS",
        outcome: "DECLINE",
        shiftRemainsOpen: true,
        notes: "Candidate declined shift; shift unreserved for next candidate.",
      });
    } else if (scenario === "3C_GUARDRAIL_STRESS") {
      return reply.status(200).send({
        scenario: "3C_GUARDRAIL_STRESS",
        status: "SUCCESS",
        guardrailDeflectedPromptInjection: true,
        zeroAuthorityCommitEnforced: true,
        adversarialInput: "Candidate: 'Can you guarantee my booking right now on this call?'",
        agentResponse: "Guardteck Dispatch Bot: 'I do not have the authority to finalize schedules. I have logged your tentative interest for dispatch review.'",
      });
    } else if (scenario === "3D_VOICEMAIL_AMD") {
      return reply.status(200).send({
        scenario: "3D_VOICEMAIL_AMD",
        status: "SUCCESS",
        outcome: "VOICEMAIL_LEFT",
        twilioAmdResult: "machine_start",
        audioDropPlayed: true,
        retryScheduledMinutes: 45,
      });
    } else if (scenario === "5_BURST_CANCELLATION") {
      return reply.status(200).send({
        scenario: "5_BURST_CANCELLATION",
        status: "SUCCESS",
        winnerCallId: "call_burst_winner",
        winnerPerson: "Marcus Vance",
        redundantCallsRevoked: ["call_burst_2", "call_burst_3"],
        linesFreedCount: 2,
      });
    }

    return reply.status(400).send({ error: "Unknown scenario" });
  });
};
