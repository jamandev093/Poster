import {
  type DatabaseQueryExecutor,
  runDatabaseTransaction,
} from "../../database/index.js";

import {
  AuthenticationSessionInvalidError,
} from "../../domains/authentication/authentication.errors.js";

import {
  findUserById,
  updateUserProfile,
  type UpdateUserProfileInput,
  type UserIdentityRecord,
} from "../../domains/identity/index.js";

import type {
  AccountProfileResponse,
  GetAccountProfileInput,
  UpdateAccountProfileInput,
} from "./account-profile.types.js";

type FindUserByIdOperation =
  (
    userId: string,
    executor?: DatabaseQueryExecutor
  ) => Promise<UserIdentityRecord | null>;

type UpdateUserProfileOperation =
  (
    input: UpdateUserProfileInput,
    executor?: DatabaseQueryExecutor
  ) => Promise<UserIdentityRecord | null>;

type RunDatabaseTransactionOperation =
  <T>(
    operation:
      (
        executor: DatabaseQueryExecutor
      ) => Promise<T>
  ) => Promise<T>;

export interface AccountProfileService {
  getProfile:
    (
      input: GetAccountProfileInput
    ) => Promise<AccountProfileResponse>;

  updateProfile:
    (
      input: UpdateAccountProfileInput
    ) => Promise<AccountProfileResponse>;
}

export interface AccountProfileServiceDependencies {
  findUserById?:
    FindUserByIdOperation;

  updateUserProfile?:
    UpdateUserProfileOperation;

  runDatabaseTransaction?:
    RunDatabaseTransactionOperation;
}

function mapAccountProfile(
  account: UserIdentityRecord
): AccountProfileResponse {
  return {
    account: {
      id:
        account.id,

      email:
        account.email,

      fullName:
        account.fullName,

      status:
        account.status,

      emailVerifiedAt:
        account.emailVerifiedAt
          ? account.emailVerifiedAt.toISOString()
          : null,

      createdAt:
        account.createdAt.toISOString(),

      updatedAt:
        account.updatedAt.toISOString(),

      rowVersion:
        account.rowVersion,
    },
  };
}

function normalizeFullName(
  value: string
): string {
  return value
    .trim()
    .replace(
      /\s+/g,
      " "
    );
}

export function createAccountProfileService(
  dependencies:
    AccountProfileServiceDependencies =
    {}
): AccountProfileService {
  const findUserByIdOperation =
    dependencies.findUserById ??
    findUserById;

  const updateUserProfileOperation =
    dependencies.updateUserProfile ??
    updateUserProfile;

  const runTransaction =
    dependencies.runDatabaseTransaction ??
    runDatabaseTransaction;

  return {
    getProfile:
      async (
        input
      ) => {
        const account =
          await findUserByIdOperation(
            input.userId
          );

        if (
          !account
        ) {
          throw new AuthenticationSessionInvalidError(
            "The authenticated account profile could not be found."
          );
        }

        return mapAccountProfile(
          account
        );
      },

    updateProfile:
      async (
        input
      ) => {
        const fullName =
          normalizeFullName(
            input.fullName
          );

        return await runTransaction(
          async (
            executor
          ) => {
            const account =
              await findUserByIdOperation(
                input.userId,
                executor
              );

            if (
              !account
            ) {
              throw new AuthenticationSessionInvalidError(
                "The authenticated account profile could not be found."
              );
            }

            const updatedAccount =
              await updateUserProfileOperation(
                {
                  userId:
                    account.id,

                  expectedRowVersion:
                    account.rowVersion,

                  fullName,
                },
                executor
              );

            if (
              !updatedAccount
            ) {
              throw new AuthenticationSessionInvalidError(
                "The authenticated account profile could not be updated."
              );
            }

            return mapAccountProfile(
              updatedAccount
            );
          }
        );
      },
  };
}
