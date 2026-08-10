export interface PosterBrainSourceDiscoveryRuntimeQueryResult {
  readonly rows:
    readonly Record<string, unknown>[];
}

export interface PosterBrainSourceDiscoveryRuntimeQueryExecutor {
  query(
    text:
      string,

    values?:
      readonly unknown[]
  ):
    Promise<
      PosterBrainSourceDiscoveryRuntimeQueryResult
    >;
}

export interface PosterBrainSourceDiscoveryRuntimeClaim {
  readonly rootTopicId:
    string;

  readonly rootTopicSlug:
    string;

  readonly rootTopicName:
    string;

  readonly sortOrder:
    number;

  readonly consecutiveFailures:
    number;
}

export interface PosterBrainSourceDiscoveryRuntimeSummary {
  readonly providerRequestCount:
    number;

  readonly discoveredItemCount:
    number;

  readonly uniqueCandidateCount:
    number;

  readonly qualifiedCandidateCount:
    number;
}

export interface PosterBrainSourceDiscoveryRuntimeRepository {
  claimDueRoots(
    input: {
      readonly now:
        string;

      readonly leaseUntil:
        string;

      readonly limit:
        number;
    }
  ):
    Promise<
      readonly PosterBrainSourceDiscoveryRuntimeClaim[]
    >;

  markSucceeded(
    input: {
      readonly rootTopicId:
        string;

      readonly finishedAt:
        string;

      readonly nextEligibleAt:
        string;

      readonly summary:
        PosterBrainSourceDiscoveryRuntimeSummary;
    }
  ):
    Promise<void>;

  markFailed(
    input: {
      readonly rootTopicId:
        string;

      readonly finishedAt:
        string;

      readonly nextEligibleAt:
        string;

      readonly consecutiveFailures:
        number;

      readonly errorCode:
        string;

      readonly errorMessage:
        string;
    }
  ):
    Promise<void>;
}

function requiredText(
  value:
    unknown,

  field:
    string
): string {
  if (
    typeof value !== "string" ||
    value.trim().length === 0
  ) {
    throw new Error(
      `Invalid source discovery runtime ${field}.`
    );
  }

  return value.trim();
}

function nonNegativeInteger(
  value:
    unknown,

  field:
    string
): number {
  const parsed =
    typeof value === "number"
      ? value
      : typeof value === "string"
        ? Number(value)
        : Number.NaN;

  if (
    !Number.isSafeInteger(parsed) ||
    parsed < 0
  ) {
    throw new Error(
      `Invalid source discovery runtime ${field}.`
    );
  }

  return parsed;
}

function mapClaim(
  row:
    Record<string, unknown>
): PosterBrainSourceDiscoveryRuntimeClaim {
  return {
    rootTopicId:
      requiredText(
        row["root_topic_id"],
        "root_topic_id"
      ),

    rootTopicSlug:
      requiredText(
        row["root_topic_slug"],
        "root_topic_slug"
      ),

    rootTopicName:
      requiredText(
        row["root_topic_name"],
        "root_topic_name"
      ),

    sortOrder:
      nonNegativeInteger(
        row["sort_order"],
        "sort_order"
      ),

    consecutiveFailures:
      nonNegativeInteger(
        row["consecutive_failures"],
        "consecutive_failures"
      ),
  };
}

async function requireUpdate(
  executor:
    PosterBrainSourceDiscoveryRuntimeQueryExecutor,

  text:
    string,

  values:
    readonly unknown[],

  message:
    string
): Promise<void> {
  const result =
    await executor.query(
      text,
      values
    );

  if (result.rows[0] === undefined) {
    throw new Error(
      message
    );
  }
}

