from __future__ import annotations

import hashlib
import json
import math

from dataclasses import dataclass
from typing import (
    Iterable,
    Literal,
)


ADVERTISING_TRAINING_ENGINE_VERSION = (
    "hashed-logistic-ad-response-v1"
)

ADVERTISING_FEATURE_VERSION = (
    "advertising-campaign-placement-v1"
)

ADVERTISING_FEATURE_DIMENSION = 256

MINIMUM_MATERIALIZED_EVENTS = 10_000
MINIMUM_LABELED_EVENTS = 100
MINIMUM_CLASS_EVENTS = 10
MINIMUM_VALIDATION_EVENTS = 20

INITIAL_LEARNING_RATE = 0.06
L2_REGULARIZATION = 0.00001

AdvertisingTrainingEventType = Literal[
    "impression",
    "click",
    "conversion",
]

AdvertisingTrainingPlacement = Literal[
    "home",
    "search",
    "trending",
]

AdvertisingTrainingStatus = Literal[
    "trained",
    "not_trainable",
]


@dataclass(
    frozen=True,
    slots=True,
)
class AdvertisingTrainingEvent:
    event_key: str
    source_event_id: str
    campaign_id: str
    event_type: AdvertisingTrainingEventType
    placement: AdvertisingTrainingPlacement
    occurred_at: str


@dataclass(
    frozen=True,
    slots=True,
)
class AdvertisingModelMetrics:
    validation_event_count: int
    validation_positive_count: int
    validation_negative_count: int
    accuracy: float
    log_loss: float
    roc_auc: float | None


@dataclass(
    frozen=True,
    slots=True,
)
class TrainedAdvertisingResponseModel:
    model_id: str

    model_type: Literal[
        "hashed_logistic_ad_response_v1"
    ]

    training_engine_version: str
    feature_version: str
    feature_dimension: int

    dataset_id: str
    dataset_checksum: str
    trained_at: str

    materialized_event_count: int
    labeled_event_count: int

    training_event_count: int
    training_positive_count: int
    training_negative_count: int

    intercept: float
    weights: tuple[float, ...]

    metrics: AdvertisingModelMetrics

    model_checksum: str


@dataclass(
    frozen=True,
    slots=True,
)
class AdvertisingTrainingResult:
    status: AdvertisingTrainingStatus
    reason: str

    materialized_event_count: int
    observed_event_count: int
    labeled_event_count: int
    skipped_event_count: int

    positive_event_count: int
    negative_event_count: int

    model: TrainedAdvertisingResponseModel | None


@dataclass(
    frozen=True,
    slots=True,
)
class _TrainingExample:
    features: dict[int, float]
    label: int


def _clean_required_text(
    value: str,
    field_name: str,
) -> str:
    cleaned = value.strip()

    if not cleaned:
        raise ValueError(
            f"{field_name} cannot be empty."
        )

    return cleaned


def _validate_checksum(
    value: str,
) -> str:
    cleaned = _clean_required_text(
        value,
        "dataset_checksum",
    )

    if (
        len(cleaned) != 71
        or not cleaned.startswith(
            "sha256:"
        )
    ):
        raise ValueError(
            "dataset_checksum must be a sha256 checksum."
        )

    hexadecimal = cleaned[7:]

    if any(
        character not in
        "0123456789abcdefABCDEF"
        for character in hexadecimal
    ):
        raise ValueError(
            "dataset_checksum must be a sha256 checksum."
        )

    return cleaned.lower()


def _validate_event(
    event: AdvertisingTrainingEvent,
) -> None:
    _clean_required_text(
        event.event_key,
        "event_key",
    )

    _clean_required_text(
        event.source_event_id,
        "source_event_id",
    )

    _clean_required_text(
        event.campaign_id,
        "campaign_id",
    )

    _clean_required_text(
        event.occurred_at,
        "occurred_at",
    )

    if event.event_type not in {
        "impression",
        "click",
        "conversion",
    }:
        raise ValueError(
            "Unsupported Advertising AI event type."
        )

    if event.placement not in {
        "home",
        "search",
        "trending",
    }:
        raise ValueError(
            "Unsupported Advertising AI placement."
        )


