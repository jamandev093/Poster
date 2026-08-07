import {
  describe,
  expect,
  it,
  vi,
} from "vitest";

import {
  createAccountDeletionService,
} from "../src/application/authentication/account-deletion.service.js";

import {
  AuthenticationSessionInvalidError,
} from "../src/domains/authentication/authentication.errors.js";

import type {
  DatabaseQueryExecutor,
} from "../src/database/index.js";

import type {
  UserIdentityRecord,
} from "../src/domains/identity/index.js";

const USER_ID =
  "00000000-0000-4000-8000-000000000101";

const DELETED_AT =
  new Date(
    "2026-08-07T09:30:00.000Z"
  );

const EXECUTOR =
  {} as DatabaseQueryExecutor;

const ACTIVE_ACCOUNT:
  UserIdentityRecord = {
  id:
    USER_ID,

  email:
    "person@example.com",

  passwordHash:
    "$argon2id$v=19$m=65536,t=3,p=1$account$deletionhash",

  fullName:
    "Poster Person",

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

const DELETED_ACCOUNT:
  UserIdentityRecord = {
  ...ACTIVE_ACCOUNT,

  status:
    "deleted",

  deletedAt:
    DELETED_AT,

  rowVersion:
    "8",
};

describe(
  "AccountDeletionService",
  () => {
    it(
      "soft-deletes the authenticated account and revokes all sessions in one transaction",
      async () => {
        const findUserById =
          vi.fn()
            .mockResolvedValue(
              ACTIVE_ACCOUNT
            );

        const softDeleteUser =
          vi.fn()
            .mockResolvedValue(
              DELETED_ACCOUNT
            );

        const revokeAllUserSessions =
          vi.fn()
            .mockResolvedValue(
              3
            );

        const runDatabaseTransaction =
          vi.fn(
            async operation =>
              await operation(
                EXECUTOR
              )
          );

        const service =
          createAccountDeletionService({
            findUserById,

            softDeleteUser,

            revokeAllUserSessions,

            runDatabaseTransaction,

            now:
              () => DELETED_AT,
          });

        const result =
          await service.deleteAccount({
            userId:
              USER_ID,
          });

        expect(
          result
        ).toEqual({
          account:
            DELETED_ACCOUNT,

          deletedAt:
            DELETED_AT,

          revokedSessionCount:
            3,
        });

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
          softDeleteUser
        ).toHaveBeenCalledWith(
          {
            userId:
              USER_ID,

            expectedRowVersion:
              "7",

            deletedAt:
              DELETED_AT,
          },
          EXECUTOR
        );

        expect(
          revokeAllUserSessions
        ).toHaveBeenCalledWith(
          {
            userId:
              USER_ID,

            revokedAt:
              DELETED_AT,

            reason:
              "account_deleted",
          },
          EXECUTOR
        );
      }
    );

    it(
      "rejects deletion when the authenticated account no longer exists",
      async () => {
        const softDeleteUser =
          vi.fn();

        const revokeAllUserSessions =
          vi.fn();

        const service =
          createAccountDeletionService({
            findUserById:
              vi.fn()
                .mockResolvedValue(
                  null
                ),

            softDeleteUser,

            revokeAllUserSessions,

            runDatabaseTransaction:
              vi.fn(
                async operation =>
                  await operation(
                    EXECUTOR
                  )
              ),

            now:
              () => DELETED_AT,
          });

        await expect(
          service.deleteAccount({
            userId:
              USER_ID,
          })
        ).rejects.toBeInstanceOf(
          AuthenticationSessionInvalidError
        );

        expect(
          softDeleteUser
        ).not.toHaveBeenCalled();

        expect(
          revokeAllUserSessions
        ).not.toHaveBeenCalled();
      }
    );

    it(
      "rejects deletion when optimistic concurrency prevents the soft delete",
      async () => {
        const revokeAllUserSessions =
          vi.fn();

        const service =
          createAccountDeletionService({
            findUserById:
              vi.fn()
                .mockResolvedValue(
                  ACTIVE_ACCOUNT
                ),

            softDeleteUser:
              vi.fn()
                .mockResolvedValue(
                  null
                ),

            revokeAllUserSessions,

            runDatabaseTransaction:
              vi.fn(
                async operation =>
                  await operation(
                    EXECUTOR
                  )
              ),

            now:
              () => DELETED_AT,
          });

        await expect(
          service.deleteAccount({
            userId:
              USER_ID,
          })
        ).rejects.toBeInstanceOf(
          AuthenticationSessionInvalidError
        );

        expect(
          revokeAllUserSessions
        ).not.toHaveBeenCalled();
      }
    );
  }
);
