-- Poster Core Backend
-- Migration: copyright_cases
--
-- Establishes authoritative copyright and publisher-removal
-- case management, claimant identity information, individual
-- verification checks, evidence references, transactional
-- lifecycle decisions, and immutable audit history.
--
-- Copyright actions must remain discovery-focused:
-- remove Poster discovery records, enforce prevent-reimport
-- where authorized, and never republish protected works.

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

    IF to_regclass('app.discovery_content') IS NULL THEN
        RAISE EXCEPTION
            'Required table app.discovery_content does not exist.';
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

CREATE TABLE app.copyright_cases (
    id uuid PRIMARY KEY
        DEFAULT gen_random_uuid(),

    public_id text NOT NULL,

    request_type text NOT NULL,

    status text NOT NULL
        DEFAULT 'needs_action',

    content_id uuid NOT NULL
        REFERENCES app.discovery_content (
            id
        )
        ON DELETE RESTRICT,

    claimant_name text NOT NULL,

    claimant_type text NOT NULL,

    claimant_business_email text,

    claimant_website_url text,

    claimant_reference text,

    request_reason text NOT NULL,

    submitted_original_url text,

    supporting_information text,

    verification_status text NOT NULL
        DEFAULT 'pending',

    action_taken text,

    prevent_reimport boolean NOT NULL
        DEFAULT false,

    received_at timestamp with time zone
        NOT NULL
        DEFAULT CURRENT_TIMESTAMP,

    resolved_at timestamp with time zone,

    resolved_by_user_id uuid
        REFERENCES app.users (
            id
        )
        ON DELETE SET NULL,

    created_at timestamp with time zone
        NOT NULL
        DEFAULT CURRENT_TIMESTAMP,

    updated_at timestamp with time zone
        NOT NULL
        DEFAULT CURRENT_TIMESTAMP,

    row_version bigint NOT NULL
        DEFAULT 1,

    CONSTRAINT copyright_cases_public_id_valid
        CHECK (
            public_id ~ '^CR-[0-9]{4,}$'
        ),

    CONSTRAINT copyright_cases_request_type_valid
        CHECK (
            request_type IN (
                'copyright_strike',
                'copyright_request',
                'publisher_removal'
            )
        ),

    CONSTRAINT copyright_cases_status_valid
        CHECK (
            status IN (
                'needs_action',
                'removed',
                'resolved'
            )
        ),

    CONSTRAINT copyright_cases_claimant_name_valid
        CHECK (
            char_length(
                btrim(claimant_name)
            )
            BETWEEN 2 AND 200
        ),

    CONSTRAINT copyright_cases_claimant_type_valid
        CHECK (
            char_length(
                btrim(claimant_type)
            )
            BETWEEN 2 AND 200
        ),

    CONSTRAINT copyright_cases_claimant_email_valid
        CHECK (
            claimant_business_email IS NULL
            OR (
                char_length(
                    btrim(claimant_business_email)
                )
                BETWEEN 3 AND 320
                AND claimant_business_email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'
            )
        ),

    CONSTRAINT copyright_cases_claimant_website_valid
        CHECK (
            claimant_website_url IS NULL
            OR (
                claimant_website_url ~ '^https://'
                AND char_length(
                    claimant_website_url
                )
                BETWEEN 9 AND 2000
            )
        ),

    CONSTRAINT copyright_cases_reference_valid
        CHECK (
            claimant_reference IS NULL
            OR char_length(
                btrim(claimant_reference)
            )
            BETWEEN 2 AND 300
        ),

    CONSTRAINT copyright_cases_reason_valid
        CHECK (
            char_length(
                btrim(request_reason)
            )
            BETWEEN 10 AND 5000
        ),

    CONSTRAINT copyright_cases_original_url_valid
        CHECK (
            submitted_original_url IS NULL
            OR (
                submitted_original_url ~ '^https://'
                AND char_length(
                    submitted_original_url
                )
                BETWEEN 9 AND 3000
            )
        ),

    CONSTRAINT copyright_cases_supporting_information_valid
        CHECK (
            supporting_information IS NULL
            OR char_length(
                btrim(supporting_information)
            )
            BETWEEN 2 AND 10000
        ),

    CONSTRAINT copyright_cases_verification_status_valid
        CHECK (
            verification_status IN (
                'pending',
                'verified',
                'needs_review'
            )
        ),

    CONSTRAINT copyright_cases_action_taken_valid
        CHECK (
            action_taken IS NULL
            OR action_taken IN (
                'removed',
                'removed_prevent_reimport',
                'dismissed',
                'restored'
            )
        ),

    CONSTRAINT copyright_cases_row_version_valid
        CHECK (
            row_version > 0
        ),

    CONSTRAINT copyright_cases_lifecycle_valid
        CHECK (
            (
                status = 'needs_action'
                AND action_taken IS NULL
                AND resolved_at IS NULL
                AND resolved_by_user_id IS NULL
                AND prevent_reimport = false
            )
            OR (
                status = 'removed'
                AND action_taken IN (
                    'removed',
                    'removed_prevent_reimport'
                )
                AND resolved_at IS NOT NULL
                AND (
                    action_taken = 'removed_prevent_reimport'
                    OR prevent_reimport = false
                )
                AND (
                    action_taken <> 'removed_prevent_reimport'
                    OR prevent_reimport = true
                )
            )
            OR (
                status = 'resolved'
                AND action_taken IN (
                    'dismissed',
                    'restored'
                )
                AND resolved_at IS NOT NULL
                AND prevent_reimport = false
            )
        )
);

