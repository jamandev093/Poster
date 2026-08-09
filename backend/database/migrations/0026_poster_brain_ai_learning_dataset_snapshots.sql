-- 0026_poster_brain_ai_learning_dataset_snapshots.sql
--
-- Persistent, reproducible Poster Brain AI learning datasets.
--
-- TypeScript Backend owns PostgreSQL.
-- Python AI does not receive database credentials.
--
-- Dataset snapshots intentionally contain normalized organic
-- learning signals only:
-- - organic content impression/open-original events
-- - shares
-- - reports
-- - bookmarks
-- - article interactions
-- - article feedback
--
-- Commercial app.mobile_ad_interactions are excluded.
-- User identifiers, report free-text details, and arbitrary
-- event metadata are not stored in learning snapshots.

CREATE TABLE IF NOT EXISTS app.poster_brain_ai_learning_datasets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    schema_version INTEGER NOT NULL,

    status TEXT NOT NULL DEFAULT 'building',

    source_event_count BIGINT NOT NULL DEFAULT 0,

    materialized_event_count BIGINT NOT NULL DEFAULT 0,

    materialized_content_count BIGINT NOT NULL DEFAULT 0,

    source_cutoff_at TIMESTAMPTZ NOT NULL,

    first_event_at TIMESTAMPTZ,

    last_event_at TIMESTAMPTZ,

    dataset_checksum TEXT,

    failure_reason TEXT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    completed_at TIMESTAMPTZ,

    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    row_version BIGINT NOT NULL DEFAULT 1,

    CONSTRAINT poster_brain_ai_learning_datasets_schema_version_check
        CHECK (schema_version >= 1),

    CONSTRAINT poster_brain_ai_learning_datasets_status_check
        CHECK (
            status IN (
                'building',
                'ready',
                'failed',
                'consumed'
            )
        ),

    CONSTRAINT poster_brain_ai_learning_datasets_source_count_check
        CHECK (source_event_count >= 0),

    CONSTRAINT poster_brain_ai_learning_datasets_event_count_check
        CHECK (materialized_event_count >= 0),

    CONSTRAINT poster_brain_ai_learning_datasets_content_count_check
        CHECK (materialized_content_count >= 0),

    CONSTRAINT poster_brain_ai_learning_datasets_event_range_check
        CHECK (
            first_event_at IS NULL
            OR last_event_at IS NULL
            OR first_event_at <= last_event_at
        ),

    CONSTRAINT poster_brain_ai_learning_datasets_checksum_check
        CHECK (
            dataset_checksum IS NULL
            OR length(btrim(dataset_checksum)) >= 1
        ),

    CONSTRAINT poster_brain_ai_learning_datasets_failure_reason_check
        CHECK (
            failure_reason IS NULL
            OR length(btrim(failure_reason)) >= 1
        ),

    CONSTRAINT poster_brain_ai_learning_datasets_row_version_check
        CHECK (row_version >= 1)
);

CREATE TABLE IF NOT EXISTS app.poster_brain_ai_learning_dataset_contents (
    dataset_id UUID NOT NULL
        REFERENCES app.poster_brain_ai_learning_datasets(id)
        ON DELETE CASCADE,

    content_id UUID NOT NULL,

    source_key TEXT,

    publisher_name TEXT,

    title TEXT NOT NULL,

    excerpt TEXT NOT NULL,

    media_type TEXT NOT NULL,

    language_code TEXT NOT NULL,

    region_code TEXT,

    category TEXT,

    canonical_topic_ids JSONB NOT NULL DEFAULT '[]'::jsonb,

    evolving_topic_ids JSONB NOT NULL DEFAULT '[]'::jsonb,

    tags JSONB NOT NULL DEFAULT '[]'::jsonb,

    search_keywords JSONB NOT NULL DEFAULT '[]'::jsonb,

    ai_classification JSONB NOT NULL DEFAULT '{}'::jsonb,

    quality_score NUMERIC(12, 6) NOT NULL DEFAULT 0,

    published_at TIMESTAMPTZ,

    content_status TEXT NOT NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    PRIMARY KEY (
        dataset_id,
        content_id
    ),

    CONSTRAINT poster_brain_ai_learning_dataset_contents_title_check
        CHECK (length(btrim(title)) >= 1),

    CONSTRAINT poster_brain_ai_learning_dataset_contents_excerpt_check
        CHECK (length(btrim(excerpt)) >= 1),

    CONSTRAINT poster_brain_ai_learning_dataset_contents_media_type_check
        CHECK (length(btrim(media_type)) >= 1),

    CONSTRAINT poster_brain_ai_learning_dataset_contents_language_check
        CHECK (length(btrim(language_code)) >= 1),

    CONSTRAINT poster_brain_ai_learning_dataset_contents_topic_ids_check
        CHECK (jsonb_typeof(canonical_topic_ids) = 'array'),

    CONSTRAINT poster_brain_ai_learning_dataset_contents_evolving_topics_check
        CHECK (jsonb_typeof(evolving_topic_ids) = 'array'),

    CONSTRAINT poster_brain_ai_learning_dataset_contents_tags_check
        CHECK (jsonb_typeof(tags) = 'array'),

    CONSTRAINT poster_brain_ai_learning_dataset_contents_keywords_check
        CHECK (jsonb_typeof(search_keywords) = 'array'),

    CONSTRAINT poster_brain_ai_learning_dataset_contents_classification_check
        CHECK (jsonb_typeof(ai_classification) = 'object'),

    CONSTRAINT poster_brain_ai_learning_dataset_contents_status_check
        CHECK (
            content_status IN (
                'active',
                'hidden',
                'removed',
                'copyright_blocked'
            )
        )
);

