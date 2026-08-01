import {
  runDatabaseTransaction,
} from "../../database/database.transaction.js";

import {
  appendSourceAuditEvent,
  findContentSourceById,
  listContentSources,
  listSourceAuditEvents,
  updateContentSourceLifecycle,
  type ContentSourceAuditEventRecord,
  type ContentSourceRecord,
  type ContentSourceStatus,
} from "../../domains/content-sources/index.js";

import {
  ContentSourceApplicationError,
} from "./content-source.errors.js";

export interface AdminSourceListItem
  extends ContentSourceRecord {
  activeContentCount: number;
}

export interface AdminSourceDetails {
  source:
    AdminSourceListItem;

  audit:
    ContentSourceAuditEventRecord[];
}

export interface AdminSourceService {
  list:
    () => Promise<
      AdminSourceListItem[]
    >;

  getById:
    (
      sourceId: string
    ) => Promise<
      AdminSourceDetails
    >;

  pause:
    (
      input:
        ChangeSourceLifecycleInput
    ) => Promise<
      AdminSourceListItem
    >;

  enable:
    (
      input:
        ChangeSourceLifecycleInput
    ) => Promise<
      AdminSourceListItem
    >;

  block:
    (
      input:
        BlockSourceInput
    ) => Promise<
      AdminSourceListItem
    >;

  unblock:
    (
      input:
        ChangeSourceLifecycleInput
    ) => Promise<
      AdminSourceListItem
    >;
}

export interface ChangeSourceLifecycleInput {
  sourceId: string;

  expectedRowVersion: string;

  actorUserId:
    string |
    null;

  actorLabel: string;
}

export interface BlockSourceInput
  extends ChangeSourceLifecycleInput {
  removeExistingContent: boolean;
}

export interface AdminSourceServiceDependencies {
  listSources:
    typeof listContentSources;

  findSource:
    typeof findContentSourceById;

  updateLifecycle:
    typeof updateContentSourceLifecycle;

  appendAudit:
    typeof appendSourceAuditEvent;

  listAudit:
    typeof listSourceAuditEvents;

  countActiveContent:
    (
      sourceId: string
    ) => Promise<number>;

  removeActiveContent:
    (
      input: {
        sourceId: string;

        actorUserId:
          string |
          null;

        actorLabel: string;

        removedAt: Date;
      },
      executor: Parameters<
        typeof updateContentSourceLifecycle
      >[1]
    ) => Promise<number>;

  now:
    () => Date;
}

export interface CreateAdminSourceServiceOptions {
  dependencies?:
    Partial<
      AdminSourceServiceDependencies
    >;
}

async function defaultCountActiveContent(
  sourceId: string
): Promise<number> {
  const {
    executeDatabaseQuery,
  } =
    await import(
      "../../database/database.pool.js"
    );

  const result =
    await executeDatabaseQuery(
      `
        SELECT
          COUNT(*)::integer
            AS count
        FROM app.discovery_content
        WHERE
          source_id = $1::uuid
          AND status = 'active'
      `,
      [
        sourceId,
      ]
    );

  const row =
    result.rows[0] as
      | {
          count:
            number |
            string;
        }
      | undefined;

  if (
    !row
  ) {
    return 0;
  }

  return Number(
    row.count
  );
}

async function defaultRemoveActiveContent(
  input: {
    sourceId: string;

    actorUserId:
      string |
      null;

    actorLabel: string;

    removedAt: Date;
  },
  executor:
    Parameters<
      typeof updateContentSourceLifecycle
    >[1]
): Promise<number> {
  const {
    executeDatabaseQuery,
  } =
    await import(
      "../../database/database.pool.js"
    );

  const result =
    await executeDatabaseQuery(
      `
        WITH removed_content AS (
          UPDATE app.discovery_content
          SET
            status = 'removed',
            removed_at = $2,
            removal_reason =
              'publisher_request',
            removal_note =
              'Removed because the source was blocked.',
            prevent_reimport = true
          WHERE
            source_id = $1::uuid
            AND status = 'active'
          RETURNING id
        ),

        audit_events AS (
          INSERT INTO app.content_source_audit_events (
            entity_type,
            content_id,
            action,
            actor_user_id,
            actor_label,
            metadata,
            occurred_at
          )
          SELECT
            'content',
            removed_content.id,
            'Removed because source was blocked',
            $3::uuid,
            $4,
            jsonb_build_object(
              'sourceId',
              $1::text,
              'preventReimport',
              true
            ),
            $2
          FROM removed_content
          RETURNING id
        )

        SELECT
          COUNT(*)::integer
            AS count
        FROM removed_content
      `,
      [
        input.sourceId,
        input.removedAt,
        input.actorUserId,
        input.actorLabel,
      ],
      executor
    );

  const row =
    result.rows[0] as
      | {
          count:
            number |
            string;
        }
      | undefined;

  return row
    ? Number(
        row.count
      )
    : 0;
}

function assertSourceTransition(
  current:
    ContentSourceStatus,
  target:
    ContentSourceStatus
): void {
  const allowed =
    (
      current === "active" &&
      (
        target === "paused" ||
        target === "blocked"
      )
    ) ||
    (
      current === "paused" &&
      (
        target === "active" ||
        target === "blocked"
      )
    ) ||
    (
      current === "blocked" &&
      target === "active"
    );

  if (
    !allowed
  ) {
    throw new ContentSourceApplicationError(
      "SOURCE_STATE_CONFLICT",
      `Source cannot transition from ${current} to ${target}.`
    );
  }
}

