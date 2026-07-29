-- Poster Core Backend
-- Migration: 0008_commercial_request_workflow
--
-- Authoritative Client request, Admin review, linked campaign
-- draft, revision history, and immutable Admin audit foundation.
--
-- Approval does not make a campaign deliverable.

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

    IF to_regclass('app.organizations') IS NULL THEN
        RAISE EXCEPTION
            'Required table app.organizations does not exist.';
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

CREATE TABLE app.commercial_requests (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

    request_reference text NOT NULL,

    organization_id uuid NOT NULL
        REFERENCES app.organizations(id)
        ON DELETE CASCADE,

    submitted_by_user_id uuid NOT NULL
        REFERENCES app.users(id)
        ON DELETE RESTRICT,

    request_type text NOT NULL,
    status text NOT NULL DEFAULT 'pending_review',

    title text NOT NULL,
    objective text NOT NULL,
    destination_url text NOT NULL,

    requested_placements text[] NOT NULL,
    requested_start_date date NOT NULL,
    requested_end_date date NOT NULL,

    budget_minor_units bigint,
    currency_code text,

    creative_spec jsonb NOT NULL DEFAULT '{}'::jsonb,
    commercial_terms jsonb NOT NULL DEFAULT '{}'::jsonb,

    submitted_at timestamp with time zone
        NOT NULL DEFAULT CURRENT_TIMESTAMP,

    decided_at timestamp with time zone,

    decided_by_user_id uuid
        REFERENCES app.users(id)
        ON DELETE SET NULL,

    decision_note text,

    created_at timestamp with time zone
        NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at timestamp with time zone
        NOT NULL DEFAULT CURRENT_TIMESTAMP,

    row_version bigint NOT NULL DEFAULT 1,

    CONSTRAINT commercial_requests_reference_not_blank
        CHECK (length(btrim(request_reference)) >= 5),

    CONSTRAINT commercial_requests_type_valid
        CHECK (
            request_type IN (
                'direct_sponsorship',
                'affiliate'
            )
        ),

    CONSTRAINT commercial_requests_status_valid
        CHECK (
            status IN (
                'pending_review',
                'changes_requested',
                'approved',
                'rejected'
            )
        ),

    CONSTRAINT commercial_requests_title_not_blank
        CHECK (length(btrim(title)) >= 1),

    CONSTRAINT commercial_requests_objective_not_blank
        CHECK (length(btrim(objective)) >= 1),

    CONSTRAINT commercial_requests_destination_not_blank
        CHECK (length(btrim(destination_url)) >= 1),

    CONSTRAINT commercial_requests_placements_valid
        CHECK (
            cardinality(requested_placements)
                BETWEEN 1 AND 3
            AND requested_placements
                <@ ARRAY[
                    'home',
                    'search',
                    'trending'
                ]::text[]
        ),

    CONSTRAINT commercial_requests_schedule_valid
        CHECK (requested_end_date >= requested_start_date),

    CONSTRAINT commercial_requests_budget_valid
        CHECK (
            budget_minor_units IS NULL
            OR budget_minor_units >= 0
        ),

    CONSTRAINT commercial_requests_currency_valid
        CHECK (
            (
                budget_minor_units IS NULL
                AND currency_code IS NULL
            )
            OR
            (
                budget_minor_units IS NOT NULL
                AND currency_code ~ '^[A-Z]{3}$'
            )
        ),

    CONSTRAINT commercial_requests_creative_object
        CHECK (jsonb_typeof(creative_spec) = 'object'),

    CONSTRAINT commercial_requests_terms_object
        CHECK (jsonb_typeof(commercial_terms) = 'object'),

    CONSTRAINT commercial_requests_decision_consistent
        CHECK (
            (
                status = 'pending_review'
                AND decided_at IS NULL
                AND decided_by_user_id IS NULL
                AND decision_note IS NULL
            )
            OR
            (
                status IN (
                    'changes_requested',
                    'approved',
                    'rejected'
                )
                AND decided_at IS NOT NULL
                AND decided_by_user_id IS NOT NULL
            )
        ),

    CONSTRAINT commercial_requests_decision_note_not_blank
        CHECK (
            decision_note IS NULL
            OR length(btrim(decision_note)) >= 1
        ),

    CONSTRAINT commercial_requests_row_version_valid
        CHECK (row_version >= 1)
);

