import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

import {
  createAdminCampaignService,
  type AdminCampaignServiceDependencies,
} from "../src/application/monetization/admin-campaign.service.js";

import type {
  MonetizationCampaignRecord,
} from "../src/domains/monetization/index.js";

const CAMPAIGN_ID =
  "00000000-0000-4000-8000-000000001201";

const ORGANIZATION_ID =
  "00000000-0000-4000-8000-000000001101";

const REQUEST_ID =
  "00000000-0000-4000-8000-000000001001";

const ADMIN_ID =
  "00000000-0000-4000-8000-000000000101";

const CAMPAIGN:
  MonetizationCampaignRecord = {
  id:
    CAMPAIGN_ID,

  campaignReference:
    "CMP-5001",

  sourceRequestId:
    REQUEST_ID,

  organizationId:
    ORGANIZATION_ID,

  name:
    "Publisher launch sponsorship",

  campaignType:
    "direct_sponsorship",

  origin:
    "client_request",

  status:
    "draft",

  placements: [
    "home",
    "search",
  ],

  scheduledStartDate:
    "2026-08-10",

  scheduledEndDate:
    "2026-08-31",

  readinessStatus:
    "pending_setup",

  commercialStatus:
    "pending_funding",

  deliveryEligible:
    false,

  createdByUserId:
    ADMIN_ID,

  createdAt:
    new Date(
      "2026-08-01T15:00:00.000Z"
    ),

  updatedAt:
    new Date(
      "2026-08-01T15:00:00.000Z"
    ),

  rowVersion:
    "1",
};

function createDependencies() {
  const listCampaigns =
    vi.fn<
      AdminCampaignServiceDependencies[
        "listCampaigns"
      ]
    >()
      .mockResolvedValue({
        items: [
          CAMPAIGN,
        ],

        total:
          1,

        limit:
          50,

        offset:
          0,
      });

  const findCampaign =
    vi.fn<
      AdminCampaignServiceDependencies[
        "findCampaign"
      ]
    >()
      .mockResolvedValue(
        CAMPAIGN
      );

  const updateCampaign =
    vi.fn<
      AdminCampaignServiceDependencies[
        "updateCampaign"
      ]
    >();

  const transitionCampaign =
    vi.fn<
      AdminCampaignServiceDependencies[
        "transitionCampaign"
      ]
    >();

  const createAuditEntry =
    vi.fn<
      AdminCampaignServiceDependencies[
        "createAuditEntry"
      ]
    >()
      .mockResolvedValue(
        undefined
      );

  const executor =
    {} as never;

  const runTransaction:
    AdminCampaignServiceDependencies[
      "runTransaction"
    ] =
      async operation =>
        await operation(
          executor
        );

  const now =
    () =>
      new Date(
        "2026-08-02T04:30:00.000Z"
      );

  const dependencies = {
    listCampaigns,
    findCampaign,
    updateCampaign,
    transitionCampaign,
    createAuditEntry,
    runTransaction,
    now,
  } satisfies
    AdminCampaignServiceDependencies;

  return {
    dependencies,
    listCampaigns,
    findCampaign,
    updateCampaign,
    transitionCampaign,
    createAuditEntry,
  };
}

describe(
  "Admin Campaign application service",
  () => {
    beforeEach(
      () => {
        vi.clearAllMocks();
      }
    );

    it(
      "lists authoritative campaigns using the requested filters",
      async () => {
        const mocks =
          createDependencies();

        const service =
          createAdminCampaignService({
            dependencies:
              mocks.dependencies,
          });

        const result =
          await service.list({
            organizationId:
              ORGANIZATION_ID,

            status:
              "draft",

            campaignType:
              "direct_sponsorship",

            limit:
              50,

            offset:
              0,
          });

        expect(
          mocks.listCampaigns
        ).toHaveBeenCalledWith({
          organizationId:
            ORGANIZATION_ID,

          status:
            "draft",

          campaignType:
            "direct_sponsorship",

          limit:
            50,

          offset:
            0,
        });

        expect(
          result.items
        ).toEqual([
          CAMPAIGN,
        ]);

        expect(
          result.total
        ).toBe(
          1
        );
      }
    );

    it(
      "returns an authoritative campaign by internal UUID",
      async () => {
        const mocks =
          createDependencies();

        const service =
          createAdminCampaignService({
            dependencies:
              mocks.dependencies,
          });

        const result =
          await service.get(
            CAMPAIGN_ID
          );

        expect(
          mocks.findCampaign
        ).toHaveBeenCalledWith(
          CAMPAIGN_ID
        );

        expect(
          result
        ).toEqual(
          CAMPAIGN
        );
      }
    );

    it(
      "returns null when a campaign does not exist",
      async () => {
        const mocks =
          createDependencies();

        mocks.findCampaign
          .mockResolvedValue(
            null
          );

        const service =
          createAdminCampaignService({
            dependencies:
              mocks.dependencies,
          });

        await expect(
          service.get(
            CAMPAIGN_ID
          )
        ).resolves.toBeNull();
      }
    );
  }
);