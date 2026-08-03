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
  createAdvertiserWallet,
  createAdvertiserWalletLedgerEntry,
  findAdvertiserWalletByOrganizationId,
  findAdvertiserWalletLedgerEntryByIdempotencyKey,
} from "../src/domains/payments/index.js";

const ORGANIZATION_ID =
  "00000000-0000-4000-8000-000000001101";

const WALLET_ID =
  "00000000-0000-4000-8000-000000001201";

const USER_ID =
  "00000000-0000-4000-8000-000000001301";

const NOW =
  new Date(
    "2026-08-03T04:00:00.000Z"
  );

function createWalletRow(
  overrides:
    Record<string, unknown> =
    {}
) {
  return {
    id:
      WALLET_ID,

    organization_id:
      ORGANIZATION_ID,

    currency_code:
      "INR",

    status:
      "active",

    available_balance_minor_units:
      "500000",

    reserved_balance_minor_units:
      "100000",

    total_credited_minor_units:
      "700000",

    total_spent_minor_units:
      "100000",

    total_refunded_minor_units:
      "0",

    created_at:
      NOW,

    updated_at:
      NOW,

    row_version:
      "3",

    ...overrides,
  };
}

function createLedgerRow(
  overrides:
    Record<string, unknown> =
    {}
) {
  return {
    id:
      "00000000-0000-4000-8000-000000001401",

    organization_id:
      ORGANIZATION_ID,

    wallet_id:
      WALLET_ID,

    funding_order_id:
      null,

    campaign_id:
      null,

    allocation_id:
      null,

    invoice_id:
      null,

    payment_id:
      null,

    refund_id:
      null,

    entry_type:
      "payment_credit",

    direction:
      "credit",

    status:
      "posted",

    amount_minor_units:
      "500000",

    currency_code:
      "INR",

    balance_before_minor_units:
      "0",

    balance_after_minor_units:
      "500000",

    idempotency_key:
      "ledger-entry-0001",

    provider_reference:
      "razorpay-payment-0001",

    metadata: {
      source:
        "test",
    },

    created_by_user_id:
      USER_ID,

    created_at:
      NOW,

    row_version:
      "1",

    ...overrides,
  };
}

function createExecutor(
  rowsByCall:
    unknown[][]
): {
  executor: DatabaseQueryExecutor;
  query: ReturnType<typeof vi.fn>;
} {
  const query =
    vi.fn();

  for (
    const rows of
      rowsByCall
  ) {
    query.mockResolvedValueOnce({
      rows,
    });
  }

  return {
    executor:
      {
        query,
      } as unknown as DatabaseQueryExecutor,

    query,
  };
}

describe(
  "Payment Wallet repository",
  () => {
    it(
      "finds an advertiser Wallet by organization",
      async () => {
        const {
          executor,
          query,
        } =
          createExecutor([
            [
              createWalletRow(),
            ],
          ]);

        const wallet =
          await findAdvertiserWalletByOrganizationId(
            ORGANIZATION_ID,
            executor
          );

        expect(
          wallet
        ).toMatchObject({
          id:
            WALLET_ID,

          organizationId:
            ORGANIZATION_ID,

          currency:
            "INR",

          status:
            "active",

          rowVersion:
            "3",
        });

        expect(
          wallet?.availableBalance.minorUnits
        ).toBe(
          500000n
        );

        expect(
          query
        ).toHaveBeenCalledWith(
          expect.stringContaining(
            "FROM app.advertiser_wallets"
          ),
          [
            ORGANIZATION_ID,
          ]
        );
      }
    );

    it(
      "creates an advertiser Wallet or returns the existing Wallet",
      async () => {
        const {
          executor,
          query,
        } =
          createExecutor([
            [],
            [
              createWalletRow(),
            ],
          ]);

        const wallet =
          await createAdvertiserWallet(
            {
              organizationId:
                ORGANIZATION_ID,

              currency:
                "INR",
            },
            executor
          );

        expect(
          wallet.id
        ).toBe(
          WALLET_ID
        );

        expect(
          query
        ).toHaveBeenCalledTimes(
          2
        );

        const firstCall =
          query.mock.calls[0];

        expect(
          firstCall
        ).toBeDefined();

        expect(
          firstCall?.[0]
        ).toContain(
          "INSERT INTO app.advertiser_wallets"
        );
      }
    );

    it(
      "finds a Wallet ledger entry by idempotency key",
      async () => {
        const {
          executor,
        } =
          createExecutor([
            [
              createLedgerRow(),
            ],
          ]);

        const entry =
          await findAdvertiserWalletLedgerEntryByIdempotencyKey(
            {
              organizationId:
                ORGANIZATION_ID,

              idempotencyKey:
                "ledger-entry-0001",
            },
            executor
          );

        expect(
          entry
        ).toMatchObject({
          walletId:
            WALLET_ID,

          entryType:
            "payment_credit",

          direction:
            "credit",

          status:
            "posted",
        });

        expect(
          entry?.amount.minorUnits
        ).toBe(
          500000n
        );
      }
    );

    it(
      "creates an immutable Wallet ledger entry",
      async () => {
        const {
          executor,
          query,
        } =
          createExecutor([
            [
              createLedgerRow(),
            ],
          ]);

        const entry =
          await createAdvertiserWalletLedgerEntry(
            {
              organizationId:
                ORGANIZATION_ID,

              walletId:
                WALLET_ID,

              entryType:
                "payment_credit",

              direction:
                "credit",

              amountMinorUnits:
                500000n,

              currency:
                "INR",

              balanceBeforeMinorUnits:
                0n,

              balanceAfterMinorUnits:
                500000n,

              idempotencyKey:
                "ledger-entry-0001",

              actorUserId:
                USER_ID,

              providerReference:
                "razorpay-payment-0001",

              metadata: {
                source:
                  "test",
              },
            },
            executor
          );

        expect(
          entry.balanceAfter.minorUnits
        ).toBe(
          500000n
        );

        const firstCall =
          query.mock.calls[0];

        expect(
          firstCall
        ).toBeDefined();

        expect(
          firstCall?.[0]
        ).toContain(
          "INSERT INTO app.advertiser_wallet_ledger_entries"
        );

        expect(
          firstCall?.[1]
        ).toContain(
          "ledger-entry-0001"
        );
      }
    );

    it(
      "returns the existing ledger entry on idempotent replay",
      async () => {
        const {
          executor,
          query,
        } =
          createExecutor([
            [],
            [
              createLedgerRow(),
            ],
          ]);

        const entry =
          await createAdvertiserWalletLedgerEntry(
            {
              organizationId:
                ORGANIZATION_ID,

              walletId:
                WALLET_ID,

              entryType:
                "payment_credit",

              direction:
                "credit",

              amountMinorUnits:
                500000n,

              currency:
                "INR",

              balanceBeforeMinorUnits:
                0n,

              balanceAfterMinorUnits:
                500000n,

              idempotencyKey:
                "ledger-entry-0001",

              actorUserId:
                USER_ID,
            },
            executor
          );

        expect(
          entry.idempotencyKey
        ).toBe(
          "ledger-entry-0001"
        );

        expect(
          query
        ).toHaveBeenCalledTimes(
          2
        );
      }
    );
  }
);