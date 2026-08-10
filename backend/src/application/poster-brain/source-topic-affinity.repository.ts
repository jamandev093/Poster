import {
  createHash,
} from "node:crypto";

export interface PosterBrainSourceTopicAffinityQueryResult {
  readonly rows:
    readonly Record<string, unknown>[];
}

export interface PosterBrainSourceTopicAffinityQueryExecutor {
  query(
    sql: string,
    values?: readonly unknown[]
  ): Promise<PosterBrainSourceTopicAffinityQueryResult>;
}

export interface PosterBrainSourceTopicAffinityRecord {
  readonly candidateKey:
    string;

  readonly topicId:
    string;

  readonly topicSlug:
    string;

  readonly observationCount:
    number;

  readonly providerCount:
    number;

  readonly distinctContentCount:
    number;

  readonly firstSeenAt:
    string;

  readonly lastSeenAt:
    string;
}

export interface PosterBrainSourceTopicAffinityObservation {
  readonly candidateKey:
    string;

  readonly topicId:
    string;

  readonly providerKey:
    string;

  readonly externalContentId:
    string;

  readonly observedAt:
    string;
}

export interface PosterBrainSourceTopicAffinityObservationResult {
  readonly inserted:
    boolean;

  readonly affinity:
    PosterBrainSourceTopicAffinityRecord;
}

export interface PosterBrainSourceQualificationEvidenceSummary {
  readonly candidateKey:
    string;

  readonly topicCount:
    number;

  readonly providerCount:
    number;

  readonly distinctContentCount:
    number;

  readonly affinityObservationCount:
    number;
}

export interface PosterBrainSourceTopicAffinityRepository {
  observe(
    input:
      PosterBrainSourceTopicAffinityObservation
  ): Promise<PosterBrainSourceTopicAffinityObservationResult>;

  listForCandidate(
    candidateKey:
      string
  ): Promise<readonly PosterBrainSourceTopicAffinityRecord[]>;

  summarizeCandidate(
    candidateKey:
      string
  ): Promise<PosterBrainSourceQualificationEvidenceSummary | null>;
}

function text(
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
      `Invalid source-topic affinity ${field}.`
    );
  }

  return value.trim();
}

function integer(
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
      `Invalid source-topic affinity ${field}.`
    );
  }

  return parsed;
}

function instant(
  value:
    unknown,
  field:
    string
): string {
  const parsed =
    value instanceof Date
      ? value
      : typeof value === "string"
        ? new Date(value)
        : new Date(Number.NaN);

  if (
    Number.isNaN(
      parsed.getTime()
    )
  ) {
    throw new Error(
      `Invalid source-topic affinity ${field}.`
    );
  }

  return parsed.toISOString();
}

function mapAffinity(
  row:
    Record<string, unknown>
): PosterBrainSourceTopicAffinityRecord {
  return {
    candidateKey:
      text(
        row["candidate_key"],
        "candidate_key"
      ),

    topicId:
      text(
        row["topic_id"],
        "topic_id"
      ),

    topicSlug:
      text(
        row["topic_slug"],
        "topic_slug"
      ),

    observationCount:
      integer(
        row["observation_count"],
        "observation_count"
      ),

    providerCount:
      integer(
        row["provider_count"],
        "provider_count"
      ),

    distinctContentCount:
      integer(
        row["distinct_content_count"],
        "distinct_content_count"
      ),

    firstSeenAt:
      instant(
        row["first_seen_at"],
        "first_seen_at"
      ),

    lastSeenAt:
      instant(
        row["last_seen_at"],
        "last_seen_at"
      ),
  };
}

function evidenceKey(
  input:
    PosterBrainSourceTopicAffinityObservation
): string {
  return createHash(
    "sha256"
  )
    .update(
      [
        input.providerKey,
        input.externalContentId,
      ].join("\u0000"),
      "utf8"
    )
    .digest(
      "hex"
    );
}

function normalizeObservation(
  input:
    PosterBrainSourceTopicAffinityObservation
): PosterBrainSourceTopicAffinityObservation {
  const candidateKey =
    input.candidateKey.trim();

  const topicId =
    input.topicId.trim();

  const providerKey =
    input.providerKey
      .trim()
      .toLowerCase();

  const externalContentId =
    input.externalContentId.trim();

  const observed =
    new Date(
      input.observedAt
    );

  if (
    !candidateKey.startsWith("host:") ||
    topicId.length === 0 ||
    providerKey.length === 0 ||
    externalContentId.length === 0 ||
    Number.isNaN(observed.getTime())
  ) {
    throw new Error(
      "Invalid source-topic affinity observation."
    );
  }

  return {
    candidateKey,
    topicId,
    providerKey,
    externalContentId,
    observedAt:
      observed.toISOString(),
  };
}

