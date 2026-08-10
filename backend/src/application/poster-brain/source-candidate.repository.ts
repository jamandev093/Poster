import {
  createHash,
} from "node:crypto";

import type {
  PosterBrainSourceCandidate,
  PosterBrainSourceCandidateEvidence,
  PosterBrainSourceCandidateStatus,
  PosterBrainSourceCandidateType,
} from "./source-candidate.types.js";

export interface PosterBrainSourceCandidateQueryResult {
  readonly rows:
    readonly Record<
      string,
      unknown
    >[];
}

export interface PosterBrainSourceCandidateQueryExecutor {
  query(
    sql:
      string,

    values?:
      readonly unknown[]
  ):
    Promise<
      PosterBrainSourceCandidateQueryResult
    >;
}

export interface PosterBrainPersistentSourceCandidateRecord {
  readonly candidateKey:
    string;

  readonly canonicalHost:
    string;

  readonly canonicalOrigin:
    string;

  readonly displayName:
    string;

  readonly sourceType:
    PosterBrainSourceCandidateType;

  readonly status:
    PosterBrainSourceCandidateStatus;

  readonly sourceExternalIds:
    readonly string[];

  readonly providerKeys:
    readonly string[];

  readonly firstSeenAt:
    string;

  readonly lastSeenAt:
    string;

  readonly observationCount:
    number;
}

export interface PosterBrainSourceCandidateRepository {
  observe(
    candidate:
      PosterBrainSourceCandidate
  ):
    Promise<
      PosterBrainPersistentSourceCandidateRecord
    >;

  get(
    candidateKey:
      string
  ):
    Promise<
      PosterBrainPersistentSourceCandidateRecord |
      null
    >;

  list(
    options?: {
      readonly status?:
        PosterBrainSourceCandidateStatus;

      readonly limit?:
        number;
    }
  ):
    Promise<
      readonly PosterBrainPersistentSourceCandidateRecord[]
    >;

  setStatus(
    candidateKey:
      string,

    status:
      PosterBrainSourceCandidateStatus
  ):
    Promise<
      PosterBrainPersistentSourceCandidateRecord
    >;
}

const SOURCE_TYPES =
  new Set<
    PosterBrainSourceCandidateType
  >([
    "publisher",
    "institution",
    "platform",
    "channel",
    "unknown",
  ]);

const SOURCE_STATUSES =
  new Set<
    PosterBrainSourceCandidateStatus
  >([
    "discovered",
    "qualified",
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
      `Invalid source candidate database ${field}.`
    );
  }

  return value.trim();
}

function textArray(
  value:
    unknown,

  field:
    string
): readonly string[] {
  if (!Array.isArray(value)) {
    throw new Error(
      `Invalid source candidate database ${field}.`
    );
  }

  return value.map(
    item =>
      requiredText(
        item,
        field
      )
  );
}

function timestamp(
  value:
    unknown,

  field:
    string
): string {
  if (
    typeof value !== "string" &&
    !(value instanceof Date)
  ) {
    throw new Error(
      `Invalid source candidate database ${field}.`
    );
  }

  const parsed =
    value instanceof Date
      ? value
      : new Date(value);

  if (
    Number.isNaN(
      parsed.getTime()
    )
  ) {
    throw new Error(
      `Invalid source candidate database ${field}.`
    );
  }

  return parsed.toISOString();
}

function positiveInteger(
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
    parsed <= 0
  ) {
    throw new Error(
      `Invalid source candidate database ${field}.`
    );
  }

  return parsed;
}

function sourceType(
  value:
    unknown
): PosterBrainSourceCandidateType {
  const parsed =
    requiredText(
      value,
      "source_type"
    ) as PosterBrainSourceCandidateType;

  if (!SOURCE_TYPES.has(parsed)) {
    throw new Error(
      "Invalid source candidate database source_type."
    );
  }

  return parsed;
}

function sourceStatus(
  value:
    unknown
): PosterBrainSourceCandidateStatus {
  const parsed =
    requiredText(
      value,
      "status"
    ) as PosterBrainSourceCandidateStatus;

  if (!SOURCE_STATUSES.has(parsed)) {
    throw new Error(
      "Invalid source candidate database status."
    );
  }

  return parsed;
}

