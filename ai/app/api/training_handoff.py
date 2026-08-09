from __future__ import annotations

import json

from collections.abc import Iterator
from datetime import (
    datetime,
    timezone,
)
from tempfile import SpooledTemporaryFile
from typing import Any, BinaryIO

from fastapi import (
    APIRouter,
    HTTPException,
    Request,
    status,
)
from pydantic import ValidationError

from app.models.training_handoff_http import (
    TRAINING_DATASET_HANDOFF_CONTENT_TYPE,
    TrainingDatasetHandoffManifestLine,
    TrainingDatasetHandoffPageLine,
    TrainingDatasetHandoffValidationResponse,
)
from app.models.training_dataset import (
    TrainingDatasetPage,
)
from app.services.training_dataset_handoff import (
    TrainingDatasetHandoffValidationError,
    validate_training_dataset_handoff,
)
from app.models.training_run import (
    TrainingCandidateMetrics,
    TrainingCandidateModel,
    TrainingDatasetTrainResponse,
)
from app.services.training_engine import (
    TrainedEngagementModel,
    train_engagement_model,
)


router = APIRouter(
    prefix="/v1",
    tags=["training"],
)


SPOOL_MEMORY_LIMIT_BYTES = (
    8 * 1024 * 1024
)

MAX_HANDOFF_REQUEST_BYTES = (
    512 * 1024 * 1024
)

MAX_HANDOFF_LINE_BYTES = (
    64 * 1024 * 1024
)


class TrainingDatasetHttpTransportError(
    ValueError
):
    """Raised for malformed NDJSON transport framing."""


def _normalized_content_type(
    request: Request,
) -> str:
    value = request.headers.get(
        "content-type",
        "",
    )

    return (
        value.split(
            ";",
            1,
        )[0]
        .strip()
        .lower()
    )


def _read_json_line(
    file: BinaryIO,
    *,
    line_number: int,
) -> dict[str, Any] | None:
    raw = file.readline(
        MAX_HANDOFF_LINE_BYTES + 1
    )

    if raw == b"":
        return None

    if (
        len(raw) >
        MAX_HANDOFF_LINE_BYTES
    ):
        raise TrainingDatasetHttpTransportError(
            "Training dataset NDJSON line exceeds the transport limit."
        )

    raw = raw.rstrip(
        b"\r\n"
    )

    if not raw:
        raise TrainingDatasetHttpTransportError(
            "Training dataset NDJSON cannot contain an empty line."
        )

    try:
        text = raw.decode(
            "utf-8"
        )
    except UnicodeDecodeError as error:
        raise TrainingDatasetHttpTransportError(
            f"Training dataset NDJSON line {line_number} is not valid UTF-8."
        ) from error

    try:
        parsed = json.loads(
            text
        )
    except json.JSONDecodeError as error:
        raise TrainingDatasetHttpTransportError(
            f"Training dataset NDJSON line {line_number} is not valid JSON."
        ) from error

    if not isinstance(
        parsed,
        dict,
    ):
        raise TrainingDatasetHttpTransportError(
            f"Training dataset NDJSON line {line_number} must be a JSON object."
        )

    return parsed


def _iter_page_lines(
    file: BinaryIO,
) -> Iterator[TrainingDatasetPage]:
    line_number = 2
    page_count = 0

    while True:
        payload = _read_json_line(
            file,
            line_number=line_number,
        )

        if payload is None:
            break

        if (
            payload.get(
                "kind"
            ) !=
            "page"
        ):
            raise TrainingDatasetHttpTransportError(
                "Every training dataset NDJSON line after the manifest "
                "must be a page."
            )

        page_line = (
            TrainingDatasetHandoffPageLine.model_validate(
                payload
            )
        )

        page_count += 1

        yield page_line.page

        line_number += 1

    if page_count == 0:
        raise TrainingDatasetHttpTransportError(
            "Training dataset handoff must contain at least one page."
        )


