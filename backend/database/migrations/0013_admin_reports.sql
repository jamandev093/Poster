BEGIN;

-- =========================================================
-- POSTER ADMIN REPORTS
-- =========================================================

CREATE TABLE admin_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  public_id TEXT NOT NULL UNIQUE,

  report_type TEXT NOT NULL
    CHECK (
      report_type IN (
        'misleading_content',
        'broken_link',
        'inappropriate_content',
        'publisher_issue',
        'commercial_report',
        'copyright'
      )
    ),

  status TEXT NOT NULL DEFAULT 'needs_action'
    CHECK (
      status IN (
        'needs_action',
        'resolved',
        'dismissed'
      )
    ),

  reporter_name TEXT NOT NULL,

  reporter_reference TEXT NOT NULL,

  affected_kind TEXT NOT NULL
    CHECK (
      affected_kind IN (
        'content',
        'source',
        'campaign'
      )
    ),

  affected_record_id TEXT NOT NULL,

  affected_title TEXT NOT NULL,

  affected_metadata TEXT NOT NULL,

  reason TEXT NOT NULL,

  routed_to_copyright BOOLEAN NOT NULL DEFAULT FALSE,

  copyright_case_id UUID NULL
    REFERENCES copyright_cases(id)
    ON DELETE RESTRICT,

  resolution_note TEXT NULL,

  received_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  resolved_at TIMESTAMPTZ NULL,

  resolved_by_user_id UUID NULL,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  row_version BIGINT NOT NULL DEFAULT 1,

  CONSTRAINT admin_reports_public_id_nonempty
    CHECK (
      length(trim(public_id)) > 0
    ),

  CONSTRAINT admin_reports_reporter_name_nonempty
    CHECK (
      length(trim(reporter_name)) > 0
    ),

  CONSTRAINT admin_reports_reporter_reference_nonempty
    CHECK (
      length(trim(reporter_reference)) > 0
    ),

  CONSTRAINT admin_reports_affected_record_id_nonempty
    CHECK (
      length(trim(affected_record_id)) > 0
    ),

  CONSTRAINT admin_reports_affected_title_nonempty
    CHECK (
      length(trim(affected_title)) > 0
    ),

  CONSTRAINT admin_reports_reason_nonempty
    CHECK (
      length(trim(reason)) > 0
    ),

  CONSTRAINT admin_reports_copyright_routing_consistency
    CHECK (
      (
        routed_to_copyright = FALSE
        AND copyright_case_id IS NULL
      )
      OR
      (
        routed_to_copyright = TRUE
        AND report_type = 'copyright'
        AND copyright_case_id IS NOT NULL
      )
    ),

  CONSTRAINT admin_reports_resolution_consistency
    CHECK (
      (
        status = 'needs_action'
        AND resolved_at IS NULL
        AND resolved_by_user_id IS NULL
      )
      OR
      (
        status IN (
          'resolved',
          'dismissed'
        )
        AND resolved_at IS NOT NULL
        AND resolved_by_user_id IS NOT NULL
      )
    )
);

CREATE INDEX admin_reports_status_received_idx
  ON admin_reports (
    status,
    received_at DESC
  );

CREATE INDEX admin_reports_type_status_idx
  ON admin_reports (
    report_type,
    status
  );

CREATE INDEX admin_reports_affected_record_idx
  ON admin_reports (
    affected_kind,
    affected_record_id
  );

CREATE INDEX admin_reports_copyright_case_idx
  ON admin_reports (
    copyright_case_id
  )
  WHERE copyright_case_id IS NOT NULL;

CREATE INDEX admin_reports_actionable_idx
  ON admin_reports (
    received_at DESC
  )
  WHERE status = 'needs_action';

-- =========================================================
-- IMMUTABLE REPORT AUDIT HISTORY
-- =========================================================

CREATE TABLE admin_report_audit_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  report_id UUID NOT NULL
    REFERENCES admin_reports(id)
    ON DELETE RESTRICT,

  action TEXT NOT NULL,

  actor_user_id UUID NULL,

  actor_label TEXT NOT NULL,

  previous_status TEXT NULL
    CHECK (
      previous_status IS NULL
      OR previous_status IN (
        'needs_action',
        'resolved',
        'dismissed'
      )
    ),

  resulting_status TEXT NULL
    CHECK (
      resulting_status IS NULL
      OR resulting_status IN (
        'needs_action',
        'resolved',
        'dismissed'
      )
    ),

  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,

  occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT admin_report_audit_action_nonempty
    CHECK (
      length(trim(action)) > 0
    ),

  CONSTRAINT admin_report_audit_actor_label_nonempty
    CHECK (
      length(trim(actor_label)) > 0
    ),

  CONSTRAINT admin_report_audit_metadata_object
    CHECK (
      jsonb_typeof(metadata) = 'object'
    )
);

CREATE INDEX admin_report_audit_report_time_idx
  ON admin_report_audit_events (
    report_id,
    occurred_at DESC
  );

CREATE INDEX admin_report_audit_actor_idx
  ON admin_report_audit_events (
    actor_user_id,
    occurred_at DESC
  )
  WHERE actor_user_id IS NOT NULL;

-- =========================================================
-- REPORT ROW VERSION AND UPDATED TIMESTAMP
-- =========================================================

CREATE OR REPLACE FUNCTION touch_admin_report_row()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  NEW.row_version = OLD.row_version + 1;

  RETURN NEW;
END;
$$;

CREATE TRIGGER admin_reports_touch_row
BEFORE UPDATE ON admin_reports
FOR EACH ROW
EXECUTE FUNCTION touch_admin_report_row();

-- =========================================================
-- IMMUTABILITY PROTECTION
-- =========================================================

CREATE OR REPLACE FUNCTION prevent_admin_report_audit_mutation()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  RAISE EXCEPTION
    'Admin report audit history is immutable';
END;
$$;

CREATE TRIGGER admin_report_audit_prevent_update
BEFORE UPDATE ON admin_report_audit_events
FOR EACH ROW
EXECUTE FUNCTION prevent_admin_report_audit_mutation();

CREATE TRIGGER admin_report_audit_prevent_delete
BEFORE DELETE ON admin_report_audit_events
FOR EACH ROW
EXECUTE FUNCTION prevent_admin_report_audit_mutation();

COMMIT;