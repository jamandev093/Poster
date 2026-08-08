import {
  describe,
  expect,
  it,
  vi,
} from "vitest";

import {
  buildApp,
} from "../src/app.js";


import type {
  AccountSelectedInterestsService,
} from "../src/application/authentication/index.js";

import type {
  AccountSelectedInterestsSnapshot,
} from "../src/domains/interests/index.js";

const USER_ID =
  "00000000-0000-4000-8000-000000001101";

const SELECTED_INTERESTS_RESPONSE:
  AccountSelectedInterestsSnapshot =
  {
    userId:
      USER_ID,

    selectedInterests:
      [
        "artificial-intelligence",
        "climate-science",
      ],

    interests:
      [
        {
          topicId:
            "10000000-0000-4000-8000-000000000001",

          topicSlug:
            "artificial-intelligence",

          topicName:
            "Artificial Intelligence",

          personalizationAllowed:
            true,

          campaignTargetingAllowed:
            false,

          selectedAt:
            "2026-08-08T07:30:00.000Z",

          consentUpdatedAt:
            "2026-08-08T07:30:00.000Z",
        },
        {
          topicId:
            "10000000-0000-4000-8000-000000000002",

          topicSlug:
            "climate-science",

          topicName:
            "Climate Science",

          personalizationAllowed:
            true,

          campaignTargetingAllowed:
            false,

          selectedAt:
            "2026-08-08T07:30:00.000Z",

          consentUpdatedAt:
            "2026-08-08T07:30:00.000Z",
        },
      ],

    updatedAt:
      "2026-08-08T07:30:00.000Z",
  };

const UPDATED_INTERESTS_RESPONSE:
  AccountSelectedInterestsSnapshot =
  {
    ...SELECTED_INTERESTS_RESPONSE,

    selectedInterests:
      [
        "space",
        "public-policy",
      ],

    interests:
      [
        {
          topicId:
            "10000000-0000-4000-8000-000000000003",

          topicSlug:
            "space",

          topicName:
            "Space",

          personalizationAllowed:
            true,

          campaignTargetingAllowed:
            false,

          selectedAt:
            "2026-08-08T07:35:00.000Z",

          consentUpdatedAt:
            "2026-08-08T07:35:00.000Z",
        },
        {
          topicId:
            "10000000-0000-4000-8000-000000000004",

          topicSlug:
            "public-policy",

          topicName:
            "Public Policy",

          personalizationAllowed:
            true,

          campaignTargetingAllowed:
            false,

          selectedAt:
            "2026-08-08T07:35:00.000Z",

          consentUpdatedAt:
            "2026-08-08T07:35:00.000Z",
        },
      ],

    updatedAt:
      "2026-08-08T07:35:00.000Z",
  };

function createAuthorizationContextService(
  context:
    unknown
): never {
  return new Proxy(
    {},
    {
      get:
        () =>
          vi.fn(
            async () =>
              context
          ),
    }
  ) as never;
}

function createSelectedInterestsService():
  AccountSelectedInterestsService {
  return {
    getSelectedInterests:
      vi.fn(
        async () =>
          SELECTED_INTERESTS_RESPONSE
      ),

    replaceSelectedInterests:
      vi.fn(
        async () =>
          UPDATED_INTERESTS_RESPONSE
      ),
  };
}

describe(
  "GET /api/v1/auth/account/interests",
  () => {
    it(
      "reads selected interests for the authenticated account",
      async () => {
        const service =
          createSelectedInterestsService();

        const app =
          await buildApp({
            authorizationContextService:
              createAuthorizationContextService({
                userId:
                  USER_ID,

                organizationId:
                  null,

                sessionId:
                  "session-selected-interests-read",
              }),

            accountSelectedInterestsService:
              service as never,
          });

        const response =
          await app.inject({
            method:
              "GET",

            url:
              "/api/v1/auth/account/interests",

            headers: {
              authorization:
                "Bearer valid.selected-interests",
            },
          });

        expect(
          response.statusCode
        ).toBe(
          200
        );

        expect(
          JSON.parse(
            response.payload
          )
        ).toEqual(
          SELECTED_INTERESTS_RESPONSE
        );

        expect(
          service.getSelectedInterests
        ).toHaveBeenCalledWith({
          userId:
            USER_ID,
        });

        await app.close();
      }
    );

    it(
      "rejects unauthenticated selected-interest reads",
      async () => {
        const service =
          createSelectedInterestsService();

        const app =
          await buildApp({
            authorizationContextService:
              createAuthorizationContextService(
                null
              ),

            accountSelectedInterestsService:
              service as never,
          });

        const response =
          await app.inject({
            method:
              "GET",

            url:
              "/api/v1/auth/account/interests",
          });

        expect(
          response.statusCode
        ).toBe(
          401
        );

        expect(
          service.getSelectedInterests
        ).not.toHaveBeenCalled();

        await app.close();
      }
    );
  }
);

