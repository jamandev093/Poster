import type {
  QueryResultRow,
} from "pg";

import {
  executeDatabaseQuery,
  type DatabaseQueryExecutor,
} from "../../database/database.pool.js";

import type {
  AdvertiserWalletLedgerEntryRecord,
  AdvertiserWalletRecord,
  CreateAdvertiserWalletInput,
  CreateAdvertiserWalletLedgerEntryInput,
  LedgerEntryDirection,
  LedgerEntryStatus,
  LedgerEntryType,
  PaymentCurrencyCode,
  UpdateAdvertiserWalletBalancesInput,
  WalletStatus,
} from "./payment.types.js";

interface AdvertiserWalletDatabaseRow extends QueryResultRow {
  id: string;
  organization_id: string;
  currency_code: PaymentCurrencyCode;
  status: WalletStatus;
  available_balance_minor_units: string;
  reserved_balance_minor_units: string;
  total_credited_minor_units: string;
  total_spent_minor_units: string;
  total_refunded_minor_units: string;
  created_at: Date;
  updated_at: Date;
  row_version: string;
}

interface AdvertiserWalletLedgerDatabaseRow extends QueryResultRow {
  id: string;
  organization_id: string;
  wallet_id: string;
  funding_order_id: string | null;
  campaign_id: string | null;
  allocation_id: string | null;
  invoice_id: string | null;
  payment_id: string | null;
  refund_id: string | null;
  entry_type: LedgerEntryType;
  direction: LedgerEntryDirection;
  status: LedgerEntryStatus;
  amount_minor_units: string;
  currency_code: PaymentCurrencyCode;
  balance_before_minor_units: string;
  balance_after_minor_units: string;
  idempotency_key: string;
  provider_reference: string | null;
  metadata: Record<string, unknown>;
  created_by_user_id: string;
  created_at: Date;
  row_version: string;
}

const WALLET_COLUMNS = `
  id,
  organization_id,
  currency_code,
  status,
  available_balance_minor_units::text AS available_balance_minor_units,
  reserved_balance_minor_units::text AS reserved_balance_minor_units,
  total_credited_minor_units::text AS total_credited_minor_units,
  total_spent_minor_units::text AS total_spent_minor_units,
  total_refunded_minor_units::text AS total_refunded_minor_units,
  created_at,
  updated_at,
  row_version::text AS row_version
`;

const LEDGER_COLUMNS = `
  id,
  organization_id,
  wallet_id,
  funding_order_id,
  campaign_id,
  allocation_id,
  invoice_id,
  payment_id,
  refund_id,
  entry_type,
  direction,
  status,
  amount_minor_units::text AS amount_minor_units,
  currency_code,
  balance_before_minor_units::text AS balance_before_minor_units,
  balance_after_minor_units::text AS balance_after_minor_units,
  idempotency_key,
  provider_reference,
  metadata,
  created_by_user_id,
  created_at,
  row_version::text AS row_version
`;

function money(
  minorUnits: string,
  currency: PaymentCurrencyCode
) {
  return {
    minorUnits: BigInt(minorUnits),
    currency,
  };
}

function mapWalletDatabaseRow(
  row: AdvertiserWalletDatabaseRow
): AdvertiserWalletRecord {
  return {
    id: row.id,
    organizationId: row.organization_id,
    currency: row.currency_code,
    status: row.status,
    availableBalance: money(row.available_balance_minor_units, row.currency_code),
    reservedBalance: money(row.reserved_balance_minor_units, row.currency_code),
    totalCredited: money(row.total_credited_minor_units, row.currency_code),
    totalSpent: money(row.total_spent_minor_units, row.currency_code),
    totalRefunded: money(row.total_refunded_minor_units, row.currency_code),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    rowVersion: row.row_version,
  };
}

function mapOptionalWalletRow(
  row: AdvertiserWalletDatabaseRow | undefined
): AdvertiserWalletRecord | null {
  return row ? mapWalletDatabaseRow(row) : null;
}

function mapLedgerDatabaseRow(
  row: AdvertiserWalletLedgerDatabaseRow
): AdvertiserWalletLedgerEntryRecord {
  return {
    id: row.id,
    organizationId: row.organization_id,
    walletId: row.wallet_id,
    fundingOrderId: row.funding_order_id,
    campaignId: row.campaign_id,
    allocationId: row.allocation_id,
    invoiceId: row.invoice_id,
    paymentId: row.payment_id,
    refundId: row.refund_id,
    entryType: row.entry_type,
    direction: row.direction,
    status: row.status,
    amount: money(row.amount_minor_units, row.currency_code),
    balanceBefore: money(row.balance_before_minor_units, row.currency_code),
    balanceAfter: money(row.balance_after_minor_units, row.currency_code),
    idempotencyKey: row.idempotency_key,
    providerReference: row.provider_reference,
    metadata: row.metadata,
    createdByUserId: row.created_by_user_id,
    createdAt: row.created_at,
    rowVersion: row.row_version,
  };
}

function mapOptionalLedgerRow(
  row: AdvertiserWalletLedgerDatabaseRow | undefined
): AdvertiserWalletLedgerEntryRecord | null {
  return row ? mapLedgerDatabaseRow(row) : null;
}

