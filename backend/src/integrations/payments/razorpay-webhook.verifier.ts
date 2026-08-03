import {
  createHmac,
  timingSafeEqual,
} from "node:crypto";

import {
  Buffer,
} from "node:buffer";

export interface RazorpayWebhookVerifierConfig {
  webhookSecret: string;
}

export interface VerifyRazorpayWebhookSignatureInput {
  rawBody: string | Buffer;
  providerSignature: string;
}

export interface RazorpayWebhookSignatureVerificationResult {
  isValid: boolean;
  expectedSignatureDigest: string;
}

export interface RazorpayWebhookVerifier {
  verifyWebhookSignature: (
    input: VerifyRazorpayWebhookSignatureInput
  ) => RazorpayWebhookSignatureVerificationResult;

  assertWebhookSignature: (
    input: VerifyRazorpayWebhookSignatureInput
  ) => string;
}

export interface RazorpayWebhookHeaders {
  [headerName: string]: string | string[] | undefined;
}

export class RazorpayWebhookConfigurationError extends Error {
  readonly code =
    "razorpay_webhook_configuration_error";

  constructor(
    message: string
  ) {
    super(message);
    this.name = "RazorpayWebhookConfigurationError";
  }
}

export class RazorpayWebhookValidationError extends Error {
  readonly code =
    "razorpay_webhook_validation_error";

  constructor(
    message: string
  ) {
    super(message);
    this.name = "RazorpayWebhookValidationError";
  }
}

export class RazorpayWebhookVerificationError extends Error {
  readonly code =
    "razorpay_webhook_verification_failed";

  constructor() {
    super("Razorpay webhook signature verification failed.");
    this.name = "RazorpayWebhookVerificationError";
  }
}

function requireConfigText(
  value: string,
  field: string
): string {
  const trimmed =
    value.trim();

  if (trimmed.length === 0) {
    throw new RazorpayWebhookConfigurationError(
      `${field} is required.`
    );
  }

  return trimmed;
}

function requireInputText(
  value: string,
  field: string
): string {
  const trimmed =
    value.trim();

  if (trimmed.length === 0) {
    throw new RazorpayWebhookValidationError(
      `${field} is required.`
    );
  }

  return trimmed;
}

function requireRawBody(
  value: string | Buffer
): string | Buffer {
  if (
    typeof value === "string" &&
    value.length === 0
  ) {
    throw new RazorpayWebhookValidationError(
      "Raw Razorpay webhook body is required."
    );
  }

  if (
    Buffer.isBuffer(value) &&
    value.length === 0
  ) {
    throw new RazorpayWebhookValidationError(
      "Raw Razorpay webhook body is required."
    );
  }

  return value;
}

function isHexSha256Digest(
  value: string
): boolean {
  return /^[a-f0-9]{64}$/i.test(
    value
  );
}

function createExpectedDigest(
  input: {
    rawBody: string | Buffer;
    webhookSecret: string;
  }
): string {
  return createHmac(
    "sha256",
    input.webhookSecret
  )
    .update(
      input.rawBody
    )
    .digest("hex");
}

function timingSafeDigestEquals(
  expectedDigest: string,
  receivedDigest: string
): boolean {
  if (!isHexSha256Digest(receivedDigest)) {
    return false;
  }

  const expectedBuffer =
    Buffer.from(
      expectedDigest,
      "hex"
    );

  const receivedBuffer =
    Buffer.from(
      receivedDigest,
      "hex"
    );

  if (
    expectedBuffer.length !==
    receivedBuffer.length
  ) {
    return false;
  }

  return timingSafeEqual(
    expectedBuffer,
    receivedBuffer
  );
}

function readHeader(
  headers: RazorpayWebhookHeaders,
  headerName: string
): string | null {
  const target =
    headerName.toLowerCase();

  for (const [key, value] of Object.entries(headers)) {
    if (key.toLowerCase() !== target) {
      continue;
    }

    if (typeof value === "string") {
      return value;
    }

    if (
      Array.isArray(value) &&
      typeof value[0] === "string"
    ) {
      return value[0];
    }
  }

  return null;
}

export function readRazorpayWebhookSignatureHeader(
  headers: RazorpayWebhookHeaders
): string {
  const signature =
    readHeader(
      headers,
      "x-razorpay-signature"
    );

  if (!signature) {
    throw new RazorpayWebhookValidationError(
      "X-Razorpay-Signature header is required."
    );
  }

  return requireInputText(
    signature,
    "X-Razorpay-Signature"
  );
}

export function readRazorpayWebhookEventIdHeader(
  headers: RazorpayWebhookHeaders
): string | null {
  const eventId =
    readHeader(
      headers,
      "x-razorpay-event-id"
    );

  if (!eventId) {
    return null;
  }

  return requireInputText(
    eventId,
    "x-razorpay-event-id"
  );
}

export function createRazorpayWebhookVerifier(
  config: RazorpayWebhookVerifierConfig
): RazorpayWebhookVerifier {
  const webhookSecret =
    requireConfigText(
      config.webhookSecret,
      "Razorpay webhook secret"
    );

  return {
    verifyWebhookSignature(
      input
    ) {
      const rawBody =
        requireRawBody(
          input.rawBody
        );

      const providerSignature =
        requireInputText(
          input.providerSignature,
          "Razorpay webhook signature"
        );

      const expectedSignatureDigest =
        createExpectedDigest({
          rawBody,
          webhookSecret,
        });

      return {
        isValid:
          timingSafeDigestEquals(
            expectedSignatureDigest,
            providerSignature
          ),

        expectedSignatureDigest,
      };
    },

    assertWebhookSignature(
      input
    ) {
      const result =
        this.verifyWebhookSignature(
          input
        );

      if (!result.isValid) {
        throw new RazorpayWebhookVerificationError();
      }

      return result.expectedSignatureDigest;
    },
  };
}