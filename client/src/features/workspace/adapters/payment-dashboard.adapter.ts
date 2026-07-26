import type {
  CampaignId,
  OrganizationId,
} from "../advertising/advertising.types";

import type {
  CampaignBudget,
  CampaignBudgetStatus,
} from "../payments/budget.types";

import {
  calculateBudgetRemainingPercentage,
  calculateBudgetUtilizationPercentage,
} from "../payments/budget.types";

import type {
  AdvertiserInvoice,
  InvoiceStatus,
} from "../payments/invoice.types";

import type {
  LedgerEntry,
  LedgerEntryDirection,
  LedgerEntryStatus,
  LedgerEntryType,
} from "../payments/ledger.types";

import type {
  AdvertiserPayment,
  PaymentMethodDetails,
  PaymentProvider,
  PaymentStatus,
} from "../payments/payment.types";

import type {
  AdvertiserRefund,
  RefundReason,
  RefundStatus,
} from "../payments/refund.types";

import type {
  AdvertiserPaymentSettlement,
  SettlementMode,
  SettlementStatus,
} from "../payments/settlement.types";

import type {
  SupportedCurrency,
} from "../payments/currency.types";

/**
 * Client financial dashboard adapter.
 *
 * Converts canonical payment-domain records into UI-ready
 * Client view models.
 *
 * This file must not:
 *
 * - create payment orders;
 * - verify provider webhooks;
 * - approve or execute refunds;
 * - mutate ledger records;
 * - calculate authoritative Backend balances;
 * - determine settlement provider behavior.
 */

export interface PaymentDashboardBalanceSummary {
  campaignId:
    CampaignId;

  budgetStatus:
    CampaignBudgetStatus;

  currency:
    SupportedCurrency;

  allocatedMinor:
    number;

  paidMinor:
    number;

  availableMinor:
    number;

  reservedMinor:
    number;

  estimatedSpendMinor:
    number;

  pendingValidationSpendMinor:
    number;

  finalizedSpendMinor:
    number;

  invalidTrafficCreditMinor:
    number;

  adjustmentCreditMinor:
    number;

  adjustmentDebitMinor:
    number;

  refundReservedMinor:
    number;

  refundedMinor:
    number;

  disputedMinor:
    number;

  remainingMinor:
    number;

  utilizationPercentage:
    number |
    null;

  remainingPercentage:
    number |
    null;

  dataThrough:
    string;

  finalizedThrough?:
    string;

  lastReconciledAt?:
    string;

  updatedAt:
    string;

  warningMessages:
    string[];
}

export interface PaymentDashboardInvoiceRow {
  invoiceId:
    string;

  invoiceNumber:
    string;

  campaignId?:
    CampaignId;

  status:
    InvoiceStatus;

  currency:
    SupportedCurrency;

  totalMinor:
    number;

  paidMinor:
    number;

  refundedMinor:
    number;

  outstandingMinor:
    number;

  issuedAt?:
    string;

  dueAt?:
    string;

  paidAt?:
    string;

  documentUrl?:
    string;
}

export interface PaymentDashboardPaymentRow {
  paymentId:
    string;

  invoiceId:
    string;

  campaignId?:
    CampaignId;

  provider:
    PaymentProvider;

  status:
    PaymentStatus;

  amountMinor:
    number;

  capturedAmountMinor:
    number;

  refundedAmountMinor:
    number;

  currency:
    SupportedCurrency;

  methodDetails:
    PaymentMethodDetails;

  providerPaymentId?:
    string;

  paymentVerified:
    boolean;

  riskAccepted:
    boolean;

  paidAt?:
    string;

  createdAt:
    string;
}

export interface PaymentDashboardSettlementRow {
  settlementId:
    string;

  status:
    SettlementStatus;

  mode:
    SettlementMode;

  currency:
    SupportedCurrency;

  grossAmountMinor:
    number;

  providerFeeMinor:
    number;

  taxMinor:
    number;

  adjustmentMinor:
    number;

  netAmountMinor:
    number;

  expectedSettlementAt?:
    string;

  settledAt?:
    string;

  providerSettlementId?:
    string;

  providerUtr?:
    string;
}

export interface PaymentDashboardRefundRow {
  refundId:
    string;

  refundRequestId:
    string;

  paymentId:
    string;

  invoiceId:
    string;

