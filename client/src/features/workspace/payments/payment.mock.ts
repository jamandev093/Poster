import type {
  CampaignBudget,
} from "./budget.types";

import type {
  AdvertiserInvoice,
} from "./invoice.types";

import type {
  LedgerAccount,
  LedgerEntry,
} from "./ledger.types";

import type {
  AdvertiserPayment,
  AdvertiserPaymentOrder,
  PaymentAttempt,
} from "./payment.types";

import type {
  AdvertiserRefund,
  AdvertiserRefundRequest,
  RefundReview,
} from "./refund.types";

import type {
  AdvertiserPaymentSettlement,
} from "./settlement.types";

/**
 * Development-only financial fixtures.
 *
 * These records imitate future Backend API responses.
 *
 * They intentionally preserve the separation between:
 *
 * - invoice issuance;
 * - payment order creation;
 * - checkout attempt;
 * - verified payment confirmation;
 * - campaign budget credit;
 * - analytics-based spend;
 * - invalid-traffic credit;
 * - provider settlement;
 * - refund processing;
 * - append-only ledger history.
 *
 * This file must never become the production source of truth.
 */

const systemActor = {
  actorType:
    "system" as const,

  actorId:
    "SYSTEM-PAYMENTS",

  displayName:
    "Poster Payments",
};

const financeAdminActor = {
  actorType:
    "admin" as const,

  actorId:
    "ADM-1001",

  displayName:
    "Poster Finance",
};

const advertiserActor = {
  actorType:
    "client" as const,

  actorId:
    "CLI-1001",

  displayName:
    "Aarav Mehta",
};

export const mockAdvertiserInvoice:
  AdvertiserInvoice = {
  id:
    "INV-00045",

  invoiceNumber:
    "POSTER-2026-00045",

  organizationId:
    "ORG-1001",

  requestId:
    "ADV-0998",

  campaignId:
    "CMP-3001",

  status:
    "paid",

  currency:
    "INR",

  issuer: {
    legalName:
      "Poster Technologies Private Limited",

    businessName:
      "Poster",

    contactName:
      "Poster Finance",

    businessEmail:
      "billing@getpostar.com",

    countryCode:
      "IN",
  },

  billedTo: {
    legalName:
      "Example Cloud Private Limited",

    businessName:
      "Example Cloud",

    contactName:
      "Aarav Mehta",

    businessEmail:
      "marketing@examplecloud.com",

    countryCode:
      "IN",
  },

  lineItems: [
    {
      id:
        "ILI-00045-01",

      type:
        "campaign_funding",

      description:
        "Cloud Skills Campaign advertising balance",

      quantity:
        1,

      unitAmount: {
        currency:
          "INR",

        amountMinor:
          20_000_000,
      },

      subtotal: {
        currency:
          "INR",

        amountMinor:
          20_000_000,
      },

      taxComponents: [],

      taxTotal: {
        currency:
          "INR",

        amountMinor:
          0,
      },

      total: {
        currency:
          "INR",

        amountMinor:
          20_000_000,
      },

      requestId:
        "ADV-0998",

      campaignId:
        "CMP-3001",

      servicePeriodStart:
        "2026-07-01",

      servicePeriodEnd:
        "2026-07-31",
    },
  ],

  adjustments: [],

  totals: {
    currency:
      "INR",

    subtotalMinor:
      20_000_000,

    discountMinor:
      0,

    creditMinor:
      0,

    taxMinor:
      0,

    adjustmentMinor:
      0,

    totalMinor:
      20_000_000,

    paidMinor:
      20_000_000,

    refundedMinor:
      0,

    outstandingMinor:
      0,
  },

  paymentAllocations: [
    {
      paymentId:
        "PAY-00045",

      amount: {
        currency:
          "INR",

        amountMinor:
          20_000_000,
      },

      paymentStatus:
        "paid",

      allocatedAt:
        "2026-06-30T10:06:00Z",
    },
  ],

  receipts: [
    {
      receiptId:
        "RCT-00045",

      paymentId:
        "PAY-00045",

      issuedAt:
        "2026-06-30T10:07:00Z",
    },
  ],

  notes:
    "Campaign funds become eligible after verified payment confirmation.",

  terms:
    "Finalized valid campaign delivery is chargeable. Invalid and duplicate activity is not charged.",

  issuedAt:
    "2026-06-29T09:00:00Z",

  dueAt:
    "2026-07-01T18:30:00Z",

  paidAt:
    "2026-06-30T10:06:00Z",

  createdBy:
    financeAdminActor,

  createdAt:
    "2026-06-29T08:55:00Z",

  updatedAt:
    "2026-06-30T10:07:00Z",
};

