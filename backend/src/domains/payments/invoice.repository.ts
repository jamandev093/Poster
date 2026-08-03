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
  AdvertiserInvoiceRecord,
  CreateAdvertiserInvoiceInput,
  InvoiceStatus,
} from "./invoice.types.js";

interface AdvertiserInvoiceDatabaseRow
  extends QueryResultRow {
  id: string;
  organization_id: string;
  campaign_id: string | null;
  invoice_number: string;
  status: InvoiceStatus;
  currency_code: PaymentCurrencyCode;
  subtotal_minor_units: string;
  tax_minor_units: string;
  total_minor_units: string;
  paid_minor_units: string;
  refunded_minor_units: string;
  issued_at: Date | null;
  due_at: Date | null;
  paid_at: Date | null;
  cancelled_at: Date | null;
  document_url: string | null;
  metadata: Record<string, unknown>;
  created_at: Date;
  updated_at: Date;
  row_version: string;
}

const INVOICE_COLUMNS = `
  id,
  organization_id,
  campaign_id,
  invoice_number,
  status,
  currency_code,
  subtotal_minor_units::text AS subtotal_minor_units,
  tax_minor_units::text AS tax_minor_units,
  total_minor_units::text AS total_minor_units,
  paid_minor_units::text AS paid_minor_units,
  refunded_minor_units::text AS refunded_minor_units,
  issued_at,
  due_at,
  paid_at,
  cancelled_at,
  document_url,
  metadata,
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

function mapInvoiceRow(
  row: AdvertiserInvoiceDatabaseRow
): AdvertiserInvoiceRecord {
  return {
    id: row.id,
    organizationId: row.organization_id,
    campaignId: row.campaign_id,
    invoiceNumber: row.invoice_number,
    status: row.status,
    subtotal: money(row.subtotal_minor_units, row.currency_code),
    tax: money(row.tax_minor_units, row.currency_code),
    total: money(row.total_minor_units, row.currency_code),
    paid: money(row.paid_minor_units, row.currency_code),
    refunded: money(row.refunded_minor_units, row.currency_code),
    issuedAt: row.issued_at,
    dueAt: row.due_at,
    paidAt: row.paid_at,
    cancelledAt: row.cancelled_at,
    documentUrl: row.document_url,
    metadata: row.metadata,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    rowVersion: row.row_version,
  };
}

function mapOptionalInvoiceRow(
  row: AdvertiserInvoiceDatabaseRow | undefined
): AdvertiserInvoiceRecord | null {
  return row
    ? mapInvoiceRow(row)
    : null;
}

export async function findAdvertiserInvoiceById(
  invoiceId: string,
  executor?: DatabaseQueryExecutor
): Promise<AdvertiserInvoiceRecord | null> {
  const result =
    await executeDatabaseQuery<AdvertiserInvoiceDatabaseRow>(
      `
        SELECT
          ${INVOICE_COLUMNS}
        FROM app.advertiser_invoices
        WHERE id = $1::uuid
        LIMIT 1
      `,
      [invoiceId],
      executor
    );

  return mapOptionalInvoiceRow(result.rows[0]);
}

export async function findAdvertiserInvoiceByNumber(
  invoiceNumber: string,
  executor?: DatabaseQueryExecutor
): Promise<AdvertiserInvoiceRecord | null> {
  const result =
    await executeDatabaseQuery<AdvertiserInvoiceDatabaseRow>(
      `
        SELECT
          ${INVOICE_COLUMNS}
        FROM app.advertiser_invoices
        WHERE invoice_number = $1
        LIMIT 1
      `,
      [invoiceNumber],
      executor
    );

  return mapOptionalInvoiceRow(result.rows[0]);
}

export async function createAdvertiserInvoice(
  input: CreateAdvertiserInvoiceInput,
  executor: DatabaseQueryExecutor
): Promise<AdvertiserInvoiceRecord> {
  const totalMinorUnits =
    input.subtotalMinorUnits +
    input.taxMinorUnits;

  const status =
    input.issuedAt
      ? "issued"
      : "draft";

  const result =
    await executeDatabaseQuery<AdvertiserInvoiceDatabaseRow>(
      `
        INSERT INTO app.advertiser_invoices (
          organization_id,
          campaign_id,
          invoice_number,
          status,
          currency_code,
          subtotal_minor_units,
          tax_minor_units,
          total_minor_units,
          issued_at,
          due_at,
          document_url,
          metadata
        )
        VALUES (
          $1::uuid,
          $2::uuid,
          $3,
          $4,
          $5,
          $6::bigint,
          $7::bigint,
          $8::bigint,
          $9::timestamptz,
          $10::timestamptz,
          $11,
          $12::jsonb
        )
        RETURNING
          ${INVOICE_COLUMNS}
      `,
      [
        input.organizationId,
        input.campaignId ?? null,
        input.invoiceNumber,
        status,
        input.currency,
        input.subtotalMinorUnits.toString(),
        input.taxMinorUnits.toString(),
        totalMinorUnits.toString(),
        input.issuedAt ?? null,
        input.dueAt ?? null,
        input.documentUrl ?? null,
        JSON.stringify(input.metadata ?? {}),
      ],
      executor
    );

  const created =
    mapOptionalInvoiceRow(result.rows[0]);

  if (!created) {
    throw new Error(
      "Advertiser invoice could not be created."
    );
  }

  return created;
}