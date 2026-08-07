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

const USER_ID =
  "00000000-0000-4000-8000-000000000401";

const ACCOUNT_PROFILE_RESPONSE = {
  account: {
    id:
      USER_ID,

    email:
      "person@example.com",

    fullName:
      "Poster Person",

    username:
      "poster_person",

    profileImageUrl:
      "https://cdn.example.com/profile/person.jpg",

    interests: {
      topicIds: [
        "technology",
      ],

      topicNames: [
        "Technology",
      ],

      unresolvedValues: [],

      displayValues: [
        "Technology",
      ],
    },

    preferences: {
      darkMode:
        false,

      notifications:
        true,

      personalizedAds:
        true,
    },

    status:
      "active",

    emailVerifiedAt:
      "2026-08-01T09:00:00.000Z",

    createdAt:
      "2026-08-01T08:00:00.000Z",

    updatedAt:
      "2026-08-07T09:00:00.000Z",

    rowVersion:
      "7",
  },
};

const UPDATED_ACCOUNT_PROFILE_RESPONSE = {
  account: {
    ...ACCOUNT_PROFILE_RESPONSE.account,

    fullName:
      "Updated Poster Person",

    username:
      "updated_person",

    profileImageUrl:
      "https://cdn.example.com/profile/updated.jpg",

    interests: {
      topicIds: [
        "technology",
        "business",
      ],

      topicNames: [
        "Technology",
        "Business",
      ],

      unresolvedValues: [
        "AI policy",
      ],

      displayValues: [
        "Technology",
        "Business",
        "AI policy",
      ],
    },

    preferences: {
      darkMode:
        true,

      notifications:
        false,

      personalizedAds:
        false,
    },

    updatedAt:
      "2026-08-07T10:00:00.000Z",

    rowVersion:
      "8",
  },
};