export const mockPaymentOrder:
  AdvertiserPaymentOrder = {
  id:
    "ORD-00045",

  organizationId:
    "ORG-1001",

  requestId:
    "ADV-0998",

  campaignId:
    "CMP-3001",

  invoiceId:
    "INV-00045",

  purpose:
    "campaign_funding",

  amount: {
    currency:
      "INR",

    amountMinor:
      20_000_000,
  },

  provider:
    "razorpay",

  providerReference: {
    provider:
      "razorpay",

    providerOrderId:
      "order_RZP_00045",

    providerReceiptReference:
      "POSTER-2026-00045",

    checkoutKeyId:
      "rzp_live_masked",

    createdAt:
      "2026-06-30T10:00:00Z",

    expiresAt:
      "2026-06-30T10:30:00Z",
  },

  status:
    "paid",

  channel:
    "client_web",

  idempotencyKey:
    "payment-order:INV-00045:v1",

  createdBy:
    advertiserActor,

  createdAt:
    "2026-06-30T10:00:00Z",

  updatedAt:
    "2026-06-30T10:06:00Z",

  expiresAt:
    "2026-06-30T10:30:00Z",
};

export const mockPaymentAttempt:
  PaymentAttempt = {
  id:
    "PAT-00045-01",

  paymentOrderId:
    "ORD-00045",

  organizationId:
    "ORG-1001",

  provider:
    "razorpay",

  status:
    "captured",

  amount: {
    currency:
      "INR",

    amountMinor:
      20_000_000,
  },

  methodDetails: {
    method:
      "upi",

    upiHandleMasked:
      "aa***@okaxis",

    international:
      false,
  },

  providerPaymentId:
    "pay_RZP_00045",

  checkoutOpenedAt:
    "2026-06-30T10:01:00Z",

  authorizedAt:
    "2026-06-30T10:05:30Z",

  capturedAt:
    "2026-06-30T10:05:45Z",

  createdAt:
    "2026-06-30T10:01:00Z",

  updatedAt:
    "2026-06-30T10:05:45Z",
};

export const mockAdvertiserPayment:
  AdvertiserPayment = {
  id:
    "PAY-00045",

  organizationId:
    "ORG-1001",

  requestId:
    "ADV-0998",

  campaignId:
    "CMP-3001",

  invoiceId:
    "INV-00045",

  paymentOrderId:
    "ORD-00045",

  purpose:
    "campaign_funding",

  provider:
    "razorpay",

  status:
    "paid",

  amount: {
    currency:
      "INR",

    amountMinor:
      20_000_000,
  },

  capturedAmount: {
    currency:
      "INR",

    amountMinor:
      20_000_000,
  },

  refundedAmount: {
    currency:
      "INR",

    amountMinor:
      0,
  },

  methodDetails: {
    method:
      "upi",

    upiHandleMasked:
      "aa***@okaxis",

    international:
      false,
  },

  providerPaymentId:
    "pay_RZP_00045",

  providerOrderId:
    "order_RZP_00045",

  webhookVerification: {
    provider:
      "razorpay",

    providerEventId:
      "evt_RZP_00045",

    internalEventId:
      "PWE-00045",

    paymentOrderId:
      "ORD-00045",

    paymentId:
      "PAY-00045",

    verificationStatus:
      "verified",

    signatureHeaderPresent:
      true,

    signatureVerified:
      true,

    duplicate:
      false,

    eventType:
      "payment.captured",

    receivedAt:
      "2026-06-30T10:05:52Z",

    verifiedAt:
      "2026-06-30T10:05:53Z",
  },

  riskStatus:
    "accepted",

  receiptId:
    "RCT-00045",

  authorizedAt:
    "2026-06-30T10:05:30Z",

  capturedAt:
    "2026-06-30T10:05:45Z",

  paidAt:
    "2026-06-30T10:06:00Z",

  createdAt:
    "2026-06-30T10:00:00Z",

  updatedAt:
    "2026-06-30T10:06:00Z",
};

