import type {
  ExternalProgramRecord,
} from "./external-program.types";

export const INITIAL_EXTERNAL_PROGRAMS:
  ExternalProgramRecord[] = [
  {
    id: "program-example-approved",

    programName:
      "Example Technology Affiliate Program",
    platformName:
      "Example Technology Marketplace",
    programType: "affiliate",

    applicationUrl:
      "https://example.com/affiliate/apply",
    dashboardUrl:
      "https://example.com/affiliate/dashboard",

    accountReference:
      "POSTER-PUBLISHER-001",
    trackingId:
      "poster-tech-001",

    status: "approved",

    payoutMethod:
      "bank_transfer",
    payoutDestinationLabel:
      "Poster business bank account",
    currency: "INR",
    minimumPayout: "1,000",
    paymentSchedule: "monthly",

    applicationDate: "2026-07-01",
    approvalDate: "2026-07-08",
    nextReviewDate: "2026-10-08",

    notes:
      "Demonstration record. Replace with a real external program after registration.",

    createdAt:
      "01 Jul 2026, 10:00",
    updatedAt:
      "08 Jul 2026, 16:30",

    auditHistory: [
      {
        id: "audit-example-1",
        action: "created",
        message:
          "Program application record created.",
        actor: "Admin",
        occurredAt:
          "01 Jul 2026, 10:00",
      },
      {
        id: "audit-example-2",
        action: "status_changed",
        message:
          "Program status changed from Under review to Approved.",
        actor: "Admin",
        occurredAt:
          "08 Jul 2026, 16:30",
      },
    ],
  },

  {
    id: "program-example-review",

    programName:
      "Example Software Referral Program",
    platformName:
      "Example SaaS Platform",
    programType: "referral",

    applicationUrl:
      "https://example.org/partners/apply",
    dashboardUrl: "",

    accountReference: "",
    trackingId: "",

    status: "under_review",

    payoutMethod: "paypal",
    payoutDestinationLabel:
      "Poster business PayPal",
    currency: "USD",
    minimumPayout: "$100",
    paymentSchedule:
      "threshold_based",

    applicationDate: "2026-07-24",
    approvalDate: "",
    nextReviewDate: "2026-08-07",

    notes:
      "Awaiting approval and publisher account reference.",

    createdAt:
      "24 Jul 2026, 11:15",
    updatedAt:
      "24 Jul 2026, 11:15",

    auditHistory: [
      {
        id: "audit-example-3",
        action: "created",
        message:
          "Program application record created with Under review status.",
        actor: "Admin",
        occurredAt:
          "24 Jul 2026, 11:15",
      },
    ],
  },
];