async def _spool_request(
    request: Request,
) -> SpooledTemporaryFile[bytes]:
    content_length = (
        request.headers.get(
            "content-length"
        )
    )

    if content_length is not None:
        try:
            declared_length = int(
                content_length
            )
        except ValueError as error:
            raise TrainingDatasetHttpTransportError(
                "Invalid Content-Length header."
            ) from error

        if (
            declared_length < 0
        ):
            raise TrainingDatasetHttpTransportError(
                "Invalid Content-Length header."
            )

        if (
            declared_length >
            MAX_HANDOFF_REQUEST_BYTES
        ):
            raise HTTPException(
                status_code=status.HTTP_413_CONTENT_TOO_LARGE,
                detail="training_dataset_handoff_too_large",
            )

    file: SpooledTemporaryFile[bytes] = (
        SpooledTemporaryFile(
            max_size=SPOOL_MEMORY_LIMIT_BYTES,
            mode="w+b",
        )
    )

    received = 0

    try:
        async for chunk in request.stream():
            if not chunk:
                continue

            received += len(
                chunk
            )

            if (
                received >
                MAX_HANDOFF_REQUEST_BYTES
            ):
                raise HTTPException(
                    status_code=status.HTTP_413_CONTENT_TOO_LARGE,
                    detail="training_dataset_handoff_too_large",
                )

            file.write(
                chunk
            )

        if received == 0:
            raise TrainingDatasetHttpTransportError(
                "Training dataset handoff body cannot be empty."
            )

        file.seek(
            0
        )

        return file
    except Exception:
        file.close()
        raise


@router.post(
    "/training-dataset/handoff",
    response_model=TrainingDatasetHandoffValidationResponse,
)
async def validate_training_dataset_http_handoff(
    request: Request,
) -> TrainingDatasetHandoffValidationResponse:
    if (
        _normalized_content_type(
            request
        ) !=
        TRAINING_DATASET_HANDOFF_CONTENT_TYPE
    ):
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail="training_dataset_handoff_requires_ndjson",
        )

    try:
        file = await _spool_request(
            request
        )
    except HTTPException:
        raise
    except TrainingDatasetHttpTransportError as error:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail="training_dataset_transport_invalid",
        ) from error

    try:
        manifest_payload = (
            _read_json_line(
                file,
                line_number=1,
            )
        )

        if manifest_payload is None:
            raise TrainingDatasetHttpTransportError(
                "Training dataset handoff is missing its manifest."
            )

        if (
            manifest_payload.get(
                "kind"
            ) !=
            "manifest"
        ):
            raise TrainingDatasetHttpTransportError(
                "The first training dataset NDJSON line must be the manifest."
            )

        manifest_line = (
            TrainingDatasetHandoffManifestLine.model_validate(
                manifest_payload
            )
        )

        result = (
            validate_training_dataset_handoff(
                manifest_line.handoff,
                _iter_page_lines(
                    file
                ),
            )
        )

        return TrainingDatasetHandoffValidationResponse(
            datasetId=result.dataset_id,
            schemaVersion=result.schema_version,
            datasetChecksum=result.dataset_checksum,
            pageCount=result.page_count,
            eventCount=result.event_count,
            contentCount=result.content_count,
            sourceCutoffAt=result.source_cutoff_at,
            trainingStarted=False,
        )

    except ValidationError as error:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail="training_dataset_contract_invalid",
        ) from error

    except TrainingDatasetHttpTransportError as error:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail="training_dataset_transport_invalid",
        ) from error

    except TrainingDatasetHandoffValidationError as error:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail="training_dataset_handoff_invalid",
        ) from error

    finally:
        file.close()

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


def _iter_training_events(
    file: BinaryIO,
) -> Iterator:
    file.seek(
        0
    )

    manifest_payload = _read_json_line(
        file,
        line_number=1,
    )

    if manifest_payload is None:
        raise TrainingDatasetHttpTransportError(
            "Training dataset handoff is missing its manifest."
        )

    if (
        manifest_payload.get(
            "kind"
        ) !=
        "manifest"
    ):
        raise TrainingDatasetHttpTransportError(
            "The first training dataset NDJSON line must be the manifest."
        )

    TrainingDatasetHandoffManifestLine.model_validate(
        manifest_payload
    )

    for page in _iter_page_lines(
        file
    ):
        for event in page.events:
            yield event