CREATE UNIQUE INDEX copyright_cases_public_id_unique
    ON app.copyright_cases (
        public_id
    );

CREATE INDEX copyright_cases_status_received_index
    ON app.copyright_cases (
        status,
        received_at DESC,
        id DESC
    );

CREATE INDEX copyright_cases_content_index
    ON app.copyright_cases (
        content_id,
        received_at DESC,
        id DESC
    );

CREATE INDEX copyright_cases_claimant_index
    ON app.copyright_cases (
        lower(claimant_name),
        received_at DESC,
        id DESC
    );

CREATE INDEX copyright_cases_verification_index
    ON app.copyright_cases (
        verification_status,
        status,
        received_at DESC,
        id DESC
    );

CREATE TRIGGER copyright_cases_updated
BEFORE UPDATE
ON app.copyright_cases
FOR EACH ROW
EXECUTE FUNCTION app.set_updated_at_and_version();

CREATE TABLE app.copyright_verification_checks (
    id uuid PRIMARY KEY
        DEFAULT gen_random_uuid(),

    case_id uuid NOT NULL
        REFERENCES app.copyright_cases (
            id
        )
        ON DELETE RESTRICT,

    check_key text NOT NULL,

    label text NOT NULL,

    status text NOT NULL
        DEFAULT 'review',

    detail text NOT NULL,

    verified_by_user_id uuid
        REFERENCES app.users (
            id
        )
        ON DELETE SET NULL,

    verified_at timestamp with time zone,

    created_at timestamp with time zone
        NOT NULL
        DEFAULT CURRENT_TIMESTAMP,

    updated_at timestamp with time zone
        NOT NULL
        DEFAULT CURRENT_TIMESTAMP,

    row_version bigint NOT NULL
        DEFAULT 1,

    CONSTRAINT copyright_verification_check_key_valid
        CHECK (
            check_key IN (
                'poster_content_match',
                'original_work_match',
                'claimant_identity_match',
                'business_contact_match',
                'source_context_match',
                'supporting_reference_match'
            )
        ),

    CONSTRAINT copyright_verification_label_valid
        CHECK (
            char_length(
                btrim(label)
            )
            BETWEEN 2 AND 200
        ),

    CONSTRAINT copyright_verification_status_valid
        CHECK (
            status IN (
                'passed',
                'review',
                'failed'
            )
        ),

    CONSTRAINT copyright_verification_detail_valid
        CHECK (
            char_length(
                btrim(detail)
            )
            BETWEEN 2 AND 3000
        ),

    CONSTRAINT copyright_verification_actor_valid
        CHECK (
            (
                verified_at IS NULL
                AND verified_by_user_id IS NULL
            )
            OR verified_at IS NOT NULL
        ),

    CONSTRAINT copyright_verification_row_version_valid
        CHECK (
            row_version > 0
        )
);

CREATE UNIQUE INDEX copyright_verification_case_key_unique
    ON app.copyright_verification_checks (
        case_id,
        check_key
    );

CREATE INDEX copyright_verification_case_status_index
    ON app.copyright_verification_checks (
        case_id,
        status,
        id
    );

CREATE TRIGGER copyright_verification_checks_updated
BEFORE UPDATE
ON app.copyright_verification_checks
FOR EACH ROW
EXECUTE FUNCTION app.set_updated_at_and_version();