def _label_event(
    event: AdvertisingTrainingEvent,
) -> int:
    if event.event_type == "impression":
        return 0

    if event.event_type in {
        "click",
        "conversion",
    }:
        return 1

    raise ValueError(
        "Unsupported Advertising AI event type."
    )


def _hash_feature(
    value: str,
    *,
    dimension: int,
) -> tuple[int, float]:
    digest = hashlib.sha256(
        value.encode(
            "utf-8"
        )
    ).digest()

    index = (
        1
        +
        (
            int.from_bytes(
                digest[:8],
                byteorder="big",
                signed=False,
            )
            %
            (
                dimension -
                1
            )
        )
    )

    sign = (
        1.0
        if digest[8] & 1 == 0
        else -1.0
    )

    return (
        index,
        sign,
    )


def _add_feature(
    features: dict[int, float],
    value: str,
    *,
    dimension: int,
    amount: float = 1.0,
) -> None:
    cleaned = value.strip().casefold()

    if not cleaned:
        return

    index, sign = _hash_feature(
        cleaned,
        dimension=dimension,
    )

    features[index] = (
        features.get(
            index,
            0.0,
        )
        +
        sign * amount
    )


def _event_features(
    event: AdvertisingTrainingEvent,
    *,
    dimension: int,
) -> dict[int, float]:
    features: dict[int, float] = {
        0: 1.0,
    }

    _add_feature(
        features,
        f"campaign:{event.campaign_id}",
        dimension=dimension,
    )

    _add_feature(
        features,
        f"placement:{event.placement}",
        dimension=dimension,
    )

    _add_feature(
        features,
        (
            "campaign-placement:"
            f"{event.campaign_id}:"
            f"{event.placement}"
        ),
        dimension=dimension,
    )

    return features


def _is_validation_event(
    event: AdvertisingTrainingEvent,
) -> bool:
    digest = hashlib.sha256(
        (
            "advertising-validation:"
            + event.source_event_id
        ).encode(
            "utf-8"
        )
    ).digest()

    bucket = int.from_bytes(
        digest[:8],
        byteorder="big",
        signed=False,
    ) % 100

    return bucket < 20


def _sigmoid(
    value: float,
) -> float:
    if value >= 0:
        exponent = math.exp(
            -value
        )

        return 1.0 / (
            1.0 +
            exponent
        )

    exponent = math.exp(
        value
    )

    return exponent / (
        1.0 +
        exponent
    )


def _linear_score(
    *,
    intercept: float,
    weights: tuple[float, ...] | list[float],
    features: dict[int, float],
) -> float:
    result = intercept

    for index, amount in features.items():
        if index == 0:
            continue

        result += (
            weights[index] *
            amount
        )

    return result


def _roc_auc(
    examples: list[
        tuple[
            float,
            int,
        ]
    ],
) -> float | None:
    positives = [
        score
        for score, label in examples
        if label == 1
    ]

    negatives = [
        score
        for score, label in examples
        if label == 0
    ]

    if (
        not positives
        or not negatives
    ):
        return None

    wins = 0.0

    for positive in positives:
        for negative in negatives:
            if positive > negative:
                wins += 1.0
            elif positive == negative:
                wins += 0.5

    return wins / (
        len(positives) *
        len(negatives)
    )


