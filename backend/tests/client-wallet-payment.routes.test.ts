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

import type {
  AdvertiserPaymentRecord,
  AdvertiserWalletLedgerEntryRecord,
  AdvertiserWalletRecord,
  WalletFundingOrderRecord,
} from "../src/domains/payments/index.js";

import type {
  RazorpayPaymentSignatureVerifier,
} from "../src/integrations/payments/index.js";

import {
  ClientWalletPaymentRouteAuthenticationError,
  createClientWalletPaymentRoutes,
  type ClientWalletPaymentRoutesDependencies,
} from "../src/routes/client-wallet-payment.routes.js";

const ORGANIZATION_ID =
  "00000000-0000-4000-8000-000000001101";

const USER_ID =
  "00000000-0000-4000-8000-000000001301";

const WALLET_ID =
  "00000000-0000-4000-8000-000000001201";

const FUNDING_ORDER_ID =
  "00000000-0000-4000-8000-000000001501";

const PAYMENT_ID =
  "00000000-0000-4000-8000-000000001901";

const LEDGER_ID =
  "00000000-0000-4000-8000-000000002201";

const NOW =
  new Date("2026-08-03T12:10:00.000Z");

const PAYMENT: AdvertiserPaymentRecord = {
  id: PAYMENT_ID,
  organizationId: ORGANIZATION_ID,
  walletId: WALLET_ID,
  fundingOrderId: FUNDING_ORDER_ID,
  invoiceId: null,
  campaignId: null,
  provider: "razorpay",
  providerOrderId: "order_razorpay_0001",
  providerPaymentId: "pay_razorpay_0001",
  providerSignatureDigest: "digest-0001",
  status: "captured",
  amount: { minorUnits: 500000n, currency: "INR" },
  captured: { minorUnits: 500000n, currency: "INR" },
  refunded: { minorUnits: 0n, currency: "INR" },
  methodDetails: {},
  providerPayload: {},
  webhookVerifiedAt: NOW,
  paidAt: NOW,
  failedAt: null,
  createdAt: NOW,
  updatedAt: NOW,
  rowVersion: "1",
};

const WALLET: AdvertiserWalletRecord = {
  id: WALLET_ID,
  organizationId: ORGANIZATION_ID,
  currency: "INR",
  status: "active",
  availableBalance: { minorUnits: 500000n, currency: "INR" },
  reservedBalance: { minorUnits: 0n, currency: "INR" },
  totalCredited: { minorUnits: 500000n, currency: "INR" },
  totalSpent: { minorUnits: 0n, currency: "INR" },
  totalRefunded: { minorUnits: 0n, currency: "INR" },
  createdAt: NOW,
  updatedAt: NOW,
  rowVersion: "2",
};

const FUNDING_ORDER: WalletFundingOrderRecord = {
  id: FUNDING_ORDER_ID,
  organizationId: ORGANIZATION_ID,
  walletId: WALLET_ID,
  requestedByUserId: USER_ID,
  provider: "razorpay",
  providerOrderId: "order_razorpay_0001",
  providerReceipt: "wf_0001",
  amount: { minorUnits: 500000n, currency: "INR" },
  status: "credited",
  idempotencyKey: "wallet-funding-0001",
  providerPayload: {},
  expiresAt: null,
  creditedAt: NOW,
  createdAt: NOW,
  updatedAt: NOW,
  rowVersion: "3",
};

const LEDGER: AdvertiserWalletLedgerEntryRecord = {
  id: LEDGER_ID,
  organizationId: ORGANIZATION_ID,
  walletId: WALLET_ID,
  fundingOrderId: FUNDING_ORDER_ID,
  campaignId: null,
  allocationId: null,
  invoiceId: null,
  paymentId: PAYMENT_ID,
  refundId: null,
  entryType: "payment_credit",
  direction: "credit",
  status: "posted",
  amount: { minorUnits: 500000n, currency: "INR" },
  balanceBefore: { minorUnits: 0n, currency: "INR" },
  balanceAfter: { minorUnits: 500000n, currency: "INR" },
  idempotencyKey: "wallet-credit:pay_razorpay_0001",
  providerReference: "pay_razorpay_0001",
  metadata: {},
  createdByUserId: USER_ID,
  createdAt: NOW,
  rowVersion: "1",
};

