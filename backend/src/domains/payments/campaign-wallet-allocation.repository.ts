import type {
  QueryResultRow,
} from "pg";

import {
  executeDatabaseQuery,
  type DatabaseQueryExecutor,
} from "../../database/database.pool.js";

import type {
  PaymentCurrencyCode,
} from "./payment.types.js";

import type {
  CampaignWalletAllocationRecord,
  CampaignWalletAllocationStatus,
  CreateCampaignWalletAllocationInput,
  UpdateCampaignWalletAllocationAmountsInput,
} from "./campaign-wallet-allocation.types.js";

interface CampaignWalletAllocationDatabaseRow
  extends QueryResultRow {
  id: string;
  organization_id: string;
  wallet_id: string;
  campaign_id: string;
  currency_code: PaymentCurrencyCode;
  status: CampaignWalletAllocationStatus;
  allocated_minor_units: string;
  reserved_minor_units: string;
  spent_minor_units: string;
  released_minor_units: string;
  refunded_minor_units: string;
  created_by_user_id: string;
  created_at: Date;
  updated_at: Date;
  row_version: string;
}

const ALLOCATION_COLUMNS = `
  id,
  organization_id,
  wallet_id,
  campaign_id,
  currency_code,
  status,
  allocated_minor_units::text AS allocated_minor_units,
  reserved_minor_units::text AS reserved_minor_units,
  spent_minor_units::text AS spent_minor_units,
  released_minor_units::text AS released_minor_units,
  refunded_minor_units::text AS refunded_minor_units,
  created_by_user_id,
  created_at,
  updated_at,
  row_version::text AS row_version
`;

function money(
  minorUnits: string,
  currency: PaymentCurrencyCode
) {
  return {
    minorUnits:
      BigInt(minorUnits),

    currency,
  };
}

function mapAllocationRow(
  row: CampaignWalletAllocationDatabaseRow
): CampaignWalletAllocationRecord {
  return {
    id: row.id,
    organizationId: row.organization_id,
    walletId: row.wallet_id,
    campaignId: row.campaign_id,
    currency: row.currency_code,
    status: row.status,
    allocated: money(row.allocated_minor_units, row.currency_code),
    reserved: money(row.reserved_minor_units, row.currency_code),
    spent: money(row.spent_minor_units, row.currency_code),
    released: money(row.released_minor_units, row.currency_code),
    refunded: money(row.refunded_minor_units, row.currency_code),
    createdByUserId: row.created_by_user_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    rowVersion: row.row_version,
  };
}

function mapOptionalAllocationRow(
  row: CampaignWalletAllocationDatabaseRow | undefined
): CampaignWalletAllocationRecord | null {
  return row
    ? mapAllocationRow(row)
    : null;
}

export async function findCampaignWalletAllocationById(
  allocationId: string,
  executor?: DatabaseQueryExecutor
): Promise<CampaignWalletAllocationRecord | null> {
  const result =
    await executeDatabaseQuery<CampaignWalletAllocationDatabaseRow>(
      `
        SELECT
          ${ALLOCATION_COLUMNS}
        FROM app.campaign_wallet_allocations
        WHERE id = $1::uuid
        LIMIT 1
      `,
      [allocationId],
      executor
    );

  return mapOptionalAllocationRow(result.rows[0]);
}

export async function findCampaignWalletAllocationByCampaignId(
  campaignId: string,
  executor?: DatabaseQueryExecutor
): Promise<CampaignWalletAllocationRecord | null> {
  const result =
    await executeDatabaseQuery<CampaignWalletAllocationDatabaseRow>(
      `
        SELECT
          ${ALLOCATION_COLUMNS}
        FROM app.campaign_wallet_allocations
        WHERE campaign_id = $1::uuid
        LIMIT 1
      `,
      [campaignId],
      executor
    );

  return mapOptionalAllocationRow(result.rows[0]);
}

export async function createCampaignWalletAllocation(
  input: CreateCampaignWalletAllocationInput,
  executor: DatabaseQueryExecutor
): Promise<CampaignWalletAllocationRecord> {
  const result =
    await executeDatabaseQuery<CampaignWalletAllocationDatabaseRow>(
      `
        INSERT INTO app.campaign_wallet_allocations (
          organization_id,
          wallet_id,
          campaign_id,
          currency_code,
          status,
          allocated_minor_units,
          created_by_user_id
        )
        VALUES (
          $1::uuid,
          $2::uuid,
          $3::uuid,
          $4,
          'active',
          $5::bigint,
          $6::uuid
        )
        ON CONFLICT (
          campaign_id
        )
        DO NOTHING
        RETURNING
          ${ALLOCATION_COLUMNS}
      `,
      [
        input.organizationId,
        input.walletId,
        input.campaignId,
        input.currency,
        input.allocatedMinorUnits.toString(),
        input.createdByUserId,
      ],
      executor
    );

  const created =
    mapOptionalAllocationRow(result.rows[0]);

  if (created) {
    return created;
  }

  const existing =
    await findCampaignWalletAllocationByCampaignId(
      input.campaignId,
      executor
    );

  if (!existing) {
    throw new Error(
      "Campaign Wallet allocation could not be created or retrieved."
    );
  }

  return existing;
}

export async function updateCampaignWalletAllocationAmounts(
  input: UpdateCampaignWalletAllocationAmountsInput,
  executor: DatabaseQueryExecutor
): Promise<CampaignWalletAllocationRecord | null> {
  const result =
    await executeDatabaseQuery<CampaignWalletAllocationDatabaseRow>(
      `
        UPDATE app.campaign_wallet_allocations
        SET
          status = $2,
          reserved_minor_units = $3::bigint,
          spent_minor_units = $4::bigint,
          released_minor_units = $5::bigint,
          refunded_minor_units = $6::bigint
        WHERE id = $1::uuid
          AND row_version = $7::bigint
        RETURNING
          ${ALLOCATION_COLUMNS}
      `,
      [
        input.allocationId,
        input.status,
        input.reservedMinorUnits.toString(),
        input.spentMinorUnits.toString(),
        input.releasedMinorUnits.toString(),
        input.refundedMinorUnits.toString(),
        input.expectedRowVersion,
      ],
      executor
    );

  return mapOptionalAllocationRow(result.rows[0]);
}