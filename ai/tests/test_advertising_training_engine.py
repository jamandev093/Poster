from __future__ import annotations

import unittest

from app.services.advertising_training_engine import (
    ADVERTISING_FEATURE_DIMENSION,
    ADVERTISING_FEATURE_VERSION,
    ADVERTISING_TRAINING_ENGINE_VERSION,
    AdvertisingTrainingEvent,
    score_advertising_response_probability,
    train_advertising_response_model,
)


DATASET_ID = (
    "00000000-0000-4000-8000-000000000301"
)

DATASET_CHECKSUM = (
    "sha256:" +
    "a" * 64
)

TRAINED_AT = (
    "2026-08-10T17:30:00.000Z"
)


def _event(
    index: int,
    *,
    event_type: str | None = None,
) -> AdvertisingTrainingEvent:
    campaign_number = (
        index %
        100
    )

    campaign_id = (
        "00000000-0000-4000-8000-"
        f"{campaign_number:012d}"
    )

    if event_type is None:
        event_type = (
            "click"
            if campaign_number < 20
            else "impression"
        )

    placement = (
        "home"
        if index % 3 == 0
        else (
            "search"
            if index % 3 == 1
            else "trending"
        )
    )

    return AdvertisingTrainingEvent(
        event_key=(
            f"advertising:event-{index:05d}"
        ),
        source_event_id=(
            "10000000-0000-4000-8000-"
            f"{index:012d}"
        ),
        campaign_id=campaign_id,
        event_type=event_type,  # type: ignore[arg-type]
        placement=placement,
        occurred_at=(
            "2026-08-10T15:00:00.000Z"
        ),
    )


def _dataset(
    count: int = 10_000,
) -> list[AdvertisingTrainingEvent]:
    return [
        _event(
            index
        )
        for index in range(
            count
        )
    ]