function createApp(
  options: {
    authenticateClientRequest?: ClientWalletPaymentRoutesDependencies[
      "authenticateClientRequest"
    ];
    assertPaymentSignature?: RazorpayPaymentSignatureVerifier[
      "assertPaymentSignature"
    ];
    creditVerifiedPayment?: WalletCreditingService[
      "creditVerifiedPayment"
    ];
  } = {}
) {
  const app =
    Fastify();

  const authenticateClientRequest =
    options.authenticateClientRequest ??
    vi.fn<
      ClientWalletPaymentRoutesDependencies[
        "authenticateClientRequest"
      ]
    >()
      .mockResolvedValue({
        userId:
          USER_ID,

        organizationId:
          ORGANIZATION_ID,
      });

  const assertPaymentSignature =
    options.assertPaymentSignature ??
    vi.fn<
      RazorpayPaymentSignatureVerifier[
        "assertPaymentSignature"
      ]
    >()
      .mockReturnValue(
        "digest-0001"
      );

  const creditVerifiedPayment =
    options.creditVerifiedPayment ??
    vi.fn<
      WalletCreditingService[
        "creditVerifiedPayment"
      ]
    >()
      .mockResolvedValue({
        payment:
          PAYMENT,

        ledgerEntry:
          LEDGER,

        wallet:
          WALLET,

        fundingOrder:
          FUNDING_ORDER,
      });

  app.register(
    createClientWalletPaymentRoutes({
      authenticateClientRequest,

      signatureVerifier: {
        assertPaymentSignature,

        verifyPaymentSignature:
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
    })
  );

  return {
    app,
    authenticateClientRequest,
    assertPaymentSignature,
    creditVerifiedPayment,
  };
}

describe("Client Wallet payment routes", () => {
  it("verifies Razorpay payment and credits Wallet", async () => {
    const {
      app,
      assertPaymentSignature,
      creditVerifiedPayment,
    } =
      createApp();

    const response =
      await app.inject({
        method:
          "POST",

        url:
          "/api/v1/client/wallet/payment-verifications",

        payload: {
          fundingOrderId:
            FUNDING_ORDER_ID,

          providerOrderId:
            "order_razorpay_0001",

          providerPaymentId:
            "pay_razorpay_0001",

          providerSignature:
            "signature-0001",

          amountMinorUnits:
            "500000",

          currency:
            "INR",

          methodDetails: {
            method:
              "upi",
          },

          providerPayload: {
            source:
              "razorpay-checkout",
          },
        },
      });

    await app.close();

    expect(response.statusCode).toBe(200);

    expect(response.json()).toMatchObject({
      verification: {
        payment: {
          id:
            PAYMENT_ID,

          providerPaymentId:
            "pay_razorpay_0001",

          amountMinorUnits:
            "500000",

          currency:
            "INR",

          status:
            "captured",
        },

        wallet: {
          id:
            WALLET_ID,

          availableBalanceMinorUnits:
            "500000",

          currency:
            "INR",
        },

        fundingOrder: {
          id:
            FUNDING_ORDER_ID,

          status:
            "credited",
        },

        replay:
          false,
      },
    });

    expect(
      assertPaymentSignature
    ).toHaveBeenCalledWith({
      providerOrderId:
        "order_razorpay_0001",

      providerPaymentId:
        "pay_razorpay_0001",

      providerSignature:
        "signature-0001",
    });

    const firstCreditCall =
      vi.mocked(creditVerifiedPayment).mock.calls[0]?.[0];

    if (firstCreditCall === undefined) {
      throw new Error("Missing creditVerifiedPayment call.");
    }

    expect(firstCreditCall).toMatchObject({
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

      providerSignatureDigest:
        "digest-0001",

      amountMinorUnits:
        500000n,

      currency:
        "INR",
    });
  });

  it("rejects invalid payment verification body", async () => {
    const {
      app,
      assertPaymentSignature,
      creditVerifiedPayment,
    } =
      createApp();

    const response =
      await app.inject({
        method:
          "POST",

        url:
          "/api/v1/client/wallet/payment-verifications",

        payload: {
          fundingOrderId:
            FUNDING_ORDER_ID,

          providerOrderId:
            "order_razorpay_0001",

          providerPaymentId:
            "pay_razorpay_0001",

          providerSignature:
            "signature-0001",

          amountMinorUnits:
            "abc",

          currency:
            "INR",
        },
      });

    await app.close();

    expect(response.statusCode).toBe(400);
    expect(assertPaymentSignature).not.toHaveBeenCalled();
    expect(creditVerifiedPayment).not.toHaveBeenCalled();
  });

  it("rejects unauthenticated payment verification requests", async () => {
    const {
      app,
      creditVerifiedPayment,
    } =
      createApp({
        authenticateClientRequest:
          vi.fn<
            ClientWalletPaymentRoutesDependencies[
              "authenticateClientRequest"
            ]
          >()
            .mockRejectedValue(
              new ClientWalletPaymentRouteAuthenticationError()
            ),
      });

    const response =
      await app.inject({
        method:
          "POST",

        url:
          "/api/v1/client/wallet/payment-verifications",

        payload: {
          fundingOrderId:
            FUNDING_ORDER_ID,

          providerOrderId:
            "order_razorpay_0001",

          providerPaymentId:
            "pay_razorpay_0001",

          providerSignature:
            "signature-0001",

          amountMinorUnits:
            "500000",

          currency:
            "INR",
        },
      });

    await app.close();

    expect(response.statusCode).toBe(401);
    expect(creditVerifiedPayment).not.toHaveBeenCalled();
  });
});