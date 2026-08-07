-- Poster Core Backend
-- Migration: 0021_mobile_discovery_platform
--
-- Deep Backend foundation for Mobile Home, Search, and Trending.
--
-- Poster remains a discovery engine:
-- - metadata and original publisher URLs are authoritative
-- - full article publishing/copy-hosting is not introduced
-- - organic ranking happens before monetization/ad insertion
-- - Python AI services are represented by handoff metadata, not by
--   replacing the TypeScript API backend

DO $migration$
BEGIN
    IF to_regnamespace('app') IS NULL THEN
        RAISE EXCEPTION
            'Required application schema "app" does not exist.';
    END IF;
END;
$migration$;

CREATE TABLE app.discovery_sources (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

    source_key text NOT NULL,
    display_name text NOT NULL,

    homepage_url text NOT NULL,
    primary_domain text NOT NULL,

    acquisition_method text NOT NULL,
    status text NOT NULL DEFAULT 'active',

    language_code text NOT NULL DEFAULT 'en',
    region_code text,

    sync_policy jsonb NOT NULL DEFAULT '{}'::jsonb,
    copyright_policy jsonb NOT NULL DEFAULT '{}'::jsonb,
    metadata jsonb NOT NULL DEFAULT '{}'::jsonb,

    last_successful_sync_at timestamp with time zone,
    last_failed_sync_at timestamp with time zone,

    created_at timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
    row_version bigint NOT NULL DEFAULT 1,

    CONSTRAINT discovery_sources_key_not_blank
        CHECK (length(btrim(source_key)) >= 1),

    CONSTRAINT discovery_sources_name_not_blank
        CHECK (length(btrim(display_name)) >= 1),

    CONSTRAINT discovery_sources_homepage_url_valid
        CHECK (homepage_url ~* '^https?://'),

    CONSTRAINT discovery_sources_domain_not_blank
        CHECK (length(btrim(primary_domain)) >= 3),

    CONSTRAINT discovery_sources_acquisition_method_valid
        CHECK (
            acquisition_method IN (
                'official_api',
                'authorized_rss',
                'official_embed',
                'publisher_agreement',
                'link_only',
                'manual_seed'
            )
        ),

    CONSTRAINT discovery_sources_status_valid
        CHECK (
            status IN (
                'active',
                'paused',
                'blocked'
            )
        ),

    CONSTRAINT discovery_sources_sync_policy_object
        CHECK (jsonb_typeof(sync_policy) = 'object'),

    CONSTRAINT discovery_sources_copyright_policy_object
        CHECK (jsonb_typeof(copyright_policy) = 'object'),

    CONSTRAINT discovery_sources_metadata_object
        CHECK (jsonb_typeof(metadata) = 'object'),

    CONSTRAINT discovery_sources_row_version_valid
        CHECK (row_version >= 1)
);

CREATE TABLE app.discovery_publisher_domains (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

    domain text NOT NULL,
    publisher_name text NOT NULL,

    source_id uuid
        REFERENCES app.discovery_sources(id)
        ON DELETE SET NULL,

    status text NOT NULL DEFAULT 'active',

    category text,
    language_code text NOT NULL DEFAULT 'en',
    region_code text,

    opt_out_at timestamp with time zone,
    blocked_at timestamp with time zone,
    copyright_policy jsonb NOT NULL DEFAULT '{}'::jsonb,
    metadata jsonb NOT NULL DEFAULT '{}'::jsonb,

    created_at timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
    row_version bigint NOT NULL DEFAULT 1,

    CONSTRAINT discovery_publisher_domains_domain_not_blank
        CHECK (length(btrim(domain)) >= 3),

    CONSTRAINT discovery_publisher_domains_publisher_not_blank
        CHECK (length(btrim(publisher_name)) >= 1),

    CONSTRAINT discovery_publisher_domains_status_valid
        CHECK (
            status IN (
                'active',
                'paused',
                'blocked',
                'opted_out'
            )
        ),

    CONSTRAINT discovery_publisher_domains_copyright_policy_object
        CHECK (jsonb_typeof(copyright_policy) = 'object'),

    CONSTRAINT discovery_publisher_domains_metadata_object
        CHECK (jsonb_typeof(metadata) = 'object'),

    CONSTRAINT discovery_publisher_domains_row_version_valid
        CHECK (row_version >= 1)
);

