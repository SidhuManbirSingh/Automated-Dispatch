import { z } from "zod";

export const TeamsApprovalActionSchema = z.object({
  action: z.enum(["APPROVE", "REJECT", "DECLINE"]),
  approvalQueueId: z.string(),
  shiftId: z.string(),
  personId: z.string(),
  dispatcherId: z.string().optional().default("operator@guardteck.com"),
  dispatcherName: z.string().optional().default("Authenticated Operator"),
  notes: z.string().optional(),
});

export type TeamsApprovalAction = z.infer<typeof TeamsApprovalActionSchema>;
