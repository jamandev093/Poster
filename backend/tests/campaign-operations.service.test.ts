import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

import {
  CampaignOperationsError,
  createAdminCampaignService,
  type AdminCampaignServiceDependencies,
} from "../src/application/monetization/index.js";

import type {
  MonetizationCampaignRecord,
} from "../src/domains/monetization/index.js";

const CAMPAIGN_ID =
  "00000000-0000-4000-8000-000000001201";

const ADMIN_ID =
  "00000000-0000-4000-8000-000000000101";

const NOW =
  new Date(
    "2026-08-02T04:30:00.000Z"
  );

const CAMPAIGN:
  MonetizationCampaignRecord = {
  id:
    CAMPAIGN_ID,

  campaignReference:
    "CMP-5001",

  sourceRequestId:
    null,

  organizationId:
    "00000000-0000-4000-8000-000000001101",

  name:
    "Poster campaign",

  campaignType:
    "poster_promotion",

  origin:
    "admin_internal",

  status:
    "draft",

  placements: [
    "home",
  ],

  scheduledStartDate:
    "2026-08-10",

  scheduledEndDate:
    "2026-08-31",

  readinessStatus:
    "pending_setup",

  commercialStatus:
    "approved",

  deliveryEligible:
    false,

  createdByUserId:
    ADMIN_ID,

  createdAt:
    NOW,

  updatedAt:
    NOW,

  rowVersion:
    "2",
};

function createDependencies() {
  const executor =
    {} as never;

  const listCampaigns =
    vi.fn();

  const findCampaign =
    vi.fn()
      .mockResolvedValue(
        CAMPAIGN
      );

  const updateCampaign =
    vi.fn();

  const transitionCampaign =
    vi.fn();

  const createAuditEntry =
    vi.fn()
      .mockResolvedValue(
        undefined
      );

  const runTransaction =
    vi.fn(
      async operation =>
        await operation(
          executor
        )
    );

  const dependencies = {
    listCampaigns,
    findCampaign,
    updateCampaign,
    transitionCampaign,
    createAuditEntry,
    runTransaction,
    now:
      () => NOW,
  } satisfies
    AdminCampaignServiceDependencies;

  return {
    dependencies,
    executor,
    findCampaign,
    updateCampaign,
    transitionCampaign,
    createAuditEntry,
    runTransaction,
  };
}

