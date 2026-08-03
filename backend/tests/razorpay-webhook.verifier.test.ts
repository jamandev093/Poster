import {
  createHmac,
} from "node:crypto";

import {
  Buffer,
} from "node:buffer";

import {
  describe,
  expect,
  it,
} from "vitest";

import {
  RazorpayWebhookConfigurationError,
  RazorpayWebhookValidationError,
  RazorpayWebhookVerificationError,
  createRazorpayWebhookVerifier,
  readRazorpayWebhookEventIdHeader,
  readRazorpayWebhookSignatureHeader,
} from "../src/integrations/payments/index.js";

const WEBHOOK_SECRET =
  "webhook_secret_0001";

const RAW_BODY =
  '{"event":"payment.captured","payload":{"payment":{"entity":{"id":"pay_razorpay_0001"}}}}';

function createExpectedSignature(
  rawBody: string | Buffer = RAW_BODY
) {
  return createHmac(
    "sha256",
    WEBHOOK_SECRET
  )
    .update(
      rawBody
    )
    .digest("hex");
}

describe("Razorpay webhook verifier", () => {
  it("verifies a valid Razorpay webhook signature against the raw body", () => {
    const verifier =
      createRazorpayWebhookVerifier({
        webhookSecret:
          WEBHOOK_SECRET,
      });

    const signature =
      createExpectedSignature();

    const result =
      verifier.verifyWebhookSignature({
        rawBody:
          RAW_BODY,

        providerSignature:
          signature,
      });

    expect(result).toEqual({
      isValid:
        true,

      expectedSignatureDigest:
        signature,
    });

    expect(
      verifier.assertWebhookSignature({
        rawBody:
          RAW_BODY,

        providerSignature:
          signature,
      })
    ).toBe(
      signature
    );
  });

  it("verifies Buffer raw bodies without parsing or casting", () => {
    const rawBody =
      Buffer.from(
        RAW_BODY,
        "utf8"
      );

    const verifier =
      createRazorpayWebhookVerifier({
        webhookSecret:
          WEBHOOK_SECRET,
      });

    const signature =
      createExpectedSignature(
        rawBody
      );

    const result =
      verifier.verifyWebhookSignature({
        rawBody,

        providerSignature:
          signature,
      });

    expect(result.isValid).toBe(true);
  });

  it("rejects invalid Razorpay webhook signatures", () => {
    const verifier =
      createRazorpayWebhookVerifier({
        webhookSecret:
          WEBHOOK_SECRET,
      });

    const result =
      verifier.verifyWebhookSignature({
        rawBody:
          RAW_BODY,

        providerSignature:
          "0".repeat(64),
      });

    expect(result.isValid).toBe(false);

    expect(() =>
      verifier.assertWebhookSignature({
        rawBody:
          RAW_BODY,

        providerSignature:
          "0".repeat(64),
      })
    ).toThrow(
      RazorpayWebhookVerificationError
    );
  });

  it("treats malformed webhook signatures as invalid without throwing", () => {
    const verifier =
      createRazorpayWebhookVerifier({
        webhookSecret:
          WEBHOOK_SECRET,
      });

    const result =
      verifier.verifyWebhookSignature({
        rawBody:
          RAW_BODY,

        providerSignature:
          "not-a-hex-digest",
      });

    expect(result.isValid).toBe(false);
    expect(result.expectedSignatureDigest).toBe(createExpectedSignature());
  });

  it("reads Razorpay webhook signature and event id headers case-insensitively", () => {
    const headers = {
      "X-Razorpay-Signature":
        createExpectedSignature(),

      "x-razorpay-event-id":
        "evt_razorpay_0001",
    };

    expect(
      readRazorpayWebhookSignatureHeader(
        headers
      )
    ).toBe(
      createExpectedSignature()
    );

    expect(
      readRazorpayWebhookEventIdHeader(
        headers
      )
    ).toBe(
      "evt_razorpay_0001"
    );
  });

  it("requires webhook secret, raw body, and signature", () => {
    expect(() =>
      createRazorpayWebhookVerifier({
        webhookSecret:
          "   ",
      })
    ).toThrow(
      RazorpayWebhookConfigurationError
    );

    const verifier =
      createRazorpayWebhookVerifier({
        webhookSecret:
          WEBHOOK_SECRET,
      });

    expect(() =>
      verifier.verifyWebhookSignature({
        rawBody:
          "",

        providerSignature:
          createExpectedSignature(),
      })
    ).toThrow(
      RazorpayWebhookValidationError
    );

    expect(() =>
      verifier.verifyWebhookSignature({
        rawBody:
          RAW_BODY,

        providerSignature:
          "",
      })
    ).toThrow(
      RazorpayWebhookValidationError
    );

    expect(() =>
      readRazorpayWebhookSignatureHeader({})
    ).toThrow(
      RazorpayWebhookValidationError
    );
  });
});