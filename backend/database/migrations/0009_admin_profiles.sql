-- Poster Core Backend
-- Migration: 0009_admin_profiles
--
-- Stores editable personal profile and business-contact
-- information for authenticated Poster Admin operators.
--
-- This table is separate from Poster Business Identity.
-- Values here must not automatically become public.

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

    IF to_regclass('app.admin_audit_entries') IS NULL THEN
        RAISE EXCEPTION
            'Required table app.admin_audit_entries does not exist.';
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

CREATE TABLE app.admin_profiles (
    user_id uuid PRIMARY KEY
        REFERENCES app.users(id)
        ON DELETE CASCADE,

    display_name text NOT NULL,
    job_title text,

    business_email text,
    primary_phone text,
    alternate_phone text,

    signal_account text,
    telegram_username text,

    preferred_language text NOT NULL
        DEFAULT 'en',

    time_zone text NOT NULL
        DEFAULT 'Asia/Kolkata',

    created_at timestamp with time zone
        NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at timestamp with time zone
        NOT NULL DEFAULT CURRENT_TIMESTAMP,

    row_version bigint NOT NULL DEFAULT 1,

    CONSTRAINT admin_profiles_display_name_not_blank
        CHECK (length(btrim(display_name)) >= 1),

    CONSTRAINT admin_profiles_job_title_not_blank
        CHECK (
            job_title IS NULL
            OR length(btrim(job_title)) >= 1
        ),

    CONSTRAINT admin_profiles_business_email_normalized
        CHECK (
            business_email IS NULL
            OR business_email = lower(btrim(business_email))
        ),

    CONSTRAINT admin_profiles_primary_phone_not_blank
        CHECK (
            primary_phone IS NULL
            OR length(btrim(primary_phone)) >= 7
        ),

    CONSTRAINT admin_profiles_alternate_phone_not_blank
        CHECK (
            alternate_phone IS NULL
            OR length(btrim(alternate_phone)) >= 7
        ),

    CONSTRAINT admin_profiles_signal_not_blank
        CHECK (
            signal_account IS NULL
            OR length(btrim(signal_account)) >= 2
        ),

    CONSTRAINT admin_profiles_telegram_not_blank
        CHECK (
            telegram_username IS NULL
            OR length(btrim(telegram_username)) >= 2
        ),

    CONSTRAINT admin_profiles_language_valid
        CHECK (
            preferred_language IN (
                'en',
                'hi'
            )
        ),

    CONSTRAINT admin_profiles_time_zone_not_blank
        CHECK (length(btrim(time_zone)) >= 1),

    CONSTRAINT admin_profiles_row_version_valid
        CHECK (row_version >= 1)
);

CREATE TRIGGER admin_profiles_set_updated_at_and_version
    BEFORE UPDATE ON app.admin_profiles
    FOR EACH ROW
    EXECUTE FUNCTION app.set_updated_at_and_version();

REVOKE ALL
ON TABLE app.admin_profiles
FROM PUBLIC;

GRANT
    SELECT,
    INSERT,
    UPDATE,
    DELETE
ON TABLE app.admin_profiles
TO poster_app;

COMMENT ON TABLE app.admin_profiles IS
    'Editable personal profile and internal contact information for Poster Admin operators.';

COMMENT ON COLUMN app.admin_profiles.business_email IS
    'Internal operator business email. This is not the public Poster Business Identity email.';

COMMENT ON COLUMN app.admin_profiles.signal_account IS
    'Internal operator Signal contact. This is not automatically published externally.';
