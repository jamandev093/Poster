-- Poster Core Backend
-- Migration: content_and_sources
--
-- Establishes authoritative publisher/source management,
-- discovery-content records, removal safeguards, prevent-reimport
-- controls, and immutable operational audit history.
--
-- Poster remains a discovery engine. Content records point to
-- original publisher URLs and must not contain unauthorized
-- republished full article bodies or rehosted publisher media.

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

    IF to_regprocedure(
        'app.set_updated_at_and_version()'
    ) IS NULL THEN
        RAISE EXCEPTION
            'Required function app.set_updated_at_and_version() does not exist.';
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

CREATE TABLE app.content_sources (
    id uuid PRIMARY KEY
        DEFAULT gen_random_uuid(),

    public_id text NOT NULL,

    name text NOT NULL,

    website_url text NOT NULL,

    acquisition_method text NOT NULL,

    status text NOT NULL
        DEFAULT 'active',

    health text NOT NULL
        DEFAULT 'healthy',

    display_policy text NOT NULL,

    operational_note text,

    last_sync_at timestamp with time zone,

    last_sync_error text,

    created_at timestamp with time zone
        NOT NULL
        DEFAULT CURRENT_TIMESTAMP,

    updated_at timestamp with time zone
        NOT NULL
        DEFAULT CURRENT_TIMESTAMP,

    paused_at timestamp with time zone,

    blocked_at timestamp with time zone,

    row_version bigint NOT NULL
        DEFAULT 1,

    CONSTRAINT content_sources_public_id_valid
        CHECK (
            public_id ~ '^SRC-[0-9]{4,}$'
        ),

    CONSTRAINT content_sources_name_valid
        CHECK (
            char_length(
                btrim(name)
            )
            BETWEEN 2 AND 200
        ),

    CONSTRAINT content_sources_website_url_valid
        CHECK (
            website_url ~ '^https://'
            AND char_length(website_url)
                BETWEEN 9 AND 2000
        ),

    CONSTRAINT content_sources_method_valid
        CHECK (
            acquisition_method IN (
                'api',
                'rss',
                'embed',
                'agreement',
                'link_only'
            )
        ),

    CONSTRAINT content_sources_status_valid
        CHECK (
            status IN (
                'active',
                'paused',
                'blocked'
            )
        ),

    CONSTRAINT content_sources_health_valid
        CHECK (
            health IN (
                'healthy',
                'issue',
                'offline'
            )
        ),

    CONSTRAINT content_sources_display_policy_valid
        CHECK (
            char_length(
                btrim(display_policy)
            )
            BETWEEN 1 AND 1000
        ),

    CONSTRAINT content_sources_note_valid
        CHECK (
            operational_note IS NULL
            OR char_length(
                btrim(operational_note)
            )
            BETWEEN 1 AND 2000
        ),

    CONSTRAINT content_sources_sync_error_valid
        CHECK (
            last_sync_error IS NULL
            OR char_length(
                btrim(last_sync_error)
            )
            BETWEEN 1 AND 2000
        ),

    CONSTRAINT content_sources_row_version_valid
        CHECK (
            row_version > 0
        ),

    CONSTRAINT content_sources_lifecycle_valid
        CHECK (
            (
                status = 'active'
                AND paused_at IS NULL
                AND blocked_at IS NULL
            )
            OR (
                status = 'paused'
                AND paused_at IS NOT NULL
                AND blocked_at IS NULL
            )
            OR (
                status = 'blocked'
                AND blocked_at IS NOT NULL
            )
        )
);

CREATE UNIQUE INDEX content_sources_public_id_unique
    ON app.content_sources (
        public_id
    );

CREATE UNIQUE INDEX content_sources_website_url_unique
    ON app.content_sources (
        lower(website_url)
    );

CREATE INDEX content_sources_status_index
    ON app.content_sources (
        status,
        name,
        id
    );

CREATE INDEX content_sources_health_index
    ON app.content_sources (
        health,
        last_sync_at,
        id
    );

CREATE TRIGGER content_sources_updated
BEFORE UPDATE
ON app.content_sources
FOR EACH ROW
EXECUTE FUNCTION app.set_updated_at_and_version();

