import {
  createHash,
} from "node:crypto";

import type {
  PosterBrainEvolvingTopicObservation,
  PosterBrainEvolvingTopicRecord,
  PosterBrainEvolvingTopicStatus,
} from "./evolving-topic.types.js";

export interface PosterBrainEvolvingTopicQueryResult {
  readonly rows:
    readonly Record<string, unknown>[];
}

export interface PosterBrainEvolvingTopicQueryExecutor {
  query(
    sql:
      string,

    values?:
      readonly unknown[]
  ):
    Promise<
      PosterBrainEvolvingTopicQueryResult
    >;
}

export interface PosterBrainEvolvingTopicObservationResult {
  readonly insertedEvidence:
    boolean;

  readonly topic:
    PosterBrainEvolvingTopicRecord;
}

export interface PosterBrainEvolvingTopicRepository {
  observe(
    input:
      PosterBrainEvolvingTopicObservation
  ):
    Promise<
      PosterBrainEvolvingTopicObservationResult
    >;

  findBySlug(
    slug:
      string
  ):
    Promise<
      PosterBrainEvolvingTopicRecord |
      null
    >;

  setStatus(
    id:
      string,

    status:
      PosterBrainEvolvingTopicStatus
  ):
    Promise<
      PosterBrainEvolvingTopicRecord
    >;
}

const STATUSES =
  new Set<
    PosterBrainEvolvingTopicStatus
  >([
    "discovered",
    "promotable",
    "promoted",
    "rejected",
  ]);

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
      `Invalid evolving topic ${field}.`
    );
  }

  return value.trim();
}

function nullableText(
  value:
    unknown
): string | null {
  if (
    value === null ||
    value === undefined
  ) {
    return null;
  }

  return requiredText(
    value,
    "optional text"
  );
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
      `Invalid evolving topic ${field}.`
    );
  }

  return parsed;
}

