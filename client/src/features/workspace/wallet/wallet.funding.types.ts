import type {
  OrganizationId,
} from "../advertising/advertising.types";

import type {
  SupportedCurrency,
} from "../payments/currency.types";

import type {
  AdvertiserWalletId,
} from "./wallet.types";

/**
 * Wallet funding order contracts.
 *
 * The Client may request a funding order, but:
 *
 * - Backend determines the authoritative organization;
 * - Backend validates the amount;
 * - Backend creates the Razorpay order;
 * - Backend returns only the public Checkout configuration;
 * - verified webhooks remain the financial source of truth.
 */

export type WalletFundingOrderId =
  `WFO-${string}`;

export type WalletFundingOrderStatus =
  | "created"
  | "checkout_opened"
  | "payment_submitted"
  | "verification_pending"
  | "verified"
  | "failed"
  | "expired"
  | "cancelled";

export interface CreateWalletFundingOrderInput {
  walletId:
    AdvertiserWalletId;

  organizationId:
    OrganizationId;

  currency:
    SupportedCurrency;

  amountMinor:
    number;
}

export interface WalletFundingCheckoutOrder {
  fundingOrderId:
    WalletFundingOrderId;

  walletId:
    AdvertiserWalletId;

  organizationId:
    OrganizationId;

  status:
    WalletFundingOrderStatus;

  currency:
    SupportedCurrency;

  amountMinor:
    number;

  provider:
    "razorpay";

  providerOrderId:
    string;

  publicKeyId:
    string;

  checkoutName:
    string;

  checkoutDescription:
    string;

  customerName?:
    string;

  customerEmail?:
    string;

  customerPhone?:
    string;

  expiresAt:
    string;

  createdAt:
    string;
}

export interface WalletFundingRequestState {
  status:
    | "idle"
    | "submitting"
    | "ready"
    | "error";

  order?:
    WalletFundingCheckoutOrder;

  errorMessage?:
    string;
}

export const WALLET_FUNDING_PRESET_AMOUNTS_MINOR = [
  1000000,
  2500000,
  5000000,
  10000000,
] as const;

export const WALLET_FUNDING_MINIMUM_MINOR =
  10000;

export const WALLET_FUNDING_MAXIMUM_MINOR =
  100000000;

export function validateWalletFundingAmount(
  amountMinor:
    number
): string | null {
  if (
    !Number.isSafeInteger(
      amountMinor
    )
  ) {
    return "Enter a valid whole amount.";
  }

  if (
    amountMinor <
    WALLET_FUNDING_MINIMUM_MINOR
  ) {
    return "The minimum Wallet funding amount is 100.";
  }

  if (
    amountMinor >
    WALLET_FUNDING_MAXIMUM_MINOR
  ) {
    return "The maximum Wallet funding amount for one transaction is 10,00,000.";
  }

  return null;
}