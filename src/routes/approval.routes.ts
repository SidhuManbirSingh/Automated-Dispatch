import { FastifyInstance, FastifyPluginAsync } from "fastify";
import { inMemoryStore } from "../lib/store";
import { isDbConnected, prisma, toDbApprovalStatus, toDbShiftStatus } from "../lib/prisma";
import { logger } from "../lib/logger";
import { TeamsApprovalActionSchema } from "../schemas";

export const approvalRoutes: FastifyPluginAsync = async (app: FastifyInstance) => {
  app.post("/api/v1/approvals/action", async (req, reply) => {
    const parse = TeamsApprovalActionSchema.safeParse(req.body);
    if (!parse.success) {
      return reply.status(400).send({ error: "Invalid action payload", details: parse.error.errors });
    }

    const { action, approvalQueueId, shiftId, personId, dispatcherName, dispatcherId } = parse.data;
    const approval = inMemoryStore.approvals.find((a) => a.id === approvalQueueId);
    const shift = inMemoryStore.getShift(shiftId);
    const person = inMemoryStore.getPerson(personId);

    if (!approval) {
      return reply.status(404).send({ error: "Approval not found" });
    }

    const canonicalShiftId = shift?.id ?? shiftId;
    inMemoryStore.releaseLinesForShift(canonicalShiftId);

    const operatorName = dispatcherName || "Authenticated Operator";
    const operatorEmail = dispatcherId || "operator@guardteck.com";
    const actionTs = new Date();
    approval.dispatcherName = operatorName;
    approval.dispatcherId = operatorEmail;
    approval.actionTimestamp = actionTs;

    if (isDbConnected()) {
      try {
        await prisma.activeLineLease.updateMany({
          where: { shiftId: canonicalShiftId, releasedAt: null },
          data: { releasedAt: actionTs },
        });
      } catch (err) {
        logger.warn({ err, shiftId: canonicalShiftId }, "Failed to release ActiveLineLease rows in MySQL on approval action");
      }
    }

    if (action === "APPROVE") {
      approval.status = "APPROVED";
      if (shift) shift.status = "ASSIGNED";
      if (person) person.totalShiftsCompleted++;

      if (isDbConnected()) {
        try {
          await prisma.approvalQueue.update({
            where: { id: approval.id },
            data: {
              status: "APPROVED",
              dispatcherId: operatorEmail,
              dispatcherName: operatorName,
              actionTimestamp: actionTs,
            },
          });
        } catch (err) {
          logger.warn({ err, approvalId: approval.id }, "Failed to update ApprovalQueue row to APPROVED in MySQL");
        }

        if (shift) {
          try {
            await prisma.shift.update({
              where: { id: shift.id },
              data: { status: toDbShiftStatus(shift.status) },
            });
          } catch (err) {
            logger.warn({ err, shiftId: shift.id }, "Failed to update Shift status to ASSIGNED in MySQL");
          }
        }

        if (person) {
          try {
            await prisma.person.update({
              where: { id: person.id },
              data: { totalShiftsCompleted: person.totalShiftsCompleted },
            });
          } catch (err) {
            logger.warn({ err, personId: person.id }, "Failed to increment Person totalShiftsCompleted in MySQL");
          }
        }

        if (shift && person) {
          try {
            await prisma.shiftAssignment.upsert({
              where: { approvalQueueId: approval.id },
              create: {
                shiftId: shift.id,
                personId: person.id,
                approvalQueueId: approval.id,
                status: "CONFIRMED",
                confirmedAt: actionTs,
              },
              update: {
                status: "CONFIRMED",
                confirmedAt: actionTs,
              },
            });
          } catch (err) {
            logger.warn({ err, approvalId: approval.id, shiftId: shift.id }, "Failed to upsert ShiftAssignment in MySQL");
          }
        }
      }

      return reply.status(200).send({
        status: "APPROVED",
        dispatcherName: operatorName,
        shiftId: canonicalShiftId,
        personId,
      });
    } else {
      approval.status = action === "REJECT" ? "REJECTED" : "DECLINED";
      if (shift) shift.status = "OPEN";

      if (isDbConnected()) {
        try {
          await prisma.approvalQueue.update({
            where: { id: approval.id },
            data: {
              status: toDbApprovalStatus(approval.status),
              dispatcherId: operatorEmail,
              dispatcherName: operatorName,
              actionTimestamp: actionTs,
            },
          });
        } catch (err) {
          logger.warn({ err, approvalId: approval.id }, "Failed to update ApprovalQueue row to DECLINED in MySQL");
        }

        if (shift) {
          try {
            await prisma.shift.update({
              where: { id: shift.id },
              data: { status: toDbShiftStatus(shift.status) },
            });
          } catch (err) {
            logger.warn({ err, shiftId: shift.id }, "Failed to reopen Shift status to OPEN in MySQL");
          }
        }
      }

      return reply.status(200).send({
        status: approval.status,
        dispatcherName: operatorName,
      });
    }
  });
};