export function createPosterBrainSourceTopicAffinityRepository(
  executor:
    PosterBrainSourceTopicAffinityQueryExecutor
): PosterBrainSourceTopicAffinityRepository {
  return {
    async observe(
      rawInput
    ) {
      const input =
        normalizeObservation(
          rawInput
        );

      const result =
        await executor.query(
          `
WITH ensured_affinity AS (
    INSERT INTO app.poster_brain_source_topic_affinities (
        candidate_key,
        topic_id,
        observation_count,
        provider_count,
        distinct_content_count,
        first_seen_at,
        last_seen_at
    )
    VALUES (
        $1,
        $2::uuid,
        0,
        0,
        0,
        $6::timestamptz,
        $6::timestamptz
    )
    ON CONFLICT (
        candidate_key,
        topic_id
    )
    DO NOTHING
),

inserted_evidence AS (
    INSERT INTO app.poster_brain_source_topic_affinity_evidence (
        candidate_key,
        topic_id,
        evidence_key,
        provider_key,
        external_content_id,
        observed_at
    )
    VALUES (
        $1,
        $2::uuid,
        $3,
        $4,
        $5,
        $6::timestamptz
    )
    ON CONFLICT (
        candidate_key,
        topic_id,
        evidence_key
    )
    DO NOTHING
    RETURNING evidence_key
),

recalculated AS (
    UPDATE app.poster_brain_source_topic_affinities AS affinity
    SET
        observation_count = (
            SELECT COUNT(*)::bigint
            FROM app.poster_brain_source_topic_affinity_evidence evidence
            WHERE
                evidence.candidate_key = affinity.candidate_key
                AND evidence.topic_id = affinity.topic_id
        ),

        provider_count = (
            SELECT COUNT(DISTINCT provider_key)::integer
            FROM app.poster_brain_source_topic_affinity_evidence evidence
            WHERE
                evidence.candidate_key = affinity.candidate_key
                AND evidence.topic_id = affinity.topic_id
        ),

        distinct_content_count = (
            SELECT COUNT(
                DISTINCT (
                    provider_key,
                    external_content_id
                )
            )::bigint
            FROM app.poster_brain_source_topic_affinity_evidence evidence
            WHERE
                evidence.candidate_key = affinity.candidate_key
                AND evidence.topic_id = affinity.topic_id
        ),

        first_seen_at = COALESCE(
            (
                SELECT MIN(observed_at)
                FROM app.poster_brain_source_topic_affinity_evidence evidence
                WHERE
                    evidence.candidate_key = affinity.candidate_key
                    AND evidence.topic_id = affinity.topic_id
            ),
            affinity.first_seen_at
        ),

        last_seen_at = COALESCE(
            (
                SELECT MAX(observed_at)
                FROM app.poster_brain_source_topic_affinity_evidence evidence
                WHERE
                    evidence.candidate_key = affinity.candidate_key
                    AND evidence.topic_id = affinity.topic_id
            ),
            affinity.last_seen_at
        ),

        updated_at = NOW()

    WHERE
        affinity.candidate_key = $1
        AND affinity.topic_id = $2::uuid

    RETURNING
        affinity.candidate_key,
        affinity.topic_id,
        affinity.observation_count,
        affinity.provider_count,
        affinity.distinct_content_count,
        affinity.first_seen_at,
        affinity.last_seen_at
)

SELECT
    recalculated.candidate_key,
    recalculated.topic_id,
    taxonomy.slug AS topic_slug,
    recalculated.observation_count,
    recalculated.provider_count,
    recalculated.distinct_content_count,
    recalculated.first_seen_at,
    recalculated.last_seen_at,
    EXISTS (
        SELECT 1
        FROM inserted_evidence
    ) AS inserted
FROM recalculated
INNER JOIN app.taxonomy_topics taxonomy
    ON taxonomy.id = recalculated.topic_id;
          `,
          [
            input.candidateKey,
            input.topicId,
            evidenceKey(input),
            input.providerKey,
            input.externalContentId,
            input.observedAt,
          ]
        );

      const row =
        result.rows[0];

      if (row === undefined) {
        throw new Error(
          "Source-topic affinity persistence returned no row."
        );
      }

      if (
        typeof row["inserted"] !==
        "boolean"
      ) {
        throw new Error(
          "Invalid source-topic affinity inserted state."
        );
      }

      return {
        inserted:
          row["inserted"],

        affinity:
          mapAffinity(
            row
          ),
      };
    },

    async listForCandidate(
      candidateKey
    ) {
      const result =
        await executor.query(
          `
SELECT
    affinity.candidate_key,
    affinity.topic_id,
    taxonomy.slug AS topic_slug,
    affinity.observation_count,
    affinity.provider_count,
    affinity.distinct_content_count,
    affinity.first_seen_at,
    affinity.last_seen_at
FROM app.poster_brain_source_topic_affinities affinity
INNER JOIN app.taxonomy_topics taxonomy
    ON taxonomy.id = affinity.topic_id
WHERE affinity.candidate_key = $1
ORDER BY
    affinity.observation_count DESC,
    taxonomy.slug ASC;
          `,
          [
            candidateKey,
          ]
        );

      return result.rows.map(
        mapAffinity
      );
    },

    async summarizeCandidate(
      candidateKey
    ) {
      const result =
        await executor.query(
          `
SELECT
    evidence.candidate_key,

    COUNT(
        DISTINCT evidence.topic_id
    )::bigint AS topic_count,

    COUNT(
        DISTINCT evidence.provider_key
    )::bigint AS provider_count,

    COUNT(
        DISTINCT (
            evidence.provider_key,
            evidence.external_content_id
        )
    )::bigint AS distinct_content_count,

    COUNT(*)::bigint
        AS affinity_observation_count

FROM app.poster_brain_source_topic_affinity_evidence evidence
WHERE evidence.candidate_key = $1
GROUP BY evidence.candidate_key;
          `,
          [
            candidateKey,
          ]
        );

      const row =
        result.rows[0];

      if (row === undefined) {
        return null;
      }

      return {
        candidateKey:
          text(
            row["candidate_key"],
            "candidate_key"
          ),

        topicCount:
          integer(
            row["topic_count"],
            "topic_count"
          ),

        providerCount:
          integer(
            row["provider_count"],
            "provider_count"
          ),

        distinctContentCount:
          integer(
            row["distinct_content_count"],
            "distinct_content_count"
          ),

        affinityObservationCount:
          integer(
            row["affinity_observation_count"],
            "affinity_observation_count"
          ),
      };
    },
  };
}