-- Poster Core Backend
-- Migration: 0002_identity_and_organizations
--
-- Establishes authoritative identity, organization, membership,
-- session, email-verification, and password-recovery storage.
--
-- Raw authentication tokens must never be stored in these tables.
-- Only cryptographically secure token digests may be persisted.

DO $migration$
BEGIN
    IF to_regnamespace('app') IS NULL THEN
        RAISE EXCEPTION
            'Required application schema "app" does not exist.';
    END IF;
END;
$migration$;

CREATE OR REPLACE FUNCTION app.set_updated_at_and_version()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    NEW.row_version = OLD.row_version + 1;

    RETURN NEW;
END;
$function$;

CREATE TABLE app.users (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

    email text NOT NULL,
    password_hash text NOT NULL,
    full_name text NOT NULL,

    status text NOT NULL DEFAULT 'pending_verification',

    email_verified_at timestamp with time zone,
    last_login_at timestamp with time zone,

    failed_login_attempts integer NOT NULL DEFAULT 0,
    locked_until timestamp with time zone,

    created_at timestamp with time zone
        NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at timestamp with time zone
        NOT NULL DEFAULT CURRENT_TIMESTAMP,

    deleted_at timestamp with time zone,

    row_version bigint NOT NULL DEFAULT 1,

    CONSTRAINT users_email_not_blank
        CHECK (length(btrim(email)) >= 3),

    CONSTRAINT users_email_normalized
        CHECK (email = lower(btrim(email))),

    CONSTRAINT users_password_hash_not_blank
        CHECK (length(btrim(password_hash)) >= 20),

    CONSTRAINT users_full_name_not_blank
        CHECK (length(btrim(full_name)) >= 1),

    CONSTRAINT users_status_valid
        CHECK (
            status IN (
                'pending_verification',
                'active',
                'suspended',
                'disabled',
                'deleted'
            )
        ),

    CONSTRAINT users_failed_login_attempts_valid
        CHECK (failed_login_attempts >= 0),

    CONSTRAINT users_row_version_valid
        CHECK (row_version >= 1)
);

CREATE UNIQUE INDEX users_email_unique
    ON app.users (lower(email))
    WHERE deleted_at IS NULL;

CREATE INDEX users_status_index
    ON app.users (status)
    WHERE deleted_at IS NULL;

CREATE INDEX users_created_at_index
    ON app.users (created_at DESC);

CREATE TABLE app.organizations (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

    legal_name text NOT NULL,
    display_name text NOT NULL,

    website_url text,
    billing_email text,
    country_code text NOT NULL,

    status text NOT NULL DEFAULT 'pending',

    created_at timestamp with time zone
        NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at timestamp with time zone
        NOT NULL DEFAULT CURRENT_TIMESTAMP,

    suspended_at timestamp with time zone,
    closed_at timestamp with time zone,

    row_version bigint NOT NULL DEFAULT 1,

    CONSTRAINT organizations_legal_name_not_blank
        CHECK (length(btrim(legal_name)) >= 1),

    CONSTRAINT organizations_display_name_not_blank
        CHECK (length(btrim(display_name)) >= 1),

    CONSTRAINT organizations_website_url_not_blank
        CHECK (
            website_url IS NULL
            OR length(btrim(website_url)) >= 1
        ),

    CONSTRAINT organizations_billing_email_normalized
        CHECK (
            billing_email IS NULL
            OR billing_email = lower(btrim(billing_email))
        ),

    CONSTRAINT organizations_country_code_valid
        CHECK (country_code ~ '^[A-Z]{2}$'),

    CONSTRAINT organizations_status_valid
        CHECK (
            status IN (
                'pending',
                'active',
                'suspended',
                'closed'
            )
        ),

    CONSTRAINT organizations_row_version_valid
        CHECK (row_version >= 1)
);

CREATE INDEX organizations_status_index
    ON app.organizations (status);

CREATE INDEX organizations_created_at_index
    ON app.organizations (created_at DESC);

CREATE TABLE app.organization_memberships (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

    organization_id uuid NOT NULL
        REFERENCES app.organizations(id)
        ON DELETE CASCADE,

    user_id uuid NOT NULL
        REFERENCES app.users(id)
        ON DELETE CASCADE,

    role text NOT NULL DEFAULT 'viewer',
    status text NOT NULL DEFAULT 'invited',

    is_primary_contact boolean NOT NULL DEFAULT false,

    invited_by_user_id uuid
        REFERENCES app.users(id)
        ON DELETE SET NULL,

    invited_at timestamp with time zone,
    joined_at timestamp with time zone,
    suspended_at timestamp with time zone,
    revoked_at timestamp with time zone,

    created_at timestamp with time zone
        NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at timestamp with time zone
        NOT NULL DEFAULT CURRENT_TIMESTAMP,

    row_version bigint NOT NULL DEFAULT 1,

    CONSTRAINT organization_memberships_role_valid
        CHECK (
            role IN (
                'owner',
                'admin',
                'finance',
                'campaign_manager',
                'viewer'
            )
        ),

    CONSTRAINT organization_memberships_status_valid
        CHECK (
            status IN (
                'invited',
                'active',
                'suspended',
                'revoked'
            )
        ),

    CONSTRAINT organization_memberships_row_version_valid
        CHECK (row_version >= 1),

    CONSTRAINT organization_memberships_unique_user
        UNIQUE (organization_id, user_id)
);

CREATE UNIQUE INDEX organization_primary_contact_unique
    ON app.organization_memberships (organization_id)
    WHERE
        is_primary_contact = true
        AND status = 'active';

