from __future__ import annotations

from typing import Literal

from pydantic import (
    BaseModel,
    ConfigDict,
    Field,
    field_validator,
)

from datetime import datetime


def _validate_utc_timestamp(
    value: str,
) -> str:
    try:
        parsed = datetime.fromisoformat(
            value.replace(
                "Z",
                "+00:00",
            )
        )
    except ValueError as error:
        raise ValueError(
            "Timestamp is invalid."
        ) from error

    if parsed.tzinfo is None:
        raise ValueError(
            "Timestamp must include timezone information."
        )

    return value


class AdvertisingTrainingManifestLine(
    BaseModel
):
    model_config = ConfigDict(
        extra="forbid",
        strict=True,
    )

    recordType: Literal[
        "manifest"
    ]

    schemaVersion: Literal[
        1
    ]

    datasetId: str = Field(
        min_length=1,
        max_length=200,
    )

    datasetChecksum: str = Field(
        pattern=(
            r"^sha256:[0-9a-f]{64}$"
        )
    )

    sourceCutoffAt: str

    materializedEventCount: int = Field(
        ge=10_000,
        le=250_000,
    )

    @field_validator(
        "sourceCutoffAt"
    )
    @classmethod
    def validate_source_cutoff(
        cls,
        value: str,
    ) -> str:
        return _validate_utc_timestamp(
            value
        )


class AdvertisingTrainingEventLine(
    BaseModel
):
    model_config = ConfigDict(
        extra="forbid",
        strict=True,
    )

    recordType: Literal[
        "event"
    ]

    eventKey: str = Field(
        min_length=1,
        max_length=300,
    )

    sourceEventId: str = Field(
        min_length=1,
        max_length=200,
    )

    campaignId: str = Field(
        min_length=1,
        max_length=200,
    )

    eventType: Literal[
        "impression",
        "click",
        "conversion",
    ]

    placement: Literal[
        "home",
        "search",
        "trending",
    ]

    occurredAt: str

    @field_validator(
        "occurredAt"
    )
    @classmethod
    def validate_occurred_at(
        cls,
        value: str,
    ) -> str:
        return _validate_utc_timestamp(
            value
        )


class AdvertisingTrainingCandidateMetrics(
    BaseModel
):
    model_config = ConfigDict(
        extra="forbid",
        strict=True,
    )

    validationEventCount: int
    validationPositiveCount: int
    validationNegativeCount: int

    accuracy: float
    logLoss: float

    rocAuc: float | None


class AdvertisingTrainingCandidateModel(
    BaseModel
):
    model_config = ConfigDict(
        extra="forbid",
        strict=True,
    )

    modelId: str

    modelType: Literal[
        "hashed_logistic_ad_response_v1"
    ]

    trainingEngineVersion: str
    featureVersion: str

    featureDimension: Literal[
        256
    ]

    datasetId: str
    datasetChecksum: str
    trainedAt: str

    materializedEventCount: int
    labeledEventCount: int

    trainingEventCount: int
    trainingPositiveCount: int
    trainingNegativeCount: int

    intercept: float

    weights: list[float] = Field(
        min_length=256,
        max_length=256,
    )

    metrics: AdvertisingTrainingCandidateMetrics

    modelChecksum: str


class AdvertisingTrainingHttpResponse(
    BaseModel
):
    model_config = ConfigDict(
        extra="forbid",
        strict=True,
    )

    status: Literal[
        "trained",
        "not_trainable",
    ]

    accepted: Literal[
        True
    ]

    datasetId: str

    schemaVersion: Literal[
        1
    ]

    datasetChecksum: str
    sourceCutoffAt: str

    materializedEventCount: int

    trainingAttempted: Literal[
        True
    ]

    candidateCreated: bool

    reason: str

    observedEventCount: int
    labeledEventCount: int
    skippedEventCount: int

    positiveEventCount: int
    negativeEventCount: int

    candidate: AdvertisingTrainingCandidateModel | None

    promoted: Literal[
        False
    ]