import type {
  FastifyInstance,
} from "fastify";

import {
  afterEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

import {
  buildApp,
} from "../src/app.js";

import type {
  AdminCommercialRequestService,
} from "../src/application/monetization/admin-commercial-request.service.js";

import type {
  ClientCommercialRequestService,
} from "../src/application/monetization/client-commercial-request.service.js";

import type {
  AuthorizationContextService,
} from "../src/application/authorization/authorization-context.service.js";

import type {
  AuthorizationContext,
} from "../src/domains/authorization/authorization.types.js";

const USER_ID =
  "00000000-0000-4000-8000-000000002001";

const ADMIN_ID =
  "00000000-0000-4000-8000-000000002002";

const ORGANIZATION_ID =
  "00000000-0000-4000-8000-000000002003";

const REQUEST_ID =
  "00000000-0000-4000-8000-000000002004";

const CAMPAIGN_ID =
  "00000000-0000-4000-8000-000000002005";

const NOW =
  new Date(
    "2026-07-29T14:30:00.000Z"
  );

const REQUEST = {
  id:
    REQUEST_ID,

  requestReference:
    "ADV-ROUTETEST01",

  organizationId:
    ORGANIZATION_ID,

  submittedByUserId:
    USER_ID,

  requestType:
    "direct_sponsorship" as const,

  status:
    "pending_review" as const,

  title:
    "Route test sponsorship",

  objective:
    "Test route behavior.",

  destinationUrl:
    "https://example.com",

  requestedPlacements: [
    "home" as const,
  ],

  requestedStartDate:
    "2026-08-10",

  requestedEndDate:
    "2026-08-31",

  budgetMinorUnits:
    "1000000",

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

function authorizationService(
  context: AuthorizationContext
): AuthorizationContextService {
  const resolve =
    vi.fn<
      AuthorizationContextService[
        "resolve"
      ]
    >();

  resolve.mockResolvedValue(
    context
  );

  return {
    resolve,
  };
}

function createClientService() {
  const submit =
    vi.fn<
      ClientCommercialRequestService[
        "submit"
      ]
    >();

  submit.mockResolvedValue(
    REQUEST
  );

  const resubmit =
    vi.fn<
      ClientCommercialRequestService[
        "resubmit"
      ]
    >();

  const listForOrganization =
    vi.fn<
      ClientCommercialRequestService[
        "listForOrganization"
      ]
    >();

  const getForOrganization =
    vi.fn<
      ClientCommercialRequestService[
        "getForOrganization"
      ]
    >();

  return {
    submit,

    service: {
      submit,
      resubmit,
      listForOrganization,
      getForOrganization,
    } satisfies ClientCommercialRequestService,
  };
}

function createAdminService() {
  const approve =
    vi.fn<
      AdminCommercialRequestService[
        "approve"
      ]
    >();

  approve.mockResolvedValue({
    status:
      "approved",

    request: {
      ...REQUEST,

      status:
        "approved",

      decidedAt:
        NOW,

      decidedByUserId:
        ADMIN_ID,
    },

    campaign: {
      id:
        CAMPAIGN_ID,

      campaignReference:
        "CMP-ROUTETEST01",

      sourceRequestId:
        REQUEST_ID,

      organizationId:
        ORGANIZATION_ID,

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
        ADMIN_ID,

      createdAt:
        NOW,

      updatedAt:
        NOW,

      rowVersion:
        "1",
    },

    idempotent:
      false,
  });

  const list =
    vi.fn<
      AdminCommercialRequestService[
        "list"
      ]
    >();

  const get =
    vi.fn<
      AdminCommercialRequestService[
        "get"
      ]
    >();

  const requestChanges =
    vi.fn<
      AdminCommercialRequestService[
        "requestChanges"
      ]
    >();

  const reject =
    vi.fn<
      AdminCommercialRequestService[
        "reject"
      ]
    >();

  return {
    approve,

    service: {
      list,
      get,
      requestChanges,
      reject,
      approve,
    } satisfies AdminCommercialRequestService,
  };
}

describe(
  "Poster commercial-request HTTP routes",
  () => {
    let app:
      FastifyInstance | null =
      null;

    afterEach(
      async () => {
        if (app) {
          await app.close();

          app =
            null;
        }
      }
    );

    it(
      "accepts an organization-authorized Client advertising request",
      async () => {
        const client =
          createClientService();

        app =
          await buildApp({
            authorizationContextService:
              authorizationService({
                userId:
                  USER_ID,

                sessionId:
                  "00000000-0000-4000-8000-000000002101",

                email:
                  "client@example.com",

                fullName:
                  "Client User",

                accountStatus:
                  "active",

                platformRoles:
                  [],

                platformPermissions:
                  [],

                organizationMemberships: [
                  {
                    membershipId:
                      "00000000-0000-4000-8000-000000002102",

                    organizationId:
                      ORGANIZATION_ID,

                    role:
                      "campaign_manager",

                    isPrimaryContact:
                      true,
                  },
                ],
              }),

            clientCommercialRequestService:
              client.service,
          });

        const response =
          await app.inject({
            method:
              "POST",

            url:
              `/api/v1/client/organizations/${ORGANIZATION_ID}/advertising-requests`,

            headers: {
              authorization:
                "Bearer payload.signature",
            },

            payload: {
              requestType:
                "direct_sponsorship",

              title:
                REQUEST.title,

              objective:
                REQUEST.objective,

              destinationUrl:
                REQUEST.destinationUrl,

              requestedPlacements: [
                "home",
              ],

              requestedStartDate:
                "2026-08-10",

              requestedEndDate:
                "2026-08-31",

              budgetMinorUnits:
                1000000,

              currencyCode:
                "INR",

              creativeSpec: {},
              commercialTerms: {},
            },
          });

        expect(
          response.statusCode
        ).toBe(
          201
        );

        expect(
          client.submit
        ).toHaveBeenCalledWith(
          expect.objectContaining({
            organizationId:
              ORGANIZATION_ID,

            actorUserId:
              USER_ID,

            requestType:
              "direct_sponsorship",
          })
        );
      }
    );

    it(
      "rejects Client submission without an allowed organization role",
      async () => {
        const client =
          createClientService();

        app =
          await buildApp({
            authorizationContextService:
              authorizationService({
                userId:
                  USER_ID,

                sessionId:
                  "00000000-0000-4000-8000-000000002201",

                email:
                  "viewer@example.com",

                fullName:
                  "Viewer",

                accountStatus:
                  "active",

                platformRoles:
                  [],

                platformPermissions:
                  [],

                organizationMemberships: [
                  {
                    membershipId:
                      "00000000-0000-4000-8000-000000002202",

                    organizationId:
                      ORGANIZATION_ID,

                    role:
                      "viewer",

                    isPrimaryContact:
                      false,
                  },
                ],
              }),

            clientCommercialRequestService:
              client.service,
          });

        const response =
          await app.inject({
            method:
              "POST",

            url:
              `/api/v1/client/organizations/${ORGANIZATION_ID}/advertising-requests`,

            headers: {
              authorization:
                "Bearer payload.signature",
            },

            payload: {
              requestType:
                "direct_sponsorship",

              title:
                REQUEST.title,

              objective:
                REQUEST.objective,

              destinationUrl:
                REQUEST.destinationUrl,

              requestedPlacements: [
                "home",
              ],

              requestedStartDate:
                "2026-08-10",

              requestedEndDate:
                "2026-08-31",

              creativeSpec: {},
              commercialTerms: {},
            },
          });

        expect(
          response.statusCode
        ).toBe(
          403
        );

        expect(
          client.submit
        ).not.toHaveBeenCalled();
      }
    );

    it(
      "lets an authorized Admin approve and receive a non-deliverable draft campaign",
      async () => {
        const admin =
          createAdminService();

        app =
          await buildApp({
            authorizationContextService:
              authorizationService({
                userId:
                  ADMIN_ID,

                sessionId:
                  "00000000-0000-4000-8000-000000002301",

                email:
                  "admin@getpostar.com",

                fullName:
                  "Poster Admin",

                accountStatus:
                  "active",

                platformRoles: [
                  "operations_admin",
                ],

                platformPermissions: [
                  "admin.access",
                  "monetization.requests.read",
                  "monetization.requests.manage",
                  "monetization.campaigns.read",
                  "monetization.campaigns.manage",
                ],

                organizationMemberships:
                  [],
              }),

            adminCommercialRequestService:
              admin.service,
          });

        const response =
          await app.inject({
            method:
              "POST",

            url:
              `/api/v1/admin/monetization/requests/${REQUEST_ID}/approve`,

            headers: {
              authorization:
                "Bearer payload.signature",
            },

            payload: {
              expectedRowVersion:
                "1",

              decisionNote:
                "Approved after review.",
            },
          });

        expect(
          response.statusCode
        ).toBe(
          200
        );

        expect(
          response.json()
        ).toMatchObject({
          campaign: {
            status:
              "draft",

            readinessStatus:
              "pending_setup",

            commercialStatus:
              "pending_funding",

            deliveryEligible:
              false,
          },

          idempotent:
            false,
        });

        expect(
          admin.approve
        ).toHaveBeenCalledWith({
          requestId:
            REQUEST_ID,

          actorUserId:
            ADMIN_ID,

          expectedRowVersion:
            "1",

          decisionNote:
            "Approved after review.",

          campaignName:
            null,
        });
      }
    );
  }
);
