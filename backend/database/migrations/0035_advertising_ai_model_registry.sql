-- Migration 0035
-- Persistent Advertising AI candidate/model lifecycle.
--
-- PostgreSQL remains authoritative.
-- Python AI has no direct database access.
-- Model artifacts are immutable after insertion.

CREATE TABLE app.advertising_ai_models (
    id uuid
        PRIMARY KEY
        DEFAULT gen_random_uuid(),

    model_id text
        NOT NULL
        UNIQUE,

    model_type text
        NOT NULL,

    training_engine_version text
        NOT NULL,

    feature_version text
        NOT NULL,

    feature_dimension integer
        NOT NULL,

    dataset_id uuid
        NOT NULL
        REFERENCES app.advertising_ai_learning_datasets(id)
        ON DELETE RESTRICT,

    dataset_checksum text
        NOT NULL,

    model_checksum text
        NOT NULL
        UNIQUE,

    status text
        NOT NULL
        DEFAULT 'candidate',

    trained_at timestamptz
        NOT NULL,

    materialized_event_count bigint
        NOT NULL,

    labeled_event_count bigint
        NOT NULL,

    training_event_count bigint
        NOT NULL,

    training_positive_count bigint
        NOT NULL,

    training_negative_count bigint
        NOT NULL,

    intercept double precision
        NOT NULL,

    weights jsonb
        NOT NULL,

    validation_event_count bigint
        NOT NULL,

    validation_positive_count bigint
        NOT NULL,

    validation_negative_count bigint
        NOT NULL,

    validation_accuracy double precision
        NOT NULL,

    validation_log_loss double precision
        NOT NULL,

    validation_roc_auc double precision,

    rejection_reason text,

    created_at timestamptz
        NOT NULL
        DEFAULT now(),

    promoted_at timestamptz,

    rejected_at timestamptz,

    retired_at timestamptz,

    CONSTRAINT advertising_ai_models_type_valid
        CHECK (
            model_type =
                'hashed_logistic_ad_response_v1'
        ),

    CONSTRAINT advertising_ai_models_dimension_valid
        CHECK (
            feature_dimension = 256
        ),

    CONSTRAINT advertising_ai_models_status_valid
        CHECK (
            status IN (
                'candidate',
                'promoted',
                'rejected',
                'retired'
            )
        ),

    CONSTRAINT advertising_ai_models_counts_valid
        CHECK (
            materialized_event_count >= 10000
            AND labeled_event_count >= 100
            AND training_event_count >= 1
            AND training_positive_count >= 1
            AND training_negative_count >= 1
            AND validation_event_count >= 20
            AND validation_positive_count >= 1
            AND validation_negative_count >= 1
        ),

    CONSTRAINT advertising_ai_models_accuracy_valid
        CHECK (
            validation_accuracy >= 0
            AND validation_accuracy <= 1
        ),

    CONSTRAINT advertising_ai_models_log_loss_valid
        CHECK (
            validation_log_loss >= 0
        ),

    CONSTRAINT advertising_ai_models_auc_valid
        CHECK (
            validation_roc_auc IS NULL
            OR (
                validation_roc_auc >= 0
                AND validation_roc_auc <= 1
            )
        ),

    CONSTRAINT advertising_ai_models_checksum_valid
        CHECK (
            model_checksum ~
                '^sha256:[0-9a-f]{64}$'
            AND dataset_checksum ~
                '^sha256:[0-9a-f]{64}$'
        ),

    CONSTRAINT advertising_ai_models_weights_array
        CHECK (
            jsonb_typeof(weights) = 'array'
            AND jsonb_array_length(weights) = 256
        )
);

CREATE UNIQUE INDEX advertising_ai_one_promoted_model
    ON app.advertising_ai_models (
        status
    )
    WHERE status = 'promoted';

CREATE INDEX advertising_ai_models_status_created
    ON app.advertising_ai_models (
        status,
        created_at DESC
    );

CREATE INDEX advertising_ai_models_dataset
    ON app.advertising_ai_models (
        dataset_id
    );