describe(
  "PATCH /api/v1/auth/account/interests",
  () => {
    it(
      "replaces selected interests for the authenticated account",
      async () => {
        const service =
          createSelectedInterestsService();

        const app =
          await buildApp({
            authorizationContextService:
              createAuthorizationContextService({
                userId:
                  USER_ID,

                organizationId:
                  null,

                sessionId:
                  "session-selected-interests-write",
              }),

            accountSelectedInterestsService:
              service as never,
          });

        const response =
          await app.inject({
            method:
              "PATCH",

            url:
              "/api/v1/auth/account/interests",

            headers: {
              authorization:
                "Bearer valid.selected-interests",

              "content-type":
                "application/json",
            },

            payload: {
              selectedInterests:
                [
                  "space",
                  "public-policy",
                ],
            },
          });

        expect(
          response.statusCode
        ).toBe(
          200
        );

        expect(
          JSON.parse(
            response.payload
          )
        ).toEqual(
          UPDATED_INTERESTS_RESPONSE
        );

        expect(
          service.replaceSelectedInterests
        ).toHaveBeenCalledWith({
          userId:
            USER_ID,

          selectedInterests:
            [
              "space",
              "public-policy",
            ],
        });

        await app.close();
      }
    );

    it(
      "rejects invalid selected-interest payloads before service execution",
      async () => {
        const service =
          createSelectedInterestsService();

        const app =
          await buildApp({
            authorizationContextService:
              createAuthorizationContextService({
                userId:
                  USER_ID,

                organizationId:
                  null,

                sessionId:
                  "session-selected-interests-invalid",
              }),

            accountSelectedInterestsService:
              service as never,
          });

        const response =
          await app.inject({
            method:
              "PATCH",

            url:
              "/api/v1/auth/account/interests",

            headers: {
              authorization:
                "Bearer valid.selected-interests",

              "content-type":
                "application/json",
            },

            payload: {
              selectedInterests:
                [
                  "",
                ],
            },
          });

        expect(
          response.statusCode
        ).toBe(
          400
        );

        expect(
          JSON.parse(
            response.payload
          ).code
        ).toBe(
          "REQUEST_VALIDATION_FAILED"
        );

        expect(
          service.replaceSelectedInterests
        ).not.toHaveBeenCalled();

        await app.close();
      }
    );

    it(
      "maps unknown interest topics to validation failure",
      async () => {
        const service =
          createSelectedInterestsService();

        vi.mocked(
          service.replaceSelectedInterests
        ).mockRejectedValueOnce(
          new Error(
            "Unknown interest topic: unknown-topic"
          )
        );

        const app =
          await buildApp({
            authorizationContextService:
              createAuthorizationContextService({
                userId:
                  USER_ID,

                organizationId:
                  null,

                sessionId:
                  "session-selected-interests-unknown",
              }),

            accountSelectedInterestsService:
              service as never,
          });

        const response =
          await app.inject({
            method:
              "PATCH",

            url:
              "/api/v1/auth/account/interests",

            headers: {
              authorization:
                "Bearer valid.selected-interests",

              "content-type":
                "application/json",
            },

            payload: {
              selectedInterests:
                [
                  "unknown-topic",
                ],
            },
          });

        expect(
          response.statusCode
        ).toBe(
          400
        );

        expect(
          JSON.parse(
            response.payload
          ).code
        ).toBe(
          "REQUEST_VALIDATION_FAILED"
        );

        await app.close();
      }
    );
  }
);
