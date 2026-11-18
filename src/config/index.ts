import { z } from "zod";
import dotenv from "dotenv";

dotenv.config();

export const ConfigSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.coerce.number().default(3000),
  HOST: z.string().default("0.0.0.0"),
  LOG_LEVEL: z.string().default("info"),

  DATABASE_URL: z.string().default("mysql://dispatch_user:dispatch_secure_pass@localhost:3306/automated_dispatch"),

  RETELL_API_KEY: z.string().default("YOUR_RETELL_API_KEY_HERE"),
  RETELL_AGENT_ID: z.string().default("YOUR_RETELL_AGENT_ID_HERE"),
  RETELL_WEBHOOK_SECRET: z.string().default("YOUR_RETELL_WEBHOOK_SECRET_HERE"),

  TWILIO_ACCOUNT_SID: z.string().default("YOUR_TWILIO_ACCOUNT_SID_HERE"),
  TWILIO_AUTH_TOKEN: z.string().default("YOUR_TWILIO_AUTH_TOKEN_HERE"),
  TWILIO_SIP_REGION: z.string().default("us-west-2"),
  TWILIO_SIP_EDGE: z.string().default("umatilla"),
  TWILIO_SIP_TERMINATION_URI: z.string().default("guardteck-dispatch.pstn.us2.twilio.com"),
  TWILIO_PHONE_POOL: z.string().default("+18885550101,+18885550102,+18885550103,+18885550104,+18885550105"),
  TWILIO_TOLLFREE_LINE_1: z.string().default("+18885550101"),
  TWILIO_TOLLFREE_LINE_2: z.string().default("+18885550102"),
  TWILIO_TOLLFREE_LINE_3: z.string().default("+18885550103"),
  TWILIO_TOLLFREE_LINE_4: z.string().default("+18885550104"),
  TWILIO_TOLLFREE_LINE_5: z.string().default("+18885550105"),

  TEAMS_APPROVAL_WEBHOOK_URL: z.string().default("https://outlook.office.com/webhook/YOUR_TEAMS_WEBHOOK_URL_HERE"),
  TEAMS_BOT_APP_ID: z.string().default("YOUR_TEAMS_BOT_APP_ID_HERE"),
  TEAMS_BOT_APP_PASSWORD: z.string().default("YOUR_TEAMS_BOT_APP_PASSWORD_HERE"),

  AZURE_TENANT_ID: z.string().default("YOUR_AZURE_TENANT_ID_HERE"),
  AZURE_CLIENT_ID: z.string().default("YOUR_AZURE_CLIENT_ID_HERE"),
  AZURE_CLIENT_SECRET: z.string().default("YOUR_AZURE_CLIENT_SECRET_HERE"),
  DISPATCH_SHARED_MAILBOX: z.string().default("dispatch-alerts@guardteck.com"),

  DAILY_COST_CEILING_USD: z.coerce.number().default(25.00),
  MAX_CONCURRENT_CALLS: z.coerce.number().default(5),
  CALL_PACING_MS: z.coerce.number().default(1200),
  MAX_CALL_DURATION_MINUTES: z.coerce.number().default(6),
  MIN_RETRY_DELAY_MINUTES: z.coerce.number().default(45),
});

export type AppConfig = z.infer<typeof ConfigSchema>;

let parsedConfig: AppConfig;

try {
  parsedConfig = ConfigSchema.parse(process.env);
} catch (error) {
  if (error instanceof z.ZodError) {
    console.warn("Warning: Environment configuration has missing/invalid values. Falling back to defaults for development.");
  }
  parsedConfig = ConfigSchema.parse({});
}

export const config = parsedConfig;

export function hasRealCredentials(service: "retell" | "twilio" | "teams" | "azure"): boolean {
  switch (service) {
    case "retell":
      return !config.RETELL_API_KEY.startsWith("YOUR_");
    case "twilio":
      return !config.TWILIO_ACCOUNT_SID.startsWith("YOUR_") && !config.TWILIO_AUTH_TOKEN.startsWith("YOUR_");
    case "teams":
      return !config.TEAMS_APPROVAL_WEBHOOK_URL.includes("YOUR_");
    case "azure":
      return !config.AZURE_CLIENT_ID.startsWith("YOUR_") && !config.AZURE_CLIENT_SECRET.startsWith("YOUR_");
    default:
      return false;
  }
}