describe(
  "Admin campaign operations service",
  () => {
    beforeEach(
      () => {
        vi.clearAllMocks();
      }
    );

    it(
      "updates campaign operations and records audit atomically",
      async () => {
        const mocks =
          createDependencies();

        const updated = {
          ...CAMPAIGN,

          name:
            "Updated Poster campaign",

          placements: [
            "home",
            "search",
          ] as const,

          readinessStatus:
            "ready" as const,

          rowVersion:
            "3",
        };

        mocks.updateCampaign
          .mockResolvedValue({
            status:
              "updated",

            campaign:
              updated,
          });

        const service =
          createAdminCampaignService({
            dependencies:
              mocks.dependencies,
          });

        const result =
          await service
            .updateOperations({
              campaignId:
                CAMPAIGN_ID,

              actorUserId:
                ADMIN_ID,

              expectedRowVersion:
                "2",

              name:
                " Updated Poster campaign ",

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
                " Creative approved. ",
            });

        expect(
          result
        ).toEqual(
          updated
        );

        expect(
          mocks.runTransaction
        ).toHaveBeenCalledTimes(
          1
        );

        expect(
          mocks.updateCampaign
        ).toHaveBeenCalledWith(
          expect.objectContaining({
            campaignId:
              CAMPAIGN_ID,

            expectedRowVersion:
              "2",

            name:
              "Updated Poster campaign",
          }),
          mocks.executor
        );

        expect(
          mocks.createAuditEntry
        ).toHaveBeenCalledWith(
          expect.objectContaining({
            action:
              "monetization.campaign.operations_updated",

            entityId:
              CAMPAIGN_ID,

            metadata:
              expect.objectContaining({
                reason:
                  "Creative approved.",

                previousRowVersion:
                  "2",

                nextRowVersion:
                  "3",
              }),
          }),
          mocks.executor
        );
      }
    );

    it(
      "rejects invalid operational input before opening a transaction",
      async () => {
        const mocks =
          createDependencies();

        const service =
          createAdminCampaignService({
            dependencies:
              mocks.dependencies,
          });

        await expect(
          service.updateOperations({
            campaignId:
              CAMPAIGN_ID,

            actorUserId:
              ADMIN_ID,

            expectedRowVersion:
              "2",

            name:
              "x",

            placements:
              [],

            scheduledStartDate:
              "2026-08-20",

            scheduledEndDate:
              "2026-08-10",

            readinessStatus:
              "ready",

            reason:
              null,
          })
        ).rejects.toMatchObject({
          code:
            "CAMPAIGN_OPERATION_INVALID",
        });

        expect(
          mocks.runTransaction
        ).not.toHaveBeenCalled();
      }
    );

    it(
      "transitions a ready campaign and records lifecycle audit",
      async () => {
        const mocks =
          createDependencies();

        const readyCampaign = {
          ...CAMPAIGN,

          status:
            "scheduled" as const,

          readinessStatus:
            "ready" as const,
        };

        const activeCampaign = {
          ...readyCampaign,

          status:
            "active" as const,

          deliveryEligible:
            true,

          rowVersion:
            "3",
        };

        mocks.findCampaign
          .mockResolvedValue(
            readyCampaign
          );

        mocks.transitionCampaign
          .mockResolvedValue({
            status:
              "updated",

            campaign:
              activeCampaign,
          });

        const service =
          createAdminCampaignService({
            dependencies:
              mocks.dependencies,
          });

        const result =
          await service.transition({
            campaignId:
              CAMPAIGN_ID,

            actorUserId:
              ADMIN_ID,

            expectedRowVersion:
              "2",

            action:
              "activate",

            reason:
              "Ready for delivery.",
          });

        expect(
          result.status
        ).toBe(
          "active"
        );

        expect(
          mocks.transitionCampaign
        ).toHaveBeenCalledWith(
          {
            campaignId:
              CAMPAIGN_ID,

            expectedRowVersion:
              "2",

            targetStatus:
              "active",
          },
          mocks.executor
        );

        expect(
          mocks.createAuditEntry
        ).toHaveBeenCalledWith(
          expect.objectContaining({
            action:
              "monetization.campaign.activate",

            metadata:
              expect.objectContaining({
                previousStatus:
                  "scheduled",

                nextStatus:
                  "active",
              }),
          }),
          mocks.executor
        );
      }
    );

    it(
      "rejects an unsupported lifecycle transition",
      async () => {
        const mocks =
          createDependencies();

        const service =
          createAdminCampaignService({
            dependencies:
              mocks.dependencies,
          });

        await expect(
          service.transition({
            campaignId:
              CAMPAIGN_ID,

            actorUserId:
              ADMIN_ID,

            expectedRowVersion:
              "2",

            action:
              "pause",

            reason:
              "Pause requested.",
          })
        ).rejects.toMatchObject({
          code:
            "CAMPAIGN_TRANSITION_NOT_ALLOWED",
        });

        expect(
          mocks.transitionCampaign
        ).not.toHaveBeenCalled();

        expect(
          mocks.createAuditEntry
        ).not.toHaveBeenCalled();
      }
    );

    it(
      "rejects activation when campaign setup is not ready",
      async () => {
        const mocks =
          createDependencies();

        mocks.findCampaign
          .mockResolvedValue({
            ...CAMPAIGN,

            status:
              "scheduled",
          });

        const service =
          createAdminCampaignService({
            dependencies:
              mocks.dependencies,
          });

        await expect(
          service.transition({
            campaignId:
              CAMPAIGN_ID,

            actorUserId:
              ADMIN_ID,

            expectedRowVersion:
              "2",

            action:
              "activate",

            reason:
              null,
          })
        ).rejects.toMatchObject({
          code:
            "CAMPAIGN_NOT_READY",
        });

        expect(
          mocks.transitionCampaign
        ).not.toHaveBeenCalled();
      }
    );

    it(
      "maps repository conflicts to a typed version conflict",
      async () => {
        const mocks =
          createDependencies();

        mocks.updateCampaign
          .mockResolvedValue({
            status:
              "conflict",

            campaign: {
              ...CAMPAIGN,

              rowVersion:
                "4",
            },
          });

        const service =
          createAdminCampaignService({
            dependencies:
              mocks.dependencies,
          });

        await expect(
          service.updateOperations({
            campaignId:
              CAMPAIGN_ID,

            actorUserId:
              ADMIN_ID,

            expectedRowVersion:
              "2",

            name:
              "Poster campaign",

            placements: [
              "home",
            ],

            scheduledStartDate:
              "2026-08-10",

            scheduledEndDate:
              "2026-08-31",

            readinessStatus:
              "pending_setup",

            reason:
              null,
          })
        ).rejects.toBeInstanceOf(
          CampaignOperationsError
        );

        await expect(
          service.updateOperations({
            campaignId:
              CAMPAIGN_ID,

            actorUserId:
              ADMIN_ID,

            expectedRowVersion:
              "2",

            name:
              "Poster campaign",

            placements: [
              "home",
            ],

            scheduledStartDate:
              "2026-08-10",

            scheduledEndDate:
              "2026-08-31",

            readinessStatus:
              "pending_setup",

            reason:
              null,
          })
        ).rejects.toMatchObject({
          code:
            "CAMPAIGN_VERSION_CONFLICT",
        });
      }
    );
  }
);