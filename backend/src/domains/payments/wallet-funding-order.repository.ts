import type {
  QueryResultRow,
} from "pg";

import {
  executeDatabaseQuery,
  type DatabaseQueryExecutor,
} from "../../database/database.pool.js";

import type {
  PaymentCurrencyCode,
  PaymentProvider,
  WalletFundingOrderStatus,
} from "./payment.types.js";

import type {
  AttachWalletFundingProviderOrderInput,
  CreateWalletFundingOrderRepositoryInput,
  MarkWalletFundingOrderCreditedInput,
  WalletFundingOrderRecord,
} from "./wallet-funding-order.types.js";

interface WalletFundingOrderDatabaseRow extends QueryResultRow {
  id: string;
  organization_id: string;
  wallet_id: string;
  requested_by_user_id: string;
  provider: PaymentProvider;
  provider_order_id: string | null;
  provider_receipt: string | null;
  amount_minor_units: string;
  currency_code: PaymentCurrencyCode;
  status: WalletFundingOrderStatus;
  idempotency_key: string;
  provider_payload: Record<string, unknown>;
  expires_at: Date | null;
  credited_at: Date | null;
  created_at: Date;
  updated_at: Date;
  row_version: string;
}

const WALLET_FUNDING_ORDER_COLUMNS = `
  id,
  organization_id,
  wallet_id,
  requested_by_user_id,
  provider,
  provider_order_id,
  provider_receipt,
  amount_minor_units::text AS amount_minor_units,
  currency_code,
  status,
  idempotency_key,
  provider_payload,
  expires_at,
  credited_at,
  created_at,
  updated_at,
  row_version::text AS row_version
`;

function mapWalletFundingOrderRow(
  row: WalletFundingOrderDatabaseRow
): WalletFundingOrderRecord {
  return {
    id: row.id,
    organizationId: row.organization_id,
    walletId: row.wallet_id,
    requestedByUserId: row.requested_by_user_id,
    provider: row.provider,
    providerOrderId: row.provider_order_id,
    providerReceipt: row.provider_receipt,
    amount: {
      minorUnits: BigInt(row.amount_minor_units),
      currency: row.currency_code,
    },
    status: row.status,
    idempotencyKey: row.idempotency_key,
    providerPayload: row.provider_payload,
    expiresAt: row.expires_at,
    creditedAt: row.credited_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    rowVersion: row.row_version,
  };
}

function mapOptionalWalletFundingOrderRow(
  row: WalletFundingOrderDatabaseRow | undefined
): WalletFundingOrderRecord | null {
  return row ? mapWalletFundingOrderRow(row) : null;
}

export async function findWalletFundingOrderById(
  fundingOrderId: string,
  executor?: DatabaseQueryExecutor
): Promise<WalletFundingOrderRecord | null> {
  const result =
    await executeDatabaseQuery<WalletFundingOrderDatabaseRow>(
      `
        SELECT
          ${WALLET_FUNDING_ORDER_COLUMNS}
        FROM app.wallet_funding_orders
        WHERE id = $1::uuid
        LIMIT 1
      `,
      [fundingOrderId],
      executor
    );

  return mapOptionalWalletFundingOrderRow(result.rows[0]);
}

export async function findWalletFundingOrderByIdempotencyKey(
  input: {
    organizationId: string;
    idempotencyKey: string;
  },
  executor?: DatabaseQueryExecutor
): Promise<WalletFundingOrderRecord | null> {
  const result =
    await executeDatabaseQuery<WalletFundingOrderDatabaseRow>(
      `
        SELECT
          ${WALLET_FUNDING_ORDER_COLUMNS}
        FROM app.wallet_funding_orders
        WHERE organization_id = $1::uuid
          AND idempotency_key = $2
        LIMIT 1
      `,
      [
        input.organizationId,
        input.idempotencyKey,
      ],
      executor
    );

  return mapOptionalWalletFundingOrderRow(result.rows[0]);
}

export async function createWalletFundingOrder(
  input: CreateWalletFundingOrderRepositoryInput,
  executor: DatabaseQueryExecutor
): Promise<WalletFundingOrderRecord> {
  const result =
    await executeDatabaseQuery<WalletFundingOrderDatabaseRow>(
      `
        INSERT INTO app.wallet_funding_orders (
          organization_id,
          wallet_id,
          requested_by_user_id,
          provider,
          amount_minor_units,
          currency_code,
          status,
          idempotency_key,
          provider_payload,
          expires_at
        )
        VALUES (
          $1::uuid,
          $2::uuid,
          $3::uuid,
          $4,
          $5::bigint,
          $6,
          'created',
          $7,
          $8::jsonb,
          $9::timestamptz
        )
        ON CONFLICT (
          organization_id,
          idempotency_key
        )
        DO NOTHING
        RETURNING
          ${WALLET_FUNDING_ORDER_COLUMNS}
      `,
      [
        input.organizationId,
        input.walletId,
        input.requestedByUserId,
        input.provider,
        input.amountMinorUnits.toString(),
        input.currency,
        input.idempotencyKey,
        JSON.stringify(input.providerPayload ?? {}),
        input.expiresAt ?? null,
      ],
      executor
    );

  const created = mapOptionalWalletFundingOrderRow(result.rows[0]);

  if (created) {
    return created;
  }

  const existing =
    await findWalletFundingOrderByIdempotencyKey(
      {
        organizationId: input.organizationId,
        idempotencyKey: input.idempotencyKey,
      },
      executor
    );

  if (!existing) {
    throw new Error("Wallet funding order could not be created or retrieved.");
  }

  return existing;
}

export async function attachWalletFundingProviderOrder(
  input: AttachWalletFundingProviderOrderInput,
  executor: DatabaseQueryExecutor
): Promise<WalletFundingOrderRecord | null> {
  const result =
    await executeDatabaseQuery<WalletFundingOrderDatabaseRow>(
      `
        UPDATE app.wallet_funding_orders
        SET
          provider_order_id = $2,
          provider_receipt = $3,
          provider_payload = $4::jsonb,
          status = 'pending_provider'
        WHERE id = $1::uuid
          AND row_version = $5::bigint
        RETURNING
          ${WALLET_FUNDING_ORDER_COLUMNS}
      `,
      [
        input.fundingOrderId,
        input.providerOrderId,
        input.providerReceipt,
        JSON.stringify(input.providerPayload),
        input.expectedRowVersion,
      ],
      executor
    );

  return mapOptionalWalletFundingOrderRow(result.rows[0]);
}

export async function markWalletFundingOrderCredited(
  input: MarkWalletFundingOrderCreditedInput,
  executor: DatabaseQueryExecutor
): Promise<WalletFundingOrderRecord | null> {
  const result =
    await executeDatabaseQuery<WalletFundingOrderDatabaseRow>(
      `
        UPDATE app.wallet_funding_orders
        SET
          status = 'credited',
          credited_at = $2::timestamptz
        WHERE id = $1::uuid
          AND row_version = $3::bigint
        RETURNING
          ${WALLET_FUNDING_ORDER_COLUMNS}
      `,
      [
        input.fundingOrderId,
        input.creditedAt,
        input.expectedRowVersion,
      ],
      executor
    );

  return mapOptionalWalletFundingOrderRow(result.rows[0]);
}