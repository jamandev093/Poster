-- Migration: 0034_advertising_ai_learning_snapshots
--
-- Backend-owned immutable Advertising AI training snapshots.
--
-- Important boundaries:
-- - Advertising telemetry only.
-- - No organic Poster Brain events.
-- - No user/session/request identity hashes.
-- - No financial ledger/payment data.
-- - No raw arbitrary analytics metadata.
-- - Python AI never receives direct PostgreSQL access.

CREATE TABLE app.advertising_ai_learning_datasets (
    id uuid
        PRIMARY KEY
        DEFAULT gen_random_uuid(),

    schema_version smallint
        NOT NULL
        DEFAULT 1,

    status text
        NOT NULL
        DEFAULT 'building',

    source_event_count bigint
        NOT NULL,

    materialized_event_count bigint
        NOT NULL
        DEFAULT 0,

    source_cutoff_at timestamptz
        NOT NULL,

    first_event_at timestamptz,
    last_event_at timestamptz,

    dataset_checksum text,

    created_at timestamptz
        NOT NULL
        DEFAULT now(),

    completed_at timestamptz,
    failed_at timestamptz,
    failure_code text,

    CONSTRAINT advertising_ai_learning_datasets_schema_valid
        CHECK (schema_version = 1),

    CONSTRAINT advertising_ai_learning_datasets_status_valid
        CHECK (
            status IN (
                'building',
                'ready',
                'failed'
            )
        ),

    CONSTRAINT advertising_ai_learning_datasets_counts_valid
        CHECK (
            source_event_count >= 0
            AND materialized_event_count >= 0
        ),

    CONSTRAINT advertising_ai_learning_datasets_time_order_valid
        CHECK (
            first_event_at IS NULL
            OR last_event_at IS NULL
            OR first_event_at <= last_event_at
        ),

    CONSTRAINT advertising_ai_learning_datasets_ready_valid
        CHECK (
            status <> 'ready'
            OR (
                materialized_event_count = source_event_count
                AND materialized_event_count >= 10000
                AND dataset_checksum IS NOT NULL
                AND length(btrim(dataset_checksum)) >= 16
                AND completed_at IS NOT NULL
                AND failed_at IS NULL
                AND failure_code IS NULL
            )
        ),

    CONSTRAINT advertising_ai_learning_datasets_failed_valid
        CHECK (
            status <> 'failed'
            OR (
                failed_at IS NOT NULL
                AND failure_code IS NOT NULL
                AND length(btrim(failure_code)) >= 1
                AND completed_at IS NULL
            )
        )
);

CREATE TABLE app.advertising_ai_learning_dataset_events (
    dataset_id uuid
        NOT NULL
        REFERENCES app.advertising_ai_learning_datasets(id)
        ON DELETE RESTRICT,

    event_key text
        NOT NULL,

    source_event_id uuid
        NOT NULL,

    campaign_id uuid
        NOT NULL,

    event_type text
        NOT NULL,

    placement text
        NOT NULL,

    occurred_at timestamptz
        NOT NULL,

    PRIMARY KEY (
        dataset_id,
        event_key
    ),

    CONSTRAINT advertising_ai_learning_dataset_events_source_unique
        UNIQUE (
            dataset_id,
            source_event_id
        ),

    CONSTRAINT advertising_ai_learning_dataset_events_event_key_valid
        CHECK (
            length(btrim(event_key)) >= 1
        ),

    CONSTRAINT advertising_ai_learning_dataset_events_event_type_valid
        CHECK (
            event_type IN (
                'impression',
                'click',
                'conversion'
            )
        ),

    CONSTRAINT advertising_ai_learning_dataset_events_placement_valid
        CHECK (
            placement IN (
                'home',
                'search',
                'trending'
            )
        )
);

CREATE INDEX advertising_ai_learning_datasets_status_index
    ON app.advertising_ai_learning_datasets (
        status,
        created_at DESC
    );

CREATE INDEX advertising_ai_learning_dataset_events_order_index
    ON app.advertising_ai_learning_dataset_events (
        dataset_id,
        occurred_at DESC,
        event_key DESC
    );

CREATE OR REPLACE FUNCTION
app.prevent_advertising_ai_learning_event_mutation()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
BEGIN
    RAISE EXCEPTION
        'Advertising AI frozen learning events are immutable.';
END;
$function$;

CREATE TRIGGER advertising_ai_learning_event_prevent_update
    BEFORE UPDATE
    ON app.advertising_ai_learning_dataset_events
    FOR EACH ROW
    EXECUTE FUNCTION
        app.prevent_advertising_ai_learning_event_mutation();

CREATE TRIGGER advertising_ai_learning_event_prevent_delete
    BEFORE DELETE
    ON app.advertising_ai_learning_dataset_events
    FOR EACH ROW
    EXECUTE FUNCTION
        app.prevent_advertising_ai_learning_event_mutation();

REVOKE ALL
ON app.advertising_ai_learning_datasets
FROM PUBLIC;

REVOKE ALL
ON app.advertising_ai_learning_dataset_events
FROM PUBLIC;

GRANT
    SELECT,
    INSERT,
    UPDATE
ON app.advertising_ai_learning_datasets
TO poster_app;

GRANT
    SELECT,
    INSERT
ON app.advertising_ai_learning_dataset_events
TO poster_app;

COMMENT ON TABLE app.advertising_ai_learning_datasets IS
    'Backend-owned reproducible Advertising AI learning dataset manifests built from trusted validated monetization events.';

COMMENT ON TABLE app.advertising_ai_learning_dataset_events IS
    'Immutable privacy-safe Advertising AI frozen event rows. Contains no user identity, organic content telemetry, raw analytics metadata, or financial ledger data.';

COMMENT ON COLUMN app.advertising_ai_learning_datasets.dataset_checksum IS
    'SHA-256 checksum of canonical frozen Advertising AI event JSON records in deterministic event order.';