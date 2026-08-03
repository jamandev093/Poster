import {
  createHmac,
} from "node:crypto";

import Fastify from "fastify";

import {
  describe,
  expect,
  it,
  vi,
} from "vitest";

import type {
  WalletCreditingService,
} from "../src/application/payments/index.js";

import {
  createRazorpayWebhookVerifier,
} from "../src/integrations/payments/index.js";

import {
  createRazorpayWebhookRoutes,
  type RazorpayWebhookRoutesDependencies,
} from "../src/routes/razorpay-webhook.routes.js";

const WEBHOOK_SECRET =
  "webhook_secret_0001";

const ORGANIZATION_ID =
  "00000000-0000-4000-8000-000000001101";

const USER_ID =
  "00000000-0000-4000-8000-000000009999";

const FUNDING_ORDER_ID =
  "00000000-0000-4000-8000-000000001501";

function createSignature(
  rawBody: string
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

function createApp(
  options: {
    rawBody:
      string;

    creditVerifiedPayment?: WalletCreditingService[
      "creditVerifiedPayment"
    ];
  }
) {
  const app =
    Fastify();

  const creditVerifiedPayment =
    options.creditVerifiedPayment ??
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

  const readRawBody =
    vi.fn<
      RazorpayWebhookRoutesDependencies[
        "readRawBody"
      ]
    >()
      .mockResolvedValue(
        options.rawBody
      );

  app.register(
    createRazorpayWebhookRoutes({
      webhookVerifier:
        createRazorpayWebhookVerifier({
          webhookSecret:
            WEBHOOK_SECRET,
        }),

      walletCreditingService: {
        creditVerifiedPayment,
      },

      readRawBody,

      systemActorUserId:
        USER_ID,
    })
  );

  return {
    app,
    creditVerifiedPayment,
    readRawBody,
  };
}

describe("Razorpay webhook routes", () => {
  it("verifies payment.captured webhook and credits Wallet", async () => {
    const rawBody =
      createPaymentCapturedRawBody();

    const {
      app,
      creditVerifiedPayment,
      readRawBody,
    } =
      createApp({
        rawBody,
      });

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
            createSignature(
              rawBody
            ),

          "x-razorpay-event-id":
            "evt_razorpay_0001",
        },

        payload:
          rawBody,
      });

    await app.close();

    expect(response.statusCode).toBe(200);

    expect(response.json()).toEqual({
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

    expect(readRawBody).toHaveBeenCalledTimes(1);
    expect(creditVerifiedPayment).toHaveBeenCalledTimes(1);

    const creditInput =
      vi.mocked(
        creditVerifiedPayment
      ).mock.calls[0]?.[0];

    if (creditInput === undefined) {
      throw new Error("Missing creditVerifiedPayment input.");
    }

    expect(creditInput).toMatchObject({
      organizationId:
        ORGANIZATION_ID,

      actorUserId:
        USER_ID,

      fundingOrderId:
        FUNDING_ORDER_ID,

      provider:
        "razorpay",

      providerOrderId:
        "order_razorpay_0001",

      providerPaymentId:
        "pay_razorpay_0001",

      amountMinorUnits:
        500000n,

      currency:
        "INR",

      methodDetails: {
        method:
          "upi",
      },
    });

    expect(
      creditInput.providerSignatureDigest
    ).toMatch(
      /^[a-f0-9]{64}$/
    );
  });

  it("accepts verified non-payment webhook events without crediting Wallet", async () => {
    const rawBody =
      JSON.stringify({
        event:
          "order.paid",

        payload: {},
      });

    const {
      app,
      creditVerifiedPayment,
    } =
      createApp({
        rawBody,
      });

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
            createSignature(
              rawBody
            ),
        },

        payload:
          rawBody,
      });

    await app.close();

    expect(response.statusCode).toBe(200);

    expect(response.json()).toEqual({
      webhook: {
        provider:
          "razorpay",

        event:
          "order.paid",

        eventId:
          null,

        processed:
          false,
      },
    });

    expect(creditVerifiedPayment).not.toHaveBeenCalled();
  });

  it("rejects invalid Razorpay webhook signatures", async () => {
    const rawBody =
      createPaymentCapturedRawBody();

    const {
      app,
      creditVerifiedPayment,
    } =
      createApp({
        rawBody,
      });

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
            "0".repeat(64),
        },

        payload:
          rawBody,
      });

    await app.close();

    expect(response.statusCode).toBe(400);
    expect(creditVerifiedPayment).not.toHaveBeenCalled();
  });
});