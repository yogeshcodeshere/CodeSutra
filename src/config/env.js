require("dotenv").config();

const { z } = require("zod");

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  WHO_ICD_CLIENT_ID: z.string().min(1),
  WHO_ICD_CLIENT_SECRET: z.string().min(1),
  WHO_ICD_API_BASE: z.string().url(),
  WHO_ICD_RELEASE_ID: z.string().regex(/^\d{4}(-\d{2})?$/).default("2026-01"),
  JWT_SECRET: z.string().min(16),
  JWT_EXPIRY: z.string().min(1),
  PORT: z.coerce.number().int().positive().default(3000)
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const details = parsed.error.issues
    .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
    .join("; ");

  throw new Error(`Invalid environment configuration: ${details}`);
}

module.exports = { env: parsed.data };
