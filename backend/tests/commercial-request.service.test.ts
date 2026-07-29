import {
  describe,
  expect,
  it,
  vi,
} from "vitest";

import {
  createAdminCommercialRequestService,
  type AdminCommercialRequestServiceDependencies,
} from "../src/application/monetization/admin-commercial-request.service.js";

import {
  createClientCommercialRequestService,
  type ClientCommercialRequestServiceDependencies,
} from "../src/application/monetization/client-commercial-request.service.js";

import type {
  CommercialRequestRecord,
  MonetizationCampaignRecord,
} from "../src/domains/monetization/commercial.types.js";

const NOW =
  new Date(
    "2026-07-29T14:00:00.000Z"
  );

const REQUEST:
  CommercialRequestRecord = {
  id:
    "00000000-0000-4000-8000-000000001001",

  requestReference:
    "ADV-REQUEST0001",

  organizationId:
    "00000000-0000-4000-8000-000000001002",

  submittedByUserId:
    "00000000-0000-4000-8000-000000001003",

  requestType:
    "direct_sponsorship",

  status:
    "pending_review",

  title:
    "Launch sponsorship",

  objective:
    "Reach technology readers.",

  destinationUrl:
    "https://example.com",

  requestedPlacements: [
    "home",
  ],

  requestedStartDate:
    "2026-08-10",

  requestedEndDate:
    "2026-08-31",

  budgetMinorUnits:
    "2500000",

  currencyCode:
    "INR",

  creativeSpec: {},
  commercialTerms: {},

  submittedAt:
    NOW,

  decidedAt:
    null,

  decidedByUserId:
    null,

  decisionNote:
    null,

  createdAt:
    NOW,

  updatedAt:
    NOW,

  rowVersion:
    "1",
};

const CAMPAIGN:
  MonetizationCampaignRecord = {
  id:
    "00000000-0000-4000-8000-000000001101",

  campaignReference:
    "CMP-CAMPAIGN001",

  sourceRequestId:
    REQUEST.id,

  organizationId:
    REQUEST.organizationId,

  name:
    REQUEST.title,

  campaignType:
    "direct_sponsorship",

  origin:
    "client_request",

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
    "pending_funding",

  deliveryEligible:
    false,

  createdByUserId:
    "00000000-0000-4000-8000-000000001201",

  createdAt:
    NOW,

  updatedAt:
    NOW,

  rowVersion:
    "1",
};

describe(
  "Poster commercial-request application services",
  () => {
    it(
      "creates the request and immutable first revision in one transaction",
      async () => {
        const createRequest =
          vi.fn<
            ClientCommercialRequestServiceDependencies[
              "createCommercialRequest"
            ]
          >();

        createRequest.mockResolvedValue(
          REQUEST
        );

        const createRevision =
          vi.fn<
            ClientCommercialRequestServiceDependencies[
              "createCommercialRequestRevision"
            ]
          >();

        createRevision.mockResolvedValue({
          id:
            "00000000-0000-4000-8000-000000001301",

          requestId:
            REQUEST.id,

          revisionNumber:
            1,

          submittedByUserId:
            REQUEST.submittedByUserId,

          payload: {},

          createdAt:
            NOW,
        });

        const executor =
          {} as never;

        const service =
          createClientCommercialRequestService({
            runDatabaseTransaction:
              async (
                operation
              ) =>
                await operation(
                  executor
                ),

            createCommercialRequest:
              createRequest,

            createCommercialRequestRevision:
              createRevision,

            now:
              () => NOW,

            createReference:
              () =>
                REQUEST.requestReference,
          });

        await expect(
          service.submit({
            organizationId:
              REQUEST.organizationId,

            actorUserId:
              REQUEST.submittedByUserId,

            requestType:
              REQUEST.requestType,

            title:
              REQUEST.title,

            objective:
              REQUEST.objective,

            destinationUrl:
              REQUEST.destinationUrl,

            requestedPlacements:
              REQUEST.requestedPlacements,

            requestedStartDate:
              REQUEST.requestedStartDate,

            requestedEndDate:
              REQUEST.requestedEndDate,

            budgetMinorUnits:
              2500000,

            currencyCode:
              "INR",

            creativeSpec: {},
            commercialTerms: {},
          })
        ).resolves.toEqual(
          REQUEST
        );

        expect(
          createRequest
        ).toHaveBeenCalledTimes(
          1
        );

        expect(
          createRevision
        ).toHaveBeenCalledTimes(
          1
        );
      }
    );

    it(
      "returns a non-deliverable draft campaign after atomic approval",
      async () => {
        const approve =
          vi.fn<
            AdminCommercialRequestServiceDependencies[
              "approveCommercialRequestAndCreateDraftCampaign"
            ]
          >();

        approve.mockResolvedValue({
          status:
            "approved",

          request: {
            ...REQUEST,

            status:
              "approved",
          },

          campaign:
            CAMPAIGN,

          idempotent:
            false,
        });

        const service =
          createAdminCommercialRequestService({
            approveCommercialRequestAndCreateDraftCampaign:
              approve,

            now:
              () => NOW,

            createCampaignReference:
              () =>
                CAMPAIGN.campaignReference,
          });

        const result =
          await service.approve({
            requestId:
              REQUEST.id,

            actorUserId:
              CAMPAIGN.createdByUserId,

            expectedRowVersion:
              REQUEST.rowVersion,

            decisionNote:
              "Approved commercial terms.",

            campaignName:
              null,
          });

        expect(
          result.status
        ).toBe(
          "approved"
        );

        if (
          result.status !== "approved"
        ) {
          throw new Error(
            "Expected approval outcome."
          );
        }

        expect(
          result.campaign
        ).toMatchObject({
          status:
            "draft",

          readinessStatus:
            "pending_setup",

          commercialStatus:
            "pending_funding",

          deliveryEligible:
            false,
        });

        expect(
          approve
        ).toHaveBeenCalledWith({
          requestId:
            REQUEST.id,

          actorUserId:
            CAMPAIGN.createdByUserId,

          expectedRowVersion:
            REQUEST.rowVersion,

          decisionNote:
            "Approved commercial terms.",

          campaignName:
            null,

          campaignReference:
            CAMPAIGN.campaignReference,

          decidedAt:
            NOW,
        });
      }
    );
  }
);