  campaignId?:
    CampaignId;

  reason:
    RefundReason;

  status:
    RefundStatus;

  currency:
    SupportedCurrency;

  requestedAmountMinor:
    number;

  approvedAmountMinor:
    number;

  refundedAmountMinor:
    number;

  executionMode:
    AdvertiserRefund[
      "executionMode"
    ];

  providerRefundId?:
    string;

  approvedAt:
    string;

  refundedAt?:
    string;

  failedAt?:
    string;
}

export interface PaymentDashboardLedgerRow {
  ledgerEntryId:
    string;

  campaignId?:
    CampaignId;

  invoiceId?:
    string;

  paymentId?:
    string;

  refundId?:
    string;

  settlementId?:
    string;

  type:
    LedgerEntryType;

  direction:
    LedgerEntryDirection;

  status:
    LedgerEntryStatus;

  currency:
    SupportedCurrency;

  amountMinor:
    number;

  balanceBeforeMinor:
    number;

  balanceAfterMinor:
    number;

  description:
    string;

  occurredAt:
    string;

  finalizedAt?:
    string;
}

export interface PaymentDashboardSummary {
  organizationId:
    OrganizationId;

  currency:
    SupportedCurrency;

  totalAllocatedMinor:
    number;

  totalPaidMinor:
    number;

  totalAvailableMinor:
    number;

  totalReservedMinor:
    number;

  totalEstimatedSpendMinor:
    number;

  totalPendingValidationSpendMinor:
    number;

  totalFinalizedSpendMinor:
    number;

  totalInvalidTrafficCreditMinor:
    number;

  totalRefundedMinor:
    number;

  totalDisputedMinor:
    number;

  totalRemainingMinor:
    number;

  unpaidInvoiceCount:
    number;

  activeRefundCount:
    number;

  unsettledSettlementCount:
    number;
}

export interface PaymentDashboardViewModel {
  summary:
    PaymentDashboardSummary;

  campaignBalances:
    PaymentDashboardBalanceSummary[];

  invoices:
    PaymentDashboardInvoiceRow[];

  payments:
    PaymentDashboardPaymentRow[];

  settlements:
    PaymentDashboardSettlementRow[];

  refunds:
    PaymentDashboardRefundRow[];

  ledger:
    PaymentDashboardLedgerRow[];

  warnings:
    string[];
}

export interface CreatePaymentDashboardViewModelInput {
  organizationId:
    OrganizationId;

  currency:
    SupportedCurrency;

  budgets:
    CampaignBudget[];

  invoices:
    AdvertiserInvoice[];

  payments:
    AdvertiserPayment[];

  settlements:
    AdvertiserPaymentSettlement[];

  refunds:
    AdvertiserRefund[];

  ledgerEntries:
    LedgerEntry[];
}

function assertMatchingCurrency(
  valueCurrency:
    SupportedCurrency,
  expectedCurrency:
    SupportedCurrency,
  label:
    string
): void {
  if (
    valueCurrency !==
    expectedCurrency
  ) {
    throw new Error(
      `${label} currency must match dashboard currency ${expectedCurrency}.`
    );
  }
}

function isPaymentVerified(
  payment:
    AdvertiserPayment
): boolean {
  return (
    payment
      .webhookVerification
      .verificationStatus ===
      "verified" &&
    payment
      .webhookVerification
      .signatureVerified &&
    !payment
      .webhookVerification
      .duplicate
  );
}

