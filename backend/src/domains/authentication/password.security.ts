import {
  Buffer,
} from "node:buffer";

import * as argon2 from "argon2";

import {
  PasswordPolicyError,
} from "./authentication.errors.js";

export const PASSWORD_SECURITY_POLICY = {
  algorithm:
    "argon2id",

  minimumUtf8Bytes:
    12,

  maximumUtf8Bytes:
    1024,

  memoryCostKiB:
    19_456,

  timeCost:
    2,

  parallelism:
    1,

  hashLengthBytes:
    32,
} as const;

function getPasswordUtf8Length(
  password: string
): number {
  return Buffer.byteLength(
    password,
    "utf8"
  );
}

/**
 * Passwords are intentionally not trimmed or normalized.
 *
 * Changing a password's Unicode or whitespace representation
 * would change the user's actual secret.
 */
export function assertPasswordMeetsPolicy(
  password: string
): void {
  const passwordLength =
    getPasswordUtf8Length(
      password
    );

  if (
    passwordLength <
    PASSWORD_SECURITY_POLICY.minimumUtf8Bytes
  ) {
    throw new PasswordPolicyError(
      `Password must contain at least ${
        PASSWORD_SECURITY_POLICY.minimumUtf8Bytes
      } UTF-8 bytes.`
    );
  }

  if (
    passwordLength >
    PASSWORD_SECURITY_POLICY.maximumUtf8Bytes
  ) {
    throw new PasswordPolicyError(
      `Password must not exceed ${
        PASSWORD_SECURITY_POLICY.maximumUtf8Bytes
      } UTF-8 bytes.`
    );
  }
}

/**
 * Produces a self-contained PHC-formatted Argon2id password
 * hash containing its random salt and cost parameters.
 *
 * Only the returned hash may be persisted.
 */
export async function hashPassword(
  password: string
): Promise<string> {
  assertPasswordMeetsPolicy(
    password
  );

  return argon2.hash(
    password,
    {
      type:
        argon2.argon2id,

      memoryCost:
        PASSWORD_SECURITY_POLICY.memoryCostKiB,

      timeCost:
        PASSWORD_SECURITY_POLICY.timeCost,

      parallelism:
        PASSWORD_SECURITY_POLICY.parallelism,

      hashLength:
        PASSWORD_SECURITY_POLICY.hashLengthBytes,
    }
  );
}

export function isSupportedPasswordHash(
  passwordHash: string
): boolean {
  return passwordHash.startsWith(
    "$argon2id$"
  );
}

/**
 * Verifies a candidate password against a persisted Argon2id
 * PHC hash.
 *
 * Malformed or unsupported hashes return false rather than
 * leaking parser details through authentication responses.
 */
export async function verifyPassword(
  password: string,
  passwordHash: string
): Promise<boolean> {
  if (
    !isSupportedPasswordHash(
      passwordHash
    )
  ) {
    return false;
  }

  if (
    getPasswordUtf8Length(
      password
    ) >
    PASSWORD_SECURITY_POLICY.maximumUtf8Bytes
  ) {
    return false;
  }

  try {
    return await argon2.verify(
      passwordHash,
      password
    );
  }
  catch {
    return false;
  }
}

/**
 * Determines whether an existing Argon2id hash should be
 * replaced after a successful login because its cost
 * parameters differ from the current Poster policy.
 */
export function passwordHashNeedsUpgrade(
  passwordHash: string
): boolean {
  if (
    !isSupportedPasswordHash(
      passwordHash
    )
  ) {
    return true;
  }

  try {
    return argon2.needsRehash(
      passwordHash,
      {
        memoryCost:
          PASSWORD_SECURITY_POLICY.memoryCostKiB,

        timeCost:
          PASSWORD_SECURITY_POLICY.timeCost,

        parallelism:
          PASSWORD_SECURITY_POLICY.parallelism,

        version:
          0x13,
      }
    );
  }
  catch {
    return true;
  }
}