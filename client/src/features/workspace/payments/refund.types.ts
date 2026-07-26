import type {
  AdvertisingActorReference,
  CampaignId,
  OrganizationId,
} from "../advertising/advertising.types";

import type {
  MoneyAmount,
} from "./currency.types";

import type {
  InvoiceId,
  PaymentId,
  PaymentProvider,
  PaymentProviderEventId,
  WebhookVerificationStatus,
} from "./payment.types";

/**
 * Canonical advertiser-refund contracts.
 *
 * Poster v1 refund policy:
 *
 * - Razorpay is the primary automated refund provider.
 * - Refunds return to the original payment method.
 * - Full and partial refunds are supported.
 * - Browser callbacks are never authoritative.
 * - Provider responses and signed webhooks must be verified.
 * - Only approved refundable value may be refunded.
 * - Finalized valid delivery is not automatically refundable.
 *
 * Ledger mutations and campaign-balance updates belong to
 * separate payment-domain modules.
 */

export type RefundId =
  `RFD-${string}`;

export type RefundRequestId =
  `RFR-${string}`;

export type RefundProviderEventId =
  `RWE-${string}`;

export type RefundAdjustmentId =
  `RAD-${string}`;

export type RefundReason =
  | "unused_campaign_balance"
  | "invalid_traffic_credit"
  | "duplicate_charge"
  | "campaign_cancelled"
  | "campaign_under_delivery"
  | "contract_adjustment"
  | "payment_error"
  | "billing_correction"
  | "goodwill"
  | "other";

export type RefundStatus =
  | "requested"
  | "under_review"
  | "approved"
  | "rejected"
  | "processing"
  | "partially_refunded"
  | "refunded"
  | "failed"
  | "cancelled";

export type RefundExecutionMode =
  | "normal"
  | "instant"
  | "manual";

export type RefundApprovalDecision =
  | "approved"
  | "partially_approved"
  | "rejected";

export type RefundFailureCategory =
  | "provider_rejected"
  | "payment_not_refundable"
  | "amount_exceeds_refundable"
  | "currency_mismatch"
  | "duplicate_request"
  | "invalid_payment_state"
  | "webhook_verification_failed"
  | "manual_reconciliation_required"
  | "technical_failure"
  | "other";

export interface RefundEligibilityBreakdown {
  paymentCapturedAmount:
    MoneyAmount;

  previouslyRefundedAmount:
    MoneyAmount;

  unusedCampaignBalance:
    MoneyAmount;

  invalidTrafficCredit:
    MoneyAmount;

  approvedContractRefund:
    MoneyAmount;

  nonRefundableFinalizedSpend:
    MoneyAmount;

  maximumRefundableAmount:
    MoneyAmount;

  evaluatedAt:
    string;

  warningMessages:
    string[];
}

export interface RefundSupportingReference {
  type:
    | "invoice"
    | "payment"
    | "campaign"
    | "analytics_adjustment"
    | "contract"
    | "support_case"
    | "other";

  referenceId:
    string;

  description?:
    string;
}

export interface AdvertiserRefundRequest {
  id:
    RefundRequestId;

  organizationId:
    OrganizationId;

  campaignId?:
    CampaignId;

  invoiceId:
    InvoiceId;

  paymentId:
    PaymentId;

  reason:
    RefundReason;

  requestedAmount:
    MoneyAmount;

  explanation:
    string;

  supportingReferences:
    RefundSupportingReference[];

  status:
    RefundStatus;

  requestedBy:
    AdvertisingActorReference;

  requestedAt:
    string;

  updatedAt:
    string;

  cancelledAt?:
    string;
}

export interface RefundReview {
  refundRequestId:
    RefundRequestId;

  decision:
    RefundApprovalDecision;

  eligibility:
    RefundEligibilityBreakdown;

  requestedAmount:
    MoneyAmount;

  approvedAmount:
    MoneyAmount;

  reviewNote:
    string;

  reviewedBy:
    AdvertisingActorReference;

  reviewedAt:
    string;
}

export interface RefundProviderReference {
  provider:
    PaymentProvider;

  providerRefundId?:
    string;

  providerPaymentId?:
    string;

  providerStatus?:
    string;

  providerSpeed?:
    string;

  providerReceiptReference?:
    string;

  providerCreatedAt?:
    string;
}

export interface RefundWebhookVerification {
  provider:
    PaymentProvider;

  internalEventId:
    RefundProviderEventId;

  paymentProviderEventId?:
    PaymentProviderEventId;

  providerEventId:
    string;

  refundId?:
    RefundId;

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

export interface AdvertiserRefund {
  id:
    RefundId;

