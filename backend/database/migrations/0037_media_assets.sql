-- Poster Core Backend
-- Migration: 0037_media_assets
--
-- Establishes Backend-owned media asset identity and storage
-- metadata without exposing physical storage paths to clients.
--
-- asset IDs are opaque outside the Backend.
-- Delivery URLs are runtime projections and are not persisted here.

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

CREATE TABLE app.media_assets (
    id uuid
        PRIMARY KEY
        DEFAULT gen_random_uuid(),

    purpose text
        NOT NULL,

    media_type text
        NOT NULL,

    file_name text
        NOT NULL,

    mime_type text
        NOT NULL,

    size_bytes bigint
        NOT NULL,

    storage_provider text
        NOT NULL,

    storage_bucket text
        NOT NULL,

    storage_object_key text
        NOT NULL,

    status text
        NOT NULL
        DEFAULT 'pending_upload',

    created_by_user_id uuid
        NOT NULL
        REFERENCES app.users(id)
        ON DELETE RESTRICT,

    created_at timestamp with time zone
        NOT NULL
        DEFAULT CURRENT_TIMESTAMP,

    updated_at timestamp with time zone
        NOT NULL
        DEFAULT CURRENT_TIMESTAMP,

    row_version bigint
        NOT NULL
        DEFAULT 1,

    CONSTRAINT media_assets_purpose_valid
        CHECK (
            purpose IN (
                'poster_promotion'
            )
        ),

    CONSTRAINT media_assets_media_type_valid
        CHECK (
            media_type IN (
                'image',
                'video'
            )
        ),

    CONSTRAINT media_assets_file_name_not_blank
        CHECK (
            length(
                btrim(
                    file_name
                )
            ) >= 1
        ),

    CONSTRAINT media_assets_file_name_length_valid
        CHECK (
            length(
                file_name
            ) <= 255
        ),

    CONSTRAINT media_assets_mime_type_not_blank
        CHECK (
            length(
                btrim(
                    mime_type
                )
            ) >= 1
        ),

    CONSTRAINT media_assets_mime_type_length_valid
        CHECK (
            length(
                mime_type
            ) <= 255
        ),

    CONSTRAINT media_assets_size_bytes_valid
        CHECK (
            size_bytes > 0
        ),

    CONSTRAINT media_assets_storage_provider_valid
        CHECK (
            storage_provider IN (
                'gcs'
            )
        ),

    CONSTRAINT media_assets_storage_bucket_not_blank
        CHECK (
            length(
                btrim(
                    storage_bucket
                )
            ) >= 1
        ),

    CONSTRAINT media_assets_storage_object_key_not_blank
        CHECK (
            length(
                btrim(
                    storage_object_key
                )
            ) >= 1
        ),

    CONSTRAINT media_assets_storage_object_key_length_valid
        CHECK (
            length(
                storage_object_key
            ) <= 1024
        ),

    CONSTRAINT media_assets_status_valid
        CHECK (
            status IN (
                'pending_upload',
                'ready',
                'failed',
                'deleted'
            )
        ),

    CONSTRAINT media_assets_row_version_valid
        CHECK (
            row_version >= 1
        ),

    CONSTRAINT media_assets_storage_locator_unique
        UNIQUE (
            storage_provider,
            storage_bucket,
            storage_object_key
        )
);

CREATE INDEX media_assets_purpose_status_created_index
    ON app.media_assets (
        purpose,
        status,
        created_at DESC
    );

CREATE INDEX media_assets_created_by_user_index
    ON app.media_assets (
        created_by_user_id,
        created_at DESC
    );

CREATE TRIGGER media_assets_set_updated_at_and_version
    BEFORE UPDATE ON app.media_assets
    FOR EACH ROW
    EXECUTE FUNCTION app.set_updated_at_and_version();

REVOKE ALL
ON TABLE app.media_assets
FROM PUBLIC;

GRANT
    SELECT,
    INSERT,
    UPDATE
ON TABLE app.media_assets
TO poster_app;

COMMENT ON TABLE app.media_assets IS
    'Authoritative Poster-owned media assets. Opaque asset identity is separated from Backend-owned physical storage location.';