function mapRow(
  row:
    Record<
      string,
      unknown
    >
): PosterBrainPersistentSourceCandidateRecord {
  return {
    candidateKey:
      requiredText(
        row["candidate_key"],
        "candidate_key"
      ),

    canonicalHost:
      requiredText(
        row["canonical_host"],
        "canonical_host"
      ),

    canonicalOrigin:
      requiredText(
        row["canonical_origin"],
        "canonical_origin"
      ),

    displayName:
      requiredText(
        row["display_name"],
        "display_name"
      ),

    sourceType:
      sourceType(
        row["source_type"]
      ),

    status:
      sourceStatus(
        row["status"]
      ),

    sourceExternalIds:
      textArray(
        row["source_external_ids"],
        "source_external_ids"
      ),

    providerKeys:
      textArray(
        row["provider_keys"],
        "provider_keys"
      ),

    firstSeenAt:
      timestamp(
        row["first_seen_at"],
        "first_seen_at"
      ),

    lastSeenAt:
      timestamp(
        row["last_seen_at"],
        "last_seen_at"
      ),

    observationCount:
      positiveInteger(
        row["observation_count"],
        "observation_count"
      ),
  };
}

function uniqueStrings(
  values:
    readonly string[]
): readonly string[] {
  return [
    ...new Set(
      values
        .map(
          value =>
            value.trim()
        )
        .filter(Boolean)
    ),
  ].sort();
}

function evidenceKey(
  evidence:
    PosterBrainSourceCandidateEvidence
): string {
  return createHash(
    "sha256"
  )
    .update(
      [
        evidence.providerKey,
        evidence.externalContentId,
        evidence.originalUrl,
      ].join("\u0000"),
      "utf8"
    )
    .digest(
      "hex"
    );
}

function serializedEvidence(
  evidence:
    readonly PosterBrainSourceCandidateEvidence[]
): string {
  return JSON.stringify(
    evidence.map(
      item => ({
        evidence_key:
          evidenceKey(item),

        provider_key:
          item.providerKey,

        external_content_id:
          item.externalContentId,

        original_url:
          item.originalUrl,

        observed_at:
          item.observedAt,
      })
    )
  );
}

function validateCandidate(
  candidate:
    PosterBrainSourceCandidate
): void {
  if (
    !candidate.candidateKey.startsWith(
      "host:"
    )
  ) {
    throw new Error(
      "Source candidate key must use host identity."
    );
  }

  if (
    !SOURCE_TYPES.has(
      candidate.sourceType
    )
  ) {
    throw new Error(
      "Invalid source candidate type."
    );
  }

  if (
    !SOURCE_STATUSES.has(
      candidate.status
    )
  ) {
    throw new Error(
      "Invalid source candidate status."
    );
  }

  if (
    !Number.isSafeInteger(
      candidate.observationCount
    ) ||
    candidate.observationCount <= 0
  ) {
    throw new Error(
      "Invalid source candidate observation count."
    );
  }

  if (
    candidate.evidence.length === 0
  ) {
    throw new Error(
      "Source candidate evidence is required."
    );
  }
}

const RETURNING_COLUMNS = `
    candidate_key,
    canonical_host,
    canonical_origin,
    display_name,
    source_type,
    status,
    source_external_ids,
    provider_keys,
    first_seen_at,
    last_seen_at,
    observation_count
`;

