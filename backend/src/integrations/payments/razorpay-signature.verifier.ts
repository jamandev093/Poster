import {
  createHmac,
  timingSafeEqual,
} from "node:crypto";

import {
  Buffer,
} from "node:buffer";

export interface RazorpayPaymentSignatureVerifierConfig {
  keySecret: string;
}

export interface VerifyRazorpayPaymentSignatureInput {
  providerOrderId: string;
  providerPaymentId: string;
  providerSignature: string;
}

export interface RazorpayPaymentSignatureVerificationResult {
  isValid: boolean;
  expectedSignatureDigest: string;
}

export interface RazorpayPaymentSignatureVerifier {
  verifyPaymentSignature: (
    input: VerifyRazorpayPaymentSignatureInput
  ) => RazorpayPaymentSignatureVerificationResult;

  assertPaymentSignature: (
    input: VerifyRazorpayPaymentSignatureInput
  ) => string;
}

export class RazorpaySignatureConfigurationError extends Error {
  readonly code =
    "razorpay_signature_configuration_error";

  constructor(
    message: string
  ) {
    super(message);
    this.name = "RazorpaySignatureConfigurationError";
  }
}

export class RazorpaySignatureValidationError extends Error {
  readonly code =
    "razorpay_signature_validation_error";

  constructor(
    message: string
  ) {
    super(message);
    this.name = "RazorpaySignatureValidationError";
  }
}

export class RazorpaySignatureVerificationError extends Error {
  readonly code =
    "razorpay_signature_verification_failed";

  constructor() {
    super("Razorpay payment signature verification failed.");
    this.name = "RazorpaySignatureVerificationError";
  }
}

function requireConfigText(
  value: string,
  field: string
): string {
  const trimmed =
    value.trim();

  if (trimmed.length === 0) {
    throw new RazorpaySignatureConfigurationError(
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
    throw new RazorpaySignatureValidationError(
      `${field} is required.`
    );
  }

  return trimmed;
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
    providerOrderId: string;
    providerPaymentId: string;
    keySecret: string;
  }
): string {
  return createHmac(
    "sha256",
    input.keySecret
  )
    .update(
      `${input.providerOrderId}|${input.providerPaymentId}`
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

export function createRazorpayPaymentSignatureVerifier(
  config: RazorpayPaymentSignatureVerifierConfig
): RazorpayPaymentSignatureVerifier {
  const keySecret =
    requireConfigText(
      config.keySecret,
      "Razorpay key secret"
    );

  return {
    verifyPaymentSignature(
      input
    ) {
      const providerOrderId =
        requireInputText(
          input.providerOrderId,
          "Razorpay order id"
        );

      const providerPaymentId =
        requireInputText(
          input.providerPaymentId,
          "Razorpay payment id"
        );

      const providerSignature =
        requireInputText(
          input.providerSignature,
          "Razorpay signature"
        );

      const expectedSignatureDigest =
        createExpectedDigest({
          providerOrderId,
          providerPaymentId,
          keySecret,
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

    assertPaymentSignature(
      input
    ) {
      const result =
        this.verifyPaymentSignature(
          input
        );

      if (!result.isValid) {
        throw new RazorpaySignatureVerificationError();
      }

      return result.expectedSignatureDigest;
    },
  };
}