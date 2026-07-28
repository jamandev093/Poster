import {
  createHash,
  randomBytes,
  randomInt,
  timingSafeEqual,
} from "node:crypto";

import {
  AuthenticationTokenInvalidError,
} from "./authentication.errors.js";

export const TOKEN_SECURITY_POLICY = {
  opaqueTokenBytes:
    32,

  minimumOpaqueTokenBytes:
    32,

  maximumOpaqueTokenBytes:
    128,

  digestAlgorithm:
    "sha256",

  digestHexLength:
    64,

  verificationCodeDigits:
    6,

  minimumVerificationCodeDigits:
    6,

  maximumVerificationCodeDigits:
    10,
} as const;

export interface OpaqueTokenPair {
  /**
   * Return this value to the user or place it in a secure
   * transport channel. Never persist or log it.
   */
  token: string;

  /**
   * Persist only this irreversible digest.
   */
  digest: string;
}

export interface NumericVerificationCodePair {
  /**
   * Send this code to the user. Never persist or log it.
   */
  code: string;

  /**
   * Persist only this irreversible digest.
   */
  digest: string;
}

function assertNonEmptySecret(
  secret: string
): void {
  if (
    secret.length ===
    0
  ) {
    throw new AuthenticationTokenInvalidError();
  }
}

function assertOpaqueTokenByteLength(
  byteLength: number
): void {
  if (
    !Number.isSafeInteger(
      byteLength
    ) ||
    byteLength <
      TOKEN_SECURITY_POLICY.minimumOpaqueTokenBytes ||
    byteLength >
      TOKEN_SECURITY_POLICY.maximumOpaqueTokenBytes
  ) {
    throw new RangeError(
      `Opaque-token byte length must be between ${
        TOKEN_SECURITY_POLICY.minimumOpaqueTokenBytes
      } and ${
        TOKEN_SECURITY_POLICY.maximumOpaqueTokenBytes
      }.`
    );
  }
}

function assertVerificationCodeDigits(
  digits: number
): void {
  if (
    !Number.isSafeInteger(
      digits
    ) ||
    digits <
      TOKEN_SECURITY_POLICY.minimumVerificationCodeDigits ||
    digits >
      TOKEN_SECURITY_POLICY.maximumVerificationCodeDigits
  ) {
    throw new RangeError(
      `Verification-code digits must be between ${
        TOKEN_SECURITY_POLICY.minimumVerificationCodeDigits
      } and ${
        TOKEN_SECURITY_POLICY.maximumVerificationCodeDigits
      }.`
    );
  }
}

/**
 * Generates a cryptographically random URL-safe opaque token.
 */
export function generateOpaqueToken(
  byteLength:
    number =
      TOKEN_SECURITY_POLICY.opaqueTokenBytes
): string {
  assertOpaqueTokenByteLength(
    byteLength
  );

  return randomBytes(
    byteLength
  ).toString(
    "base64url"
  );
}

/**
 * Creates the irreversible SHA-256 digest persisted by Poster.
 */
export function digestAuthenticationSecret(
  secret: string
): string {
  assertNonEmptySecret(
    secret
  );

  return createHash(
    TOKEN_SECURITY_POLICY.digestAlgorithm
  )
    .update(
      secret,
      "utf8"
    )
    .digest(
      "hex"
    );
}

/**
 * Generates one raw token and its database-safe digest.
 */
export function createOpaqueTokenPair(
  byteLength:
    number =
      TOKEN_SECURITY_POLICY.opaqueTokenBytes
): OpaqueTokenPair {
  const token =
    generateOpaqueToken(
      byteLength
    );

  return {
    token,

    digest:
      digestAuthenticationSecret(
        token
      ),
  };
}

/**
 * Generates a fixed-width numeric verification code.
 *
 * Rate limits, expiry, and maximum attempts are enforced by
 * the later authentication service and database repository.
 */
export function generateNumericVerificationCode(
  digits:
    number =
      TOKEN_SECURITY_POLICY.verificationCodeDigits
): string {
  assertVerificationCodeDigits(
    digits
  );

  const maximumExclusive =
    10 ** digits;

  return randomInt(
    0,
    maximumExclusive
  )
    .toString()
    .padStart(
      digits,
      "0"
    );
}

export function createNumericVerificationCodePair(
  digits:
    number =
      TOKEN_SECURITY_POLICY.verificationCodeDigits
): NumericVerificationCodePair {
  const code =
    generateNumericVerificationCode(
      digits
    );

  return {
    code,

    digest:
      digestAuthenticationSecret(
        code
      ),
  };
}

function decodeDigest(
  digest: string
): Buffer | null {
  const normalizedDigest =
    digest.toLowerCase();

  if (
    !/^[a-f0-9]{64}$/.test(
      normalizedDigest
    )
  ) {
    return null;
  }

  return Buffer.from(
    normalizedDigest,
    "hex"
  );
}

/**
 * Compares two SHA-256 hexadecimal digests without ordinary
 * string equality.
 */
export function timingSafeDigestEqual(
  leftDigest: string,
  rightDigest: string
): boolean {
  const leftBuffer =
    decodeDigest(
      leftDigest
    );

  const rightBuffer =
    decodeDigest(
      rightDigest
    );

  if (
    !leftBuffer ||
    !rightBuffer ||
    leftBuffer.length !==
      rightBuffer.length
  ) {
    return false;
  }

  return timingSafeEqual(
    leftBuffer,
    rightBuffer
  );
}

/**
 * Hashes a supplied raw token and compares it with the
 * persisted digest.
 */
export function verifyAuthenticationSecretDigest(
  secret: string,
  expectedDigest: string
): boolean {
  if (
    secret.length ===
    0
  ) {
    return false;
  }

  const suppliedDigest =
    digestAuthenticationSecret(
      secret
    );

  return timingSafeDigestEqual(
    suppliedDigest,
    expectedDigest
  );
}