def _candidate_response(
    model: TrainedEngagementModel,
) -> TrainingCandidateModel:
    return TrainingCandidateModel(
        modelId=model.model_id,
        modelType=model.model_type,
        trainingEngineVersion=(
            model.training_engine_version
        ),
        featureVersion=model.feature_version,
        featureDimension=model.feature_dimension,
        datasetId=model.dataset_id,
        datasetChecksum=model.dataset_checksum,
        trainedAt=model.trained_at,
        materializedEventCount=(
            model.materialized_event_count
        ),
        labeledEventCount=(
            model.labeled_event_count
        ),
        trainingEventCount=(
            model.training_event_count
        ),
        trainingPositiveCount=(
            model.training_positive_count
        ),
        trainingNegativeCount=(
            model.training_negative_count
        ),
        intercept=model.intercept,
        weights=list(
            model.weights
        ),
        metrics=TrainingCandidateMetrics(
            validationEventCount=(
                model.metrics
                .validation_event_count
            ),
            validationPositiveCount=(
                model.metrics
                .validation_positive_count
            ),
            validationNegativeCount=(
                model.metrics
                .validation_negative_count
            ),
            accuracy=model.metrics.accuracy,
            logLoss=model.metrics.log_loss,
            rocAuc=model.metrics.roc_auc,
        ),
        modelChecksum=model.model_checksum,
    )


@router.post(
    "/training-dataset/train",
    response_model=TrainingDatasetTrainResponse,
)
async def train_training_dataset_http(
    request: Request,
) -> TrainingDatasetTrainResponse:
    if (
        _normalized_content_type(
            request
        ) !=
        TRAINING_DATASET_HANDOFF_CONTENT_TYPE
    ):
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail="training_dataset_handoff_requires_ndjson",
        )

    try:
        file = await _spool_request(
            request
        )
    except HTTPException:
        raise
    except TrainingDatasetHttpTransportError as error:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail="training_dataset_transport_invalid",
        ) from error

    try:
        manifest_payload = _read_json_line(
            file,
            line_number=1,
        )

        if manifest_payload is None:
            raise TrainingDatasetHttpTransportError(
                "Training dataset handoff is missing its manifest."
            )

        if (
            manifest_payload.get(
                "kind"
            ) !=
            "manifest"
        ):
            raise TrainingDatasetHttpTransportError(
                "The first training dataset NDJSON line must be the manifest."
            )

        manifest_line = (
            TrainingDatasetHandoffManifestLine.model_validate(
                manifest_payload
            )
        )

        validation_result = (
            validate_training_dataset_handoff(
                manifest_line.handoff,
                _iter_page_lines(
                    file
                ),
            )
        )

        manifest = (
            manifest_line.handoff.manifest
        )

        training_result = (
            train_engagement_model(
                events=_iter_training_events(
                    file
                ),
                dataset_id=manifest.datasetId,
                dataset_checksum=(
                    manifest.datasetChecksum
                ),
                materialized_event_count=(
                    manifest.materializedEventCount
                ),
                trained_at=(
                    _utc_now_milliseconds()
                ),
            )
        )

        candidate = (
            None
            if training_result.model is None
            else _candidate_response(
                training_result.model
            )
        )

        return TrainingDatasetTrainResponse(
            status=training_result.status,
            accepted=True,
            datasetId=validation_result.dataset_id,
            schemaVersion=(
                validation_result.schema_version
            ),
            datasetChecksum=(
                validation_result.dataset_checksum
            ),
            sourceCutoffAt=(
                validation_result.source_cutoff_at.astimezone(
                    timezone.utc
                ).isoformat(
                    timespec="milliseconds"
                ).replace(
                    "+00:00",
                    "Z",
                )
            ),
            pageCount=validation_result.page_count,
            eventCount=validation_result.event_count,
            contentCount=validation_result.content_count,
            labeledEventCount=(
                training_result.labeled_event_count
            ),
            positiveEventCount=(
                training_result.positive_event_count
            ),
            negativeEventCount=(
                training_result.negative_event_count
            ),
            skippedEventCount=(
                training_result.skipped_event_count
            ),
            reason=training_result.reason,
            trainingAttempted=True,
            candidateCreated=(
                candidate is not None
            ),
            candidate=candidate,
            promoted=False,
        )

    except ValidationError as error:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail="training_dataset_contract_invalid",
        ) from error

    except TrainingDatasetHttpTransportError as error:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail="training_dataset_transport_invalid",
        ) from error

    except TrainingDatasetHandoffValidationError as error:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail="training_dataset_handoff_invalid",
        ) from error

    finally:
        file.close()