CREATE TABLE app.discovery_content (
    id uuid PRIMARY KEY
        DEFAULT gen_random_uuid(),

    public_id text NOT NULL,

    source_id uuid NOT NULL
        REFERENCES app.content_sources (
            id
        )
        ON DELETE RESTRICT,

    title text NOT NULL,

    publisher_name text NOT NULL,

    original_url text NOT NULL,

    acquisition_method text NOT NULL,

    status text NOT NULL
        DEFAULT 'active',

    published_at timestamp with time zone,

    added_at timestamp with time zone
        NOT NULL
        DEFAULT CURRENT_TIMESTAMP,

    removed_at timestamp with time zone,

    removal_reason text,

    removal_note text,

    copyright_case_id text,

    copyright_claimant text,

    prevent_reimport boolean NOT NULL
        DEFAULT false,

    created_at timestamp with time zone
        NOT NULL
        DEFAULT CURRENT_TIMESTAMP,

    updated_at timestamp with time zone
        NOT NULL
        DEFAULT CURRENT_TIMESTAMP,

    row_version bigint NOT NULL
        DEFAULT 1,

    CONSTRAINT discovery_content_public_id_valid
        CHECK (
            public_id ~ '^CNT-[0-9]{4,}$'
        ),

    CONSTRAINT discovery_content_title_valid
        CHECK (
            char_length(
                btrim(title)
            )
            BETWEEN 2 AND 500
        ),

    CONSTRAINT discovery_content_publisher_valid
        CHECK (
            char_length(
                btrim(publisher_name)
            )
            BETWEEN 2 AND 200
        ),

    CONSTRAINT discovery_content_original_url_valid
        CHECK (
            original_url ~ '^https://'
            AND char_length(original_url)
                BETWEEN 9 AND 3000
        ),

    CONSTRAINT discovery_content_method_valid
        CHECK (
            acquisition_method IN (
                'api',
                'rss',
                'embed',
                'agreement',
                'link_only'
            )
        ),

    CONSTRAINT discovery_content_status_valid
        CHECK (
            status IN (
                'active',
                'removed'
            )
        ),

    CONSTRAINT discovery_content_removal_reason_valid
        CHECK (
            removal_reason IS NULL
            OR removal_reason IN (
                'copyright',
                'publisher_request',
                'misleading_unsafe',
                'broken_unavailable',
                'other'
            )
        ),

    CONSTRAINT discovery_content_removal_note_valid
        CHECK (
            removal_note IS NULL
            OR char_length(
                btrim(removal_note)
            )
            BETWEEN 1 AND 2000
        ),

    CONSTRAINT discovery_content_copyright_case_valid
        CHECK (
            copyright_case_id IS NULL
            OR char_length(
                btrim(copyright_case_id)
            )
            BETWEEN 2 AND 100
        ),

    CONSTRAINT discovery_content_copyright_claimant_valid
        CHECK (
            copyright_claimant IS NULL
            OR char_length(
                btrim(copyright_claimant)
            )
            BETWEEN 2 AND 200
        ),

    CONSTRAINT discovery_content_row_version_valid
        CHECK (
            row_version > 0
        ),

    CONSTRAINT discovery_content_removal_state_valid
        CHECK (
            (
                status = 'active'
                AND removed_at IS NULL
                AND removal_reason IS NULL
                AND removal_note IS NULL
            )
            OR (
                status = 'removed'
                AND removed_at IS NOT NULL
                AND removal_reason IS NOT NULL
            )
        ),

    CONSTRAINT discovery_content_copyright_fields_valid
        CHECK (
            removal_reason = 'copyright'
            OR (
                copyright_case_id IS NULL
                AND copyright_claimant IS NULL
            )
        ),

    CONSTRAINT discovery_content_prevent_reimport_valid
        CHECK (
            prevent_reimport = false
            OR status = 'removed'
        )
);

CREATE UNIQUE INDEX discovery_content_public_id_unique
    ON app.discovery_content (
        public_id
    );

CREATE UNIQUE INDEX discovery_content_original_url_unique
    ON app.discovery_content (
        lower(original_url)
    );

CREATE INDEX discovery_content_source_status_index
    ON app.discovery_content (
        source_id,
        status,
        added_at DESC,
        id
    );

CREATE INDEX discovery_content_status_index
    ON app.discovery_content (
        status,
        added_at DESC,
        id
    );

CREATE INDEX discovery_content_prevent_reimport_index
    ON app.discovery_content (
        lower(original_url)
    )
    WHERE prevent_reimport = true;

