import {
  describe,
  expect,
  it,
  vi,
} from "vitest";

import type {
  DatabaseQueryExecutor,
} from "../src/database/database.pool.js";

import {
  createAdvertiserPayment,
  findAdvertiserPaymentById,
  findAdvertiserPaymentByProviderPaymentId,
} from "../src/domains/payments/index.js";

const ORGANIZATION_ID =
  "00000000-0000-4000-8000-000000001101";

const WALLET_ID =
  "00000000-0000-4000-8000-000000001201";

const PAYMENT_ID =
  "00000000-0000-4000-8000-000000001901";

const NOW =
  new Date("2026-08-03T06:00:00.000Z");

function createPaymentRow(
  overrides: Record<string, unknown> = {}
) {
  return {
    id: PAYMENT_ID,
    organization_id: ORGANIZATION_ID,
    wallet_id: WALLET_ID,
    funding_order_id: null,
    invoice_id: null,
    campaign_id: null,
    provider: "razorpay",
    provider_order_id: "order_razorpay_0001",
    provider_payment_id: "pay_razorpay_0001",
    provider_signature_digest: "digest-0001",
    status: "captured",
    amount_minor_units: "500000",
    captured_minor_units: "500000",
    refunded_minor_units: "0",
    currency_code: "INR",
    method_details: {
      method: "upi",
    },
    provider_payload: {
      provider: "razorpay",
    },
    webhook_verified_at: NOW,
    paid_at: NOW,
    failed_at: null,
    created_at: NOW,
    updated_at: NOW,
    row_version: "1",
    ...overrides,
  };
}

function createExecutor(
  rowsByCall: unknown[][]
): {
  executor: DatabaseQueryExecutor;
  query: ReturnType<typeof vi.fn>;
} {
  const query = vi.fn();

  for (const rows of rowsByCall) {
    query.mockResolvedValueOnce({
      rows,
    });
  }

  return {
    executor: {
      query,
    } as unknown as DatabaseQueryExecutor,

    query,
  };
}

describe("Advertiser payment repository", () => {
  it("finds a payment by id", async () => {
    const { executor, query } =
      createExecutor([[createPaymentRow()]]);

    const payment =
      await findAdvertiserPaymentById(
        PAYMENT_ID,
        executor
      );

    expect(payment).toMatchObject({
      id: PAYMENT_ID,
      organizationId: ORGANIZATION_ID,
      walletId: WALLET_ID,
      provider: "razorpay",
      providerPaymentId: "pay_razorpay_0001",
      status: "captured",
    });

    expect(payment?.captured.minorUnits).toBe(500000n);

    const firstCall = query.mock.calls[0];

    expect(firstCall).toBeDefined();
    expect(firstCall?.[0]).toContain(
      "FROM app.advertiser_payments"
    );
  });

  it("finds a payment by provider payment id", async () => {
    const { executor } =
      createExecutor([[createPaymentRow()]]);

    const payment =
      await findAdvertiserPaymentByProviderPaymentId(
        "pay_razorpay_0001",
        executor
      );

    expect(payment?.id).toBe(PAYMENT_ID);
  });

  it("creates an advertiser payment record", async () => {
    const { executor, query } =
      createExecutor([[createPaymentRow()]]);

    const payment =
      await createAdvertiserPayment(
        {
          organizationId: ORGANIZATION_ID,
          walletId: WALLET_ID,
          provider: "razorpay",
          providerOrderId: "order_razorpay_0001",
          providerPaymentId: "pay_razorpay_0001",
          providerSignatureDigest: "digest-0001",
          status: "captured",
          amountMinorUnits: 500000n,
          capturedMinorUnits: 500000n,
          currency: "INR",
          methodDetails: {
            method: "upi",
          },
          providerPayload: {
            provider: "razorpay",
          },
          webhookVerifiedAt: NOW,
          paidAt: NOW,
        },
        executor
      );

    expect(payment.status).toBe("captured");
    expect(payment.amount.minorUnits).toBe(500000n);

    const firstCall = query.mock.calls[0];

    expect(firstCall).toBeDefined();
    expect(firstCall?.[0]).toContain(
      "INSERT INTO app.advertiser_payments"
    );
    expect(firstCall?.[1]).toContain(
      "pay_razorpay_0001"
    );
  });
});