  refundRequestId:
    RefundRequestId;

  organizationId:
    OrganizationId;

  campaignId?:
    CampaignId;

  invoiceId:
    InvoiceId;

  paymentId:
    PaymentId;

  reason:
    RefundReason;

  status:
    RefundStatus;

  executionMode:
    RefundExecutionMode;

  requestedAmount:
    MoneyAmount;

  approvedAmount:
    MoneyAmount;

  refundedAmount:
    MoneyAmount;

  provider:
    PaymentProvider;

  providerReference:
    RefundProviderReference;

  webhookVerification?:
    RefundWebhookVerification;

  approvedBy:
    AdvertisingActorReference;

  processedBy?:
    AdvertisingActorReference;

  failureCategory?:
    RefundFailureCategory;

  failureCode?:
    string;

  failureMessage?:
    string;

  approvedAt:
    string;

  processingAt?:
    string;

  refundedAt?:
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

export interface CreateRefundRequestInput {
  organizationId:
    OrganizationId;

  campaignId?:
    CampaignId;

  invoiceId:
    InvoiceId;

  paymentId:
    PaymentId;

  reason:
    RefundReason;

  requestedAmount:
    MoneyAmount;

  explanation:
    string;

  supportingReferences?:
    RefundSupportingReference[];

  requestedBy:
    AdvertisingActorReference;
}

export interface ExecuteRefundInput {
  refundRequestId:
    RefundRequestId;

  paymentId:
    PaymentId;

  approvedAmount:
    MoneyAmount;

  executionMode:
    RefundExecutionMode;

  provider:
    PaymentProvider;

  idempotencyKey:
    string;

  approvedBy:
    AdvertisingActorReference;
}

export interface RefundStatusSummary {
  status:
    RefundStatus;

  pending:
    boolean;

  approved:
    boolean;

  processing:
    boolean;

  completed:
    boolean;

  failed:
    boolean;

