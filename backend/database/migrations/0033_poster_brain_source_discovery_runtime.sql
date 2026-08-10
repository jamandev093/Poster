CREATE TABLE app.poster_brain_source_discovery_runtime_states (
    root_topic_id uuid PRIMARY KEY
        REFERENCES app.taxonomy_topics(id)
        ON DELETE CASCADE,

    last_status text NOT NULL
        DEFAULT 'idle',

    next_eligible_at timestamptz NOT NULL
        DEFAULT CURRENT_TIMESTAMP,

    last_started_at timestamptz,
    last_finished_at timestamptz,

    consecutive_failures integer NOT NULL
        DEFAULT 0,

    total_runs bigint NOT NULL
        DEFAULT 0,

    total_successes bigint NOT NULL
        DEFAULT 0,

    total_failures bigint NOT NULL
        DEFAULT 0,

    last_provider_request_count integer NOT NULL
        DEFAULT 0,

    last_discovered_item_count integer NOT NULL
        DEFAULT 0,

    last_unique_candidate_count integer NOT NULL
        DEFAULT 0,

    last_qualified_candidate_count integer NOT NULL
        DEFAULT 0,

    last_error_code text,
    last_error_message text,

    created_at timestamptz NOT NULL
        DEFAULT CURRENT_TIMESTAMP,

    updated_at timestamptz NOT NULL
        DEFAULT CURRENT_TIMESTAMP,

    row_version bigint NOT NULL
        DEFAULT 1,

    CONSTRAINT poster_brain_source_discovery_runtime_status_check
        CHECK (
            last_status IN (
                'idle',
                'running',
                'completed',
                'failed'
            )
        ),

    CONSTRAINT poster_brain_source_discovery_runtime_failure_check
        CHECK (consecutive_failures >= 0),

    CONSTRAINT poster_brain_source_discovery_runtime_totals_check
        CHECK (
            total_runs >= 0
            AND total_successes >= 0
            AND total_failures >= 0
        ),

    CONSTRAINT poster_brain_source_discovery_runtime_counts_check
        CHECK (
            last_provider_request_count >= 0
            AND last_discovered_item_count >= 0
            AND last_unique_candidate_count >= 0
            AND last_qualified_candidate_count >= 0
        )
);

CREATE INDEX poster_brain_source_discovery_runtime_due_idx
    ON app.poster_brain_source_discovery_runtime_states (
        next_eligible_at,
        last_status
    );

CREATE TRIGGER poster_brain_source_discovery_runtime_updated
BEFORE UPDATE
ON app.poster_brain_source_discovery_runtime_states
FOR EACH ROW
EXECUTE FUNCTION app.set_updated_at_and_version();

REVOKE ALL
ON TABLE app.poster_brain_source_discovery_runtime_states
FROM PUBLIC;

GRANT
    SELECT,
    INSERT,
    UPDATE
ON TABLE app.poster_brain_source_discovery_runtime_states
TO poster_app;