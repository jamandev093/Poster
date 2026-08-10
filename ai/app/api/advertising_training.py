from __future__ import annotations

import hashlib
import json
import tempfile

from datetime import (
    datetime,
    timezone,
)

from typing import (
    BinaryIO,
    Iterator,
)

from fastapi import (
    HTTPException,
    Request,
)

from pydantic import (
    ValidationError,
)

from app.models.advertising_training_http import (
    AdvertisingTrainingCandidateMetrics,
    AdvertisingTrainingCandidateModel,
    AdvertisingTrainingEventLine,
    AdvertisingTrainingHttpResponse,
    AdvertisingTrainingManifestLine,
)

from app.services.advertising_training_engine import (
    AdvertisingTrainingEvent,
    TrainedAdvertisingResponseModel,
    train_advertising_response_model,
)


CONTENT_TYPE = (
    "application/x-ndjson"
)

MAX_REQUEST_BYTES = (
    32 * 1024 * 1024
)

MAX_LINE_BYTES = (
    16 * 1024
)

SPOOL_MEMORY_BYTES = (
    8 * 1024 * 1024
)


class _RequestTooLarge(
    Exception
):
    pass


def _utc_now_milliseconds() -> str:
    return (
        datetime.now(
            timezone.utc
        )
        .isoformat(
            timespec="milliseconds"
        )
        .replace(
            "+00:00",
            "Z",
        )
    )


def _read_line(
    file: BinaryIO,
) -> bytes:
    line = file.readline(
        MAX_LINE_BYTES + 1
    )

    if (
        len(line) >
        MAX_LINE_BYTES
    ):
        raise ValueError(
            "Advertising AI NDJSON line is too large."
        )

    return line


def _canonical_event_bytes(
    event:
        AdvertisingTrainingEventLine
) -> bytes:
    payload = {
        "campaignId":
            event.campaignId,

        "eventKey":
            event.eventKey,

        "eventType":
            event.eventType,

        "occurredAt":
            event.occurredAt,

        "placement":
            event.placement,

        "sourceEventId":
            event.sourceEventId,
    }

    return (
        json.dumps(
            payload,
            ensure_ascii=False,
            allow_nan=False,
            sort_keys=True,
            separators=(
                ",",
                ":",
            ),
        ).encode(
            "utf-8"
        )
        +
        b"\n"
    )


def _read_manifest(
    file: BinaryIO,
) -> AdvertisingTrainingManifestLine:
    line = _read_line(
        file
    )

    if not line:
        raise ValueError(
            "Advertising AI training manifest is missing."
        )

    return (
        AdvertisingTrainingManifestLine
        .model_validate_json(
            line
        )
    )


def validate_advertising_training_dataset(
    file: BinaryIO,
) -> AdvertisingTrainingManifestLine:
    file.seek(
        0
    )

    manifest = _read_manifest(
        file
    )

    checksum = hashlib.sha256()

    observed = 0

    source_event_ids: set[str] = set()

    while True:
        line = _read_line(
            file
        )

        if not line:
            break

        if not line.strip():
            raise ValueError(
                "Blank Advertising AI NDJSON lines are not allowed."
            )

        event = (
            AdvertisingTrainingEventLine
            .model_validate_json(
                line
            )
        )

        if (
            event.sourceEventId
            in source_event_ids
        ):
            raise ValueError(
                "Duplicate Advertising AI source event id."
            )

        source_event_ids.add(
            event.sourceEventId
        )

        checksum.update(
            _canonical_event_bytes(
                event
            )
        )

        observed += 1

        if (
            observed >
            manifest
            .materializedEventCount
        ):
            raise ValueError(
                "Advertising AI event count exceeds manifest."
            )

    if (
        observed !=
        manifest.materializedEventCount
    ):
        raise ValueError(
            "Advertising AI event count does not match manifest."
        )

    actual_checksum = (
        "sha256:"
        +
        checksum.hexdigest()
    )

    if (
        actual_checksum !=
        manifest.datasetChecksum
    ):
        raise ValueError(
            "Advertising AI dataset checksum mismatch."
        )

    return manifest


def _iter_training_events(
    file: BinaryIO,
) -> Iterator[
    AdvertisingTrainingEvent
]:
    file.seek(
        0
    )

    _read_manifest(
        file
    )

    while True:
        line = _read_line(
            file
        )

        if not line:
            break

        event = (
            AdvertisingTrainingEventLine
            .model_validate_json(
                line
            )
        )

        yield AdvertisingTrainingEvent(
            event_key=
                event.eventKey,

            source_event_id=
                event.sourceEventId,

            campaign_id=
                event.campaignId,

            event_type=
                event.eventType,

            placement=
                event.placement,

            occurred_at=
                event.occurredAt,
        )