export const mockPaymentSettlement:
  AdvertiserPaymentSettlement = {
  id:
    "SET-00045",

  batchId:
    "STB-00012",

  organizationId:
    "ORG-1001",

  source:
    "razorpay",

  mode:
    "standard",

  status:
    "settled",

  settlementCurrency:
    "INR",

  grossAmount: {
    currency:
      "INR",

    amountMinor:
      20_000_000,
  },

  providerFee: {
    currency:
      "INR",

    amountMinor:
      40_000,
  },

  taxAmount: {
    currency:
      "INR",

    amountMinor:
      7_200,
  },

  adjustmentAmount: {
    currency:
      "INR",

    amountMinor:
      0,
  },

  netAmount: {
    currency:
      "INR",

    amountMinor:
      19_952_800,
  },

  paymentAllocations: [
    {
      paymentId:
        "PAY-00045",

      grossAmount: {
        currency:
          "INR",

        amountMinor:
          20_000_000,
      },

      providerFee: {
        currency:
          "INR",

        amountMinor:
          40_000,
      },

      taxAmount: {
        currency:
          "INR",

        amountMinor:
          7_200,
      },

      adjustmentAmount: {
        currency:
          "INR",

        amountMinor:
          0,
      },

      netSettlementAmount: {
        currency:
          "INR",

        amountMinor:
          19_952_800,
      },

      allocatedAt:
        "2026-07-02T05:30:00Z",
    },
  ],

  adjustments: [],

  bankAccount: {
    id:
      "BNK-00001",

    accountHolderName:
      "Poster Technologies Private Limited",

    bankName:
      "Poster Business Bank",

    accountLastFour:
      "4821",

    countryCode:
      "IN",

    currency:
      "INR",

    verified:
      true,
  },

  providerReference: {
    provider:
      "razorpay",

    providerSettlementId:
      "setl_RZP_00045",

    providerBatchId:
      "batch_RZP_00012",

    providerStatus:
      "processed",

    providerUtr:
      "UTR00000045",

    providerEventId:
      "settlement.processed",
  },

  expectedSettlementAt:
    "2026-07-02T06:00:00Z",

  processingAt:
    "2026-07-02T05:00:00Z",

  settledAt:
    "2026-07-02T05:30:00Z",

  createdAt:
    "2026-07-01T18:30:00Z",

  updatedAt:
    "2026-07-02T05:30:00Z",
};