CREATE TABLE IF NOT EXISTS app.poster_brain_ai_learning_dataset_events (
    dataset_id UUID NOT NULL
        REFERENCES app.poster_brain_ai_learning_datasets(id)
        ON DELETE CASCADE,

    event_key TEXT NOT NULL,

    source TEXT NOT NULL,

    source_event_id TEXT NOT NULL,

    signal_type TEXT NOT NULL,

    occurred_at TIMESTAMPTZ NOT NULL,

    surface TEXT,

    reason_id TEXT,

    report_status TEXT,

    bookmark_active BOOLEAN,

    content_id UUID NOT NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    PRIMARY KEY (
        dataset_id,
        event_key
    ),

    CONSTRAINT poster_brain_ai_learning_dataset_events_content_fk
        FOREIGN KEY (
            dataset_id,
            content_id
        )
        REFERENCES app.poster_brain_ai_learning_dataset_contents (
            dataset_id,
            content_id
        )
        ON DELETE CASCADE,

    CONSTRAINT poster_brain_ai_learning_dataset_events_key_check
        CHECK (length(btrim(event_key)) >= 1),

    CONSTRAINT poster_brain_ai_learning_dataset_events_source_event_check
        CHECK (length(btrim(source_event_id)) >= 1),

    CONSTRAINT poster_brain_ai_learning_dataset_events_source_check
        CHECK (
            source IN (
                'organic_content_event',
                'share',
                'report',
                'bookmark',
                'article_interaction',
                'article_feedback'
            )
        ),

    CONSTRAINT poster_brain_ai_learning_dataset_events_signal_check
        CHECK (
            signal_type IN (
                'impression',
                'open_original_click',
                'share',
                'report',
                'bookmark',
                'worth_reading',
                'helpful',
                'article_feedback'
            )
        ),

    CONSTRAINT poster_brain_ai_learning_dataset_events_surface_check
        CHECK (
            surface IS NULL
            OR surface IN (
                'home',
                'search',
                'trending',
                'bookmarks'
            )
        ),

    CONSTRAINT poster_brain_ai_learning_dataset_events_reason_check
        CHECK (
            reason_id IS NULL
            OR reason_id ~ '^[a-z0-9_-]{2,64}$'
        ),

    CONSTRAINT poster_brain_ai_learning_dataset_events_report_status_check
        CHECK (
            report_status IS NULL
            OR report_status IN (
                'pending',
                'triaged',
                'resolved',
                'dismissed'
            )
        )
);

CREATE INDEX IF NOT EXISTS
poster_brain_ai_learning_datasets_status_created_index
    ON app.poster_brain_ai_learning_datasets (
        status,
        created_at DESC
    );

CREATE INDEX IF NOT EXISTS
poster_brain_ai_learning_datasets_cutoff_index
    ON app.poster_brain_ai_learning_datasets (
        source_cutoff_at DESC
    );

CREATE INDEX IF NOT EXISTS
poster_brain_ai_learning_dataset_events_time_index
    ON app.poster_brain_ai_learning_dataset_events (
        dataset_id,
        occurred_at DESC,
        event_key DESC
    );

CREATE INDEX IF NOT EXISTS
poster_brain_ai_learning_dataset_events_signal_index
    ON app.poster_brain_ai_learning_dataset_events (
        dataset_id,
        source,
        signal_type
    );

CREATE INDEX IF NOT EXISTS
poster_brain_ai_learning_dataset_events_content_index
    ON app.poster_brain_ai_learning_dataset_events (
        dataset_id,
        content_id
    );

CREATE TRIGGER
poster_brain_ai_learning_datasets_set_updated_at_and_version
    BEFORE UPDATE
    ON app.poster_brain_ai_learning_datasets
    FOR EACH ROW
    EXECUTE FUNCTION app.set_updated_at_and_version();

REVOKE ALL
ON TABLE
    app.poster_brain_ai_learning_datasets,
    app.poster_brain_ai_learning_dataset_contents,
    app.poster_brain_ai_learning_dataset_events
FROM PUBLIC;

GRANT
    SELECT,
    INSERT,
    UPDATE,
    DELETE
ON TABLE
    app.poster_brain_ai_learning_datasets
TO poster_app;

GRANT
    SELECT,
    INSERT,
    DELETE
ON TABLE
    app.poster_brain_ai_learning_dataset_contents,
    app.poster_brain_ai_learning_dataset_events
TO poster_app;

COMMENT ON TABLE app.poster_brain_ai_learning_datasets IS
    'Backend-owned reproducible Poster Brain AI organic-learning dataset snapshots.';

COMMENT ON TABLE app.poster_brain_ai_learning_dataset_contents IS
    'Privacy-safe frozen content features used by a Poster Brain AI learning dataset.';

COMMENT ON TABLE app.poster_brain_ai_learning_dataset_events IS
    'Privacy-safe normalized organic signal membership for a Poster Brain AI learning dataset; commercial ad events are excluded.';