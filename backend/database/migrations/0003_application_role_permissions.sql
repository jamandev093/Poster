-- Poster Core Backend
-- Migration: 0003_application_role_permissions
--
-- Grants the restricted Poster application role access only to
-- the existing identity and authentication tables required by
-- the TypeScript Core Backend.
--
-- Client, Admin, and Mobile applications never connect directly
-- to PostgreSQL. Authorization remains enforced by the Backend.

DO $migration$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_roles
        WHERE rolname = 'poster_app'
    ) THEN
        RAISE EXCEPTION
            'Required PostgreSQL role "poster_app" does not exist.';
    END IF;

    IF to_regnamespace('app') IS NULL THEN
        RAISE EXCEPTION
            'Required application schema "app" does not exist.';
    END IF;

    IF to_regclass('app.users') IS NULL THEN
        RAISE EXCEPTION
            'Required table app.users does not exist.';
    END IF;

    IF to_regclass('app.organizations') IS NULL THEN
        RAISE EXCEPTION
            'Required table app.organizations does not exist.';
    END IF;

    IF to_regclass('app.organization_memberships') IS NULL THEN
        RAISE EXCEPTION
            'Required table app.organization_memberships does not exist.';
    END IF;

    IF to_regclass('app.user_sessions') IS NULL THEN
        RAISE EXCEPTION
            'Required table app.user_sessions does not exist.';
    END IF;

    IF to_regclass('app.email_verification_tokens') IS NULL THEN
        RAISE EXCEPTION
            'Required table app.email_verification_tokens does not exist.';
    END IF;

    IF to_regclass('app.password_reset_tokens') IS NULL THEN
        RAISE EXCEPTION
            'Required table app.password_reset_tokens does not exist.';
    END IF;
END;
$migration$;

REVOKE ALL
ON TABLE
    app.users,
    app.organizations,
    app.organization_memberships,
    app.user_sessions,
    app.email_verification_tokens,
    app.password_reset_tokens
FROM PUBLIC;

GRANT USAGE
ON SCHEMA app
TO poster_app;

GRANT
    SELECT,
    INSERT,
    UPDATE,
    DELETE
ON TABLE
    app.users,
    app.organizations,
    app.organization_memberships,
    app.user_sessions,
    app.email_verification_tokens,
    app.password_reset_tokens
TO poster_app;

GRANT EXECUTE
ON FUNCTION app.set_updated_at_and_version()
TO poster_app;

COMMENT ON TABLE app.email_verification_tokens IS
    'Single-use email-verification token digests accessible only through the Poster Core Backend.';

COMMENT ON TABLE app.password_reset_tokens IS
    'Single-use password-recovery token digests accessible only through the Poster Core Backend.';