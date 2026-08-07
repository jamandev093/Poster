-- 0022_mobile_user_actions.sql
--
-- Backend persistence for authenticated Mobile user actions:
-- bookmarks, article interaction signals, and article feedback.
--
-- These records reference app.discovery_content_items so Poster can
-- preserve publisher redirects and original URL metadata while storing
-- user-specific state separately from the discovery/content registry.

CREATE TABLE IF NOT EXISTS app.mobile_user_bookmarks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES app.users(id) ON DELETE CASCADE,
    content_id UUID NOT NULL REFERENCES app.discovery_content_items(id) ON DELETE CASCADE,
    article_snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    version INTEGER NOT NULL DEFAULT 1,
    CONSTRAINT mobile_user_bookmarks_snapshot_object_check
        CHECK (jsonb_typeof(article_snapshot) = 'object')
);

CREATE UNIQUE INDEX IF NOT EXISTS mobile_user_bookmarks_active_unique
    ON app.mobile_user_bookmarks (user_id, content_id)
    WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS mobile_user_bookmarks_user_created_index
    ON app.mobile_user_bookmarks (user_id, created_at DESC)
    WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS mobile_user_bookmarks_content_index
    ON app.mobile_user_bookmarks (content_id)
    WHERE deleted_at IS NULL;

CREATE TABLE IF NOT EXISTS app.mobile_user_article_interactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES app.users(id) ON DELETE CASCADE,
    content_id UUID NOT NULL REFERENCES app.discovery_content_items(id) ON DELETE CASCADE,
    interaction_type TEXT NOT NULL,
    interaction_context JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    version INTEGER NOT NULL DEFAULT 1,
    CONSTRAINT mobile_user_article_interactions_type_check
        CHECK (interaction_type IN ('worth_reading', 'helpful')),
    CONSTRAINT mobile_user_article_interactions_context_object_check
        CHECK (jsonb_typeof(interaction_context) = 'object')
);

CREATE UNIQUE INDEX IF NOT EXISTS mobile_user_article_interactions_unique
    ON app.mobile_user_article_interactions (user_id, content_id, interaction_type);

CREATE INDEX IF NOT EXISTS mobile_user_article_interactions_user_type_index
    ON app.mobile_user_article_interactions (user_id, interaction_type, created_at DESC);

CREATE INDEX IF NOT EXISTS mobile_user_article_interactions_content_index
    ON app.mobile_user_article_interactions (content_id);

CREATE TABLE IF NOT EXISTS app.mobile_user_article_feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES app.users(id) ON DELETE CASCADE,
    content_id UUID NOT NULL REFERENCES app.discovery_content_items(id) ON DELETE CASCADE,
    reason_id TEXT NOT NULL,
    feedback_context JSONB NOT NULL DEFAULT '{}'::jsonb,
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    version INTEGER NOT NULL DEFAULT 1,
    CONSTRAINT mobile_user_article_feedback_reason_format_check
        CHECK (reason_id ~ '^[a-z0-9_-]{2,64}$'),
    CONSTRAINT mobile_user_article_feedback_context_object_check
        CHECK (jsonb_typeof(feedback_context) = 'object')
);

CREATE UNIQUE INDEX IF NOT EXISTS mobile_user_article_feedback_unique_reason
    ON app.mobile_user_article_feedback (user_id, content_id, reason_id);

CREATE INDEX IF NOT EXISTS mobile_user_article_feedback_user_submitted_index
    ON app.mobile_user_article_feedback (user_id, submitted_at DESC);

CREATE INDEX IF NOT EXISTS mobile_user_article_feedback_content_index
    ON app.mobile_user_article_feedback (content_id);

DROP TRIGGER IF EXISTS mobile_user_bookmarks_set_updated_at_and_version
    ON app.mobile_user_bookmarks;

CREATE TRIGGER mobile_user_bookmarks_set_updated_at_and_version
    BEFORE UPDATE ON app.mobile_user_bookmarks
    FOR EACH ROW
    EXECUTE FUNCTION app.set_updated_at_and_version();

DROP TRIGGER IF EXISTS mobile_user_article_interactions_set_updated_at_and_version
    ON app.mobile_user_article_interactions;

CREATE TRIGGER mobile_user_article_interactions_set_updated_at_and_version
    BEFORE UPDATE ON app.mobile_user_article_interactions
    FOR EACH ROW
    EXECUTE FUNCTION app.set_updated_at_and_version();

DROP TRIGGER IF EXISTS mobile_user_article_feedback_set_updated_at_and_version
    ON app.mobile_user_article_feedback;

CREATE TRIGGER mobile_user_article_feedback_set_updated_at_and_version
    BEFORE UPDATE ON app.mobile_user_article_feedback
    FOR EACH ROW
    EXECUTE FUNCTION app.set_updated_at_and_version();
