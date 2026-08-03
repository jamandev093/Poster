import type {
  DatabaseQueryExecutor,
} from "../../database/database.pool.js";

import {
  getDatabasePool,
} from "../../database/database.pool.js";

import type {
  ClientWalletReadCampaignAllocation,
  ClientWalletReadFundingOrder,
  ClientWalletReadInvoice,
  ClientWalletReadLedgerEntry,
  ClientWalletReadMoney,
  ClientWalletReadPayment,
  ClientWalletReadRefund,
  ClientWalletReadRequest,
  ClientWalletReadWallet,
} from "./client-wallet-read.service.js";

type NullableDate =
  Date | string | null;

interface WalletRow {
  id: string;
  organization_id: string;
  currency_code: string;
  status: string;
  available_balance_minor_units: string;
  reserved_balance_minor_units: string;
  total_credited_minor_units: string;
  total_spent_minor_units: string;
  total_refunded_minor_units: string;
  created_at: Date | string;
  updated_at: Date | string;
  row_version: string;
}

interface FundingOrderRow {
  id: string;
  organization_id: string;
  wallet_id: string;
  requested_by_user_id: string;
  provider: string;
  provider_order_id: string | null;
  provider_receipt: string | null;
  amount_minor_units: string;
  currency_code: string;
  status: string;
  idempotency_key: string;
  expires_at: NullableDate;
  credited_at: NullableDate;
  created_at: Date | string;
  updated_at: Date | string;
  row_version: string;
}

interface LedgerEntryRow {
  id: string;
  organization_id: string;
  wallet_id: string;
  funding_order_id: string | null;
  campaign_id: string | null;
  allocation_id: string | null;
  invoice_id: string | null;
  payment_id: string | null;
  refund_id: string | null;
  entry_type: string;
  direction: string;
  status: string;
  amount_minor_units: string;
  currency_code: string;
  balance_before_minor_units: string;
  balance_after_minor_units: string;
  idempotency_key: string;
  provider_reference: string | null;
  metadata: unknown;
  created_by_user_id: string;
  created_at: Date | string;
  row_version: string;
}

interface PaymentRow {
  id: string;
  organization_id: string;
  wallet_id: string | null;
  funding_order_id: string | null;
  invoice_id: string | null;
  campaign_id: string | null;
  provider: string;
  provider_order_id: string | null;
  provider_payment_id: string | null;
  status: string;
  amount_minor_units: string;
  captured_minor_units: string;
  refunded_minor_units: string;
  currency_code: string;
  paid_at: NullableDate;
  failed_at: NullableDate;
  created_at: Date | string;
  updated_at: Date | string;
  row_version: string;
}

interface InvoiceRow {
  id: string;
  organization_id: string;
  campaign_id: string | null;
  invoice_number: string;
  status: string;
  subtotal_minor_units: string;
  tax_minor_units: string;
  total_minor_units: string;
  paid_minor_units: string;
  refunded_minor_units: string;
  currency_code: string;
  issued_at: NullableDate;
  due_at: NullableDate;
  paid_at: NullableDate;
  cancelled_at: NullableDate;
  created_at: Date | string;
  updated_at: Date | string;
  row_version: string;
}

interface RefundRow {
  id: string;
  organization_id: string;
  payment_id: string;
  invoice_id: string | null;
  campaign_id: string | null;
  provider: string;
  provider_refund_id: string | null;
  reason: string;
  status: string;
  requested_amount_minor_units: string;
  approved_amount_minor_units: string | null;
  refunded_amount_minor_units: string;
  currency_code: string;
  requested_at: Date | string;
  approved_at: NullableDate;
  refunded_at: NullableDate;
  failed_at: NullableDate;
  cancelled_at: NullableDate;
  created_at: Date | string;
  updated_at: Date | string;
  row_version: string;
}

interface CampaignAllocationRow {
  id: string;
  organization_id: string;
  wallet_id: string;
  campaign_id: string;
  currency_code: string;
  status: string;
  allocated_minor_units: string;
  reserved_minor_units: string;
  spent_minor_units: string;
  released_minor_units: string;
  refunded_minor_units: string;
  created_by_user_id: string;
  created_at: Date | string;
  updated_at: Date | string;
  row_version: string;
}

function resolveExecutor(
  executor?: DatabaseQueryExecutor
): DatabaseQueryExecutor {
  return executor ?? getDatabasePool();
}

function normalizeCurrency(
  value: string
): "INR" {
  if (value !== "INR") {
    throw new Error(
      `Unsupported Client Wallet read currency: ${value}`
    );
  }

  return "INR";
}