export const mockLedgerEntries:
  LedgerEntry[] = [
  {
    id:
      "LED-00045-01",

    batchId:
      "LBT-00045",

    ledgerAccountId:
      "LAC-ORG-1001-INR",

    organizationId:
      "ORG-1001",

    campaignId:
      "CMP-3001",

    invoiceId:
      "INV-00045",

    paymentId:
      "PAY-00045",

    type:
      "payment_credit",

    direction:
      "credit",

    status:
      "finalized",

    balanceCategory:
      "available",

    amount: {
      currency:
        "INR",

      amountMinor:
        20_000_000,
    },

    balanceBeforeMinor:
      0,

    balanceAfterMinor:
      20_000_000,

    description:
      "Verified Razorpay campaign payment",

    source:
      "payment_webhook",

    references: [
      {
        id:
          "LRF-00045-01",

        type:
          "payment",

        referenceId:
          "PAY-00045",

        providerReference:
          "pay_RZP_00045",
      },
    ],

    idempotencyKey:
      "ledger:payment-credit:PAY-00045",

    createdBy:
      systemActor,

    occurredAt:
      "2026-06-30T10:05:53Z",

    createdAt:
      "2026-06-30T10:05:54Z",

    finalizedAt:
      "2026-06-30T10:05:54Z",
  },

  {
    id:
      "LED-00045-02",

    batchId:
      "LBT-CMP-3001-20260726",

    ledgerAccountId:
      "LAC-ORG-1001-INR",

    organizationId:
      "ORG-1001",

    campaignId:
      "CMP-3001",

    type:
      "finalized_spend",

    direction:
      "debit",

    status:
      "finalized",

    balanceCategory:
      "available",

    amount: {
      currency:
        "INR",

      amountMinor:
        -8_245_000,
    },

    balanceBeforeMinor:
      20_000_000,

    balanceAfterMinor:
      11_755_000,

    description:
      "Finalized valid campaign delivery",

    source:
      "analytics_finalization",

    references: [
      {
        id:
          "LRF-00045-02",

        type:
          "analytics_aggregation",

        referenceId:
          "AGG-CMP-3001-30D-V1",
      },
    ],

    idempotencyKey:
      "ledger:finalized-spend:AGG-CMP-3001-30D-V1",

    createdBy:
      systemActor,

    occurredAt:
      "2026-07-26T17:00:00Z",

    createdAt:
      "2026-07-26T17:01:00Z",

    finalizedAt:
      "2026-07-26T17:01:00Z",
  },

  {
    id:
      "LED-00045-03",

    batchId:
      "LBT-CMP-3001-20260726",

    ledgerAccountId:
      "LAC-ORG-1001-INR",

    organizationId:
      "ORG-1001",

    campaignId:
      "CMP-3001",

    type:
      "invalid_traffic_credit",

    direction:
      "credit",

    status:
      "finalized",

    balanceCategory:
      "available",

    amount: {
      currency:
        "INR",

      amountMinor:
        120_000,
    },

    balanceBeforeMinor:
      11_755_000,

    balanceAfterMinor:
      11_875_000,

    description:
      "Approved invalid-click credit",

    source:
      "invalid_traffic_reconciliation",

    references: [
      {
        id:
          "LRF-00045-03",

        type:
          "analytics_adjustment",

        referenceId:
          "ADJ-CMP-3001-IVT-01",
      },
    ],

    idempotencyKey:
      "ledger:ivt-credit:ADJ-CMP-3001-IVT-01",

    createdBy:
      systemActor,

    occurredAt:
      "2026-07-26T17:30:00Z",

    createdAt:
      "2026-07-26T17:31:00Z",

    finalizedAt:
      "2026-07-26T17:31:00Z",
  },
];

export const mockLedgerAccount:
  LedgerAccount = {
  id:
    "LAC-ORG-1001-INR",

  organizationId:
    "ORG-1001",

  currency:
    "INR",

  active:
    true,

  currentBalance: {
    currency:
      "INR",

    availableMinor:
      11_875_000,

    reservedMinor:
      0,

    consumedMinor:
      8_245_000,

    pendingAdjustmentMinor:
      0,

    refundedMinor:
      0,

    disputedMinor:
      0,

    expiredMinor:
      0,

    totalCreditsMinor:
      20_120_000,

    totalDebitsMinor:
      8_245_000,

    calculatedAt:
      "2026-07-26T18:00:00Z",

    lastLedgerEntryId:
      "LED-00045-03",
  },

  createdAt:
    "2026-06-30T10:05:54Z",

  updatedAt:
    "2026-07-26T18:00:00Z",
};

