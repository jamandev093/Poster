import {
  describe,
  expect,
  it,
} from "vitest";

import {
  calculateCampaignBudgetAmounts,
  createCampaignBudgetSummary,
  determineCampaignBudgetStatus,
} from "./budget.types";

import {
  assertLedgerEntryIntegrity,
  getExpectedLedgerDirection,
} from "./ledger.types";

import {
  getPaymentStatusSummary,
  isPaymentVerified,
} from "./payment.types";

import {
  calculateMaximumRefundableAmountMinor,
  validateRefundEligibilityBreakdown,
} from "./refund.types";

import {
  assertSettlementCurrencyConsistency,
} from "./settlement.types";

describe(
  "Client financial integrity behavior",
  () => {
    it(
      "calculates authoritative campaign budget availability from verified movements",
      () => {
        const amounts =
          calculateCampaignBudgetAmounts({
            currency:
              "INR",

            allocatedMinor:
              12000,

            paidMinor:
              10000,

            reservedMinor:
              2000,

            estimatedSpendMinor:
              700,

            pendingValidationSpendMinor:
              300,

            finalizedSpendMinor:
              3000,

            invalidTrafficCreditMinor:
              500,

            adjustmentCreditMinor:
              100,

            adjustmentDebitMinor:
              200,

            refundReservedMinor:
              500,

            refundedMinor:
              1000,

            disputedMinor:
              1000,
          });

        expect(
          amounts.availableMinor
        ).toBe(
          2900
        );

        expect(
          amounts.remainingMinor
        ).toBe(
          2900
        );

        expect(
          amounts.currency
        ).toBe(
          "INR"
        );

        expect(
          () =>
            calculateCampaignBudgetAmounts({
              currency:
                "INR",

              allocatedMinor:
                -1,

              paidMinor:
                0,

              reservedMinor:
                0,

              estimatedSpendMinor:
                0,

              pendingValidationSpendMinor:
                0,

              finalizedSpendMinor:
                0,

              invalidTrafficCreditMinor:
                0,

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
            })
        ).toThrow();
      },
    );

    it(
      "applies campaign budget status precedence correctly",
      () => {
        const base = {
          funded:
            true,

          fundingPending:
            false,

          blocked:
            false,

          closed:
            false,

          refundPending:
            false,

          availableMinor:
            1000,

          reservedMinor:
            0,

          paidMinor:
            5000,
        };

        expect(
          determineCampaignBudgetStatus({
            ...base,
            blocked:
              true,
            closed:
              true,
          })
        ).toBe(
          "blocked"
        );

        expect(
          determineCampaignBudgetStatus({
            ...base,
            closed:
              true,
          })
        ).toBe(
          "closed"
        );

        expect(
          determineCampaignBudgetStatus({
            ...base,
            refundPending:
              true,
          })
        ).toBe(
          "refund_pending"
        );

        expect(
          determineCampaignBudgetStatus({
            ...base,
            funded:
              false,
            fundingPending:
              true,
          })
        ).toBe(
          "funding_pending"
        );

        expect(
          determineCampaignBudgetStatus({
            ...base,
            funded:
              false,
          })
        ).toBe(
          "not_funded"
        );

        expect(
          determineCampaignBudgetStatus({
            ...base,
            paidMinor:
              0,
          })
        ).toBe(
          "not_funded"
        );

        expect(
          determineCampaignBudgetStatus({
            ...base,
            availableMinor:
              0,
            reservedMinor:
              500,
          })
        ).toBe(
          "fully_reserved"
        );

        expect(
          determineCampaignBudgetStatus({
            ...base,
            availableMinor:
              0,
            reservedMinor:
              0,
          })
        ).toBe(
          "depleted"
        );

        expect(
          determineCampaignBudgetStatus({
            ...base,
            availableMinor:
              500,
            lowBalanceThresholdMinor:
              500,
          })
        ).toBe(
          "low_balance"
        );

        expect(
          determineCampaignBudgetStatus({
            ...base,
            reservedMinor:
              250,
          })
        ).toBe(
          "partially_reserved"
        );

        expect(
          determineCampaignBudgetStatus(
            base
          )
        ).toBe(
          "available"
        );
      },
    );

    it(
      "creates a campaign budget summary without changing authoritative amounts",
      () => {
        const amounts =
          calculateCampaignBudgetAmounts({
            currency:
              "INR",

            allocatedMinor:
              10000,

            paidMinor:
              8000,

            reservedMinor:
              1000,

            estimatedSpendMinor:
              200,

            pendingValidationSpendMinor:
              100,

            finalizedSpendMinor:
              2000,

            invalidTrafficCreditMinor:
              300,

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
          });

        const budget = {
          campaignId:
            "CMP-TEST",

          status:
            "available",

          currency:
            "INR",

          amounts,

          freshness: {
            updatedAt:
              "2026-08-13T00:00:00.000Z",

            lastReconciledAt:
              "2026-08-13T00:00:00.000Z",
          },
        } as unknown as
          Parameters<
            typeof createCampaignBudgetSummary
          >[0];

        const summary =
          createCampaignBudgetSummary(
            budget
          );

        expect(
          summary
        ).toMatchObject({
          campaignId:
            "CMP-TEST",

          status:
            "available",

          currency:
            "INR",

          paidMinor:
            8000,

          availableMinor:
            amounts.availableMinor,

          remainingMinor:
            amounts.remainingMinor,

          lastUpdatedAt:
            "2026-08-13T00:00:00.000Z",
        });
      },
    );

    it(
      "maps every fixed ledger entry type to the required direction",
      () => {
        const creditTypes:
          Array<
            Parameters<
              typeof getExpectedLedgerDirection
            >[0]
          > = [
            "payment_credit",
            "manual_payment_credit",
            "campaign_funds_released",
            "invalid_traffic_credit",
            "billing_adjustment_credit",
            "refund_release",
            "dispute_release",
            "opening_balance",
          ];

        const debitTypes:
          Array<
            Parameters<
              typeof getExpectedLedgerDirection
            >[0]
          > = [
            "campaign_funds_reserved",
            "estimated_spend",
            "pending_validation_spend",
            "finalized_spend",
            "billing_adjustment_debit",
            "refund_reservation",
            "refund_debit",
            "chargeback_debit",
            "dispute_hold",
            "expired_balance_debit",
          ];

        for (
          const type
          of creditTypes
        ) {
          expect(
            getExpectedLedgerDirection(
              type
            )
          ).toBe(
            "credit"
          );
        }

        for (
          const type
          of debitTypes
        ) {
          expect(
            getExpectedLedgerDirection(
              type
            )
          ).toBe(
            "debit"
          );
        }

        expect(
          () =>
            getExpectedLedgerDirection(
              "migration_adjustment"
            )
        ).toThrow(
          "Migration adjustment direction must be selected explicitly."
        );
      },
    );

    it(
      "rejects structurally inconsistent ledger movements",
      () => {
        const validCredit = {
          id:
            "LED-1",

          type:
            "payment_credit",

          direction:
            "credit",

          amount: {
            currency:
              "INR",

            amountMinor:
              500,
          },

          balanceBeforeMinor:
            1000,

          balanceAfterMinor:
            1500,
        } as unknown as
          Parameters<
            typeof assertLedgerEntryIntegrity
          >[0];

        const validDebit = {
          id:
            "LED-2",

          type:
            "finalized_spend",

          direction:
            "debit",

          amount: {
            currency:
              "INR",

            amountMinor:
              -200,
          },

          balanceBeforeMinor:
            1000,

          balanceAfterMinor:
            800,
        } as unknown as
          Parameters<
            typeof assertLedgerEntryIntegrity
          >[0];

        expect(
          () =>
            assertLedgerEntryIntegrity(
              validCredit
            )
        ).not.toThrow();

        expect(
          () =>
            assertLedgerEntryIntegrity(
              validDebit
            )
        ).not.toThrow();

        const wrongDirection = {
          ...validCredit,

          direction:
            "debit",
        } as unknown as
          Parameters<
            typeof assertLedgerEntryIntegrity
          >[0];

        expect(
          () =>
            assertLedgerEntryIntegrity(
              wrongDirection
            )
        ).toThrow();

        const wrongBalance = {
          ...validCredit,

          balanceAfterMinor:
            1499,
        } as unknown as
          Parameters<
            typeof assertLedgerEntryIntegrity
          >[0];

        expect(
          () =>
            assertLedgerEntryIntegrity(
              wrongBalance
            )
        ).toThrow(
          "Ledger balance-after value does not match the entry movement."
        );

        const selfReversal = {
          ...validCredit,

          reversesEntryId:
            "LED-1",
        } as unknown as
          Parameters<
            typeof assertLedgerEntryIntegrity
          >[0];

        expect(
          () =>
            assertLedgerEntryIntegrity(
              selfReversal
            )
        ).toThrow(
          "Ledger entry cannot reverse itself."
        );

        const finalizedWithoutTimestamp = {
          ...validCredit,

          status:
            "finalized",
        } as unknown as
          Parameters<
            typeof assertLedgerEntryIntegrity
          >[0];

        expect(
          () =>
            assertLedgerEntryIntegrity(
              finalizedWithoutTimestamp
            )
        ).toThrow(
          "Finalized ledger entries require a finalization timestamp."
        );
      },
    );

    it(
      "calculates and validates refund eligibility conservatively",
      () => {
        expect(
          calculateMaximumRefundableAmountMinor({
            capturedAmountMinor:
              10000,

            previouslyRefundedAmountMinor:
              1000,

            unusedCampaignBalanceMinor:
              3000,

            invalidTrafficCreditMinor:
              500,

            approvedContractRefundMinor:
              1000,
          })
        ).toBe(
          4500
        );

        expect(
          calculateMaximumRefundableAmountMinor({
            capturedAmountMinor:
              5000,

            previouslyRefundedAmountMinor:
              4000,

            unusedCampaignBalanceMinor:
              5000,

            invalidTrafficCreditMinor:
              5000,

            approvedContractRefundMinor:
              5000,
          })
        ).toBe(
          1000
        );

        expect(
          () =>
            calculateMaximumRefundableAmountMinor({
              capturedAmountMinor:
                -1,

              previouslyRefundedAmountMinor:
                0,

              unusedCampaignBalanceMinor:
                0,

              invalidTrafficCreditMinor:
                0,

              approvedContractRefundMinor:
                0,
            })
        ).toThrow();

        const money =
          (
            amountMinor:
              number,
            currency =
              "INR"
          ) => ({
            amountMinor,
            currency,
          });

        const eligibility = {
          paymentCapturedAmount:
            money(
              10000
            ),

          previouslyRefundedAmount:
            money(
              1000
            ),

          unusedCampaignBalance:
            money(
              3000
            ),

          invalidTrafficCredit:
            money(
              500
            ),

          approvedContractRefund:
            money(
              1000
            ),

          nonRefundableFinalizedSpend:
            money(
              5500
            ),

          maximumRefundableAmount:
            money(
              4500
            ),
        } as unknown as
          Parameters<
            typeof validateRefundEligibilityBreakdown
          >[0];

        expect(
          () =>
            validateRefundEligibilityBreakdown(
              eligibility
            )
        ).not.toThrow();

        const badMaximum = {
          ...eligibility,

          maximumRefundableAmount:
            money(
              4499
            ),
        } as unknown as
          Parameters<
            typeof validateRefundEligibilityBreakdown
          >[0];

        expect(
          () =>
            validateRefundEligibilityBreakdown(
              badMaximum
            )
        ).toThrow(
          "Maximum refundable amount does not match the approved refund sources."
        );

        const currencyConflict = {
          ...eligibility,

          invalidTrafficCredit:
            money(
              500,
              "USD"
            ),
        } as unknown as
          Parameters<
            typeof validateRefundEligibilityBreakdown
          >[0];

        expect(
          () =>
            validateRefundEligibilityBreakdown(
              currencyConflict
            )
        ).toThrow(
          "All refund eligibility amounts must use the same currency."
        );
      },
    );

    it(
      "requires Backend-verifiable payment state before treating payment as verified",
      () => {
        const verifiedPayment = {
          status:
            "captured",

          webhookVerification: {
            verificationStatus:
              "verified",

            signatureVerified:
              true,
          },
        } as unknown as
          Parameters<
            typeof isPaymentVerified
          >[0];

        expect(
          isPaymentVerified(
            verifiedPayment
          )
        ).toBe(
          true
        );

        const badSignature = {
          ...verifiedPayment,

          webhookVerification: {
            verificationStatus:
              "verified",

            signatureVerified:
              false,
          },
        } as unknown as
          Parameters<
            typeof isPaymentVerified
          >[0];

        expect(
          isPaymentVerified(
            badSignature
          )
        ).toBe(
          false
        );

        const pendingPayment = {
          ...verifiedPayment,

          status:
            "pending",
        } as unknown as
          Parameters<
            typeof isPaymentVerified
          >[0];

        expect(
          isPaymentVerified(
            pendingPayment
          )
        ).toBe(
          false
        );

        expect(
          getPaymentStatusSummary(
            "captured"
          ).paymentVerified
        ).toBe(
          true
        );
      },
    );

    it(
      "enforces one settlement currency and non-negative settlement amounts",
      () => {
        const money =
          (
            amountMinor:
              number,
            currency =
              "INR"
          ) => ({
            amountMinor,
            currency,
          });

        const settlement = {
          settlementCurrency:
            "INR",

          grossAmount:
            money(
              10000
            ),

          providerFee:
            money(
              500
            ),

          taxAmount:
            money(
              90
            ),

          adjustmentAmount:
            money(
              0
            ),

          netAmount:
            money(
              9410
            ),

          paymentAllocations:
            [],

          adjustments:
            [],
        } as unknown as
          Parameters<
            typeof assertSettlementCurrencyConsistency
          >[0];

        expect(
          () =>
            assertSettlementCurrencyConsistency(
              settlement
            )
        ).not.toThrow();

        const currencyConflict = {
          ...settlement,

          providerFee:
            money(
              500,
              "USD"
            ),
        } as unknown as
          Parameters<
            typeof assertSettlementCurrencyConsistency
          >[0];

        expect(
          () =>
            assertSettlementCurrencyConsistency(
              currencyConflict
            )
        ).toThrow();

        const negativeAmount = {
          ...settlement,

          grossAmount:
            money(
              -1
            ),
        } as unknown as
          Parameters<
            typeof assertSettlementCurrencyConsistency
          >[0];

        expect(
          () =>
            assertSettlementCurrencyConsistency(
              negativeAmount
            )
        ).toThrow();
      },
    );
  },
);