CREATE UNIQUE INDEX commercial_requests_reference_unique
    ON app.commercial_requests (request_reference);

CREATE INDEX commercial_requests_admin_queue_index
    ON app.commercial_requests (
        status,
        submitted_at DESC,
        id DESC
    );

CREATE INDEX commercial_requests_organization_index
    ON app.commercial_requests (
        organization_id,
        submitted_at DESC,
        id DESC
    );

CREATE TABLE app.commercial_request_revisions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

    request_id uuid NOT NULL
        REFERENCES app.commercial_requests(id)
        ON DELETE CASCADE,

    revision_number integer NOT NULL,

    submitted_by_user_id uuid NOT NULL
        REFERENCES app.users(id)
        ON DELETE RESTRICT,

    payload jsonb NOT NULL,

    created_at timestamp with time zone
        NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT commercial_request_revisions_number_valid
        CHECK (revision_number >= 1),

    CONSTRAINT commercial_request_revisions_payload_object
        CHECK (jsonb_typeof(payload) = 'object'),

    CONSTRAINT commercial_request_revisions_unique
        UNIQUE (request_id, revision_number)
);

CREATE INDEX commercial_request_revisions_request_index
    ON app.commercial_request_revisions (
        request_id,
        revision_number DESC
    );

CREATE TABLE app.monetization_campaigns (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

    campaign_reference text NOT NULL,

    source_request_id uuid
        REFERENCES app.commercial_requests(id)
        ON DELETE RESTRICT,

    organization_id uuid NOT NULL
        REFERENCES app.organizations(id)
        ON DELETE CASCADE,

    name text NOT NULL,
    campaign_type text NOT NULL,
    origin text NOT NULL,
    status text NOT NULL DEFAULT 'draft',

    placements text[] NOT NULL,

    scheduled_start_date date NOT NULL,
    scheduled_end_date date NOT NULL,

    readiness_status text NOT NULL DEFAULT 'pending_setup',
    commercial_status text NOT NULL DEFAULT 'pending_funding',
    delivery_eligible boolean NOT NULL DEFAULT false,

    created_by_user_id uuid NOT NULL
        REFERENCES app.users(id)
        ON DELETE RESTRICT,

    created_at timestamp with time zone
        NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at timestamp with time zone
        NOT NULL DEFAULT CURRENT_TIMESTAMP,

    row_version bigint NOT NULL DEFAULT 1,

    CONSTRAINT monetization_campaigns_reference_not_blank
        CHECK (length(btrim(campaign_reference)) >= 5),

    CONSTRAINT monetization_campaigns_name_not_blank
        CHECK (length(btrim(name)) >= 1),

    CONSTRAINT monetization_campaigns_type_valid
        CHECK (
            campaign_type IN (
                'poster_promotion',
                'affiliate',
                'direct_sponsorship',
                'programmatic'
            )
        ),

    CONSTRAINT monetization_campaigns_origin_valid
        CHECK (
            origin IN (
                'client_request',
                'admin_internal',
                'programmatic_provider'
            )
        ),

    CONSTRAINT monetization_campaigns_status_valid
        CHECK (
            status IN (
                'draft',
                'scheduled',
                'active',
                'paused',
                'ended',
                'disabled'
            )
        ),

    CONSTRAINT monetization_campaigns_placements_valid
        CHECK (
            cardinality(placements)
                BETWEEN 1 AND 3
            AND placements
                <@ ARRAY[
                    'home',
                    'search',
                    'trending'
                ]::text[]
        ),

    CONSTRAINT monetization_campaigns_schedule_valid
        CHECK (scheduled_end_date >= scheduled_start_date),

    CONSTRAINT monetization_campaigns_readiness_valid
        CHECK (
            readiness_status IN (
                'pending_setup',
                'ready',
                'blocked'
            )
        ),

    CONSTRAINT monetization_campaigns_commercial_valid
        CHECK (
            commercial_status IN (
                'approved',
                'pending_funding',
                'funded',
                'blocked'
            )
        ),

    CONSTRAINT monetization_campaigns_delivery_gate
        CHECK (
            delivery_eligible = false
            OR (
                status IN ('scheduled', 'active')
                AND readiness_status = 'ready'
                AND commercial_status IN ('approved', 'funded')
            )
        ),

    CONSTRAINT monetization_campaigns_row_version_valid
        CHECK (row_version >= 1)
);