export const mockCampaignBudget:
  CampaignBudget = {
  id:
    "BGT-CMP-3001",

  ledgerAccountId:
    "LAC-ORG-1001-INR",

  organizationId:
    "ORG-1001",

  campaignId:
    "CMP-3001",

  status:
    "available",

  currency:
    "INR",

  spendLimitMinor:
    20_000_000,

  lowBalanceThresholdMinor:
    2_000_000,

  amounts: {
    currency:
      "INR",

    allocatedMinor:
      20_000_000,

    paidMinor:
      20_000_000,

    availableMinor:
      11_875_000,

    reservedMinor:
      0,

    estimatedSpendMinor:
      8_390_000,

    pendingValidationSpendMinor:
      145_000,

    finalizedSpendMinor:
      8_245_000,

    invalidTrafficCreditMinor:
      120_000,

    adjustmentCreditMinor:
      0,

    adjustmentDebitMinor:
      0,

    refundReservedMinor:
      0,

    refundedMinor:
      0,

    disputedMinor:
      0,

    remainingMinor:
      11_875_000,
  },

  allocations: [
    {
      id:
        "BAL-CMP-3001-01",

      budgetId:
        "BGT-CMP-3001",

      organizationId:
        "ORG-1001",

      campaignId:
        "CMP-3001",

      invoiceId:
        "INV-00045",

      paymentId:
        "PAY-00045",

      ledgerEntryId:
        "LED-00045-01",

      amount: {
        currency:
          "INR",

        amountMinor:
          20_000_000,
      },

      remainingAmount: {
        currency:
          "INR",

        amountMinor:
          11_875_000,
      },

      status:
        "partially_consumed",

      availabilityReason:
        "verified_payment",

      availableAt:
        "2026-06-30T10:05:54Z",

      consumedAt:
        "2026-07-26T17:01:00Z",

      createdAt:
        "2026-06-30T10:05:54Z",

      updatedAt:
        "2026-07-26T18:00:00Z",
    },
  ],

  reservations: [],

  adjustments: [
    {
      id:
        "BAD-CMP-3001-01",

      budgetId:
        "BGT-CMP-3001",

      organizationId:
        "ORG-1001",

      campaignId:
        "CMP-3001",

      type:
        "invalid_traffic_credit",

      amount: {
        currency:
          "INR",

        amountMinor:
          120_000,
      },

      ledgerEntryId:
        "LED-00045-03",

      analyticsAdjustmentId:
        "ADJ-CMP-3001-IVT-01",

      reason:
        "143 invalid or suspicious clicks were excluded from billing.",

      appliedAt:
        "2026-07-26T17:31:00Z",
    },
  ],

  freshness: {
    processingStage:
      "reconciled",

    dataThrough:
      "2026-07-26T18:15:00Z",

    finalizedThrough:
      "2026-07-26T17:00:00Z",

    lastLedgerEntryAt:
      "2026-07-26T17:31:00Z",

    lastAdjustedAt:
      "2026-07-26T17:31:00Z",

    lastReconciledAt:
      "2026-07-26T18:00:00Z",

    updatedAt:
      "2026-07-26T18:00:00Z",

    warningMessages: [
      "Recent activity remains visible as estimated spend until validation completes.",
    ],
  },

  createdAt:
    "2026-06-30T10:05:54Z",

  updatedAt:
    "2026-07-26T18:00:00Z",
};

export const mockRefundRequest:
  AdvertiserRefundRequest = {
  id:
    "RFR-00012",

  organizationId:
    "ORG-1001",

  campaignId:
    "CMP-3001",

  invoiceId:
    "INV-00045",

  paymentId:
    "PAY-00045",

  reason:
    "invalid_traffic_credit",

  requestedAmount: {
    currency:
      "INR",

    amountMinor:
      120_000,
  },

  explanation:
    "Refund the approved invalid-traffic credit to the original payment method.",

  supportingReferences: [
    {
      type:
        "analytics_adjustment",

      referenceId:
        "ADJ-CMP-3001-IVT-01",

      description:
        "Approved invalid-click reconciliation",
    },
  ],

  status:
    "approved",

  requestedBy:
    advertiserActor,

  requestedAt:
    "2026-07-26T18:05:00Z",

  updatedAt:
    "2026-07-26T18:12:00Z",
};

