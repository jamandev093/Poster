import {
  runDatabaseTransaction,
} from "../../database/database.transaction.js";

import {
  AuthenticationConcurrencyError,
} from "../../domains/authentication/authentication.errors.js";

import {
  createAdminProfileAuditEntry,
  ensureAdminProfile,
  findAdminProfile,
  updateAdminProfile,
} from "../../domains/admin-profile/admin-profile.repository.js";

import type {
  AdminProfileRecord,
  UpdateAdminProfileInput,
} from "../../domains/admin-profile/admin-profile.types.js";

export interface AdminProfileService {
  get(
    userId: string
  ): Promise<AdminProfileRecord>;

  update(
    input:
      UpdateAdminProfileInput
  ): Promise<AdminProfileRecord>;
}

export function createAdminProfileService():
  AdminProfileService {
  return {
    async get(
      userId
    ) {
      return await runDatabaseTransaction(
        async (
          client
        ) => {
          await ensureAdminProfile(
            userId,
            client
          );

          const profile =
            await findAdminProfile(
              userId,
              client
            );

          if (!profile) {
            throw new Error(
              "The authenticated Admin profile could not be loaded."
            );
          }

          return profile;
        }
      );
    },

    async update(
      input
    ) {
      return await runDatabaseTransaction(
        async (
          client
        ) => {
          await ensureAdminProfile(
            input.userId,
            client
          );

          const current =
            await findAdminProfile(
              input.userId,
              client
            );

          if (!current) {
            throw new Error(
              "The authenticated Admin profile could not be loaded."
            );
          }

          if (
            current.rowVersion !==
            input.expectedRowVersion
          ) {
            throw new AuthenticationConcurrencyError();
          }

          const updated =
            await updateAdminProfile(
              input,
              client
            );

          if (!updated) {
            throw new AuthenticationConcurrencyError();
          }

          await createAdminProfileAuditEntry(
            {
              actorUserId:
                input.actorUserId,

              profileUserId:
                input.userId,

              previousRowVersion:
                current.rowVersion,

              nextRowVersion:
                updated.rowVersion,
            },
            client
          );

          return updated;
        }
      );
    },
  };
}
