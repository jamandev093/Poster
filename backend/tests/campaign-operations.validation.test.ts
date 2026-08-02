import {
  describe,
  expect,
  it,
} from "vitest";

import {
  validateCampaignOperationsUpdate,
  validateCampaignPlacements,
  validateCampaignSchedule,
  validateExpectedRowVersion,
} from "../src/domains/monetization/campaign-operations.validation.js";

describe(
  "campaign operations validation",
  () => {
    it(
      "accepts a valid shared campaign operations update",
      () => {
        expect(
          validateCampaignOperationsUpdate({
            campaignId:
              "00000000-0000-4000-8000-000000000001",
            actorUserId:
              "00000000-0000-4000-8000-000000000002",
            expectedRowVersion:
              "3",
            name:
              "Poster learning campaign",
            placements: [
              "home",
              "search",
            ],
            scheduledStartDate:
              "2026-08-10",
            scheduledEndDate:
              "2026-08-31",
            readinessStatus:
              "ready",
            reason:
              "Approved operational update.",
          })
        ).toEqual(
          []
        );
      }
    );

    it(
      "rejects invalid and reversed campaign dates",
      () => {
        expect(
          validateCampaignSchedule({
            scheduledStartDate:
              "2026-02-30",
            scheduledEndDate:
              "2026-02-20",
          })
        ).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              field:
                "scheduledStartDate",
              code:
                "invalid",
            }),
          ])
        );

        expect(
          validateCampaignSchedule({
            scheduledStartDate:
              "2026-08-20",
            scheduledEndDate:
              "2026-08-10",
          })
        ).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              field:
                "scheduledEndDate",
              code:
                "date_order",
            }),
          ])
        );
      }
    );

    it(
      "requires unique Poster-controlled placements",
      () => {
        expect(
          validateCampaignPlacements(
            []
          )
        ).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              field:
                "placements",
              code:
                "required",
            }),
          ])
        );

        expect(
          validateCampaignPlacements([
            "home",
            "home",
          ])
        ).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              field:
                "placements",
              code:
                "duplicate",
            }),
          ])
        );
      }
    );

    it(
      "requires a numeric optimistic-concurrency row version",
      () => {
        expect(
          validateExpectedRowVersion(
            "12"
          )
        ).toEqual(
          []
        );

        expect(
          validateExpectedRowVersion(
            "version-one"
          )
        ).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              field:
                "expectedRowVersion",
              code:
                "invalid",
            }),
          ])
        );
      }
    );
  }
);