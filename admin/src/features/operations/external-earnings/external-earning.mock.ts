import type {
  ExternalEarningRecord,
} from "./external-earning.types";

export const INITIAL_EXTERNAL_EARNINGS:
  ExternalEarningRecord[] = [
  {
    id: "external-earning-example-1",

    programId:
      "program-example-approved",

    promotionId:
      "external-promotion-example-1",

    externalConversionId:
      "CONV-EXAMPLE-1001",

    externalOrderId:
      "ORDER-EXAMPLE-5001",

    externalPayoutId:
      "",

    eventType:
      "sale",

    source:
      "platform_dashboard",

    conversionDate:
      "2026-07-24",

    confirmationDate:
      "2026-07-27",

    payoutDate:
      "",

    status:
      "approved",

    payoutStatus:
      "awaiting_threshold",

    amount: {
      currency:
        "INR",

      grossAmount:
        84990,

      commissionAmount:
        4250,

      taxWithheld:
        425,

      fees:
        0,

      netAmount:
        3825,
    },

    customerCountry:
      "India",

    statementReference:
      "JUL-2026-STATEMENT-01",

    evidenceUrl:
      "https://example.com/dashboard/conversions/CONV-EXAMPLE-1001",

    reversalReason:
      "",

    rejectionReason:
      "",

    notes:
      "Demonstration confirmed sale reported by the external platform.",

    createdAt:
      "24 Jul 2026, 14:20",

    updatedAt:
      "27 Jul 2026, 10:15",

    auditHistory: [
      {
        id:
          "external-earning-audit-1",

        action:
          "created",

        message:
          "External earning record created from platform dashboard data.",

        actor:
          "Admin",

        occurredAt:
          "24 Jul 2026, 14:20",
      },

      {
        id:
          "external-earning-audit-2",

        action:
          "approved",

        message:
          "Commission approved by the external platform.",

        actor:
          "Admin",

        occurredAt:
          "27 Jul 2026, 10:15",
      },
    ],
  },

  {
    id: "external-earning-example-2",

    programId:
      "program-example-approved",

    promotionId:
      "external-promotion-example-1",

    externalConversionId:
      "CONV-EXAMPLE-1002",

    externalOrderId:
      "ORDER-EXAMPLE-5002",

    externalPayoutId:
      "PAYOUT-EXAMPLE-7001",

    eventType:
      "sale",

    source:
      "statement",

    conversionDate:
      "2026-07-18",

    confirmationDate:
      "2026-07-21",

    payoutDate:
      "2026-07-29",

    status:
      "paid",

    payoutStatus:
      "paid",

    amount: {
      currency:
        "INR",

      grossAmount:
        62490,

      commissionAmount:
        3125,

      taxWithheld:
        313,

      fees:
        25,

      netAmount:
        2787,
    },

    customerCountry:
      "India",

    statementReference:
      "JUL-2026-PAYOUT-01",

    evidenceUrl:
      "https://example.com/statements/JUL-2026-PAYOUT-01",

    reversalReason:
      "",

    rejectionReason:
      "",

    notes:
      "Demonstration payout received and manually reconciled.",

    createdAt:
      "18 Jul 2026, 16:40",

    updatedAt:
      "29 Jul 2026, 17:05",

    auditHistory: [
      {
        id:
          "external-earning-audit-3",

        action:
          "created",

        message:
          "External earning record created from statement data.",

        actor:
          "Admin",

        occurredAt:
          "18 Jul 2026, 16:40",
      },

      {
        id:
          "external-earning-audit-4",

        action:
          "marked_paid",

        message:
          "Commission marked as paid.",

        actor:
          "Admin",

        occurredAt:
          "29 Jul 2026, 16:55",
      },

      {
        id:
          "external-earning-audit-5",

        action:
          "reconciled",

        message:
          "Payout reconciled with the external statement.",

        actor:
          "Admin",

        occurredAt:
          "29 Jul 2026, 17:05",
      },
    ],
  },

  {
    id: "external-earning-example-3",

    programId:
      "program-example-approved",

    promotionId:
      "external-promotion-example-2",

    externalConversionId:
      "CONV-EXAMPLE-1003",

    externalOrderId:
      "",

    externalPayoutId:
      "",

    eventType:
      "subscription",

    source:
      "manual",

    conversionDate:
      "2026-07-30",

    confirmationDate:
      "",

    payoutDate:
      "",

    status:
      "pending",

    payoutStatus:
      "not_payable",

    amount: {
      currency:
        "USD",

      grossAmount:
        120,

      commissionAmount:
        24,

      taxWithheld:
        0,

      fees:
        0,

      netAmount:
        24,
    },

    customerCountry:
      "United States",

    statementReference:
      "",

    evidenceUrl:
      "",

    reversalReason:
      "",

    rejectionReason:
      "",

    notes:
      "Demonstration subscription awaiting external confirmation.",

    createdAt:
      "30 Jul 2026, 12:30",

    updatedAt:
      "30 Jul 2026, 12:30",

    auditHistory: [
      {
        id:
          "external-earning-audit-6",

        action:
          "created",

        message:
          "External earning record created manually with Pending status.",

        actor:
          "Admin",

        occurredAt:
          "30 Jul 2026, 12:30",
      },
    ],
  },

  {
    id: "external-earning-example-4",

    programId:
      "program-example-approved",

    promotionId:
      "external-promotion-example-1",

    externalConversionId:
      "CONV-EXAMPLE-1004",

    externalOrderId:
      "ORDER-EXAMPLE-5004",

    externalPayoutId:
      "",

    eventType:
      "sale",

    source:
      "platform_dashboard",

    conversionDate:
      "2026-07-16",

    confirmationDate:
      "2026-07-19",

    payoutDate:
      "",

    status:
      "reversed",

    payoutStatus:
      "reversed",

    amount: {
      currency:
        "INR",

      grossAmount:
        47990,

      commissionAmount:
        2400,

      taxWithheld:
        0,

      fees:
        0,

      netAmount:
        0,
    },

    customerCountry:
      "India",

    statementReference:
      "JUL-2026-REVERSAL-01",

    evidenceUrl:
      "https://example.com/dashboard/conversions/CONV-EXAMPLE-1004",

    reversalReason:
      "Customer order was cancelled and refunded by the external platform.",

    rejectionReason:
      "",

    notes:
      "Demonstration reversed commission retained for audit history.",

    createdAt:
      "16 Jul 2026, 11:10",

    updatedAt:
      "22 Jul 2026, 09:45",

    auditHistory: [
      {
        id:
          "external-earning-audit-7",

        action:
          "created",

        message:
          "External earning record created from platform dashboard data.",

        actor:
          "Admin",

        occurredAt:
          "16 Jul 2026, 11:10",
      },

      {
        id:
          "external-earning-audit-8",

        action:
          "reversed",

        message:
          "Commission reversed after the external order was cancelled.",

        actor:
          "Admin",

        occurredAt:
          "22 Jul 2026, 09:45",
      },
    ],
  },
];