def _evaluate(
    *,
    intercept: float,
    weights: tuple[float, ...],
    examples: list[_TrainingExample],
) -> AdvertisingModelMetrics:
    correct = 0
    loss = 0.0

    scored: list[
        tuple[
            float,
            int,
        ]
    ] = []

    positive_count = 0

    for example in examples:
        probability = _sigmoid(
            _linear_score(
                intercept=intercept,
                weights=weights,
                features=example.features,
            )
        )

        clipped = min(
            max(
                probability,
                1e-12,
            ),
            1.0 - 1e-12,
        )

        prediction = (
            1
            if probability >= 0.5
            else 0
        )

        if prediction == example.label:
            correct += 1

        if example.label == 1:
            positive_count += 1
            loss -= math.log(
                clipped
            )
        else:
            loss -= math.log(
                1.0 -
                clipped
            )

        scored.append(
            (
                probability,
                example.label,
            )
        )

    count = len(
        examples
    )

    return AdvertisingModelMetrics(
        validation_event_count=count,
        validation_positive_count=positive_count,
        validation_negative_count=(
            count -
            positive_count
        ),
        accuracy=(
            correct /
            count
        ),
        log_loss=(
            loss /
            count
        ),
        roc_auc=_roc_auc(
            scored
        ),
    )


def _model_payload(
    *,
    dataset_id: str,
    dataset_checksum: str,
    trained_at: str,
    materialized_event_count: int,
    labeled_event_count: int,
    training_event_count: int,
    training_positive_count: int,
    training_negative_count: int,
    intercept: float,
    weights: tuple[float, ...],
    metrics: AdvertisingModelMetrics,
) -> dict[str, object]:
    return {
        "datasetChecksum":
            dataset_checksum,

        "datasetId":
            dataset_id,

        "featureDimension":
            ADVERTISING_FEATURE_DIMENSION,

        "featureVersion":
            ADVERTISING_FEATURE_VERSION,

        "intercept":
            intercept,

        "labeledEventCount":
            labeled_event_count,

        "materializedEventCount":
            materialized_event_count,

        "metrics": {
            "accuracy":
                metrics.accuracy,

            "logLoss":
                metrics.log_loss,

            "rocAuc":
                metrics.roc_auc,

            "validationEventCount":
                metrics.validation_event_count,

            "validationNegativeCount":
                metrics.validation_negative_count,

            "validationPositiveCount":
                metrics.validation_positive_count,
        },

        "modelType":
            "hashed_logistic_ad_response_v1",

        "trainedAt":
            trained_at,

        "trainingEngineVersion":
            ADVERTISING_TRAINING_ENGINE_VERSION,

        "trainingEventCount":
            training_event_count,

        "trainingNegativeCount":
            training_negative_count,

        "trainingPositiveCount":
            training_positive_count,

        "weights":
            list(
                weights
            ),
    }


