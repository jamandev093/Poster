CREATE TABLE app.poster_brain_evolving_topics (
    id uuid PRIMARY KEY
        DEFAULT gen_random_uuid(),

    slug text NOT NULL,
    display_name text NOT NULL,

    canonical_parent_topic_id uuid
        REFERENCES app.taxonomy_topics(id)
        ON DELETE RESTRICT,

    status text NOT NULL
        DEFAULT 'discovered',

    observation_count bigint NOT NULL
        DEFAULT 0,

    distinct_content_count bigint NOT NULL
        DEFAULT 0,

    provider_count integer NOT NULL
        DEFAULT 0,

    average_confidence numeric(7,6) NOT NULL
        DEFAULT 0,

    first_seen_at timestamptz NOT NULL,
    last_seen_at timestamptz NOT NULL,

    promoted_topic_id uuid
        REFERENCES app.taxonomy_topics(id)
        ON DELETE RESTRICT,

    created_at timestamptz NOT NULL
        DEFAULT CURRENT_TIMESTAMP,

    updated_at timestamptz NOT NULL
        DEFAULT CURRENT_TIMESTAMP,

    row_version bigint NOT NULL
        DEFAULT 1,

    CONSTRAINT poster_brain_evolving_topics_slug_check
        CHECK (
            slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'
        ),

    CONSTRAINT poster_brain_evolving_topics_name_check
        CHECK (
            length(btrim(display_name))
            BETWEEN 2 AND 200
        ),

    CONSTRAINT poster_brain_evolving_topics_status_check
        CHECK (
            status IN (
                'discovered',
                'promotable',
                'promoted',
                'rejected'
            )
        ),

    CONSTRAINT poster_brain_evolving_topics_observation_check
        CHECK (observation_count >= 0),

    CONSTRAINT poster_brain_evolving_topics_content_check
        CHECK (distinct_content_count >= 0),

    CONSTRAINT poster_brain_evolving_topics_provider_check
        CHECK (provider_count >= 0),

    CONSTRAINT poster_brain_evolving_topics_confidence_check
        CHECK (
            average_confidence >= 0
            AND average_confidence <= 1
        ),

    CONSTRAINT poster_brain_evolving_topics_seen_check
        CHECK (
            last_seen_at >= first_seen_at
        ),

    CONSTRAINT poster_brain_evolving_topics_promoted_check
        CHECK (
            (
                status = 'promoted'
                AND promoted_topic_id IS NOT NULL
            )
            OR
            (
                status <> 'promoted'
                AND promoted_topic_id IS NULL
            )
        )
);

CREATE UNIQUE INDEX poster_brain_evolving_topics_slug_unique
    ON app.poster_brain_evolving_topics (
        LOWER(slug)
    );

CREATE INDEX poster_brain_evolving_topics_parent_status_idx
    ON app.poster_brain_evolving_topics (
        canonical_parent_topic_id,
        status,
        observation_count DESC
    );

CREATE INDEX poster_brain_evolving_topics_status_seen_idx
    ON app.poster_brain_evolving_topics (
        status,
        last_seen_at DESC
    );

CREATE TABLE app.poster_brain_evolving_topic_evidence (
    evolving_topic_id uuid NOT NULL
        REFERENCES app.poster_brain_evolving_topics(id)
        ON DELETE CASCADE,

    evidence_key text NOT NULL,

    provider_key text NOT NULL,

    model_key text,

    external_content_id text NOT NULL,

    confidence numeric(7,6) NOT NULL,

    observed_at timestamptz NOT NULL,

    created_at timestamptz NOT NULL
        DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (
        evolving_topic_id,
        evidence_key
    ),

    CONSTRAINT poster_brain_evolving_topic_evidence_provider_check
        CHECK (
            length(btrim(provider_key)) > 0
        ),

    CONSTRAINT poster_brain_evolving_topic_evidence_content_check
        CHECK (
            length(btrim(external_content_id)) > 0
        ),

    CONSTRAINT poster_brain_evolving_topic_evidence_confidence_check
        CHECK (
            confidence >= 0
            AND confidence <= 1
        )
);

CREATE INDEX poster_brain_evolving_topic_evidence_provider_idx
    ON app.poster_brain_evolving_topic_evidence (
        provider_key,
        observed_at DESC
    );

CREATE INDEX poster_brain_evolving_topic_evidence_content_idx
    ON app.poster_brain_evolving_topic_evidence (
        external_content_id,
        observed_at DESC
    );

CREATE TRIGGER poster_brain_evolving_topics_updated
BEFORE UPDATE
ON app.poster_brain_evolving_topics
FOR EACH ROW
EXECUTE FUNCTION app.set_updated_at_and_version();

REVOKE ALL
ON TABLE app.poster_brain_evolving_topics
FROM PUBLIC;

REVOKE ALL
ON TABLE app.poster_brain_evolving_topic_evidence
FROM PUBLIC;

GRANT
    SELECT,
    INSERT,
    UPDATE
ON TABLE app.poster_brain_evolving_topics
TO poster_app;

GRANT
    SELECT,
    INSERT,
    UPDATE
ON TABLE app.poster_brain_evolving_topic_evidence
TO poster_app;