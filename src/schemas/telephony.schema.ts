import { z } from "zod";

export const RetellDynamicVariablesSchema = z.object({
  person_name: z.string(),
  person_first_name: z.string().optional(),
  person_id: z.string(),
  contact_phone: z.string(),
  shift_id: z.string(),
  shift_date: z.string(),
  start_time: z.string(),
  end_time: z.string(),
  pickup_location: z.string(),
  dropoff_location: z.string(),
  equipment_type: z.string(),
  pay_rate: z.string(),
  shift_duration_hours: z.coerce.number(),
  special_instructions: z.string().optional(),
  dispatch_desk_phone: z.string().optional(),
});

export type RetellDynamicVariables = z.infer<typeof RetellDynamicVariablesSchema>;

export const RetellWebhookEventSchema = z.object({
  event: z.string(),
  call_id: z.string(),
  call_type: z.string().optional(),
  from_number: z.string().optional(),
  to_number: z.string().optional(),
  duration_ms: z.number().optional(),
  recording_url: z.string().optional(),
  transcript: z.array(z.object({
    role: z.string(),
    content: z.string(),
  })).optional(),
  retell_llm_dynamic_variables: RetellDynamicVariablesSchema,
  call_analysis: z.object({
    call_summary: z.string().optional(),
    user_sentiment: z.string().optional(),
    custom_analysis_data: z.object({
      outcome_code: z.string().optional(),
      person_notes: z.string().optional(),
    }).optional(),
  }).optional(),
});

export type RetellWebhookEvent = z.infer<typeof RetellWebhookEventSchema>;
