import {
  runDatabaseTransaction,
} from "../../database/database.transaction.js";

import type {
  DatabaseQueryExecutor,
} from "../../database/database.pool.js";

import {
  findBusinessIdentityByKey,
  upsertBusinessIdentity,
  validateBusinessIdentityDraft,
  type BusinessIdentityDraftInput,
  type BusinessIdentityRecord,
  type BusinessIdentityUpsertResult,
} from "../../domains/business-identity/index.js";

import {
  createAdminAuditEntry,
  type JsonObject as AuditJsonObject,
} from "../../domains/monetization/index.js";

import {
  BusinessIdentityError,
} from "./business-identity.errors.js";

export interface UpdateAdminBusinessIdentityInput
  extends BusinessIdentityDraftInput {
  actorUserId:
    string;

  expectedRowVersion:
    string;
}

export interface AdminBusinessIdentityService {
  getOfficial:
    () => Promise<
      BusinessIdentityRecord
    >;

  updateOfficial:
    (
      input:
        UpdateAdminBusinessIdentityInput
    ) => Promise<
      BusinessIdentityRecord
    >;
}

export interface AdminBusinessIdentityServiceDependencies {
  findIdentity:
    typeof findBusinessIdentityByKey;

  upsertIdentity:
    typeof upsertBusinessIdentity;

  createAuditEntry:
    typeof createAdminAuditEntry;

  runTransaction:
    <TResult>(
      operation:
        (
          executor:
            DatabaseQueryExecutor
        ) => Promise<TResult>
    ) => Promise<TResult>;

  now:
    () => Date;
}

export interface CreateAdminBusinessIdentityServiceOptions {
  dependencies?:
    Partial<
      AdminBusinessIdentityServiceDependencies
    >;
}

function normalizeNullableText(
  value:
    string | null
): string | null {
  const trimmed =
    value?.trim() ??
    "";

  return trimmed.length > 0
    ? trimmed
    : null;
}

function normalizeDraft(
  input:
    BusinessIdentityDraftInput
): BusinessIdentityDraftInput {
  return {
    publicBrandName:
      input.publicBrandName.trim(),

    legalBusinessName:
      normalizeNullableText(
        input.legalBusinessName
      ),

    websiteUrl:
      input.websiteUrl.trim(),

    officialBusinessEmail:
      input.officialBusinessEmail.trim(),

    supportEmail:
      normalizeNullableText(
        input.supportEmail
      ),

    publisherRelationsEmail:
      normalizeNullableText(
        input.publisherRelationsEmail
      ),

    advertisingEmail:
      normalizeNullableText(
        input.advertisingEmail
      ),

    copyrightEmail:
      normalizeNullableText(
        input.copyrightEmail
      ),

    signalUrl:
      normalizeNullableText(
        input.signalUrl
      ),

    signalLabel:
      normalizeNullableText(
        input.signalLabel
      ),

    copyrightPortalUrl:
      normalizeNullableText(
        input.copyrightPortalUrl
      ),

    clientPortalUrl:
      normalizeNullableText(
        input.clientPortalUrl
      ),

    socialLinks:
      input.socialLinks,
  };
}

function validateDraftOrThrow(
  input:
    BusinessIdentityDraftInput
): BusinessIdentityDraftInput {
  const normalized =
    normalizeDraft(
      input
    );

  const issues =
    validateBusinessIdentityDraft(
      normalized
    );

  if (
    issues.length > 0
  ) {
    throw new BusinessIdentityError({
      code:
        "BUSINESS_IDENTITY_INVALID",

      message:
        "The official business identity is invalid.",

      statusCode:
        400,

      issues,
    });
  }

  return normalized;
}

function requireUpdatedResult(
  result:
    BusinessIdentityUpsertResult
): BusinessIdentityRecord {
  if (
    result.status ===
    "conflict"
  ) {
    throw new BusinessIdentityError({
      code:
        "BUSINESS_IDENTITY_VERSION_CONFLICT",

      message:
        "The official business identity was changed by another admin. Refresh and try again.",

      statusCode:
        409,
    });
  }

  return result.identity;
}

export function createAdminBusinessIdentityService(
  options:
    CreateAdminBusinessIdentityServiceOptions =
    {}
): AdminBusinessIdentityService {
  const dependencies:
    AdminBusinessIdentityServiceDependencies = {
    findIdentity:
      findBusinessIdentityByKey,

    upsertIdentity:
      upsertBusinessIdentity,

    createAuditEntry:
      createAdminAuditEntry,

    runTransaction:
      runDatabaseTransaction,

    now:
      () =>
        new Date(),

    ...options.dependencies,
  };

  return {
    async getOfficial() {
      const identity =
        await dependencies.findIdentity(
          "official"
        );

      if (
        !identity
      ) {
        throw new BusinessIdentityError({
          code:
            "BUSINESS_IDENTITY_NOT_FOUND",

          message:
            "The official business identity has not been configured.",

          statusCode:
            404,
        });
      }

      return identity;
    },

    async updateOfficial(
      input
    ) {
      const normalized =
        validateDraftOrThrow(
          input
        );

      return await dependencies.runTransaction(
        async executor => {
          const result =
            await dependencies.upsertIdentity(
              {
                ...normalized,

                key:
                  "official",

                updatedByUserId:
                  input.actorUserId,

                now:
                  dependencies.now(),

                expectedRowVersion:
                  input.expectedRowVersion,
              },
              executor
            );

          const identity =
            requireUpdatedResult(
              result
            );

          await dependencies.createAuditEntry(
            {
              actorUserId:
                input.actorUserId,

              action:
                "operations.business_identity.updated",

              entityType:
                "business_identity",

              entityId:
                identity.key,

              metadata: {
                publicBrandName:
                  identity.publicBrandName,

                websiteUrl:
                  identity.websiteUrl,

                officialBusinessEmail:
                  identity.officialBusinessEmail,

                supportEmail:
                  identity.supportEmail,

                publisherRelationsEmail:
                  identity.publisherRelationsEmail,

                advertisingEmail:
                  identity.advertisingEmail,

                copyrightEmail:
                  identity.copyrightEmail,

                signalUrl:
                  identity.signalUrl,

                copyrightPortalUrl:
                  identity.copyrightPortalUrl,

                clientPortalUrl:
                  identity.clientPortalUrl,
              } satisfies AuditJsonObject,

              occurredAt:
                dependencies.now(),
            },
            executor
          );

          return identity;
        }
      );
    },
  };
}