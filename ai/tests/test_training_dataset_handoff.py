from __future__ import annotations

import hashlib
import unittest

from datetime import (
    datetime,
    timedelta,
    timezone,
)

from app.models.training_dataset import (
    TrainingDatasetEvent,
    TrainingDatasetHandoffRequest,
    TrainingDatasetManifest,
    TrainingDatasetPage,
)

from app.services.training_dataset_handoff import (
    TrainingDatasetHandoffValidationError,
    _canonical_event_bytes,
    _serialize_backend_json,
    validate_training_dataset_handoff,
)


UTC = timezone.utc

SOURCE_CUTOFF = datetime(
    2026,
    8,
    9,
    16,
    0,
    0,
    tzinfo=UTC,
)

TRAINING_EVENT_COUNT = 10000


def event_time(
    index: int,
) -> datetime:
    return (
        SOURCE_CUTOFF -
        timedelta(
            seconds=index + 1,
        )
    )


def create_event(
    index: int,
    *,
    occurred_at: datetime | None = None,
    event_key: str | None = None,
    quality_score: float = 0.8,
) -> TrainingDatasetEvent:
    if occurred_at is None:
        occurred_at = event_time(
            index
        )

    if event_key is None:
        event_key = (
            "organic_content_event:"
            f"event-{index:05d}"
        )

    return TrainingDatasetEvent(
        schemaVersion=1,
        eventKey=event_key,
        source="organic_content_event",
        sourceEventId=f"event-{index:05d}",
        signalType="impression",
        occurredAt=occurred_at,
        surface="home",
        reasonId=None,
        reportStatus=None,
        bookmarkActive=None,
        content={
            "contentId": (
                f"content-{index % 20:02d}"
            ),
            "sourceKey": "example-feed",
            "publisherName": "Example Publisher",
            "title": f"Example title {index}",
            "excerpt": "Example excerpt",
            "mediaType": "article",
            "languageCode": "en",
            "regionCode": "IN",
            "category": "technology",
            "canonicalTopicIds": [
                "ai",
            ],
            "evolvingTopicIds": [
                "agents",
            ],
            "tags": [
                "AI",
            ],
            "searchKeywords": [
                "artificial intelligence",
            ],
            "aiClassification": {
                "category": "technology",
                "confidence": 0.91,
            },
            "qualityScore": quality_score,
            "publishedAt": (
                SOURCE_CUTOFF -
                timedelta(days=1)
            ),
            "contentStatus": "active",
        },
    )


def create_training_events() -> list[TrainingDatasetEvent]:
    return [
        create_event(
            index
        )
        for index in range(
            TRAINING_EVENT_COUNT
        )
    ]


def dataset_checksum(
    events: list[TrainingDatasetEvent],
) -> str:
    checksum = hashlib.sha256()

    for event in events:
        checksum.update(
            _canonical_event_bytes(
                event
            )
        )

        checksum.update(
            b"\n"
        )

    return (
        "sha256:" +
        checksum.hexdigest()
    )


def create_manifest(
    *,
    events: list[TrainingDatasetEvent] | None = None,
    checksum: str | None = None,
    content_count: int = 20,
    first_event_at: datetime | None = None,
    last_event_at: datetime | None = None,
) -> TrainingDatasetManifest:
    if events is None:
        events = create_training_events()

    if first_event_at is None:
        first_event_at = (
            events[-1].occurredAt
        )

    if last_event_at is None:
        last_event_at = (
            events[0].occurredAt
        )

    if checksum is None:
        checksum = dataset_checksum(
            events
        )

    return TrainingDatasetManifest(
        datasetId="dataset-1",
        schemaVersion=1,
        sourceEventCount=len(
            events
        ),
        materializedEventCount=len(
            events
        ),
        materializedContentCount=content_count,
        sourceCutoffAt=SOURCE_CUTOFF,
        firstEventAt=first_event_at,
        lastEventAt=last_event_at,
        datasetChecksum=checksum,
    )


def create_handoff(
    manifest: TrainingDatasetManifest,
) -> TrainingDatasetHandoffRequest:
    return TrainingDatasetHandoffRequest(
        manifest=manifest,
    )


