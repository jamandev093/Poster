BEGIN;

-- =========================================================
-- MONETIZATION ANALYTICS FOUNDATION
--
-- Raw events are append-only.
-- Validation decisions determine whether an event is trusted.
-- Daily aggregates contain only operational delivery metrics.
-- No payment, spend, revenue, commission or ledger values are
-- introduced by this migration.
-- =========================================================

CREATE TABLE app.monetization_campaign_events (
  id uuid
    PRIMARY KEY
    DEFAULT gen_random_uuid(),

  event_key text
    NOT NULL
    UNIQUE,

  campaign_id uuid
    NOT NULL
    REFERENCES app.monetization_campaigns (
      id
    )
    ON DELETE RESTRICT,

  event_type text
    NOT NULL,

  placement text
    NOT NULL,

  occurred_at timestamp with time zone
    NOT NULL,

  received_at timestamp with time zone
    NOT NULL
    DEFAULT now(),

  source text
    NOT NULL,

  schema_version integer
    NOT NULL
    DEFAULT 1,

  session_key_hash text,

  user_key_hash text,

  request_key_hash text,

  destination_host text,

  metadata jsonb
    NOT NULL
    DEFAULT '{}'::jsonb,

  CONSTRAINT monetization_campaign_events_key_nonempty
    CHECK (
      length(
        trim(
          event_key
        )
      ) > 0
    ),

  CONSTRAINT monetization_campaign_events_type_check
    CHECK (
      event_type IN (
        'impression',
        'click',
        'conversion'
      )
    ),

  CONSTRAINT monetization_campaign_events_placement_check
    CHECK (
      placement IN (
        'home',
        'search',
        'trending'
      )
    ),

  CONSTRAINT monetization_campaign_events_source_nonempty
    CHECK (
      length(
        trim(
          source
        )
      ) > 0
    ),

  CONSTRAINT monetization_campaign_events_schema_version_positive
    CHECK (
      schema_version > 0
    ),

  CONSTRAINT monetization_campaign_events_time_order
    CHECK (
      occurred_at <=
      received_at +
      interval '5 minutes'
    ),

  CONSTRAINT monetization_campaign_events_metadata_object
    CHECK (
      jsonb_typeof(
        metadata
      ) = 'object'
    )
);

CREATE INDEX monetization_campaign_events_campaign_time_idx
  ON app.monetization_campaign_events (
    campaign_id,
    occurred_at DESC
  );

CREATE INDEX monetization_campaign_events_type_time_idx
  ON app.monetization_campaign_events (
    event_type,
    occurred_at DESC
  );

CREATE INDEX monetization_campaign_events_placement_time_idx
  ON app.monetization_campaign_events (
    placement,
    occurred_at DESC
  );

CREATE INDEX monetization_campaign_events_received_idx
  ON app.monetization_campaign_events (
    received_at DESC
  );

CREATE INDEX monetization_campaign_events_request_hash_idx
  ON app.monetization_campaign_events (
    request_key_hash,
    occurred_at DESC
  )
  WHERE request_key_hash IS NOT NULL;

CREATE INDEX monetization_campaign_events_session_hash_idx
  ON app.monetization_campaign_events (
    session_key_hash,
    occurred_at DESC
  )
  WHERE session_key_hash IS NOT NULL;

-- =========================================================
-- EVENT VALIDATION
-- =========================================================

CREATE TABLE app.monetization_campaign_event_validations (
  event_id uuid
    PRIMARY KEY
    REFERENCES app.monetization_campaign_events (
      id
    )
    ON DELETE RESTRICT,

  validation_status text
    NOT NULL
    DEFAULT 'pending',

  invalid_reason_codes text[]
    NOT NULL
    DEFAULT ARRAY[]::text[],

  duplicate_of_event_id uuid
    REFERENCES app.monetization_campaign_events (
      id
    )
    ON DELETE RESTRICT,

  validator_version text,

  validated_at timestamp with time zone,

  created_at timestamp with time zone
    NOT NULL
    DEFAULT now(),

  updated_at timestamp with time zone
    NOT NULL
    DEFAULT now(),

  row_version bigint
    NOT NULL
    DEFAULT 1,

  CONSTRAINT monetization_event_validation_status_check
    CHECK (
      validation_status IN (
        'pending',
        'valid',
        'invalid',
        'duplicate'
      )
    ),

  CONSTRAINT monetization_event_validation_consistency
    CHECK (
      (
        validation_status = 'pending'
        AND validated_at IS NULL
        AND duplicate_of_event_id IS NULL
        AND cardinality(
          invalid_reason_codes
        ) = 0
      )
      OR
      (
        validation_status = 'valid'
        AND validated_at IS NOT NULL
        AND duplicate_of_event_id IS NULL
        AND cardinality(
          invalid_reason_codes
        ) = 0
      )
      OR
      (
        validation_status = 'invalid'
        AND validated_at IS NOT NULL
        AND duplicate_of_event_id IS NULL
        AND cardinality(
          invalid_reason_codes
        ) > 0
      )
      OR
      (
        validation_status = 'duplicate'
        AND validated_at IS NOT NULL
        AND duplicate_of_event_id IS NOT NULL
        AND cardinality(
          invalid_reason_codes
        ) > 0
      )
    ),

  CONSTRAINT monetization_event_validation_not_self_duplicate
    CHECK (
      duplicate_of_event_id IS NULL
      OR duplicate_of_event_id <>
        event_id
    )
);

