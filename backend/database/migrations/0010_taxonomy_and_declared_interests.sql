-- Poster Core Backend
-- Migration: taxonomy_and_declared_interests
--
-- Establishes the canonical topic taxonomy, user-declared
-- interests, consent controls, and privacy configuration used
-- by aggregate Admin Audience Insights.
--
-- Admin reporting must expose aggregates only. Individual user
-- interest records must never be returned by an Admin analytics API.

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

    IF NOT EXISTS (
        SELECT 1
        FROM pg_roles
        WHERE rolname = 'poster_app'
    ) THEN
        RAISE EXCEPTION
            'Required PostgreSQL role "poster_app" does not exist.';
    END IF;

    IF to_regprocedure(
        'app.set_updated_at_and_version()'
    ) IS NULL THEN
        RAISE EXCEPTION
            'Required function app.set_updated_at_and_version() does not exist.';
    END IF;
END;
$migration$;

CREATE TABLE app.taxonomy_topics (
    id uuid PRIMARY KEY
        DEFAULT gen_random_uuid(),

    slug text NOT NULL,

    name text NOT NULL,

    description text,

    parent_topic_id uuid
        REFERENCES app.taxonomy_topics (
            id
        )
        ON DELETE RESTRICT,

    status text NOT NULL
        DEFAULT 'active',

    sort_order integer NOT NULL
        DEFAULT 0,

    created_at timestamp with time zone
        NOT NULL
        DEFAULT CURRENT_TIMESTAMP,

    updated_at timestamp with time zone
        NOT NULL
        DEFAULT CURRENT_TIMESTAMP,

    archived_at timestamp with time zone,

    row_version bigint NOT NULL
        DEFAULT 1,

    CONSTRAINT taxonomy_topics_slug_valid
        CHECK (
            slug = lower(slug)
            AND slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'
            AND char_length(slug)
                BETWEEN 2 AND 100
        ),

    CONSTRAINT taxonomy_topics_name_valid
        CHECK (
            char_length(
                btrim(name)
            )
            BETWEEN 2 AND 120
        ),

    CONSTRAINT taxonomy_topics_description_valid
        CHECK (
            description IS NULL
            OR char_length(
                btrim(description)
            )
            BETWEEN 1 AND 500
        ),

    CONSTRAINT taxonomy_topics_status_valid
        CHECK (
            status IN (
                'active',
                'inactive',
                'archived'
            )
        ),

    CONSTRAINT taxonomy_topics_sort_order_valid
        CHECK (
            sort_order >= 0
        ),

    CONSTRAINT taxonomy_topics_row_version_valid
        CHECK (
            row_version > 0
        ),

    CONSTRAINT taxonomy_topics_archive_state_valid
        CHECK (
            (
                status = 'archived'
                AND archived_at IS NOT NULL
            )
            OR (
                status <> 'archived'
                AND archived_at IS NULL
            )
        ),

    CONSTRAINT taxonomy_topics_not_self_parent
        CHECK (
            parent_topic_id IS NULL
            OR parent_topic_id <> id
        )
);

CREATE UNIQUE INDEX taxonomy_topics_slug_unique
    ON app.taxonomy_topics (
        lower(slug)
    );

CREATE UNIQUE INDEX taxonomy_topics_name_unique
    ON app.taxonomy_topics (
        lower(name)
    );

CREATE INDEX taxonomy_topics_parent_index
    ON app.taxonomy_topics (
        parent_topic_id,
        sort_order,
        name
    );

CREATE INDEX taxonomy_topics_active_index
    ON app.taxonomy_topics (
        sort_order,
        name
    )
    WHERE status = 'active';

CREATE TRIGGER taxonomy_topics_updated
BEFORE UPDATE
ON app.taxonomy_topics
FOR EACH ROW
EXECUTE FUNCTION app.set_updated_at_and_version();