def train_advertising_response_model(
    *,
    events: Iterable[
        AdvertisingTrainingEvent
    ],
    dataset_id: str,
    dataset_checksum: str,
    materialized_event_count: int,
    trained_at: str,
) -> AdvertisingTrainingResult:
    cleaned_dataset_id = (
        _clean_required_text(
            dataset_id,
            "dataset_id",
        )
    )

    cleaned_checksum = (
        _validate_checksum(
            dataset_checksum
        )
    )

    cleaned_trained_at = (
        _clean_required_text(
            trained_at,
            "trained_at",
        )
    )

    if (
        not isinstance(
            materialized_event_count,
            int,
        )
        or isinstance(
            materialized_event_count,
            bool,
        )
        or materialized_event_count < 0
    ):
        raise ValueError(
            "materialized_event_count must be a non-negative integer."
        )

    if (
        materialized_event_count <
        MINIMUM_MATERIALIZED_EVENTS
    ):
        return AdvertisingTrainingResult(
            status="not_trainable",
            reason="insufficient_materialized_events",
            materialized_event_count=materialized_event_count,
            observed_event_count=0,
            labeled_event_count=0,
            skipped_event_count=0,
            positive_event_count=0,
            negative_event_count=0,
            model=None,
        )

    training_examples: list[
        _TrainingExample
    ] = []

    validation_examples: list[
        _TrainingExample
    ] = []

    source_event_ids: set[str] = set()

    observed_event_count = 0
    positive_event_count = 0
    negative_event_count = 0

    for event in events:
        _validate_event(
            event
        )

        if (
            event.source_event_id
            in source_event_ids
        ):
            raise ValueError(
                "Duplicate Advertising AI source event id."
            )

        source_event_ids.add(
            event.source_event_id
        )

        observed_event_count += 1

        label = _label_event(
            event
        )

        if label == 1:
            positive_event_count += 1
        else:
            negative_event_count += 1

        example = _TrainingExample(
            features=_event_features(
                event,
                dimension=(
                    ADVERTISING_FEATURE_DIMENSION
                ),
            ),
            label=label,
        )

        if _is_validation_event(
            event
        ):
            validation_examples.append(
                example
            )
        else:
            training_examples.append(
                example
            )

    if (
        observed_event_count !=
        materialized_event_count
    ):
        raise ValueError(
            "Advertising AI observed event count does not match materialized_event_count."
        )

    labeled_event_count = (
        observed_event_count
    )

    skipped_event_count = 0

    if (
        labeled_event_count <
        MINIMUM_LABELED_EVENTS
    ):
        return AdvertisingTrainingResult(
            status="not_trainable",
            reason="insufficient_labeled_events",
            materialized_event_count=materialized_event_count,
            observed_event_count=observed_event_count,
            labeled_event_count=labeled_event_count,
            skipped_event_count=skipped_event_count,
            positive_event_count=positive_event_count,
            negative_event_count=negative_event_count,
            model=None,
        )

    if (
        positive_event_count <
        MINIMUM_CLASS_EVENTS
        or negative_event_count <
        MINIMUM_CLASS_EVENTS
    ):
        return AdvertisingTrainingResult(
            status="not_trainable",
            reason="insufficient_class_diversity",
            materialized_event_count=materialized_event_count,
            observed_event_count=observed_event_count,
            labeled_event_count=labeled_event_count,
            skipped_event_count=skipped_event_count,
            positive_event_count=positive_event_count,
            negative_event_count=negative_event_count,
            model=None,
        )

    if (
        len(
            validation_examples
        ) <
        MINIMUM_VALIDATION_EVENTS
    ):
        return AdvertisingTrainingResult(
            status="not_trainable",
            reason="insufficient_validation_events",
            materialized_event_count=materialized_event_count,
            observed_event_count=observed_event_count,
            labeled_event_count=labeled_event_count,
            skipped_event_count=skipped_event_count,
            positive_event_count=positive_event_count,
            negative_event_count=negative_event_count,
            model=None,
        )

    validation_positive_count = sum(
        1
        for example in validation_examples
        if example.label == 1
    )

    validation_negative_count = (
        len(
            validation_examples
        )
        -
        validation_positive_count
    )

    if (
        validation_positive_count == 0
        or validation_negative_count == 0
    ):
        return AdvertisingTrainingResult(
            status="not_trainable",
            reason="insufficient_validation_class_diversity",
            materialized_event_count=materialized_event_count,
            observed_event_count=observed_event_count,
            labeled_event_count=labeled_event_count,
            skipped_event_count=skipped_event_count,
            positive_event_count=positive_event_count,
            negative_event_count=negative_event_count,
            model=None,
        )

    training_positive_count = sum(
        1
        for example in training_examples
        if example.label == 1
    )

    training_negative_count = (
        len(
            training_examples
        )
        -
        training_positive_count
    )

    if (
        training_positive_count <
        MINIMUM_CLASS_EVENTS
        or training_negative_count <
        MINIMUM_CLASS_EVENTS
    ):
        return AdvertisingTrainingResult(
            status="not_trainable",
            reason="insufficient_training_class_diversity",
            materialized_event_count=materialized_event_count,
            observed_event_count=observed_event_count,
            labeled_event_count=labeled_event_count,
            skipped_event_count=skipped_event_count,
            positive_event_count=positive_event_count,
            negative_event_count=negative_event_count,
            model=None,
        )

    weights = [
        0.0
        for _ in range(
            ADVERTISING_FEATURE_DIMENSION
        )
    ]

    positive_ratio = (
        training_positive_count /
        len(
            training_examples
        )
    )

    positive_ratio = min(
        max(
            positive_ratio,
            1e-6,
        ),
        1.0 - 1e-6,
    )

    intercept = math.log(
        positive_ratio /
        (
            1.0 -
            positive_ratio
        )
    )

    for index, example in enumerate(
        training_examples
    ):
        probability = _sigmoid(
            _linear_score(
                intercept=intercept,
                weights=weights,
                features=example.features,
            )
        )

        error = (
            example.label -
            probability
        )

        learning_rate = (
            INITIAL_LEARNING_RATE /
            math.sqrt(
                1.0 +
                (
                    index /
                    1000.0
                )
            )
        )

        intercept += (
            learning_rate *
            error
        )

        for feature_index, amount in (
            example.features.items()
        ):
            if feature_index == 0:
                continue

            weights[
                feature_index
            ] += (
                learning_rate *
                (
                    error *
                    amount
                    -
                    L2_REGULARIZATION *
                    weights[
                        feature_index
                    ]
                )
            )

    frozen_weights = tuple(
        weights
    )

    metrics = _evaluate(
        intercept=intercept,
        weights=frozen_weights,
        examples=validation_examples,
    )

    payload = _model_payload(
        dataset_id=cleaned_dataset_id,
        dataset_checksum=cleaned_checksum,
        trained_at=cleaned_trained_at,
        materialized_event_count=materialized_event_count,
        labeled_event_count=labeled_event_count,
        training_event_count=len(
            training_examples
        ),
        training_positive_count=training_positive_count,
        training_negative_count=training_negative_count,
        intercept=intercept,
        weights=frozen_weights,
        metrics=metrics,
    )

    canonical_payload = json.dumps(
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

    checksum = hashlib.sha256(
        canonical_payload
    ).hexdigest()

    model_checksum = (
        "sha256:" +
        checksum
    )

    model_id = (
        "poster-ad-response-v1-" +
        checksum[:16]
    )

    model = TrainedAdvertisingResponseModel(
        model_id=model_id,
        model_type=(
            "hashed_logistic_ad_response_v1"
        ),
        training_engine_version=(
            ADVERTISING_TRAINING_ENGINE_VERSION
        ),
        feature_version=(
            ADVERTISING_FEATURE_VERSION
        ),
        feature_dimension=(
            ADVERTISING_FEATURE_DIMENSION
        ),
        dataset_id=cleaned_dataset_id,
        dataset_checksum=cleaned_checksum,
        trained_at=cleaned_trained_at,
        materialized_event_count=(
            materialized_event_count
        ),
        labeled_event_count=(
            labeled_event_count
        ),
        training_event_count=len(
            training_examples
        ),
        training_positive_count=(
            training_positive_count
        ),
        training_negative_count=(
            training_negative_count
        ),
        intercept=intercept,
        weights=frozen_weights,
        metrics=metrics,
        model_checksum=model_checksum,
    )

    return AdvertisingTrainingResult(
        status="trained",
        reason="advertising_candidate_model_trained",
        materialized_event_count=(
            materialized_event_count
        ),
        observed_event_count=(
            observed_event_count
        ),
        labeled_event_count=(
            labeled_event_count
        ),
        skipped_event_count=(
            skipped_event_count
        ),
        positive_event_count=(
            positive_event_count
        ),
        negative_event_count=(
            negative_event_count
        ),
        model=model,
    )


def score_advertising_response_probability(
    *,
    model: TrainedAdvertisingResponseModel,
    campaign_id: str,
    placement: AdvertisingTrainingPlacement,
) -> float:
    if (
        model.feature_dimension !=
        ADVERTISING_FEATURE_DIMENSION
        or model.feature_version !=
        ADVERTISING_FEATURE_VERSION
    ):
        raise ValueError(
            "Unsupported Advertising AI model feature contract."
        )

    event = AdvertisingTrainingEvent(
        event_key="score",
        source_event_id="score",
        campaign_id=_clean_required_text(
            campaign_id,
            "campaign_id",
        ),
        event_type="impression",
        placement=placement,
        occurred_at="score",
    )

    features = _event_features(
        event,
        dimension=model.feature_dimension,
    )

    return _sigmoid(
        _linear_score(
            intercept=model.intercept,
            weights=model.weights,
            features=features,
        )
    )