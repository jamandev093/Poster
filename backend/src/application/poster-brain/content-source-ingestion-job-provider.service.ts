import type {
  PosterBrainRssSource,
} from "../../domains/poster-brain/index.js";

import type {
  PosterBrainSourceFeedBatchJob,
} from "./source-feed-batch-runner.service.js";

import type {
  PosterBrainContentSourceIngestionJobProvider,
  PosterBrainContentSourceIngestionJobProviderInput,
} from "./content-source-ingestion-run-executor.service.js";

export interface PosterBrainContentSourceIngestionJobProviderQueryResult<Row> {
  readonly rows: readonly Row[];
}

export interface PosterBrainContentSourceIngestionJobProviderQueryExecutor {
  query<Row = Record<string, unknown>>(
    text: string,
    values?: readonly unknown[]
  ): Promise<PosterBrainContentSourceIngestionJobProviderQueryResult<Row>>;
}

export interface PosterBrainContentSourceIngestionJobProviderDependencies {
  readonly executor: PosterBrainContentSourceIngestionJobProviderQueryExecutor;
}

interface PosterBrainContentSourceIngestionJobProviderRow {
  readonly sourceKey: string;
  readonly displayName: string;
  readonly feedUrl: string;
  readonly status: "active";
  readonly priority: number;
  readonly lastFetchedAt: string | null;
  readonly nextAllowedAt: string | null;
}

function normalizePriority(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.max(
    0,
    Math.min(
      100,
      Math.round(value)
    )
  );
}

function mapRowToJob(input: {
  readonly row: PosterBrainContentSourceIngestionJobProviderRow;
  readonly discoveredAt: string;
}): PosterBrainSourceFeedBatchJob {
  const source =
    {
      sourceKey:
        input.row.sourceKey,

      displayName:
        input.row.displayName,

      feedUrl:
        input.row.feedUrl,

      status:
        input.row.status,

      priority:
        normalizePriority(input.row.priority),

      lastFetchedAt:
        input.row.lastFetchedAt,

      nextAllowedAt:
        input.row.nextAllowedAt,
    } as unknown as PosterBrainRssSource;

  return {
    source,
    discoveredAt:
      input.discoveredAt,
  };
}

function createQueryValues(
  input: PosterBrainContentSourceIngestionJobProviderInput
): readonly unknown[] {
  return [
    input.sourceKeys ?? null,
    input.maxSources,
    input.force,
    input.requestedAt,
  ];
}

export function createPosterBrainContentSourceIngestionJobProvider(
  dependencies: PosterBrainContentSourceIngestionJobProviderDependencies
): PosterBrainContentSourceIngestionJobProvider {
  return {
    async listJobs(input) {
      const result =
        await dependencies
          .executor
          .query<PosterBrainContentSourceIngestionJobProviderRow>(
            `
              WITH source_rows AS (
                SELECT
                  to_jsonb(discovery_sources.*) AS source_row
                FROM app.discovery_sources
              ),
              normalized_sources AS (
                SELECT
                  COALESCE(
                    source_row ->> 'sourceKey',
                    source_row ->> 'source_key',
                    source_row ->> 'key',
                    source_row ->> 'id'
                  ) AS "sourceKey",

                  COALESCE(
                    source_row ->> 'displayName',
                    source_row ->> 'display_name',
                    source_row ->> 'name',
                    source_row ->> 'source_name',
                    source_row ->> 'source_key',
                    source_row ->> 'id'
                  ) AS "displayName",

                  COALESCE(
                    source_row ->> 'feedUrl',
                    source_row ->> 'feed_url',
                    source_row ->> 'rss_url',
                    source_row ->> 'url'
                  ) AS "feedUrl",

                  CASE COALESCE(
                    source_row ->> 'status',
                    source_row ->> 'source_status',
                    source_row ->> 'ingestion_status'
                  )
                    WHEN 'active' THEN 'active'
                    ELSE 'inactive'
                  END AS "status",

                  CASE
                    WHEN COALESCE(
                      source_row ->> 'priority',
                      source_row ->> 'ingestion_priority',
                      '0'
                    ) ~ '^-?[0-9]+$'
                    THEN COALESCE(
                      source_row ->> 'priority',
                      source_row ->> 'ingestion_priority',
                      '0'
                    )::integer
                    ELSE 0
                  END AS "priority",

                  COALESCE(
                    source_row ->> 'lastFetchedAt',
                    source_row ->> 'last_fetched_at',
                    source_row ->> 'last_successful_fetch_at'
                  ) AS "lastFetchedAt",

                  COALESCE(
                    source_row ->> 'nextAllowedAt',
                    source_row ->> 'next_allowed_at',
                    source_row ->> 'next_allowed_fetch_at'
                  ) AS "nextAllowedAt"
                FROM source_rows
              )
              SELECT
                "sourceKey",
                "displayName",
                "feedUrl",
                'active' AS "status",
                "priority",
                "lastFetchedAt",
                "nextAllowedAt"
              FROM normalized_sources
              WHERE "sourceKey" IS NOT NULL
                AND "feedUrl" IS NOT NULL
                AND "status" = 'active'
                AND (
                  $1::text[] IS NULL
                  OR "sourceKey" = ANY($1::text[])
                )
                AND (
                  $3::boolean = true
                  OR "nextAllowedAt" IS NULL
                  OR "nextAllowedAt" <= $4::text
                )
              ORDER BY
                "priority" DESC,
                "displayName" ASC,
                "sourceKey" ASC
              LIMIT $2::integer
            `,
            createQueryValues(input)
          );

      return result.rows.map(
        row =>
          mapRowToJob({
            row,
            discoveredAt:
              input.requestedAt,
          })
      );
    },
  };
}