from __future__ import annotations

import hashlib
import json
import math
import re

from dataclasses import (
    dataclass,
)
from typing import (
    Iterable,
    Literal,
)

from app.models.training_dataset import (
    TrainingContentFeatures,
    TrainingDatasetEvent,
)


TRAINING_ENGINE_VERSION = (
    "hashed-logistic-engagement-v1"
)

FEATURE_VERSION = (
    "poster-content-features-v1"
)

FEATURE_DIMENSION = 512

MINIMUM_MATERIALIZED_EVENTS = 10000
MINIMUM_LABELED_EVENTS = 100
MINIMUM_CLASS_EVENTS = 10
MINIMUM_VALIDATION_EVENTS = 20

INITIAL_LEARNING_RATE = 0.08
L2_REGULARIZATION = 0.00001

TrainingEngineStatus = Literal[
    "trained",
    "not_trainable",
]


@dataclass(frozen=True)
class EngagementModelMetrics:
    validation_event_count: int
    validation_positive_count: int
    validation_negative_count: int
    accuracy: float
    log_loss: float
    roc_auc: float | None


@dataclass(frozen=True)
class TrainedEngagementModel:
    model_id: str
    model_type: Literal[
        "hashed_logistic_engagement_v1"
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
    metrics: EngagementModelMetrics
    model_checksum: str


@dataclass(frozen=True)
class TrainingEngineResult:
    status: TrainingEngineStatus
    reason: str
    materialized_event_count: int
    observed_event_count: int
    labeled_event_count: int
    skipped_event_count: int
    positive_event_count: int
    negative_event_count: int
    model: TrainedEngagementModel | None


@dataclass(frozen=True)
class _ValidationExample:
    features: dict[int, float]
    label: int


_TOKEN_PATTERN = re.compile(
    r"\w{2,}",
    flags=re.UNICODE,
)

_POSITIVE_SIGNAL_TYPES = frozenset(
    {
        "open_original_click",
        "share",
        "worth_reading",
        "helpful",
    }
)


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


def _label_event(
    event: TrainingDatasetEvent,
) -> int | None:
    signal_type = event.signalType

    if signal_type in _POSITIVE_SIGNAL_TYPES:
        return 1

    if signal_type == "bookmark":
        return (
            1
            if event.bookmarkActive is True
            else None
        )

    if signal_type == "report":
        if event.reportStatus == "dismissed":
            return None

        return 0

    # Impression is exposure, not a negative label.
    # article_feedback has no universal polarity in this
    # privacy-safe contract, so we do not invent one.
    return None


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


def _add_hashed_feature(
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

    current = features.get(
        index,
        0.0,
    )

    next_value = (
        current
        +
        (
            sign *
            amount
        )
    )

    # Bound repeated textual features so long excerpts do not
    # dominate categorical metadata.
    features[index] = max(
        -3.0,
        min(
            3.0,
            next_value,
        ),
    )


def _content_features(
    content: TrainingContentFeatures,
    *,
    dimension: int,
) -> dict[int, float]:
    if dimension < 32:
        raise ValueError(
            "feature dimension must be at least 32."
        )

    features: dict[int, float] = {}

    quality_score = float(
        content.qualityScore
    )

    if not math.isfinite(
        quality_score
    ):
        raise ValueError(
            "qualityScore must be finite."
        )

    features[0] = max(
        0.0,
        min(
            1.0,
            quality_score,
        ),
    )

    categorical_values = (
        (
            "media",
            content.mediaType,
        ),
        (
            "language",
            content.languageCode,
        ),
        (
            "region",
            content.regionCode,
        ),
        (
            "category",
            content.category,
        ),
    )

    for prefix, value in categorical_values:
        if value is None:
            continue

        _add_hashed_feature(
            features,
            f"{prefix}:{value}",
            dimension=dimension,
        )

    for value in content.canonicalTopicIds:
        _add_hashed_feature(
            features,
            f"canonical-topic:{value}",
            dimension=dimension,
        )

    for value in content.evolvingTopicIds:
        _add_hashed_feature(
            features,
            f"evolving-topic:{value}",
            dimension=dimension,
        )

    for value in content.tags:
        _add_hashed_feature(
            features,
            f"tag:{value}",
            dimension=dimension,
        )

    for value in content.searchKeywords:
        _add_hashed_feature(
            features,
            f"keyword:{value}",
            dimension=dimension,
        )

    text = (
        f"{content.title} "
        f"{content.excerpt}"
    )

    tokens = _TOKEN_PATTERN.findall(
        text.casefold()
    )[:96]

    for token in tokens:
        _add_hashed_feature(
            features,
            f"text:{token}",
            dimension=dimension,
            amount=0.5,
        )

    return features


def _validation_partition(
    content_id: str,
) -> bool:
    digest = hashlib.sha256(
        content_id.encode(
            "utf-8"
        )
    ).digest()

    # Stable ~20% holdout by content id. All events belonging
    # to the same content stay on one side of the split.
    return digest[0] < 51


def _sigmoid(
    value: float,
) -> float:
    bounded = max(
        -35.0,
        min(
            35.0,
            value,
        ),
    )

    return (
        1.0
        /
        (
            1.0
            +
            math.exp(
                -bounded
            )
        )
    )


def _linear_score(
    *,
    intercept: float,
    weights: list[float] | tuple[float, ...],
    features: dict[int, float],
) -> float:
    score = intercept

    for index, value in features.items():
        score += (
            weights[index]
            *
            value
        )

    return score


def _train_example(
    *,
    weights: list[float],
    intercept: float,
    features: dict[int, float],
    label: int,
    step: int,
) -> float:
    probability = _sigmoid(
        _linear_score(
            intercept=intercept,
            weights=weights,
            features=features,
        )
    )

    error = (
        probability -
        float(
            label
        )
    )

    learning_rate = (
        INITIAL_LEARNING_RATE
        /
        math.sqrt(
            1.0
            +
            (
                step /
                1000.0
            )
        )
    )

    next_intercept = (
        intercept
        -
        (
            learning_rate *
            error
        )
    )

    for index, value in features.items():
        gradient = (
            error *
            value
        ) + (
            L2_REGULARIZATION *
            weights[index]
        )

        weights[index] -= (
            learning_rate *
            gradient
        )

    return next_intercept


def _roc_auc(
    scored_labels: list[
        tuple[
            float,
            int,
        ]
    ],
) -> float | None:
    positive_count = sum(
        1
        for _, label in scored_labels
        if label == 1
    )

    negative_count = (
        len(
            scored_labels
        )
        -
        positive_count
    )

    if (
        positive_count == 0
        or negative_count == 0
    ):
        return None

    ordered = sorted(
        scored_labels,
        key=lambda item: item[0],
    )

    positive_rank_sum = 0.0
    index = 0

    while index < len(
        ordered
    ):
        end = index + 1

        while (
            end < len(
                ordered
            )
            and ordered[end][0]
            == ordered[index][0]
        ):
            end += 1

        average_rank = (
            (
                index +
                1
            )
            +
            end
        ) / 2.0

        positive_in_group = sum(
            1
            for _, label in ordered[
                index:end
            ]
            if label == 1
        )

        positive_rank_sum += (
            average_rank *
            positive_in_group
        )

        index = end

    auc = (
        positive_rank_sum
        -
        (
            positive_count
            *
            (
                positive_count +
                1
            )
            /
            2.0
        )
    ) / (
        positive_count *
        negative_count
    )

    return max(
        0.0,
        min(
            1.0,
            auc,
        ),
    )


def _evaluate_model(
    *,
    intercept: float,
    weights: tuple[float, ...],
    validation_examples: list[
        _ValidationExample
    ],
) -> EngagementModelMetrics:
    correct = 0
    loss_total = 0.0
    scored_labels: list[
        tuple[
            float,
            int,
        ]
    ] = []

    positive_count = 0

    for example in validation_examples:
        probability = _sigmoid(
            _linear_score(
                intercept=intercept,
                weights=weights,
                features=example.features,
            )
        )

        predicted = (
            1
            if probability >= 0.5
            else 0
        )

        if predicted == example.label:
            correct += 1

        if example.label == 1:
            positive_count += 1

        bounded_probability = max(
            1e-12,
            min(
                1.0 -
                1e-12,
                probability,
            ),
        )

        loss_total += -(
            example.label
            *
            math.log(
                bounded_probability
            )
            +
            (
                1 -
                example.label
            )
            *
            math.log(
                1.0 -
                bounded_probability
            )
        )

        scored_labels.append(
            (
                probability,
                example.label,
            )
        )

    count = len(
        validation_examples
    )

    return EngagementModelMetrics(
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
            loss_total /
            count
        ),
        roc_auc=_roc_auc(
            scored_labels
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
    metrics: EngagementModelMetrics,
) -> dict[str, object]:
    return {
        "modelType":
            "hashed_logistic_engagement_v1",

        "trainingEngineVersion":
            TRAINING_ENGINE_VERSION,

        "featureVersion":
            FEATURE_VERSION,

        "featureDimension":
            FEATURE_DIMENSION,

        "datasetId":
            dataset_id,

        "datasetChecksum":
            dataset_checksum,

        "trainedAt":
            trained_at,

        "materializedEventCount":
            materialized_event_count,

        "labeledEventCount":
            labeled_event_count,

        "trainingEventCount":
            training_event_count,

        "trainingPositiveCount":
            training_positive_count,

        "trainingNegativeCount":
            training_negative_count,

        "intercept":
            intercept,

        "weights":
            list(
                weights
            ),

        "metrics": {
            "validationEventCount":
                metrics.validation_event_count,

            "validationPositiveCount":
                metrics.validation_positive_count,

            "validationNegativeCount":
                metrics.validation_negative_count,

            "accuracy":
                metrics.accuracy,

            "logLoss":
                metrics.log_loss,

            "rocAuc":
                metrics.roc_auc,
        },
    }


def train_engagement_model(
    *,
    events: Iterable[
        TrainingDatasetEvent
    ],
    dataset_id: str,
    dataset_checksum: str,
    materialized_event_count: int,
    trained_at: str,
) -> TrainingEngineResult:
    cleaned_dataset_id = _clean_required_text(
        dataset_id,
        "dataset_id",
    )

    cleaned_checksum = _validate_checksum(
        dataset_checksum
    )

    cleaned_trained_at = _clean_required_text(
        trained_at,
        "trained_at",
    )

    if materialized_event_count < (
        MINIMUM_MATERIALIZED_EVENTS
    ):
        return TrainingEngineResult(
            status="not_trainable",
            reason="materialized_event_threshold_not_met",
            materialized_event_count=materialized_event_count,
            observed_event_count=0,
            labeled_event_count=0,
            skipped_event_count=0,
            positive_event_count=0,
            negative_event_count=0,
            model=None,
        )

    weights = [
        0.0
        for _ in range(
            FEATURE_DIMENSION
        )
    ]

    intercept = 0.0
    observed_event_count = 0
    labeled_event_count = 0
    skipped_event_count = 0

    training_event_count = 0
    training_positive_count = 0
    training_negative_count = 0

    validation_examples: list[
        _ValidationExample
    ] = []

    positive_event_count = 0
    negative_event_count = 0

    for event in events:
        observed_event_count += 1

        label = _label_event(
            event
        )

        if label is None:
            skipped_event_count += 1
            continue

        labeled_event_count += 1

        if label == 1:
            positive_event_count += 1
        else:
            negative_event_count += 1

        features = _content_features(
            event.content,
            dimension=FEATURE_DIMENSION,
        )

        if _validation_partition(
            event.content.contentId
        ):
            validation_examples.append(
                _ValidationExample(
                    features=features,
                    label=label,
                )
            )

            continue

        training_event_count += 1

        if label == 1:
            training_positive_count += 1
        else:
            training_negative_count += 1

        intercept = _train_example(
            weights=weights,
            intercept=intercept,
            features=features,
            label=label,
            step=training_event_count,
        )

    if (
        observed_event_count !=
        materialized_event_count
    ):
        return TrainingEngineResult(
            status="not_trainable",
            reason="materialized_event_count_mismatch",
            materialized_event_count=materialized_event_count,
            observed_event_count=observed_event_count,
            labeled_event_count=labeled_event_count,
            skipped_event_count=skipped_event_count,
            positive_event_count=positive_event_count,
            negative_event_count=negative_event_count,
            model=None,
        )

    if labeled_event_count < (
        MINIMUM_LABELED_EVENTS
    ):
        return TrainingEngineResult(
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
        training_positive_count <
        MINIMUM_CLASS_EVENTS
        or training_negative_count <
        MINIMUM_CLASS_EVENTS
    ):
        return TrainingEngineResult(
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

    if len(
        validation_examples
    ) < MINIMUM_VALIDATION_EVENTS:
        return TrainingEngineResult(
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
        return TrainingEngineResult(
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

    frozen_weights = tuple(
        weights
    )

    metrics = _evaluate_model(
        intercept=intercept,
        weights=frozen_weights,
        validation_examples=validation_examples,
    )

    payload = _model_payload(
        dataset_id=cleaned_dataset_id,
        dataset_checksum=cleaned_checksum,
        trained_at=cleaned_trained_at,
        materialized_event_count=materialized_event_count,
        labeled_event_count=labeled_event_count,
        training_event_count=training_event_count,
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
        "poster-engagement-v1-" +
        checksum[:16]
    )

    model = TrainedEngagementModel(
        model_id=model_id,
        model_type="hashed_logistic_engagement_v1",
        training_engine_version=TRAINING_ENGINE_VERSION,
        feature_version=FEATURE_VERSION,
        feature_dimension=FEATURE_DIMENSION,
        dataset_id=cleaned_dataset_id,
        dataset_checksum=cleaned_checksum,
        trained_at=cleaned_trained_at,
        materialized_event_count=materialized_event_count,
        labeled_event_count=labeled_event_count,
        training_event_count=training_event_count,
        training_positive_count=training_positive_count,
        training_negative_count=training_negative_count,
        intercept=intercept,
        weights=frozen_weights,
        metrics=metrics,
        model_checksum=model_checksum,
    )

    return TrainingEngineResult(
        status="trained",
        reason="candidate_model_trained",
        materialized_event_count=materialized_event_count,
        observed_event_count=observed_event_count,
        labeled_event_count=labeled_event_count,
        skipped_event_count=skipped_event_count,
        positive_event_count=positive_event_count,
        negative_event_count=negative_event_count,
        model=model,
    )


def score_engagement_probability(
    *,
    model: TrainedEngagementModel,
    content: TrainingContentFeatures,
) -> float:
    if (
        model.feature_dimension !=
        FEATURE_DIMENSION
        or model.feature_version !=
        FEATURE_VERSION
    ):
        raise ValueError(
            "Unsupported Poster engagement model feature contract."
        )

    features = _content_features(
        content,
        dimension=model.feature_dimension,
    )

    return _sigmoid(
        _linear_score(
            intercept=model.intercept,
            weights=model.weights,
            features=features,
        )
    )