  terminal:
    boolean;
}

function assertNonNegativeMoney(
  amount:
    MoneyAmount,
  label:
    string
): void {
  if (
    !Number.isSafeInteger(
      amount.amountMinor
    ) ||
    amount.amountMinor < 0
  ) {
    throw new Error(
      `${label} must be a non-negative safe integer in minor units.`
    );
  }
}

function assertMatchingCurrency(
  first:
    MoneyAmount,
  second:
    MoneyAmount,
  label:
    string
): void {
  if (
    first.currency !==
    second.currency
  ) {
    throw new Error(
      `${label} currency mismatch.`
    );
  }
}

export function calculateMaximumRefundableAmountMinor(
  input: {
    capturedAmountMinor:
      number;

    previouslyRefundedAmountMinor:
      number;

    unusedCampaignBalanceMinor:
      number;

    invalidTrafficCreditMinor:
      number;

    approvedContractRefundMinor:
      number;
  }
): number {
  const values = [
    input.capturedAmountMinor,
    input.previouslyRefundedAmountMinor,
    input.unusedCampaignBalanceMinor,
    input.invalidTrafficCreditMinor,
    input.approvedContractRefundMinor,
  ];

  if (
    values.some(
      (
        value
      ) =>
        !Number.isSafeInteger(
          value
        ) ||
        value < 0
    )
  ) {
    throw new Error(
      "Refund calculations require non-negative safe integers in minor units."
    );
  }

  const remainingCapturedAmount =
    Math.max(
      input.capturedAmountMinor -
        input.previouslyRefundedAmountMinor,
      0
    );

  const approvedRefundSources =
    input.unusedCampaignBalanceMinor +
    input.invalidTrafficCreditMinor +
    input.approvedContractRefundMinor;

  return Math.min(
    remainingCapturedAmount,
    approvedRefundSources
  );
}

export function validateRefundEligibilityBreakdown(
  eligibility:
    RefundEligibilityBreakdown
): void {
  const amounts = [
    {
      label:
        "Payment captured amount",
      value:
        eligibility
          .paymentCapturedAmount,
    },
    {
      label:
        "Previously refunded amount",
      value:
        eligibility
          .previouslyRefundedAmount,
    },
    {
      label:
        "Unused campaign balance",
      value:
        eligibility
          .unusedCampaignBalance,
    },
    {
      label:
        "Invalid-traffic credit",
      value:
        eligibility
          .invalidTrafficCredit,
    },
    {
      label:
        "Approved contract refund",
      value:
        eligibility
          .approvedContractRefund,
    },
    {
      label:
        "Non-refundable finalized spend",
      value:
        eligibility
          .nonRefundableFinalizedSpend,
    },
    {
      label:
        "Maximum refundable amount",
      value:
        eligibility
          .maximumRefundableAmount,
    },
  ];

  const baseCurrency =
    eligibility
      .paymentCapturedAmount
      .currency;

  amounts.forEach(
    (
      entry
    ) => {
      assertNonNegativeMoney(
        entry.value,
        entry.label
      );

      if (
        entry.value.currency !==
        baseCurrency
      ) {
        throw new Error(
          "All refund eligibility amounts must use the same currency."
        );
      }
    }
  );

  const expectedMaximum =
    calculateMaximumRefundableAmountMinor({
      capturedAmountMinor:
        eligibility
          .paymentCapturedAmount
          .amountMinor,

      previouslyRefundedAmountMinor:
        eligibility
          .previouslyRefundedAmount
          .amountMinor,

      unusedCampaignBalanceMinor:
        eligibility
          .unusedCampaignBalance
          .amountMinor,

      invalidTrafficCreditMinor:
        eligibility
          .invalidTrafficCredit
          .amountMinor,

      approvedContractRefundMinor:
        eligibility
          .approvedContractRefund
          .amountMinor,
    });

  if (
    eligibility
      .maximumRefundableAmount
      .amountMinor !==
    expectedMaximum
  ) {
    throw new Error(
      "Maximum refundable amount does not match the approved refund sources."
    );
  }
}

export function canApproveRefundAmount(
  requestedAmount:
    MoneyAmount,
  approvedAmount:
    MoneyAmount,
  eligibility:
    RefundEligibilityBreakdown
): boolean {
  assertMatchingCurrency(
    requestedAmount,
    approvedAmount,
    "Requested and approved refund"
  );

  assertMatchingCurrency(
    approvedAmount,
    eligibility
      .maximumRefundableAmount,
    "Approved and eligible refund"
  );

  assertNonNegativeMoney(
    requestedAmount,
    "Requested refund amount"
  );

  assertNonNegativeMoney(
    approvedAmount,
    "Approved refund amount"
  );

  return (
    approvedAmount.amountMinor >
      0 &&
    approvedAmount.amountMinor <=
      requestedAmount.amountMinor &&
    approvedAmount.amountMinor <=
      eligibility
        .maximumRefundableAmount
        .amountMinor
  );
}

export function getRefundStatusSummary(
  status:
    RefundStatus
): RefundStatusSummary {
  switch (status) {
    case "requested":
    case "under_review":
      return {
        status,
        pending:
          true,
        approved:
          false,
        processing:
          false,
        completed:
          false,
        failed:
          false,
        terminal:
          false,
      };

    case "approved":
      return {
        status,
        pending:
          false,
        approved:
          true,
        processing:
          false,
        completed:
          false,
        failed:
          false,
        terminal:
          false,
      };

    case "processing":
    case "partially_refunded":
      return {
        status,
        pending:
          false,
        approved:
          true,
        processing:
          true,
        completed:
          false,
        failed:
          false,
        terminal:
          false,
      };

    case "refunded":
      return {
        status,
        pending:
          false,
        approved:
          true,
        processing:
          false,
        completed:
          true,
        failed:
          false,
        terminal:
          true,
      };

    case "failed":
      return {
        status,
        pending:
          false,
        approved:
          false,
        processing:
          false,
        completed:
          false,
        failed:
          true,
        terminal:
          true,
      };

    case "rejected":
    case "cancelled":
      return {
        status,
        pending:
          false,
        approved:
          false,
        processing:
          false,
        completed:
          false,
        failed:
          false,
        terminal:
          true,
      };
  }
}

export function isRefundProviderVerified(
  refund:
    AdvertiserRefund
): boolean {
  return Boolean(
    refund
      .webhookVerification &&
    refund
      .webhookVerification
      .verificationStatus ===
      "verified" &&
    refund
      .webhookVerification
      .signatureVerified
  );
}

export function isRefundComplete(
  refund:
    AdvertiserRefund
): boolean {
  return (
    refund.status ===
      "refunded" &&
    refund.refundedAmount
      .amountMinor ===
      refund.approvedAmount
        .amountMinor &&
    refund.refundedAmount
      .currency ===
      refund.approvedAmount
        .currency &&
    Boolean(
      refund.refundedAt
    )
  );
}

export function getRemainingApprovedRefundMinor(
  refund:
    AdvertiserRefund
): number {
  assertMatchingCurrency(
    refund.approvedAmount,
    refund.refundedAmount,
    "Approved and completed refund"
  );

  return Math.max(
    refund.approvedAmount
      .amountMinor -
      refund.refundedAmount
        .amountMinor,
    0
  );
}