export function createPosterBrainSourceCandidateRepository(
  executor:
    PosterBrainSourceCandidateQueryExecutor
): PosterBrainSourceCandidateRepository {
  return {
    async observe(
      candidate
    ) {
      validateCandidate(
        candidate
      );

      const evidenceJson =
        serializedEvidence(
          candidate.evidence
        );

      const result =
        await executor.query(
          `
WITH upserted AS (
    INSERT INTO app.poster_brain_source_candidates (
        candidate_key,
        canonical_host,
        canonical_origin,
        display_name,
        source_type,
        status,
        source_external_ids,
        provider_keys,
        first_seen_at,
        last_seen_at,
        observation_count
    )
    VALUES (
        $1,
        $2,
        $3,
        $4,
        $5,
        $6,
        $7::TEXT[],
        $8::TEXT[],
        $9::TIMESTAMPTZ,
        $10::TIMESTAMPTZ,
        $11::BIGINT
    )
    ON CONFLICT (candidate_key)
    DO UPDATE SET
        source_type =
            CASE
                WHEN app.poster_brain_source_candidates.source_type = 'unknown'
                     AND EXCLUDED.source_type <> 'unknown'
                THEN EXCLUDED.source_type
                ELSE app.poster_brain_source_candidates.source_type
            END,

        source_external_ids =
            ARRAY(
                SELECT DISTINCT value
                FROM UNNEST(
                    app.poster_brain_source_candidates.source_external_ids
                    || EXCLUDED.source_external_ids
                ) AS value
                WHERE BTRIM(value) <> ''
                ORDER BY value
            ),

        provider_keys =
            ARRAY(
                SELECT DISTINCT value
                FROM UNNEST(
                    app.poster_brain_source_candidates.provider_keys
                    || EXCLUDED.provider_keys
                ) AS value
                WHERE BTRIM(value) <> ''
                ORDER BY value
            ),

        first_seen_at =
            LEAST(
                app.poster_brain_source_candidates.first_seen_at,
                EXCLUDED.first_seen_at
            ),

        last_seen_at =
            GREATEST(
                app.poster_brain_source_candidates.last_seen_at,
                EXCLUDED.last_seen_at
            ),

        observation_count =
            app.poster_brain_source_candidates.observation_count
            + EXCLUDED.observation_count,

        updated_at =
            NOW()

    RETURNING
        ${RETURNING_COLUMNS}
),

inserted_evidence AS (
    INSERT INTO app.poster_brain_source_candidate_evidence (
        candidate_key,
        evidence_key,
        provider_key,
        external_content_id,
        original_url,
        observed_at
    )
    SELECT
        upserted.candidate_key,
        evidence.evidence_key,
        evidence.provider_key,
        evidence.external_content_id,
        evidence.original_url,
        evidence.observed_at
    FROM upserted
    CROSS JOIN JSONB_TO_RECORDSET(
        $12::JSONB
    ) AS evidence (
        evidence_key TEXT,
        provider_key TEXT,
        external_content_id TEXT,
        original_url TEXT,
        observed_at TIMESTAMPTZ
    )
    ON CONFLICT (
        candidate_key,
        evidence_key
    )
    DO NOTHING
    RETURNING evidence_key
)

SELECT
    ${RETURNING_COLUMNS},
    (
        SELECT COUNT(*)
        FROM inserted_evidence
    ) AS inserted_evidence_count
FROM upserted;
          `,
          [
            candidate.candidateKey,
            candidate.canonicalHost,
            candidate.canonicalOrigin,
            candidate.displayName,
            candidate.sourceType,
            candidate.status,
            uniqueStrings(
              candidate.sourceExternalIds
            ),
            uniqueStrings(
              candidate.providerKeys
            ),
            candidate.firstSeenAt,
            candidate.lastSeenAt,
            candidate.observationCount,
            evidenceJson,
          ]
        );

      const row =
        result.rows[0];

      if (row === undefined) {
        throw new Error(
          "Source candidate persistence returned no row."
        );
      }

      return mapRow(row);
    },

    async get(
      candidateKey
    ) {
      const result =
        await executor.query(
          `
SELECT
    ${RETURNING_COLUMNS}
FROM app.poster_brain_source_candidates
WHERE candidate_key = $1
LIMIT 1;
          `,
          [
            candidateKey,
          ]
        );

      const row =
        result.rows[0];

      return row === undefined
        ? null
        : mapRow(row);
    },

    async list(
      options = {}
    ) {
      const limit =
        options.limit ??
        100;

      if (
        !Number.isSafeInteger(limit) ||
        limit < 1 ||
        limit > 1000
      ) {
        throw new Error(
          "Source candidate list limit must be between 1 and 1000."
        );
      }

      if (
        options.status !== undefined &&
        !SOURCE_STATUSES.has(
          options.status
        )
      ) {
        throw new Error(
          "Invalid source candidate list status."
        );
      }

      const result =
        options.status === undefined
          ? await executor.query(
              `
SELECT
    ${RETURNING_COLUMNS}
FROM app.poster_brain_source_candidates
ORDER BY
    last_seen_at DESC,
    candidate_key ASC
LIMIT $1;
              `,
              [
                limit,
              ]
            )
          : await executor.query(
              `
SELECT
    ${RETURNING_COLUMNS}
FROM app.poster_brain_source_candidates
WHERE status = $1
ORDER BY
    last_seen_at DESC,
    candidate_key ASC
LIMIT $2;
              `,
              [
                options.status,
                limit,
              ]
            );

      return result.rows.map(
        mapRow
      );
    },

    async setStatus(
      candidateKey,
      status
    ) {
      if (
        !SOURCE_STATUSES.has(
          status
        )
      ) {
        throw new Error(
          "Invalid source candidate lifecycle status."
        );
      }

      const result =
        await executor.query(
          `
UPDATE app.poster_brain_source_candidates
SET
    status = $2,
    updated_at = NOW()
WHERE candidate_key = $1
RETURNING
    ${RETURNING_COLUMNS};
          `,
          [
            candidateKey,
            status,
          ]
        );

      const row =
        result.rows[0];

      if (row === undefined) {
        throw new Error(
          "Source candidate does not exist."
        );
      }

      return mapRow(row);
    },
  };
}