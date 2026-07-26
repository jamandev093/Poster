import type {
  CampaignBudgetStatus,
} from "./budget.types";

import type {
  InvoiceStatus,
} from "./invoice.types";

import type {
  PaymentStatus,
} from "./payment.types";

import type {
  RefundStatus,
} from "./refund.types";

import type {
  SettlementStatus,
} from "./settlement.types";

/**
 * Shared payment-domain status presentation.
 *
 * These labels and semantic categories must remain consistent
 * across Client and Admin interfaces.
 *
 * This module does not authorize transitions or process money.
 */

export type FinancialStatusTone =
  | "neutral"
  | "information"
  | "success"
  | "attention"
  | "danger";

export interface FinancialStatusPresentation {
  label:
    string;

  tone:
    FinancialStatusTone;

  description:
    string;
}

export function getPaymentStatusPresentation(
  status:
    PaymentStatus
): FinancialStatusPresentation {
  switch (status) {
    case "created":
      return {
        label:
          "Created",

        tone:
          "neutral",

        description:
          "The payment record has been created.",
      };

    case "pending":
      return {
        label:
          "Payment pending",

        tone:
          "attention",

        description:
          "Poster is waiting for the payment to complete.",
      };

    case "authorized":
      return {
        label:
          "Authorized",

        tone:
          "information",

        description:
          "The payment was authorized but is not yet confirmed as captured.",
      };

    case "captured":
      return {
        label:
          "Captured",

        tone:
          "success",

        description:
          "The payment was captured and is awaiting final account processing.",
      };

    case "paid":
      return {
        label:
          "Paid",

        tone:
          "success",

        description:
          "The payment has been verified successfully.",
      };

    case "partially_paid":
      return {
        label:
          "Partially paid",

        tone:
          "attention",

        description:
          "Part of the required payment has been received.",
      };

    case "failed":
      return {
        label:
          "Payment failed",

        tone:
          "danger",

        description:
          "The payment could not be completed.",
      };

    case "cancelled":
      return {
        label:
          "Cancelled",

        tone:
          "neutral",

        description:
          "The payment was cancelled.",
      };

    case "expired":
      return {
        label:
          "Expired",

        tone:
          "neutral",

        description:
          "The payment request expired before completion.",
      };

    case "refund_pending":
      return {
        label:
          "Refund pending",

        tone:
          "attention",

        description:
          "An approved refund is being processed.",
      };

    case "partially_refunded":
      return {
        label:
          "Partially refunded",

        tone:
          "information",

        description:
          "Part of the captured amount has been refunded.",
      };

    case "refunded":
      return {
        label:
          "Refunded",

        tone:
          "success",

        description:
          "The approved amount has been refunded.",
      };

    case "disputed":
      return {
        label:
          "Disputed",

        tone:
          "danger",

        description:
          "The payment is subject to a dispute or chargeback review.",
      };
  }
}

export function getInvoiceStatusPresentation(
  status:
    InvoiceStatus
): FinancialStatusPresentation {
  switch (status) {
    case "draft":
      return {
        label:
          "Draft",

        tone:
          "neutral",

        description:
          "The invoice has not yet been issued.",
      };

    case "issued":
      return {
        label:
          "Issued",

        tone:
          "information",

        description:
          "The invoice has been issued and is available for payment.",
      };

    case "payment_pending":
      return {
        label:
          "Payment pending",

        tone:
          "attention",

        description:
          "Payment is required for this invoice.",
      };

    case "partially_paid":
      return {
        label:
          "Partially paid",

        tone:
          "attention",

        description:
          "The invoice has an outstanding balance.",
      };

    case "paid":
      return {
        label:
          "Paid",

        tone:
          "success",

        description:
          "The invoice has been paid in full.",
      };

    case "overdue":
      return {
        label:
          "Overdue",

        tone:
          "danger",

        description:
          "The invoice passed its due date with an outstanding amount.",
      };

    case "cancelled":
      return {
        label:
          "Cancelled",

        tone:
          "neutral",

        description:
          "The invoice is no longer payable.",
      };

    case "refund_pending":
      return {
        label:
          "Refund pending",

        tone:
          "attention",

        description:
          "A refund linked to this invoice is being processed.",
      };

    case "partially_refunded":
      return {
        label:
          "Partially refunded",

        tone:
          "information",

        description:
          "Part of the paid invoice amount has been refunded.",
      };

    case "refunded":
      return {
        label:
          "Refunded",

        tone:
          "success",

        description:
          "The approved invoice amount has been refunded.",
      };
  }
}

