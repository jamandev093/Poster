CREATE TABLE app.poster_promotion_creatives (
    campaign_id uuid PRIMARY KEY
        REFERENCES app.monetization_campaigns(id)
        ON DELETE CASCADE,

    purpose text NOT NULL,

    headline text NOT NULL,

    body text NOT NULL,

    call_to_action text NOT NULL,

    destination_url text NOT NULL,

    disclosure text NOT NULL
        DEFAULT 'Promoted by Poster',

    media_asset_id uuid,

    media_type text,

    media_file_name text,

    media_mime_type text,

    media_size_bytes bigint,

    created_at timestamp with time zone
        NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at timestamp with time zone
        NOT NULL DEFAULT CURRENT_TIMESTAMP,

    row_version bigint
        NOT NULL DEFAULT 1,

    CONSTRAINT poster_promotion_creatives_purpose_valid
        CHECK (
            length(btrim(purpose))
                BETWEEN 10 AND 2000
        ),

    CONSTRAINT poster_promotion_creatives_headline_valid
        CHECK (
            length(btrim(headline))
                BETWEEN 3 AND 120
        ),

    CONSTRAINT poster_promotion_creatives_body_valid
        CHECK (
            length(btrim(body))
                BETWEEN 10 AND 500
        ),

    CONSTRAINT poster_promotion_creatives_cta_valid
        CHECK (
            length(btrim(call_to_action))
                BETWEEN 2 AND 40
        ),

    CONSTRAINT poster_promotion_creatives_destination_valid
        CHECK (
            length(btrim(destination_url))
                BETWEEN 8 AND 2048
            AND destination_url
                ~* '^https?://'
        ),

    CONSTRAINT poster_promotion_creatives_disclosure_locked
        CHECK (
            disclosure =
                'Promoted by Poster'
        ),

    CONSTRAINT poster_promotion_creatives_media_all_or_none
        CHECK (
            (
                media_asset_id IS NULL
                AND media_type IS NULL
                AND media_file_name IS NULL
                AND media_mime_type IS NULL
                AND media_size_bytes IS NULL
            )
            OR
            (
                media_asset_id IS NOT NULL
                AND media_type IS NOT NULL
                AND media_file_name IS NOT NULL
                AND media_mime_type IS NOT NULL
                AND media_size_bytes IS NOT NULL
            )
        ),

    CONSTRAINT poster_promotion_creatives_media_type_valid
        CHECK (
            media_type IS NULL
            OR media_type IN (
                'image',
                'video'
            )
        ),

    CONSTRAINT poster_promotion_creatives_media_file_name_valid
        CHECK (
            media_file_name IS NULL
            OR length(btrim(media_file_name))
                BETWEEN 1 AND 255
        ),

    CONSTRAINT poster_promotion_creatives_media_mime_valid
        CHECK (
            media_mime_type IS NULL
            OR media_mime_type IN (
                'image/jpeg',
                'image/png',
                'image/webp',
                'video/mp4',
                'video/webm'
            )
        ),

    CONSTRAINT poster_promotion_creatives_media_size_valid
        CHECK (
            media_size_bytes IS NULL
            OR (
                media_size_bytes > 0
                AND (
                    (
                        media_type = 'image'
                        AND media_size_bytes <= 10485760
                    )
                    OR
                    (
                        media_type = 'video'
                        AND media_size_bytes <= 20971520
                    )
                )
            )
        ),

    CONSTRAINT poster_promotion_creatives_row_version_valid
        CHECK (
            row_version >= 1
        )
);

CREATE INDEX poster_promotion_creatives_media_asset_index
    ON app.poster_promotion_creatives (
        media_asset_id
    )
    WHERE media_asset_id IS NOT NULL;