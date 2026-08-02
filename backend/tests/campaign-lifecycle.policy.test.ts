import {
  describe,
  expect,
  it,
} from "vitest";

import {
  canEditCampaignOperations,
  canTransitionCampaign,
  findCampaignLifecycleTransition,
  isCampaignTerminalStatus,
  resolveCampaignTargetStatus,
} from "../src/domains/monetization/campaign-lifecycle.policy.js";

describe(
  "campaign lifecycle policy",
  () => {
    it(
      "supports the normal scheduled, active, paused and ended lifecycle",
      () => {
        expect(
          resolveCampaignTargetStatus(
            "draft",
            "schedule"
          )
        ).toBe(
          "scheduled"
        );

        expect(
          resolveCampaignTargetStatus(
            "scheduled",
            "activate"
          )
        ).toBe(
          "active"
        );

        expect(
          resolveCampaignTargetStatus(
            "active",
            "pause"
          )
        ).toBe(
          "paused"
        );

        expect(
          resolveCampaignTargetStatus(
            "paused",
            "resume"
          )
        ).toBe(
          "active"
        );

        expect(
          resolveCampaignTargetStatus(
            "active",
            "end"
          )
        ).toBe(
          "ended"
        );
      }
    );

    it(
      "treats ended and disabled campaigns as terminal",
      () => {
        expect(
          isCampaignTerminalStatus(
            "ended"
          )
        ).toBe(
          true
        );

        expect(
          isCampaignTerminalStatus(
            "disabled"
          )
        ).toBe(
          true
        );

        expect(
          canEditCampaignOperations(
            "ended"
          )
        ).toBe(
          false
        );

        expect(
          canEditCampaignOperations(
            "disabled"
          )
        ).toBe(
          false
        );
      }
    );

    it(
      "rejects unsupported lifecycle transitions",
      () => {
        expect(
          canTransitionCampaign(
            "ended",
            "resume"
          )
        ).toBe(
          false
        );

        expect(
          canTransitionCampaign(
            "disabled",
            "activate"
          )
        ).toBe(
          false
        );

        expect(
          findCampaignLifecycleTransition(
            "draft",
            "pause"
          )
        ).toBeNull();
      }
    );

    it(
      "allows an administrative disable from every non-terminal lifecycle state",
      () => {
        for (
          const status of [
            "draft",
            "scheduled",
            "active",
            "paused",
          ] as const
        ) {
          expect(
            resolveCampaignTargetStatus(
              status,
              "disable"
            )
          ).toBe(
            "disabled"
          );
        }
      }
    );
  }
);