import type {
  AdvertisingActorReference,
  CampaignId,
  OrganizationId,
} from "../advertising/advertising.types";

import type {
  SignedMoneyAmount,
  SupportedCurrency,
} from "./currency.types";

import type {
  InvoiceId,
  PaymentId,
} from "./payment.types";

import type {
  RefundId,
} from "./refund.types";

import type {
  SettlementId,
} from "./settlement.types";

/**
 * Canonical advertiser financial-ledger contracts.
 *
 * The ledger is append-only.
 *
 * Existing finalized entries must never be edited or deleted.
 * Corrections are recorded as new adjustment or reversal entries
 * referencing the original entry.
 *
 * Backend and PostgreSQL remain authoritative.
 */

export type LedgerEntryId =
  `LED-${string}`;

export type LedgerAccountId =
  `LAC-${string}`;

export type LedgerBatchId =
  `LBT-${string}`;

export type LedgerReferenceId =
  `LRF-${string}`;

export type LedgerEntryType =
  | "payment_credit"
  | "manual_payment_credit"
  | "campaign_funds_reserved"
  | "campaign_funds_released"
  | "estimated_spend"
  | "pending_validation_spend"
  | "finalized_spend"
  | "invalid_traffic_credit"
  | "billing_adjustment_credit"
  | "billing_adjustment_debit"
  | "refund_reservation"
  | "refund_debit"
  | "refund_release"
  | "chargeback_debit"
  | "dispute_hold"
  | "dispute_release"
  | "expired_balance_debit"
  | "opening_balance"
  | "migration_adjustment";

export type LedgerEntryDirection =
  | "credit"
  | "debit";

export type LedgerEntryStatus =
  | "pending"
  | "finalized"
  | "reversed"
  | "cancelled";

export type LedgerBalanceCategory =
  | "available"
  | "reserved"
  | "consumed"
  | "pending_adjustment"
  | "refunded"
  | "disputed"
  | "expired";

export type LedgerSource =
  | "payment_webhook"
  | "manual_reconciliation"
  | "analytics_finalization"
  | "invalid_traffic_reconciliation"
  | "refund_processing"
  | "settlement_processing"
  | "admin_adjustment"
  | "system_migration";

export type LedgerReferenceType =
  | "payment"
  | "invoice"
  | "campaign"
  | "refund"
  | "settlement"
  | "analytics_aggregation"
  | "analytics_adjustment"
  | "dispute"
  | "manual_operation"
  | "migration";

export interface LedgerExternalReference {
  id:
    LedgerReferenceId;

  type:
    LedgerReferenceType;

  referenceId:
    string;

  providerReference?:
    string;

  description?:
    string;
}

export interface LedgerBalanceSnapshot {
  currency:
    SupportedCurrency;

  availableMinor:
    number;

  reservedMinor:
    number;

  consumedMinor:
    number;

  pendingAdjustmentMinor:
    number;

  refundedMinor:
    number;

  disputedMinor:
    number;

  expiredMinor:
    number;

  totalCreditsMinor:
    number;

  totalDebitsMinor:
    number;

  calculatedAt:
    string;

  lastLedgerEntryId?:
    LedgerEntryId;
}

export interface LedgerEntry {
  id:
    LedgerEntryId;

  batchId?:
    LedgerBatchId;

  ledgerAccountId:
    LedgerAccountId;

  organizationId:
    OrganizationId;

  campaignId?:
    CampaignId;

  invoiceId?:
    InvoiceId;

  paymentId?:
    PaymentId;

  refundId?:
    RefundId;

  settlementId?:
    SettlementId;

  type:
    LedgerEntryType;

  direction:
    LedgerEntryDirection;

  status:
    LedgerEntryStatus;

  balanceCategory:
    LedgerBalanceCategory;

  amount:
    SignedMoneyAmount;

  balanceBeforeMinor:
    number;

  balanceAfterMinor:
    number;

  description:
    string;

  source:
    LedgerSource;

  references:
    LedgerExternalReference[];

  idempotencyKey:
    string;

  /**
   * Set when this entry reverses or corrects an earlier entry.
   */
  reversesEntryId?:
    LedgerEntryId;

  /**
   * Set on the original entry after a reversal has been written.
   *
   * The original record remains immutable.
   */
  reversedByEntryId?:
    LedgerEntryId;