CREATE INDEX monetization_event_validation_status_idx
  ON app.monetization_campaign_event_validations (
    validation_status,
    updated_at
  );

CREATE INDEX monetization_event_validation_duplicate_idx
  ON app.monetization_campaign_event_validations (
    duplicate_of_event_id
  )
  WHERE duplicate_of_event_id IS NOT NULL;

-- =========================================================
-- CONVERSION ATTRIBUTION
-- =========================================================

CREATE TABLE app.monetization_campaign_attributions (
  id uuid
    PRIMARY KEY
    DEFAULT gen_random_uuid(),

  campaign_id uuid
    NOT NULL
    REFERENCES app.monetization_campaigns (
      id
    )
    ON DELETE RESTRICT,

  conversion_event_id uuid
    NOT NULL
    UNIQUE
    REFERENCES app.monetization_campaign_events (
      id
    )
    ON DELETE RESTRICT,

  click_event_id uuid
    REFERENCES app.monetization_campaign_events (
      id
    )
    ON DELETE RESTRICT,

  impression_event_id uuid
    REFERENCES app.monetization_campaign_events (
      id
    )
    ON DELETE RESTRICT,

  attribution_model text
    NOT NULL,

  attribution_window_seconds integer
    NOT NULL,

  attributed_at timestamp with time zone
    NOT NULL,

  metadata jsonb
    NOT NULL
    DEFAULT '{}'::jsonb,

  created_at timestamp with time zone
    NOT NULL
    DEFAULT now(),

  CONSTRAINT monetization_attribution_model_check
    CHECK (
      attribution_model IN (
        'last_valid_click',
        'last_valid_impression',
        'unattributed'
      )
    ),

  CONSTRAINT monetization_attribution_window_positive
    CHECK (
      attribution_window_seconds > 0
    ),

  CONSTRAINT monetization_attribution_model_consistency
    CHECK (
      (
        attribution_model =
          'last_valid_click'
        AND click_event_id IS NOT NULL
      )
      OR
      (
        attribution_model =
          'last_valid_impression'
        AND impression_event_id IS NOT NULL
      )
      OR
      (
        attribution_model =
          'unattributed'
        AND click_event_id IS NULL
        AND impression_event_id IS NULL
      )
    ),

  CONSTRAINT monetization_attribution_metadata_object
    CHECK (
      jsonb_typeof(
        metadata
      ) = 'object'
    )
);

CREATE INDEX monetization_campaign_attributions_campaign_time_idx
  ON app.monetization_campaign_attributions (
    campaign_id,
    attributed_at DESC
  );

CREATE INDEX monetization_campaign_attributions_click_idx
  ON app.monetization_campaign_attributions (
    click_event_id
  )
  WHERE click_event_id IS NOT NULL;

CREATE INDEX monetization_campaign_attributions_impression_idx
  ON app.monetization_campaign_attributions (
    impression_event_id
  )
  WHERE impression_event_id IS NOT NULL;

-- =========================================================
-- DAILY TRUSTED AGGREGATES
-- =========================================================

CREATE TABLE app.monetization_campaign_daily_metrics (
  campaign_id uuid
    NOT NULL
    REFERENCES app.monetization_campaigns (
      id
    )
    ON DELETE RESTRICT,

  metric_date date
    NOT NULL,

  placement text
    NOT NULL,

  valid_impressions bigint
    NOT NULL
    DEFAULT 0,

  invalid_impressions bigint
    NOT NULL
    DEFAULT 0,

  duplicate_impressions bigint
    NOT NULL
    DEFAULT 0,

  valid_clicks bigint
    NOT NULL
    DEFAULT 0,

  invalid_clicks bigint
    NOT NULL
    DEFAULT 0,

  duplicate_clicks bigint
    NOT NULL
    DEFAULT 0,

  valid_conversions bigint
    NOT NULL
    DEFAULT 0,

  invalid_conversions bigint
    NOT NULL
    DEFAULT 0,

  duplicate_conversions bigint
    NOT NULL
    DEFAULT 0,

  unattributed_conversions bigint
    NOT NULL
    DEFAULT 0,

  source_event_watermark timestamp with time zone,

  finalized_at timestamp with time zone,

  created_at timestamp with time zone
    NOT NULL
    DEFAULT now(),

  updated_at timestamp with time zone
    NOT NULL
    DEFAULT now(),

  row_version bigint
    NOT NULL
    DEFAULT 1,

  PRIMARY KEY (
    campaign_id,
    metric_date,
    placement
  ),

  CONSTRAINT monetization_daily_metrics_placement_check
    CHECK (
      placement IN (
        'home',
        'search',
        'trending'
      )
    ),

  CONSTRAINT monetization_daily_metrics_nonnegative
    CHECK (
      valid_impressions >= 0
      AND invalid_impressions >= 0
      AND duplicate_impressions >= 0
      AND valid_clicks >= 0
      AND invalid_clicks >= 0
      AND duplicate_clicks >= 0
      AND valid_conversions >= 0
      AND invalid_conversions >= 0
      AND duplicate_conversions >= 0
      AND unattributed_conversions >= 0
    ),

  CONSTRAINT monetization_daily_metrics_finalization_consistency
    CHECK (
      finalized_at IS NULL
      OR source_event_watermark IS NOT NULL
    )
);

