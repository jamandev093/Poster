import type {
  QueryResultRow,
} from "pg";

import {
  executeDatabaseQuery,
  type DatabaseQueryExecutor,
} from "../../database/database.pool.js";

import type {
  AdminWalletFundingOrderRow,
  AdminWalletLedgerRow,
  AdminWalletOperationsRepositorySnapshot,
  AdminWalletOperationsSummary,
  AdminWalletPaymentRow,
  AdminWalletOrganizationRow,
} from "./admin-wallet-operations.types.js";

interface SummaryDatabaseRow extends QueryResultRow {
  organization_count:
    number;

  wallet_count:
    number;

  active_wallet_count:
    number;

  total_available_minor_units:
    string;

  total_reserved_minor_units:
    string;

  total_credited_minor_units:
    string;

  total_spent_minor_units:
    string;

  total_refunded_minor_units:
    string;

  pending_funding_order_count:
    number;

  failed_payment_count:
    number;

  open_refund_count:
    number;

  unreconciled_webhook_count:
    number;
}

interface OrganizationDatabaseRow extends QueryResultRow {
  organization_id:
    string;

  organization_name:
    string;

  wallet_id:
    string | null;

  wallet_status:
    string;

  available_minor_units:
    string;

  reserved_minor_units:
    string;

  credited_minor_units:
    string;

  spent_minor_units:
    string;

  refunded_minor_units:
    string;

  funding_order_count:
    number;

  payment_count:
    number;

  invoice_count:
    number;

  refund_count:
    number;

  allocation_count:
    number;

  last_payment_at:
    Date | null;

  updated_at:
    Date | null;
}

interface FundingOrderDatabaseRow extends QueryResultRow {
  id:
    string;

  organization_id:
    string;

  organization_name:
    string;

  provider:
    string;

  provider_order_id:
    string | null;

  amount_minor_units:
    string;

  status:
    string;

  expires_at:
    Date | null;

  credited_at:
    Date | null;

  created_at:
    Date;
}

interface PaymentDatabaseRow extends QueryResultRow {
  id:
    string;

  organization_id:
    string;

  organization_name:
    string;

  provider:
    string;

  provider_payment_id:
    string | null;

  captured_minor_units:
    string;

  refunded_minor_units:
    string;

  status:
    string;

  paid_at:
    Date | null;

  webhook_verified_at:
    Date | null;

  created_at:
    Date;
}

interface LedgerDatabaseRow extends QueryResultRow {
  id:
    string;

  organization_id:
    string;

  organization_name:
    string;

  entry_type:
    string;

  direction:
    string;

  status:
    string;

  amount_minor_units:
    string;

  balance_after_minor_units:
    string;

  provider_reference:
    string | null;

  created_at:
    Date;
}

interface ReadAdminWalletOperationsInput {
  limit?:
    number;

  executor?:
    DatabaseQueryExecutor;
}

const DEFAULT_LIMIT =
  25;

function normalizeLimit(
  value:
    number | undefined
): number {
  if (
    value === undefined
  ) {
    return DEFAULT_LIMIT;
  }

  if (
    !Number.isSafeInteger(value) ||
    value < 1
  ) {
    return DEFAULT_LIMIT;
  }

  return Math.min(
    value,
    100
  );
}

function inrMoney(
  minorUnits:
    string
) {
  return {
    minorUnits,
    currency:
      "INR" as const,
  };
}

function dateToIso(
  value:
    Date | null
): string | null {
  return value
    ? value.toISOString()
    : null;
}

function mapSummaryRow(
  row:
    SummaryDatabaseRow | undefined
): AdminWalletOperationsSummary {
  return {
    organizationCount:
      row?.organization_count ?? 0,

    walletCount:
      row?.wallet_count ?? 0,

    activeWalletCount:
      row?.active_wallet_count ?? 0,

    totalAvailable:
      inrMoney(
        row?.total_available_minor_units ?? "0"
      ),

    totalReserved:
      inrMoney(
        row?.total_reserved_minor_units ?? "0"
      ),

    totalCredited:
      inrMoney(
        row?.total_credited_minor_units ?? "0"
      ),

    totalSpent:
      inrMoney(
        row?.total_spent_minor_units ?? "0"
      ),

    totalRefunded:
      inrMoney(
        row?.total_refunded_minor_units ?? "0"
      ),

    pendingFundingOrderCount:
      row?.pending_funding_order_count ?? 0,

    failedPaymentCount:
      row?.failed_payment_count ?? 0,

    openRefundCount:
      row?.open_refund_count ?? 0,

    unreconciledWebhookCount:
      row?.unreconciled_webhook_count ?? 0,
  };
}