function createBalanceSummary(
  budget:
    CampaignBudget
): PaymentDashboardBalanceSummary {
  return {
    campaignId:
      budget.campaignId,

    budgetStatus:
      budget.status,

    currency:
      budget.currency,

    allocatedMinor:
      budget.amounts
        .allocatedMinor,

    paidMinor:
      budget.amounts
        .paidMinor,

    availableMinor:
      budget.amounts
        .availableMinor,

    reservedMinor:
      budget.amounts
        .reservedMinor,

    estimatedSpendMinor:
      budget.amounts
        .estimatedSpendMinor,

    pendingValidationSpendMinor:
      budget.amounts
        .pendingValidationSpendMinor,

    finalizedSpendMinor:
      budget.amounts
        .finalizedSpendMinor,

    invalidTrafficCreditMinor:
      budget.amounts
        .invalidTrafficCreditMinor,

    adjustmentCreditMinor:
      budget.amounts
        .adjustmentCreditMinor,

    adjustmentDebitMinor:
      budget.amounts
        .adjustmentDebitMinor,

    refundReservedMinor:
      budget.amounts
        .refundReservedMinor,

    refundedMinor:
      budget.amounts
        .refundedMinor,

    disputedMinor:
      budget.amounts
        .disputedMinor,

    remainingMinor:
      budget.amounts
        .remainingMinor,

    utilizationPercentage:
      calculateBudgetUtilizationPercentage(
        budget.amounts
          .paidMinor,
        budget.amounts
          .finalizedSpendMinor
      ),

    remainingPercentage:
      calculateBudgetRemainingPercentage(
        budget.amounts
          .paidMinor,
        budget.amounts
          .remainingMinor
      ),

    dataThrough:
      budget.freshness
        .dataThrough,

    finalizedThrough:
      budget.freshness
        .finalizedThrough,

    lastReconciledAt:
      budget.freshness
        .lastReconciledAt,

    updatedAt:
      budget.freshness
        .updatedAt,

    warningMessages: [
      ...budget.freshness
        .warningMessages,
    ],
  };
}

function createInvoiceRow(
  invoice:
    AdvertiserInvoice
): PaymentDashboardInvoiceRow {
  return {
    invoiceId:
      invoice.id,

    invoiceNumber:
      invoice.invoiceNumber,

    campaignId:
      invoice.campaignId,

    status:
      invoice.status,

    currency:
      invoice.currency,

    totalMinor:
      invoice.totals
        .totalMinor,

    paidMinor:
      invoice.totals
        .paidMinor,

    refundedMinor:
      invoice.totals
        .refundedMinor,

    outstandingMinor:
      invoice.totals
        .outstandingMinor,

    issuedAt:
      invoice.issuedAt,

    dueAt:
      invoice.dueAt,

    paidAt:
      invoice.paidAt,

    documentUrl:
      invoice.documentUrl,
  };
}

function createPaymentRow(
  payment:
    AdvertiserPayment
): PaymentDashboardPaymentRow {
  return {
    paymentId:
      payment.id,

    invoiceId:
      payment.invoiceId,

    campaignId:
      payment.campaignId,

    provider:
      payment.provider,

    status:
      payment.status,

    amountMinor:
      payment.amount
        .amountMinor,

    capturedAmountMinor:
      payment.capturedAmount
        .amountMinor,

    refundedAmountMinor:
      payment.refundedAmount
        .amountMinor,

    currency:
      payment.amount
        .currency,

    methodDetails:
      payment.methodDetails,

    providerPaymentId:
      payment.providerPaymentId,

    paymentVerified:
      isPaymentVerified(
        payment
      ),

    riskAccepted:
      payment.riskStatus ===
      "accepted",

    paidAt:
      payment.paidAt,

    createdAt:
      payment.createdAt,
  };
}

function createSettlementRow(
  settlement:
    AdvertiserPaymentSettlement
): PaymentDashboardSettlementRow {
  return {
    settlementId:
      settlement.id,

    status:
      settlement.status,

    mode:
      settlement.mode,

    currency:
      settlement
        .settlementCurrency,

    grossAmountMinor:
      settlement.grossAmount
        .amountMinor,

    providerFeeMinor:
      settlement.providerFee
        .amountMinor,

    taxMinor:
      settlement.taxAmount
        .amountMinor,

    adjustmentMinor:
      settlement.adjustmentAmount
        .amountMinor,

    netAmountMinor:
      settlement.netAmount
        .amountMinor,

    expectedSettlementAt:
      settlement
        .expectedSettlementAt,

    settledAt:
      settlement.settledAt,

    providerSettlementId:
      settlement
        .providerReference
        .providerSettlementId,

    providerUtr:
      settlement
        .providerReference
        .providerUtr,
  };
}

function createRefundRow(
  refund:
    AdvertiserRefund
): PaymentDashboardRefundRow {
  return {
    refundId:
      refund.id,

    refundRequestId:
      refund.refundRequestId,

    paymentId:
      refund.paymentId,

    invoiceId:
      refund.invoiceId,

    campaignId:
      refund.campaignId,

    reason:
      refund.reason,

    status:
      refund.status,

    currency:
      refund.approvedAmount
        .currency,

    requestedAmountMinor:
      refund.requestedAmount
        .amountMinor,

    approvedAmountMinor:
      refund.approvedAmount
        .amountMinor,

    refundedAmountMinor:
      refund.refundedAmount
        .amountMinor,

    executionMode:
      refund.executionMode,

    providerRefundId:
      refund.providerReference
        .providerRefundId,

    approvedAt:
      refund.approvedAt,

    refundedAt:
      refund.refundedAt,

    failedAt:
      refund.failedAt,
  };
}

