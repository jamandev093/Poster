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
  attachWalletFundingProviderOrder,
  createWalletFundingOrder,
  findWalletFundingOrderById,
  findWalletFundingOrderByIdempotencyKey,
} from "../src/domains/payments/index.js";

const ORGANIZATION_ID =
  "00000000-0000-4000-8000-000000001101";

const WALLET_ID =
  "00000000-0000-4000-8000-000000001201";

const USER_ID =
  "00000000-0000-4000-8000-000000001301";

const FUNDING_ORDER_ID =
  "00000000-0000-4000-8000-000000001501";

const NOW =
  new Date("2026-08-03T05:00:00.000Z");

function createFundingOrderRow(
  overrides: Record<string, unknown> = {}
) {
  return {
    id: FUNDING_ORDER_ID,
    organization_id: ORGANIZATION_ID,
    wallet_id: WALLET_ID,
    requested_by_user_id: USER_ID,
    provider: "razorpay",
    provider_order_id: null,
    provider_receipt: null,
    amount_minor_units: "500000",
    currency_code: "INR",
    status: "created",
    idempotency_key: "wallet-funding-0001",
    provider_payload: {},
    expires_at: null,
    credited_at: null,
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

describe("Wallet funding order repository", () => {
  it("finds a Wallet funding order by id", async () => {
    const { executor, query } =
      createExecutor([[createFundingOrderRow()]]);

    const order =
      await findWalletFundingOrderById(
        FUNDING_ORDER_ID,
        executor
      );

    expect(order).toMatchObject({
      id: FUNDING_ORDER_ID,
      organizationId: ORGANIZATION_ID,
      walletId: WALLET_ID,
      status: "created",
      provider: "razorpay",
      rowVersion: "1",
    });

    expect(order?.amount.minorUnits).toBe(500000n);

    const firstCall =
      query.mock.calls[0];

    expect(firstCall).toBeDefined();
    expect(firstCall?.[0]).toContain(
      "FROM app.wallet_funding_orders"
    );
  });

  it("finds a Wallet funding order by idempotency key", async () => {
    const { executor } =
      createExecutor([[createFundingOrderRow()]]);

    const order =
      await findWalletFundingOrderByIdempotencyKey(
        {
          organizationId: ORGANIZATION_ID,
          idempotencyKey: "wallet-funding-0001",
        },
        executor
      );

    expect(order?.idempotencyKey).toBe(
      "wallet-funding-0001"
    );
  });

  it("creates a Wallet funding order", async () => {
    const { executor, query } =
      createExecutor([[createFundingOrderRow()]]);

    const order =
      await createWalletFundingOrder(
        {
          organizationId: ORGANIZATION_ID,
          walletId: WALLET_ID,
          requestedByUserId: USER_ID,
          amountMinorUnits: 500000n,
          currency: "INR",
          provider: "razorpay",
          idempotencyKey: "wallet-funding-0001",
          providerPayload: {
            source: "test",
          },
        },
        executor
      );

    expect(order.status).toBe("created");

    const firstCall =
      query.mock.calls[0];

    expect(firstCall).toBeDefined();
    expect(firstCall?.[0]).toContain(
      "INSERT INTO app.wallet_funding_orders"
    );
    expect(firstCall?.[1]).toContain(
      "wallet-funding-0001"
    );
  });

  it("returns an existing Wallet funding order on idempotent replay", async () => {
    const { executor, query } =
      createExecutor([
        [],
        [createFundingOrderRow()],
      ]);

    const order =
      await createWalletFundingOrder(
        {
          organizationId: ORGANIZATION_ID,
          walletId: WALLET_ID,
          requestedByUserId: USER_ID,
          amountMinorUnits: 500000n,
          currency: "INR",
          provider: "razorpay",
          idempotencyKey: "wallet-funding-0001",
        },
        executor
      );

    expect(order.id).toBe(FUNDING_ORDER_ID);
    expect(query).toHaveBeenCalledTimes(2);
  });

  it("attaches a Razorpay provider order reference", async () => {
    const { executor, query } =
      createExecutor([
        [
          createFundingOrderRow({
            provider_order_id: "order_razorpay_0001",
            provider_receipt: "receipt-0001",
            provider_payload: {
              provider: "razorpay",
            },
            status: "pending_provider",
            row_version: "2",
          }),
        ],
      ]);

    const order =
      await attachWalletFundingProviderOrder(
        {
          fundingOrderId: FUNDING_ORDER_ID,
          providerOrderId: "order_razorpay_0001",
          providerReceipt: "receipt-0001",
          providerPayload: {
            provider: "razorpay",
          },
          expectedRowVersion: "1",
        },
        executor
      );

    expect(order).toMatchObject({
      providerOrderId: "order_razorpay_0001",
      providerReceipt: "receipt-0001",
      status: "pending_provider",
      rowVersion: "2",
    });

    const firstCall =
      query.mock.calls[0];

    expect(firstCall).toBeDefined();
    expect(firstCall?.[0]).toContain(
      "UPDATE app.wallet_funding_orders"
    );
  });

  it("returns null when provider attachment row version does not match", async () => {
    const { executor } =
      createExecutor([[]]);

    await expect(
      attachWalletFundingProviderOrder(
        {
          fundingOrderId: FUNDING_ORDER_ID,
          providerOrderId: "order_razorpay_0001",
          providerReceipt: "receipt-0001",
          providerPayload: {},
          expectedRowVersion: "99",
        },
        executor
      )
    ).resolves.toBeNull();
  });
});