export function getSettlementStatusPresentation(
  status:
    SettlementStatus
): FinancialStatusPresentation {
  switch (status) {
    case "not_initiated":
      return {
        label:
          "Not initiated",

        tone:
          "neutral",

        description:
          "Bank settlement has not yet started.",
      };

    case "queued":
      return {
        label:
          "Queued",

        tone:
          "information",

        description:
          "The settlement is queued for provider processing.",
      };

    case "processing":
      return {
        label:
          "Processing",

        tone:
          "attention",

        description:
          "The provider is processing the bank settlement.",
      };

    case "settled":
      return {
        label:
          "Settled",

        tone:
          "success",

        description:
          "The settlement was deposited into the configured bank account.",
      };

    case "failed":
      return {
        label:
          "Settlement failed",

        tone:
          "danger",

        description:
          "The provider could not complete the settlement.",
      };

    case "on_hold":
      return {
        label:
          "On hold",

        tone:
          "attention",

        description:
          "The settlement requires review before continuing.",
      };

    case "reversed":
      return {
        label:
          "Reversed",

        tone:
          "danger",

        description:
          "A previously processed settlement was reversed.",
      };
  }
}

export function getRefundStatusPresentation(
  status:
    RefundStatus
): FinancialStatusPresentation {
  switch (status) {
    case "requested":
      return {
        label:
          "Requested",

        tone:
          "information",

        description:
          "The refund request has been submitted.",
      };

    case "under_review":
      return {
        label:
          "Under review",

        tone:
          "attention",

        description:
          "Poster is reviewing refund eligibility.",
      };

    case "approved":
      return {
        label:
          "Approved",

        tone:
          "success",

        description:
          "The refund was approved and is ready for processing.",
      };

    case "rejected":
      return {
        label:
          "Rejected",

        tone:
          "danger",

        description:
          "The refund request was not approved.",
      };

    case "processing":
      return {
        label:
          "Processing",

        tone:
          "attention",

        description:
          "The approved refund is being sent to the original payment method.",
      };

    case "partially_refunded":
      return {
        label:
          "Partially refunded",

        tone:
          "information",

        description:
          "Part of the approved refund amount has completed.",
      };

    case "refunded":
      return {
        label:
          "Refunded",

        tone:
          "success",

        description:
          "The approved refund has completed.",
      };

    case "failed":
      return {
        label:
          "Refund failed",

        tone:
          "danger",

        description:
          "The refund could not be completed and requires review.",
      };

    case "cancelled":
      return {
        label:
          "Cancelled",

        tone:
          "neutral",

        description:
          "The refund request was cancelled.",
      };
  }
}

export function getCampaignBudgetStatusPresentation(
  status:
    CampaignBudgetStatus
): FinancialStatusPresentation {
  switch (status) {
    case "not_funded":
      return {
        label:
          "Not funded",

        tone:
          "neutral",

        description:
          "No verified campaign funds are available.",
      };

    case "funding_pending":
      return {
        label:
          "Funding pending",

        tone:
          "attention",

        description:
          "Poster is waiting for verified payment confirmation.",
      };

    case "available":
      return {
        label:
          "Funds available",

        tone:
          "success",

        description:
          "Verified funds are available for campaign delivery.",
      };

    case "partially_reserved":
      return {
        label:
          "Partially reserved",

        tone:
          "information",

        description:
          "Some campaign funds are reserved for planned delivery.",
      };

    case "fully_reserved":
      return {
        label:
          "Fully reserved",

        tone:
          "information",

        description:
          "All currently available funds are reserved.",
      };

    case "low_balance":
      return {
        label:
          "Low balance",

        tone:
          "attention",

        description:
          "The campaign balance is approaching its configured threshold.",
      };

    case "depleted":
      return {
        label:
          "Balance depleted",

        tone:
          "danger",

        description:
          "No campaign funds remain available for further delivery.",
      };

    case "refund_pending":
      return {
        label:
          "Refund pending",

        tone:
          "attention",

        description:
          "Part of the campaign balance is reserved for an approved refund.",
      };

    case "closed":
      return {
        label:
          "Closed",

        tone:
          "neutral",

        description:
          "This campaign budget is closed.",
      };

    case "blocked":
      return {
        label:
          "Blocked",

        tone:
          "danger",

        description:
          "Campaign funds cannot currently be used.",
      };
  }
}

export function getPaymentStatusLabel(
  status:
    PaymentStatus
): string {
  return getPaymentStatusPresentation(
    status
  ).label;
}

export function getInvoiceStatusLabel(
  status:
    InvoiceStatus
): string {
  return getInvoiceStatusPresentation(
    status
  ).label;
}

export function getSettlementStatusLabel(
  status:
    SettlementStatus
): string {
  return getSettlementStatusPresentation(
    status
  ).label;
}

export function getRefundStatusLabel(
  status:
    RefundStatus
): string {
  return getRefundStatusPresentation(
    status
  ).label;
}

export function getCampaignBudgetStatusLabel(
  status:
    CampaignBudgetStatus
): string {
  return getCampaignBudgetStatusPresentation(
    status
  ).label;
}