export const mockRefundReview:
  RefundReview = {
  refundRequestId:
    "RFR-00012",

  decision:
    "approved",

  eligibility: {
    paymentCapturedAmount: {
      currency:
        "INR",

      amountMinor:
        20_000_000,
    },

    previouslyRefundedAmount: {
      currency:
        "INR",

      amountMinor:
        0,
    },

    unusedCampaignBalance: {
      currency:
        "INR",

      amountMinor:
        0,
    },

    invalidTrafficCredit: {
      currency:
        "INR",

      amountMinor:
        120_000,
    },

    approvedContractRefund: {
      currency:
        "INR",

      amountMinor:
        0,
    },

    nonRefundableFinalizedSpend: {
      currency:
        "INR",

      amountMinor:
        8_245_000,
    },

    maximumRefundableAmount: {
      currency:
        "INR",

      amountMinor:
        120_000,
    },

    evaluatedAt:
      "2026-07-26T18:10:00Z",

    warningMessages: [],
  },

  requestedAmount: {
    currency:
      "INR",

    amountMinor:
      120_000,
  },

  approvedAmount: {
    currency:
      "INR",

    amountMinor:
      120_000,
  },

  reviewNote:
    "Approved invalid-traffic credit is eligible for refund.",

  reviewedBy:
    financeAdminActor,

  reviewedAt:
    "2026-07-26T18:12:00Z",
};

export const mockAdvertiserRefund:
  AdvertiserRefund = {
  id:
    "RFD-00012",

  refundRequestId:
    "RFR-00012",

  organizationId:
    "ORG-1001",

  campaignId:
    "CMP-3001",

  invoiceId:
    "INV-00045",

  paymentId:
    "PAY-00045",

  reason:
    "invalid_traffic_credit",

  status:
    "processing",

  executionMode:
    "normal",

  requestedAmount: {
    currency:
      "INR",

    amountMinor:
      120_000,
  },

  approvedAmount: {
    currency:
      "INR",

    amountMinor:
      120_000,
  },

  refundedAmount: {
    currency:
      "INR",

    amountMinor:
      0,
  },

  provider:
    "razorpay",

  providerReference: {
    provider:
      "razorpay",

    providerRefundId:
      "rfnd_RZP_00012",

    providerPaymentId:
      "pay_RZP_00045",

    providerStatus:
      "processed",

    providerSpeed:
      "normal",

    providerCreatedAt:
      "2026-07-26T18:14:00Z",
  },

  approvedBy:
    financeAdminActor,

  processedBy:
    systemActor,

  approvedAt:
    "2026-07-26T18:12:00Z",

  processingAt:
    "2026-07-26T18:14:00Z",

  createdAt:
    "2026-07-26T18:12:00Z",

  updatedAt:
    "2026-07-26T18:14:00Z",
};

export const mockPayments = [
  mockAdvertiserPayment,
];

export const mockInvoices = [
  mockAdvertiserInvoice,
];

export const mockSettlements = [
  mockPaymentSettlement,
];

export const mockCampaignBudgets = [
  mockCampaignBudget,
];

export const mockRefundRequests = [
  mockRefundRequest,
];

export const mockRefunds = [
  mockAdvertiserRefund,
];

export function getMockInvoiceById(
  invoiceId:
    string
): AdvertiserInvoice | undefined {
  return mockInvoices.find(
    (
      invoice
    ) =>
      invoice.id ===
      invoiceId
  );
}

export function getMockPaymentById(
  paymentId:
    string
): AdvertiserPayment | undefined {
  return mockPayments.find(
    (
      payment
    ) =>
      payment.id ===
      paymentId
  );
}

export function getMockCampaignBudget(
  campaignId:
    string
): CampaignBudget | undefined {
  return mockCampaignBudgets.find(
    (
      budget
    ) =>
      budget.campaignId ===
      campaignId
  );
}

export function getMockCampaignLedgerEntries(
  campaignId:
    string
): LedgerEntry[] {
  return mockLedgerEntries.filter(
    (
      entry
    ) =>
      entry.campaignId ===
      campaignId
  );
}
