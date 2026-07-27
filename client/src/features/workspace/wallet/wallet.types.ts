import type {
  OrganizationId,
} from "../advertising/advertising.types";

import type {
  CampaignId,
} from "../advertising/advertising.types";

import type {
  SupportedCurrency,
} from "../payments/currency.types";

/**
 * Canonical closed-loop advertiser Wallet contracts.
 *
 * Poster Wallet is not a consumer banking wallet.
 *
 * It represents advertiser funds that may be:
 *
 * - added through verified Razorpay payments;
 * - held while payment verification is pending;
 * - available for campaign allocation;
 * - reserved for approved campaigns;
 * - consumed through finalized campaign delivery;
 * - released when campaigns end;
 * - reserved or removed through refunds.
 *
 * Backend ledger entries remain authoritative.
 */

export type AdvertiserWalletId =
  `WLT-${string}`;

export type WalletTransactionId =
  `WTX-${string}`;

export type CampaignAllowanceId =
  `CAL-${string}`;

export type AdvertiserWalletStatus =
  | "active"
  | "restricted"
  | "blocked"
  | "closed";

export type WalletTransactionType =
  | "funds_added"
  | "funds_pending"
  | "campaign_allowance_reserved"
  | "campaign_allowance_released"
  | "campaign_spend"
  | "invalid_traffic_credit"
  | "refund_reserved"
  | "refund_completed"
  | "refund_reversed"
  | "manual_credit"
  | "manual_debit";

export type WalletTransactionDirection =
  | "credit"
  | "debit"
  | "hold"
  | "release";

export type WalletTransactionStatus =
  | "pending"
  | "verified"
  | "finalized"
  | "failed"
  | "cancelled"
  | "reversed";

export type CampaignAllowanceStatus =
  | "requested"
  | "pending_approval"
  | "reserved"
  | "partially_consumed"
  | "consumed"
  | "released"
  | "cancelled";

export interface AdvertiserWalletAmounts {
  currency:
    SupportedCurrency;

  totalFundedMinor:
    number;

  pendingVerificationMinor:
    number;

  availableMinor:
    number;

  reservedMinor:
    number;

  finalizedSpendMinor:
    number;

  refundReservedMinor:
    number;

  refundedMinor:
    number;

  creditMinor:
    number;

  debitMinor:
    number;
}

export interface CampaignAllowance {
  id:
    CampaignAllowanceId;

  walletId:
    AdvertiserWalletId;

  organizationId:
    OrganizationId;

  campaignId?:
    CampaignId;

  requestId?:
    string;

  status:
    CampaignAllowanceStatus;

  currency:
    SupportedCurrency;

  requestedMinor:
    number;

  reservedMinor:
    number;

  consumedMinor:
    number;

  releasedMinor:
    number;

  remainingMinor:
    number;

  requestedAt:
    string;

  reservedAt?:
    string;

  releasedAt?:
    string;

  updatedAt:
    string;
}

export interface WalletTransaction {
  id:
    WalletTransactionId;

  walletId:
    AdvertiserWalletId;

  organizationId:
    OrganizationId;

  campaignId?:
    CampaignId;

  requestId?:
    string;

  paymentId?:
    string;

  refundId?:
    string;

  ledgerEntryId?:
    string;

  type:
    WalletTransactionType;

  direction:
    WalletTransactionDirection;

  status:
    WalletTransactionStatus;

  currency:
    SupportedCurrency;

  amountMinor:
    number;

  description:
    string;

  occurredAt:
    string;
}

export interface AdvertiserWallet {
  id:
    AdvertiserWalletId;

  organizationId:
    OrganizationId;

  status:
    AdvertiserWalletStatus;

  currency:
    SupportedCurrency;

  amounts:
    AdvertiserWalletAmounts;

  allowances:
    CampaignAllowance[];

  transactions:
    WalletTransaction[];

  updatedAt:
    string;
}

export interface WalletSummary {
  walletId:
    AdvertiserWalletId;

  organizationId:
    OrganizationId;

  status:
    AdvertiserWalletStatus;

  currency:
    SupportedCurrency;

  totalFundedMinor:
    number;

  pendingVerificationMinor:
    number;

  availableMinor:
    number;

  reservedMinor:
    number;

  finalizedSpendMinor:
    number;

  refundReservedMinor:
    number;

  refundedMinor:
    number;

  activeAllowanceCount:
    number;

  updatedAt:
    string;
}

export interface RequestCampaignAllowanceInput {
  organizationId:
    OrganizationId;

  requestId:
    string;

  currency:
    SupportedCurrency;

  requestedMinor:
    number;
}

export function assertValidWalletAmount(
  amountMinor:
    number,
  label:
    string
): void {
  if (
    !Number.isSafeInteger(
      amountMinor
    ) ||
    amountMinor < 0
  ) {
    throw new Error(
      `${label} must be a non-negative safe integer in minor units.`
    );
  }
}

export function canRequestCampaignAllowance(
  availableMinor:
    number,
  requestedMinor:
    number
): boolean {
  assertValidWalletAmount(
    availableMinor,
    "Available Wallet amount"
  );

  assertValidWalletAmount(
    requestedMinor,
    "Requested campaign allowance"
  );

  return (
    requestedMinor > 0 &&
    requestedMinor <=
      availableMinor
  );
}

export function calculateBalanceAfterAllowance(
  availableMinor:
    number,
  requestedMinor:
    number
): number {
  if (
    !canRequestCampaignAllowance(
      availableMinor,
      requestedMinor
    )
  ) {
    return availableMinor;
  }

  return (
    availableMinor -
    requestedMinor
  );
}

export function createWalletSummary(
  wallet:
    AdvertiserWallet
): WalletSummary {
  const activeAllowanceCount =
    wallet.allowances.filter(
      (
        allowance
      ) =>
        allowance.status ===
          "reserved" ||
        allowance.status ===
          "partially_consumed"
    ).length;

  return {
    walletId:
      wallet.id,

    organizationId:
      wallet.organizationId,

    status:
      wallet.status,

    currency:
      wallet.currency,

    totalFundedMinor:
      wallet.amounts
        .totalFundedMinor,

    pendingVerificationMinor:
      wallet.amounts
        .pendingVerificationMinor,

    availableMinor:
      wallet.amounts
        .availableMinor,

    reservedMinor:
      wallet.amounts
        .reservedMinor,

    finalizedSpendMinor:
      wallet.amounts
        .finalizedSpendMinor,

    refundReservedMinor:
      wallet.amounts
        .refundReservedMinor,

    refundedMinor:
      wallet.amounts
        .refundedMinor,

    activeAllowanceCount,

    updatedAt:
      wallet.updatedAt,
  };
}