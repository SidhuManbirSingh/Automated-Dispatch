import { FastifyInstance, FastifyPluginAsync } from "fastify";
import { inMemoryStore } from "../lib/store";
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

    const operatorName = dispatcherName || "Authenticated Operator";
    approval.dispatcherName = operatorName;
    approval.dispatcherId = dispatcherId || "operator@guardteck.com";
    approval.actionTimestamp = new Date();

    if (action === "APPROVE") {
      approval.status = "APPROVED";
      if (shift) shift.status = "ASSIGNED";
      if (person) person.totalShiftsCompleted++;

      return reply.status(200).send({
        status: "APPROVED",
        dispatcherName: operatorName,
        shiftId,
        personId,
      });
    } else {
      approval.status = action === "REJECT" ? "REJECTED" : "DECLINED";
      if (shift) shift.status = "OPEN";

      return reply.status(200).send({
        status: approval.status,
        dispatcherName: operatorName,
      });
    }
  });
};
