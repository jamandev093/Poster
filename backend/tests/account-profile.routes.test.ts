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
      "returns the authenticated account profile",
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
      "updates the authenticated account full name",
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
              fullName:
                "",
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