class AdvertisingTrainingEngineTests(
    unittest.TestCase
):
    def test_trains_real_advertising_response_candidate(
        self,
    ) -> None:
        result = train_advertising_response_model(
            events=_dataset(),
            dataset_id=DATASET_ID,
            dataset_checksum=(
                DATASET_CHECKSUM
            ),
            materialized_event_count=(
                10_000
            ),
            trained_at=TRAINED_AT,
        )

        self.assertEqual(
            result.status,
            "trained",
        )

        self.assertEqual(
            result.reason,
            "advertising_candidate_model_trained",
        )

        self.assertEqual(
            result.observed_event_count,
            10_000,
        )

        self.assertEqual(
            result.labeled_event_count,
            10_000,
        )

        self.assertEqual(
            result.skipped_event_count,
            0,
        )

        self.assertEqual(
            result.positive_event_count,
            2_000,
        )

        self.assertEqual(
            result.negative_event_count,
            8_000,
        )

        self.assertIsNotNone(
            result.model
        )

        assert result.model is not None

        self.assertEqual(
            result.model.model_type,
            "hashed_logistic_ad_response_v1",
        )

        self.assertEqual(
            result.model.training_engine_version,
            ADVERTISING_TRAINING_ENGINE_VERSION,
        )

        self.assertEqual(
            result.model.feature_version,
            ADVERTISING_FEATURE_VERSION,
        )

        self.assertEqual(
            result.model.feature_dimension,
            ADVERTISING_FEATURE_DIMENSION,
        )

        self.assertEqual(
            len(
                result.model.weights
            ),
            ADVERTISING_FEATURE_DIMENSION,
        )

        self.assertTrue(
            result.model.model_id.startswith(
                "poster-ad-response-v1-"
            )
        )

        self.assertEqual(
            len(
                result.model.model_checksum
            ),
            71,
        )

        self.assertTrue(
            result.model.model_checksum.startswith(
                "sha256:"
            )
        )

        self.assertGreater(
            result.model.metrics
            .validation_event_count,
            20,
        )

        self.assertGreater(
            result.model.metrics
            .validation_positive_count,
            0,
        )

        self.assertGreater(
            result.model.metrics
            .validation_negative_count,
            0,
        )

    def test_learns_campaign_response_difference(
        self,
    ) -> None:
        result = train_advertising_response_model(
            events=_dataset(),
            dataset_id=DATASET_ID,
            dataset_checksum=(
                DATASET_CHECKSUM
            ),
            materialized_event_count=(
                10_000
            ),
            trained_at=TRAINED_AT,
        )

        assert result.model is not None

        high_response = (
            score_advertising_response_probability(
                model=result.model,
                campaign_id=(
                    "00000000-0000-4000-8000-"
                    "000000000005"
                ),
                placement="home",
            )
        )

        low_response = (
            score_advertising_response_probability(
                model=result.model,
                campaign_id=(
                    "00000000-0000-4000-8000-"
                    "000000000075"
                ),
                placement="home",
            )
        )

        self.assertGreater(
            high_response,
            low_response,
        )

        self.assertGreaterEqual(
            high_response,
            0.0,
        )

        self.assertLessEqual(
            high_response,
            1.0,
        )

    def test_training_is_deterministic_for_same_dataset_and_training_time(
        self,
    ) -> None:
        first = train_advertising_response_model(
            events=_dataset(),
            dataset_id=DATASET_ID,
            dataset_checksum=(
                DATASET_CHECKSUM
            ),
            materialized_event_count=(
                10_000
            ),
            trained_at=TRAINED_AT,
        )

        second = train_advertising_response_model(
            events=_dataset(),
            dataset_id=DATASET_ID,
            dataset_checksum=(
                DATASET_CHECKSUM
            ),
            materialized_event_count=(
                10_000
            ),
            trained_at=TRAINED_AT,
        )

        self.assertEqual(
            first,
            second,
        )

    def test_refuses_below_materialized_threshold(
        self,
    ) -> None:
        result = train_advertising_response_model(
            events=[],
            dataset_id=DATASET_ID,
            dataset_checksum=(
                DATASET_CHECKSUM
            ),
            materialized_event_count=(
                9_999
            ),
            trained_at=TRAINED_AT,
        )

        self.assertEqual(
            result.status,
            "not_trainable",
        )

        self.assertEqual(
            result.reason,
            "insufficient_materialized_events",
        )

        self.assertIsNone(
            result.model
        )

    def test_refuses_missing_class_diversity(
        self,
    ) -> None:
        events = [
            _event(
                index,
                event_type="impression",
            )
            for index in range(
                10_000
            )
        ]

        result = train_advertising_response_model(
            events=events,
            dataset_id=DATASET_ID,
            dataset_checksum=(
                DATASET_CHECKSUM
            ),
            materialized_event_count=(
                10_000
            ),
            trained_at=TRAINED_AT,
        )

        self.assertEqual(
            result.status,
            "not_trainable",
        )

        self.assertEqual(
            result.reason,
            "insufficient_class_diversity",
        )

        self.assertIsNone(
            result.model
        )

    def test_refuses_materialized_event_count_mismatch(
        self,
    ) -> None:
        with self.assertRaisesRegex(
            ValueError,
            "observed event count",
        ):
            train_advertising_response_model(
                events=_dataset(
                    9_999
                ),
                dataset_id=DATASET_ID,
                dataset_checksum=(
                    DATASET_CHECKSUM
                ),
                materialized_event_count=(
                    10_000
                ),
                trained_at=TRAINED_AT,
            )

    def test_rejects_duplicate_frozen_source_events(
        self,
    ) -> None:
        events = _dataset()

        events[-1] = events[0]

        with self.assertRaisesRegex(
            ValueError,
            "Duplicate Advertising AI source event id",
        ):
            train_advertising_response_model(
                events=events,
                dataset_id=DATASET_ID,
                dataset_checksum=(
                    DATASET_CHECKSUM
                ),
                materialized_event_count=(
                    10_000
                ),
                trained_at=TRAINED_AT,
            )


if __name__ == "__main__":
    unittest.main()