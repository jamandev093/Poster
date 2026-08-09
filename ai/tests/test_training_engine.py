from __future__ import annotations

import unittest

from app.models.training_dataset import (
    TrainingDatasetEvent,
)
from app.services.training_engine import (
    FEATURE_DIMENSION,
    train_engagement_model,
    score_engagement_probability,
)


DATASET_ID = (
    "11111111-1111-4111-8111-111111111111"
)

DATASET_CHECKSUM = (
    "sha256:" +
    ("a" * 64)
)

TRAINED_AT = (
    "2026-08-10T02:30:00.000Z"
)

MATERIALIZED_EVENT_COUNT = 10000


def create_event(
    *,
    index: int,
    signal_type: str,
    positive_content: bool,
    bookmark_active: bool | None = None,
    report_status: str | None = None,
) -> TrainingDatasetEvent:
    topic = (
        "useful-technology"
        if positive_content
        else "misleading-rumor"
    )

    title = (
        "Reliable technology research and useful cloud engineering"
        if positive_content
        else "Misleading rumor with unverified deceptive claims"
    )

    return TrainingDatasetEvent.model_validate(
        {
            "schemaVersion": 1,
            "eventKey": (
                f"{signal_type}:event-{index:05d}"
            ),
            "source": (
                "report"
                if signal_type == "report"
                else (
                    "bookmark"
                    if signal_type == "bookmark"
                    else "organic_content_event"
                )
            ),
            "sourceEventId": (
                f"event-{index:05d}"
            ),
            "signalType": signal_type,
            "occurredAt": (
                "2026-08-09T15:00:00.000Z"
            ),
            "surface": "home",
            "reasonId": (
                "reason-quality"
                if signal_type == "report"
                else None
            ),
            "reportStatus": report_status,
            "bookmarkActive": bookmark_active,
            "content": {
                "contentId": (
                    (
                        "positive-content-"
                        if positive_content
                        else "negative-content-"
                    )
                    +
                    f"{index:05d}"
                ),
                "sourceKey": "example-feed",
                "publisherName": "Example Publisher",
                "title": title,
                "excerpt": title,
                "mediaType": "article",
                "languageCode": "en",
                "regionCode": "IN",
                "category": (
                    "technology"
                    if positive_content
                    else "general"
                ),
                "canonicalTopicIds": [
                    topic,
                ],
                "evolvingTopicIds": [
                    topic,
                ],
                "tags": [
                    topic,
                ],
                "searchKeywords": [
                    topic,
                ],
                "aiClassification": {
                    "category": (
                        "technology"
                        if positive_content
                        else "general"
                    ),
                },
                "qualityScore": (
                    0.9
                    if positive_content
                    else 0.2
                ),
                "publishedAt": (
                    "2026-08-09T10:00:00.000Z"
                ),
                "contentStatus": "active",
            },
        }
    )


def create_training_dataset() -> tuple[
    TrainingDatasetEvent,
    ...,
]:
    events: list[
        TrainingDatasetEvent
    ] = []

    # Strong positive organic engagement.
    for index in range(
        300
    ):
        signal = (
            "open_original_click"
            if index % 2 == 0
            else "share"
        )

        events.append(
            create_event(
                index=index,
                signal_type=signal,
                positive_content=True,
            )
        )

    # Explicit negative moderation-quality signal.
    for index in range(
        300,
        500,
    ):
        events.append(
            create_event(
                index=index,
                signal_type="report",
                positive_content=False,
                report_status="resolved",
            )
        )

    # Real impressions remain in the frozen dataset but are
    # deliberately not converted into negative labels.
    for index in range(
        500,
        MATERIALIZED_EVENT_COUNT,
    ):
        events.append(
            create_event(
                index=index,
                signal_type="impression",
                positive_content=(
                    index % 2 == 0
                ),
            )
        )

    return tuple(
        events
    )