function createLedgerRow(
  entry:
    LedgerEntry
): PaymentDashboardLedgerRow {
  return {
    ledgerEntryId:
      entry.id,

    campaignId:
      entry.campaignId,

    invoiceId:
      entry.invoiceId,

    paymentId:
      entry.paymentId,

    refundId:
      entry.refundId,

    settlementId:
      entry.settlementId,

    type:
      entry.type,

    direction:
      entry.direction,

    status:
      entry.status,

    currency:
      entry.amount.currency,

    amountMinor:
      entry.amount.amountMinor,

    balanceBeforeMinor:
      entry.balanceBeforeMinor,

    balanceAfterMinor:
      entry.balanceAfterMinor,

    description:
      entry.description,

    occurredAt:
      entry.occurredAt,

    finalizedAt:
      entry.finalizedAt,
  };
}

function isInvoiceUnpaid(
  invoice:
    AdvertiserInvoice
): boolean {
  return (
    invoice.totals
      .outstandingMinor >
      0 &&
    invoice.status !==
      "cancelled" &&
    invoice.status !==
      "refunded"
  );
}

function isRefundActive(
  refund:
    AdvertiserRefund
): boolean {
  return (
    refund.status ===
      "approved" ||
    refund.status ===
      "processing" ||
    refund.status ===
      "partially_refunded"
  );
}

function isSettlementUnsettled(
  settlement:
    AdvertiserPaymentSettlement
): boolean {
  return (
    settlement.status ===
      "not_initiated" ||
    settlement.status ===
      "queued" ||
    settlement.status ===
      "processing" ||
    settlement.status ===
      "on_hold"
  );
}

function getLatestFirst<
  T
>(
  values:
    T[],
  getTimestamp:
    (
      value:
        T
    ) =>
      string |
      undefined
): T[] {
  return [
    ...values,
  ].sort(
    (
      first,
      second
    ) => {
      const firstTime =
        getTimestamp(
          first
        );

      const secondTime =
        getTimestamp(
          second
        );

      const firstValue =
        firstTime
          ? new Date(
              firstTime
            ).getTime()
          : 0;

      const secondValue =
        secondTime
          ? new Date(
              secondTime
            ).getTime()
          : 0;

      return (
        secondValue -
        firstValue
      );
    }
  );
}

