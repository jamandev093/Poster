CREATE TABLE app.poster_brain_source_topic_affinities (
    candidate_key text NOT NULL
        REFERENCES app.poster_brain_source_candidates(candidate_key)
        ON DELETE CASCADE,

    topic_id uuid NOT NULL
        REFERENCES app.taxonomy_topics(id)
        ON DELETE RESTRICT,

    observation_count bigint NOT NULL DEFAULT 0,
    provider_count integer NOT NULL DEFAULT 0,
    distinct_content_count bigint NOT NULL DEFAULT 0,

    first_seen_at timestamptz NOT NULL,
    last_seen_at timestamptz NOT NULL,

    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW(),

    PRIMARY KEY (
        candidate_key,
        topic_id
    ),

    CONSTRAINT poster_brain_source_topic_affinity_observation_count_check
        CHECK (observation_count >= 0),

    CONSTRAINT poster_brain_source_topic_affinity_provider_count_check
        CHECK (provider_count >= 0),

    CONSTRAINT poster_brain_source_topic_affinity_content_count_check
        CHECK (distinct_content_count >= 0),

    CONSTRAINT poster_brain_source_topic_affinity_seen_order_check
        CHECK (last_seen_at >= first_seen_at)
);

CREATE TABLE app.poster_brain_source_topic_affinity_evidence (
    candidate_key text NOT NULL,

    topic_id uuid NOT NULL,

    evidence_key text NOT NULL,

    provider_key text NOT NULL,

    external_content_id text NOT NULL,

    observed_at timestamptz NOT NULL,

    created_at timestamptz NOT NULL DEFAULT NOW(),

    PRIMARY KEY (
        candidate_key,
        topic_id,
        evidence_key
    ),

    FOREIGN KEY (
        candidate_key,
        topic_id
    )
    REFERENCES app.poster_brain_source_topic_affinities (
        candidate_key,
        topic_id
    )
    ON DELETE CASCADE,

    CONSTRAINT poster_brain_source_topic_affinity_provider_check
        CHECK (length(btrim(provider_key)) > 0),

    CONSTRAINT poster_brain_source_topic_affinity_content_check
        CHECK (length(btrim(external_content_id)) > 0)
);

CREATE INDEX poster_brain_source_topic_affinities_topic_idx
    ON app.poster_brain_source_topic_affinities (
        topic_id,
        observation_count DESC,
        candidate_key
    );

CREATE INDEX poster_brain_source_topic_affinities_candidate_idx
    ON app.poster_brain_source_topic_affinities (
        candidate_key,
        observation_count DESC
    );

CREATE INDEX poster_brain_source_topic_affinity_evidence_provider_idx
    ON app.poster_brain_source_topic_affinity_evidence (
        provider_key,
        observed_at DESC
    );

REVOKE ALL
    ON TABLE app.poster_brain_source_topic_affinities
    FROM PUBLIC;

REVOKE ALL
    ON TABLE app.poster_brain_source_topic_affinity_evidence
    FROM PUBLIC;

GRANT
    SELECT,
    INSERT,
    UPDATE,
    DELETE
    ON TABLE app.poster_brain_source_topic_affinities
    TO poster_app;

GRANT
    SELECT,
    INSERT,
    UPDATE,
    DELETE
    ON TABLE app.poster_brain_source_topic_affinity_evidence
    TO poster_app;