CREATE UNIQUE INDEX monetization_campaigns_reference_unique
    ON app.monetization_campaigns (campaign_reference);

CREATE UNIQUE INDEX monetization_campaigns_source_request_unique
    ON app.monetization_campaigns (source_request_id)
    WHERE source_request_id IS NOT NULL;

CREATE INDEX monetization_campaigns_organization_index
    ON app.monetization_campaigns (
        organization_id,
        status,
        created_at DESC
    );

CREATE TABLE app.admin_audit_entries (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

    actor_user_id uuid
        REFERENCES app.users(id)
        ON DELETE SET NULL,

    action text NOT NULL,
    entity_type text NOT NULL,
    entity_id uuid NOT NULL,

    metadata jsonb NOT NULL DEFAULT '{}'::jsonb,

    occurred_at timestamp with time zone
        NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT admin_audit_entries_action_not_blank
        CHECK (length(btrim(action)) >= 1),

    CONSTRAINT admin_audit_entries_entity_type_not_blank
        CHECK (length(btrim(entity_type)) >= 1),

    CONSTRAINT admin_audit_entries_metadata_object
        CHECK (jsonb_typeof(metadata) = 'object')
);

CREATE INDEX admin_audit_entries_entity_index
    ON app.admin_audit_entries (
        entity_type,
        entity_id,
        occurred_at DESC
    );

CREATE INDEX admin_audit_entries_actor_index
    ON app.admin_audit_entries (
        actor_user_id,
        occurred_at DESC
    )
    WHERE actor_user_id IS NOT NULL;

CREATE TRIGGER commercial_requests_set_updated_at_and_version
    BEFORE UPDATE ON app.commercial_requests
    FOR EACH ROW
    EXECUTE FUNCTION app.set_updated_at_and_version();

CREATE TRIGGER monetization_campaigns_set_updated_at_and_version
    BEFORE UPDATE ON app.monetization_campaigns
    FOR EACH ROW
    EXECUTE FUNCTION app.set_updated_at_and_version();

REVOKE ALL
ON TABLE
    app.commercial_requests,
    app.commercial_request_revisions,
    app.monetization_campaigns,
    app.admin_audit_entries
FROM PUBLIC;

GRANT
    SELECT,
    INSERT,
    UPDATE,
    DELETE
ON TABLE
    app.commercial_requests,
    app.monetization_campaigns
TO poster_app;

GRANT
    SELECT,
    INSERT
ON TABLE
    app.commercial_request_revisions,
    app.admin_audit_entries
TO poster_app;

COMMENT ON TABLE app.commercial_requests IS
    'Authoritative advertising requests submitted by Client organizations for Admin review.';

COMMENT ON TABLE app.commercial_request_revisions IS
    'Immutable Client submission and resubmission history for one commercial request.';

COMMENT ON TABLE app.monetization_campaigns IS
    'Authoritative campaigns. Approval creates a draft that is not automatically eligible for delivery.';

COMMENT ON TABLE app.admin_audit_entries IS
    'Immutable audit history for sensitive Poster Admin decisions.';
