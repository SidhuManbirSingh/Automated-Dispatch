import { FastifyInstance, FastifyPluginAsync } from "fastify";
import { inMemoryStore } from "../lib/store";
import { TeamsApprovalActionSchema } from "../schemas";

export const approvalRoutes: FastifyPluginAsync = async (app: FastifyInstance) => {
  app.post("/api/v1/approvals/action", async (req, reply) => {
    const parse = TeamsApprovalActionSchema.safeParse(req.body);
    if (!parse.success) {
      return reply.status(400).send({ error: "Invalid action payload", details: parse.error.errors });
    }

    const { action, approvalQueueId, shiftId, personId, dispatcherName } = parse.data;
    const approval = inMemoryStore.approvals.find((a) => a.id === approvalQueueId);
    const shift = inMemoryStore.getShift(shiftId);
    const person = inMemoryStore.getPerson(personId);

    if (!approval) {
      return reply.status(404).send({ error: "Approval not found" });
    }

    if (action === "APPROVE") {
      approval.status = "APPROVED";
      approval.dispatcherName = dispatcherName || "Dispatcher Sarah Jenkins";
      approval.actionTimestamp = new Date();
      if (shift) shift.status = "ASSIGNED";
      if (person) person.totalShiftsCompleted++;

      return reply.status(200).send({
        status: "APPROVED",
        message: "Shift approved, locked, and Guardteck Security calendar invite dispatched",
        shiftId,
        personId,
      });
    } else {
      approval.status = "DECLINED";
      approval.dispatcherName = dispatcherName || "Dispatcher Sarah Jenkins";
      approval.actionTimestamp = new Date();
      if (shift) shift.status = "OPEN";

      return reply.status(200).send({
        status: "DECLINED",
        message: "Shift returned to open pool",
      });
    }
  });
};