function money(
  minorUnits: string,
  currencyCode: string
): ClientWalletReadMoney {
  return {
    minorUnits:
      minorUnits.toString(),

    currency:
      normalizeCurrency(
        currencyCode
      ),
  };
}

function isoDate(
  value: Date | string
): string {
  if (value instanceof Date) {
    return value.toISOString();
  }

  return new Date(value).toISOString();
}

function nullableIsoDate(
  value: NullableDate
): string | null {
  if (value === null) {
    return null;
  }

  return isoDate(
    value
  );
}

function recordOrEmpty(
  value: unknown
): Record<string, unknown> {
  if (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  ) {
    return value as Record<string, unknown>;
  }

  return {};
}

function mapWalletRow(
  row: WalletRow
): ClientWalletReadWallet {
  return {
    id:
      row.id,

    organizationId:
      row.organization_id,

    currency:
      normalizeCurrency(
        row.currency_code
      ),

    status:
      row.status,

    availableBalance:
      money(
        row.available_balance_minor_units,
        row.currency_code
      ),

    reservedBalance:
      money(
        row.reserved_balance_minor_units,
        row.currency_code
      ),

    totalCredited:
      money(
        row.total_credited_minor_units,
        row.currency_code
      ),

    totalSpent:
      money(
        row.total_spent_minor_units,
        row.currency_code
      ),

    totalRefunded:
      money(
        row.total_refunded_minor_units,
        row.currency_code
      ),

    createdAt:
      isoDate(
        row.created_at
      ),

    updatedAt:
      isoDate(
        row.updated_at
      ),

    rowVersion:
      row.row_version,
  };
}

function mapFundingOrderRow(
  row: FundingOrderRow
): ClientWalletReadFundingOrder {
  return {
    id:
      row.id,

    organizationId:
      row.organization_id,

    walletId:
      row.wallet_id,

    requestedByUserId:
      row.requested_by_user_id,

    provider:
      row.provider,

    providerOrderId:
      row.provider_order_id,

    providerReceipt:
      row.provider_receipt,

    amount:
      money(
        row.amount_minor_units,
        row.currency_code
      ),

    status:
      row.status,

    idempotencyKey:
      row.idempotency_key,

    expiresAt:
      nullableIsoDate(
        row.expires_at
      ),

    creditedAt:
      nullableIsoDate(
        row.credited_at
      ),

    createdAt:
      isoDate(
        row.created_at
      ),

    updatedAt:
      isoDate(
        row.updated_at
      ),

    rowVersion:
      row.row_version,
  };
}

function mapLedgerEntryRow(
  row: LedgerEntryRow
): ClientWalletReadLedgerEntry {
  return {
    id:
      row.id,

    organizationId:
      row.organization_id,

    walletId:
      row.wallet_id,

    fundingOrderId:
      row.funding_order_id,

    campaignId:
      row.campaign_id,

    allocationId:
      row.allocation_id,

    invoiceId:
      row.invoice_id,

    paymentId:
      row.payment_id,

    refundId:
      row.refund_id,

    entryType:
      row.entry_type,

    direction:
      row.direction,

    status:
      row.status,

    amount:
      money(
        row.amount_minor_units,
        row.currency_code
      ),

    balanceBefore:
      money(
        row.balance_before_minor_units,
        row.currency_code
      ),

    balanceAfter:
      money(
        row.balance_after_minor_units,
        row.currency_code
      ),

    idempotencyKey:
      row.idempotency_key,

    providerReference:
      row.provider_reference,

    metadata:
      recordOrEmpty(
        row.metadata
      ),

    createdByUserId:
      row.created_by_user_id,

    createdAt:
      isoDate(
        row.created_at
      ),

    rowVersion:
      row.row_version,
  };
}

function mapPaymentRow(
  row: PaymentRow
): ClientWalletReadPayment {
  return {
    id:
      row.id,

    organizationId:
      row.organization_id,

    walletId:
      row.wallet_id,

    fundingOrderId:
      row.funding_order_id,

    invoiceId:
      row.invoice_id,

    campaignId:
      row.campaign_id,

    provider:
      row.provider,

    providerOrderId:
      row.provider_order_id,

    providerPaymentId:
      row.provider_payment_id,

    status:
      row.status,

    amount:
      money(
        row.amount_minor_units,
        row.currency_code
      ),

    captured:
      money(
        row.captured_minor_units,
        row.currency_code
      ),

    refunded:
      money(
        row.refunded_minor_units,
        row.currency_code
      ),

    paidAt:
      nullableIsoDate(
        row.paid_at
      ),

    failedAt:
      nullableIsoDate(
        row.failed_at
      ),

    createdAt:
      isoDate(
        row.created_at
      ),

    updatedAt:
      isoDate(
        row.updated_at
      ),

    rowVersion:
      row.row_version,
  };
}

