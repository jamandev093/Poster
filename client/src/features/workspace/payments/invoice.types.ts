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

import type {
  InvoiceId,
  PaymentId,
  PaymentStatus,
  ReceiptId,
} from "./payment.types";

/**
 * Canonical advertiser invoice contracts.
 *
 * Invoice responsibilities:
 *
 * - approved commercial amount;
 * - itemized charges;
 * - taxes and discounts;
 * - due date;
 * - payment allocation;
 * - receipt references;
 * - invoice lifecycle.
 *
 * Payment capture, refunds, settlements, ledger entries,
 * and campaign-budget deductions belong to separate modules.
 */

export type InvoiceLineItemId =
  `ILI-${string}`;

export type InvoiceAdjustmentId =
  `IAD-${string}`;

export type InvoiceDocumentId =
  `DOC-${string}`;

export type InvoiceStatus =
  | "draft"
  | "issued"
  | "payment_pending"
  | "partially_paid"
  | "paid"
  | "overdue"
  | "cancelled"
  | "refund_pending"
  | "partially_refunded"
  | "refunded";

export type InvoiceLineItemType =
  | "campaign_funding"
  | "direct_sponsorship_contract"
  | "affiliate_deposit"
  | "creative_service"
  | "tax"
  | "discount"
  | "credit"
  | "manual_adjustment";

export type InvoiceAdjustmentType =
  | "discount"
  | "credit"
  | "debit"
  | "tax_correction"
  | "rounding_adjustment"
  | "manual_adjustment";

export type TaxType =
  | "gst"
  | "igst"
  | "cgst"
  | "sgst"
  | "other";

export interface InvoiceParty {
  legalName:
    string;

  businessName?:
    string;

  contactName:
    string;

  businessEmail:
    string;

  phoneNumber?:
    string;

  taxRegistrationNumber?:
    string;

  addressLine1?:
    string;

  addressLine2?:
    string;

  city?:
    string;

  stateOrRegion?:
    string;

  postalCode?:
    string;

  countryCode:
    string;
}

export interface InvoiceTaxComponent {
  type:
    TaxType;

  label:
    string;

  rateBasisPoints:
    number;

  taxableAmount:
    MoneyAmount;

  taxAmount:
    MoneyAmount;

  registrationNumber?:
    string;
}

export interface InvoiceLineItem {
  id:
    InvoiceLineItemId;

  type:
    InvoiceLineItemType;

  description:
    string;

  quantity:
    number;

  unitAmount:
    MoneyAmount;

  subtotal:
    MoneyAmount;

  taxComponents:
    InvoiceTaxComponent[];

  taxTotal:
    MoneyAmount;

  total:
    MoneyAmount;

  requestId?:
    AdvertisingRequestId;

  campaignId?:
    CampaignId;

  servicePeriodStart?:
    string;

  servicePeriodEnd?:
    string;

  metadata?:
    Record<
      string,
      string
    >;
}

export interface InvoiceAdjustment {
  id:
    InvoiceAdjustmentId;

  type:
    InvoiceAdjustmentType;

  description:
    string;

  amount:
    MoneyAmount;

  appliedBy:
    AdvertisingActorReference;

  appliedAt:
    string;

  referenceId?:
    string;
}

export interface InvoiceTotals {
  currency:
    SupportedCurrency;

  subtotalMinor:
    number;

  discountMinor:
    number;

  creditMinor:
    number;

  taxMinor:
    number;

  adjustmentMinor:
    number;

  totalMinor:
    number;

  paidMinor:
    number;

  refundedMinor:
    number;

  outstandingMinor:
    number;
}

export interface InvoicePaymentAllocation {
  paymentId:
    PaymentId;

  amount:
    MoneyAmount;

  paymentStatus:
    PaymentStatus;

  allocatedAt:
    string;
}

export interface InvoiceReceiptReference {
  receiptId:
    ReceiptId;

  paymentId:
    PaymentId;

  issuedAt:
    string;

  documentId?:
    InvoiceDocumentId;

  documentUrl?:
    string;
}

export interface AdvertiserInvoice {
  id:
    InvoiceId;

  invoiceNumber:
    string;

  organizationId:
    OrganizationId;

  requestId?:
    AdvertisingRequestId;

  campaignId?:
    CampaignId;

  status:
    InvoiceStatus;

  currency:
    SupportedCurrency;

  issuer:
    InvoiceParty;

  billedTo:
    InvoiceParty;

  lineItems:
    InvoiceLineItem[];

  adjustments:
    InvoiceAdjustment[];

  totals:
    InvoiceTotals;

  paymentAllocations:
    InvoicePaymentAllocation[];

  receipts:
    InvoiceReceiptReference[];

  purchaseOrderReference?:
    string;

  notes?:
    string;

  terms?:
    string;

  issuedAt?:
    string;

  dueAt?:
    string;

  paidAt?:
    string;

  overdueAt?:
    string;

  cancelledAt?:
    string;

  createdBy:
    AdvertisingActorReference;

  createdAt:
    string;

  updatedAt:
    string;

  documentId?:
    InvoiceDocumentId;

  documentUrl?:
    string;
}

export interface CreateInvoiceInput {
  organizationId:
    OrganizationId;

  requestId?:
    AdvertisingRequestId;

  campaignId?:
    CampaignId;

  currency:
    SupportedCurrency;

  issuer:
    InvoiceParty;

  billedTo:
    InvoiceParty;

  lineItems:
    InvoiceLineItem[];

  adjustments?:
    InvoiceAdjustment[];

  purchaseOrderReference?:
    string;

  notes?:
    string;

  terms?:
    string;

  dueAt:
    string;

  createdBy:
    AdvertisingActorReference;
}

export interface InvoiceStatusSummary {
  status:
    InvoiceStatus;

