import {
  describe,
  expect,
  it,
  vi,
} from "vitest";

import {
  createAccountProfileService,
} from "../src/application/authentication/account-profile.service.js";

import {
  AuthenticationSessionInvalidError,
} from "../src/domains/authentication/authentication.errors.js";

import type {
  DatabaseQueryExecutor,
} from "../src/database/index.js";

import type {
  UserIdentityRecord,
  UserProfileInterests,
  UserProfilePreferences,
} from "../src/domains/identity/index.js";

const USER_ID =
  "00000000-0000-4000-8000-000000000301";

const EXECUTOR =
  {} as DatabaseQueryExecutor;

const PROFILE_INTERESTS:
  UserProfileInterests = {
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
};

const PROFILE_PREFERENCES:
  UserProfilePreferences = {
  darkMode:
    false,

  notifications:
    true,

  personalizedAds:
    true,
};

const UPDATED_PROFILE_INTERESTS:
  UserProfileInterests = {
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
};

const UPDATED_PROFILE_PREFERENCES:
  UserProfilePreferences = {
  darkMode:
    true,

  notifications:
    false,

  personalizedAds:
    false,
};

const ACCOUNT:
  UserIdentityRecord = {
  id:
    USER_ID,

  email:
    "person@example.com",

  passwordHash:
    "$argon2id$v=19$m=65536,t=3,p=1$profile$hash",

  fullName:
    "Poster Person",

  username:
    "poster_person",

  profileImageUrl:
    "https://cdn.example.com/profile/person.jpg",

  profileInterests:
    PROFILE_INTERESTS,

  profilePreferences:
    PROFILE_PREFERENCES,

  status:
    "active",

  emailVerifiedAt:
    new Date(
      "2026-08-01T09:00:00.000Z"
    ),

  lastLoginAt:
    new Date(
      "2026-08-07T09:00:00.000Z"
    ),

  failedLoginAttempts:
    0,

  lockedUntil:
    null,

  createdAt:
    new Date(
      "2026-08-01T08:00:00.000Z"
    ),

  updatedAt:
    new Date(
      "2026-08-07T09:00:00.000Z"
    ),

  deletedAt:
    null,

  rowVersion:
    "7",
};

const UPDATED_ACCOUNT:
  UserIdentityRecord = {
  ...ACCOUNT,

  fullName:
    "Updated Poster Person",

  username:
    "updated_person",

  profileImageUrl:
    "https://cdn.example.com/profile/updated.jpg",

  profileInterests:
    UPDATED_PROFILE_INTERESTS,

  profilePreferences:
    UPDATED_PROFILE_PREFERENCES,

  updatedAt:
    new Date(
      "2026-08-07T10:00:00.000Z"
    ),

  rowVersion:
    "8",
};

describe(
  "AccountProfileService",
  () => {
    it(
      "returns the authenticated full account profile",
      async () => {
        const service =
          createAccountProfileService({
            findUserById:
              vi.fn()
                .mockResolvedValue(
                  ACCOUNT
                ),
          });

        await expect(
          service.getProfile({
            userId:
              USER_ID,
          })
        ).resolves.toEqual({
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

            interests:
              PROFILE_INTERESTS,

            preferences:
              PROFILE_PREFERENCES,

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
        });
      }
    );

    it(
      "updates full account profile data inside a transaction",
      async () => {
        const findUserById =
          vi.fn()
            .mockResolvedValue(
              ACCOUNT
            );

        const updateUserProfile =
          vi.fn()
            .mockResolvedValue(
              UPDATED_ACCOUNT
            );

        const runDatabaseTransaction =
          vi.fn(
            async operation =>
              await operation(
                EXECUTOR
              )
          );

        const service =
          createAccountProfileService({
            findUserById,

            updateUserProfile,

            runDatabaseTransaction,
          });

        const result =
          await service.updateProfile({
            userId:
              USER_ID,

            fullName:
              "  Updated   Poster   Person  ",

            username:
              "  Updated_Person  ",

            profileImageUrl:
              "  https://cdn.example.com/profile/updated.jpg  ",

            interests: {
              topicIds: [
                "technology",
                "business",
                "technology",
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

            preferences:
              UPDATED_PROFILE_PREFERENCES,
          });

        expect(
          result.account.fullName
        ).toBe(
          "Updated Poster Person"
        );

        expect(
          result.account.username
        ).toBe(
          "updated_person"
        );

        expect(
          result.account.interests
        ).toEqual(
          UPDATED_PROFILE_INTERESTS
        );

        expect(
          result.account.preferences
        ).toEqual(
          UPDATED_PROFILE_PREFERENCES
        );

        expect(
          runDatabaseTransaction
        ).toHaveBeenCalledTimes(
          1
        );

        expect(
          findUserById
        ).toHaveBeenCalledWith(
          USER_ID,
          EXECUTOR
        );

        expect(
          updateUserProfile
        ).toHaveBeenCalledWith(
          {
            userId:
              USER_ID,

            expectedRowVersion:
              "7",

            fullName:
              "Updated Poster Person",

            username:
              "updated_person",

            profileImageUrl:
              "https://cdn.example.com/profile/updated.jpg",

            profileInterests:
              UPDATED_PROFILE_INTERESTS,

            profilePreferences:
              UPDATED_PROFILE_PREFERENCES,
          },
          EXECUTOR
        );
      }
    );

    it(
      "updates only provided profile fields",
      async () => {
        const findUserById =
          vi.fn()
            .mockResolvedValue(
              ACCOUNT
            );

        const updateUserProfile =
          vi.fn()
            .mockResolvedValue({
              ...ACCOUNT,

              fullName:
                "Updated Poster Person",

              rowVersion:
                "8",
            });

        const service =
          createAccountProfileService({
            findUserById,

            updateUserProfile,

            runDatabaseTransaction:
              vi.fn(
                async operation =>
                  await operation(
                    EXECUTOR
                  )
              ),
          });

        await service.updateProfile({
          userId:
            USER_ID,

          fullName:
            "Updated Poster Person",
        });

        expect(
          updateUserProfile
        ).toHaveBeenCalledWith(
          {
            userId:
              USER_ID,

            expectedRowVersion:
              "7",

            fullName:
              "Updated Poster Person",
          },
          EXECUTOR
        );
      }
    );

    it(
      "rejects profile reads when the authenticated account no longer exists",
      async () => {
        const service =
          createAccountProfileService({
            findUserById:
              vi.fn()
                .mockResolvedValue(
                  null
                ),
          });

        await expect(
          service.getProfile({
            userId:
              USER_ID,
          })
        ).rejects.toBeInstanceOf(
          AuthenticationSessionInvalidError
        );
      }
    );

    it(
      "rejects profile updates when optimistic concurrency prevents the update",
      async () => {
        const service =
          createAccountProfileService({
            findUserById:
              vi.fn()
                .mockResolvedValue(
                  ACCOUNT
                ),

            updateUserProfile:
              vi.fn()
                .mockResolvedValue(
                  null
                ),

            runDatabaseTransaction:
              vi.fn(
                async operation =>
                  await operation(
                    EXECUTOR
                  )
              ),
          });

        await expect(
          service.updateProfile({
            userId:
              USER_ID,

            fullName:
              "Updated Poster Person",
          })
        ).rejects.toBeInstanceOf(
          AuthenticationSessionInvalidError
        );
      }
    );
  }
);