CREATE TABLE app.discovery_content_items (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

    source_id uuid
        REFERENCES app.discovery_sources(id)
        ON DELETE SET NULL,

    publisher_domain_id uuid
        REFERENCES app.discovery_publisher_domains(id)
        ON DELETE SET NULL,

    external_content_id text NOT NULL,

    title text NOT NULL,
    excerpt text NOT NULL,

    original_url text NOT NULL,
    canonical_url text,

    image_url text,
    media_type text NOT NULL DEFAULT 'article',

    language_code text NOT NULL DEFAULT 'en',
    region_code text,

    category text,

    canonical_topic_ids jsonb NOT NULL DEFAULT '[]'::jsonb,
    evolving_topic_ids jsonb NOT NULL DEFAULT '[]'::jsonb,
    tags jsonb NOT NULL DEFAULT '[]'::jsonb,
    search_keywords jsonb NOT NULL DEFAULT '[]'::jsonb,

    metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
    ai_classification jsonb NOT NULL DEFAULT '{}'::jsonb,

    embedding_reference text,

    quality_score numeric(12, 6) NOT NULL DEFAULT 0,
    freshness_score numeric(12, 6) NOT NULL DEFAULT 0,
    popularity_score numeric(12, 6) NOT NULL DEFAULT 0,
    personalization_score numeric(12, 6) NOT NULL DEFAULT 0,
    trending_score numeric(12, 6) NOT NULL DEFAULT 0,
    ranking_score numeric(12, 6) NOT NULL DEFAULT 0,

    published_at timestamp with time zone,
    discovered_at timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,

    status text NOT NULL DEFAULT 'active',

    created_at timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
    row_version bigint NOT NULL DEFAULT 1,

    CONSTRAINT discovery_content_items_external_id_not_blank
        CHECK (length(btrim(external_content_id)) >= 1),

    CONSTRAINT discovery_content_items_title_not_blank
        CHECK (length(btrim(title)) >= 1),

    CONSTRAINT discovery_content_items_excerpt_not_blank
        CHECK (length(btrim(excerpt)) >= 1),

    CONSTRAINT discovery_content_items_original_url_valid
        CHECK (original_url ~* '^https?://'),

    CONSTRAINT discovery_content_items_canonical_url_valid
        CHECK (
            canonical_url IS NULL
            OR canonical_url ~* '^https?://'
        ),

    CONSTRAINT discovery_content_items_image_url_valid
        CHECK (
            image_url IS NULL
            OR image_url ~* '^https?://'
        ),

    CONSTRAINT discovery_content_items_media_type_valid
        CHECK (
            media_type IN (
                'article',
                'video',
                'audio',
                'research',
                'guide'
            )
        ),

    CONSTRAINT discovery_content_items_status_valid
        CHECK (
            status IN (
                'active',
                'hidden',
                'removed',
                'copyright_blocked'
            )
        ),

    CONSTRAINT discovery_content_items_canonical_topic_ids_array
        CHECK (jsonb_typeof(canonical_topic_ids) = 'array'),

    CONSTRAINT discovery_content_items_evolving_topic_ids_array
        CHECK (jsonb_typeof(evolving_topic_ids) = 'array'),

    CONSTRAINT discovery_content_items_tags_array
        CHECK (jsonb_typeof(tags) = 'array'),

    CONSTRAINT discovery_content_items_search_keywords_array
        CHECK (jsonb_typeof(search_keywords) = 'array'),

    CONSTRAINT discovery_content_items_metadata_object
        CHECK (jsonb_typeof(metadata) = 'object'),

    CONSTRAINT discovery_content_items_ai_classification_object
        CHECK (jsonb_typeof(ai_classification) = 'object'),

    CONSTRAINT discovery_content_items_row_version_valid
        CHECK (row_version >= 1)
);

CREATE TABLE app.discovery_ad_slots (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

    placement_key text NOT NULL,
    surface text NOT NULL,

    after_organic_index integer NOT NULL,

    commercial_type text NOT NULL,
    status text NOT NULL DEFAULT 'active',

    eligibility_rules jsonb NOT NULL DEFAULT '{}'::jsonb,
    frequency_rules jsonb NOT NULL DEFAULT '{}'::jsonb,

    created_at timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
    row_version bigint NOT NULL DEFAULT 1,

    CONSTRAINT discovery_ad_slots_placement_key_not_blank
        CHECK (length(btrim(placement_key)) >= 1),

    CONSTRAINT discovery_ad_slots_surface_valid
        CHECK (
            surface IN (
                'home',
                'search',
                'trending'
            )
        ),

    CONSTRAINT discovery_ad_slots_after_index_valid
        CHECK (after_organic_index >= 1),

    CONSTRAINT discovery_ad_slots_commercial_type_valid
        CHECK (
            commercial_type IN (
                'poster_promotion',
                'affiliate_promotion',
                'direct_sponsorship',
                'programmatic'
            )
        ),

    CONSTRAINT discovery_ad_slots_status_valid
        CHECK (
            status IN (
                'active',
                'paused',
                'blocked'
            )
        ),

    CONSTRAINT discovery_ad_slots_eligibility_rules_object
        CHECK (jsonb_typeof(eligibility_rules) = 'object'),

    CONSTRAINT discovery_ad_slots_frequency_rules_object
        CHECK (jsonb_typeof(frequency_rules) = 'object'),

    CONSTRAINT discovery_ad_slots_row_version_valid
        CHECK (row_version >= 1)
);

