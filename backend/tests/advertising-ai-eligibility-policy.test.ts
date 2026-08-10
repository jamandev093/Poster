import {
  describe,
  expect,
  it,
} from "vitest";

import {
  createAdvertisingAiEligibilityService,
} from "../src/application/advertising-ai/index.js";

import type {
  AdvertisingAiEligibilityPolicyInput,
} from "../src/domains/advertising-ai/index.js";

function input(
  overrides:
    Partial<
      AdvertisingAiEligibilityPolicyInput
    > = {}
):
  AdvertisingAiEligibilityPolicyInput {
  return {
    candidateId:
      "ad-1",

    candidateType:
      "direct_sponsorship",

    placement:
      "home",

    frame:
      "full_width_sponsored_card",

    campaign: {
      deliveryEligible:
        true,

      placements: [
        "home",
        "search",
      ],
    },

    decisions: {
      safetyAllowed:
        true,

      regionAllowed:
        true,

      deviceAllowed:
        true,

      frequencyAllowed:
        true,

      budgetAvailable:
        true,
    },

    hiddenMonetizationItemIds:
      [],

    programmatic:
      null,

    ...overrides,
  };
}

function enabledProgrammatic() {
  return {
    providerStatus:
      "enabled" as const,

    providerHealthStatus:
      "healthy" as const,

    mapping: {
      providerId:
        "00000000-0000-4000-8000-000000000001",

      screen:
        "home" as const,

      placement:
        "home-feed-sponsored",

      frame:
        "full_width_sponsored_card" as const,

      status:
        "enabled" as const,

      safetyRules: {
        policy:
          "authoritative",
      },

      regionRules: {
        policy:
          "authoritative",
      },

      deviceRules: {
        policy:
          "authoritative",
      },

      frequencyRules: {
        policy:
          "authoritative",
      },

      fallbackRules: {},
    },
  };
}

describe(
  "Advertising AI eligibility policy",
  () => {

    it(
      "accepts an eligible campaign without duplicating lifecycle logic",
      () => {
        const service =
          createAdvertisingAiEligibilityService();

        const result =
          service.evaluate(
            input()
          );

        expect(
          result
        ).toEqual({
          eligible:
            true,

          facts: {
            campaignDeliveryEligible:
              true,

            placementAllowed:
              true,

            frameApproved:
              true,

            safetyAllowed:
              true,

            regionAllowed:
              true,

            deviceAllowed:
              true,

            frequencyAllowed:
              true,

            budgetAvailable:
              true,

            notHiddenByUser:
              true,
          },

          reasonCodes:
            [],

          policySource:
            "authoritative_policy_v1",
        });
      }
    );

    it(
      "cannot override authoritative campaign or budget blocks",
      () => {
        const service =
          createAdvertisingAiEligibilityService();

        const base =
          input();

        const result =
          service.evaluate({
            ...base,

            campaign: {
              ...base.campaign,

              deliveryEligible:
                false,
            },

            decisions: {
              ...base.decisions,

              budgetAvailable:
                false,
            },
          });

        expect(
          result.eligible
        ).toBe(
          false
        );

        expect(
          result.reasonCodes
        ).toEqual([
          "campaign_not_delivery_eligible",
          "budget_unavailable",
        ]);
      }
    );

    it(
      "enforces campaign placement and existing user hide state",
      () => {
        const service =
          createAdvertisingAiEligibilityService();

        const base =
          input();

        const result =
          service.evaluate({
            ...base,

            campaign: {
              ...base.campaign,

              placements: [
                "search",
              ],
            },

            hiddenMonetizationItemIds: [
              "other-ad",
              "ad-1",
            ],
          });

        expect(
          result.eligible
        ).toBe(
          false
        );

        expect(
          result.facts
            .placementAllowed
        ).toBe(
          false
        );

        expect(
          result.facts
            .notHiddenByUser
        ).toBe(
          false
        );

        expect(
          result.reasonCodes
        ).toContain(
          "campaign_placement_not_allowed"
        );

        expect(
          result.reasonCodes
        ).toContain(
          "hidden_by_user"
        );
      }
    );

    it(
      "allows programmatic ranking only for enabled healthy providers and enabled valid Poster mappings",
      () => {
        const service =
          createAdvertisingAiEligibilityService();

        const result =
          service.evaluate({
            ...input(),

            candidateType:
              "programmatic",

            programmatic:
              enabledProgrammatic(),
          });

        expect(
          result.eligible
        ).toBe(
          true
        );

        expect(
          result.reasonCodes
        ).toEqual(
          []
        );
      }
    );

    it(
      "fails safe when a programmatic provider is disabled or unhealthy",
      () => {
        const service =
          createAdvertisingAiEligibilityService();

        const runtime =
          enabledProgrammatic();

        const result =
          service.evaluate({
            ...input(),

            candidateType:
              "programmatic",

            programmatic: {
              ...runtime,

              providerStatus:
                "disabled",

              providerHealthStatus:
                "unhealthy",
            },
          });

        expect(
          result.eligible
        ).toBe(
          false
        );

        expect(
          result.reasonCodes
        ).toContain(
          "programmatic_provider_not_enabled"
        );

        expect(
          result.reasonCodes
        ).toContain(
          "programmatic_provider_not_healthy"
        );
      }
    );

    it(
      "rejects paused or non-Poster programmatic placement mappings",
      () => {
        const service =
          createAdvertisingAiEligibilityService();

        const runtime =
          enabledProgrammatic();

        const result =
          service.evaluate({
            ...input(),

            candidateType:
              "programmatic",

            programmatic: {
              ...runtime,

              mapping: {
                ...runtime.mapping,

                status:
                  "paused",

                placement:
                  "floating-banner-slot",
              },
            },
          });

        expect(
          result.eligible
        ).toBe(
          false
        );

        expect(
          result.reasonCodes
        ).toContain(
          "programmatic_mapping_not_enabled"
        );

        expect(
          result.reasonCodes
        ).toContain(
          "programmatic_mapping_invalid"
        );
      }
    );

    it(
      "enforces screen and frame agreement with the requested sponsored surface",
      () => {
        const service =
          createAdvertisingAiEligibilityService();

        const runtime =
          enabledProgrammatic();

        const result =
          service.evaluate({
            ...input(),

            candidateType:
              "programmatic",

            programmatic: {
              ...runtime,

              mapping: {
                ...runtime.mapping,

                screen:
                  "search",

                frame:
                  "three_card_sponsored_frame",
              },
            },
          });

        expect(
          result.eligible
        ).toBe(
          false
        );

        expect(
          result.reasonCodes
        ).toContain(
          "programmatic_screen_mismatch"
        );

        expect(
          result.reasonCodes
        ).toContain(
          "programmatic_frame_mismatch"
        );
      }
    );

    it(
      "uses authoritative safety region device and frequency decisions without interpreting raw Admin JSON rules",
      () => {
        const service =
          createAdvertisingAiEligibilityService();

        const base =
          input();

        const result =
          service.evaluate({
            ...base,

            decisions: {
              ...base.decisions,

              safetyAllowed:
                false,

              regionAllowed:
                false,

              deviceAllowed:
                false,

              frequencyAllowed:
                false,
            },
          });

        expect(
          result.eligible
        ).toBe(
          false
        );

        expect(
          result.reasonCodes
        ).toEqual([
          "safety_blocked",
          "region_blocked",
          "device_blocked",
          "frequency_blocked",
        ]);
      }
    );
  }
);