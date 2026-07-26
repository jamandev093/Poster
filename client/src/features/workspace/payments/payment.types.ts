import type {
  AdvertisingActorReference,
  AdvertisingRequestId,
  CampaignId,
  OrganizationId,
} from "../advertising/advertising.types";

import type {
  MoneyAmount,
  SupportedCurrency,
} from "./currency.types";

/**
 * Canonical advertiser-payment contracts.
 *
 * Poster v1 payment provider:
 *
 * - Razorpay only
 * - Stripe excluded
 * - PayPal excluded
 *
 * Payment confirmation must come from a verified Backend
 * webhook. Browser checkout callbacks are never authoritative.
 */

export type PaymentId =
  `PAY-${string}`;

export type PaymentOrderId =
  `ORD-${string}`;

export type PaymentAttemptId =
  `PAT-${string}`;

export type PaymentProviderEventId =
  `PWE-${string}`;

export type InvoiceId =
  `INV-${string}`;

export type ReceiptId =
  `RCT-${string}`;

export type PaymentProvider =
  | "razorpay"
  | "manual_bank_transfer";

export type PaymentPurpose =
  | "campaign_funding"
  | "invoice_payment"
  | "balance_top_up"
  | "approved_adjustment";

export type PaymentMethod =
  | "upi"
  | "card"
  | "netbanking"
  | "bank_transfer"
  | "wallet"
  | "unknown";

export type CardNetwork =
  | "visa"
  | "mastercard"
  | "rupay"
  | "amex"
  | "other";

export type PaymentStatus =
  | "created"
  | "pending"
  | "authorized"
  | "captured"
  | "paid"
  | "partially_paid"
  | "failed"
  | "cancelled"
  | "expired"
  | "refund_pending"
  | "partially_refunded"
  | "refunded"
  | "disputed";

export type PaymentAttemptStatus =
  | "created"
  | "checkout_opened"
  | "processing"
  | "authorized"
  | "captured"
  | "failed"
  | "cancelled"
  | "timed_out";

export type WebhookVerificationStatus =
  | "not_received"
  | "received"
  | "verified"
  | "rejected"
  | "duplicate";

export type PaymentRiskStatus =
  | "not_evaluated"
  | "accepted"
  | "manual_review"
  | "rejected";

export type PaymentChannel =
  | "client_web"
  | "admin_web"
  | "manual_operations"
  | "backend";

export interface PaymentMethodDetails {
  method:
    PaymentMethod;

  cardNetwork?:
    CardNetwork;

  cardLastFour?:
    string;

  cardIssuer?:
    string;

  cardCountryCode?:
    string;

  upiHandleMasked?:
    string;

  bankName?:
    string;

  international:
    boolean;
}

export interface RazorpayOrderReference {
  provider:
    "razorpay";

  /**
   * Provider-generated Razorpay order ID.
   */
  providerOrderId:
    string;

  providerReceiptReference:
    string;

  checkoutKeyId:
    string;

  createdAt:
    string;

  expiresAt?:
    string;
}

export interface ManualBankTransferReference {
  provider:
    "manual_bank_transfer";

  bankReference?:
    string;

  transferDate?:
    string;

  proofDocumentId?:
    string;

  reconciliationNote?:
    string;
}

export type PaymentOrderProviderReference =
  | RazorpayOrderReference
  | ManualBankTransferReference;

export interface AdvertiserPaymentOrder {
  id:
    PaymentOrderId;

  organizationId:
    OrganizationId;

  requestId?:
    AdvertisingRequestId;

  campaignId?:
    CampaignId;

  invoiceId:
    InvoiceId;

  purpose:
    PaymentPurpose;

  amount:
    MoneyAmount;

  provider:
    PaymentProvider;

  providerReference:
    PaymentOrderProviderReference;

  status:
    PaymentStatus;

  channel:
    PaymentChannel;

  idempotencyKey:
    string;

  createdBy:
    AdvertisingActorReference;

  createdAt:
    string;

  updatedAt:
    string;

  expiresAt?:
    string;
}

export interface PaymentAttempt {
  id:
    PaymentAttemptId;

  paymentOrderId:
    PaymentOrderId;

  organizationId:
    OrganizationId;

  provider:
    PaymentProvider;

  status:
    PaymentAttemptStatus;

  amount:
    MoneyAmount;

  methodDetails?:
    PaymentMethodDetails;

  providerPaymentId?:
    string;

  providerErrorCode?:
    string;

  providerErrorDescription?:
    string;

  checkoutOpenedAt?:
    string;

  authorizedAt?:
    string;

  capturedAt?:
    string;

  failedAt?:
    string;

  createdAt:
    string;

  updatedAt:
    string;
}

export interface PaymentWebhookVerification {
  provider:
    PaymentProvider;

  providerEventId:
    string;

  internalEventId:
    PaymentProviderEventId;

  paymentOrderId?:
    PaymentOrderId;

  paymentId?:
    PaymentId;

  verificationStatus:
    WebhookVerificationStatus;

  signatureHeaderPresent:
    boolean;

  signatureVerified:
    boolean;

  duplicate:
    boolean;

