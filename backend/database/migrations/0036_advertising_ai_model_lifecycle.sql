-- Migration 0036
-- Advertising AI transactional model lifecycle.
--
-- Backend owns lifecycle state and PostgreSQL.
-- Python training never promotes a model.

CREATE TABLE app.advertising_ai_model_transitions (
    id uuid
        PRIMARY KEY
        DEFAULT gen_random_uuid(),

    action text
        NOT NULL,

    from_model_id uuid
        REFERENCES app.advertising_ai_models(id)
        ON DELETE RESTRICT,

    to_model_id uuid
        NOT NULL
        REFERENCES app.advertising_ai_models(id)
        ON DELETE RESTRICT,

    reason text
        NOT NULL,

    occurred_at timestamptz
        NOT NULL,

    created_at timestamptz
        NOT NULL
        DEFAULT now(),

    CONSTRAINT advertising_ai_model_transitions_action_valid
        CHECK (
            action IN (
                'promotion',
                'rollback'
            )
        ),

    CONSTRAINT advertising_ai_model_transitions_reason_valid
        CHECK (
            length(trim(reason)) > 0
        )
);

CREATE INDEX advertising_ai_model_transitions_recent
    ON app.advertising_ai_model_transitions (
        occurred_at DESC
    );

CREATE INDEX advertising_ai_model_transitions_to_model
    ON app.advertising_ai_model_transitions (
        to_model_id,
        occurred_at DESC
    );

CREATE OR REPLACE FUNCTION
app.apply_advertising_ai_model_evaluation(
    p_candidate_model_id uuid,
    p_expected_incumbent_model_id uuid,
    p_decision text,
    p_reason text,
    p_baseline_log_loss double precision,
    p_candidate_log_loss double precision,
    p_candidate_roc_auc double precision,
    p_candidate_accuracy double precision,
    p_validation_event_count bigint,
    p_validation_positive_count bigint,
    p_validation_negative_count bigint,
    p_decided_at timestamptz
)
RETURNS TABLE (
    candidate_model_id uuid,
    previous_promoted_model_id uuid,
    resulting_status text
)
LANGUAGE plpgsql
AS $function$
DECLARE
    v_candidate_status text;
    v_current_promoted_model_id uuid;
BEGIN
    IF p_decision NOT IN (
        'pass',
        'fail'
    ) THEN
        RAISE EXCEPTION
            'Advertising AI evaluation decision is invalid.';
    END IF;

    IF length(trim(p_reason)) = 0 THEN
        RAISE EXCEPTION
            'Advertising AI evaluation reason is required.';
    END IF;

    SELECT
        status
    INTO
        v_candidate_status
    FROM
        app.advertising_ai_models
    WHERE
        id = p_candidate_model_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION
            'Advertising AI candidate model was not found.';
    END IF;

    IF v_candidate_status <> 'candidate' THEN
        RAISE EXCEPTION
            'Advertising AI model is no longer a candidate.';
    END IF;

    SELECT
        id
    INTO
        v_current_promoted_model_id
    FROM
        app.advertising_ai_models
    WHERE
        status = 'promoted'
    FOR UPDATE;

    IF (
        v_current_promoted_model_id
        IS DISTINCT FROM
        p_expected_incumbent_model_id
    ) THEN
        RAISE EXCEPTION
            'Advertising AI promoted model changed during evaluation.';
    END IF;

    INSERT INTO app.advertising_ai_model_evaluations (
        candidate_model_id,
        incumbent_model_id,
        decision,
        reason,
        baseline_log_loss,
        candidate_log_loss,
        candidate_roc_auc,
        candidate_accuracy,
        validation_event_count,
        validation_positive_count,
        validation_negative_count,
        evaluated_at
    )
    VALUES (
        p_candidate_model_id,
        v_current_promoted_model_id,
        p_decision,
        p_reason,
        p_baseline_log_loss,
        p_candidate_log_loss,
        p_candidate_roc_auc,
        p_candidate_accuracy,
        p_validation_event_count,
        p_validation_positive_count,
        p_validation_negative_count,
        p_decided_at
    );

    IF p_decision = 'fail' THEN
        UPDATE
            app.advertising_ai_models
        SET
            status = 'rejected',
            rejection_reason = p_reason,
            rejected_at = p_decided_at
        WHERE
            id = p_candidate_model_id
            AND status = 'candidate';

        RETURN QUERY
        SELECT
            p_candidate_model_id,
            v_current_promoted_model_id,
            'rejected'::text;

        RETURN;
    END IF;

    IF v_current_promoted_model_id IS NOT NULL THEN
        UPDATE
            app.advertising_ai_models
        SET
            status = 'retired',
            retired_at = p_decided_at
        WHERE
            id = v_current_promoted_model_id
            AND status = 'promoted';
    END IF;

    UPDATE
        app.advertising_ai_models
    SET
        status = 'promoted',
        promoted_at = p_decided_at,
        rejected_at = NULL,
        retired_at = NULL,
        rejection_reason = NULL
    WHERE
        id = p_candidate_model_id
        AND status = 'candidate';

    IF NOT FOUND THEN
        RAISE EXCEPTION
            'Advertising AI candidate promotion failed.';
    END IF;

    INSERT INTO app.advertising_ai_model_transitions (
        action,
        from_model_id,
        to_model_id,
        reason,
        occurred_at
    )
    VALUES (
        'promotion',
        v_current_promoted_model_id,
        p_candidate_model_id,
        p_reason,
        p_decided_at
    );

    RETURN QUERY
    SELECT
        p_candidate_model_id,
        v_current_promoted_model_id,
        'promoted'::text;
