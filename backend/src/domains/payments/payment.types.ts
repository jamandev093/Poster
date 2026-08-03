export const PAYMENT_CURRENCY_CODES = ["INR"] as const;
export type PaymentCurrencyCode = (typeof PAYMENT_CURRENCY_CODES)[number];

export const PAYMENT_PROVIDERS = ["razorpay"] as const;
export type PaymentProvider = (typeof PAYMENT_PROVIDERS)[number];

export const WALLET_STATUSES = [
  "active",
  "frozen",
  "closed",
] as const;

export type WalletStatus = (typeof WALLET_STATUSES)[number];

export const WALLET_FUNDING_ORDER_STATUSES = [
  "created",
  "pending_provider",
  "pending_verification",
  "credited",
  "failed",
  "expired",
  "cancelled",
] as const;

export type WalletFundingOrderStatus =
  (typeof WALLET_FUNDING_ORDER_STATUSES)[number];

export const LEDGER_ENTRY_TYPES = [
  "opening_balance",
  "wallet_funding_pending",
  "payment_credit",
  "manual_payment_credit",
  "campaign_reservation",
  "campaign_spend",
  "campaign_release",
  "refund_reservation",
  "refund_debit",
  "refund_release",
  "adjustment_credit",
  "adjustment_debit",
] as const;

export type LedgerEntryType =
  (typeof LEDGER_ENTRY_TYPES)[number];

export const LEDGER_ENTRY_DIRECTIONS = [
  "credit",
  "debit",
  "neutral",
] as const;

export type LedgerEntryDirection =
  (typeof LEDGER_ENTRY_DIRECTIONS)[number];

export const LEDGER_ENTRY_STATUSES = [
  "pending",
  "posted",
  "voided",
  "reversed",
] as const;

export type LedgerEntryStatus =
  (typeof LEDGER_ENTRY_STATUSES)[number];

export interface PaymentValidationError {
  field: string;
  message: string;
}

export interface MoneyAmount {
  minorUnits: bigint;
  currency: PaymentCurrencyCode;
}

export interface AdvertiserWalletRecord {
  id: string;
  organizationId: string;
  currency: PaymentCurrencyCode;
  status: WalletStatus;
  availableBalance: MoneyAmount;
  reservedBalance: MoneyAmount;
  totalCredited: MoneyAmount;
  totalSpent: MoneyAmount;
  totalRefunded: MoneyAmount;
  createdAt: Date;
  updatedAt: Date;
  rowVersion: string;
}

export interface CreateAdvertiserWalletInput {
  organizationId: string;
  currency: PaymentCurrencyCode;
}

export interface CreateWalletFundingOrderInput {
  organizationId: string;
  walletId: string;
  amountMinorUnits: bigint;
  currency: PaymentCurrencyCode;
  provider: PaymentProvider;
  actorUserId: string;
  idempotencyKey: string;
}

export interface CreateLedgerEntryInput {
  organizationId: string;
  walletId: string;
  entryType: LedgerEntryType;
  direction: LedgerEntryDirection;
  amountMinorUnits: bigint;
  currency: PaymentCurrencyCode;
  balanceBeforeMinorUnits: bigint;
  balanceAfterMinorUnits: bigint;
  idempotencyKey: string;
  actorUserId: string;
  campaignId?: string | null;
  invoiceId?: string | null;
  paymentId?: string | null;
  refundId?: string | null;
  providerReference?: string | null;
}

export interface CreateAdvertiserWalletLedgerEntryInput
  extends CreateLedgerEntryInput {
  fundingOrderId?: string | null;
  allocationId?: string | null;
  metadata?: Record<string, unknown>;
}

export interface AdvertiserWalletLedgerEntryRecord {
  id: string;
  organizationId: string;
  walletId: string;
  fundingOrderId: string | null;
  campaignId: string | null;
  allocationId: string | null;
  invoiceId: string | null;
  paymentId: string | null;
  refundId: string | null;
  entryType: LedgerEntryType;
  direction: LedgerEntryDirection;
  status: LedgerEntryStatus;
  amount: MoneyAmount;
  balanceBefore: MoneyAmount;
  balanceAfter: MoneyAmount;
  idempotencyKey: string;
  providerReference: string | null;
  metadata: Record<string, unknown>;
  createdByUserId: string;
  createdAt: Date;
  rowVersion: string;
}