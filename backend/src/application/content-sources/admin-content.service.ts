import {
  runDatabaseTransaction,
} from "../../database/database.transaction.js";

import {
  appendContentAuditEvent,
  findDiscoveryContentById,
  listContentAuditEvents,
  listDiscoveryContent,
  removeDiscoveryContent,
  restoreDiscoveryContent,
  type ContentRemovalReason,
  type ContentSourceAuditEventRecord,
  type DiscoveryContentRecord,
} from "../../domains/content-sources/index.js";

import {
  ContentSourceApplicationError,
} from "./content-source.errors.js";

export interface AdminContentDetails {
  record:
    DiscoveryContentRecord;

  audit:
    ContentSourceAuditEventRecord[];
}

export interface RemoveAdminContentInput {
  contentId: string;

  expectedRowVersion: string;

  reason:
    ContentRemovalReason;

  note?:
    string |
    null;

  copyrightCaseId?:
    string |
    null;

  copyrightClaimant?:
    string |
    null;

  preventReimport: boolean;

  actorUserId:
    string |
    null;

  actorLabel: string;
}

export interface RestoreAdminContentInput {
  contentId: string;

  expectedRowVersion: string;

  actorUserId:
    string |
    null;

  actorLabel: string;
}

export interface AdminContentService {
  list:
    () => Promise<
      DiscoveryContentRecord[]
    >;

  getById:
    (
      contentId: string
    ) => Promise<
      AdminContentDetails
    >;

  remove:
    (
      input:
        RemoveAdminContentInput
    ) => Promise<
      AdminContentDetails
    >;

  restore:
    (
      input:
        RestoreAdminContentInput
    ) => Promise<
      AdminContentDetails
    >;
}

export interface AdminContentServiceDependencies {
  listContent:
    typeof listDiscoveryContent;

  findContent:
    typeof findDiscoveryContentById;

  listAudit:
    typeof listContentAuditEvents;

  removeContent:
    typeof removeDiscoveryContent;

  restoreContent:
    typeof restoreDiscoveryContent;

  appendAudit:
    typeof appendContentAuditEvent;

  now:
    () => Date;
}

export interface CreateAdminContentServiceOptions {
  dependencies?:
    Partial<
      AdminContentServiceDependencies
    >;
}

export function createAdminContentService(
  options:
    CreateAdminContentServiceOptions =
    {}
): AdminContentService {
  const dependencies:
    AdminContentServiceDependencies = {
    listContent:
      listDiscoveryContent,

    findContent:
      findDiscoveryContentById,

    listAudit:
      listContentAuditEvents,

    removeContent:
      removeDiscoveryContent,

    restoreContent:
      restoreDiscoveryContent,

    appendAudit:
      appendContentAuditEvent,

    now:
      () => new Date(),

    ...options.dependencies,
  };

  const getRequired =
    async (
      contentId: string
    ): Promise<
      DiscoveryContentRecord
    > => {
      const record =
        await dependencies
          .findContent(
            contentId
          );

      if (
        !record
      ) {
        throw new ContentSourceApplicationError(
          "CONTENT_NOT_FOUND",
          "Discovery content was not found."
        );
      }

      return record;
    };

  const getDetails =
    async (
      record:
        DiscoveryContentRecord
    ): Promise<
      AdminContentDetails
    > => ({
      record,

      audit:
        await dependencies
          .listAudit(
            record.id
          ),
    });

  return {
    list:
      async () =>
        await dependencies
          .listContent(),

    getById:
      async contentId =>
        await getDetails(
          await getRequired(
            contentId
          )
        ),

    remove:
      async input => {
        const removedAt =
          dependencies.now();

        const record =
          await runDatabaseTransaction(
            async executor => {
              const current =
                await dependencies
                  .findContent(
                    input.contentId,
                    executor
                  );

              if (
                !current
              ) {
                throw new ContentSourceApplicationError(
                  "CONTENT_NOT_FOUND",
                  "Discovery content was not found."
                );
              }

              if (
                current.status !==
                "active"
              ) {
                throw new ContentSourceApplicationError(
                  "CONTENT_STATE_CONFLICT",
                  "Only active content can be removed."
                );
              }

              const updated =
                await dependencies
                  .removeContent(
                    {
                      contentId:
                        input.contentId,

                      expectedRowVersion:
                        input.expectedRowVersion,

                      reason:
                        input.reason,

                      note:
                        input.note ??
                        null,

                      copyrightCaseId:
                        input.copyrightCaseId ??
                        null,

                      copyrightClaimant:
                        input.copyrightClaimant ??
                        null,

                      preventReimport:
                        input.preventReimport,

                      removedAt,
                    },
                    executor
                  );

              if (
                !updated
              ) {
                throw new ContentSourceApplicationError(
                  "CONTENT_VERSION_CONFLICT",
                  "The content changed before removal completed. Refresh and retry."
                );
              }

              await dependencies
                .appendAudit(
                  {
                    contentId:
                      updated.id,

                    action:
                      input.preventReimport
                        ? "Removed from Poster and prevented from re-import"
                        : "Removed from Poster",

                    actorUserId:
                      input.actorUserId,

                    actorLabel:
                      input.actorLabel,

                    metadata: {
                      previousStatus:
                        current.status,

                      status:
                        updated.status,

                      reason:
                        input.reason,

                      preventReimport:
                        input.preventReimport,

                      copyrightCaseId:
                        updated.copyrightCaseId,

                      copyrightClaimant:
                        updated.copyrightClaimant,
                    },

                    occurredAt:
                      removedAt,
                  },
                  executor
                );

              return updated;
            }
          );

        return await getDetails(
          record
        );
      },

    restore:
      async input => {
        const restoredAt =
          dependencies.now();

        const record =
          await runDatabaseTransaction(
            async executor => {
              const current =
                await dependencies
                  .findContent(
                    input.contentId,
                    executor
                  );

              if (
                !current
              ) {
                throw new ContentSourceApplicationError(
                  "CONTENT_NOT_FOUND",
                  "Discovery content was not found."
                );
              }

              if (
                current.status !==
                "removed"
              ) {
                throw new ContentSourceApplicationError(
                  "CONTENT_STATE_CONFLICT",
                  "Only removed content can be restored."
                );
              }

              if (
                current.removalReason ===
                  "copyright" ||
                current.preventReimport
              ) {
                throw new ContentSourceApplicationError(
                  "COPYRIGHT_RESTORE_BLOCKED",
                  "Copyright or prevent-reimport content cannot be restored from Content management."
                );
              }

              const updated =
                await dependencies
                  .restoreContent(
                    {
                      contentId:
                        input.contentId,

                      expectedRowVersion:
                        input.expectedRowVersion,
                    },
                    executor
                  );

              if (
                !updated
              ) {
                throw new ContentSourceApplicationError(
                  "CONTENT_VERSION_CONFLICT",
                  "The content changed before restoration completed. Refresh and retry."
                );
              }

              await dependencies
                .appendAudit(
                  {
                    contentId:
                      updated.id,

                    action:
                      "Content restored to Poster",

                    actorUserId:
                      input.actorUserId,

                    actorLabel:
                      input.actorLabel,

                    metadata: {
                      previousStatus:
                        current.status,

                      status:
                        updated.status,
                    },

                    occurredAt:
                      restoredAt,
                  },
                  executor
                );

              return updated;
            }
          );

        return await getDetails(
          record
        );
      },
  };
}