END;
$function$;

CREATE OR REPLACE FUNCTION
app.rollback_advertising_ai_model(
    p_target_model_id uuid,
    p_reason text,
    p_rolled_back_at timestamptz
)
RETURNS TABLE (
    promoted_model_id uuid,
    retired_model_id uuid
)
LANGUAGE plpgsql
AS $function$
DECLARE
    v_target_status text;
    v_current_promoted_model_id uuid;
BEGIN
    IF length(trim(p_reason)) = 0 THEN
        RAISE EXCEPTION
            'Advertising AI rollback reason is required.';
    END IF;

    SELECT
        status
    INTO
        v_target_status
    FROM
        app.advertising_ai_models
    WHERE
        id = p_target_model_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION
            'Advertising AI rollback target was not found.';
    END IF;

    IF v_target_status <> 'retired' THEN
        RAISE EXCEPTION
            'Advertising AI rollback target must be retired.';
    END IF;

    SELECT
        id
    INTO
        v_current_promoted_model_id
    FROM
        app.advertising_ai_models
    WHERE
        status = 'promoted'
    FOR UPDATE;

    IF v_current_promoted_model_id IS NULL THEN
        RAISE EXCEPTION
            'Advertising AI rollback requires a currently promoted model.';
    END IF;

    IF (
        v_current_promoted_model_id =
        p_target_model_id
    ) THEN
        RAISE EXCEPTION
            'Advertising AI rollback target is already promoted.';
    END IF;

    UPDATE
        app.advertising_ai_models
    SET
        status = 'retired',
        retired_at = p_rolled_back_at
    WHERE
        id = v_current_promoted_model_id
        AND status = 'promoted';

    UPDATE
        app.advertising_ai_models
    SET
        status = 'promoted',
        promoted_at = p_rolled_back_at,
        retired_at = NULL,
        rejected_at = NULL,
        rejection_reason = NULL
    WHERE
        id = p_target_model_id
        AND status = 'retired';

    IF NOT FOUND THEN
        RAISE EXCEPTION
            'Advertising AI rollback target activation failed.';
    END IF;

    INSERT INTO app.advertising_ai_model_transitions (
        action,
        from_model_id,
        to_model_id,
        reason,
        occurred_at
    )
    VALUES (
        'rollback',
        v_current_promoted_model_id,
        p_target_model_id,
        p_reason,
        p_rolled_back_at
    );

    RETURN QUERY
    SELECT
        p_target_model_id,
        v_current_promoted_model_id;
END;
$function$;

REVOKE ALL
ON app.advertising_ai_model_transitions
FROM PUBLIC;

GRANT
    SELECT,
    INSERT
ON app.advertising_ai_model_transitions
TO poster_app;

REVOKE ALL
ON FUNCTION
app.apply_advertising_ai_model_evaluation(
    uuid,
    uuid,
    text,
    text,
    double precision,
    double precision,
    double precision,
    double precision,
    bigint,
    bigint,
    bigint,
    timestamptz
)
FROM PUBLIC;

GRANT EXECUTE
ON FUNCTION
app.apply_advertising_ai_model_evaluation(
    uuid,
    uuid,
    text,
    text,
    double precision,
    double precision,
    double precision,
    double precision,
    bigint,
    bigint,
    bigint,
    timestamptz
)
TO poster_app;

REVOKE ALL
ON FUNCTION
app.rollback_advertising_ai_model(
    uuid,
    text,
    timestamptz
)
FROM PUBLIC;

GRANT EXECUTE
ON FUNCTION
app.rollback_advertising_ai_model(
    uuid,
    text,
    timestamptz
)
TO poster_app;