CREATE INDEX monetization_daily_metrics_date_idx
  ON app.monetization_campaign_daily_metrics (
    metric_date DESC,
    campaign_id
  );

CREATE INDEX monetization_daily_metrics_placement_date_idx
  ON app.monetization_campaign_daily_metrics (
    placement,
    metric_date DESC
  );

CREATE INDEX monetization_daily_metrics_unfinalized_idx
  ON app.monetization_campaign_daily_metrics (
    metric_date,
    campaign_id
  )
  WHERE finalized_at IS NULL;

-- =========================================================
-- AGGREGATION CHECKPOINT
-- =========================================================

CREATE TABLE app.monetization_analytics_checkpoints (
  checkpoint_key text
    PRIMARY KEY,

  last_event_received_at timestamp with time zone,

  last_event_id uuid,

  updated_at timestamp with time zone
    NOT NULL
    DEFAULT now(),

  row_version bigint
    NOT NULL
    DEFAULT 1,

  CONSTRAINT monetization_analytics_checkpoint_key_nonempty
    CHECK (
      length(
        trim(
          checkpoint_key
        )
      ) > 0
    ),

  CONSTRAINT monetization_analytics_checkpoint_consistency
    CHECK (
      (
        last_event_received_at IS NULL
        AND last_event_id IS NULL
      )
      OR
      (
        last_event_received_at IS NOT NULL
        AND last_event_id IS NOT NULL
      )
    )
);

-- =========================================================
-- UPDATE TRIGGERS
-- =========================================================

CREATE OR REPLACE FUNCTION app.touch_monetization_analytics_row()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at =
    now();

  NEW.row_version =
    OLD.row_version +
    1;

  RETURN NEW;
END;
$$;

CREATE TRIGGER monetization_event_validation_touch
BEFORE UPDATE
ON app.monetization_campaign_event_validations
FOR EACH ROW
EXECUTE FUNCTION app.touch_monetization_analytics_row();

CREATE TRIGGER monetization_daily_metrics_touch
BEFORE UPDATE
ON app.monetization_campaign_daily_metrics
FOR EACH ROW
EXECUTE FUNCTION app.touch_monetization_analytics_row();

CREATE TRIGGER monetization_analytics_checkpoint_touch
BEFORE UPDATE
ON app.monetization_analytics_checkpoints
FOR EACH ROW
EXECUTE FUNCTION app.touch_monetization_analytics_row();

-- =========================================================
-- APPEND-ONLY RAW EVENTS
-- =========================================================

CREATE OR REPLACE FUNCTION app.prevent_monetization_event_mutation()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  RAISE EXCEPTION
    'Monetization campaign events are append-only and cannot be modified.';
END;
$$;

CREATE TRIGGER monetization_campaign_events_prevent_update
BEFORE UPDATE
ON app.monetization_campaign_events
FOR EACH ROW
EXECUTE FUNCTION app.prevent_monetization_event_mutation();

CREATE TRIGGER monetization_campaign_events_prevent_delete
BEFORE DELETE
ON app.monetization_campaign_events
FOR EACH ROW
EXECUTE FUNCTION app.prevent_monetization_event_mutation();

CREATE TRIGGER monetization_campaign_attributions_prevent_update
BEFORE UPDATE
ON app.monetization_campaign_attributions
FOR EACH ROW
EXECUTE FUNCTION app.prevent_monetization_event_mutation();

CREATE TRIGGER monetization_campaign_attributions_prevent_delete
BEFORE DELETE
ON app.monetization_campaign_attributions
FOR EACH ROW
EXECUTE FUNCTION app.prevent_monetization_event_mutation();

COMMENT ON TABLE app.monetization_campaign_events IS
  'Append-only raw campaign delivery events. Anonymous identifiers must be hashed before storage.';

COMMENT ON TABLE app.monetization_campaign_event_validations IS
  'Trusted validation result for each raw campaign event, including invalid-traffic and duplicate decisions.';

COMMENT ON TABLE app.monetization_campaign_attributions IS
  'Append-only attribution links for valid conversion events.';

COMMENT ON TABLE app.monetization_campaign_daily_metrics IS
  'Daily placement-level campaign metrics aggregated from validated events. Contains no financial ledger values.';

COMMENT ON TABLE app.monetization_analytics_checkpoints IS
  'Aggregation worker checkpoints for deterministic incremental analytics processing.';

COMMIT;