CREATE INDEX organization_memberships_user_index
    ON app.organization_memberships (
        user_id,
        status
    );

CREATE INDEX organization_memberships_organization_index
    ON app.organization_memberships (
        organization_id,
        status
    );

CREATE TABLE app.user_sessions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

    user_id uuid NOT NULL
        REFERENCES app.users(id)
        ON DELETE CASCADE,

    organization_id uuid
        REFERENCES app.organizations(id)
        ON DELETE SET NULL,

    refresh_token_digest text NOT NULL,

    ip_address inet,
    user_agent text,

    created_at timestamp with time zone
        NOT NULL DEFAULT CURRENT_TIMESTAMP,

    last_seen_at timestamp with time zone
        NOT NULL DEFAULT CURRENT_TIMESTAMP,

    expires_at timestamp with time zone NOT NULL,

    revoked_at timestamp with time zone,
    revocation_reason text,

    CONSTRAINT user_sessions_refresh_digest_not_blank
        CHECK (length(btrim(refresh_token_digest)) >= 32),

    CONSTRAINT user_sessions_expiry_valid
        CHECK (expires_at > created_at),

    CONSTRAINT user_sessions_revocation_reason_not_blank
        CHECK (
            revocation_reason IS NULL
            OR length(btrim(revocation_reason)) >= 1
        )
);

CREATE UNIQUE INDEX user_sessions_refresh_digest_unique
    ON app.user_sessions (refresh_token_digest);

CREATE INDEX user_sessions_active_user_index
    ON app.user_sessions (
        user_id,
        expires_at DESC
    )
    WHERE revoked_at IS NULL;

CREATE INDEX user_sessions_organization_index
    ON app.user_sessions (
        organization_id,
        expires_at DESC
    )
    WHERE
        organization_id IS NOT NULL
        AND revoked_at IS NULL;

CREATE TABLE app.email_verification_tokens (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

    user_id uuid NOT NULL
        REFERENCES app.users(id)
        ON DELETE CASCADE,

    token_digest text NOT NULL,
    purpose text NOT NULL DEFAULT 'signup',

    attempt_count integer NOT NULL DEFAULT 0,

    created_at timestamp with time zone
        NOT NULL DEFAULT CURRENT_TIMESTAMP,

    expires_at timestamp with time zone NOT NULL,

    consumed_at timestamp with time zone,
    invalidated_at timestamp with time zone,

    CONSTRAINT email_verification_digest_not_blank
        CHECK (length(btrim(token_digest)) >= 32),

    CONSTRAINT email_verification_purpose_valid
        CHECK (
            purpose IN (
                'signup',
                'email_change'
            )
        ),

    CONSTRAINT email_verification_attempt_count_valid
        CHECK (attempt_count >= 0),

    CONSTRAINT email_verification_expiry_valid
        CHECK (expires_at > created_at)
);

CREATE UNIQUE INDEX email_verification_token_digest_unique
    ON app.email_verification_tokens (token_digest);

CREATE INDEX email_verification_active_user_index
    ON app.email_verification_tokens (
        user_id,
        expires_at DESC
    )
    WHERE
        consumed_at IS NULL
        AND invalidated_at IS NULL;

CREATE TABLE app.password_reset_tokens (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

    user_id uuid NOT NULL
        REFERENCES app.users(id)
        ON DELETE CASCADE,

    token_digest text NOT NULL,

    requested_ip_address inet,
    requested_user_agent text,

    created_at timestamp with time zone
        NOT NULL DEFAULT CURRENT_TIMESTAMP,

    expires_at timestamp with time zone NOT NULL,

    consumed_at timestamp with time zone,
    invalidated_at timestamp with time zone,

    CONSTRAINT password_reset_digest_not_blank
        CHECK (length(btrim(token_digest)) >= 32),

    CONSTRAINT password_reset_expiry_valid
        CHECK (expires_at > created_at)
);

CREATE UNIQUE INDEX password_reset_token_digest_unique
    ON app.password_reset_tokens (token_digest);

CREATE INDEX password_reset_active_user_index
    ON app.password_reset_tokens (
        user_id,
        expires_at DESC
    )
    WHERE
        consumed_at IS NULL
        AND invalidated_at IS NULL;

CREATE TRIGGER users_set_updated_at_and_version
BEFORE UPDATE ON app.users
FOR EACH ROW
EXECUTE FUNCTION app.set_updated_at_and_version();

CREATE TRIGGER organizations_set_updated_at_and_version
BEFORE UPDATE ON app.organizations
FOR EACH ROW
EXECUTE FUNCTION app.set_updated_at_and_version();

CREATE TRIGGER organization_memberships_set_updated_at_and_version
BEFORE UPDATE ON app.organization_memberships
FOR EACH ROW
EXECUTE FUNCTION app.set_updated_at_and_version();

COMMENT ON TABLE app.users IS
    'Authoritative Client and Admin user identities.';

COMMENT ON TABLE app.organizations IS
    'Authoritative advertising-client and operational organizations.';

COMMENT ON TABLE app.organization_memberships IS
    'Organization-scoped user roles and membership status.';

COMMENT ON TABLE app.user_sessions IS
    'Revocable authenticated user sessions using refresh-token digests.';

COMMENT ON TABLE app.email_verification_tokens IS
    'Single-use email-verification token digests.';

COMMENT ON TABLE app.password_reset_tokens IS
    'Single-use password-recovery token digests.';