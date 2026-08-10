-- Poster Brain persistent AI model registry
-- Migration: 0027_poster_brain_ai_model_registry
--
-- Backend/PostgreSQL remains authoritative for model-version
-- persistence. Python training services do not receive direct
-- database access.

CREATE TABLE app.poster_brain_ai_model_versions (
  model_id text PRIMARY KEY
    CHECK (
      char_length(
        btrim(model_id)
      ) > 0
    ),

  state text NOT NULL
    DEFAULT 'candidate'
    CHECK (
      state IN (
        'candidate',
        'active',
        'rollback',
        'rejected'
      )
    ),

  model_type text NOT NULL
    CHECK (
      char_length(
        btrim(model_type)
      ) > 0
    ),

  training_engine_version text NOT NULL
    CHECK (
      char_length(
        btrim(training_engine_version)
      ) > 0
    ),

  feature_version text NOT NULL
    CHECK (
      char_length(
        btrim(feature_version)
      ) > 0
    ),

  feature_dimension integer NOT NULL
    CHECK (
      feature_dimension > 0
    ),

  dataset_id uuid NOT NULL
    REFERENCES app.poster_brain_ai_learning_datasets(id)
    ON DELETE RESTRICT,

  dataset_checksum text NOT NULL
    CHECK (
      dataset_checksum ~
        '^sha256:[0-9a-fA-F]{64}$'
    ),

  model_checksum text NOT NULL UNIQUE
    CHECK (
      model_checksum ~
        '^sha256:[0-9a-fA-F]{64}$'
    ),

  trained_at timestamptz NOT NULL,

  materialized_event_count integer NOT NULL
    CHECK (
      materialized_event_count >= 10000
    ),

  labeled_event_count integer NOT NULL
    CHECK (
      labeled_event_count >= 0
      AND labeled_event_count <=
        materialized_event_count
    ),

  training_event_count integer NOT NULL
    CHECK (
      training_event_count >= 0
      AND training_event_count <=
        labeled_event_count
    ),

  training_positive_count integer NOT NULL
    CHECK (
      training_positive_count >= 0
    ),

  training_negative_count integer NOT NULL
    CHECK (
      training_negative_count >= 0
    ),

  validation_event_count integer NOT NULL
    CHECK (
      validation_event_count >= 0
    ),

  validation_positive_count integer NOT NULL
    CHECK (
      validation_positive_count >= 0
    ),

  validation_negative_count integer NOT NULL
    CHECK (
      validation_negative_count >= 0
    ),

  validation_accuracy double precision NOT NULL
    CHECK (
      validation_accuracy >= 0
      AND validation_accuracy <= 1
    ),

  validation_log_loss double precision NOT NULL
    CHECK (
      validation_log_loss >= 0
    ),

  validation_roc_auc double precision
    CHECK (
      validation_roc_auc IS NULL
      OR (
        validation_roc_auc >= 0
        AND validation_roc_auc <= 1
      )
    ),

  artifact jsonb NOT NULL
    CHECK (
      jsonb_typeof(
        artifact
      ) = 'object'
    ),

  evaluation_status text NOT NULL
    DEFAULT 'pending'
    CHECK (
      evaluation_status IN (
        'pending',
        'passed',
        'failed'
      )
    ),

  evaluation_reason text,

  evaluation_payload jsonb
    CHECK (
      evaluation_payload IS NULL
      OR jsonb_typeof(
        evaluation_payload
      ) = 'object'
    ),

  evaluated_at timestamptz,

  activated_at timestamptz,

  rejected_at timestamptz,

  previous_active_model_id text
    REFERENCES app.poster_brain_ai_model_versions(model_id)
    ON DELETE RESTRICT,

  created_at timestamptz NOT NULL
    DEFAULT now(),

  updated_at timestamptz NOT NULL
    DEFAULT now(),

  row_version bigint NOT NULL
    DEFAULT 1
    CHECK (
      row_version > 0
    ),

  CHECK (
    training_positive_count +
    training_negative_count =
    training_event_count
  ),

  CHECK (
    validation_positive_count +
    validation_negative_count =
    validation_event_count
  ),

  CHECK (
    (
      evaluation_status = 'pending'
      AND evaluated_at IS NULL
    )
    OR (
      evaluation_status IN (
        'passed',
        'failed'
      )
      AND evaluated_at IS NOT NULL
    )
  ),

  CHECK (
    (
      state = 'candidate'
      AND activated_at IS NULL
      AND rejected_at IS NULL
    )
    OR (
      state = 'active'
      AND activated_at IS NOT NULL
      AND rejected_at IS NULL
    )
    OR (
      state = 'rollback'
      AND activated_at IS NOT NULL
      AND rejected_at IS NULL
    )
    OR (
      state = 'rejected'
      AND rejected_at IS NOT NULL
    )
  )
);

CREATE UNIQUE INDEX
  poster_brain_ai_model_versions_one_active_idx
ON app.poster_brain_ai_model_versions (
  state
)
WHERE state = 'active';

CREATE INDEX
  poster_brain_ai_model_versions_state_trained_idx
ON app.poster_brain_ai_model_versions (
  state,
  trained_at DESC,
  model_id
);

CREATE INDEX
  poster_brain_ai_model_versions_dataset_idx
ON app.poster_brain_ai_model_versions (
  dataset_id,
  trained_at DESC
);

CREATE INDEX
  poster_brain_ai_model_versions_evaluation_idx
ON app.poster_brain_ai_model_versions (
  evaluation_status,
  trained_at DESC
);

COMMENT ON TABLE app.poster_brain_ai_model_versions IS
  'Backend-owned persistent Poster Brain AI model-version registry and candidate artifacts.';

COMMENT ON COLUMN app.poster_brain_ai_model_versions.artifact IS
  'Complete privacy-safe model artifact returned by the internal Python training service, including learned weights and metrics.';

COMMENT ON COLUMN app.poster_brain_ai_model_versions.evaluation_status IS
  'Independent promotion-evaluation state. Candidate promotion remains blocked while pending or failed.';

COMMENT ON COLUMN app.poster_brain_ai_model_versions.previous_active_model_id IS
  'Previous active model retained as the direct rollback target after a later promotion.';

REVOKE ALL
ON app.poster_brain_ai_model_versions
FROM PUBLIC;

GRANT
  SELECT,
  INSERT,
  UPDATE
ON app.poster_brain_ai_model_versions
TO poster_app;