export function createPaymentDashboardViewModel(
  input:
    CreatePaymentDashboardViewModelInput
): PaymentDashboardViewModel {
  const organizationBudgets =
    input.budgets.filter(
      (
        budget
      ) =>
        budget.organizationId ===
        input.organizationId
    );

  const organizationInvoices =
    input.invoices.filter(
      (
        invoice
      ) =>
        invoice.organizationId ===
        input.organizationId
    );

  const organizationPayments =
    input.payments.filter(
      (
        payment
      ) =>
        payment.organizationId ===
        input.organizationId
    );

  const organizationSettlements =
    input.settlements.filter(
      (
        settlement
      ) =>
        settlement.organizationId ===
        input.organizationId
    );

  const organizationRefunds =
    input.refunds.filter(
      (
        refund
      ) =>
        refund.organizationId ===
        input.organizationId
    );

  const organizationLedgerEntries =
    input.ledgerEntries.filter(
      (
        entry
      ) =>
        entry.organizationId ===
        input.organizationId
    );

  organizationBudgets.forEach(
    (
      budget
    ) =>
      assertMatchingCurrency(
        budget.currency,
        input.currency,
        "Campaign budget"
      )
  );

  organizationInvoices.forEach(
    (
      invoice
    ) =>
      assertMatchingCurrency(
        invoice.currency,
        input.currency,
        "Invoice"
      )
  );

  organizationPayments.forEach(
    (
      payment
    ) =>
      assertMatchingCurrency(
        payment.amount
          .currency,
        input.currency,
        "Payment"
      )
  );

  organizationSettlements.forEach(
    (
      settlement
    ) =>
      assertMatchingCurrency(
        settlement
          .settlementCurrency,
        input.currency,
        "Settlement"
      )
  );

  organizationRefunds.forEach(
    (
      refund
    ) =>
      assertMatchingCurrency(
        refund.approvedAmount
          .currency,
        input.currency,
        "Refund"
      )
  );

  organizationLedgerEntries.forEach(
    (
      entry
    ) =>
      assertMatchingCurrency(
        entry.amount.currency,
        input.currency,
        "Ledger entry"
      )
  );

  const campaignBalances =
    organizationBudgets.map(
      createBalanceSummary
    );

  const invoices =
    getLatestFirst(
      organizationInvoices.map(
        createInvoiceRow
      ),
      (
        invoice
      ) =>
        invoice.issuedAt
    );

  const payments =
    getLatestFirst(
      organizationPayments.map(
        createPaymentRow
      ),
      (
        payment
      ) =>
        payment.paidAt ??
        payment.createdAt
    );

  const settlements =
    getLatestFirst(
      organizationSettlements.map(
        createSettlementRow
      ),
      (
        settlement
      ) =>
        settlement.settledAt ??
        settlement
          .expectedSettlementAt
    );

  const refunds =
    getLatestFirst(
      organizationRefunds.map(
        createRefundRow
      ),
      (
        refund
      ) =>
        refund.refundedAt ??
        refund.failedAt ??
        refund.approvedAt
    );

  const ledger =
    getLatestFirst(
      organizationLedgerEntries.map(
        createLedgerRow
      ),
      (
        entry
      ) =>
        entry.finalizedAt ??
        entry.occurredAt
    );

  const warnings =
    Array.from(
      new Set(
        campaignBalances.flatMap(
          (
            budget
          ) =>
            budget.warningMessages
        )
      )
    );

  return {
    summary: {
      organizationId:
        input.organizationId,

      currency:
        input.currency,

      totalAllocatedMinor:
        campaignBalances.reduce(
          (
            total,
            budget
          ) =>
            total +
            budget
              .allocatedMinor,
          0
        ),

      totalPaidMinor:
        campaignBalances.reduce(
          (
            total,
            budget
          ) =>
            total +
            budget.paidMinor,
          0
        ),

      totalAvailableMinor:
        campaignBalances.reduce(
          (
            total,
            budget
          ) =>
            total +
            budget.availableMinor,
          0
        ),

      totalReservedMinor:
        campaignBalances.reduce(
          (
            total,
            budget
          ) =>
            total +
            budget.reservedMinor,
          0
        ),

      totalEstimatedSpendMinor:
        campaignBalances.reduce(
          (
            total,
            budget
          ) =>
            total +
            budget
              .estimatedSpendMinor,
          0
        ),

      totalPendingValidationSpendMinor:
        campaignBalances.reduce(
          (
            total,
            budget
          ) =>
            total +
            budget
              .pendingValidationSpendMinor,
          0
        ),

      totalFinalizedSpendMinor:
        campaignBalances.reduce(
          (
            total,
            budget
          ) =>
            total +
            budget
              .finalizedSpendMinor,
          0
        ),

      totalInvalidTrafficCreditMinor:
        campaignBalances.reduce(
          (
            total,
            budget
          ) =>
            total +
            budget
              .invalidTrafficCreditMinor,
          0
        ),

      totalRefundedMinor:
        campaignBalances.reduce(
          (
            total,
            budget
          ) =>
            total +
            budget.refundedMinor,
          0
        ),

      totalDisputedMinor:
        campaignBalances.reduce(
          (
            total,
            budget
          ) =>
            total +
            budget.disputedMinor,
          0
        ),

      totalRemainingMinor:
        campaignBalances.reduce(
          (
            total,
            budget
          ) =>
            total +
            budget.remainingMinor,
          0
        ),

      unpaidInvoiceCount:
        organizationInvoices.filter(
          isInvoiceUnpaid
        ).length,

      activeRefundCount:
        organizationRefunds.filter(
          isRefundActive
        ).length,

      unsettledSettlementCount:
        organizationSettlements.filter(
          isSettlementUnsettled
        ).length,
    },

    campaignBalances,

    invoices,

    payments,

    settlements,

    refunds,

    ledger,

    warnings,
  };
}