export function createPosterBrainSourceDiscoveryRuntimeRepository(
  executor:
    PosterBrainSourceDiscoveryRuntimeQueryExecutor
): PosterBrainSourceDiscoveryRuntimeRepository {
  return {
    async claimDueRoots(
      input
    ) {
      const result =
        await executor.query(
          `
WITH seeded AS (
    INSERT INTO app.poster_brain_source_discovery_runtime_states (
        root_topic_id,
        next_eligible_at
    )
    SELECT
        topic.id,
        $1::timestamptz
    FROM app.taxonomy_topics topic
    WHERE
        topic.status = 'active'
        AND topic.parent_topic_id IS NULL
    ON CONFLICT (root_topic_id)
    DO NOTHING
),

due AS (
    SELECT
        state.root_topic_id
    FROM app.poster_brain_source_discovery_runtime_states state
    INNER JOIN app.taxonomy_topics topic
        ON topic.id = state.root_topic_id
    WHERE
        topic.status = 'active'
        AND topic.parent_topic_id IS NULL
        AND state.next_eligible_at <= $1::timestamptz
    ORDER BY
        state.next_eligible_at ASC,
        topic.sort_order ASC,
        topic.slug ASC
    FOR UPDATE OF state
    SKIP LOCKED
    LIMIT $2::integer
),

claimed AS (
    UPDATE app.poster_brain_source_discovery_runtime_states state
    SET
        last_status = 'running',
        last_started_at = $1::timestamptz,
        last_finished_at = NULL,
        next_eligible_at = $3::timestamptz,
        total_runs = state.total_runs + 1,
        last_error_code = NULL,
        last_error_message = NULL
    FROM due
    WHERE
        state.root_topic_id = due.root_topic_id
    RETURNING
        state.root_topic_id,
        state.consecutive_failures
)

SELECT
    claimed.root_topic_id,
    topic.slug AS root_topic_slug,
    topic.name AS root_topic_name,
    topic.sort_order,
    claimed.consecutive_failures
FROM claimed
INNER JOIN app.taxonomy_topics topic
    ON topic.id = claimed.root_topic_id
ORDER BY
    topic.sort_order ASC,
    topic.slug ASC;
          `,
          [
            input.now,
            input.limit,
            input.leaseUntil,
          ]
        );

      return result.rows.map(
        mapClaim
      );
    },

    async markSucceeded(
      input
    ) {
      await requireUpdate(
        executor,
        `
UPDATE app.poster_brain_source_discovery_runtime_states
SET
    last_status = 'completed',
    last_finished_at = $2::timestamptz,
    next_eligible_at = $3::timestamptz,
    consecutive_failures = 0,
    total_successes = total_successes + 1,
    last_provider_request_count = $4::integer,
    last_discovered_item_count = $5::integer,
    last_unique_candidate_count = $6::integer,
    last_qualified_candidate_count = $7::integer,
    last_error_code = NULL,
    last_error_message = NULL
WHERE
    root_topic_id = $1::uuid
    AND last_status = 'running'
RETURNING root_topic_id;
        `,
        [
          input.rootTopicId,
          input.finishedAt,
          input.nextEligibleAt,
          input.summary.providerRequestCount,
          input.summary.discoveredItemCount,
          input.summary.uniqueCandidateCount,
          input.summary.qualifiedCandidateCount,
        ],
        "Source discovery runtime success state was not updated."
      );
    },

    async markFailed(
      input
    ) {
      await requireUpdate(
        executor,
        `
UPDATE app.poster_brain_source_discovery_runtime_states
SET
    last_status = 'failed',
    last_finished_at = $2::timestamptz,
    next_eligible_at = $3::timestamptz,
    consecutive_failures = $4::integer,
    total_failures = total_failures + 1,
    last_provider_request_count = 0,
    last_discovered_item_count = 0,
    last_unique_candidate_count = 0,
    last_qualified_candidate_count = 0,
    last_error_code = $5,
    last_error_message = $6
WHERE
    root_topic_id = $1::uuid
    AND last_status = 'running'
RETURNING root_topic_id;
        `,
        [
          input.rootTopicId,
          input.finishedAt,
          input.nextEligibleAt,
          input.consecutiveFailures,
          input.errorCode,
          input.errorMessage,
        ],
        "Source discovery runtime failure state was not updated."
      );
    },
  };
}