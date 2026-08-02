import {
  describe,
  expect,
  it,
} from "vitest";

import {
  validateProgrammaticProviderDraft,
  validateProgrammaticSlotMappingDraft,
} from "../src/domains/monetization/programmatic.validation.js";

const PROVIDER_ID =
  "00000000-0000-4000-8000-000000001701";

describe(
  "Programmatic validation",
  () => {
    it(
      "accepts a locked provider draft",
      () => {
        expect(
          validateProgrammaticProviderDraft({
            providerKey:
              "google_ad_manager",

            displayName:
              "Google Ad Manager",

            status:
              "disabled",

            healthStatus:
              "unknown",

            notes:
              null,
          })
        ).toEqual(
          []
        );
      }
    );

    it(
      "rejects invalid provider keys and statuses",
      () => {
        const issues =
          validateProgrammaticProviderDraft({
            providerKey:
              "Google Ads!",

            displayName:
              "A",

            status:
              "running" as never,

            healthStatus:
              "fine" as never,

            notes:
              null,
          });

        expect(
          issues.map(
            issue =>
              issue.field
          )
        ).toEqual(
          expect.arrayContaining([
            "providerKey",
            "displayName",
            "status",
            "healthStatus",
          ])
        );
      }
    );

    it(
      "accepts only approved Poster frame mappings",
      () => {
        expect(
          validateProgrammaticSlotMappingDraft({
            providerId:
              PROVIDER_ID,

            screen:
              "home",

            placement:
              "home_sponsored_card",

            frame:
              "full_width_sponsored_card",

            status:
              "disabled",

            safetyRules:
              {},

            regionRules:
              {},

            deviceRules:
              {},

            frequencyRules:
              {},

            fallbackRules:
              {},
          })
        ).toEqual(
          []
        );
      }
    );

    it(
      "rejects provider-created or blocked ad formats",
      () => {
        const issues =
          validateProgrammaticSlotMappingDraft({
            providerId:
              PROVIDER_ID,

            screen:
              "home",

            placement:
              "floating_banner_overlay",

            frame:
              "banner" as never,

            status:
              "enabled",

            safetyRules:
              {},

            regionRules:
              {},

            deviceRules:
              {},

            frequencyRules:
              {},

            fallbackRules:
              {},
          });

        expect(
          issues.map(
            issue =>
              issue.field
          )
        ).toEqual(
          expect.arrayContaining([
            "frame",
          ])
        );
      }
    );

    it(
      "rejects unapproved screens",
      () => {
        const issues =
          validateProgrammaticSlotMappingDraft({
            providerId:
              PROVIDER_ID,

            screen:
              "article" as never,

            placement:
              "article_sponsored_card",

            frame:
              "full_width_sponsored_card",

            status:
              "enabled",

            safetyRules:
              {},

            regionRules:
              {},

            deviceRules:
              {},

            frequencyRules:
              {},

            fallbackRules:
              {},
          });

        expect(
          issues.map(
            issue =>
              issue.field
          )
        ).toContain(
          "screen"
        );
      }
    );
  }
);