import { z } from "zod";

const EnvironmentSchema = z.object({
  NODE_ENV: z
    .enum([
      "development",
      "test",
      "production"
    ])
    .default("development"),

  HOST: z
    .string()
    .trim()
    .min(1)
    .default("0.0.0.0"),

  PORT: z.coerce
    .number()
    .int()
    .min(1)
    .max(65535)
    .default(4000),

  LOG_LEVEL: z
    .enum([
      "fatal",
      "error",
      "warn",
      "info",
      "debug",
      "trace",
      "silent"
    ])
    .default("info"),

  CLIENT_WEB_ORIGIN: z
    .string()
    .url()
    .default("http://localhost:3000"),

  ADMIN_WEB_ORIGIN: z
    .string()
    .url()
    .default("http://localhost:3001"),

  COPYRIGHT_WEB_ORIGIN: z
    .string()
    .url()
    .default("http://localhost:3002"),

  DATABASE_URL: z
    .string()
    .trim()
    .optional(),

  RAZORPAY_KEY_ID: z
    .string()
    .trim()
    .optional(),

  RAZORPAY_KEY_SECRET: z
    .string()
    .trim()
    .optional(),

  RAZORPAY_WEBHOOK_SECRET: z
    .string()
    .trim()
    .optional(),

  SESSION_SECRET: z
    .string()
    .trim()
    .optional()
});

export type AppEnvironment =
  z.infer<typeof EnvironmentSchema>;

let cachedEnvironment:
  AppEnvironment | null = null;

export function getEnvironment():
  AppEnvironment {
  if (cachedEnvironment) {
    return cachedEnvironment;
  }

  const result =
    EnvironmentSchema.safeParse(
      process.env
    );

  if (!result.success) {
    const details =
      result.error.issues
        .map(
          (issue) =>
            `${issue.path.join(".")}: ${issue.message}`
        )
        .join("; ");

    throw new Error(
      `Invalid backend environment configuration: ${details}`
    );
  }

  cachedEnvironment =
    result.data;

  return cachedEnvironment;
}