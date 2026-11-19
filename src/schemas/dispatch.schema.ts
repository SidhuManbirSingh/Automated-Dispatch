import { z } from "zod";

export const DispatchTriggerSchema = z.object({
  shiftId: z.string(),
  maxCandidates: z.number().int().min(1).max(200).optional().default(25),
  targetRegions: z.array(z.string()).optional(),
});

export type DispatchTrigger = z.infer<typeof DispatchTriggerSchema>;

export const ToggleDncSchema = z.object({
  personId: z.string(),
  reason: z.string().optional(),
});

export type ToggleDnc = z.infer<typeof ToggleDncSchema>;
