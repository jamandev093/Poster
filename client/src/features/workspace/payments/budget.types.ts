import type {
  CampaignId,
  OrganizationId,
} from "../advertising/advertising.types";

import type {
  AnalyticsProcessingStage,
} from "../analytics/analytics.types";

import type {
  MoneyAmount,
  SupportedCurrency,
} from "./currency.types";

import type {
  InvoiceId,
  PaymentId,
} from "./payment.types";

import type {
  LedgerAccountId,
  LedgerEntryId,
} from "./ledger.types";

/**
 * Canonical advertiser campaign-budget contracts.
 *
 * The budget view is a projection of authoritative:
 *
 * - verified payment credits;
 * - reservations;
 * - finalized analytics charges;
 * - approved invalid-traffic credits;
 * - refunds;
 * - ledger adjustments.
 *
 * The append-only ledger remains the financial source of truth.
 */

export type CampaignBudgetId =
  `BGT-${string}`;

export type BudgetAllocationId =
  `BAL-${string}`;

export type BudgetReservationId =
  `BRS-${string}`;

export type BudgetAdjustmentId =
  `BAD-${string}`;

export type CampaignBudgetStatus =
  | "not_funded"
  | "funding_pending"
  | "available"
  | "partially_reserved"
  | "fully_reserved"
  | "low_balance"
  | "depleted"
  | "refund_pending"
  | "closed"
  | "blocked";

export type BudgetAllocationStatus =
  | "pending"
  | "available"
  | "reserved"
  | "partially_consumed"
  | "consumed"
  | "released"
  | "refunded"
  | "expired"
  | "cancelled";

export type BudgetReservationStatus =
  | "pending"
  | "active"
  | "partially_consumed"
  | "consumed"
  | "released"
  | "cancelled"
  | "expired";

export type BudgetAdjustmentType =
  | "invalid_traffic_credit"
  | "billing_credit"
  | "billing_debit"
  | "contract_credit"
  | "contract_debit"
  | "manual_credit"
  | "manual_debit"
  | "rounding_adjustment";

export type BudgetAvailabilityReason =
  | "verified_payment"
  | "manual_payment_reconciliation"
  | "approved_credit"
  | "released_reservation"
  | "refund_reversal"
  | "opening_balance";

export interface CampaignBudgetAmounts {
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
}

export interface CampaignBudgetAllocation {
  id:
    BudgetAllocationId;

  budgetId:
    CampaignBudgetId;

  organizationId:
    OrganizationId;

  campaignId:
    CampaignId;

  invoiceId?:
    InvoiceId;

  paymentId?:
    PaymentId;

  ledgerEntryId:
    LedgerEntryId;

  amount:
    MoneyAmount;

  remainingAmount:
    MoneyAmount;

  status:
    BudgetAllocationStatus;

  availabilityReason:
    BudgetAvailabilityReason;

  availableAt?:
    string;

  reservedAt?:
    string;

  consumedAt?:
    string;

  releasedAt?:
    string;

  refundedAt?:
    string;

  expiresAt?:
    string;

  createdAt:
    string;

  updatedAt:
    string;
}

export interface CampaignBudgetReservation {
  id:
    BudgetReservationId;

  budgetId:
    CampaignBudgetId;

  organizationId:
    OrganizationId;

  campaignId:
    CampaignId;

  status:
    BudgetReservationStatus;

  reservedAmount:
    MoneyAmount;

  consumedAmount:
    MoneyAmount;

  releasedAmount:
    MoneyAmount;

  reserveLedgerEntryId:
    LedgerEntryId;

  releaseLedgerEntryId?:
    LedgerEntryId;

  purpose:
    string;

  reservedAt:
    string;

  consumedAt?:
    string;

  releasedAt?:
    string;

  expiresAt?:
    string;

  createdAt:
    string;

  updatedAt:
    string;
}

export interface CampaignBudgetAdjustment {
  id:
    BudgetAdjustmentId;

  budgetId:
    CampaignBudgetId;

  organizationId:
    OrganizationId;

  campaignId:
    CampaignId;

  type:
    BudgetAdjustmentType;

  amount:
    MoneyAmount;

  ledgerEntryId:
    LedgerEntryId;

  analyticsAdjustmentId?:
    string;

  reason:
    string;

  appliedAt:
    string;
}