function mapInvoiceRow(
  row: InvoiceRow
): ClientWalletReadInvoice {
  return {
    id:
      row.id,

    organizationId:
      row.organization_id,

    campaignId:
      row.campaign_id,

    invoiceNumber:
      row.invoice_number,

    status:
      row.status,

    subtotal:
      money(
        row.subtotal_minor_units,
        row.currency_code
      ),

    tax:
      money(
        row.tax_minor_units,
        row.currency_code
      ),

    total:
      money(
        row.total_minor_units,
        row.currency_code
      ),

    paid:
      money(
        row.paid_minor_units,
        row.currency_code
      ),

    refunded:
      money(
        row.refunded_minor_units,
        row.currency_code
      ),

    issuedAt:
      nullableIsoDate(
        row.issued_at
      ),

    dueAt:
      nullableIsoDate(
        row.due_at
      ),

    paidAt:
      nullableIsoDate(
        row.paid_at
      ),

    cancelledAt:
      nullableIsoDate(
        row.cancelled_at
      ),

    createdAt:
      isoDate(
        row.created_at
      ),

    updatedAt:
      isoDate(
        row.updated_at
      ),

    rowVersion:
      row.row_version,
  };
}

function mapRefundRow(
  row: RefundRow
): ClientWalletReadRefund {
  return {
    id:
      row.id,

    organizationId:
      row.organization_id,

    paymentId:
      row.payment_id,

    invoiceId:
      row.invoice_id,

    campaignId:
      row.campaign_id,

    provider:
      row.provider,

    providerRefundId:
      row.provider_refund_id,

    reason:
      row.reason,

    status:
      row.status,

    requestedAmount:
      money(
        row.requested_amount_minor_units,
        row.currency_code
      ),

    approvedAmount:
      row.approved_amount_minor_units === null
        ? null
        : money(
            row.approved_amount_minor_units,
            row.currency_code
          ),

    refundedAmount:
      money(
        row.refunded_amount_minor_units,
        row.currency_code
      ),

    requestedAt:
      isoDate(
        row.requested_at
      ),

    approvedAt:
      nullableIsoDate(
        row.approved_at
      ),

    refundedAt:
      nullableIsoDate(
        row.refunded_at
      ),

    failedAt:
      nullableIsoDate(
        row.failed_at
      ),

    cancelledAt:
      nullableIsoDate(
        row.cancelled_at
      ),

    createdAt:
      isoDate(
        row.created_at
      ),

    updatedAt:
      isoDate(
        row.updated_at
      ),

    rowVersion:
      row.row_version,
  };
}

function mapCampaignAllocationRow(
  row: CampaignAllocationRow
): ClientWalletReadCampaignAllocation {
  return {
    id:
      row.id,

    organizationId:
      row.organization_id,

    walletId:
      row.wallet_id,

    campaignId:
      row.campaign_id,

    currency:
      normalizeCurrency(
        row.currency_code
      ),

    status:
      row.status,

    allocated:
      money(
        row.allocated_minor_units,
        row.currency_code
      ),

    reserved:
      money(
        row.reserved_minor_units,
        row.currency_code
      ),

    spent:
      money(
        row.spent_minor_units,
        row.currency_code
      ),

    released:
      money(
        row.released_minor_units,
        row.currency_code
      ),

    refunded:
      money(
        row.refunded_minor_units,
        row.currency_code
      ),

    createdByUserId:
      row.created_by_user_id,

    createdAt:
      isoDate(
        row.created_at
      ),

    updatedAt:
      isoDate(
        row.updated_at
      ),

    rowVersion:
      row.row_version,
  };
}

export async function findClientWalletByOrganizationId(
  input: ClientWalletReadRequest,
  executor?: DatabaseQueryExecutor
): Promise<ClientWalletReadWallet | null> {
  const result =
    await resolveExecutor(
      executor
    ).query<WalletRow>(
      `
        SELECT
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
        FROM app.advertiser_wallets
        WHERE organization_id = $1
        LIMIT 1
      `,
      [
        input.organizationId,
      ]
    );

  const row =
    result.rows[0];

  return row
    ? mapWalletRow(
        row
      )
    : null;
}

export async function listClientWalletFundingOrders(
  input: ClientWalletReadRequest,
  executor?: DatabaseQueryExecutor
): Promise<ClientWalletReadFundingOrder[]> {
  const result =
    await resolveExecutor(
      executor
    ).query<FundingOrderRow>(
      `
        SELECT
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
          expires_at,
          credited_at,
          created_at,
          updated_at,
          row_version::text AS row_version
        FROM app.wallet_funding_orders
        WHERE organization_id = $1
        ORDER BY created_at DESC, id DESC
        LIMIT $2::integer
      `,
      [
        input.organizationId,
        input.limit,
      ]
    );

  return result.rows.map(
    mapFundingOrderRow
  );
}

