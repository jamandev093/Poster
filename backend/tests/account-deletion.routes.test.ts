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
  AccountDeletionService,
} from "../src/application/authentication/account-deletion.service.js";

import type {
  AuthorizationContextService,
} from "../src/application/authorization/authorization-context.service.js";

import type {
  AuthorizationContext,
} from "../src/domains/authorization/index.js";

import {
  AUTHENTICATION_REFRESH_COOKIE_NAME,
} from "../src/http/authentication-cookie.js";

const USER_ID =
  "00000000-0000-4000-8000-000000000101";

const SESSION_ID =
  "00000000-0000-4000-8000-000000000201";

const AUTHORIZATION_CONTEXT:
  AuthorizationContext = {
  userId:
    USER_ID,

  sessionId:
    SESSION_ID,

  email:
    "person@example.com",

  fullName:
    "Poster Person",

  accountStatus:
    "active",

  platformRoles:
    [],

  platformPermissions:
    [],

  organizationMemberships:
    [],
};

function getSetCookieHeader(
  value: unknown
): string {
  if (
    Array.isArray(
      value
    )
  ) {
    return value
      .join(
        "\n"
      );
  }

  return typeof value ===
    "string"
    ? value
    : "";
}

function createAuthorizationContextService():
  AuthorizationContextService {
  return {
    resolve:
      vi.fn()
        .mockResolvedValue(
          AUTHORIZATION_CONTEXT
        ),
  };
}

function createAccountDeletionService(): {
  service: AccountDeletionService;

  deleteAccount:
    ReturnType<
      typeof vi.fn<
        AccountDeletionService[
          "deleteAccount"
        ]
      >
    >;
} {
  const deleteAccount =
    vi.fn<
      AccountDeletionService[
        "deleteAccount"
      ]
    >()
      .mockResolvedValue(
        {} as Awaited<
          ReturnType<
            AccountDeletionService[
              "deleteAccount"
            ]
          >
        >
      );

  return {
    service: {
      deleteAccount,
    },

    deleteAccount,
  };
}

describe(
  "DELETE /api/v1/auth/account",
  () => {
    let app:
      FastifyInstance |
      null =
      null;

    afterEach(
      async () => {
        await app?.close();

        app =
          null;
      }
    );

    it(
      "deletes the authenticated account and clears the refresh cookie",
      async () => {
        const accountDeletion =
          createAccountDeletionService();

        app =
          await buildApp({
            authorizationContextService:
              createAuthorizationContextService(),

            accountDeletionService:
              accountDeletion.service,
          });

        const response =
          await app.inject({
            method:
              "DELETE",

            url:
              "/api/v1/auth/account",

            headers: {
              authorization:
                "Bearer valid.delete",

              cookie:
                `${AUTHENTICATION_REFRESH_COOKIE_NAME}=current-refresh-token`,
            },
          });

        expect(
          response.statusCode
        ).toBe(
          204
        );

        expect(
          response.body
        ).toBe(
          ""
        );

        expect(
          accountDeletion
            .deleteAccount
        ).toHaveBeenCalledWith({
          userId:
            USER_ID,
        });

        expect(
          getSetCookieHeader(
            response.headers[
              "set-cookie"
            ]
          )
        ).toContain(
          `${AUTHENTICATION_REFRESH_COOKIE_NAME}=`
        );
      }
    );

    it(
      "rejects unauthenticated account deletion",
      async () => {
        const accountDeletion =
          createAccountDeletionService();

        app =
          await buildApp({
            authorizationContextService:
              createAuthorizationContextService(),

            accountDeletionService:
              accountDeletion.service,
          });

        const response =
          await app.inject({
            method:
              "DELETE",

            url:
              "/api/v1/auth/account",
          });

        expect(
          response.statusCode
        ).toBe(
          401
        );

        expect(
          accountDeletion
            .deleteAccount
        ).not.toHaveBeenCalled();
      }
    );
  }
);