function mapOrganizationRow(
  row:
    OrganizationDatabaseRow
): AdminWalletOrganizationRow {
  return {
    organizationId:
      row.organization_id,

    organizationName:
      row.organization_name,

    walletId:
      row.wallet_id,

    walletStatus:
      row.wallet_status,

    available:
      inrMoney(
        row.available_minor_units
      ),

    reserved:
      inrMoney(
        row.reserved_minor_units
      ),

    credited:
      inrMoney(
        row.credited_minor_units
      ),

    spent:
      inrMoney(
        row.spent_minor_units
      ),

    refunded:
      inrMoney(
        row.refunded_minor_units
      ),

    fundingOrderCount:
      row.funding_order_count,

    paymentCount:
      row.payment_count,

    invoiceCount:
      row.invoice_count,

    refundCount:
      row.refund_count,

    allocationCount:
      row.allocation_count,

    lastPaymentAt:
      dateToIso(
        row.last_payment_at
      ),

    updatedAt:
      dateToIso(
        row.updated_at
      ),
  };
}

function mapFundingOrderRow(
  row:
    FundingOrderDatabaseRow
): AdminWalletFundingOrderRow {
  return {
    id:
      row.id,

    organizationId:
      row.organization_id,

    organizationName:
      row.organization_name,

    provider:
      row.provider,

    providerOrderId:
      row.provider_order_id,

    amount:
      inrMoney(
        row.amount_minor_units
      ),

    status:
      row.status,

    expiresAt:
      dateToIso(
        row.expires_at
      ),

    creditedAt:
      dateToIso(
        row.credited_at
      ),

    createdAt:
      row.created_at.toISOString(),
  };
}

function mapPaymentRow(
  row:
    PaymentDatabaseRow
): AdminWalletPaymentRow {
  return {
    id:
      row.id,

    organizationId:
      row.organization_id,

    organizationName:
      row.organization_name,

    provider:
      row.provider,

    providerPaymentId:
      row.provider_payment_id,

    captured:
      inrMoney(
        row.captured_minor_units
      ),

    refunded:
      inrMoney(
        row.refunded_minor_units
      ),

    status:
      row.status,

    paidAt:
      dateToIso(
        row.paid_at
      ),

    webhookVerifiedAt:
      dateToIso(
        row.webhook_verified_at
      ),

    createdAt:
      row.created_at.toISOString(),
  };
}

function mapLedgerRow(
  row:
    LedgerDatabaseRow
): AdminWalletLedgerRow {
  return {
    id:
      row.id,

    organizationId:
      row.organization_id,

    organizationName:
      row.organization_name,

    entryType:
      row.entry_type,

    direction:
      row.direction,

    status:
      row.status,

    amount:
      inrMoney(
        row.amount_minor_units
      ),

    balanceAfter:
      inrMoney(
        row.balance_after_minor_units
      ),

    providerReference:
      row.provider_reference,

    createdAt:
      row.created_at.toISOString(),
  };
}

