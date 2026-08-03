import type {
  MoneyAmount,
  PaymentCurrencyCode,
  PaymentProvider,
} from "./payment.types.js";

export const REFUND_RECORD_STATUSES = [
  "requested",
  "approved",
  "provider_pending",
  "partially_refunded",
  "refunded",
  "failed",
  "cancelled",
] as const;

export type RefundRecordStatus =
  (typeof REFUND_RECORD_STATUSES)[number];

export interface AdvertiserRefundRecord {
  id: string;
  organizationId: string;
  paymentId: string;
  invoiceId: string | null;
  campaignId: string | null;
  requestedByUserId: string | null;
  approvedByUserId: string | null;
  provider: PaymentProvider;
  providerRefundId: string | null;
  reason: string;
  status: RefundRecordStatus;
  requestedAmount: MoneyAmount;
  approvedAmount: MoneyAmount | null;
  refundedAmount: MoneyAmount;
  providerPayload: Record<string, unknown>;
  requestedAt: Date;
  approvedAt: Date | null;
  refundedAt: Date | null;
  failedAt: Date | null;
  cancelledAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  rowVersion: string;
}

export interface CreateAdvertiserRefundInput {
  organizationId: string;
  paymentId: string;
  invoiceId?: string | null;
  campaignId?: string | null;
  requestedByUserId?: string | null;
  provider: PaymentProvider;
  reason: string;
  requestedAmountMinorUnits: bigint;
  currency: PaymentCurrencyCode;
  providerPayload?: Record<string, unknown>;
}

export interface ApproveAdvertiserRefundInput {
  refundId: string;
  approvedByUserId: string;
  approvedAmountMinorUnits: bigint;
  approvedAt: Date;
  expectedRowVersion: string;
}

export interface AttachProviderRefundReferenceInput {
  refundId: string;
  providerRefundId: string;
  providerPayload: Record<string, unknown>;
  expectedRowVersion: string;
}