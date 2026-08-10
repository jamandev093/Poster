CREATE TABLE app.poster_brain_source_candidates (
    candidate_key TEXT PRIMARY KEY,
    canonical_host TEXT NOT NULL UNIQUE,
    canonical_origin TEXT NOT NULL,
    display_name TEXT NOT NULL,
    source_type TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'discovered',
    source_external_ids TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    provider_keys TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    first_seen_at TIMESTAMPTZ NOT NULL,
    last_seen_at TIMESTAMPTZ NOT NULL,
    observation_count BIGINT NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT poster_brain_source_candidates_key_check
        CHECK (
            candidate_key ~ '^host:[a-z0-9.-]+$'
        ),

    CONSTRAINT poster_brain_source_candidates_host_check
        CHECK (
            canonical_host <> ''
            AND canonical_host = LOWER(canonical_host)
        ),

    CONSTRAINT poster_brain_source_candidates_origin_check
        CHECK (
            canonical_origin ~ '^https://'
        ),

    CONSTRAINT poster_brain_source_candidates_type_check
        CHECK (
            source_type IN (
                'publisher',
                'institution',
                'platform',
                'channel',
                'unknown'
            )
        ),

    CONSTRAINT poster_brain_source_candidates_status_check
        CHECK (
            status IN (
                'discovered',
                'qualified',
                'rejected'
            )
        ),

    CONSTRAINT poster_brain_source_candidates_observation_count_check
        CHECK (
            observation_count > 0
        ),

    CONSTRAINT poster_brain_source_candidates_seen_order_check
        CHECK (
            last_seen_at >= first_seen_at
        )
);

CREATE TABLE app.poster_brain_source_candidate_evidence (
    candidate_key TEXT NOT NULL
        REFERENCES app.poster_brain_source_candidates(candidate_key)
        ON DELETE CASCADE,

    evidence_key TEXT NOT NULL,
    provider_key TEXT NOT NULL,
    external_content_id TEXT NOT NULL,
    original_url TEXT NOT NULL,
    observed_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    PRIMARY KEY (
        candidate_key,
        evidence_key
    ),

    CONSTRAINT poster_brain_source_candidate_evidence_provider_check
        CHECK (
            provider_key <> ''
        ),

    CONSTRAINT poster_brain_source_candidate_evidence_original_url_check
        CHECK (
            original_url ~ '^https?://'
        )
);

CREATE INDEX poster_brain_source_candidates_status_seen_idx
    ON app.poster_brain_source_candidates (
        status,
        last_seen_at DESC
    );

CREATE INDEX poster_brain_source_candidates_last_seen_idx
    ON app.poster_brain_source_candidates (
        last_seen_at DESC
    );

CREATE INDEX poster_brain_source_candidates_provider_keys_idx
    ON app.poster_brain_source_candidates
    USING GIN (
        provider_keys
    );

CREATE INDEX poster_brain_source_candidate_evidence_provider_seen_idx
    ON app.poster_brain_source_candidate_evidence (
        provider_key,
        observed_at DESC
    );

REVOKE ALL
    ON TABLE app.poster_brain_source_candidates
    FROM PUBLIC;

REVOKE ALL
    ON TABLE app.poster_brain_source_candidate_evidence
    FROM PUBLIC;

GRANT
    SELECT,
    INSERT,
    UPDATE,
    DELETE
    ON TABLE app.poster_brain_source_candidates
    TO poster_app;

GRANT
    SELECT,
    INSERT,
    UPDATE,
    DELETE
    ON TABLE app.poster_brain_source_candidate_evidence
    TO poster_app;