CREATE UNIQUE INDEX discovery_sources_source_key_unique
    ON app.discovery_sources (source_key);

CREATE UNIQUE INDEX discovery_publisher_domains_domain_unique
    ON app.discovery_publisher_domains (domain);

CREATE UNIQUE INDEX discovery_content_items_external_content_unique
    ON app.discovery_content_items (external_content_id);

CREATE INDEX discovery_content_items_home_feed_index
    ON app.discovery_content_items (
        status,
        ranking_score DESC,
        discovered_at DESC,
        id
    );

CREATE INDEX discovery_content_items_trending_feed_index
    ON app.discovery_content_items (
        status,
        trending_score DESC,
        discovered_at DESC,
        id
    );

CREATE INDEX discovery_content_items_category_index
    ON app.discovery_content_items (
        status,
        category,
        ranking_score DESC,
        discovered_at DESC
    );

CREATE INDEX discovery_content_items_language_region_index
    ON app.discovery_content_items (
        status,
        language_code,
        region_code,
        discovered_at DESC
    );

CREATE INDEX discovery_content_items_search_index
    ON app.discovery_content_items
    USING gin (
        to_tsvector(
            'simple',
            title || ' ' || excerpt || ' ' || coalesce(category, '')
        )
    );

CREATE INDEX discovery_content_items_topic_index
    ON app.discovery_content_items
    USING gin (canonical_topic_ids);

CREATE UNIQUE INDEX discovery_ad_slots_placement_unique
    ON app.discovery_ad_slots (placement_key);

CREATE INDEX discovery_ad_slots_surface_index
    ON app.discovery_ad_slots (
        status,
        surface,
        after_organic_index
    );

CREATE TRIGGER discovery_sources_set_updated_at_and_version
    BEFORE UPDATE ON app.discovery_sources
    FOR EACH ROW
    EXECUTE FUNCTION app.set_updated_at_and_version();

CREATE TRIGGER discovery_publisher_domains_set_updated_at_and_version
    BEFORE UPDATE ON app.discovery_publisher_domains
    FOR EACH ROW
    EXECUTE FUNCTION app.set_updated_at_and_version();

CREATE TRIGGER discovery_content_items_set_updated_at_and_version
    BEFORE UPDATE ON app.discovery_content_items
    FOR EACH ROW
    EXECUTE FUNCTION app.set_updated_at_and_version();

CREATE TRIGGER discovery_ad_slots_set_updated_at_and_version
    BEFORE UPDATE ON app.discovery_ad_slots
    FOR EACH ROW
    EXECUTE FUNCTION app.set_updated_at_and_version();

REVOKE ALL
ON TABLE
    app.discovery_sources,
    app.discovery_publisher_domains,
    app.discovery_content_items,
    app.discovery_ad_slots
FROM PUBLIC;

GRANT
    SELECT,
    INSERT,
    UPDATE,
    DELETE
ON TABLE
    app.discovery_sources,
    app.discovery_publisher_domains,
    app.discovery_content_items,
    app.discovery_ad_slots
TO poster_app;

COMMENT ON TABLE app.discovery_sources IS
    'Source registry for official APIs, authorized RSS, embeds, publisher agreements, link-only sources, and manual seed sources.';

COMMENT ON TABLE app.discovery_publisher_domains IS
    'Publisher/domain registry with opt-out, block, and copyright policy metadata.';

COMMENT ON TABLE app.discovery_content_items IS
    'Metadata-only discovery content used by Mobile Home, Search, and Trending. Original publisher URLs remain authoritative.';

COMMENT ON TABLE app.discovery_ad_slots IS
    'Surface-level commercial insertion contract. Organic feed ranking is computed before ad slot insertion.';
