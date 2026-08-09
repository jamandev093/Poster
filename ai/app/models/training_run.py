from __future__ import annotations

from typing import (
    Literal,
)

from pydantic import (
    BaseModel,
    ConfigDict,
    Field,
)


class TrainingCandidateMetrics(
    BaseModel
):
    model_config = ConfigDict(
        extra="forbid",
    )

    validationEventCount: int = Field(
        ge=0,
    )

    validationPositiveCount: int = Field(
        ge=0,
    )

    validationNegativeCount: int = Field(
        ge=0,
    )

    accuracy: float = Field(
        ge=0.0,
        le=1.0,
    )

    logLoss: float = Field(
        ge=0.0,
    )

    rocAuc: float | None = Field(
        default=None,
        ge=0.0,
        le=1.0,
    )


class TrainingCandidateModel(
    BaseModel
):
    model_config = ConfigDict(
        extra="forbid",
    )

    modelId: str

    modelType: Literal[
        "hashed_logistic_engagement_v1"
    ]

    trainingEngineVersion: str

    featureVersion: str

    featureDimension: int = Field(
        ge=1,
    )

    datasetId: str

    datasetChecksum: str

    trainedAt: str

    materializedEventCount: int = Field(
        ge=0,
    )

    labeledEventCount: int = Field(
        ge=0,
    )

    trainingEventCount: int = Field(
        ge=0,
    )

    trainingPositiveCount: int = Field(
        ge=0,
    )

    trainingNegativeCount: int = Field(
        ge=0,
    )

    intercept: float

    weights: list[float]

    metrics: TrainingCandidateMetrics

    modelChecksum: str


class TrainingDatasetTrainResponse(
    BaseModel
):
    model_config = ConfigDict(
        extra="forbid",
    )

    status: Literal[
        "trained",
        "not_trainable",
    ]

    accepted: Literal[
        True
    ] = True

    datasetId: str

    schemaVersion: Literal[
        1
    ]

    datasetChecksum: str

    sourceCutoffAt: str

    pageCount: int = Field(
        ge=0,
    )

    eventCount: int = Field(
        ge=0,
    )

    contentCount: int = Field(
        ge=0,
    )

    labeledEventCount: int = Field(
        ge=0,
    )

    positiveEventCount: int = Field(
        ge=0,
    )

    negativeEventCount: int = Field(
        ge=0,
    )

    skippedEventCount: int = Field(
        ge=0,
    )

    reason: str

    trainingAttempted: Literal[
        True
    ] = True

    candidateCreated: bool

    candidate: TrainingCandidateModel | None

    promoted: Literal[
        False
    ] = False