function confidence(
  value:
    unknown
): number {
  const parsed =
    typeof value === "number"
      ? value
      : typeof value === "string"
        ? Number(value)
        : Number.NaN;

  if (
    !Number.isFinite(parsed) ||
    parsed < 0 ||
    parsed > 1
  ) {
    throw new Error(
      "Invalid evolving topic average_confidence."
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
  const date =
    value instanceof Date
      ? value
      : typeof value === "string"
        ? new Date(value)
        : new Date(Number.NaN);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    throw new Error(
      `Invalid evolving topic ${field}.`
    );
  }

  return date.toISOString();
}

function status(
  value:
    unknown
): PosterBrainEvolvingTopicStatus {
  const parsed =
    requiredText(
      value,
      "status"
    ) as PosterBrainEvolvingTopicStatus;

  if (!STATUSES.has(parsed)) {
    throw new Error(
      "Invalid evolving topic status."
    );
  }

  return parsed;
}

function mapRow(
  row:
    Record<string, unknown>
): PosterBrainEvolvingTopicRecord {
  return {
    id:
      requiredText(
        row["id"],
        "id"
      ),

    slug:
      requiredText(
        row["slug"],
        "slug"
      ),

    displayName:
      requiredText(
        row["display_name"],
        "display_name"
      ),

    canonicalParentTopicId:
      nullableText(
        row["canonical_parent_topic_id"]
      ),

    status:
      status(
        row["status"]
      ),

    observationCount:
      integer(
        row["observation_count"],
        "observation_count"
      ),

    distinctContentCount:
      integer(
        row["distinct_content_count"],
        "distinct_content_count"
      ),

    providerCount:
      integer(
        row["provider_count"],
        "provider_count"
      ),

    averageConfidence:
      confidence(
        row["average_confidence"]
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

    promotedTopicId:
      nullableText(
        row["promoted_topic_id"]
      ),
  };
}

function validateObservation(
  input:
    PosterBrainEvolvingTopicObservation
): void {
  if (
    !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(
      input.slug
    )
  ) {
    throw new Error(
      "Invalid evolving topic slug."
    );
  }

  if (
    input.displayName.trim().length < 2 ||
    input.providerKey.trim().length === 0 ||
    input.externalContentId.trim().length === 0
  ) {
    throw new Error(
      "Invalid evolving topic observation."
    );
  }

  if (
    !Number.isFinite(
      input.confidence
    ) ||
    input.confidence < 0 ||
    input.confidence > 1
  ) {
    throw new Error(
      "Invalid evolving topic confidence."
    );
  }

  const observed =
    new Date(
      input.observedAt
    );

  if (
    Number.isNaN(
      observed.getTime()
    )
  ) {
    throw new Error(
      "Invalid evolving topic observedAt."
    );
  }
}

function evidenceKey(
  input:
    PosterBrainEvolvingTopicObservation
): string {
  return createHash(
    "sha256"
  )
    .update(
      [
        input.providerKey
          .trim()
          .toLowerCase(),

        input.externalContentId
          .trim(),
      ].join("\u0000"),
      "utf8"
    )
    .digest(
      "hex"
    );
}

const RETURNING_COLUMNS = `
    id,
    slug,
    display_name,
    canonical_parent_topic_id,
    status,
    observation_count,
    distinct_content_count,
    provider_count,
    average_confidence,
    first_seen_at,
    last_seen_at,
    promoted_topic_id
`;

export function createPosterBrainEvolvingTopicRepository(
  executor:
    PosterBrainEvolvingTopicQueryExecutor
): PosterBrainEvolvingTopicRepository {
  return {
    async observe(
      input
    ) {
      validateObservation(
        input
      );

      const providerKey =
        input.providerKey
          .trim()
          .toLowerCase();

      const modelKey =
        input.modelKey?.trim() ||
        null;

      const observedAt =
        new Date(
          input.observedAt
        ).toISOString();

      const result =
        await executor.query(
          `
WITH inserted_topic AS (
    INSERT INTO app.poster_brain_evolving_topics (
        slug,
        display_name,
        canonical_parent_topic_id,
        status,
        first_seen_at,
        last_seen_at
    )
    VALUES (
        $1,
        $2,
        $3::uuid,
        'discovered',
        $8::timestamptz,
        $8::timestamptz
    )
    ON CONFLICT DO NOTHING
    RETURNING id
),

selected_topic AS (
    SELECT id
    FROM inserted_topic

    UNION ALL

    SELECT id
    FROM app.poster_brain_evolving_topics
    WHERE LOWER(slug) = LOWER($1)
    LIMIT 1
),

parent_update AS (
    UPDATE app.poster_brain_evolving_topics topic
    SET
        canonical_parent_topic_id =
            CASE
                WHEN topic.canonical_parent_topic_id IS NULL
                THEN $3::uuid
                ELSE topic.canonical_parent_topic_id
            END,

        updated_at = CURRENT_TIMESTAMP
    FROM selected_topic selected
    WHERE topic.id = selected.id
    RETURNING topic.id
),

inserted_evidence AS (
    INSERT INTO app.poster_brain_evolving_topic_evidence (
        evolving_topic_id,
        evidence_key,
        provider_key,
        model_key,
        external_content_id,
        confidence,
        observed_at
    )
    SELECT
        selected.id,
        $4,
        $5,
        $6,
        $7,
        $9::numeric,
        $8::timestamptz
    FROM selected_topic selected
    ON CONFLICT (
        evolving_topic_id,
        evidence_key
    )
    DO NOTHING
    RETURNING evidence_key
),

recalculated AS (
    UPDATE app.poster_brain_evolving_topics topic
    SET
        observation_count = (
            SELECT COUNT(*)::bigint
            FROM app.poster_brain_evolving_topic_evidence evidence
            WHERE evidence.evolving_topic_id = topic.id
        ),

        distinct_content_count = (
            SELECT COUNT(
                DISTINCT external_content_id
            )::bigint
            FROM app.poster_brain_evolving_topic_evidence evidence
            WHERE evidence.evolving_topic_id = topic.id
        ),

        provider_count = (
            SELECT COUNT(
                DISTINCT provider_key
            )::integer
            FROM app.poster_brain_evolving_topic_evidence evidence
            WHERE evidence.evolving_topic_id = topic.id
        ),

        average_confidence = COALESCE(
            (
                SELECT AVG(confidence)
                FROM app.poster_brain_evolving_topic_evidence evidence
                WHERE evidence.evolving_topic_id = topic.id
            ),
            0
        ),

        first_seen_at = COALESCE(
            (
                SELECT MIN(observed_at)
                FROM app.poster_brain_evolving_topic_evidence evidence
                WHERE evidence.evolving_topic_id = topic.id
            ),
            topic.first_seen_at
        ),

        last_seen_at = COALESCE(
            (
                SELECT MAX(observed_at)
                FROM app.poster_brain_evolving_topic_evidence evidence
                WHERE evidence.evolving_topic_id = topic.id
            ),
            topic.last_seen_at
        ),

        updated_at = CURRENT_TIMESTAMP

    FROM selected_topic selected
    WHERE topic.id = selected.id

    RETURNING
        ${RETURNING_COLUMNS}
)

SELECT
    recalculated.*,

    EXISTS (
        SELECT 1
        FROM inserted_evidence
    ) AS inserted_evidence

FROM recalculated;
          `,
          [
            input.slug,
            input.displayName,
            input.canonicalParentTopicId,
            evidenceKey(input),
            providerKey,
            modelKey,
            input.externalContentId.trim(),
            observedAt,
            input.confidence,
          ]
        );

      const row =
        result.rows[0];

      if (row === undefined) {
        throw new Error(
          "Evolving topic persistence returned no row."
        );
      }

      if (
        typeof row["inserted_evidence"] !==
        "boolean"
      ) {
        throw new Error(
          "Invalid evolving topic inserted evidence state."
        );
      }

      return {
        insertedEvidence:
          row["inserted_evidence"],

        topic:
          mapRow(
            row
          ),
      };
    },

    async findBySlug(
      slug
    ) {
      const result =
        await executor.query(
          `
SELECT
    ${RETURNING_COLUMNS}
FROM app.poster_brain_evolving_topics
WHERE LOWER(slug) = LOWER($1)
LIMIT 1;
          `,
          [
            slug.trim(),
          ]
        );

      const row =
        result.rows[0];

      return row === undefined
        ? null
        : mapRow(row);
    },

    async setStatus(
      id,
      nextStatus
    ) {
      if (!STATUSES.has(nextStatus)) {
        throw new Error(
          "Invalid evolving topic lifecycle status."
        );
      }

      if (
        nextStatus ===
        "promoted"
      ) {
        throw new Error(
          "Promoted state requires controlled canonical promotion."
        );
      }

      const result =
        await executor.query(
          `
UPDATE app.poster_brain_evolving_topics
SET status = $2
WHERE id = $1::uuid
RETURNING
    ${RETURNING_COLUMNS};
          `,
          [
            id,
            nextStatus,
          ]
        );

      const row =
        result.rows[0];

      if (row === undefined) {
        throw new Error(
          "Evolving topic does not exist."
        );
      }

      return mapRow(
        row
      );
    },
  };
}