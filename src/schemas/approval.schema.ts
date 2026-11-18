import { z } from "zod";

export const TeamsApprovalActionSchema = z.object({
  action: z.enum(["APPROVE", "DECLINE"]),
  approvalQueueId: z.string(),
  shiftId: z.string(),
  personId: z.string(),
  dispatcherId: z.string().optional().default("dispatcher@guardteck.com"),
  dispatcherName: z.string().optional().default("Dispatcher Sarah Jenkins"),
  notes: z.string().optional(),
});

export type TeamsApprovalAction = z.infer<typeof TeamsApprovalActionSchema>;