  payable:
    boolean;

  paid:
    boolean;

  overdue:
    boolean;

  refundable:
    boolean;

  terminal:
    boolean;
}

function isSafeMinorAmount(
  value:
    number
): boolean {
  return (
    Number.isSafeInteger(
      value
    ) &&
    value >= 0
  );
}

export function calculateInvoiceOutstandingMinor(
  totalMinor:
    number,
  paidMinor:
    number,
  refundedMinor:
    number
): number {
  if (
    !isSafeMinorAmount(
      totalMinor
    ) ||
    !isSafeMinorAmount(
      paidMinor
    ) ||
    !isSafeMinorAmount(
      refundedMinor
    )
  ) {
    throw new Error(
      "Invoice totals must use non-negative safe integers in minor units."
    );
  }

  return Math.max(
    totalMinor -
      paidMinor +
      refundedMinor,
    0
  );
}

export function calculateInvoiceTotals(
  input: {
    currency:
      SupportedCurrency;

    subtotalMinor:
      number;

    discountMinor:
      number;

    creditMinor:
      number;

    taxMinor:
      number;

    adjustmentMinor:
      number;

    paidMinor:
      number;

    refundedMinor:
      number;
  }
): InvoiceTotals {
  const nonNegativeValues = [
    input.subtotalMinor,
    input.discountMinor,
    input.creditMinor,
    input.taxMinor,
    input.paidMinor,
    input.refundedMinor,
  ];

  if (
    nonNegativeValues.some(
      (
        value
      ) =>
        !isSafeMinorAmount(
          value
        )
    ) ||
    !Number.isSafeInteger(
      input.adjustmentMinor
    )
  ) {
    throw new Error(
      "Invoice values must use safe integers in minor currency units."
    );
  }

  const totalMinor =
    Math.max(
      input.subtotalMinor -
        input.discountMinor -
        input.creditMinor +
        input.taxMinor +
        input.adjustmentMinor,
      0
    );

  return {
    currency:
      input.currency,

    subtotalMinor:
      input.subtotalMinor,

    discountMinor:
      input.discountMinor,

    creditMinor:
      input.creditMinor,

    taxMinor:
      input.taxMinor,

    adjustmentMinor:
      input.adjustmentMinor,

    totalMinor,

    paidMinor:
      input.paidMinor,

    refundedMinor:
      input.refundedMinor,

    outstandingMinor:
      calculateInvoiceOutstandingMinor(
        totalMinor,
        input.paidMinor,
        input.refundedMinor
      ),
  };
}

export function getInvoiceStatusSummary(
  status:
    InvoiceStatus
): InvoiceStatusSummary {
  switch (status) {
    case "draft":
      return {
        status,
        payable:
          false,
        paid:
          false,
        overdue:
          false,
        refundable:
          false,
        terminal:
          false,
      };

    case "issued":
    case "payment_pending":
    case "partially_paid":
      return {
        status,
        payable:
          true,
        paid:
          false,
        overdue:
          false,
        refundable:
          status ===
            "partially_paid",
        terminal:
          false,
      };

    case "overdue":
      return {
        status,
        payable:
          true,
        paid:
          false,
        overdue:
          true,
        refundable:
          false,
        terminal:
          false,
      };

    case "paid":
      return {
        status,
        payable:
          false,
        paid:
          true,
        overdue:
          false,
        refundable:
          true,
        terminal:
          false,
      };

    case "refund_pending":
    case "partially_refunded":
      return {
        status,
        payable:
          false,
        paid:
          true,
        overdue:
          false,
        refundable:
          true,
        terminal:
          false,
      };

    case "refunded":
      return {
        status,
        payable:
          false,
        paid:
          true,
        overdue:
          false,
        refundable:
          false,
        terminal:
          true,
      };

    case "cancelled":
      return {
        status,
        payable:
          false,
        paid:
          false,
        overdue:
          false,
        refundable:
          false,
        terminal:
          true,
      };
  }
}

export function isInvoiceFullyPaid(
  invoice:
    AdvertiserInvoice
): boolean {
  return (
    invoice.totals
      .outstandingMinor ===
      0 &&
    invoice.totals
      .paidMinor >
      0 &&
    (
      invoice.status ===
        "paid" ||
      invoice.status ===
        "refund_pending" ||
      invoice.status ===
        "partially_refunded" ||
      invoice.status ===
        "refunded"
    )
  );
}

export function canInvoiceAcceptPayment(
  invoice:
    AdvertiserInvoice
): boolean {
  return (
    invoice.totals
      .outstandingMinor >
      0 &&
    (
      invoice.status ===
        "issued" ||
      invoice.status ===
        "payment_pending" ||
      invoice.status ===
        "partially_paid" ||
      invoice.status ===
        "overdue"
    )
  );
}

export function assertInvoiceCurrencyConsistency(
  invoice:
    AdvertiserInvoice
): void {
  const currency =
    invoice.currency;

  const allAmounts = [
    ...invoice.lineItems.flatMap(
      (
        item
      ) => [
        item.unitAmount,
        item.subtotal,
        item.taxTotal,
        item.total,
        ...item.taxComponents.flatMap(
          (
            tax
          ) => [
            tax.taxableAmount,
            tax.taxAmount,
          ]
        ),
      ]
    ),

    ...invoice.adjustments.map(
      (
        adjustment
      ) =>
        adjustment.amount
    ),

    ...invoice.paymentAllocations.map(
      (
        allocation
      ) =>
        allocation.amount
    ),
  ];

  const mismatched =
    allAmounts.some(
      (
        amount
      ) =>
        amount.currency !==
        currency
    );

  if (mismatched) {
    throw new Error(
      "All invoice amounts must use the invoice currency."
    );
  }
}