CREATE TABLE app.copyright_evidence_references (
    id uuid PRIMARY KEY
        DEFAULT gen_random_uuid(),

    case_id uuid NOT NULL
        REFERENCES app.copyright_cases (
            id
        )
        ON DELETE RESTRICT,

    evidence_type text NOT NULL,

    label text NOT NULL,

    reference_value text NOT NULL,

    storage_object_key text,

    sha256_digest text,

    submitted_at timestamp with time zone
        NOT NULL
        DEFAULT CURRENT_TIMESTAMP,

    created_at timestamp with time zone
        NOT NULL
        DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT copyright_evidence_type_valid
        CHECK (
            evidence_type IN (
                'original_work_url',
                'supporting_url',
                'document',
                'screenshot',
                'correspondence',
                'publisher_reference',
                'other'
            )
        ),

    CONSTRAINT copyright_evidence_label_valid
        CHECK (
            char_length(
                btrim(label)
            )
            BETWEEN 2 AND 200
        ),

    CONSTRAINT copyright_evidence_reference_valid
        CHECK (
            char_length(
                btrim(reference_value)
            )
            BETWEEN 2 AND 5000
        ),

    CONSTRAINT copyright_evidence_storage_key_valid
        CHECK (
            storage_object_key IS NULL
            OR char_length(
                btrim(storage_object_key)
            )
            BETWEEN 2 AND 1000
        ),

    CONSTRAINT copyright_evidence_digest_valid
        CHECK (
            sha256_digest IS NULL
            OR sha256_digest ~ '^[a-f0-9]{64}$'
        )
);

CREATE INDEX copyright_evidence_case_index
    ON app.copyright_evidence_references (
        case_id,
        submitted_at DESC,
        id DESC
    );

CREATE TABLE app.copyright_case_audit_events (
    id uuid PRIMARY KEY
        DEFAULT gen_random_uuid(),

    case_id uuid NOT NULL
        REFERENCES app.copyright_cases (
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

    previous_status text,

    resulting_status text,

    metadata jsonb NOT NULL
        DEFAULT '{}'::jsonb,

    occurred_at timestamp with time zone
        NOT NULL
        DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT copyright_audit_action_valid
        CHECK (
            char_length(
                btrim(action)
            )
            BETWEEN 2 AND 300
        ),

    CONSTRAINT copyright_audit_actor_label_valid
        CHECK (
            char_length(
                btrim(actor_label)
            )
            BETWEEN 2 AND 200
        ),

    CONSTRAINT copyright_audit_previous_status_valid
        CHECK (
            previous_status IS NULL
            OR previous_status IN (
                'needs_action',
                'removed',
                'resolved'
            )
        ),

    CONSTRAINT copyright_audit_resulting_status_valid
        CHECK (
            resulting_status IS NULL
            OR resulting_status IN (
                'needs_action',
                'removed',
                'resolved'
            )
        ),

    CONSTRAINT copyright_audit_metadata_object_valid
        CHECK (
            jsonb_typeof(metadata) = 'object'
        )
);

CREATE INDEX copyright_case_audit_case_index
    ON app.copyright_case_audit_events (
        case_id,
        occurred_at DESC,
        id DESC
    );

CREATE OR REPLACE FUNCTION app.prevent_copyright_audit_mutation()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
BEGIN
    RAISE EXCEPTION
        'Copyright audit events are immutable.';

    RETURN NULL;
END;
$function$;

CREATE TRIGGER copyright_audit_prevent_update
BEFORE UPDATE
ON app.copyright_case_audit_events
FOR EACH ROW
EXECUTE FUNCTION app.prevent_copyright_audit_mutation();

CREATE TRIGGER copyright_audit_prevent_delete
BEFORE DELETE
ON app.copyright_case_audit_events
FOR EACH ROW
EXECUTE FUNCTION app.prevent_copyright_audit_mutation();

REVOKE ALL
ON TABLE
    app.copyright_cases,
    app.copyright_verification_checks,
    app.copyright_evidence_references,
    app.copyright_case_audit_events
FROM PUBLIC;

GRANT
    SELECT,
    INSERT,
    UPDATE
ON TABLE
    app.copyright_cases,
    app.copyright_verification_checks
TO poster_app;

GRANT
    SELECT,
    INSERT
ON TABLE
    app.copyright_evidence_references,
    app.copyright_case_audit_events
TO poster_app;

COMMENT ON TABLE app.copyright_cases IS
    'Authoritative copyright, rights-holder, and publisher-removal case records.';

COMMENT ON TABLE app.copyright_verification_checks IS
    'Structured cross-verification checks for affected content, original work, claimant identity, business contact, source context, and supporting references.';

COMMENT ON TABLE app.copyright_evidence_references IS
    'Metadata references for copyright evidence stored in approved secure object storage or external URLs.';

COMMENT ON TABLE app.copyright_case_audit_events IS
    'Append-only immutable audit history for copyright case decisions and verification actions.';

COMMENT ON COLUMN app.copyright_cases.prevent_reimport IS
    'Authoritative case-level decision requiring the linked discovery-content URL to remain excluded from future ingestion.';

COMMENT ON COLUMN app.copyright_evidence_references.storage_object_key IS
    'Secure object-storage key only; evidence binary data must not be stored directly in PostgreSQL.';

COMMENT ON COLUMN app.copyright_evidence_references.sha256_digest IS
    'Optional lowercase SHA-256 digest used for evidence-integrity verification.';