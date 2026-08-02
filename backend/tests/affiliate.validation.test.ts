import {
  describe,
  expect,
  it,
} from "vitest";

import {
  AFFILIATE_DISCLOSURE,
  type AffiliateMetadataDraftInput,
} from "../src/domains/monetization/affiliate.types.js";

import {
  validateAffiliateExpectedRowVersion,
  validateAffiliateMetadataDraft,
} from "../src/domains/monetization/affiliate.validation.js";

const VALID_DRAFT:
  AffiliateMetadataDraftInput = {
  partnerName:
    "Example Learning",

  offerName:
    "Professional Learning Offer",

  destinationUrl:
    "https://example.com/learning",

  disclosure:
    AFFILIATE_DISCLOSURE,

  commissionModel:
    "cpa",

  commissionTerms: {
    amountMinorUnits:
      50000,

    currencyCode:
      "INR",
  },

  trackingStatus:
    "pending_verification",

  trackingUrl:
    "https://track.example.com/click",

  payoutReadinessStatus:
    "not_ready",
};

describe(
  "Affiliate metadata validation",
  () => {
    it(
      "accepts valid affiliate metadata",
      () => {
        expect(
          validateAffiliateMetadataDraft(
            VALID_DRAFT
          )
        ).toEqual(
          []
        );
      }
    );

    it(
      "requires partner, offer, and destination information",
      () => {
        const issues =
          validateAffiliateMetadataDraft({
            ...VALID_DRAFT,

            partnerName:
              "",

            offerName:
              "A",

            destinationUrl:
              "",
          });

        expect(
          issues.map(
            issue =>
              issue.field
          )
        ).toEqual(
          expect.arrayContaining([
            "partnerName",
            "offerName",
            "destinationUrl",
          ])
        );
      }
    );

    it(
      "rejects unsupported disclosure and status values",
      () => {
        const issues =
          validateAffiliateMetadataDraft({
            ...VALID_DRAFT,

            disclosure:
              "Sponsored" as
                typeof AFFILIATE_DISCLOSURE,

            commissionModel:
              "unknown" as
                AffiliateMetadataDraftInput[
                  "commissionModel"
                ],

            trackingStatus:
              "unknown" as
                AffiliateMetadataDraftInput[
                  "trackingStatus"
                ],

            payoutReadinessStatus:
              "unknown" as
                AffiliateMetadataDraftInput[
                  "payoutReadinessStatus"
                ],
          });

        expect(
          issues.map(
            issue =>
              issue.field
          )
        ).toEqual(
          expect.arrayContaining([
            "disclosure",
            "commissionModel",
            "trackingStatus",
            "payoutReadinessStatus",
          ])
        );
      }
    );

    it(
      "rejects invalid destination and tracking URLs",
      () => {
        const issues =
          validateAffiliateMetadataDraft({
            ...VALID_DRAFT,

            destinationUrl:
              "ftp://example.com/offer",

            trackingUrl:
              "not-a-url",
          });

        expect(
          issues.map(
            issue =>
              issue.field
          )
        ).toEqual([
          "destinationUrl",
          "trackingUrl",
        ]);
      }
    );

    it(
      "validates expected row versions",
      () => {
        expect(
          validateAffiliateExpectedRowVersion(
            "12"
          )
        ).toEqual(
          []
        );

        expect(
          validateAffiliateExpectedRowVersion(
            "01"
          )
        ).toEqual([
          expect.objectContaining({
            field:
              "expectedRowVersion",
          }),
        ]);
      }
    );
  }
);