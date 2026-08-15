import {
  describe,
  expect,
  it,
  vi,
} from "vitest";

import {
  createGoogleAuthenticationService,
  GoogleAuthenticationConflictError,
} from "../src/application/authentication/google-authentication.service.js";

import type {
  UserExternalIdentityRecord,
} from "../src/domains/identity/external-identity.repository.js";

import type {
  UserIdentityRecord,
  UserSessionRecord,
} from "../src/domains/identity/identity.types.js";

const NOW =
  new Date(
    "2026-08-15T16:45:00.000Z"
  );

const USER_ID =
  "00000000-0000-4000-8000-000000004001";

const IDENTITY_ID =
  "00000000-0000-4000-8000-000000004002";

const SESSION_ID =
  "00000000-0000-4000-8000-000000004003";

const ACTIVE_USER:
  UserIdentityRecord = {
  id:
    USER_ID,

  email:
    "person@gmail.com",

  passwordHash:
    "$argon2id$placeholder",

  fullName:
    "Example Person",

  username:
    null,

  profileImageUrl:
    null,

  status:
    "active",

  emailVerifiedAt:
    NOW,

  lastLoginAt:
    null,

  failedLoginAttempts:
    0,

  lockedUntil:
    null,

  createdAt:
    NOW,

  updatedAt:
    NOW,

  deletedAt:
    null,

  rowVersion:
    "2",
};

const EXTERNAL_IDENTITY:
  UserExternalIdentityRecord = {
  id:
    IDENTITY_ID,

  userId:
    USER_ID,

  provider:
    "google",

  providerSubject:
    "google-subject-001",

  providerEmail:
    "person@gmail.com",

  createdAt:
    NOW,

  lastAuthenticatedAt:
    NOW,
};

const SESSION:
  UserSessionRecord = {
  id:
    SESSION_ID,

  userId:
    USER_ID,

  organizationId:
    null,

  refreshTokenDigest:
    "refresh-digest",

  ipAddress:
    "127.0.0.1",

  userAgent:
    "Poster-Test",

  createdAt:
    NOW,

  lastSeenAt:
    NOW,

  expiresAt:
    new Date(
      NOW.getTime() +
        30 * 24 * 60 * 60 * 1000
    ),

  revokedAt:
    null,

  revocationReason:
    null,
};

function createVerifiedGoogleIdentity() {
  return {
    subject:
      "google-subject-001",

    email:
      "person@gmail.com",

    emailVerified:
      true,

    fullName:
      "Example Person",
  };
}

function createBaseOverrides() {
  const findExternalIdentity =
    vi.fn(
      async (): Promise<
        UserExternalIdentityRecord |
        null
      > =>
        EXTERNAL_IDENTITY
    );

  const createExternalIdentity =
    vi.fn(
      async () =>
        EXTERNAL_IDENTITY
    );

  const touchExternalIdentity =
    vi.fn(
      async () =>
        EXTERNAL_IDENTITY
    );

  const findUserById =
    vi.fn(
      async () =>
        ACTIVE_USER
    );

  const findUserByEmail =
    vi.fn(
      async () =>
        null
    );

  const createUser =
    vi.fn(
      async () => ({
        ...ACTIVE_USER,

        status:
          "pending_verification" as const,

        emailVerifiedAt:
          null,

        rowVersion:
          "1",
      })
    );

  const markUserEmailVerified =
    vi.fn(
      async () =>
        ACTIVE_USER
    );

  const recordSuccessfulUserLogin =
    vi.fn(
      async () => ({
        ...ACTIVE_USER,

        lastLoginAt:
          NOW,

        rowVersion:
          "3",
      })
    );

  const createUserSession =
    vi.fn(
      async () =>
        SESSION
    );

  const options = {
    webClientId:
      "poster-web-client.apps.googleusercontent.com",

    verifyGoogleIdToken:
      vi.fn(
        async () =>
          createVerifiedGoogleIdentity()
      ),

    runDatabaseTransaction:
      vi.fn(
        async (
          operation:
            (
              executor:
                never
            ) => Promise<unknown>
        ) =>
          await operation(
            {} as never
          )
      ),

    findUserExternalIdentityByProviderSubject:
      findExternalIdentity,

    createUserExternalIdentity:
      createExternalIdentity,

    touchUserExternalIdentity:
      touchExternalIdentity,

    findUserById,

    findUserByEmail,

    createUser,

    markUserEmailVerified,

    recordSuccessfulUserLogin,

    createUserSession,

    createOpaqueTokenPair:
      vi.fn(
        () => ({
          token:
            "raw-refresh-token",

          digest:
            "refresh-digest",
        })
      ),

    hashPassword:
      vi.fn(
        async () =>
          "$argon2id$generated-placeholder"
      ),

    createPlaceholderPassword:
      vi.fn(
        () =>
          "generated-random-placeholder-password"
      ),

    now:
      vi.fn(
        () =>
          NOW
      ),
  };

  return {
    options,

    findExternalIdentity,
    createExternalIdentity,
    touchExternalIdentity,
    findUserById,
    findUserByEmail,
    createUser,
    markUserEmailVerified,
    recordSuccessfulUserLogin,
    createUserSession,
  };
}

