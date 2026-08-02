import {
  describe,
  expect,
  it,
  vi,
} from "vitest";

import type {
  DatabaseQueryExecutor,
} from "../src/database/database.pool.js";

import {
  createAdminPosterPromotionService,
  type AdminPosterPromotionServiceDependencies,
} from "../src/application/monetization/admin-poster-promotion.service.js";

import {
  PosterPromotionError,
} from "../src/application/monetization/poster-promotion.errors.js";

import type {
  MonetizationCampaignRecord,
  PosterPromotionCreativeRecord,
} from "../src/domains/monetization/index.js";

const CAMPAIGN_ID =
  "00000000-0000-4000-8000-000000001401";

const ORGANIZATION_ID =
  "00000000-0000-4000-8000-000000001101";

const ADMIN_ID =
  "00000000-0000-4000-8000-000000000101";

const ASSET_ID =
  "00000000-0000-4000-8000-000000001501";

const NOW =
  new Date(
    "2026-08-02T06:45:00.000Z"
  );

const CAMPAIGN:
  MonetizationCampaignRecord = {
  id:
    CAMPAIGN_ID,

  campaignReference:
    "CMP-POSTER0001",

  sourceRequestId:
    null,

  organizationId:
    ORGANIZATION_ID,

  name:
    "Poster Career Discovery",

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
    "1",
};

const CREATIVE:
  PosterPromotionCreativeRecord = {
  campaignId:
    CAMPAIGN_ID,

  purpose:
    "Promote a Poster-owned career knowledge collection.",

  headline:
    "Discover career knowledge",

  body:
    "Explore an authoritative Poster collection for professional learning.",

  callToAction:
    "Explore",

  destinationUrl:
    "https://getpostar.com/collections/career-growth",

  disclosure:
    "Promoted by Poster",

  media: {
    assetId:
      ASSET_ID,

    type:
      "image",

    fileName:
      "career-growth.webp",

    mimeType:
      "image/webp",

    sizeBytes:
      2048,
  },

  createdAt:
    NOW,

  updatedAt:
    NOW,

  rowVersion:
    "1",
};

function createInput() {
  return {
    actorUserId:
      ADMIN_ID,

    organizationId:
      ORGANIZATION_ID,

    campaignReference:
      "CMP-POSTER0001",

    name:
      CAMPAIGN.name,

    placements: [
      "home",
    ] as const,

    scheduledStartDate:
      CAMPAIGN.scheduledStartDate,

    scheduledEndDate:
      CAMPAIGN.scheduledEndDate,

    mode:
      "schedule" as const,

    purpose:
      CREATIVE.purpose,

    headline:
      CREATIVE.headline,

    body:
      CREATIVE.body,

    callToAction:
      CREATIVE.callToAction,

    destinationUrl:
      CREATIVE.destinationUrl,

    media:
      CREATIVE.media,
  };
}

function createDependencies() {
  const executor =
    {} as
      DatabaseQueryExecutor;

  const runTransactionMock =
    vi.fn(
      async (
        operation:
          (
            executor:
              DatabaseQueryExecutor
          ) =>
            Promise<unknown>
      ): Promise<unknown> =>
        await operation(
          executor
        )
    );

  const runTransaction =
    runTransactionMock as unknown as
      AdminPosterPromotionServiceDependencies[
        "runTransaction"
      ];

  const findCampaign =
    vi.fn<
      AdminPosterPromotionServiceDependencies[
        "findCampaign"
      ]
    >()
      .mockResolvedValue(
        CAMPAIGN
      );

  const createCampaign =
    vi.fn<
      AdminPosterPromotionServiceDependencies[
        "createCampaign"
      ]
    >()
      .mockResolvedValue(
        CAMPAIGN
      );

  const updateCampaign =
    vi.fn<
      AdminPosterPromotionServiceDependencies[
        "updateCampaign"
      ]
    >()
      .mockResolvedValue({
        status:
          "updated",

        campaign: {
          ...CAMPAIGN,

          status:
            "scheduled",

          rowVersion:
            "2",
        },
      });

  const findCreativeByCampaignId =
    vi.fn()
      .mockResolvedValue(
        CREATIVE
      );

  const createCreative =
    vi.fn()
      .mockResolvedValue(
        CREATIVE
      );

  const updateCreative =
    vi.fn()
      .mockResolvedValue({
        status:
          "updated",

        creative: {
          ...CREATIVE,

          rowVersion:
            "2",
        },
      });

  const createAuditEntry =
    vi.fn<
      AdminPosterPromotionServiceDependencies[
        "createAuditEntry"
      ]
    >()
      .mockResolvedValue();

  const dependencies = {
    runTransaction,
    findCampaign,
    createCampaign,
    updateCampaign,

    promotionRepository: {
      findCreativeByCampaignId,
      createCreative,
      updateCreative,
    },

    createAuditEntry,

    now:
      () =>
        NOW,
  } satisfies
    AdminPosterPromotionServiceDependencies;

  return {
    dependencies,
    executor,
    runTransaction,
    runTransactionMock,
    findCampaign,
    createCampaign,
    updateCampaign,
    findCreativeByCampaignId,
    createCreative,
    updateCreative,
    createAuditEntry,
  };
}

