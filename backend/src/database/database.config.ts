import {
  config as loadEnvironmentFile,
} from "dotenv";

/*
 * Load local development variables without replacing
 * variables already supplied by the operating environment.
 *
 * Production environments should inject variables through
 * Google Cloud configuration rather than local files.
 */
loadEnvironmentFile({
  path: ".env.local",
  override: false,
  quiet: true,
});

loadEnvironmentFile({
  path: ".env",
  override: false,
  quiet: true,
});

export interface DatabaseConfiguration {
  connectionString: string;

  ssl:
    | false
    | {
        rejectUnauthorized: boolean;
      };

  maximumConnections: number;

  idleTimeoutMilliseconds: number;

  connectionTimeoutMilliseconds: number;

  statementTimeoutMilliseconds: number;
}

function requireEnvironmentVariable(
  name: string
): string {
  const value =
    process.env[name]?.trim();

  if (!value) {
    throw new Error(
      `Required environment variable ${name} is not configured.`
    );
  }

  return value;
}

function parseBooleanEnvironmentVariable(
  value: string | undefined,
  fallback: boolean
): boolean {
  if (!value) {
    return fallback;
  }

  switch (
    value.trim().toLowerCase()
  ) {
    case "true":
    case "1":
    case "yes":
    case "on":
    case "require":
      return true;

    case "false":
    case "0":
    case "no":
    case "off":
    case "disable":
      return false;

    default:
      throw new Error(
        `Invalid boolean environment value: ${value}.`
      );
  }
}

function parseIntegerEnvironmentVariable(
  name: string,
  fallback: number,
  minimum: number,
  maximum: number
): number {
  const rawValue =
    process.env[name]?.trim();

  if (!rawValue) {
    return fallback;
  }

  const parsedValue =
    Number.parseInt(
      rawValue,
      10
    );

  if (
    !Number.isInteger(
      parsedValue
    ) ||
    parsedValue < minimum ||
    parsedValue > maximum
  ) {
    throw new Error(
      `${name} must be an integer between ${minimum} and ${maximum}.`
    );
  }

  return parsedValue;
}

export function getDatabaseConfiguration():
  DatabaseConfiguration {
  const sslEnabled =
    parseBooleanEnvironmentVariable(
      process.env.DATABASE_SSL,
      false
    );

  const rejectUnauthorized =
    parseBooleanEnvironmentVariable(
      process.env
        .DATABASE_SSL_REJECT_UNAUTHORIZED,
      true
    );

  return {
    connectionString:
      requireEnvironmentVariable(
        "DATABASE_URL"
      ),

    ssl:
      sslEnabled
        ? {
            rejectUnauthorized,
          }
        : false,

    maximumConnections:
      parseIntegerEnvironmentVariable(
        "DATABASE_POOL_MAX",
        20,
        1,
        100
      ),

    idleTimeoutMilliseconds:
      parseIntegerEnvironmentVariable(
        "DATABASE_IDLE_TIMEOUT_MS",
        30_000,
        1_000,
        300_000
      ),

    connectionTimeoutMilliseconds:
      parseIntegerEnvironmentVariable(
        "DATABASE_CONNECTION_TIMEOUT_MS",
        5_000,
        1_000,
        60_000
      ),

    statementTimeoutMilliseconds:
      parseIntegerEnvironmentVariable(
        "DATABASE_STATEMENT_TIMEOUT_MS",
        15_000,
        1_000,
        300_000
      ),
  };
}