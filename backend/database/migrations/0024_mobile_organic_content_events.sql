-- 0024_mobile_organic_content_events.sql
--
-- Organic article impression and open-original/click events for
-- Poster Brain ranking and learning data.
--
-- This table intentionally stays separate from app.mobile_ad_interactions:
-- ad impressions/clicks are commercial/billing signals, while these rows
-- describe organic publisher-content engagement.

CREATE TABLE IF NOT EXISTS app.mobile_user_content_events (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

    user_id uuid NOT NULL,
    content_id uuid NOT NULL REFERENCES app.discovery_content_items(id)
        ON DELETE CASCADE,

    event_type text NOT NULL CHECK (
        event_type IN (
            'impression',
            'open_original_click'
        )
    ),

    surface text NOT NULL CHECK (
        surface IN (
            'home',
            'search',
            'trending',
            'bookmarks'
        )
    ),

    source_context text,
    deduplication_key text,
    occurred_at timestamptz NOT NULL DEFAULT NOW(),
    metadata jsonb NOT NULL DEFAULT '{}'::jsonb,

    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW(),
    version integer NOT NULL DEFAULT 1,

    CONSTRAINT mobile_user_content_events_deduplication_key_length
        CHECK (
            deduplication_key IS NULL
            OR length(trim(deduplication_key)) BETWEEN 8 AND 240
        )
);

CREATE UNIQUE INDEX IF NOT EXISTS mobile_user_content_events_deduplication_key_uidx
    ON app.mobile_user_content_events (deduplication_key)
    WHERE deduplication_key IS NOT NULL;

CREATE INDEX IF NOT EXISTS mobile_user_content_events_content_type_idx
    ON app.mobile_user_content_events (content_id, event_type, occurred_at DESC);

CREATE INDEX IF NOT EXISTS mobile_user_content_events_user_type_idx
    ON app.mobile_user_content_events (user_id, event_type, occurred_at DESC);

DROP TRIGGER IF EXISTS mobile_user_content_events_set_updated_at_and_version
    ON app.mobile_user_content_events;

CREATE TRIGGER mobile_user_content_events_set_updated_at_and_version
    BEFORE UPDATE ON app.mobile_user_content_events
    FOR EACH ROW
    EXECUTE FUNCTION app.set_updated_at_and_version();

REVOKE ALL
ON TABLE app.mobile_user_content_events
FROM PUBLIC;

GRANT
    SELECT,
    INSERT,
    UPDATE,
    DELETE
ON TABLE app.mobile_user_content_events
TO poster_app;

COMMENT ON TABLE app.mobile_user_content_events IS
    'Organic Mobile article impression and open-original events used by Poster Brain ranking and learning data.';

COMMENT ON COLUMN app.mobile_user_content_events.event_type IS
    'Organic content event type. Ad events are stored separately in app.mobile_ad_interactions.';