describe(
  "Admin Poster Promotion application service",
  () => {
    it(
      "returns the authoritative campaign and creative",
      async () => {
        const mocks =
          createDependencies();

        const service =
          createAdminPosterPromotionService(
            mocks.dependencies
          );

        await expect(
          service.get(
            CAMPAIGN_ID
          )
        ).resolves.toEqual({
          campaign:
            CAMPAIGN,

          creative:
            CREATIVE,
        });

        expect(
          mocks.findCampaign
        ).toHaveBeenCalledWith(
          CAMPAIGN_ID
        );

        expect(
          mocks.findCreativeByCampaignId
        ).toHaveBeenCalledWith(
          CAMPAIGN_ID
        );
      }
    );

    it(
      "creates campaign, creative, and audit atomically",
      async () => {
        const mocks =
          createDependencies();

        const service =
          createAdminPosterPromotionService(
            mocks.dependencies
          );

        await expect(
          service.create(
            createInput()
          )
        ).resolves.toEqual({
          campaign:
            CAMPAIGN,

          creative:
            CREATIVE,
        });

        expect(
          mocks.runTransactionMock
        ).toHaveBeenCalledTimes(
          1
        );

        expect(
          mocks.createCampaign
        ).toHaveBeenCalledWith(
          expect.objectContaining({
            status:
              "scheduled",

            readinessStatus:
              "ready",

            commercialStatus:
              "approved",
          }),
          mocks.executor
        );

        expect(
          mocks.createCreative
        ).toHaveBeenCalledWith(
          expect.objectContaining({
            campaignId:
              CAMPAIGN_ID,
          }),
          mocks.executor
        );

        expect(
          mocks.createAuditEntry
        ).toHaveBeenCalledWith(
          expect.objectContaining({
            action:
              "poster_promotion.created_and_scheduled",

            entityId:
              CAMPAIGN_ID,
          }),
          mocks.executor
        );
      }
    );

    it(
      "updates campaign and creative in one transaction",
      async () => {
        const mocks =
          createDependencies();

        const service =
          createAdminPosterPromotionService(
            mocks.dependencies
          );

        await expect(
          service.update({
            ...createInput(),

            campaignId:
              CAMPAIGN_ID,

            expectedCampaignRowVersion:
              "1",

            expectedCreativeRowVersion:
              "1",
          })
        ).resolves.toEqual({
          campaign:
            expect.objectContaining({
              rowVersion:
                "2",
            }),

          creative:
            expect.objectContaining({
              rowVersion:
                "2",
            }),
        });

        expect(
          mocks.updateCampaign
        ).toHaveBeenCalledWith(
          expect.objectContaining({
            campaignId:
              CAMPAIGN_ID,

            expectedRowVersion:
              "1",
          }),
          mocks.executor
        );

        expect(
          mocks.updateCreative
        ).toHaveBeenCalledWith(
          expect.objectContaining({
            campaignId:
              CAMPAIGN_ID,

            expectedRowVersion:
              "1",
          }),
          mocks.executor
        );
      }
    );

    it(
      "rejects a stale campaign row version",
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
          createAdminPosterPromotionService(
            mocks.dependencies
          );

        await expect(
          service.update({
            ...createInput(),

            campaignId:
              CAMPAIGN_ID,

            expectedCampaignRowVersion:
              "1",

            expectedCreativeRowVersion:
              "1",
          })
        ).rejects.toMatchObject({
          code:
            "POSTER_PROMOTION_CAMPAIGN_CONFLICT",

          statusCode:
            409,
        });

        expect(
          mocks.updateCreative
        ).not.toHaveBeenCalled();
      }
    );

    it(
      "rejects a stale creative row version",
      async () => {
        const mocks =
          createDependencies();

        mocks.updateCreative
          .mockResolvedValue({
            status:
              "conflict",

            current: {
              ...CREATIVE,

              rowVersion:
                "5",
            },
          });

        const service =
          createAdminPosterPromotionService(
            mocks.dependencies
          );

        await expect(
          service.update({
            ...createInput(),

            campaignId:
              CAMPAIGN_ID,

            expectedCampaignRowVersion:
              "1",

            expectedCreativeRowVersion:
              "1",
          })
        ).rejects.toMatchObject({
          code:
            "POSTER_PROMOTION_CREATIVE_CONFLICT",

          statusCode:
            409,
        });
      }
    );

    it(
      "rejects edits to terminal campaigns",
      async () => {
        const mocks =
          createDependencies();

        mocks.findCampaign
          .mockResolvedValue({
            ...CAMPAIGN,

            status:
              "ended",
          });

        const service =
          createAdminPosterPromotionService(
            mocks.dependencies
          );

        await expect(
          service.update({
            ...createInput(),

            campaignId:
              CAMPAIGN_ID,

            expectedCampaignRowVersion:
              "1",

            expectedCreativeRowVersion:
              "1",
          })
        ).rejects.toBeInstanceOf(
          PosterPromotionError
        );

        expect(
          mocks.updateCampaign
        ).not.toHaveBeenCalled();
      }
    );

    it(
      "requires persisted media before scheduling",
      async () => {
        const mocks =
          createDependencies();

        const service =
          createAdminPosterPromotionService(
            mocks.dependencies
          );

        await expect(
          service.create({
            ...createInput(),

            media:
              null,
          })
        ).rejects.toMatchObject({
          code:
            "POSTER_PROMOTION_VALIDATION_FAILED",

          statusCode:
            400,
        });

        expect(
          mocks.runTransaction
        ).not.toHaveBeenCalled();
      }
    );
  }
);