export async function listClientWalletLedgerEntries(
  input: ClientWalletReadRequest,
  executor?: DatabaseQueryExecutor
): Promise<ClientWalletReadLedgerEntry[]> {
  const result =
    await resolveExecutor(
      executor
    ).query<LedgerEntryRow>(
      `
        SELECT
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
        FROM app.advertiser_wallet_ledger_entries
        WHERE organization_id = $1
        ORDER BY created_at DESC, id DESC
        LIMIT $2::integer
      `,
      [
        input.organizationId,
        input.limit,
      ]
    );

  return result.rows.map(
    mapLedgerEntryRow
  );
}

export async function listClientWalletPayments(
  input: ClientWalletReadRequest,
  executor?: DatabaseQueryExecutor
): Promise<ClientWalletReadPayment[]> {
  const result =
    await resolveExecutor(
      executor
    ).query<PaymentRow>(
      `
        SELECT
          id,
          organization_id,
          wallet_id,
          funding_order_id,
          invoice_id,
          campaign_id,
          provider,
          provider_order_id,
          provider_payment_id,
          status,
          amount_minor_units::text AS amount_minor_units,
          captured_minor_units::text AS captured_minor_units,
          refunded_minor_units::text AS refunded_minor_units,
          currency_code,
          paid_at,
          failed_at,
          created_at,
          updated_at,
          row_version::text AS row_version
        FROM app.advertiser_payments
        WHERE organization_id = $1
        ORDER BY created_at DESC, id DESC
        LIMIT $2::integer
      `,
      [
        input.organizationId,
        input.limit,
      ]
    );

  return result.rows.map(
    mapPaymentRow
  );
}

export async function listClientWalletInvoices(
  input: ClientWalletReadRequest,
  executor?: DatabaseQueryExecutor
): Promise<ClientWalletReadInvoice[]> {
  const result =
    await resolveExecutor(
      executor
    ).query<InvoiceRow>(
      `
        SELECT
          id,
          organization_id,
          campaign_id,
          invoice_number,
          status,
          subtotal_minor_units::text AS subtotal_minor_units,
          tax_minor_units::text AS tax_minor_units,
          total_minor_units::text AS total_minor_units,
          paid_minor_units::text AS paid_minor_units,
          refunded_minor_units::text AS refunded_minor_units,
          currency_code,
          issued_at,
          due_at,
          paid_at,
          cancelled_at,
          created_at,
          updated_at,
          row_version::text AS row_version
        FROM app.advertiser_invoices
        WHERE organization_id = $1
        ORDER BY created_at DESC, id DESC
        LIMIT $2::integer
      `,
      [
        input.organizationId,
        input.limit,
      ]
    );

  return result.rows.map(
    mapInvoiceRow
  );
}

export async function listClientWalletRefunds(
  input: ClientWalletReadRequest,
  executor?: DatabaseQueryExecutor
): Promise<ClientWalletReadRefund[]> {
  const result =
    await resolveExecutor(
      executor
    ).query<RefundRow>(
      `
        SELECT
          id,
          organization_id,
          payment_id,
          invoice_id,
          campaign_id,
          provider,
          provider_refund_id,
          reason,
          status,
          requested_amount_minor_units::text AS requested_amount_minor_units,
          approved_amount_minor_units::text AS approved_amount_minor_units,
          refunded_amount_minor_units::text AS refunded_amount_minor_units,
          currency_code,
          requested_at,
          approved_at,
          refunded_at,
          failed_at,
          cancelled_at,
          created_at,
          updated_at,
          row_version::text AS row_version
        FROM app.advertiser_refunds
        WHERE organization_id = $1
        ORDER BY created_at DESC, id DESC
        LIMIT $2::integer
      `,
      [
        input.organizationId,
        input.limit,
      ]
    );

  return result.rows.map(
    mapRefundRow
  );
}

export async function listClientWalletCampaignAllocations(
  input: ClientWalletReadRequest,
  executor?: DatabaseQueryExecutor
): Promise<ClientWalletReadCampaignAllocation[]> {
  const result =
    await resolveExecutor(
      executor
    ).query<CampaignAllocationRow>(
      `
        SELECT
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
        FROM app.campaign_wallet_allocations
        WHERE organization_id = $1
        ORDER BY created_at DESC, id DESC
        LIMIT $2::integer
      `,
      [
        input.organizationId,
        input.limit,
      ]
    );

  return result.rows.map(
    mapCampaignAllocationRow
  );
}