CREATE INDEX discovery_content_copyright_case_index
    ON app.discovery_content (
        copyright_case_id
    )
    WHERE copyright_case_id IS NOT NULL;

CREATE TRIGGER discovery_content_updated
BEFORE UPDATE
ON app.discovery_content
FOR EACH ROW
EXECUTE FUNCTION app.set_updated_at_and_version();

CREATE TABLE app.content_source_audit_events (
    id uuid PRIMARY KEY
        DEFAULT gen_random_uuid(),

    entity_type text NOT NULL,

    source_id uuid
        REFERENCES app.content_sources (
            id
        )
        ON DELETE RESTRICT,

    content_id uuid
        REFERENCES app.discovery_content (
            id
        )
        ON DELETE RESTRICT,

    action text NOT NULL,

    actor_user_id uuid
        REFERENCES app.users (
            id
        )
        ON DELETE SET NULL,

    actor_label text NOT NULL,

    metadata jsonb NOT NULL
        DEFAULT '{}'::jsonb,

    occurred_at timestamp with time zone
        NOT NULL
        DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT content_source_audit_entity_type_valid
        CHECK (
            entity_type IN (
                'source',
                'content'
            )
        ),

    CONSTRAINT content_source_audit_entity_reference_valid
        CHECK (
            (
                entity_type = 'source'
                AND source_id IS NOT NULL
                AND content_id IS NULL
            )
            OR (
                entity_type = 'content'
                AND content_id IS NOT NULL
                AND source_id IS NULL
            )
        ),

    CONSTRAINT content_source_audit_action_valid
        CHECK (
            char_length(
                btrim(action)
            )
            BETWEEN 2 AND 300
        ),

    CONSTRAINT content_source_audit_actor_label_valid
        CHECK (
            char_length(
                btrim(actor_label)
            )
            BETWEEN 2 AND 200
        ),

    CONSTRAINT content_source_audit_metadata_object_valid
        CHECK (
            jsonb_typeof(metadata) = 'object'
        )
);

CREATE INDEX content_source_audit_source_index
    ON app.content_source_audit_events (
        source_id,
        occurred_at DESC,
        id DESC
    )
    WHERE source_id IS NOT NULL;

CREATE INDEX content_source_audit_content_index
    ON app.content_source_audit_events (
        content_id,
        occurred_at DESC,
        id DESC
    )
    WHERE content_id IS NOT NULL;

CREATE OR REPLACE FUNCTION app.prevent_content_source_audit_mutation()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
BEGIN
    RAISE EXCEPTION
        'Content and source audit events are immutable.';

    RETURN NULL;
END;
$function$;

CREATE TRIGGER content_source_audit_prevent_update
BEFORE UPDATE
ON app.content_source_audit_events
FOR EACH ROW
EXECUTE FUNCTION app.prevent_content_source_audit_mutation();

CREATE TRIGGER content_source_audit_prevent_delete
BEFORE DELETE
ON app.content_source_audit_events
FOR EACH ROW
EXECUTE FUNCTION app.prevent_content_source_audit_mutation();

REVOKE ALL
ON TABLE
    app.content_sources,
    app.discovery_content,
    app.content_source_audit_events
FROM PUBLIC;

GRANT
    SELECT,
    INSERT,
    UPDATE,
    DELETE
ON TABLE
    app.content_sources,
    app.discovery_content
TO poster_app;

GRANT
    SELECT,
    INSERT
ON TABLE
    app.content_source_audit_events
TO poster_app;

COMMENT ON TABLE app.content_sources IS
    'Authoritative Poster publisher/source registry and ingestion-health state.';

COMMENT ON TABLE app.discovery_content IS
    'Discovery-only content metadata that redirects users to original publisher URLs.';

COMMENT ON TABLE app.content_source_audit_events IS
    'Append-only immutable operational audit events for content and source lifecycle actions.';

COMMENT ON COLUMN app.discovery_content.original_url IS
    'Original publisher URL used for discovery redirection.';

COMMENT ON COLUMN app.discovery_content.prevent_reimport IS
    'Blocks future ingestion of the same original URL after an authorized removal decision.';

COMMENT ON COLUMN app.discovery_content.acquisition_method IS
    'Historical acquisition-method snapshot retained even if the source method changes later.';