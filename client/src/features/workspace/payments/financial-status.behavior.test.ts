import {
  describe,
  expect,
  it,
} from "vitest";

import {
  getInvoiceStatusSummary,
} from "./invoice.types";

import {
  getPaymentStatusSummary,
} from "./payment.types";

import {
  getRefundStatusSummary,
} from "./refund.types";

import {
  getSettlementStatusSummary,
} from "./settlement.types";

import {
  getCampaignBudgetStatusPresentation,
  getInvoiceStatusPresentation,
  getPaymentStatusPresentation,
  getRefundStatusPresentation,
  getSettlementStatusPresentation,
} from "./payment.status";

import {
  getRefundReasonLabel,
} from "./payment.formatters";

describe(
  "Client financial status behavior",
  () => {
    it(
      "covers every payment summary state",
      () => {
        const statuses:
          Array<
            Parameters<
              typeof getPaymentStatusSummary
            >[0]
          > = [
            "created",
            "pending",
            "authorized",
            "captured",
            "paid",
            "partially_paid",
            "refund_pending",
            "partially_refunded",
            "refunded",
            "failed",
            "cancelled",
            "expired",
            "disputed",
          ];

        for (
          const status
          of statuses
        ) {
          const summary =
            getPaymentStatusSummary(
              status
            );

          expect(
            summary.status
          ).toBe(
            status
          );

          expect(
            typeof summary.paymentVerified
          ).toBe(
            "boolean"
          );

          expect(
            typeof summary.captured
          ).toBe(
            "boolean"
          );

          expect(
            typeof summary.refundable
          ).toBe(
            "boolean"
          );

          expect(
            typeof summary.terminal
          ).toBe(
            "boolean"
          );
        }

        expect(
          getPaymentStatusSummary(
            "paid"
          )
        ).toMatchObject({
          paymentVerified:
            true,

          captured:
            true,

          refundable:
            true,

          terminal:
            false,
        });

        expect(
          getPaymentStatusSummary(
            "refunded"
          )
        ).toMatchObject({
          paymentVerified:
            true,

          captured:
            true,

          refundable:
            false,

          terminal:
            true,
        });

        expect(
          getPaymentStatusSummary(
            "failed"
          )
        ).toMatchObject({
          paymentVerified:
            false,

          captured:
            false,

          refundable:
            false,

          terminal:
            true,
        });

        expect(
          getPaymentStatusSummary(
            "disputed"
          )
        ).toMatchObject({
          paymentVerified:
            true,

          captured:
            true,

          refundable:
            false,

          terminal:
            false,
        });
      },
    );

    it(
      "covers every invoice summary state",
      () => {
        const statuses:
          Array<
            Parameters<
              typeof getInvoiceStatusSummary
            >[0]
          > = [
            "draft",
            "issued",
            "payment_pending",
            "partially_paid",
            "overdue",
            "paid",
            "refund_pending",
            "partially_refunded",
            "refunded",
            "cancelled",
          ];

        for (
          const status
          of statuses
        ) {
          const summary =
            getInvoiceStatusSummary(
              status
            );

          expect(
            summary.status
          ).toBe(
            status
          );

          expect(
            typeof summary.payable
          ).toBe(
            "boolean"
          );

          expect(
            typeof summary.paid
          ).toBe(
            "boolean"
          );

          expect(
            typeof summary.overdue
          ).toBe(
            "boolean"
          );

          expect(
            typeof summary.refundable
          ).toBe(
            "boolean"
          );

          expect(
            typeof summary.terminal
          ).toBe(
            "boolean"
          );
        }

        expect(
          getInvoiceStatusSummary(
            "overdue"
          )
        ).toMatchObject({
          payable:
            true,

          overdue:
            true,

          terminal:
            false,
        });

        expect(
          getInvoiceStatusSummary(
            "paid"
          )
        ).toMatchObject({
          payable:
            false,

          paid:
            true,

          refundable:
            true,
        });

        expect(
          getInvoiceStatusSummary(
            "cancelled"
          ).terminal
        ).toBe(
          true
        );
      },
    );

    it(
      "covers every refund summary state",
      () => {
        const statuses:
          Array<
            Parameters<
              typeof getRefundStatusSummary
            >[0]
          > = [
            "requested",
            "under_review",
            "approved",
            "processing",
            "partially_refunded",
            "refunded",
            "failed",
            "rejected",
            "cancelled",
          ];

        for (
          const status
          of statuses
        ) {
          const summary =
            getRefundStatusSummary(
              status
            );

          expect(
            summary.status
          ).toBe(
            status
          );

          expect(
            typeof summary.pending
          ).toBe(
            "boolean"
          );

          expect(
            typeof summary.approved
          ).toBe(
            "boolean"
          );

          expect(
            typeof summary.processing
          ).toBe(
            "boolean"
          );

          expect(
            typeof summary.completed
          ).toBe(
            "boolean"
          );

          expect(
            typeof summary.failed
          ).toBe(
            "boolean"
          );

          expect(
            typeof summary.terminal
          ).toBe(
            "boolean"
          );
        }

        expect(
          getRefundStatusSummary(
            "requested"
          )
        ).toMatchObject({
          pending:
            true,

          approved:
            false,

          terminal:
            false,
        });

        expect(
          getRefundStatusSummary(
            "refunded"
          )
        ).toMatchObject({
          approved:
            true,

          completed:
            true,

          terminal:
            true,
        });

        expect(
          getRefundStatusSummary(
            "failed"
          )
        ).toMatchObject({
          failed:
            true,

          terminal:
            true,
        });
      },
    );

    it(
      "covers every settlement summary state",
      () => {
        const statuses:
          Array<
            Parameters<
              typeof getSettlementStatusSummary
            >[0]
          > = [
            "not_initiated",
            "queued",
            "processing",
            "settled",
            "failed",
            "on_hold",
            "reversed",
          ];

        for (
          const status
          of statuses
        ) {
          const summary =
            getSettlementStatusSummary(
              status
            );

          expect(
            summary.status
          ).toBe(
            status
          );

          expect(
            typeof summary.processing
          ).toBe(
            "boolean"
          );

          expect(
            typeof summary.completed
          ).toBe(
            "boolean"
          );

          expect(
            typeof summary.failed
          ).toBe(
            "boolean"
          );

          expect(
            typeof summary.held
          ).toBe(
            "boolean"
          );

          expect(
            typeof summary.terminal
          ).toBe(
            "boolean"
          );
        }

        expect(
          getSettlementStatusSummary(
            "settled"
          )
        ).toMatchObject({
          completed:
            true,

          terminal:
            true,
        });

        expect(
          getSettlementStatusSummary(
            "on_hold"
          )
        ).toMatchObject({
          held:
            true,

          terminal:
            false,
        });

        expect(
          getSettlementStatusSummary(
            "failed"
          )
        ).toMatchObject({
          failed:
            true,

          terminal:
            true,
        });
      },
    );

    it(
      "returns a complete payment presentation for every payment state",
      () => {
        const statuses:
          Array<
            Parameters<
              typeof getPaymentStatusPresentation
            >[0]
          > = [
            "created",
            "pending",
            "authorized",
            "captured",
            "paid",
            "partially_paid",
            "failed",
            "cancelled",
            "expired",
            "refund_pending",
            "partially_refunded",
            "refunded",
            "disputed",
          ];

        for (
          const status
          of statuses
        ) {
          const presentation =
            getPaymentStatusPresentation(
              status
            );

          expect(
            presentation.label.length
          ).toBeGreaterThan(
            0
          );

          expect(
            presentation.description.length
          ).toBeGreaterThan(
            0
          );

          expect(
            [
              "neutral",
              "attention",
              "information",
              "success",
              "danger",
            ]
          ).toContain(
            presentation.tone
          );
        }

        expect(
          getPaymentStatusPresentation(
            "paid"
          )
        ).toMatchObject({
          label:
            "Paid",

          tone:
            "success",
        });

        expect(
          getPaymentStatusPresentation(
            "failed"
          )
        ).toMatchObject({
          label:
            "Payment failed",

          tone:
            "danger",
        });
      },
    );

    it(
      "returns complete invoice, refund, settlement, and budget presentations",
      () => {
        const invoiceStatuses:
          Array<
            Parameters<
              typeof getInvoiceStatusPresentation
            >[0]
          > = [
            "draft",
            "issued",
            "payment_pending",
            "partially_paid",
            "overdue",
            "paid",
            "refund_pending",
            "partially_refunded",
            "refunded",
            "cancelled",
          ];

        const refundStatuses:
          Array<
            Parameters<
              typeof getRefundStatusPresentation
            >[0]
          > = [
            "requested",
            "under_review",
            "approved",
            "processing",
            "partially_refunded",
            "refunded",
            "failed",
            "rejected",
            "cancelled",
          ];

        const settlementStatuses:
          Array<
            Parameters<
              typeof getSettlementStatusPresentation
            >[0]
          > = [
            "not_initiated",
            "queued",
            "processing",
            "settled",
            "failed",
            "on_hold",
            "reversed",
          ];

        const budgetStatuses:
          Array<
            Parameters<
              typeof getCampaignBudgetStatusPresentation
            >[0]
          > = [
            "not_funded",
            "funding_pending",
            "available",
            "low_balance",
            "partially_reserved",
            "fully_reserved",
            "depleted",
            "refund_pending",
            "blocked",
            "closed",
          ];

        for (
          const status
          of invoiceStatuses
        ) {
          const result =
            getInvoiceStatusPresentation(
              status
            );

          expect(
            result.label.length
          ).toBeGreaterThan(
            0
          );

          expect(
            result.description.length
          ).toBeGreaterThan(
            0
          );
        }

        for (
          const status
          of refundStatuses
        ) {
          const result =
            getRefundStatusPresentation(
              status
            );

          expect(
            result.label.length
          ).toBeGreaterThan(
            0
          );

          expect(
            result.description.length
          ).toBeGreaterThan(
            0
          );
        }

        for (
          const status
          of settlementStatuses
        ) {
          const result =
            getSettlementStatusPresentation(
              status
            );

          expect(
            result.label.length
          ).toBeGreaterThan(
            0
          );

          expect(
            result.description.length
          ).toBeGreaterThan(
            0
          );
        }

        for (
          const status
          of budgetStatuses
        ) {
          const result =
            getCampaignBudgetStatusPresentation(
              status
            );

          expect(
            result.label.length
          ).toBeGreaterThan(
            0
          );

          expect(
            result.description.length
          ).toBeGreaterThan(
            0
          );
        }
      },
    );

    it(
      "maps every refund reason to a user-facing label",
      () => {
        const cases:
          Array<
            [
              Parameters<
                typeof getRefundReasonLabel
              >[0],
              string,
            ]
          > = [
            [
              "unused_campaign_balance",
              "Unused campaign balance",
            ],
            [
              "invalid_traffic_credit",
              "Invalid-traffic credit",
            ],
            [
              "duplicate_charge",
              "Duplicate charge",
            ],
            [
              "campaign_cancelled",
              "Campaign cancelled",
            ],
            [
              "campaign_under_delivery",
              "Campaign under-delivery",
            ],
            [
              "contract_adjustment",
              "Contract adjustment",
            ],
            [
              "payment_error",
              "Payment error",
            ],
            [
              "billing_correction",
              "Billing correction",
            ],
            [
              "goodwill",
              "Goodwill refund",
            ],
            [
              "other",
              "Other",
            ],
          ];

        for (
          const [
            reason,
            expected,
          ]
          of cases
        ) {
          expect(
            getRefundReasonLabel(
              reason
            )
          ).toBe(
            expected
          );
        }
      },
    );
  },
);