export const EMAIL_VERIFICATION_PURPOSES = [
  "signup",
  "email_change",
] as const;

export type EmailVerificationPurpose =
  (typeof EMAIL_VERIFICATION_PURPOSES)[number];

export interface EmailVerificationTokenRecord {
  id: string;

  userId: string;

  tokenDigest: string;

  purpose: EmailVerificationPurpose;

  attemptCount: number;

  createdAt: Date;

  expiresAt: Date;

  consumedAt:
    | Date
    | null;

  invalidatedAt:
    | Date
    | null;
}

export interface PasswordResetTokenRecord {
  id: string;

  userId: string;

  tokenDigest: string;

  requestedIpAddress:
    | string
    | null;

  requestedUserAgent:
    | string
    | null;

  createdAt: Date;

  expiresAt: Date;

  consumedAt:
    | Date
    | null;

  invalidatedAt:
    | Date
    | null;
}

export interface CreateEmailVerificationTokenInput {
  userId: string;

  tokenDigest: string;

  purpose: EmailVerificationPurpose;

  createdAt: Date;

  expiresAt: Date;
}

export interface RecordEmailVerificationAttemptInput {
  tokenDigest: string;

  attemptedAt: Date;

  maximumAttempts: number;
}

export interface ConsumeEmailVerificationTokenInput {
  tokenDigest: string;

  consumedAt: Date;

  maximumAttempts: number;
}

export interface InvalidateEmailVerificationTokensInput {
  userId: string;

  purpose?:
    | EmailVerificationPurpose
    | null;

  invalidatedAt: Date;
}

export interface CreatePasswordResetTokenInput {
  userId: string;

  tokenDigest: string;

  requestedIpAddress?:
    | string
    | null;

  requestedUserAgent?:
    | string
    | null;

  createdAt: Date;

  expiresAt: Date;
}

export interface ConsumePasswordResetTokenInput {
  tokenDigest: string;

  consumedAt: Date;
}

export interface InvalidatePasswordResetTokensInput {
  userId: string;

  invalidatedAt: Date;
}