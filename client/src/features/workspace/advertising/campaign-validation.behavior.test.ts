import {
  describe,
  expect,
  it,
} from "vitest";

import type {
  AdvertisingCampaign,
} from "./advertising.types";

import {
  validateAdvertisingCampaign,
} from "./advertising.validation";

function createValidCampaign():
  AdvertisingCampaign {
  return {
    id:
      "CMP-TEST",

    requestId:
      "ADV-TEST",

    approvedRequestVersion:
      1,

    organizationId:
      "ORG-TEST",

    organizationName:
      "Poster Test Organization",

    name:
      "Knowledge Campaign",

    type:
      "direct_sponsorship",

    status:
      "scheduled",

    eligibilityStatus:
      "eligible",

    billing: {
      model:
        "fixed_contract",

      currency:
        "INR",

      contractValueMinor:
        500000,

      budgetMinor:
        500000,

      spendLimitMinor:
        500000,

      deliveryTarget:
        10000,
    },

    placements: [
      {
        placementId:
          "PLC-HOME",

        surface:
          "home",

        creativeVersionId:
          "CRV-1",

        enabled:
          true,

        allocationPercentage:
          100,

        priority:
          0,

        startAt:
          "2026-08-15T00:00:00.000Z",

        endAt:
          "2026-09-15T00:00:00.000Z",
      },
    ],

    trackingStatus:
      "connected",

    destinationUrl:
      "https://publisher.example/knowledge",

    scheduledStartAt:
      "2026-08-15T00:00:00.000Z",

    scheduledEndAt:
      "2026-09-15T00:00:00.000Z",

    approvedCreativeVersionId:
      "CRV-1",

    createdBy: {
      actorType:
        "admin",

      actorId:
        "ADM-1",

      displayName:
        "Poster Admin",
    },

    createdAt:
      "2026-08-01T00:00:00.000Z",

    updatedAt:
      "2026-08-10T00:00:00.000Z",
  };
}

function requireError(
  campaign:
    AdvertisingCampaign,

  message:
    string
) {
  const result =
    validateAdvertisingCampaign(
      campaign
    );

  expect(
    result.valid
  ).toBe(
    false
  );

  expect(
    result.errors
  ).toContain(
    message
  );
}

