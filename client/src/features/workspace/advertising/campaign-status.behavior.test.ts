import {
  describe,
  expect,
  it,
} from "vitest";

import {
  determineCampaignEligibility,
  getCampaignStatusLabel,
  isCampaignOperational,
  isCampaignTerminal,
} from "./advertising.status";

describe(
  "Campaign status behavior",
  () => {
    it(
      "maps every canonical campaign status to a stable Client label",
      () => {
        expect(
          getCampaignStatusLabel(
            "draft"
          )
        ).toBe(
          "Draft"
        );

        expect(
          getCampaignStatusLabel(
            "payment_pending"
          )
        ).toBe(
          "Payment pending"
        );

        expect(
          getCampaignStatusLabel(
            "scheduled"
          )
        ).toBe(
          "Scheduled"
        );

        expect(
          getCampaignStatusLabel(
            "active"
          )
        ).toBe(
          "Active"
        );

        expect(
          getCampaignStatusLabel(
            "paused"
          )
        ).toBe(
          "Paused"
        );

        expect(
          getCampaignStatusLabel(
            "ended"
          )
        ).toBe(
          "Ended"
        );

        expect(
          getCampaignStatusLabel(
            "disabled"
          )
        ).toBe(
          "Disabled"
        );

        expect(
          getCampaignStatusLabel(
            "cancelled"
          )
        ).toBe(
          "Cancelled"
        );
      }
    );

    it(
      "gives blocking state highest campaign-eligibility precedence",
      () => {
        expect(
          determineCampaignEligibility({
            blocked:
              true,

            requestApproved:
              false,

            creativeApproved:
              false,

            paymentRequired:
              true,

            paymentVerified:
              false,

            trackingRequired:
              true,

            trackingReady:
              false,
          })
        ).toBe(
          "blocked"
        );
      }
    );

    it(
      "requires both request and creative approval before payment readiness",
      () => {
        expect(
          determineCampaignEligibility({
            blocked:
              false,

            requestApproved:
              true,

            creativeApproved:
              false,

            paymentRequired:
              true,

            paymentVerified:
              false,

            trackingRequired:
              false,

            trackingReady:
              true,
          })
        ).toBe(
          "awaiting_review"
        );
      }
    );

    it(
      "blocks delivery while required payment is unverified",
      () => {
        expect(
          determineCampaignEligibility({
            blocked:
              false,

            requestApproved:
              true,

            creativeApproved:
              true,

            paymentRequired:
              true,

            paymentVerified:
              false,

            trackingRequired:
              false,

            trackingReady:
              true,
          })
        ).toBe(
          "awaiting_payment"
        );
      }
    );

    it(
      "blocks delivery while required tracking is not ready",
      () => {
        expect(
          determineCampaignEligibility({
            blocked:
              false,

            requestApproved:
              true,

            creativeApproved:
              true,

            paymentRequired:
              true,

            paymentVerified:
              true,

            trackingRequired:
              true,

            trackingReady:
              false,
          })
        ).toBe(
          "not_ready"
        );
      }
    );

    it(
      "marks campaign eligible only after all required gates pass",
      () => {
        expect(
          determineCampaignEligibility({
            blocked:
              false,

            requestApproved:
              true,

            creativeApproved:
              true,

            paymentRequired:
              true,

            paymentVerified:
              true,

            trackingRequired:
              true,

            trackingReady:
              true,
          })
        ).toBe(
          "eligible"
        );
      }
    );

    it(
      "keeps operational and terminal status classification mutually safe",
      () => {
        expect(
          isCampaignOperational(
            "scheduled"
          )
        ).toBe(
          true
        );

        expect(
          isCampaignOperational(
            "active"
          )
        ).toBe(
          true
        );

        expect(
          isCampaignTerminal(
            "ended"
          )
        ).toBe(
          true
        );

        expect(
          isCampaignTerminal(
            "cancelled"
          )
        ).toBe(
          true
        );

        expect(
          isCampaignTerminal(
            "active"
          )
        ).toBe(
          false
        );
      }
    );
  }
);