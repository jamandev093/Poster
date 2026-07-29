import type {
  EmailDeliveryMessage,
} from "./email-delivery.types.js";

const EMAIL_ADDRESS_PATTERN =
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const SIGNUP_VERIFICATION_CODE_PATTERN =
  /^\d{6}$/;

export interface CreateSignupVerificationEmailInput {
  recipientEmail:
    string;

  recipientName?:
    | string
    | null;

  verificationCode:
    string;

  expiresAt:
    Date;

  /**
   * Use the email-verification token record UUID.
   *
   * The raw verification code must never be used as an
   * idempotency key.
   */
  idempotencyKey:
    string;
}

function normalizeRecipientEmail(
  value: string
): string {
  const normalizedValue =
    value
      .trim()
      .toLowerCase();

  if (
    !EMAIL_ADDRESS_PATTERN.test(
      normalizedValue
    )
  ) {
    throw new TypeError(
      "A valid email recipient is required."
    );
  }

  return normalizedValue;
}

function normalizeRecipientName(
  value:
    | string
    | null
    | undefined
): string | null {
  if (
    value === undefined ||
    value === null
  ) {
    return null;
  }

  const normalizedValue =
    value.trim();

  return normalizedValue.length > 0
    ? normalizedValue
    : null;
}

function normalizeVerificationCode(
  value: string
): string {
  const normalizedValue =
    value.trim();

  if (
    !SIGNUP_VERIFICATION_CODE_PATTERN.test(
      normalizedValue
    )
  ) {
    throw new TypeError(
      "Signup verification code must contain exactly six digits."
    );
  }

  return normalizedValue;
}

function normalizeIdempotencyKey(
  value: string
): string {
  const normalizedValue =
    value.trim();

  if (
    normalizedValue.length ===
      0 ||
    normalizedValue.length >
      200
  ) {
    throw new TypeError(
      "Email idempotency key must contain between 1 and 200 characters."
    );
  }

  return normalizedValue;
}

function assertValidExpiryDate(
  value: Date
): void {
  if (
    !Number.isFinite(
      value.getTime()
    )
  ) {
    throw new RangeError(
      "Email verification expiry must be a valid date."
    );
  }
}

function escapeHtml(
  value: string
): string {
  return value
    .replaceAll(
      "&",
      "&amp;"
    )
    .replaceAll(
      "<",
      "&lt;"
    )
    .replaceAll(
      ">",
      "&gt;"
    )
    .replaceAll(
      '"',
      "&quot;"
    )
    .replaceAll(
      "'",
      "&#039;"
    );
}

/**
 * Creates the provider-neutral Poster signup-verification
 * message.
 *
 * This function does not send, persist, or log the raw code.
 */
export function createSignupVerificationEmailMessage(
  input:
    CreateSignupVerificationEmailInput
): EmailDeliveryMessage {
  const recipientEmail =
    normalizeRecipientEmail(
      input.recipientEmail
    );

  const recipientName =
    normalizeRecipientName(
      input.recipientName
    );

  const verificationCode =
    normalizeVerificationCode(
      input.verificationCode
    );

  const idempotencyKey =
    normalizeIdempotencyKey(
      input.idempotencyKey
    );

  assertValidExpiryDate(
    input.expiresAt
  );

  const expiryText =
    input.expiresAt.toISOString();

  const greeting =
    recipientName
      ? `Hi ${recipientName},`
      : "Hello,";

  const safeGreeting =
    escapeHtml(
      greeting
    );

  const safeVerificationCode =
    escapeHtml(
      verificationCode
    );

  const safeExpiryText =
    escapeHtml(
      expiryText
    );

  return {
    category:
      "signup_verification",

    to:
      recipientEmail,

    subject:
      "Verify your Poster account",

    text: [
      greeting,
      "",
      "Use this verification code to complete your Poster signup:",
      "",
      verificationCode,
      "",
      `This code expires at ${expiryText}.`,
      "",
      "Do not share this code with anyone.",
      "Poster will never ask you to send this code by email or message.",
      "",
      "If you did not create a Poster account, you can ignore this email.",
    ].join(
      "\n"
    ),

    html: [
      "<!doctype html>",
      '<html lang="en">',
      "<body>",
      `<p>${safeGreeting}</p>`,
      "<p>Use this verification code to complete your Poster signup:</p>",
      `<p><strong>${safeVerificationCode}</strong></p>`,
      `<p>This code expires at ${safeExpiryText}.</p>`,
      "<p>Do not share this code with anyone.</p>",
      "<p>Poster will never ask you to send this code by email or message.</p>",
      "<p>If you did not create a Poster account, you can ignore this email.</p>",
      "</body>",
      "</html>",
    ].join(
      ""
    ),

    idempotencyKey,
  };
}

export interface CreatePasswordResetEmailInput {
  recipientEmail:
    string;

  recipientName?:
    | string
    | null;

  resetCode:
    string;

  expiresAt:
    Date;

  /**
   * Use the password-reset token record UUID.
   *
   * The raw reset code must never be used as an idempotency
   * key.
   */
  idempotencyKey:
    string;
}

function normalizePasswordResetCode(
  value: string
): string {
  const normalizedValue =
    value.trim();

  if (
    !/^\d{6}$/.test(
      normalizedValue
    )
  ) {
    throw new TypeError(
      "Password-reset code must contain exactly six digits."
    );
  }

  return normalizedValue;
}

/**
 * Creates the provider-neutral Poster password-reset message.
 *
 * This function does not persist or log the raw reset code.
 */
export function createPasswordResetEmailMessage(
  input:
    CreatePasswordResetEmailInput
): EmailDeliveryMessage {
  const recipientEmail =
    normalizeRecipientEmail(
      input.recipientEmail
    );

  const recipientName =
    normalizeRecipientName(
      input.recipientName
    );

  const resetCode =
    normalizePasswordResetCode(
      input.resetCode
    );

  const idempotencyKey =
    normalizeIdempotencyKey(
      input.idempotencyKey
    );

  assertValidExpiryDate(
    input.expiresAt
  );

  const expiryText =
    input.expiresAt.toISOString();

  const greeting =
    recipientName
      ? `Hi ${recipientName},`
      : "Hello,";

  const safeGreeting =
    escapeHtml(
      greeting
    );

  const safeResetCode =
    escapeHtml(
      resetCode
    );

  const safeExpiryText =
    escapeHtml(
      expiryText
    );

  return {
    category:
      "password_reset",

    to:
      recipientEmail,

    subject:
      "Reset your Poster password",

    text: [
      greeting,
      "",
      "Use this code to reset your Poster password:",
      "",
      resetCode,
      "",
      `This code expires at ${expiryText}.`,
      "",
      "Do not share this code with anyone.",
      "Poster will never ask you to send this code by email or message.",
      "",
      "If you did not request a password reset, you can ignore this email.",
    ].join(
      "\n"
    ),

    html: [
      "<!doctype html>",
      '<html lang="en">',
      "<body>",
      `<p>${safeGreeting}</p>`,
      "<p>Use this code to reset your Poster password:</p>",
      `<p><strong>${safeResetCode}</strong></p>`,
      `<p>This code expires at ${safeExpiryText}.</p>`,
      "<p>Do not share this code with anyone.</p>",
      "<p>Poster will never ask you to send this code by email or message.</p>",
      "<p>If you did not request a password reset, you can ignore this email.</p>",
      "</body>",
      "</html>",
    ].join(
      ""
    ),

    idempotencyKey,
  };
}