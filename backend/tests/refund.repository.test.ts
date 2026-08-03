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
  approveAdvertiserRefund,
  attachProviderRefundReference,
  createAdvertiserRefund,
  findAdvertiserRefundById,
  findAdvertiserRefundByProviderRefundId,
} from "../src/domains/payments/index.js";

const ORGANIZATION_ID =
  "00000000-0000-4000-8000-000000001101";

const PAYMENT_ID =
  "00000000-0000-4000-8000-000000001901";

const REFUND_ID =
  "00000000-0000-4000-8000-000000002001";

const USER_ID =
  "00000000-0000-4000-8000-000000001301";

const NOW =
  new Date("2026-08-03T06:30:00.000Z");

function createRefundRow(
  overrides: Record<string, unknown> = {}
) {
  return {
    id: REFUND_ID,
    organization_id: ORGANIZATION_ID,
    payment_id: PAYMENT_ID,
    invoice_id: null,
    campaign_id: null,
    requested_by_user_id: USER_ID,
    approved_by_user_id: null,
    provider: "razorpay",
    provider_refund_id: null,
    reason: "Campaign cancelled before delivery",
    status: "requested",
    requested_amount_minor_units: "250000",
    approved_amount_minor_units: null,
    refunded_amount_minor_units: "0",
    currency_code: "INR",
    provider_payload: {},
    requested_at: NOW,
    approved_at: null,
    refunded_at: null,
    failed_at: null,
    cancelled_at: null,
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

describe("Advertiser refund repository", () => {
  it("finds a refund by id", async () => {
    const { executor, query } =
      createExecutor([[createRefundRow()]]);

    const refund =
      await findAdvertiserRefundById(
        REFUND_ID,
        executor
      );

    expect(refund).toMatchObject({
      id: REFUND_ID,
      organizationId: ORGANIZATION_ID,
      paymentId: PAYMENT_ID,
      status: "requested",
      provider: "razorpay",
      rowVersion: "1",
    });

    expect(refund?.requestedAmount.minorUnits).toBe(250000n);

    const firstCall = query.mock.calls[0];

    expect(firstCall).toBeDefined();
    expect(firstCall?.[0]).toContain(
      "FROM app.advertiser_refunds"
    );
  });

  it("finds a refund by provider refund id", async () => {
    const { executor } =
      createExecutor([
        [
          createRefundRow({
            provider_refund_id: "rfnd_razorpay_0001",
          }),
        ],
      ]);

    const refund =
      await findAdvertiserRefundByProviderRefundId(
        "rfnd_razorpay_0001",
        executor
      );

    expect(refund?.providerRefundId).toBe(
      "rfnd_razorpay_0001"
    );
  });

  it("creates a requested refund", async () => {
    const { executor, query } =
      createExecutor([[createRefundRow()]]);

    const refund =
      await createAdvertiserRefund(
        {
          organizationId: ORGANIZATION_ID,
          paymentId: PAYMENT_ID,
          requestedByUserId: USER_ID,
          provider: "razorpay",
          reason: "Campaign cancelled before delivery",
          requestedAmountMinorUnits: 250000n,
          currency: "INR",
          providerPayload: {
            source: "test",
          },
        },
        executor
      );

    expect(refund.status).toBe("requested");

    const firstCall = query.mock.calls[0];

    expect(firstCall).toBeDefined();
    expect(firstCall?.[0]).toContain(
      "INSERT INTO app.advertiser_refunds"
    );
    expect(firstCall?.[1]).toContain(
      "Campaign cancelled before delivery"
    );
  });

  it("approves a refund with optimistic row version", async () => {
    const { executor, query } =
      createExecutor([
        [
          createRefundRow({
            approved_by_user_id: USER_ID,
            approved_amount_minor_units: "250000",
            status: "approved",
            approved_at: NOW,
            row_version: "2",
          }),
        ],
      ]);

    const refund =
      await approveAdvertiserRefund(
        {
          refundId: REFUND_ID,
          approvedByUserId: USER_ID,
          approvedAmountMinorUnits: 250000n,
          approvedAt: NOW,
          expectedRowVersion: "1",
        },
        executor
      );

    expect(refund).toMatchObject({
      status: "approved",
      approvedByUserId: USER_ID,
      rowVersion: "2",
    });

    expect(refund?.approvedAmount?.minorUnits).toBe(250000n);

    const firstCall = query.mock.calls[0];

    expect(firstCall).toBeDefined();
    expect(firstCall?.[0]).toContain(
      "UPDATE app.advertiser_refunds"
    );
  });

  it("attaches a Razorpay refund reference", async () => {
    const { executor } =
      createExecutor([
        [
          createRefundRow({
            provider_refund_id: "rfnd_razorpay_0001",
            provider_payload: {
              provider: "razorpay",
            },
            status: "provider_pending",
            row_version: "3",
          }),
        ],
      ]);

    const refund =
      await attachProviderRefundReference(
        {
          refundId: REFUND_ID,
          providerRefundId: "rfnd_razorpay_0001",
          providerPayload: {
            provider: "razorpay",
          },
          expectedRowVersion: "2",
        },
        executor
      );

    expect(refund).toMatchObject({
      providerRefundId: "rfnd_razorpay_0001",
      status: "provider_pending",
      rowVersion: "3",
    });
  });

  it("returns null when refund row version does not match", async () => {
    const { executor } =
      createExecutor([[]]);

    await expect(
      approveAdvertiserRefund(
        {
          refundId: REFUND_ID,
          approvedByUserId: USER_ID,
          approvedAmountMinorUnits: 250000n,
          approvedAt: NOW,
          expectedRowVersion: "99",
        },
        executor
      )
    ).resolves.toBeNull();
  });
});