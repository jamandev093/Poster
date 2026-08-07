import {
  runDatabaseTransaction,
  type DatabaseQueryExecutor,
} from "../../database/index.js";

import {
  AuthenticationSessionInvalidError,
} from "../../domains/authentication/authentication.errors.js";

import {
  findUserById,
  revokeAllUserSessions,
  softDeleteUser,
  type RevokeAllUserSessionsInput,
  type SoftDeleteUserInput,
  type UserIdentityRecord,
} from "../../domains/identity/index.js";

import type {
  DeleteAccountInput,
  DeleteAccountResult,
} from "./account-deletion.types.js";

const ACCOUNT_DELETED_SESSION_REVOCATION_REASON =
  "account_deleted";

type FindUserByIdOperation =
  (
    userId: string,
    executor?: DatabaseQueryExecutor
  ) => Promise<UserIdentityRecord | null>;

type SoftDeleteUserOperation =
  (
    input: SoftDeleteUserInput,
    executor?: DatabaseQueryExecutor
  ) => Promise<UserIdentityRecord | null>;

type RevokeAllUserSessionsOperation =
  (
    input: RevokeAllUserSessionsInput,
    executor?: DatabaseQueryExecutor
  ) => Promise<number>;

type RunDatabaseTransactionOperation =
  <T>(
    operation:
      (
        executor: DatabaseQueryExecutor
      ) => Promise<T>
  ) => Promise<T>;

export interface AccountDeletionService {
  deleteAccount:
    (
      input: DeleteAccountInput
    ) => Promise<DeleteAccountResult>;
}

export interface AccountDeletionServiceDependencies {
  findUserById?:
    FindUserByIdOperation;

  softDeleteUser?:
    SoftDeleteUserOperation;

  revokeAllUserSessions?:
    RevokeAllUserSessionsOperation;

  runDatabaseTransaction?:
    RunDatabaseTransactionOperation;

  now?:
    () => Date;
}

export function createAccountDeletionService(
  dependencies:
    AccountDeletionServiceDependencies =
    {}
): AccountDeletionService {
  const findUserByIdOperation =
    dependencies.findUserById ??
    findUserById;

  const softDeleteUserOperation =
    dependencies.softDeleteUser ??
    softDeleteUser;

  const revokeAllUserSessionsOperation =
    dependencies.revokeAllUserSessions ??
    revokeAllUserSessions;

  const runTransaction =
    dependencies.runDatabaseTransaction ??
    runDatabaseTransaction;

  const now =
    dependencies.now ??
    (() => new Date());

  return {
    deleteAccount:
      async (
        input
      ) => {
        const deletedAt =
          now();

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
                "The authenticated account could not be found."
              );
            }

            const deletedAccount =
              await softDeleteUserOperation(
                {
                  userId:
                    account.id,

                  expectedRowVersion:
                    account.rowVersion,

                  deletedAt,
                },
                executor
              );

            if (
              !deletedAccount
            ) {
              throw new AuthenticationSessionInvalidError(
                "The authenticated account could not be deleted."
              );
            }

            const revokedSessionCount =
              await revokeAllUserSessionsOperation(
                {
                  userId:
                    account.id,

                  revokedAt:
                    deletedAt,

                  reason:
                    ACCOUNT_DELETED_SESSION_REVOCATION_REASON,
                },
                executor
              );

            return {
              account:
                deletedAccount,

              deletedAt,

              revokedSessionCount,
            };
          }
        );
      },
  };
}