export interface CampaignBudgetFreshness {
  processingStage:
    AnalyticsProcessingStage;

  dataThrough:
    string;

  finalizedThrough?:
    string;

  lastLedgerEntryAt?:
    string;

  lastAdjustedAt?:
    string;

  lastReconciledAt?:
    string;

  updatedAt:
    string;

  warningMessages:
    string[];
}

export interface CampaignBudget {
  id:
    CampaignBudgetId;

  ledgerAccountId:
    LedgerAccountId;

  organizationId:
    OrganizationId;

  campaignId:
    CampaignId;

  status:
    CampaignBudgetStatus;

  currency:
    SupportedCurrency;

  spendLimitMinor?:
    number;

  lowBalanceThresholdMinor?:
    number;

  amounts:
    CampaignBudgetAmounts;

  allocations:
    CampaignBudgetAllocation[];

  reservations:
    CampaignBudgetReservation[];

  adjustments:
    CampaignBudgetAdjustment[];

  freshness:
    CampaignBudgetFreshness;

  createdAt:
    string;

  updatedAt:
    string;

  closedAt?:
    string;
}

export interface CampaignBudgetSummary {
  campaignId:
    CampaignId;

  status:
    CampaignBudgetStatus;

  currency:
    SupportedCurrency;

  allocatedMinor:
    number;

  paidMinor:
    number;

  availableMinor:
    number;

  estimatedSpendMinor:
    number;

  pendingValidationSpendMinor:
    number;

  finalizedSpendMinor:
    number;

  invalidTrafficCreditMinor:
    number;

  refundedMinor:
    number;

  remainingMinor:
    number;

  lastUpdatedAt:
    string;

  lastReconciledAt?:
    string;
}

export interface CalculateCampaignBudgetAmountsInput {
  currency:
    SupportedCurrency;

  allocatedMinor:
    number;

  paidMinor:
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
}

function assertNonNegativeSafeInteger(
  value:
    number,
  label:
    string
): void {
  if (
    !Number.isSafeInteger(
      value
    ) ||
    value < 0
  ) {
    throw new Error(
      `${label} must be a non-negative safe integer in minor units.`
    );
  }
}

export function calculateCampaignBudgetAmounts(
  input:
    CalculateCampaignBudgetAmountsInput
): CampaignBudgetAmounts {
  const values = [
    [
      "Allocated amount",
      input.allocatedMinor,
    ],
    [
      "Paid amount",
      input.paidMinor,
    ],
    [
      "Reserved amount",
      input.reservedMinor,
    ],
    [
      "Estimated spend",
      input.estimatedSpendMinor,
    ],
    [
      "Pending-validation spend",
      input.pendingValidationSpendMinor,
    ],
    [
      "Finalized spend",
      input.finalizedSpendMinor,
    ],
    [
      "Invalid-traffic credit",
      input.invalidTrafficCreditMinor,
    ],
    [
      "Adjustment credit",
      input.adjustmentCreditMinor,
    ],
    [
      "Adjustment debit",
      input.adjustmentDebitMinor,
    ],
    [
      "Refund reservation",
      input.refundReservedMinor,
    ],
    [
      "Refunded amount",
      input.refundedMinor,
    ],
    [
      "Disputed amount",
      input.disputedMinor,
    ],
  ] as const;

  values.forEach(
    (
      [
        label,
        value,
      ]
    ) => {
      assertNonNegativeSafeInteger(
        value,
        label
      );
    }
  );

  const availableMinor =
    Math.max(
      input.paidMinor +
        input.invalidTrafficCreditMinor +
        input.adjustmentCreditMinor -
        input.adjustmentDebitMinor -
        input.reservedMinor -
        input.finalizedSpendMinor -
        input.refundReservedMinor -
        input.refundedMinor -
        input.disputedMinor,
      0
    );

  const remainingMinor =
    availableMinor;

  return {
    currency:
      input.currency,

    allocatedMinor:
      input.allocatedMinor,

    paidMinor:
      input.paidMinor,

    availableMinor,

    reservedMinor:
      input.reservedMinor,

    estimatedSpendMinor:
      input.estimatedSpendMinor,

    pendingValidationSpendMinor:
      input.pendingValidationSpendMinor,

    finalizedSpendMinor:
      input.finalizedSpendMinor,

    invalidTrafficCreditMinor:
      input.invalidTrafficCreditMinor,

    adjustmentCreditMinor:
      input.adjustmentCreditMinor,

    adjustmentDebitMinor:
      input.adjustmentDebitMinor,

    refundReservedMinor:
      input.refundReservedMinor,

    refundedMinor:
      input.refundedMinor,

    disputedMinor:
      input.disputedMinor,

    remainingMinor,
  };
}