  createdBy:
    AdvertisingActorReference;

  occurredAt:
    string;

  createdAt:
    string;

  finalizedAt?:
    string;

  reversedAt?:
    string;
}

export interface LedgerAccount {
  id:
    LedgerAccountId;

  organizationId:
    OrganizationId;

  currency:
    SupportedCurrency;

  active:
    boolean;

  currentBalance:
    LedgerBalanceSnapshot;

  createdAt:
    string;

  updatedAt:
    string;
}

export interface LedgerBatch {
  id:
    LedgerBatchId;

  organizationId:
    OrganizationId;

  campaignId?:
    CampaignId;

  source:
    LedgerSource;

  entryIds:
    LedgerEntryId[];

  description:
    string;

  idempotencyKey:
    string;

  createdBy:
    AdvertisingActorReference;

  occurredAt:
    string;

  createdAt:
    string;

  finalizedAt?:
    string;
}

export interface CreateLedgerEntryInput {
  ledgerAccountId:
    LedgerAccountId;

  organizationId:
    OrganizationId;

  campaignId?:
    CampaignId;

  invoiceId?:
    InvoiceId;

  paymentId?:
    PaymentId;

  refundId?:
    RefundId;

  settlementId?:
    SettlementId;

  type:
    LedgerEntryType;

  direction:
    LedgerEntryDirection;

  balanceCategory:
    LedgerBalanceCategory;

  amountMinor:
    number;

  currency:
    SupportedCurrency;

  description:
    string;

  source:
    LedgerSource;

  references?:
    LedgerExternalReference[];

  idempotencyKey:
    string;

  reversesEntryId?:
    LedgerEntryId;

  createdBy:
    AdvertisingActorReference;

  occurredAt:
    string;
}

export interface LedgerBalanceMovement {
  direction:
    LedgerEntryDirection;

  amountMinor:
    number;

  balanceBeforeMinor:
    number;

  balanceAfterMinor:
    number;
}

function assertSafeInteger(
  value:
    number,
  label:
    string
): void {
  if (
    !Number.isSafeInteger(
      value
    )
  ) {
    throw new Error(
      `${label} must be a safe integer in minor units.`
    );
  }
}

function assertNonNegativeSafeInteger(
  value:
    number,
  label:
    string
): void {
  assertSafeInteger(
    value,
    label
  );

  if (
    value < 0
  ) {
    throw new Error(
      `${label} must not be negative.`
    );
  }
}

export function calculateLedgerBalanceMovement(
  balanceBeforeMinor:
    number,
  direction:
    LedgerEntryDirection,
  amountMinor:
    number
): LedgerBalanceMovement {
  assertSafeInteger(
    balanceBeforeMinor,
    "Ledger balance"
  );

  assertNonNegativeSafeInteger(
    amountMinor,
    "Ledger amount"
  );

  const signedAmount =
    direction ===
      "credit"
      ? amountMinor
      : -amountMinor;

  const balanceAfterMinor =
    balanceBeforeMinor +
    signedAmount;

  assertSafeInteger(
    balanceAfterMinor,
    "Resulting ledger balance"
  );

  return {
    direction,

    amountMinor,

    balanceBeforeMinor,

    balanceAfterMinor,
  };
}

export function getExpectedLedgerDirection(
  type:
    LedgerEntryType
): LedgerEntryDirection {
  switch (type) {
    case "payment_credit":
    case "manual_payment_credit":
    case "campaign_funds_released":
    case "invalid_traffic_credit":
    case "billing_adjustment_credit":
    case "refund_release":
    case "dispute_release":
    case "opening_balance":
      return "credit";

    case "campaign_funds_reserved":
    case "estimated_spend":
    case "pending_validation_spend":
    case "finalized_spend":
    case "billing_adjustment_debit":
    case "refund_reservation":
    case "refund_debit":
    case "chargeback_debit":
    case "dispute_hold":
    case "expired_balance_debit":
      return "debit";

    case "migration_adjustment":
      throw new Error(
        "Migration adjustment direction must be selected explicitly."
      );
  }
}

export function validateLedgerEntryDirection(
  type:
    LedgerEntryType,
  direction:
    LedgerEntryDirection
): boolean {
  if (
    type ===
      "migration_adjustment"
  ) {
    return true;
  }

  return (
    getExpectedLedgerDirection(
      type
    ) ===
    direction
  );
}