function createAuthorizationContextService(
  context: unknown
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

function createAccountProfileService() {
  return {
    getProfile:
      vi.fn()
        .mockResolvedValue(
          ACCOUNT_PROFILE_RESPONSE
        ),

    updateProfile:
      vi.fn()
        .mockResolvedValue(
          UPDATED_ACCOUNT_PROFILE_RESPONSE
        ),
  };
}

describe(
  "account profile routes",
  () => {
    afterEach(
      () => {
        vi.restoreAllMocks();
      }
    );

    it(
      "returns the authenticated full account profile",
      async () => {
        const accountProfileService =
          createAccountProfileService();

        const app =
          await buildApp({
            authorizationContextService:
              createAuthorizationContextService({
                userId:
                  USER_ID,

                organizationId:
                  null,

                sessionId:
                  "session-profile-read",
              }),

            accountProfileService:
              accountProfileService as never,
          });

        const response =
          await app.inject({
            method:
              "GET",

            url:
              "/api/v1/auth/account/profile",

            headers: {
              authorization:
                "Bearer valid.profile",
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
          ACCOUNT_PROFILE_RESPONSE
        );

        expect(
          accountProfileService.getProfile
        ).toHaveBeenCalledWith({
          userId:
            USER_ID,
        });

        await app.close();
      }
    );

    it(
      "updates the authenticated full account profile",
      async () => {
        const accountProfileService =
          createAccountProfileService();

        const app =
          await buildApp({
            authorizationContextService:
              createAuthorizationContextService({
                userId:
                  USER_ID,

                organizationId:
                  null,

                sessionId:
                  "session-profile-update",
              }),

            accountProfileService:
              accountProfileService as never,
          });

        const response =
          await app.inject({
            method:
              "PATCH",

            url:
              "/api/v1/auth/account/profile",

            headers: {
              authorization:
                "Bearer valid.profile",

              "content-type":
                "application/json",
            },

            payload: {
              fullName:
                "  Updated   Poster   Person  ",

              username:
                "UPDATED_PERSON",

              profileImageUrl:
                "https://cdn.example.com/profile/updated.jpg",

              interests: {
                topicIds: [
                  "technology",
                  "business",
                ],

                topicNames: [
                  "Technology",
                  "Business",
                ],

                unresolvedValues: [
                  "AI policy",
                ],

                displayValues: [
                  "Technology",
                ],
              },

              preferences: {
                darkMode:
                  true,

                notifications:
                  false,

                personalizedAds:
                  false,
              },
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
          UPDATED_ACCOUNT_PROFILE_RESPONSE
        );

        expect(
          accountProfileService.updateProfile
        ).toHaveBeenCalledWith({
          userId:
            USER_ID,

          fullName:
            "Updated   Poster   Person",

          username:
            "updated_person",

          profileImageUrl:
            "https://cdn.example.com/profile/updated.jpg",

          interests: {
            topicIds: [
              "technology",
              "business",
            ],

            topicNames: [
              "Technology",
              "Business",
            ],

            unresolvedValues: [
              "AI policy",
            ],

            displayValues: [
              "Technology",
            ],
          },

          preferences: {
            darkMode:
              true,

            notifications:
              false,

            personalizedAds:
              false,
          },
        });

        await app.close();
      }
    );

    it(
      "updates nullable account profile fields",
      async () => {
        const accountProfileService =
          createAccountProfileService();

        const app =
          await buildApp({
            authorizationContextService:
              createAuthorizationContextService({
                userId:
                  USER_ID,

                organizationId:
                  null,

                sessionId:
                  "session-profile-nullable-update",
              }),

            accountProfileService:
              accountProfileService as never,
          });

        const response =
          await app.inject({
            method:
              "PATCH",

            url:
              "/api/v1/auth/account/profile",

            headers: {
              authorization:
                "Bearer valid.profile",

              "content-type":
                "application/json",
            },

            payload: {
              username:
                null,

              profileImageUrl:
                null,
            },
          });

        expect(
          response.statusCode
        ).toBe(
          200
        );

        expect(
          accountProfileService.updateProfile
        ).toHaveBeenCalledWith({
          userId:
            USER_ID,

          username:
            null,

          profileImageUrl:
            null,
        });

        await app.close();
      }
    );

    it(
      "rejects unauthenticated account profile reads",
      async () => {
        const accountProfileService =
          createAccountProfileService();

        const app =
          await buildApp({
            authorizationContextService:
              createAuthorizationContextService(
                null
              ),

            accountProfileService:
              accountProfileService as never,
          });

        const response =
          await app.inject({
            method:
              "GET",

            url:
              "/api/v1/auth/account/profile",
          });

        expect(
          response.statusCode
        ).toBe(
          401
        );

        expect(
          accountProfileService.getProfile
        ).not.toHaveBeenCalled();

        await app.close();
      }
    );

    it(
      "rejects empty account profile update payloads",
      async () => {
        const accountProfileService =
          createAccountProfileService();

        const app =
          await buildApp({
            authorizationContextService:
              createAuthorizationContextService({
                userId:
                  USER_ID,

                organizationId:
                  null,

                sessionId:
                  "session-profile-empty",
              }),

            accountProfileService:
              accountProfileService as never,
          });

        const response =
          await app.inject({
            method:
              "PATCH",

            url:
              "/api/v1/auth/account/profile",

            headers: {
              authorization:
                "Bearer valid.profile",

              "content-type":
                "application/json",
            },

            payload: {},
          });

        expect(
          response.statusCode
        ).toBe(
          400
        );

        expect(
          accountProfileService.updateProfile
        ).not.toHaveBeenCalled();

        await app.close();
      }
    );

    it(
      "rejects invalid account profile update payloads",
      async () => {
        const accountProfileService =
          createAccountProfileService();

        const app =
          await buildApp({
            authorizationContextService:
              createAuthorizationContextService({
                userId:
                  USER_ID,

                organizationId:
                  null,

                sessionId:
                  "session-profile-invalid",
              }),

            accountProfileService:
              accountProfileService as never,
          });

        const response =
          await app.inject({
            method:
              "PATCH",

            url:
              "/api/v1/auth/account/profile",

            headers: {
              authorization:
                "Bearer valid.profile",

              "content-type":
                "application/json",
            },

            payload: {
              username:
                "Invalid Username",
            },
          });

        expect(
          response.statusCode
        ).toBe(
          400
        );

        expect(
          accountProfileService.updateProfile
        ).not.toHaveBeenCalled();

        await app.close();
      }
    );
  }
);
