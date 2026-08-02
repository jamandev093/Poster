import {
  describe,
  expect,
  it,
  vi,
} from "vitest";

import {
  AffiliateError,
  createAdminAffiliateService,
  type AdminAffiliateServiceDependencies,
} from "../src/application/monetization/index.js";

import {
  AFFILIATE_DISCLOSURE,
  type AffiliateMetadataDraftInput,
  type AffiliateMetadataRecord,
  type MonetizationCampaignRecord,
} from "../src/domains/monetization/index.js";

const CAMPAIGN_ID =
  "00000000-0000-4000-8000-000000001601";

const ADMIN_ID =
  "00000000-0000-4000-8000-000000000101";

const NOW =
  new Date(
    "2026-08-02T13:00:00.000Z"
  );

const CAMPAIGN:
  MonetizationCampaignRecord = {
  id:
    CAMPAIGN_ID,

  campaignReference:
    "CMP-AFF-0001",

  sourceRequestId:
    "00000000-0000-4000-8000-000000001001",

  organizationId:
    "00000000-0000-4000-8000-000000001101",

  name:
    "Learning Partner Offer",

  campaignType:
    "affiliate",

  origin:
    "client_request",

  status:
    "draft",

  placements: [
    "search",
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

const METADATA:
  AffiliateMetadataRecord = {
  campaignId:
    CAMPAIGN_ID,

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

  createdAt:
    NOW,

  updatedAt:
    NOW,

  rowVersion:
    "1",
};

function createDraft():
  AffiliateMetadataDraftInput {
  return {
    partnerName:
      METADATA.partnerName,

    offerName:
      METADATA.offerName,

    destinationUrl:
      METADATA.destinationUrl,

    disclosure:
      AFFILIATE_DISCLOSURE,

    commissionModel:
      METADATA.commissionModel,

    commissionTerms:
      METADATA.commissionTerms,

    trackingStatus:
      METADATA.trackingStatus,

    trackingUrl:
      METADATA.trackingUrl,

    payoutReadinessStatus:
      METADATA.payoutReadinessStatus,
  };
}

function createDependencies() {
  const executor =
    {} as never;

  const findCampaign =
    vi.fn<
      AdminAffiliateServiceDependencies[
        "findCampaign"
      ]
    >()
      .mockResolvedValue(
        CAMPAIGN
      );

  const findMetadata =
    vi.fn<
      AdminAffiliateServiceDependencies[
        "findMetadata"
      ]
    >()
      .mockResolvedValue(
        METADATA
      );

  const createMetadata =
    vi.fn<
      AdminAffiliateServiceDependencies[
        "createMetadata"
      ]
    >()
      .mockResolvedValue(
        METADATA
      );

  const updateMetadata =
    vi.fn<
      AdminAffiliateServiceDependencies[
        "updateMetadata"
      ]
    >()
      .mockResolvedValue({
        status:
          "updated",

        metadata: {
          ...METADATA,

          rowVersion:
            "2",
        },
      });

  const createAuditEntry =
    vi.fn<
      AdminAffiliateServiceDependencies[
        "createAuditEntry"
      ]
    >()
      .mockResolvedValue();

  const runTransaction:
    AdminAffiliateServiceDependencies[
      "runTransaction"
    ] =
    async operation =>
      await operation(
        executor
      );

  const dependencies = {
    findCampaign,
    findMetadata,
    createMetadata,
    updateMetadata,
    createAuditEntry,
    runTransaction,
    now:
      () =>
        NOW,
  } satisfies
    AdminAffiliateServiceDependencies;

  return {
    dependencies,
    findCampaign,
    findMetadata,
    createMetadata,
    updateMetadata,
    createAuditEntry,
  };
}

describe(
  "Admin Affiliate application service",
  () => {
    it(
      "returns an authoritative affiliate detail",
      async () => {
        const mocks =
          createDependencies();

        const service =
          createAdminAffiliateService({
            dependencies:
              mocks.dependencies,
          });

        const result =
          await service.get(
            CAMPAIGN_ID
          );

        expect(
          result
        ).toEqual({
          campaign:
            CAMPAIGN,

          metadata:
            METADATA,
        });
      }
    );

    it(
      "returns null for a non-affiliate campaign",
      async () => {
        const mocks =
          createDependencies();

        mocks.findCampaign.mockResolvedValue({
          ...CAMPAIGN,

          campaignType:
            "direct_sponsorship",
        });

        const service =
          createAdminAffiliateService({
            dependencies:
              mocks.dependencies,
          });

        await expect(
          service.get(
            CAMPAIGN_ID
          )
        ).resolves.toBeNull();

        expect(
          mocks.findMetadata
        ).not.toHaveBeenCalled();
      }
    );

    it(
      "creates affiliate metadata and audit entry transactionally",
      async () => {
        const mocks =
          createDependencies();

        mocks.findMetadata
          .mockResolvedValueOnce(
            null
          );

        const service =
          createAdminAffiliateService({
            dependencies:
              mocks.dependencies,
          });

        const result =
          await service.createMetadata({
            campaignId:
              CAMPAIGN_ID,

            actorUserId:
              ADMIN_ID,

            ...createDraft(),
          });

        expect(
          result.metadata
        ).toEqual(
          METADATA
        );

        expect(
          mocks.createMetadata
        ).toHaveBeenCalledWith(
          expect.objectContaining({
            campaignId:
              CAMPAIGN_ID,

            partnerName:
              METADATA.partnerName,

            disclosure:
              AFFILIATE_DISCLOSURE,

            createdAt:
              NOW,
          }),
          expect.anything()
        );

        expect(
          mocks.createAuditEntry
        ).toHaveBeenCalledWith(
          expect.objectContaining({
            actorUserId:
              ADMIN_ID,

            action:
              "monetization.affiliate.metadata_created",

            entityId:
              CAMPAIGN_ID,
          }),
          expect.anything()
        );
      }
    );

    it(
      "rejects invalid affiliate metadata before repository writes",
      async () => {
        const mocks =
          createDependencies();

        const service =
          createAdminAffiliateService({
            dependencies:
              mocks.dependencies,
          });

        await expect(
          service.createMetadata({
            campaignId:
              CAMPAIGN_ID,

            actorUserId:
              ADMIN_ID,

            ...createDraft(),

            partnerName:
              "",

            destinationUrl:
              "ftp://example.com",
          })
        ).rejects.toMatchObject({
          code:
            "AFFILIATE_METADATA_INVALID",

          statusCode:
            400,
        });

        expect(
          mocks.createMetadata
        ).not.toHaveBeenCalled();
      }
    );

    it(
      "rejects metadata creation for a non-affiliate campaign",
      async () => {
        const mocks =
          createDependencies();

        mocks.findCampaign.mockResolvedValue({
          ...CAMPAIGN,

          campaignType:
            "poster_promotion",
        });

        const service =
          createAdminAffiliateService({
            dependencies:
              mocks.dependencies,
          });

        await expect(
          service.createMetadata({
            campaignId:
              CAMPAIGN_ID,

            actorUserId:
              ADMIN_ID,

            ...createDraft(),
          })
        ).rejects.toBeInstanceOf(
          AffiliateError
        );

        expect(
          mocks.createMetadata
        ).not.toHaveBeenCalled();
      }
    );

    it(
      "updates affiliate metadata and audit entry transactionally",
      async () => {
        const mocks =
          createDependencies();

        const service =
          createAdminAffiliateService({
            dependencies:
              mocks.dependencies,
          });

        const result =
          await service.updateMetadata({
            campaignId:
              CAMPAIGN_ID,

            actorUserId:
              ADMIN_ID,

            expectedRowVersion:
              "1",

            ...createDraft(),

            trackingStatus:
              "active",

            payoutReadinessStatus:
              "ready",
          });

        expect(
          result.metadata?.rowVersion
        ).toBe(
          "2"
        );

        expect(
          mocks.updateMetadata
        ).toHaveBeenCalledWith(
          expect.objectContaining({
            campaignId:
              CAMPAIGN_ID,

            expectedRowVersion:
              "1",

            trackingStatus:
              "active",

            payoutReadinessStatus:
              "ready",

            updatedAt:
              NOW,
          }),
          expect.anything()
        );

        expect(
          mocks.createAuditEntry
        ).toHaveBeenCalledWith(
          expect.objectContaining({
            action:
              "monetization.affiliate.metadata_updated",
          }),
          expect.anything()
        );
      }
    );

    it(
      "maps stale metadata row versions to a conflict",
      async () => {
        const mocks =
          createDependencies();

        mocks.updateMetadata.mockResolvedValue({
          status:
            "conflict",

          metadata: {
            ...METADATA,

            rowVersion:
              "4",
          },
        });

        const service =
          createAdminAffiliateService({
            dependencies:
              mocks.dependencies,
          });

        await expect(
          service.updateMetadata({
            campaignId:
              CAMPAIGN_ID,

            actorUserId:
              ADMIN_ID,

            expectedRowVersion:
              "1",

            ...createDraft(),
          })
        ).rejects.toMatchObject({
          code:
            "AFFILIATE_METADATA_VERSION_CONFLICT",

          statusCode:
            409,
        });
      }
    );
  }
);