export function createAdminSourceService(
  options:
    CreateAdminSourceServiceOptions =
    {}
): AdminSourceService {
  const dependencies:
    AdminSourceServiceDependencies = {
    listSources:
      listContentSources,

    findSource:
      findContentSourceById,

    updateLifecycle:
      updateContentSourceLifecycle,

    appendAudit:
      appendSourceAuditEvent,

    listAudit:
      listSourceAuditEvents,

    countActiveContent:
      defaultCountActiveContent,

    removeActiveContent:
      defaultRemoveActiveContent,

    now:
      () => new Date(),

    ...options.dependencies,
  };

  const decorate =
    async (
      source:
        ContentSourceRecord
    ): Promise<
      AdminSourceListItem
    > => ({
      ...source,

      activeContentCount:
        await dependencies
          .countActiveContent(
            source.id
          ),
    });

  const getExistingSource =
    async (
      sourceId: string
    ): Promise<
      ContentSourceRecord
    > => {
      const source =
        await dependencies
          .findSource(
            sourceId
          );

      if (
        !source
      ) {
        throw new ContentSourceApplicationError(
          "SOURCE_NOT_FOUND",
          "Content source was not found."
        );
      }

      return source;
    };

  const changeLifecycle =
    async (
      input:
        ChangeSourceLifecycleInput,
      targetStatus:
        ContentSourceStatus,
      action: string,
      metadata:
        Record<
          string,
          unknown
        > =
        {}
    ): Promise<
      AdminSourceListItem
    > => {
      const changedAt =
        dependencies.now();

      const source =
        await runDatabaseTransaction(
          async executor => {
            const current =
              await dependencies
                .findSource(
                  input.sourceId,
                  executor
                );

            if (
              !current
            ) {
              throw new ContentSourceApplicationError(
                "SOURCE_NOT_FOUND",
                "Content source was not found."
              );
            }

            assertSourceTransition(
              current.status,
              targetStatus
            );

            const updated =
              await dependencies
                .updateLifecycle(
                  {
                    sourceId:
                      input.sourceId,

                    expectedRowVersion:
                      input.expectedRowVersion,

                    status:
                      targetStatus,

                    changedAt,
                  },
                  executor
                );

            if (
              !updated
            ) {
              throw new ContentSourceApplicationError(
                "SOURCE_VERSION_CONFLICT",
                "The source changed before this action completed. Refresh and retry."
              );
            }

            await dependencies
              .appendAudit(
                {
                  sourceId:
                    updated.id,

                  action,

                  actorUserId:
                    input.actorUserId,

                  actorLabel:
                    input.actorLabel,

                  metadata: {
                    previousStatus:
                      current.status,

                    status:
                      targetStatus,

                    ...metadata,
                  },

                  occurredAt:
                    changedAt,
                },
                executor
              );

            return updated;
          }
        );

      return await decorate(
        source
      );
    };

  return {
    list:
      async () => {
        const sources =
          await dependencies
            .listSources();

        return await Promise.all(
          sources.map(
            decorate
          )
        );
      },

    getById:
      async sourceId => {
        const source =
          await decorate(
            await getExistingSource(
              sourceId
            )
          );

        return {
          source,

          audit:
            await dependencies
              .listAudit(
                source.id
              ),
        };
      },

    pause:
      async input =>
        await changeLifecycle(
          input,
          "paused",
          "Source paused"
        ),

    enable:
      async input =>
        await changeLifecycle(
          input,
          "active",
          "Source enabled"
        ),

    unblock:
      async input =>
        await changeLifecycle(
          input,
          "active",
          "Source unblocked and enabled"
        ),

    block:
      async input => {
        const blockedAt =
          dependencies.now();

        const result =
          await runDatabaseTransaction(
            async executor => {
              const current =
                await dependencies
                  .findSource(
                    input.sourceId,
                    executor
                  );

              if (
                !current
              ) {
                throw new ContentSourceApplicationError(
                  "SOURCE_NOT_FOUND",
                  "Content source was not found."
                );
              }

              assertSourceTransition(
                current.status,
                "blocked"
              );

              const updated =
                await dependencies
                  .updateLifecycle(
                    {
                      sourceId:
                        input.sourceId,

                      expectedRowVersion:
                        input.expectedRowVersion,

                      status:
                        "blocked",

                      changedAt:
                        blockedAt,
                    },
                    executor
                  );

              if (
                !updated
              ) {
                throw new ContentSourceApplicationError(
                  "SOURCE_VERSION_CONFLICT",
                  "The source changed before blocking completed. Refresh and retry."
                );
              }

              const removedContentCount =
                input.removeExistingContent
                  ? await dependencies
                      .removeActiveContent(
                        {
                          sourceId:
                            updated.id,

                          actorUserId:
                            input.actorUserId,

                          actorLabel:
                            input.actorLabel,

                          removedAt:
                            blockedAt,
                        },
                        executor
                      )
                  : 0;

              await dependencies
                .appendAudit(
                  {
                    sourceId:
                      updated.id,

                    action:
                      input.removeExistingContent
                        ? "Source blocked and existing content removed"
                        : "Source blocked",

                    actorUserId:
                      input.actorUserId,

                    actorLabel:
                      input.actorLabel,

                    metadata: {
                      previousStatus:
                        current.status,

                      status:
                        "blocked",

                      removeExistingContent:
                        input.removeExistingContent,

                      removedContentCount,
                    },

                    occurredAt:
                      blockedAt,
                  },
                  executor
                );

              return updated;
            }
          );

        return await decorate(
          result
        );
      },
  };
}