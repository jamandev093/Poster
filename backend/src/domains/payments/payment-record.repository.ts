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
  AdvertiserPaymentRecord,
  CreateAdvertiserPaymentInput,
  PaymentRecordStatus,
} from "./payment-record.types.js";

interface AdvertiserPaymentDatabaseRow
  extends QueryResultRow {
  id: string;
  organization_id: string;
  wallet_id: string | null;
  funding_order_id: string | null;
  invoice_id: string | null;
  campaign_id: string | null;
  provider: PaymentProvider;
  provider_order_id: string | null;
  provider_payment_id: string | null;
  provider_signature_digest: string | null;
  status: PaymentRecordStatus;
  amount_minor_units: string;
  captured_minor_units: string;
  refunded_minor_units: string;
  currency_code: PaymentCurrencyCode;
  method_details: Record<string, unknown>;
  provider_payload: Record<string, unknown>;
  webhook_verified_at: Date | null;
  paid_at: Date | null;
  failed_at: Date | null;
  created_at: Date;
  updated_at: Date;
  row_version: string;
}

const PAYMENT_COLUMNS = `
  id,
  organization_id,
  wallet_id,
  funding_order_id,
  invoice_id,
  campaign_id,
  provider,
  provider_order_id,
  provider_payment_id,
  provider_signature_digest,
  status,
  amount_minor_units::text AS amount_minor_units,
  captured_minor_units::text AS captured_minor_units,
  refunded_minor_units::text AS refunded_minor_units,
  currency_code,
  method_details,
  provider_payload,
  webhook_verified_at,
  paid_at,
  failed_at,
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

function mapPaymentRow(
  row: AdvertiserPaymentDatabaseRow
): AdvertiserPaymentRecord {
  return {
    id: row.id,
    organizationId: row.organization_id,
    walletId: row.wallet_id,
    fundingOrderId: row.funding_order_id,
    invoiceId: row.invoice_id,
    campaignId: row.campaign_id,
    provider: row.provider,
    providerOrderId: row.provider_order_id,
    providerPaymentId: row.provider_payment_id,
    providerSignatureDigest: row.provider_signature_digest,
    status: row.status,
    amount: money(row.amount_minor_units, row.currency_code),
    captured: money(row.captured_minor_units, row.currency_code),
    refunded: money(row.refunded_minor_units, row.currency_code),
    methodDetails: row.method_details,
    providerPayload: row.provider_payload,
    webhookVerifiedAt: row.webhook_verified_at,
    paidAt: row.paid_at,
    failedAt: row.failed_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    rowVersion: row.row_version,
  };
}

function mapOptionalPaymentRow(
  row: AdvertiserPaymentDatabaseRow | undefined
): AdvertiserPaymentRecord | null {
  return row
    ? mapPaymentRow(row)
    : null;
}

export async function findAdvertiserPaymentById(
  paymentId: string,
  executor?: DatabaseQueryExecutor
): Promise<AdvertiserPaymentRecord | null> {
  const result =
    await executeDatabaseQuery<AdvertiserPaymentDatabaseRow>(
      `
        SELECT
          ${PAYMENT_COLUMNS}
        FROM app.advertiser_payments
        WHERE id = $1::uuid
        LIMIT 1
      `,
      [paymentId],
      executor
    );

  return mapOptionalPaymentRow(result.rows[0]);
}

export async function findAdvertiserPaymentByProviderPaymentId(
  providerPaymentId: string,
  executor?: DatabaseQueryExecutor
): Promise<AdvertiserPaymentRecord | null> {
  const result =
    await executeDatabaseQuery<AdvertiserPaymentDatabaseRow>(
      `
        SELECT
          ${PAYMENT_COLUMNS}
        FROM app.advertiser_payments
        WHERE provider_payment_id = $1
        LIMIT 1
      `,
      [providerPaymentId],
      executor
    );

  return mapOptionalPaymentRow(result.rows[0]);
}

export async function createAdvertiserPayment(
  input: CreateAdvertiserPaymentInput,
  executor: DatabaseQueryExecutor
): Promise<AdvertiserPaymentRecord> {
  const result =
    await executeDatabaseQuery<AdvertiserPaymentDatabaseRow>(
      `
        INSERT INTO app.advertiser_payments (
          organization_id,
          wallet_id,
          funding_order_id,
          invoice_id,
          campaign_id,
          provider,
          provider_order_id,
          provider_payment_id,
          provider_signature_digest,
          status,
          amount_minor_units,
          captured_minor_units,
          refunded_minor_units,
          currency_code,
          method_details,
          provider_payload,
          webhook_verified_at,
          paid_at,
          failed_at
        )
        VALUES (
          $1::uuid,
          $2::uuid,
          $3::uuid,
          $4::uuid,
          $5::uuid,
          $6,
          $7,
          $8,
          $9,
          $10,
          $11::bigint,
          $12::bigint,
          $13::bigint,
          $14,
          $15::jsonb,
          $16::jsonb,
          $17::timestamptz,
          $18::timestamptz,
          $19::timestamptz
        )
        RETURNING
          ${PAYMENT_COLUMNS}
      `,
      [
        input.organizationId,
        input.walletId ?? null,
        input.fundingOrderId ?? null,
        input.invoiceId ?? null,
        input.campaignId ?? null,
        input.provider,
        input.providerOrderId ?? null,
        input.providerPaymentId ?? null,
        input.providerSignatureDigest ?? null,
        input.status,
        input.amountMinorUnits.toString(),
        (input.capturedMinorUnits ?? 0n).toString(),
        (input.refundedMinorUnits ?? 0n).toString(),
        input.currency,
        JSON.stringify(input.methodDetails ?? {}),
        JSON.stringify(input.providerPayload ?? {}),
        input.webhookVerifiedAt ?? null,
        input.paidAt ?? null,
        input.failedAt ?? null,
      ],
      executor
    );

  const created =
    mapOptionalPaymentRow(result.rows[0]);

  if (!created) {
    throw new Error(
      "Advertiser payment could not be created."
    );
  }

  return created;
}