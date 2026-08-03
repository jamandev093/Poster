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
} from "./payment.types.js";

import type {
  AdvertiserRefundRecord,
  ApproveAdvertiserRefundInput,
  AttachProviderRefundReferenceInput,
  CreateAdvertiserRefundInput,
  RefundRecordStatus,
} from "./refund.types.js";

interface AdvertiserRefundDatabaseRow
  extends QueryResultRow {
  id: string;
  organization_id: string;
  payment_id: string;
  invoice_id: string | null;
  campaign_id: string | null;
  requested_by_user_id: string | null;
  approved_by_user_id: string | null;
  provider: PaymentProvider;
  provider_refund_id: string | null;
  reason: string;
  status: RefundRecordStatus;
  requested_amount_minor_units: string;
  approved_amount_minor_units: string | null;
  refunded_amount_minor_units: string;
  currency_code: PaymentCurrencyCode;
  provider_payload: Record<string, unknown>;
  requested_at: Date;
  approved_at: Date | null;
  refunded_at: Date | null;
  failed_at: Date | null;
  cancelled_at: Date | null;
  created_at: Date;
  updated_at: Date;
  row_version: string;
}

const REFUND_COLUMNS = `
  id,
  organization_id,
  payment_id,
  invoice_id,
  campaign_id,
  requested_by_user_id,
  approved_by_user_id,
  provider,
  provider_refund_id,
  reason,
  status,
  requested_amount_minor_units::text AS requested_amount_minor_units,
  approved_amount_minor_units::text AS approved_amount_minor_units,
  refunded_amount_minor_units::text AS refunded_amount_minor_units,
  currency_code,
  provider_payload,
  requested_at,
  approved_at,
  refunded_at,
  failed_at,
  cancelled_at,
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

function optionalMoney(
  minorUnits: string | null,
  currency: PaymentCurrencyCode
) {
  return minorUnits === null
    ? null
    : money(
        minorUnits,
        currency
      );
}

function mapRefundRow(
  row: AdvertiserRefundDatabaseRow
): AdvertiserRefundRecord {
  return {
    id: row.id,
    organizationId: row.organization_id,
    paymentId: row.payment_id,
    invoiceId: row.invoice_id,
    campaignId: row.campaign_id,
    requestedByUserId: row.requested_by_user_id,
    approvedByUserId: row.approved_by_user_id,
    provider: row.provider,
    providerRefundId: row.provider_refund_id,
    reason: row.reason,
    status: row.status,
    requestedAmount: money(
      row.requested_amount_minor_units,
      row.currency_code
    ),
    approvedAmount: optionalMoney(
      row.approved_amount_minor_units,
      row.currency_code
    ),
    refundedAmount: money(
      row.refunded_amount_minor_units,
      row.currency_code
    ),
    providerPayload: row.provider_payload,
    requestedAt: row.requested_at,
    approvedAt: row.approved_at,
    refundedAt: row.refunded_at,
    failedAt: row.failed_at,
    cancelledAt: row.cancelled_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    rowVersion: row.row_version,
  };
}

function mapOptionalRefundRow(
  row: AdvertiserRefundDatabaseRow | undefined
): AdvertiserRefundRecord | null {
  return row
    ? mapRefundRow(row)
    : null;
}

export async function findAdvertiserRefundById(
  refundId: string,
  executor?: DatabaseQueryExecutor
): Promise<AdvertiserRefundRecord | null> {
  const result =
    await executeDatabaseQuery<AdvertiserRefundDatabaseRow>(
      `
        SELECT
          ${REFUND_COLUMNS}
        FROM app.advertiser_refunds
        WHERE id = $1::uuid
        LIMIT 1
      `,
      [refundId],
      executor
    );

  return mapOptionalRefundRow(result.rows[0]);
}

export async function findAdvertiserRefundByProviderRefundId(
  providerRefundId: string,
  executor?: DatabaseQueryExecutor
): Promise<AdvertiserRefundRecord | null> {
  const result =
    await executeDatabaseQuery<AdvertiserRefundDatabaseRow>(
      `
        SELECT
          ${REFUND_COLUMNS}
        FROM app.advertiser_refunds
        WHERE provider_refund_id = $1
        LIMIT 1
      `,
      [providerRefundId],
      executor
    );

  return mapOptionalRefundRow(result.rows[0]);
}

export async function createAdvertiserRefund(
  input: CreateAdvertiserRefundInput,
  executor: DatabaseQueryExecutor
): Promise<AdvertiserRefundRecord> {
  const result =
    await executeDatabaseQuery<AdvertiserRefundDatabaseRow>(
      `
        INSERT INTO app.advertiser_refunds (
          organization_id,
          payment_id,
          invoice_id,
          campaign_id,
          requested_by_user_id,
          provider,
          reason,
          status,
          requested_amount_minor_units,
          currency_code,
          provider_payload
        )
        VALUES (
          $1::uuid,
          $2::uuid,
          $3::uuid,
          $4::uuid,
          $5::uuid,
          $6,
          $7,
          'requested',
          $8::bigint,
          $9,
          $10::jsonb
        )
        RETURNING
          ${REFUND_COLUMNS}
      `,
      [
        input.organizationId,
        input.paymentId,
        input.invoiceId ?? null,
        input.campaignId ?? null,
        input.requestedByUserId ?? null,
        input.provider,
        input.reason,
        input.requestedAmountMinorUnits.toString(),
        input.currency,
        JSON.stringify(input.providerPayload ?? {}),
      ],
      executor
    );

  const created =
    mapOptionalRefundRow(result.rows[0]);

  if (!created) {
    throw new Error(
      "Advertiser refund could not be created."
    );
  }

  return created;
}

export async function approveAdvertiserRefund(
  input: ApproveAdvertiserRefundInput,
  executor: DatabaseQueryExecutor
): Promise<AdvertiserRefundRecord | null> {
  const result =
    await executeDatabaseQuery<AdvertiserRefundDatabaseRow>(
      `
        UPDATE app.advertiser_refunds
        SET
          approved_by_user_id = $2::uuid,
          approved_amount_minor_units = $3::bigint,
          status = 'approved',
          approved_at = $4::timestamptz
        WHERE id = $1::uuid
          AND row_version = $5::bigint
        RETURNING
          ${REFUND_COLUMNS}
      `,
      [
        input.refundId,
        input.approvedByUserId,
        input.approvedAmountMinorUnits.toString(),
        input.approvedAt,
        input.expectedRowVersion,
      ],
      executor
    );

  return mapOptionalRefundRow(result.rows[0]);
}

export async function attachProviderRefundReference(
  input: AttachProviderRefundReferenceInput,
  executor: DatabaseQueryExecutor
): Promise<AdvertiserRefundRecord | null> {
  const result =
    await executeDatabaseQuery<AdvertiserRefundDatabaseRow>(
      `
        UPDATE app.advertiser_refunds
        SET
          provider_refund_id = $2,
          provider_payload = $3::jsonb,
          status = 'provider_pending'
        WHERE id = $1::uuid
          AND row_version = $4::bigint
        RETURNING
          ${REFUND_COLUMNS}
      `,
      [
        input.refundId,
        input.providerRefundId,
        JSON.stringify(input.providerPayload),
        input.expectedRowVersion,
      ],
      executor
    );

  return mapOptionalRefundRow(result.rows[0]);
}