class TrainingEngineTests(
    unittest.TestCase
):
    @classmethod
    def setUpClass(
        cls,
    ) -> None:
        cls.events = (
            create_training_dataset()
        )

    def test_trains_real_candidate_model_from_strong_organic_signals(
        self,
    ) -> None:
        result = train_engagement_model(
            events=self.events,
            dataset_id=DATASET_ID,
            dataset_checksum=DATASET_CHECKSUM,
            materialized_event_count=MATERIALIZED_EVENT_COUNT,
            trained_at=TRAINED_AT,
        )

        self.assertEqual(
            result.status,
            "trained",
        )

        self.assertEqual(
            result.reason,
            "candidate_model_trained",
        )

        self.assertEqual(
            result.observed_event_count,
            MATERIALIZED_EVENT_COUNT,
        )

        self.assertEqual(
            result.labeled_event_count,
            500,
        )

        self.assertEqual(
            result.skipped_event_count,
            9500,
        )

        self.assertEqual(
            result.positive_event_count,
            300,
        )

        self.assertEqual(
            result.negative_event_count,
            200,
        )

        self.assertIsNotNone(
            result.model
        )

        model = result.model

        assert model is not None

        self.assertEqual(
            model.model_type,
            "hashed_logistic_engagement_v1",
        )

        self.assertEqual(
            model.feature_dimension,
            FEATURE_DIMENSION,
        )

        self.assertEqual(
            len(
                model.weights
            ),
            FEATURE_DIMENSION,
        )

        self.assertTrue(
            model.model_id.startswith(
                "poster-engagement-v1-"
            )
        )

        self.assertTrue(
            model.model_checksum.startswith(
                "sha256:"
            )
        )

        self.assertGreater(
            model.training_positive_count,
            0,
        )

        self.assertGreater(
            model.training_negative_count,
            0,
        )

        self.assertGreaterEqual(
            model.metrics.validation_event_count,
            20,
        )

        self.assertIsNotNone(
            model.metrics.roc_auc
        )

    def test_learned_model_scores_positive_content_above_reported_content(
        self,
    ) -> None:
        result = train_engagement_model(
            events=self.events,
            dataset_id=DATASET_ID,
            dataset_checksum=DATASET_CHECKSUM,
            materialized_event_count=MATERIALIZED_EVENT_COUNT,
            trained_at=TRAINED_AT,
        )

        model = result.model

        assert model is not None

        positive_content = create_event(
            index=20000,
            signal_type="open_original_click",
            positive_content=True,
        ).content

        negative_content = create_event(
            index=20001,
            signal_type="report",
            positive_content=False,
            report_status="resolved",
        ).content

        positive_score = (
            score_engagement_probability(
                model=model,
                content=positive_content,
            )
        )

        negative_score = (
            score_engagement_probability(
                model=model,
                content=negative_content,
            )
        )

        self.assertGreater(
            positive_score,
            negative_score,
        )

    def test_training_is_deterministic_for_same_frozen_dataset(
        self,
    ) -> None:
        first = train_engagement_model(
            events=self.events,
            dataset_id=DATASET_ID,
            dataset_checksum=DATASET_CHECKSUM,
            materialized_event_count=MATERIALIZED_EVENT_COUNT,
            trained_at=TRAINED_AT,
        )

        second = train_engagement_model(
            events=self.events,
            dataset_id=DATASET_ID,
            dataset_checksum=DATASET_CHECKSUM,
            materialized_event_count=MATERIALIZED_EVENT_COUNT,
            trained_at=TRAINED_AT,
        )

        assert first.model is not None
        assert second.model is not None

        self.assertEqual(
            first.model.model_id,
            second.model.model_id,
        )

        self.assertEqual(
            first.model.model_checksum,
            second.model.model_checksum,
        )

        self.assertEqual(
            first.model.weights,
            second.model.weights,
        )

        self.assertEqual(
            first.model.intercept,
            second.model.intercept,
        )

    def test_does_not_invent_negative_labels_from_impressions_or_dismissed_reports(
        self,
    ) -> None:
        events = [
            create_event(
                index=index,
                signal_type="impression",
                positive_content=True,
            )
            for index in range(
                MATERIALIZED_EVENT_COUNT -
                1
            )
        ]

        events.append(
            create_event(
                index=MATERIALIZED_EVENT_COUNT,
                signal_type="report",
                positive_content=False,
                report_status="dismissed",
            )
        )

        result = train_engagement_model(
            events=events,
            dataset_id=DATASET_ID,
            dataset_checksum=DATASET_CHECKSUM,
            materialized_event_count=MATERIALIZED_EVENT_COUNT,
            trained_at=TRAINED_AT,
        )

        self.assertEqual(
            result.status,
            "not_trainable",
        )

        self.assertEqual(
            result.reason,
            "insufficient_labeled_events",
        )

        self.assertEqual(
            result.labeled_event_count,
            0,
        )

        self.assertEqual(
            result.negative_event_count,
            0,
        )

    def test_inactive_bookmark_is_not_rewritten_as_negative_feedback(
        self,
    ) -> None:
        events = [
            create_event(
                index=index,
                signal_type="impression",
                positive_content=True,
            )
            for index in range(
                MATERIALIZED_EVENT_COUNT -
                1
            )
        ]

        events.append(
            create_event(
                index=MATERIALIZED_EVENT_COUNT,
                signal_type="bookmark",
                positive_content=True,
                bookmark_active=False,
            )
        )

        result = train_engagement_model(
            events=events,
            dataset_id=DATASET_ID,
            dataset_checksum=DATASET_CHECKSUM,
            materialized_event_count=MATERIALIZED_EVENT_COUNT,
            trained_at=TRAINED_AT,
        )

        self.assertEqual(
            result.status,
            "not_trainable",
        )

        self.assertEqual(
            result.labeled_event_count,
            0,
        )

    def test_refuses_training_when_frozen_event_count_does_not_match_manifest(
        self,
    ) -> None:
        result = train_engagement_model(
            events=self.events[:-1],
            dataset_id=DATASET_ID,
            dataset_checksum=DATASET_CHECKSUM,
            materialized_event_count=MATERIALIZED_EVENT_COUNT,
            trained_at=TRAINED_AT,
        )

        self.assertEqual(
            result.status,
            "not_trainable",
        )

        self.assertEqual(
            result.reason,
            "materialized_event_count_mismatch",
        )

        self.assertIsNone(
            result.model
        )

    def test_refuses_training_below_locked_10000_event_threshold(
        self,
    ) -> None:
        result = train_engagement_model(
            events=(),
            dataset_id=DATASET_ID,
            dataset_checksum=DATASET_CHECKSUM,
            materialized_event_count=9999,
            trained_at=TRAINED_AT,
        )

        self.assertEqual(
            result.status,
            "not_trainable",
        )

        self.assertEqual(
            result.reason,
            "materialized_event_threshold_not_met",
        )

        self.assertIsNone(
            result.model
        )


if __name__ == "__main__":
    unittest.main()