describe(
  "AdvertisingCampaign validation behavior",
  () => {
    it(
      "accepts the canonical valid campaign contract",
      () => {
        expect(
          validateAdvertisingCampaign(
            createValidCampaign()
          )
        ).toEqual({
          valid:
            true,

          errors:
            [],
        });
      }
    );

    it(
      "rejects invalid branded identities",
      () => {
        const campaign =
          createValidCampaign();

        campaign.id =
          "BAD" as never;

        campaign.requestId =
          "BAD" as never;

        campaign.organizationId =
          "BAD" as never;

        campaign.approvedRequestVersion =
          0;

        campaign.name =
          " ";

        campaign.approvedCreativeVersionId =
          " ";

        const result =
          validateAdvertisingCampaign(
            campaign
          );

        expect(
          result.errors
        ).toEqual(
          expect.arrayContaining([
            "Campaign ID must start with CMP-.",
            "Campaign request ID must start with ADV-.",
            "Campaign organization ID must start with ORG-.",
            "Campaign must reference a positive approved request version.",
            "Campaign name is required.",
            "Campaign requires an approved creative version ID.",
          ])
        );
      }
    );

    it(
      "rejects an unsafe destination URL",
      () => {
        const campaign =
          createValidCampaign();

        campaign.destinationUrl =
          "javascript:alert(1)";

        requireError(
          campaign,
          "Campaign requires a valid destination URL."
        );
      }
    );

    it(
      "rejects invalid campaign timestamps",
      () => {
        const start =
          createValidCampaign();

        start.scheduledStartAt =
          "invalid";

        requireError(
          start,
          "Campaign scheduled start timestamp is invalid."
        );

        const end =
          createValidCampaign();

        end.scheduledEndAt =
          "invalid";

        requireError(
          end,
          "Campaign scheduled end timestamp is invalid."
        );
      }
    );

    it(
      "rejects reversed campaign dates",
      () => {
        const campaign =
          createValidCampaign();

        campaign.scheduledStartAt =
          "2026-09-15T00:00:00.000Z";

        campaign.scheduledEndAt =
          "2026-08-15T00:00:00.000Z";

        requireError(
          campaign,
          "Campaign scheduled end must not be earlier than its start."
        );
      }
    );

    it(
      "requires at least one placement",
      () => {
        const campaign =
          createValidCampaign();

        campaign.placements =
          [];

        requireError(
          campaign,
          "Campaign requires at least one placement allocation."
        );
      }
    );

    it(
      "requires unique placement IDs",
      () => {
        const campaign =
          createValidCampaign();

        campaign.placements = [
          {
            ...campaign.placements[0],

            allocationPercentage:
              50,
          },

          {
            ...campaign.placements[0],

            allocationPercentage:
              50,
          },
        ];

        requireError(
          campaign,
          "Campaign placement IDs must be unique."
        );
      }
    );

    it(
      "requires placement allocation to total 100",
      () => {
        const campaign =
          createValidCampaign();

        campaign.placements[0]
          .allocationPercentage =
            50;

        requireError(
          campaign,
          "Campaign placement allocation percentages must total 100."
        );
      }
    );

    it(
      "rejects invalid placement contract values",
      () => {
        const campaign =
          createValidCampaign();

        const placement =
          campaign.placements[0];

        placement.placementId =
          " ";

        placement.surface =
          "unsupported" as never;

        placement.creativeVersionId =
          " ";

        placement.allocationPercentage =
          101;

        placement.priority =
          -1;

        const result =
          validateAdvertisingCampaign(
            campaign
          );

        expect(
          result.errors
        ).toEqual(
          expect.arrayContaining([
            "Campaign placement requires an ID.",
            "Unsupported campaign placement surface: unsupported.",
            "Campaign placement requires a creative version ID.",
            "Placement allocation percentage must be between 0 and 100.",
            "Placement priority must be a non-negative integer.",
          ])
        );
      }
    );

    it(
      "rejects invalid placement timestamps",
      () => {
        const start =
          createValidCampaign();

        start.placements[0].startAt =
          "invalid";

        requireError(
          start,
          "Placement start timestamp is invalid."
        );

        const end =
          createValidCampaign();

        end.placements[0].endAt =
          "invalid";

        requireError(
          end,
          "Placement end timestamp is invalid."
        );
      }
    );

    it(
      "rejects reversed placement dates",
      () => {
        const campaign =
          createValidCampaign();

        campaign.placements[0].startAt =
          "2026-09-15T00:00:00.000Z";

        campaign.placements[0].endAt =
          "2026-08-15T00:00:00.000Z";

        requireError(
          campaign,
          "Placement end timestamp must not be earlier than its start timestamp."
        );
      }
    );

    it(
      "requires approved rates for CPC CPM and CPA",
      () => {
        for (
          const model of [
            "cpc",
            "cpm",
            "cpa",
          ] as const
        ) {
          const campaign =
            createValidCampaign();

          campaign.billing = {
            model,

            currency:
              "INR",

            budgetMinor:
              100000,
          };

          requireError(
            campaign,
            `${model.toUpperCase()} billing requires an approved rate.`
          );
        }
      }
    );

    it(
      "requires fixed contract value",
      () => {
        const campaign =
          createValidCampaign();

        campaign.billing = {
          model:
            "fixed_contract",

          currency:
            "INR",
        };

        requireError(
          campaign,
          "Fixed-contract billing requires a contract value."
        );
      }
    );

    it(
      "requires affiliate conversion definition",
      () => {
        const campaign =
          createValidCampaign();

        campaign.billing = {
          model:
            "affiliate",

          currency:
            "INR",
        };

        requireError(
          campaign,
          "Affiliate billing requires a conversion definition."
        );
      }
    );

    it(
      "rejects unsupported currency",
      () => {
        const campaign =
          createValidCampaign();

        campaign.billing.currency =
          "EUR" as never;

        requireError(
          campaign,
          "Unsupported currency: EUR."
        );
      }
    );

    it(
      "rejects negative financial minor-unit values",
      () => {
        const campaign =
          createValidCampaign();

        campaign.billing = {
          model:
            "budget_based",

          currency:
            "INR",

          approvedRateMinor:
            -1,

          budgetMinor:
            -2,

          contractValueMinor:
            -3,

          spendLimitMinor:
            -4,
        };

        const result =
          validateAdvertisingCampaign(
            campaign
          );

        expect(
          result.errors
        ).toEqual(
          expect.arrayContaining([
            "Campaign approved rate must be a non-negative integer in minor currency units.",
            "Campaign budget must be a non-negative integer in minor currency units.",
            "Campaign contract value must be a non-negative integer in minor currency units.",
            "Campaign spend limit must be a non-negative integer in minor currency units.",
          ])
        );
      }
    );

    it(
      "rejects invalid delivery target",
      () => {
        const campaign =
          createValidCampaign();

        campaign.billing.deliveryTarget =
          -1;

        requireError(
          campaign,
          "Campaign delivery target must be a non-negative integer."
        );
      }
    );

    it(
      "requires creating actor identity",
      () => {
        const campaign =
          createValidCampaign();

        campaign.createdBy.actorId =
          " ";

        requireError(
          campaign,
          "Campaign requires a creating actor ID."
        );
      }
    );

    it(
      "requires valid creation and update timestamps",
      () => {
        const created =
          createValidCampaign();

        created.createdAt =
          "invalid";

        requireError(
          created,
          "Campaign creation timestamp is invalid."
        );

        const updated =
          createValidCampaign();

        updated.updatedAt =
          "invalid";

        requireError(
          updated,
          "Campaign update timestamp is invalid."
        );
      }
    );
  }
);