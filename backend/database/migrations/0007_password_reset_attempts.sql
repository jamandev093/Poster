-- Poster Core Backend
-- Migration: 0007_password_reset_attempts
--
-- Adds bounded failed-attempt tracking to password-reset
-- challenges. The raw six-digit reset code remains outside
-- PostgreSQL; only a salted SHA-256 digest is stored.

DO $migration$
BEGIN
    IF to_regnamespace('app') IS NULL THEN
        RAISE EXCEPTION
            'Required application schema "app" does not exist.';
    END IF;

    IF to_regclass('app.password_reset_tokens') IS NULL THEN
        RAISE EXCEPTION
            'Required table app.password_reset_tokens does not exist.';
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

ALTER TABLE app.password_reset_tokens
    ADD COLUMN attempt_count integer
        NOT NULL
        DEFAULT 0;

ALTER TABLE app.password_reset_tokens
    ADD CONSTRAINT password_reset_attempt_count_valid
        CHECK (
            attempt_count >= 0
        );

COMMENT ON COLUMN app.password_reset_tokens.attempt_count IS
    'Number of failed confirmation attempts for this password-reset challenge.';