CREATE TABLE app.advertising_ai_model_evaluations (
    id uuid
        PRIMARY KEY
        DEFAULT gen_random_uuid(),

    candidate_model_id uuid
        NOT NULL
        REFERENCES app.advertising_ai_models(id)
        ON DELETE RESTRICT,

    incumbent_model_id uuid
        REFERENCES app.advertising_ai_models(id)
        ON DELETE RESTRICT,

    decision text
        NOT NULL,

    reason text
        NOT NULL,

    baseline_log_loss double precision
        NOT NULL,

    candidate_log_loss double precision
        NOT NULL,

    candidate_roc_auc double precision,

    candidate_accuracy double precision
        NOT NULL,

    validation_event_count bigint
        NOT NULL,

    validation_positive_count bigint
        NOT NULL,

    validation_negative_count bigint
        NOT NULL,

    evaluated_at timestamptz
        NOT NULL
        DEFAULT now(),

    CONSTRAINT advertising_ai_model_evaluations_decision_valid
        CHECK (
            decision IN (
                'pass',
                'fail'
            )
        ),

    CONSTRAINT advertising_ai_model_evaluations_counts_valid
        CHECK (
            validation_event_count >= 20
            AND validation_positive_count >= 1
            AND validation_negative_count >= 1
        ),

    CONSTRAINT advertising_ai_model_evaluations_accuracy_valid
        CHECK (
            candidate_accuracy >= 0
            AND candidate_accuracy <= 1
        ),

    CONSTRAINT advertising_ai_model_evaluations_loss_valid
        CHECK (
            baseline_log_loss >= 0
            AND candidate_log_loss >= 0
        ),

    CONSTRAINT advertising_ai_model_evaluations_auc_valid
        CHECK (
            candidate_roc_auc IS NULL
            OR (
                candidate_roc_auc >= 0
                AND candidate_roc_auc <= 1
            )
        )
);

CREATE INDEX advertising_ai_model_evaluations_candidate
    ON app.advertising_ai_model_evaluations (
        candidate_model_id,
        evaluated_at DESC
    );

CREATE OR REPLACE FUNCTION
app.prevent_advertising_ai_model_artifact_mutation()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
BEGIN
    IF (
        NEW.model_id,
        NEW.model_type,
        NEW.training_engine_version,
        NEW.feature_version,
        NEW.feature_dimension,
        NEW.dataset_id,
        NEW.dataset_checksum,
        NEW.model_checksum,
        NEW.trained_at,
        NEW.materialized_event_count,
        NEW.labeled_event_count,
        NEW.training_event_count,
        NEW.training_positive_count,
        NEW.training_negative_count,
        NEW.intercept,
        NEW.weights,
        NEW.validation_event_count,
        NEW.validation_positive_count,
        NEW.validation_negative_count,
        NEW.validation_accuracy,
        NEW.validation_log_loss,
        NEW.validation_roc_auc
    )
    IS DISTINCT FROM
    (
        OLD.model_id,
        OLD.model_type,
        OLD.training_engine_version,
        OLD.feature_version,
        OLD.feature_dimension,
        OLD.dataset_id,
        OLD.dataset_checksum,
        OLD.model_checksum,
        OLD.trained_at,
        OLD.materialized_event_count,
        OLD.labeled_event_count,
        OLD.training_event_count,
        OLD.training_positive_count,
        OLD.training_negative_count,
        OLD.intercept,
        OLD.weights,
        OLD.validation_event_count,
        OLD.validation_positive_count,
        OLD.validation_negative_count,
        OLD.validation_accuracy,
        OLD.validation_log_loss,
        OLD.validation_roc_auc
    )
    THEN
        RAISE EXCEPTION
            'Advertising AI model artifact fields are immutable.';
    END IF;

    RETURN NEW;
END;
$function$;

CREATE TRIGGER advertising_ai_model_artifact_immutable
    BEFORE UPDATE
    ON app.advertising_ai_models
    FOR EACH ROW
    EXECUTE FUNCTION
        app.prevent_advertising_ai_model_artifact_mutation();

REVOKE ALL
ON app.advertising_ai_models
FROM PUBLIC;

REVOKE ALL
ON app.advertising_ai_model_evaluations
FROM PUBLIC;

GRANT
    SELECT,
    INSERT,
    UPDATE
ON app.advertising_ai_models
TO poster_app;

GRANT
    SELECT,
    INSERT
ON app.advertising_ai_model_evaluations
TO poster_app;

COMMENT ON TABLE app.advertising_ai_models IS
    'Persistent Backend-owned Advertising AI model registry. Artifact fields are immutable; lifecycle state may transition under Backend policy.';

COMMENT ON TABLE app.advertising_ai_model_evaluations IS
    'Persistent Advertising AI candidate evaluation decisions. Promotion is performed separately and never by Python training.';