def create_pages(
    events: list[TrainingDatasetEvent],
    manifest: TrainingDatasetManifest,
    *,
    page_size: int = 2500,
) -> list[TrainingDatasetPage]:
    pages: list[
        TrainingDatasetPage
    ] = []

    for start in range(
        0,
        len(events),
        page_size,
    ):
        end = min(
            start + page_size,
            len(events),
        )

        pages.append(
            TrainingDatasetPage(
                datasetId=manifest.datasetId,
                schemaVersion=1,
                pageNumber=(
                    len(pages) + 1
                ),
                events=events[
                    start:end
                ],
                isFinalPage=(
                    end ==
                    len(events)
                ),
            )
        )

    return pages


class TrainingDatasetHandoffServiceTests(
    unittest.TestCase
):
    def test_accepts_valid_10000_event_multi_page_stream_with_real_checksum(
        self,
    ) -> None:
        events = create_training_events()

        manifest = create_manifest(
            events=events,
        )

        pages = create_pages(
            events,
            manifest,
        )

        result = (
            validate_training_dataset_handoff(
                create_handoff(
                    manifest
                ),
                pages,
            )
        )

        self.assertEqual(
            result.dataset_id,
            "dataset-1",
        )

        self.assertEqual(
            result.schema_version,
            1,
        )

        self.assertEqual(
            result.dataset_checksum,
            dataset_checksum(
                events
            ),
        )

        self.assertEqual(
            result.page_count,
            4,
        )

        self.assertEqual(
            result.event_count,
            TRAINING_EVENT_COUNT,
        )

        self.assertEqual(
            result.content_count,
            20,
        )

        self.assertEqual(
            result.first_event_at,
            manifest.firstEventAt,
        )

        self.assertEqual(
            result.last_event_at,
            manifest.lastEventAt,
        )

        self.assertEqual(
            result.source_cutoff_at,
            SOURCE_CUTOFF,
        )

    def test_rejects_dataset_checksum_tampering(
        self,
    ) -> None:
        events = create_training_events()

        manifest = create_manifest(
            events=events,
            checksum=(
                "sha256:" +
                ("0" * 64)
            ),
        )

        with self.assertRaisesRegex(
            TrainingDatasetHandoffValidationError,
            "checksum",
        ):
            validate_training_dataset_handoff(
                create_handoff(
                    manifest
                ),
                create_pages(
                    events,
                    manifest,
                ),
            )

    def test_rejects_materialized_content_count_mismatch(
        self,
    ) -> None:
        events = create_training_events()

        manifest = create_manifest(
            events=events,
            content_count=21,
        )

        with self.assertRaisesRegex(
            TrainingDatasetHandoffValidationError,
            "materializedContentCount",
        ):
            validate_training_dataset_handoff(
                create_handoff(
                    manifest
                ),
                create_pages(
                    events,
                    manifest,
                ),
            )

    def test_backend_json_serializer_preserves_unicode_utf16_key_order_and_number_rules(
        self,
    ) -> None:
        value = {
            "\ue000": "private-use",
            "\U00010000": "supplementary",
            "unicode": "café 東京 🚀",
            "numbers": [
                1.0,
                -0.0,
                0.8,
                1e-7,
                1e-6,
                1e20,
                1e21,
            ],
            "a": True,
        }

        serialized = (
            _serialize_backend_json(
                value
            )
        )

        expected = (
            '{"a":true,'
            '"numbers":['
            '1,'
            '0,'
            '0.8,'
            '1e-7,'
            '0.000001,'
            '100000000000000000000,'
            '1e+21'
            '],'
            '"unicode":"café 東京 🚀",'
            '"𐀀":"supplementary",'
            '"":"private-use"}'
        )

        self.assertEqual(
            serialized,
            expected,
        )

    def test_canonical_event_uses_backend_utc_millisecond_timestamp_format(
        self,
    ) -> None:
        india = timezone(
            timedelta(
                hours=5,
                minutes=30,
            )
        )

        event = create_event(
            0,
            occurred_at=datetime(
                2026,
                8,
                9,
                20,
                30,
                0,
                123456,
                tzinfo=india,
            ),
            quality_score=1.0,
        )

        serialized = (
            _canonical_event_bytes(
                event
            ).decode(
                "utf-8"
            )
        )

        self.assertIn(
            (
                '"occurredAt":'
                '"2026-08-09T15:00:00.123Z"'
            ),
            serialized,
        )

        self.assertIn(
            '"qualityScore":1',
            serialized,
        )

        self.assertNotIn(
            '"qualityScore":1.0',
            serialized,
        )

    def test_rejects_wrong_dataset_id(
        self,
    ) -> None:
        events = create_training_events()
        manifest = create_manifest(
            events=events,
        )

        page = TrainingDatasetPage(
            datasetId="different-dataset",
            schemaVersion=1,
            pageNumber=1,
            events=[
                events[0],
            ],
            isFinalPage=True,
        )

        with self.assertRaisesRegex(
            TrainingDatasetHandoffValidationError,
            "datasetId",
        ):
            validate_training_dataset_handoff(
                create_handoff(
                    manifest
                ),
                [
                    page,
                ],
            )

    def test_rejects_wrong_page_schema_version(
        self,
    ) -> None:
        events = create_training_events()
        manifest = create_manifest(
            events=events,
        )

        page = TrainingDatasetPage(
            datasetId=manifest.datasetId,
            schemaVersion=1,
            pageNumber=1,
            events=[
                events[0],
            ],
            isFinalPage=True,
        )

        mismatched_page = (
            page.model_copy(
                update={
                    "schemaVersion": 2,
                }
            )
        )

        with self.assertRaisesRegex(
            TrainingDatasetHandoffValidationError,
            "schemaVersion",
        ):
            validate_training_dataset_handoff(
                create_handoff(
                    manifest
                ),
                [
                    mismatched_page,
                ],
            )

    def test_rejects_skipped_page_number(
        self,
    ) -> None:
        events = create_training_events()
        manifest = create_manifest(
            events=events,
        )

        page = TrainingDatasetPage(
            datasetId=manifest.datasetId,
            schemaVersion=1,
            pageNumber=2,
            events=[
                events[0],
            ],
            isFinalPage=True,
        )

        with self.assertRaisesRegex(
            TrainingDatasetHandoffValidationError,
            "contiguous",
        ):
            validate_training_dataset_handoff(
                create_handoff(
                    manifest
                ),
                [
                    page,
                ],
            )

    def test_rejects_replayed_page_number(
        self,
    ) -> None:
        events = create_training_events()
        manifest = create_manifest(
            events=events,
        )

        first_page = TrainingDatasetPage(
            datasetId=manifest.datasetId,
            schemaVersion=1,
            pageNumber=1,
            events=[
                events[0],
            ],
            isFinalPage=False,
        )

        replayed_page = TrainingDatasetPage(
            datasetId=manifest.datasetId,
            schemaVersion=1,
            pageNumber=1,
            events=[
                events[1],
            ],
            isFinalPage=True,
        )

        with self.assertRaisesRegex(
            TrainingDatasetHandoffValidationError,
            "contiguous",
        ):
            validate_training_dataset_handoff(
                create_handoff(
                    manifest
                ),
                [
                    first_page,
                    replayed_page,
                ],
            )

    def test_rejects_duplicate_event_order_key(
        self,
    ) -> None:
        events = create_training_events()
        manifest = create_manifest(
            events=events,
        )

        duplicate = events[0]

        page = TrainingDatasetPage(
            datasetId=manifest.datasetId,
            schemaVersion=1,
            pageNumber=1,
            events=[
                duplicate,
                duplicate,
            ],
            isFinalPage=True,
        )

        with self.assertRaisesRegex(
            TrainingDatasetHandoffValidationError,
            "strict descending",
        ):
            validate_training_dataset_handoff(
                create_handoff(
                    manifest
                ),
                [
                    page,
                ],
            )

    def test_rejects_out_of_order_events_across_pages(
        self,
    ) -> None:
        events = create_training_events()
        manifest = create_manifest(
            events=events,
        )

        first_page = TrainingDatasetPage(
            datasetId=manifest.datasetId,
            schemaVersion=1,
            pageNumber=1,
            events=[
                events[1],
            ],
            isFinalPage=False,
        )

        second_page = TrainingDatasetPage(
            datasetId=manifest.datasetId,
            schemaVersion=1,
            pageNumber=2,
            events=[
                events[0],
            ],
            isFinalPage=True,
        )

        with self.assertRaisesRegex(
            TrainingDatasetHandoffValidationError,
            "strict descending",
        ):
            validate_training_dataset_handoff(
                create_handoff(
                    manifest
                ),
                [
                    first_page,
                    second_page,
                ],
            )

    def test_rejects_event_after_frozen_source_cutoff(
        self,
    ) -> None:
        events = create_training_events()
        manifest = create_manifest(
            events=events,
        )

        violating_event = create_event(
            0,
            occurred_at=(
                SOURCE_CUTOFF +
                timedelta(seconds=1)
            ),
        )

        page = TrainingDatasetPage(
            datasetId=manifest.datasetId,
            schemaVersion=1,
            pageNumber=1,
            events=[
                violating_event,
            ],
            isFinalPage=True,
        )

        with self.assertRaisesRegex(
            TrainingDatasetHandoffValidationError,
            "source cutoff",
        ):
            validate_training_dataset_handoff(
                create_handoff(
                    manifest
                ),
                [
                    page,
                ],
            )

    def test_rejects_materialized_event_count_mismatch(
        self,
    ) -> None:
        events = create_training_events()
        manifest = create_manifest(
            events=events,
        )

        page = TrainingDatasetPage(
            datasetId=manifest.datasetId,
            schemaVersion=1,
            pageNumber=1,
            events=[
                events[0],
            ],
            isFinalPage=True,
        )

        with self.assertRaisesRegex(
            TrainingDatasetHandoffValidationError,
            "materializedEventCount",
        ):
            validate_training_dataset_handoff(
                create_handoff(
                    manifest
                ),
                [
                    page,
                ],
            )

    def test_rejects_manifest_timestamp_range_mismatch(
        self,
    ) -> None:
        events = create_training_events()

        actual_first = (
            events[-1].occurredAt
        )

        actual_last = (
            events[0].occurredAt
        )

        manifest = create_manifest(
            events=events,
            first_event_at=(
                actual_first -
                timedelta(seconds=1)
            ),
            last_event_at=actual_last,
        )

        with self.assertRaisesRegex(
            TrainingDatasetHandoffValidationError,
            "earliest event",
        ):
            validate_training_dataset_handoff(
                create_handoff(
                    manifest
                ),
                create_pages(
                    events,
                    manifest,
                ),
            )

    def test_rejects_missing_final_page(
        self,
    ) -> None:
        events = create_training_events()
        manifest = create_manifest(
            events=events,
        )

        page = TrainingDatasetPage(
            datasetId=manifest.datasetId,
            schemaVersion=1,
            pageNumber=1,
            events=[
                events[0],
            ],
            isFinalPage=False,
        )

        with self.assertRaisesRegex(
            TrainingDatasetHandoffValidationError,
            "missing its final page",
        ):
            validate_training_dataset_handoff(
                create_handoff(
                    manifest
                ),
                [
                    page,
                ],
            )

    def test_rejects_page_after_final_page(
        self,
    ) -> None:
        events = create_training_events()
        manifest = create_manifest(
            events=events,
        )

        final_page = TrainingDatasetPage(
            datasetId=manifest.datasetId,
            schemaVersion=1,
            pageNumber=1,
            events=[
                events[0],
            ],
            isFinalPage=True,
        )

        extra_page = TrainingDatasetPage(
            datasetId=manifest.datasetId,
            schemaVersion=1,
            pageNumber=2,
            events=[
                events[1],
            ],
            isFinalPage=True,
        )

        with self.assertRaisesRegex(
            TrainingDatasetHandoffValidationError,
            "after the final page",
        ):
            validate_training_dataset_handoff(
                create_handoff(
                    manifest
                ),
                [
                    final_page,
                    extra_page,
                ],
            )


if __name__ == "__main__":
    unittest.main()