export async function findAdvertiserWalletByOrganizationId(
  organizationId: string,
  executor?: DatabaseQueryExecutor
): Promise<AdvertiserWalletRecord | null> {
  const result =
    await executeDatabaseQuery<AdvertiserWalletDatabaseRow>(
      `
        SELECT
          ${WALLET_COLUMNS}
        FROM app.advertiser_wallets
        WHERE organization_id = $1::uuid
        LIMIT 1
      `,
      [organizationId],
      executor
    );

  return mapOptionalWalletRow(result.rows[0]);
}

export async function createAdvertiserWallet(
  input: CreateAdvertiserWalletInput,
  executor: DatabaseQueryExecutor
): Promise<AdvertiserWalletRecord> {
  const result =
    await executeDatabaseQuery<AdvertiserWalletDatabaseRow>(
      `
        INSERT INTO app.advertiser_wallets (
          organization_id,
          currency_code
        )
        VALUES (
          $1::uuid,
          $2
        )
        ON CONFLICT (organization_id)
        DO NOTHING
        RETURNING
          ${WALLET_COLUMNS}
      `,
      [
        input.organizationId,
        input.currency,
      ],
      executor
    );

  const created = mapOptionalWalletRow(result.rows[0]);

  if (created) {
    return created;
  }

  const existing =
    await findAdvertiserWalletByOrganizationId(
      input.organizationId,
      executor
    );

  if (!existing) {
    throw new Error("Advertiser Wallet could not be created or retrieved.");
  }

  return existing;
}

export async function updateAdvertiserWalletBalances(
  input: UpdateAdvertiserWalletBalancesInput,
  executor: DatabaseQueryExecutor
): Promise<AdvertiserWalletRecord | null> {
  const result =
    await executeDatabaseQuery<AdvertiserWalletDatabaseRow>(
      `
        UPDATE app.advertiser_wallets
        SET
          available_balance_minor_units = $2::bigint,
          reserved_balance_minor_units = $3::bigint,
          total_credited_minor_units = $4::bigint,
          total_spent_minor_units = $5::bigint,
          total_refunded_minor_units = $6::bigint
        WHERE id = $1::uuid
          AND row_version = $7::bigint
        RETURNING
          ${WALLET_COLUMNS}
      `,
      [
        input.walletId,
        input.availableBalanceMinorUnits.toString(),
        input.reservedBalanceMinorUnits.toString(),
        input.totalCreditedMinorUnits.toString(),
        input.totalSpentMinorUnits.toString(),
        input.totalRefundedMinorUnits.toString(),
        input.expectedRowVersion,
      ],
      executor
    );

  return mapOptionalWalletRow(result.rows[0]);
}

export async function findAdvertiserWalletLedgerEntryByIdempotencyKey(
  input: {
    organizationId: string;
    idempotencyKey: string;
  },
  executor?: DatabaseQueryExecutor
): Promise<AdvertiserWalletLedgerEntryRecord | null> {
  const result =
    await executeDatabaseQuery<AdvertiserWalletLedgerDatabaseRow>(
      `
        SELECT
          ${LEDGER_COLUMNS}
        FROM app.advertiser_wallet_ledger_entries
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

  return mapOptionalLedgerRow(result.rows[0]);
}

export async function createAdvertiserWalletLedgerEntry(
  input: CreateAdvertiserWalletLedgerEntryInput,
  executor: DatabaseQueryExecutor
): Promise<AdvertiserWalletLedgerEntryRecord> {
  const result =
    await executeDatabaseQuery<AdvertiserWalletLedgerDatabaseRow>(
      `
        INSERT INTO app.advertiser_wallet_ledger_entries (
          organization_id,
          wallet_id,
          funding_order_id,
          campaign_id,
          allocation_id,
          invoice_id,
          payment_id,
          refund_id,
          entry_type,
          direction,
          status,
          amount_minor_units,
          currency_code,
          balance_before_minor_units,
          balance_after_minor_units,
          idempotency_key,
          provider_reference,
          metadata,
          created_by_user_id
        )
        VALUES (
          $1::uuid,
          $2::uuid,
          $3::uuid,
          $4::uuid,
          $5::uuid,
          $6::uuid,
          $7::uuid,
          $8::uuid,
          $9,
          $10,
          'posted',
          $11::bigint,
          $12,
          $13::bigint,
          $14::bigint,
          $15,
          $16,
          $17::jsonb,
          $18::uuid
        )
        ON CONFLICT (
          organization_id,
          idempotency_key
        )
        DO NOTHING
        RETURNING
          ${LEDGER_COLUMNS}
      `,
      [
        input.organizationId,
        input.walletId,
        input.fundingOrderId ?? null,
        input.campaignId ?? null,
        input.allocationId ?? null,
        input.invoiceId ?? null,
        input.paymentId ?? null,
        input.refundId ?? null,
        input.entryType,
        input.direction,
        input.amountMinorUnits.toString(),
        input.currency,
        input.balanceBeforeMinorUnits.toString(),
        input.balanceAfterMinorUnits.toString(),
        input.idempotencyKey,
        input.providerReference ?? null,
        JSON.stringify(input.metadata ?? {}),
        input.actorUserId,
      ],
      executor
    );

  const created = mapOptionalLedgerRow(result.rows[0]);

  if (created) {
    return created;
  }

  const existing =
    await findAdvertiserWalletLedgerEntryByIdempotencyKey(
      {
        organizationId: input.organizationId,
        idempotencyKey: input.idempotencyKey,
      },
      executor
    );

  if (!existing) {
    throw new Error("Advertiser Wallet ledger entry could not be created or retrieved.");
  }

  return existing;
}