export function determineCampaignBudgetStatus(
  input: {
    funded:
      boolean;

    fundingPending:
      boolean;

    blocked:
      boolean;

    closed:
      boolean;

    refundPending:
      boolean;

    availableMinor:
      number;

    reservedMinor:
      number;

    paidMinor:
      number;

    lowBalanceThresholdMinor?:
      number;
  }
): CampaignBudgetStatus {
  if (
    input.blocked
  ) {
    return "blocked";
  }

  if (
    input.closed
  ) {
    return "closed";
  }

  if (
    input.refundPending
  ) {
    return "refund_pending";
  }

  if (
    input.fundingPending &&
    !input.funded
  ) {
    return "funding_pending";
  }

  if (
    !input.funded ||
    input.paidMinor <= 0
  ) {
    return "not_funded";
  }

  if (
    input.availableMinor <= 0
  ) {
    return input.reservedMinor > 0
      ? "fully_reserved"
      : "depleted";
  }

  const lowBalanceThreshold =
    input.lowBalanceThresholdMinor ??
    0;

  if (
    lowBalanceThreshold > 0 &&
    input.availableMinor <=
      lowBalanceThreshold
  ) {
    return "low_balance";
  }

  if (
    input.reservedMinor > 0
  ) {
    return "partially_reserved";
  }

  return "available";
}

export function createCampaignBudgetSummary(
  budget:
    CampaignBudget
): CampaignBudgetSummary {
  return {
    campaignId:
      budget.campaignId,

    status:
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

    refundedMinor:
      budget.amounts
        .refundedMinor,

    remainingMinor:
      budget.amounts
        .remainingMinor,

    lastUpdatedAt:
      budget.freshness
        .updatedAt,

    lastReconciledAt:
      budget.freshness
        .lastReconciledAt,
  };
}

export function isCampaignBudgetFunded(
  budget:
    CampaignBudget
): boolean {
  return (
    budget.amounts
      .paidMinor >
      0 &&
    budget.status !==
      "not_funded" &&
    budget.status !==
      "funding_pending" &&
    budget.status !==
      "blocked"
  );
}

export function isCampaignBudgetEligibleForDelivery(
  budget:
    CampaignBudget
): boolean {
  return (
    isCampaignBudgetFunded(
      budget
    ) &&
    budget.amounts
      .availableMinor >
      0 &&
    (
      budget.status ===
        "available" ||
      budget.status ===
        "partially_reserved" ||
      budget.status ===
        "low_balance"
    )
  );
}

export function canReserveCampaignBudget(
  budget:
    CampaignBudget,
  amountMinor:
    number
): boolean {
  assertNonNegativeSafeInteger(
    amountMinor,
    "Reservation amount"
  );

  return (
    amountMinor >
      0 &&
    isCampaignBudgetEligibleForDelivery(
      budget
    ) &&
    amountMinor <=
      budget.amounts
        .availableMinor
  );
}

export function calculateBudgetUtilizationPercentage(
  paidMinor:
    number,
  finalizedSpendMinor:
    number
): number | null {
  assertNonNegativeSafeInteger(
    paidMinor,
    "Paid amount"
  );

  assertNonNegativeSafeInteger(
    finalizedSpendMinor,
    "Finalized spend"
  );

  if (
    paidMinor <= 0
  ) {
    return null;
  }

  return (
    finalizedSpendMinor /
    paidMinor
  ) * 100;
}

export function calculateBudgetRemainingPercentage(
  paidMinor:
    number,
  remainingMinor:
    number
): number | null {
  assertNonNegativeSafeInteger(
    paidMinor,
    "Paid amount"
  );

  assertNonNegativeSafeInteger(
    remainingMinor,
    "Remaining amount"
  );

  if (
    paidMinor <= 0
  ) {
    return null;
  }

  return (
    remainingMinor /
    paidMinor
  ) * 100;
}