describe(
  "GoogleAuthenticationService",
  () => {
    it(
      "authenticates an existing Google identity through the normal Poster revocable session",
      async () => {
        const context =
          createBaseOverrides();

        const service =
          createGoogleAuthenticationService(
            context.options as never
          );

        const result =
          await service.authenticate({
            idToken:
              "verified-google-id-token",

            mode:
              "login",

            ipAddress:
              "127.0.0.1",

            userAgent:
              "Poster-Test",
          });

        expect(
          result.isNewAccount
        ).toBe(
          false
        );

        expect(
          result.account.id
        ).toBe(
          USER_ID
        );

        expect(
          result.session.id
        ).toBe(
          SESSION_ID
        );

        expect(
          result.refreshToken
        ).toBe(
          "raw-refresh-token"
        );

        expect(
          context.createUser
        ).not.toHaveBeenCalled();

        expect(
          context.touchExternalIdentity
        ).toHaveBeenCalledTimes(
          1
        );

        expect(
          context.createUserSession
        ).toHaveBeenCalledTimes(
          1
        );
      }
    );

    it(
      "creates and verifies a new Poster account for Google signup before creating the Poster session",
      async () => {
        const context =
          createBaseOverrides();

        context
          .findExternalIdentity
          .mockResolvedValue(
            null
          );

        context
          .findUserByEmail
          .mockResolvedValue(
            null
          );

        const service =
          createGoogleAuthenticationService(
            context.options as never
          );

        const result =
          await service.authenticate({
            idToken:
              "verified-google-id-token",

            mode:
              "signup",
          });

        expect(
          result.isNewAccount
        ).toBe(
          true
        );

        expect(
          context.createUser
        ).toHaveBeenCalledTimes(
          1
        );

        expect(
          context.markUserEmailVerified
        ).toHaveBeenCalledTimes(
          1
        );

        expect(
          context.createExternalIdentity
        ).toHaveBeenCalledTimes(
          1
        );

        expect(
          context.createUserSession
        ).toHaveBeenCalledTimes(
          1
        );
      }
    );

    it(
      "does not auto-link an unrecognized Google subject during login",
      async () => {
        const context =
          createBaseOverrides();

        context
          .findExternalIdentity
          .mockResolvedValue(
            null
          );

        const service =
          createGoogleAuthenticationService(
            context.options as never
          );

        await expect(
          service.authenticate({
            idToken:
              "verified-google-id-token",

            mode:
              "login",
          })
        ).rejects.toBeInstanceOf(
          GoogleAuthenticationConflictError
        );

        expect(
          context.createUser
        ).not.toHaveBeenCalled();
      }
    );
  }
);