export function assertLedgerEntryIntegrity(
  entry:
    LedgerEntry
): void {
  assertNonNegativeSafeInteger(
    Math.abs(
      entry.amount.amountMinor
    ),
    "Ledger entry amount"
  );

  assertSafeInteger(
    entry.balanceBeforeMinor,
    "Ledger balance before"
  );

  assertSafeInteger(
    entry.balanceAfterMinor,
    "Ledger balance after"
  );

  if (
    !validateLedgerEntryDirection(
      entry.type,
      entry.direction
    )
  ) {
    throw new Error(
      `Ledger entry type ${entry.type} does not match direction ${entry.direction}.`
    );
  }

  const expectedMovement =
    calculateLedgerBalanceMovement(
      entry.balanceBeforeMinor,
      entry.direction,
      Math.abs(
        entry.amount.amountMinor
      )
    );

  if (
    expectedMovement
      .balanceAfterMinor !==
    entry.balanceAfterMinor
  ) {
    throw new Error(
      "Ledger balance-after value does not match the entry movement."
    );
  }

  if (
    entry.direction ===
      "credit" &&
    entry.amount.amountMinor <
      0
  ) {
    throw new Error(
      "Credit ledger entries must not contain a negative amount."
    );
  }

  if (
    entry.direction ===
      "debit" &&
    entry.amount.amountMinor >
      0
  ) {
    throw new Error(
      "Debit ledger entries must store a negative signed amount."
    );
  }

  if (
    entry.reversesEntryId &&
    entry.reversesEntryId ===
      entry.id
  ) {
    throw new Error(
      "Ledger entry cannot reverse itself."
    );
  }

  if (
    entry.status ===
      "reversed" &&
    !entry.reversedByEntryId
  ) {
    throw new Error(
      "Reversed ledger entries require the reversing entry ID."
    );
  }

  if (
    entry.status ===
      "finalized" &&
    !entry.finalizedAt
  ) {
    throw new Error(
      "Finalized ledger entries require a finalization timestamp."
    );
  }
}

export function calculateAvailableBalanceMinor(
  entries:
    LedgerEntry[],
  currency:
    SupportedCurrency
): number {
  return entries
    .filter(
      (
        entry
      ) =>
        entry.amount.currency ===
          currency &&
        entry.status ===
          "finalized" &&
        entry.balanceCategory ===
          "available"
    )
    .reduce(
      (
        balance,
        entry
      ) =>
        balance +
        entry.amount.amountMinor,
      0
    );
}

export function isLedgerEntryMutable(
  entry:
    LedgerEntry
): boolean {
  return (
    entry.status ===
      "pending"
  );
}

export function canReverseLedgerEntry(
  entry:
    LedgerEntry
): boolean {
  return (
    entry.status ===
      "finalized" &&
    !entry.reversedByEntryId
  );
}

export function createLedgerReversalInput(
  original:
    LedgerEntry,
  input: {
    idempotencyKey:
      string;

    description:
      string;

    createdBy:
      AdvertisingActorReference;

    occurredAt:
      string;
  }
): CreateLedgerEntryInput {
  if (
    !canReverseLedgerEntry(
      original
    )
  ) {
    throw new Error(
      "Only finalized, unreversed ledger entries may be reversed."
    );
  }

  return {
    ledgerAccountId:
      original.ledgerAccountId,

    organizationId:
      original.organizationId,

    campaignId:
      original.campaignId,

    invoiceId:
      original.invoiceId,

    paymentId:
      original.paymentId,

    refundId:
      original.refundId,

    settlementId:
      original.settlementId,

    type:
      original.type,

    direction:
      original.direction ===
        "credit"
        ? "debit"
        : "credit",

    balanceCategory:
      original.balanceCategory,

    amountMinor:
      Math.abs(
        original.amount
          .amountMinor
      ),

    currency:
      original.amount.currency,

    description:
      input.description,

    source:
      original.source,

    references: [
      ...original.references,
    ],

    idempotencyKey:
      input.idempotencyKey,

    reversesEntryId:
      original.id,

    createdBy:
      input.createdBy,

    occurredAt:
      input.occurredAt,
  };
}
