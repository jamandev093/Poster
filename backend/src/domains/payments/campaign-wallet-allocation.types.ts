import type {
  MoneyAmount,
  PaymentCurrencyCode,
} from "./payment.types.js";

export const CAMPAIGN_WALLET_ALLOCATION_STATUSES = [
  "active",
  "paused",
  "exhausted",
  "released",
  "cancelled",
] as const;

export type CampaignWalletAllocationStatus =
  (typeof CAMPAIGN_WALLET_ALLOCATION_STATUSES)[number];

export interface CampaignWalletAllocationRecord {
  id: string;
  organizationId: string;
  walletId: string;
  campaignId: string;
  currency: PaymentCurrencyCode;
  status: CampaignWalletAllocationStatus;
  allocated: MoneyAmount;
  reserved: MoneyAmount;
  spent: MoneyAmount;
  released: MoneyAmount;
  refunded: MoneyAmount;
  createdByUserId: string;
  createdAt: Date;
  updatedAt: Date;
  rowVersion: string;
}

export interface CreateCampaignWalletAllocationInput {
  organizationId: string;
  walletId: string;
  campaignId: string;
  currency: PaymentCurrencyCode;
  allocatedMinorUnits: bigint;
  createdByUserId: string;
}

export interface UpdateCampaignWalletAllocationAmountsInput {
  allocationId: string;
  status: CampaignWalletAllocationStatus;
  reservedMinorUnits: bigint;
  spentMinorUnits: bigint;
  releasedMinorUnits: bigint;
  refundedMinorUnits: bigint;
  expectedRowVersion: string;
}