async def _spool_request(
    request: Request,
) -> BinaryIO:
    file = tempfile.SpooledTemporaryFile(
        max_size=
            SPOOL_MEMORY_BYTES,

        mode="w+b",
    )

    total = 0

    async for chunk in request.stream():
        total += len(
            chunk
        )

        if (
            total >
            MAX_REQUEST_BYTES
        ):
            file.close()

            raise _RequestTooLarge()

        file.write(
            chunk
        )

    file.seek(
        0
    )

    return file


def _candidate_response(
    model:
        TrainedAdvertisingResponseModel
) -> AdvertisingTrainingCandidateModel:
    return AdvertisingTrainingCandidateModel(
        modelId=
            model.model_id,

        modelType=
            model.model_type,

        trainingEngineVersion=
            model.training_engine_version,

        featureVersion=
            model.feature_version,

        featureDimension=
            model.feature_dimension,

        datasetId=
            model.dataset_id,

        datasetChecksum=
            model.dataset_checksum,

        trainedAt=
            model.trained_at,

        materializedEventCount=
            model.materialized_event_count,

        labeledEventCount=
            model.labeled_event_count,

        trainingEventCount=
            model.training_event_count,

        trainingPositiveCount=
            model.training_positive_count,

        trainingNegativeCount=
            model.training_negative_count,

        intercept=
            model.intercept,

        weights=
            list(
                model.weights
            ),

        metrics=
            AdvertisingTrainingCandidateMetrics(
                validationEventCount=
                    model.metrics
                    .validation_event_count,

                validationPositiveCount=
                    model.metrics
                    .validation_positive_count,

                validationNegativeCount=
                    model.metrics
                    .validation_negative_count,

                accuracy=
                    model.metrics.accuracy,

                logLoss=
                    model.metrics.log_loss,

                rocAuc=
                    model.metrics.roc_auc,
            ),

        modelChecksum=
            model.model_checksum,
    )


async def handle_advertising_training_request(
    request: Request,
) -> AdvertisingTrainingHttpResponse:
    content_type = (
        request.headers
        .get(
            "content-type",
            "",
        )
        .split(
            ";",
            1,
        )[0]
        .strip()
        .lower()
    )

    if content_type != CONTENT_TYPE:
        raise HTTPException(
            status_code=415,
            detail=(
                "Advertising AI training requires application/x-ndjson."
            ),
        )

    try:
        file = await _spool_request(
            request
        )
    except _RequestTooLarge as error:
        raise HTTPException(
            status_code=413,
            detail=(
                "Advertising AI training request is too large."
            ),
        ) from error

    try:
        manifest = (
            validate_advertising_training_dataset(
                file
            )
        )

        result = (
            train_advertising_response_model(
                events=
                    _iter_training_events(
                        file
                    ),

                dataset_id=
                    manifest.datasetId,

                dataset_checksum=
                    manifest.datasetChecksum,

                materialized_event_count=
                    manifest.materializedEventCount,

                trained_at=
                    _utc_now_milliseconds(),
            )
        )

        candidate = (
            None
            if result.model is None
            else _candidate_response(
                result.model
            )
        )

        return AdvertisingTrainingHttpResponse(
            status=
                result.status,

            accepted=True,

            datasetId=
                manifest.datasetId,

            schemaVersion=1,

            datasetChecksum=
                manifest.datasetChecksum,

            sourceCutoffAt=
                manifest.sourceCutoffAt,

            materializedEventCount=
                result.materialized_event_count,

            trainingAttempted=True,

            candidateCreated=
                candidate is not None,

            reason=
                result.reason,

            observedEventCount=
                result.observed_event_count,

            labeledEventCount=
                result.labeled_event_count,

            skippedEventCount=
                result.skipped_event_count,

            positiveEventCount=
                result.positive_event_count,

            negativeEventCount=
                result.negative_event_count,

            candidate=
                candidate,

            promoted=False,
        )

    except (
        ValidationError,
        ValueError,
        json.JSONDecodeError,
    ) as error:
        raise HTTPException(
            status_code=422,
            detail=(
                "Advertising AI training dataset is invalid."
            ),
        ) from error

    finally:
        file.close()