CREATE TABLE app.user_declared_interests (
    user_id uuid NOT NULL
        REFERENCES app.users (
            id
        )
        ON DELETE CASCADE,

    topic_id uuid NOT NULL
        REFERENCES app.taxonomy_topics (
            id
        )
        ON DELETE RESTRICT,

    status text NOT NULL
        DEFAULT 'active',

    personalization_allowed boolean
        NOT NULL
        DEFAULT true,

    campaign_targeting_allowed boolean
        NOT NULL
        DEFAULT false,

    declared_at timestamp with time zone
        NOT NULL
        DEFAULT CURRENT_TIMESTAMP,

    consent_updated_at timestamp with time zone
        NOT NULL
        DEFAULT CURRENT_TIMESTAMP,

    removed_at timestamp with time zone,

    created_at timestamp with time zone
        NOT NULL
        DEFAULT CURRENT_TIMESTAMP,

    updated_at timestamp with time zone
        NOT NULL
        DEFAULT CURRENT_TIMESTAMP,

    row_version bigint NOT NULL
        DEFAULT 1,

    PRIMARY KEY (
        user_id,
        topic_id
    ),

    CONSTRAINT user_declared_interests_status_valid
        CHECK (
            status IN (
                'active',
                'removed'
            )
        ),

    CONSTRAINT user_declared_interests_row_version_valid
        CHECK (
            row_version > 0
        ),

    CONSTRAINT user_declared_interests_consent_time_valid
        CHECK (
            consent_updated_at >= declared_at
        ),

    CONSTRAINT user_declared_interests_removal_state_valid
        CHECK (
            (
                status = 'removed'
                AND removed_at IS NOT NULL
            )
            OR (
                status = 'active'
                AND removed_at IS NULL
            )
        ),

    CONSTRAINT user_declared_interests_removed_consent_valid
        CHECK (
            status = 'active'
            OR (
                personalization_allowed = false
                AND campaign_targeting_allowed = false
            )
        ),

    CONSTRAINT user_declared_interests_campaign_consent_valid
        CHECK (
            campaign_targeting_allowed = false
            OR personalization_allowed = true
        )
);

CREATE INDEX user_declared_interests_topic_active_index
    ON app.user_declared_interests (
        topic_id,
        user_id
    )
    WHERE status = 'active';

CREATE INDEX user_declared_interests_user_active_index
    ON app.user_declared_interests (
        user_id,
        topic_id
    )
    WHERE status = 'active';

CREATE INDEX user_declared_interests_campaign_eligible_index
    ON app.user_declared_interests (
        topic_id,
        user_id
    )
    WHERE
        status = 'active'
        AND campaign_targeting_allowed = true;

CREATE TRIGGER user_declared_interests_updated
BEFORE UPDATE
ON app.user_declared_interests
FOR EACH ROW
EXECUTE FUNCTION app.set_updated_at_and_version();

CREATE TABLE app.audience_privacy_settings (
    setting_key text PRIMARY KEY,

    minimum_reportable_audience integer
        NOT NULL
        DEFAULT 100,

    minimum_campaign_audience integer
        NOT NULL
        DEFAULT 100,

    created_at timestamp with time zone
        NOT NULL
        DEFAULT CURRENT_TIMESTAMP,

    updated_at timestamp with time zone
        NOT NULL
        DEFAULT CURRENT_TIMESTAMP,

    row_version bigint NOT NULL
        DEFAULT 1,

    CONSTRAINT audience_privacy_settings_key_valid
        CHECK (
            setting_key ~ '^[a-z0-9]+(?:_[a-z0-9]+)*$'
            AND char_length(setting_key)
                BETWEEN 2 AND 100
        ),

    CONSTRAINT audience_privacy_reportable_valid
        CHECK (
            minimum_reportable_audience
                BETWEEN 10 AND 1000000
        ),

    CONSTRAINT audience_privacy_campaign_valid
        CHECK (
            minimum_campaign_audience
                >= minimum_reportable_audience
            AND minimum_campaign_audience
                <= 1000000
        ),

    CONSTRAINT audience_privacy_row_version_valid
        CHECK (
            row_version > 0
        )
);

CREATE TRIGGER audience_privacy_settings_updated
BEFORE UPDATE
ON app.audience_privacy_settings
FOR EACH ROW
EXECUTE FUNCTION app.set_updated_at_and_version();

INSERT INTO app.audience_privacy_settings (
    setting_key,
    minimum_reportable_audience,
    minimum_campaign_audience
)
VALUES (
    'default',
    100,
    100
);

REVOKE ALL
ON TABLE
    app.taxonomy_topics,
    app.user_declared_interests,
    app.audience_privacy_settings
FROM PUBLIC;

GRANT
    SELECT,
    INSERT,
    UPDATE,
    DELETE
ON TABLE
    app.taxonomy_topics,
    app.user_declared_interests,
    app.audience_privacy_settings
TO poster_app;

COMMENT ON TABLE app.taxonomy_topics IS
    'Canonical Poster topic taxonomy used by personalization, discovery, and aggregate audience reporting.';

COMMENT ON TABLE app.user_declared_interests IS
    'Current user-declared topic interests and explicit personalization and campaign-targeting consent.';

COMMENT ON TABLE app.audience_privacy_settings IS
    'Backend-owned minimum audience thresholds for aggregate Admin reporting and campaign eligibility.';

COMMENT ON COLUMN app.user_declared_interests.campaign_targeting_allowed IS
    'Explicit consent for aggregate campaign audience estimation. This field must never permit individual-user exposure.';

COMMENT ON COLUMN app.audience_privacy_settings.minimum_reportable_audience IS
    'Topic counts below this threshold must be suppressed from Admin reporting.';

COMMENT ON COLUMN app.audience_privacy_settings.minimum_campaign_audience IS
    'Minimum consented aggregate audience required before a topic may be considered campaign eligible.';
