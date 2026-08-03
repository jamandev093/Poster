import {
  describe,
  expect,
  it,
  vi,
} from "vitest";

import {
  buildApp,
} from "../src/app.js";

import type {
  WalletCreditingService,
} from "../src/application/payments/index.js";

import type {
  RazorpayWebhookVerifier,
} from "../src/integrations/payments/index.js";

const ORGANIZATION_ID =
  "00000000-0000-4000-8000-000000001101";

const SYSTEM_USER_ID =
  "00000000-0000-4000-8000-000000009999";

const FUNDING_ORDER_ID =
  "00000000-0000-4000-8000-000000001501";

function createPaymentCapturedRawBody() {
  return JSON.stringify({
    event:
      "payment.captured",

    payload: {
      payment: {
        entity: {
          id:
            "pay_razorpay_0001",

          order_id:
            "order_razorpay_0001",

          amount:
            500000,

          currency:
            "INR",

          status:
            "captured",

          method:
            "upi",

          created_at:
            1785750000,

          notes: {
            organizationId:
              ORGANIZATION_ID,

            fundingOrderId:
              FUNDING_ORDER_ID,
          },
        },
      },
    },
  });
}

describe("Razorpay webhook app wiring", () => {
  it("registers Razorpay webhook route with raw-body capture and Wallet crediting", async () => {
    const assertWebhookSignature =
      vi.fn<
        RazorpayWebhookVerifier[
          "assertWebhookSignature"
        ]
      >()
        .mockReturnValue(
          "digest-0001"
        );

    const creditVerifiedPayment =
      vi.fn<
        WalletCreditingService[
          "creditVerifiedPayment"
        ]
      >()
        .mockResolvedValue(
          {} as Awaited<
            ReturnType<
              WalletCreditingService[
                "creditVerifiedPayment"
              ]
            >
          >
        );

    const app =
      await buildApp({
        razorpayWebhookVerifier: {
          assertWebhookSignature,

          verifyWebhookSignature:
            vi.fn()
              .mockReturnValue({
                isValid:
                  true,

                expectedSignatureDigest:
                  "digest-0001",
              }),
        },

        walletCreditingService: {
          creditVerifiedPayment,
        },

        paymentWebhookSystemActorUserId:
          SYSTEM_USER_ID,
      });

    const rawBody =
      createPaymentCapturedRawBody();

    const response =
      await app.inject({
        method:
          "POST",

        url:
          "/api/v1/webhooks/razorpay",

        headers: {
          "content-type":
            "application/json",

          "x-razorpay-signature":
            "signature-0001",

          "x-razorpay-event-id":
            "evt_razorpay_0001",
        },

        payload:
          rawBody,
      });

    await app.close();

    expect(
      response.statusCode
    ).toBe(
      200
    );

    expect(
      response.json()
    ).toEqual({
      webhook: {
        provider:
          "razorpay",

        event:
          "payment.captured",

        eventId:
          "evt_razorpay_0001",

        processed:
          true,
      },
    });

    expect(
      assertWebhookSignature
    ).toHaveBeenCalledTimes(
      2
    );

    const firstSignatureInput =
      assertWebhookSignature.mock.calls[0]?.[0];

    if (firstSignatureInput === undefined) {
      throw new Error("Missing webhook signature input.");
    }

    expect(
      firstSignatureInput.providerSignature
    ).toBe(
      "signature-0001"
    );

    expect(
      Buffer.isBuffer(
        firstSignatureInput.rawBody
      )
    ).toBe(
      true
    );

    expect(
      firstSignatureInput.rawBody.toString()
    ).toBe(
      rawBody
    );

    const creditInput =
      creditVerifiedPayment.mock.calls[0]?.[0];

    if (creditInput === undefined) {
      throw new Error("Missing webhook credit input.");
    }

    expect(
      creditInput
    ).toMatchObject({
      organizationId:
        ORGANIZATION_ID,

      actorUserId:
        SYSTEM_USER_ID,

      fundingOrderId:
        FUNDING_ORDER_ID,

      provider:
        "razorpay",

      providerOrderId:
        "order_razorpay_0001",

      providerPaymentId:
        "pay_razorpay_0001",

      providerSignatureDigest:
        "digest-0001",

      amountMinorUnits:
        500000n,

      currency:
        "INR",

      methodDetails: {
        method:
          "upi",
      },
    });
  });
});