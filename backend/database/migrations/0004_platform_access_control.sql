-- Poster Core Backend
-- Migration: 0004_platform_access_control
--
-- Establishes authoritative platform-level Admin role assignments.
-- Organization membership roles remain organization-scoped and must
-- never grant access to the Poster operational Admin application.

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
END;
$migration$;

CREATE TABLE app.platform_role_assignments (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

    user_id uuid NOT NULL
        REFERENCES app.users(id)
        ON DELETE CASCADE,

    role text NOT NULL,

    status text NOT NULL DEFAULT 'active',

    granted_by_user_id uuid
        REFERENCES app.users(id)
        ON DELETE SET NULL,

    granted_at timestamp with time zone
        NOT NULL DEFAULT CURRENT_TIMESTAMP,

    revoked_at timestamp with time zone,

    created_at timestamp with time zone
        NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at timestamp with time zone
        NOT NULL DEFAULT CURRENT_TIMESTAMP,

    row_version bigint NOT NULL DEFAULT 1,

    CONSTRAINT platform_role_assignments_role_valid
        CHECK (
            role IN (
                'super_admin',
                'operations_admin',
                'content_moderator',
                'copyright_admin',
                'support_analyst',
                'analytics_viewer'
            )
        ),

    CONSTRAINT platform_role_assignments_status_valid
        CHECK (
            status IN (
                'active',
                'revoked'
            )
        ),

    CONSTRAINT platform_role_assignments_revocation_valid
        CHECK (
            (
                status = 'active'
                AND revoked_at IS NULL
            )
            OR
            (
                status = 'revoked'
                AND revoked_at IS NOT NULL
            )
        ),

    CONSTRAINT platform_role_assignments_row_version_valid
        CHECK (row_version >= 1),

    CONSTRAINT platform_role_assignments_self_grant_guard
        CHECK (
            granted_by_user_id IS NULL
            OR granted_by_user_id <> user_id
        )
);

CREATE UNIQUE INDEX platform_role_assignments_active_unique
    ON app.platform_role_assignments (
        user_id,
        role
    )
    WHERE
        status = 'active'
        AND revoked_at IS NULL;

CREATE INDEX platform_role_assignments_user_index
    ON app.platform_role_assignments (
        user_id,
        status
    );

CREATE INDEX platform_role_assignments_role_index
    ON app.platform_role_assignments (
        role,
        status
    );

CREATE TRIGGER platform_role_assignments_set_updated_at_and_version
    BEFORE UPDATE ON app.platform_role_assignments
    FOR EACH ROW
    EXECUTE FUNCTION app.set_updated_at_and_version();

REVOKE ALL
ON TABLE
    app.platform_role_assignments
FROM PUBLIC;

GRANT
    SELECT,
    INSERT,
    UPDATE,
    DELETE
ON TABLE
    app.platform_role_assignments
TO poster_app;

COMMENT ON TABLE app.platform_role_assignments IS
    'Authoritative platform-level Poster Admin role assignments. Organization roles do not grant platform Admin access.';