export async function readAdminWalletOperationsSnapshot(
  input:
    ReadAdminWalletOperationsInput =
    {}
): Promise<AdminWalletOperationsRepositorySnapshot> {
  const executor =
    input.executor;

  const limit =
    normalizeLimit(
      input.limit
    );

  const summaryResult =
    await executeDatabaseQuery<SummaryDatabaseRow>(
      `
        SELECT
          COALESCE(count(DISTINCT organization_id), 0)::int
            AS organization_count,
          COALESCE(count(*), 0)::int
            AS wallet_count,
          COALESCE(count(*) FILTER (WHERE status::text = 'active'), 0)::int
            AS active_wallet_count,
          COALESCE(sum(available_balance_minor_units), 0)::text
            AS total_available_minor_units,
          COALESCE(sum(reserved_balance_minor_units), 0)::text
            AS total_reserved_minor_units,
          COALESCE(sum(total_credited_minor_units), 0)::text
            AS total_credited_minor_units,
          COALESCE(sum(total_spent_minor_units), 0)::text
            AS total_spent_minor_units,
          COALESCE(sum(total_refunded_minor_units), 0)::text
            AS total_refunded_minor_units,
          (
            SELECT
              COALESCE(count(*), 0)::int
            FROM app.wallet_funding_orders
            WHERE status::text IN (
              'created',
              'pending_provider',
              'checkout_opened',
              'payment_submitted',
              'verification_pending'
            )
          ) AS pending_funding_order_count,
          (
            SELECT
              COALESCE(count(*), 0)::int
            FROM app.advertiser_payments
            WHERE status::text = 'failed'
          ) AS failed_payment_count,
          (
            SELECT
              COALESCE(count(*), 0)::int
            FROM app.advertiser_refunds
            WHERE status::text IN (
              'requested',
              'approved',
              'processing',
              'refund_pending',
              'pending'
            )
          ) AS open_refund_count,
          0::int
            AS unreconciled_webhook_count
        FROM app.advertiser_wallets
      `,
      [],
      executor
    );

  const organizationsResult =
    await executeDatabaseQuery<OrganizationDatabaseRow>(
      `
        SELECT
          wallet.organization_id::text
            AS organization_id,
          'Organization ' || left(wallet.organization_id::text, 8)
            AS organization_name,
          wallet.id::text
            AS wallet_id,
          wallet.status::text
            AS wallet_status,
          wallet.available_balance_minor_units::text
            AS available_minor_units,
          wallet.reserved_balance_minor_units::text
            AS reserved_minor_units,
          wallet.total_credited_minor_units::text
            AS credited_minor_units,
          wallet.total_spent_minor_units::text
            AS spent_minor_units,
          wallet.total_refunded_minor_units::text
            AS refunded_minor_units,
          (
            SELECT
              COALESCE(count(*), 0)::int
            FROM app.wallet_funding_orders funding_order
            WHERE funding_order.organization_id = wallet.organization_id
          ) AS funding_order_count,
          (
            SELECT
              COALESCE(count(*), 0)::int
            FROM app.advertiser_payments payment
            WHERE payment.organization_id = wallet.organization_id
          ) AS payment_count,
          (
            SELECT
              COALESCE(count(*), 0)::int
            FROM app.advertiser_invoices invoice
            WHERE invoice.organization_id = wallet.organization_id
          ) AS invoice_count,
          (
            SELECT
              COALESCE(count(*), 0)::int
            FROM app.advertiser_refunds refund
            WHERE refund.organization_id = wallet.organization_id
          ) AS refund_count,
          (
            SELECT
              COALESCE(count(*), 0)::int
            FROM app.campaign_wallet_allocations allocation
            WHERE allocation.organization_id = wallet.organization_id
          ) AS allocation_count,
          (
            SELECT
              max(payment.paid_at)
            FROM app.advertiser_payments payment
            WHERE payment.organization_id = wallet.organization_id
          ) AS last_payment_at,
          wallet.updated_at
        FROM app.advertiser_wallets wallet
        ORDER BY
          wallet.updated_at DESC,
          wallet.organization_id ASC
        LIMIT $1
      `,
      [
        limit,
      ],
      executor
    );

  const fundingOrdersResult =
    await executeDatabaseQuery<FundingOrderDatabaseRow>(
      `
        SELECT
          funding_order.id::text
            AS id,
          funding_order.organization_id::text
            AS organization_id,
          'Organization ' || left(funding_order.organization_id::text, 8)
            AS organization_name,
          funding_order.provider::text
            AS provider,
          funding_order.provider_order_id,
          funding_order.amount_minor_units::text
            AS amount_minor_units,
          funding_order.status::text
            AS status,
          funding_order.expires_at,
          funding_order.credited_at,
          funding_order.created_at
        FROM app.wallet_funding_orders funding_order
        ORDER BY
          funding_order.created_at DESC,
          funding_order.id DESC
        LIMIT $1
      `,
      [
        limit,
      ],
      executor
    );

  const paymentsResult =
    await executeDatabaseQuery<PaymentDatabaseRow>(
      `
        SELECT
          payment.id::text
            AS id,
          payment.organization_id::text
            AS organization_id,
          'Organization ' || left(payment.organization_id::text, 8)
            AS organization_name,
          payment.provider::text
            AS provider,
          payment.provider_payment_id,
          payment.captured_minor_units::text
            AS captured_minor_units,
          payment.refunded_minor_units::text
            AS refunded_minor_units,
          payment.status::text
            AS status,
          payment.paid_at,
          payment.webhook_verified_at,
          payment.created_at
        FROM app.advertiser_payments payment
        ORDER BY
          payment.created_at DESC,
          payment.id DESC
        LIMIT $1
      `,
      [
        limit,
      ],
      executor
    );

  const ledgerResult =
    await executeDatabaseQuery<LedgerDatabaseRow>(
      `
        SELECT
          ledger.id::text
            AS id,
          ledger.organization_id::text
            AS organization_id,
          'Organization ' || left(ledger.organization_id::text, 8)
            AS organization_name,
          ledger.entry_type::text
            AS entry_type,
          ledger.direction::text
            AS direction,
          ledger.status::text
            AS status,
          ledger.amount_minor_units::text
            AS amount_minor_units,
          ledger.balance_after_minor_units::text
            AS balance_after_minor_units,
          ledger.provider_reference,
          ledger.created_at
        FROM app.advertiser_wallet_ledger_entries ledger
        ORDER BY
          ledger.created_at DESC,
          ledger.id DESC
        LIMIT $1
      `,
      [
        limit,
      ],
      executor
    );

  return {
    summary:
      mapSummaryRow(
        summaryResult.rows[0]
      ),

    organizations:
      organizationsResult.rows.map(
        mapOrganizationRow
      ),

    fundingOrders:
      fundingOrdersResult.rows.map(
        mapFundingOrderRow
      ),

    payments:
      paymentsResult.rows.map(
        mapPaymentRow
      ),

    ledgerEntries:
      ledgerResult.rows.map(
        mapLedgerRow
      ),
  };
}