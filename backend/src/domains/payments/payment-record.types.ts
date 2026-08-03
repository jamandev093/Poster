import type {
  MoneyAmount,
  PaymentCurrencyCode,
  PaymentProvider,
} from "./payment.types.js";

export const PAYMENT_RECORD_STATUSES = [
  "created",
  "authorized",
  "captured",
  "failed",
  "partially_refunded",
  "refunded",
  "disputed",
] as const;

export type PaymentRecordStatus =
  (typeof PAYMENT_RECORD_STATUSES)[number];

export interface AdvertiserPaymentRecord {
  id: string;
  organizationId: string;
  walletId: string | null;
  fundingOrderId: string | null;
  invoiceId: string | null;
  campaignId: string | null;
  provider: PaymentProvider;
  providerOrderId: string | null;
  providerPaymentId: string | null;
  providerSignatureDigest: string | null;
  status: PaymentRecordStatus;
  amount: MoneyAmount;
  captured: MoneyAmount;
  refunded: MoneyAmount;
  methodDetails: Record<string, unknown>;
  providerPayload: Record<string, unknown>;
  webhookVerifiedAt: Date | null;
  paidAt: Date | null;
  failedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  rowVersion: string;
}

export interface CreateAdvertiserPaymentInput {
  organizationId: string;
  walletId?: string | null;
  fundingOrderId?: string | null;
  invoiceId?: string | null;
  campaignId?: string | null;
  provider: PaymentProvider;
  providerOrderId?: string | null;
  providerPaymentId?: string | null;
  providerSignatureDigest?: string | null;
  status: PaymentRecordStatus;
  amountMinorUnits: bigint;
  capturedMinorUnits?: bigint;
  refundedMinorUnits?: bigint;
  currency: PaymentCurrencyCode;
  methodDetails?: Record<string, unknown>;
  providerPayload?: Record<string, unknown>;
  webhookVerifiedAt?: Date | null;
  paidAt?: Date | null;
  failedAt?: Date | null;
}