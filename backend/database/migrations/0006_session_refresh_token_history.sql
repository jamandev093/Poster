-- Poster Core Backend
-- Migration: 0006_session_refresh_token_history
--
-- Stores only irreversible digests of refresh tokens that have
-- already been rotated out of an active session.
--
-- The history allows a previously used refresh token to be
-- identified as a replay attempt. Raw refresh tokens are never
-- stored in PostgreSQL.

DO $migration$
BEGIN
    IF to_regnamespace('app') IS NULL THEN
        RAISE EXCEPTION
            'Required application schema "app" does not exist.';
    END IF;

    IF to_regclass('app.user_sessions') IS NULL THEN
        RAISE EXCEPTION
            'Required table app.user_sessions does not exist.';
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM pg_roles
        WHERE rolname = 'poster_app'
    ) THEN
        RAISE EXCEPTION
            'Required PostgreSQL role "poster_app" does not exist.';
    END IF;
END;
$migration$;

CREATE TABLE app.user_session_refresh_token_history (
    id uuid PRIMARY KEY
        DEFAULT gen_random_uuid(),

    session_id uuid NOT NULL
        REFERENCES app.user_sessions(id)
        ON DELETE CASCADE,

    refresh_token_digest text NOT NULL,

    rotated_at timestamp with time zone
        NOT NULL,

    replay_detected_at timestamp with time zone,

    CONSTRAINT user_session_refresh_history_digest_not_blank
        CHECK (
            length(
                btrim(refresh_token_digest)
            ) >= 32
        ),

    CONSTRAINT user_session_refresh_history_replay_time_valid
        CHECK (
            replay_detected_at IS NULL
            OR replay_detected_at >= rotated_at
        )
);

CREATE UNIQUE INDEX user_session_refresh_history_digest_unique
    ON app.user_session_refresh_token_history (
        refresh_token_digest
    );

CREATE INDEX user_session_refresh_history_session_index
    ON app.user_session_refresh_token_history (
        session_id,
        rotated_at DESC
    );

REVOKE ALL
ON TABLE
    app.user_session_refresh_token_history
FROM PUBLIC;

GRANT
    SELECT,
    INSERT,
    UPDATE,
    DELETE
ON TABLE
    app.user_session_refresh_token_history
TO poster_app;

COMMENT ON TABLE app.user_session_refresh_token_history IS
    'Irreversible digests of rotated refresh tokens used for replay detection.';

COMMENT ON COLUMN app.user_session_refresh_token_history.refresh_token_digest IS
    'SHA-256 digest only. A raw refresh token must never be persisted.';

COMMENT ON COLUMN app.user_session_refresh_token_history.replay_detected_at IS
    'First time a rotated token was presented again.';