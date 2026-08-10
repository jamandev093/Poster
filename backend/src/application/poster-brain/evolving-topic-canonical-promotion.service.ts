export interface PosterBrainEvolvingTopicCanonicalPromotionQueryResult {
  readonly rows:
    readonly Record<string, unknown>[];
}

export interface PosterBrainEvolvingTopicCanonicalPromotionQueryExecutor {
  query(
    sql:
      string,

    values?:
      readonly unknown[]
  ):
    Promise<
      PosterBrainEvolvingTopicCanonicalPromotionQueryResult
    >;
}

export interface PosterBrainEvolvingTopicCanonicalPromotionResult {
  readonly evolvingTopicId:
    string;

  readonly canonicalTopicId:
    string;

  readonly slug:
    string;

  readonly canonicalParentTopicId:
    string;

  readonly createdCanonicalTopic:
    boolean;
}

export interface PosterBrainEvolvingTopicCanonicalPromotionService {
  promoteApproved(
    input: {
      readonly approved:
        true;

      readonly evolvingTopicId:
        string;

      readonly description:
        string;

      readonly sortOrder?:
        number;
    }
  ):
    Promise<
      PosterBrainEvolvingTopicCanonicalPromotionResult
    >;
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
      `Invalid evolving-topic promotion ${field}.`
    );
  }

  return value.trim();
}

export function createPosterBrainEvolvingTopicCanonicalPromotionService(
  executor:
    PosterBrainEvolvingTopicCanonicalPromotionQueryExecutor
): PosterBrainEvolvingTopicCanonicalPromotionService {
  return {
    async promoteApproved(
      input
    ) {
      if (
        input.approved !==
        true
      ) {
        throw new Error(
          "Canonical topic promotion requires explicit approval."
        );
      }

      const evolvingTopicId =
        input.evolvingTopicId
          .trim();

      const description =
        input.description
          .replace(/\s+/g, " ")
          .trim();

      const sortOrder =
        input.sortOrder ??
        9000;

      if (!evolvingTopicId) {
        throw new Error(
          "Evolving topic id is required."
        );
      }

      if (
        description.length <
          3 ||
        description.length >
          1000
      ) {
        throw new Error(
          "Canonical topic promotion description must be between 3 and 1000 characters."
        );
      }

      if (
        !Number.isSafeInteger(
          sortOrder
        ) ||
        sortOrder < 0 ||
        sortOrder > 100000
      ) {
        throw new Error(
          "Canonical topic promotion sort order is invalid."
        );
      }

      /*
       * One SQL statement provides the promotion boundary:
       *
       * - locks the evolving record;
       * - requires state=promotable;
       * - requires a canonical parent;
       * - reuses an equivalent canonical child where safe;
       * - otherwise inserts the canonical child;
       * - atomically links the evolving record as promoted.
       *
       * AI ingestion never invokes this service automatically.
       */
      const result =
        await executor.query(
          `
WITH locked AS (
    SELECT
        evolving.id,
        evolving.slug,
        evolving.display_name,
        evolving.canonical_parent_topic_id
    FROM app.poster_brain_evolving_topics evolving
    WHERE
        evolving.id = $1::uuid
        AND evolving.status = 'promotable'
        AND evolving.canonical_parent_topic_id IS NOT NULL
    FOR UPDATE
),

existing_canonical AS (
    SELECT
        canonical.id,
        FALSE AS created
    FROM app.taxonomy_topics canonical
    INNER JOIN locked evolving
        ON (
            LOWER(canonical.slug) =
                LOWER(evolving.slug)

            OR

            LOWER(canonical.name) =
                LOWER(evolving.display_name)
        )
    WHERE
        canonical.parent_topic_id
            IS NOT DISTINCT FROM
            evolving.canonical_parent_topic_id
    LIMIT 1
),

inserted_canonical AS (
    INSERT INTO app.taxonomy_topics (
        slug,
        name,
        description,
        parent_topic_id,
        status,
        sort_order,
        archived_at
    )
    SELECT
        evolving.slug,
        evolving.display_name,
        $2,
        evolving.canonical_parent_topic_id,
        'active',
        $3,
        NULL
    FROM locked evolving
    WHERE
        NOT EXISTS (
            SELECT 1
            FROM existing_canonical
        )

        AND NOT EXISTS (
            SELECT 1
            FROM app.taxonomy_topics conflict
            WHERE
                LOWER(conflict.slug) =
                    LOWER(evolving.slug)

                OR

                LOWER(conflict.name) =
                    LOWER(evolving.display_name)
        )

    RETURNING
        id,
        TRUE AS created
),

canonical_target AS (
    SELECT
        id,
        created
    FROM existing_canonical

    UNION ALL

    SELECT
        id,
        created
    FROM inserted_canonical

    LIMIT 1
),

promoted AS (
    UPDATE app.poster_brain_evolving_topics evolving
    SET
        status = 'promoted',
        promoted_topic_id =
            canonical.id,
        updated_at =
            CURRENT_TIMESTAMP
    FROM
        locked,
        canonical_target canonical
    WHERE
        evolving.id =
            locked.id

    RETURNING
        evolving.id
            AS evolving_topic_id,

        evolving.slug
            AS slug,

        evolving.canonical_parent_topic_id
            AS canonical_parent_topic_id,

        canonical.id
            AS canonical_topic_id,

        canonical.created
            AS created_canonical_topic
)

SELECT *
FROM promoted;
          `,
          [
            evolvingTopicId,
            description,
            sortOrder,
          ]
        );

      const row =
        result.rows[0];

      if (row === undefined) {
        throw new Error(
          "Evolving topic is not promotable, has no canonical parent, or conflicts with an existing canonical topic."
        );
      }

      if (
        typeof row["created_canonical_topic"] !==
        "boolean"
      ) {
        throw new Error(
          "Invalid canonical promotion result."
        );
      }

      return {
        evolvingTopicId:
          requiredText(
            row["evolving_topic_id"],
            "evolving_topic_id"
          ),

        canonicalTopicId:
          requiredText(
            row["canonical_topic_id"],
            "canonical_topic_id"
          ),

        slug:
          requiredText(
            row["slug"],
            "slug"
          ),

        canonicalParentTopicId:
          requiredText(
            row["canonical_parent_topic_id"],
            "canonical_parent_topic_id"
          ),

        createdCanonicalTopic:
          row["created_canonical_topic"],
      };
    },
  };
}