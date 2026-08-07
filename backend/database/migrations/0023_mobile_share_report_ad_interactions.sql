-- 0023_mobile_share_report_ad_interactions.sql
--
-- Backend persistence for Mobile share events, content report/hide
-- moderation signals, and ad interaction events.
--
-- These tables intentionally separate:
-- - quality/engagement actions from M10 article actions
-- - moderation reports from general feedback
-- - ad impressions/clicks from organic article interactions
--
-- Share/report rows reference app.discovery_content_items so Poster keeps
-- original publisher redirect metadata authoritative. Ad interactions are
-- stored separately for billing, fraud review, reconciliation, and analytics.

CREATE TABLE IF NOT EXISTS app.mobile_user_share_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES app.users(id) ON DELETE CASCADE,
    content_id UUID NOT NULL REFERENCES app.discovery_content_items(id) ON DELETE CASCADE,
    original_url TEXT NOT NULL,
    publisher TEXT NOT NULL,
    share_target TEXT,
    activity_type TEXT,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT mobile_user_share_events_original_url_check
        CHECK (original_url ~* '^https?://'),
    CONSTRAINT mobile_user_share_events_publisher_not_blank
        CHECK (length(btrim(publisher)) >= 1),
    CONSTRAINT mobile_user_share_events_target_not_blank
        CHECK (share_target IS NULL OR length(btrim(share_target)) >= 1),
    CONSTRAINT mobile_user_share_events_activity_type_not_blank
        CHECK (activity_type IS NULL OR length(btrim(activity_type)) >= 1),
    CONSTRAINT mobile_user_share_events_metadata_object_check
        CHECK (jsonb_typeof(metadata) = 'object')
);

CREATE INDEX IF NOT EXISTS mobile_user_share_events_user_created_index
    ON app.mobile_user_share_events (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS mobile_user_share_events_content_created_index
    ON app.mobile_user_share_events (content_id, created_at DESC);

CREATE TABLE IF NOT EXISTS app.mobile_user_report_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES app.users(id) ON DELETE CASCADE,
    content_id UUID NOT NULL REFERENCES app.discovery_content_items(id) ON DELETE CASCADE,
    reason_id TEXT NOT NULL,
    details TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    report_context JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    version INTEGER NOT NULL DEFAULT 1,
    CONSTRAINT mobile_user_report_events_reason_format_check
        CHECK (reason_id ~ '^[a-z0-9_-]{2,64}$'),
    CONSTRAINT mobile_user_report_events_details_length_check
        CHECK (details IS NULL OR length(details) <= 2000),
    CONSTRAINT mobile_user_report_events_status_check
        CHECK (status IN ('pending', 'triaged', 'resolved', 'dismissed')),
    CONSTRAINT mobile_user_report_events_context_object_check
        CHECK (jsonb_typeof(report_context) = 'object')
);

CREATE UNIQUE INDEX IF NOT EXISTS mobile_user_report_events_active_unique
    ON app.mobile_user_report_events (user_id, content_id, reason_id)
    WHERE status IN ('pending', 'triaged');

CREATE INDEX IF NOT EXISTS mobile_user_report_events_status_created_index
    ON app.mobile_user_report_events (status, created_at DESC);

CREATE INDEX IF NOT EXISTS mobile_user_report_events_content_created_index
    ON app.mobile_user_report_events (content_id, created_at DESC);

CREATE TABLE IF NOT EXISTS app.mobile_ad_interactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES app.users(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL,
    placement TEXT NOT NULL,
    ad_slot_id UUID REFERENCES app.discovery_ad_slots(id) ON DELETE SET NULL,
    campaign_id UUID REFERENCES app.monetization_campaigns(id) ON DELETE SET NULL,
    creative_id UUID,
    content_id UUID REFERENCES app.discovery_content_items(id) ON DELETE SET NULL,
    deduplication_key TEXT,
    occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT mobile_ad_interactions_event_type_check
        CHECK (event_type IN ('impression', 'view', 'click', 'dismiss', 'hide')),
    CONSTRAINT mobile_ad_interactions_placement_not_blank
        CHECK (length(btrim(placement)) >= 1),
    CONSTRAINT mobile_ad_interactions_deduplication_key_not_blank
        CHECK (deduplication_key IS NULL OR length(btrim(deduplication_key)) >= 8),
    CONSTRAINT mobile_ad_interactions_metadata_object_check
        CHECK (jsonb_typeof(metadata) = 'object')
);

CREATE UNIQUE INDEX IF NOT EXISTS mobile_ad_interactions_deduplication_unique
    ON app.mobile_ad_interactions (deduplication_key)
    WHERE deduplication_key IS NOT NULL;

CREATE INDEX IF NOT EXISTS mobile_ad_interactions_user_occurred_index
    ON app.mobile_ad_interactions (user_id, occurred_at DESC);

CREATE INDEX IF NOT EXISTS mobile_ad_interactions_campaign_event_index
    ON app.mobile_ad_interactions (campaign_id, event_type, occurred_at DESC)
    WHERE campaign_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS mobile_ad_interactions_slot_event_index
    ON app.mobile_ad_interactions (ad_slot_id, event_type, occurred_at DESC)
    WHERE ad_slot_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS mobile_ad_interactions_placement_event_index
    ON app.mobile_ad_interactions (placement, event_type, occurred_at DESC);

DROP TRIGGER IF EXISTS mobile_user_report_events_set_updated_at_and_version
    ON app.mobile_user_report_events;

CREATE TRIGGER mobile_user_report_events_set_updated_at_and_version
    BEFORE UPDATE ON app.mobile_user_report_events
    FOR EACH ROW
    EXECUTE FUNCTION app.set_updated_at_and_version();
