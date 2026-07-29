-- Poster Core Backend
-- Migration: 0005_admin_user_metrics_indexes
--
-- Adds read-performance indexes for authoritative Admin user metrics.
-- Metric values remain derived from app.users and app.user_sessions.
-- No duplicated counter table or mutable analytics total is introduced.

DO $migration$
BEGIN
    IF to_regnamespace('app') IS NULL THEN
        RAISE EXCEPTION
            'Required application schema "app" does not exist.';
    END IF;

    IF to_regclass('app.users') IS NULL THEN
        RAISE EXCEPTION
            'Required table app.users does not exist.';
    END IF;

    IF to_regclass('app.user_sessions') IS NULL THEN
        RAISE EXCEPTION
            'Required table app.user_sessions does not exist.';
    END IF;
END;
$migration$;

CREATE INDEX users_non_deleted_metrics_index
    ON app.users (id)
    WHERE deleted_at IS NULL;

CREATE INDEX user_sessions_activity_metrics_index
    ON app.user_sessions (
        last_seen_at DESC,
        user_id
    );

CREATE INDEX user_sessions_live_activity_metrics_index
    ON app.user_sessions (
        last_seen_at DESC,
        expires_at DESC,
        user_id
    )
    WHERE revoked_at IS NULL;

COMMENT ON INDEX app.users_non_deleted_metrics_index IS
    'Supports exact Admin total-user metrics while excluding soft-deleted identities.';

COMMENT ON INDEX app.user_sessions_activity_metrics_index IS
    'Supports exact distinct-user activity metrics over rolling daily and monthly windows.';

COMMENT ON INDEX app.user_sessions_live_activity_metrics_index IS
    'Supports exact live-user metrics over recent unrevoked sessions.';