  eventType:
    string;

  receivedAt:
    string;

  verifiedAt?:
    string;

  rejectionReason?:
    string;
}

export interface AdvertiserPayment {
  id:
    PaymentId;

  organizationId:
    OrganizationId;

  requestId?:
    AdvertisingRequestId;

  campaignId?:
    CampaignId;

  invoiceId:
    InvoiceId;

  paymentOrderId:
    PaymentOrderId;

  purpose:
    PaymentPurpose;

  provider:
    PaymentProvider;

  status:
    PaymentStatus;

  amount:
    MoneyAmount;

  capturedAmount:
    MoneyAmount;

  refundedAmount:
    MoneyAmount;

  methodDetails:
    PaymentMethodDetails;

  providerPaymentId?:
    string;

  providerOrderId?:
    string;

  webhookVerification:
    PaymentWebhookVerification;

  riskStatus:
    PaymentRiskStatus;

  receiptId?:
    ReceiptId;

  authorizedAt?:
    string;

  capturedAt?:
    string;

  paidAt?:
    string;

  failedAt?:
    string;

  cancelledAt?:
    string;

  createdAt:
    string;

  updatedAt:
    string;
}

export interface PaymentConfirmationResult {
  paymentId:
    PaymentId;

  paymentOrderId:
    PaymentOrderId;

  invoiceId:
    InvoiceId;

  organizationId:
    OrganizationId;

  status:
    PaymentStatus;

  paymentVerified:
    boolean;

  balanceEligibleForCredit:
    boolean;

  confirmedAmount:
    MoneyAmount;

  confirmedAt:
    string;

  warningMessages:
    string[];
}

export interface CreatePaymentOrderInput {
  organizationId:
    OrganizationId;

  requestId?:
    AdvertisingRequestId;

  campaignId?:
    CampaignId;

  invoiceId:
    InvoiceId;

  purpose:
    PaymentPurpose;

  amount:
    MoneyAmount;

  provider:
    PaymentProvider;

  idempotencyKey:
    string;

  requestedBy:
    AdvertisingActorReference;
}

export interface PaymentStatusSummary {
  status:
    PaymentStatus;

  paymentVerified:
    boolean;

  captured:
    boolean;

  refundable:
    boolean;

  terminal:
    boolean;
}

export function getPaymentStatusSummary(
  status:
    PaymentStatus
): PaymentStatusSummary {
  switch (status) {
    case "created":
    case "pending":
    case "authorized":
      return {
        status,
        paymentVerified:
          false,
        captured:
          false,
        refundable:
          false,
        terminal:
          false,
      };

    case "captured":
    case "paid":
      return {
        status,
        paymentVerified:
          true,
        captured:
          true,
        refundable:
          true,
        terminal:
          false,
      };

    case "partially_paid":
      return {
        status,
        paymentVerified:
          true,
        captured:
          true,
        refundable:
          true,
        terminal:
          false,
      };

    case "refund_pending":
    case "partially_refunded":
      return {
        status,
        paymentVerified:
          true,
        captured:
          true,
        refundable:
          true,
        terminal:
          false,
      };

    case "refunded":
      return {
        status,
        paymentVerified:
          true,
        captured:
          true,
        refundable:
          false,
        terminal:
          true,
      };

    case "failed":
    case "cancelled":
    case "expired":
      return {
        status,
        paymentVerified:
          false,
        captured:
          false,
        refundable:
          false,
        terminal:
          true,
      };

    case "disputed":
      return {
        status,
        paymentVerified:
          true,
        captured:
          true,
        refundable:
          false,
        terminal:
          false,
      };
  }
}

export function isPaymentVerified(
  payment:
    AdvertiserPayment
): boolean {
  return (
    payment.webhookVerification
      .verificationStatus ===
      "verified" &&
    payment.webhookVerification
      .signatureVerified &&
    (
      payment.status ===
        "captured" ||
      payment.status ===
        "paid" ||
      payment.status ===
        "partially_paid" ||
      payment.status ===
        "refund_pending" ||
      payment.status ===
        "partially_refunded" ||
      payment.status ===
        "refunded" ||
      payment.status ===
        "disputed"
    )
  );
}

export function isPaymentEligibleForBalanceCredit(
  payment:
    AdvertiserPayment
): boolean {
  return (
    isPaymentVerified(
      payment
    ) &&
    payment.riskStatus ===
      "accepted" &&
    payment.capturedAmount
      .currency ===
      payment.amount.currency &&
    payment.capturedAmount
      .amountMinor >
      0
  );
}

export function getRemainingRefundableAmountMinor(
  payment:
    AdvertiserPayment
): number {
  if (
    payment.capturedAmount
      .currency !==
      payment.refundedAmount
        .currency
  ) {
    throw new Error(
      "Captured and refunded payment currencies must match."
    );
  }

  return Math.max(
    payment.capturedAmount
      .amountMinor -
      payment.refundedAmount
        .amountMinor,
    0
  );
}

export function isPaymentCurrencySupported(
  currency:
    string
): currency is SupportedCurrency {
  return (
    currency === "INR" ||
    currency === "USD"
  );
}
