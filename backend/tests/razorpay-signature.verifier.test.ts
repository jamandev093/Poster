import {
  createHmac,
} from "node:crypto";

import {
  describe,
  expect,
  it,
} from "vitest";

import {
  RazorpaySignatureConfigurationError,
  RazorpaySignatureValidationError,
  RazorpaySignatureVerificationError,
  createRazorpayPaymentSignatureVerifier,
} from "../src/integrations/payments/index.js";

const KEY_SECRET =
  "rzp_test_secret";

const ORDER_ID =
  "order_razorpay_0001";

const PAYMENT_ID =
  "pay_razorpay_0001";

function createExpectedSignature() {
  return createHmac(
    "sha256",
    KEY_SECRET
  )
    .update(
      `${ORDER_ID}|${PAYMENT_ID}`
    )
    .digest("hex");
}

describe("Razorpay payment signature verifier", () => {
  it("verifies a valid Razorpay payment signature", () => {
    const verifier =
      createRazorpayPaymentSignatureVerifier({
        keySecret:
          KEY_SECRET,
      });

    const signature =
      createExpectedSignature();

    const result =
      verifier.verifyPaymentSignature({
        providerOrderId:
          ORDER_ID,

        providerPaymentId:
          PAYMENT_ID,

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
      verifier.assertPaymentSignature({
        providerOrderId:
          ORDER_ID,

        providerPaymentId:
          PAYMENT_ID,

        providerSignature:
          signature,
      })
    ).toBe(
      signature
    );
  });

  it("rejects an invalid Razorpay payment signature", () => {
    const verifier =
      createRazorpayPaymentSignatureVerifier({
        keySecret:
          KEY_SECRET,
      });

    const result =
      verifier.verifyPaymentSignature({
        providerOrderId:
          ORDER_ID,

        providerPaymentId:
          PAYMENT_ID,

        providerSignature:
          "0".repeat(64),
      });

    expect(result.isValid).toBe(false);

    expect(() =>
      verifier.assertPaymentSignature({
        providerOrderId:
          ORDER_ID,

        providerPaymentId:
          PAYMENT_ID,

        providerSignature:
          "0".repeat(64),
      })
    ).toThrow(
      RazorpaySignatureVerificationError
    );
  });

  it("treats malformed signatures as invalid without throwing", () => {
    const verifier =
      createRazorpayPaymentSignatureVerifier({
        keySecret:
          KEY_SECRET,
      });

    const result =
      verifier.verifyPaymentSignature({
        providerOrderId:
          ORDER_ID,

        providerPaymentId:
          PAYMENT_ID,

        providerSignature:
          "not-a-hex-digest",
      });

    expect(result.isValid).toBe(false);
    expect(result.expectedSignatureDigest).toBe(createExpectedSignature());
  });

  it("requires a configured key secret", () => {
    expect(() =>
      createRazorpayPaymentSignatureVerifier({
        keySecret:
          "   ",
      })
    ).toThrow(
      RazorpaySignatureConfigurationError
    );
  });

  it("requires order id, payment id, and signature", () => {
    const verifier =
      createRazorpayPaymentSignatureVerifier({
        keySecret:
          KEY_SECRET,
      });

    expect(() =>
      verifier.verifyPaymentSignature({
        providerOrderId:
          "",

        providerPaymentId:
          PAYMENT_ID,

        providerSignature:
          createExpectedSignature(),
      })
    ).toThrow(
      RazorpaySignatureValidationError
    );

    expect(() =>
      verifier.verifyPaymentSignature({
        providerOrderId:
          ORDER_ID,

        providerPaymentId:
          "",

        providerSignature:
          createExpectedSignature(),
      })
    ).toThrow(
      RazorpaySignatureValidationError
    );

    expect(() =>
      verifier.verifyPaymentSignature({
        providerOrderId:
          ORDER_ID,

        providerPaymentId:
          PAYMENT_ID,

        providerSignature:
          "",
      })
    ).toThrow(
      RazorpaySignatureValidationError
    );
  });
});