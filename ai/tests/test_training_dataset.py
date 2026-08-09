from __future__ import annotations

import unittest

from pydantic import ValidationError

from app.models.training_dataset import (
    TrainingDatasetEvent,
    TrainingDatasetHandoffRequest,
    TrainingDatasetManifest,
    TrainingDatasetPage,
)


CHECKSUM = (
    "sha256:"
    "0123456789abcdef"
    "0123456789abcdef"
    "0123456789abcdef"
    "0123456789abcdef"
)


def create_manifest_payload() -> dict[str, object]:
    return {
        "datasetId": "dataset-1",
        "schemaVersion": 1,
        "sourceEventCount": 12000,
        "materializedEventCount": 10000,
        "materializedContentCount": 1500,
        "sourceCutoffAt": "2026-08-09T16:00:00Z",
        "firstEventAt": "2026-08-01T00:00:00Z",
        "lastEventAt": "2026-08-09T15:59:00Z",
        "datasetChecksum": CHECKSUM,
    }


def create_event_payload() -> dict[str, object]:
    return {
        "schemaVersion": 1,
        "eventKey": "organic_content_event:event-1",
        "source": "organic_content_event",
        "sourceEventId": "event-1",
        "signalType": "open_original_click",
        "occurredAt": "2026-08-09T15:30:00Z",
        "surface": "home",
        "reasonId": None,
        "reportStatus": None,
        "bookmarkActive": None,
        "content": {
            "contentId": "content-1",
            "sourceKey": "example-feed",
            "publisherName": "Example Publisher",
            "title": "Example title",
            "excerpt": "Example excerpt",
            "mediaType": "article",
            "languageCode": "en",
            "regionCode": "IN",
            "category": "technology",
            "canonicalTopicIds": ["ai"],
            "evolvingTopicIds": ["agents"],
            "tags": ["AI"],
            "searchKeywords": [
                "artificial intelligence",
            ],
            "aiClassification": {
                "category": "technology",
                "confidence": 0.91,
            },
            "qualityScore": 0.8,
            "publishedAt": "2026-08-09T14:00:00Z",
            "contentStatus": "active",
        },
    }


class TrainingDatasetContractTests(unittest.TestCase):
    def test_accepts_valid_frozen_manifest_and_page(self) -> None:
        manifest = TrainingDatasetManifest(
            **create_manifest_payload()
        )

        event = TrainingDatasetEvent(
            **create_event_payload()
        )

        page = TrainingDatasetPage(
            datasetId="dataset-1",
            schemaVersion=1,
            pageNumber=1,
            events=[event],
            isFinalPage=True,
        )

        handoff = TrainingDatasetHandoffRequest(
            manifest=manifest,
        )

        self.assertEqual(
            manifest.materializedEventCount,
            10000,
        )

        self.assertEqual(
            page.events[0].signalType,
            "open_original_click",
        )

        self.assertEqual(
            handoff.manifest.datasetChecksum,
            CHECKSUM,
        )

    def test_rejects_manifest_below_materialized_threshold(self) -> None:
        payload = create_manifest_payload()
        payload["materializedEventCount"] = 9999

        with self.assertRaises(ValidationError):
            TrainingDatasetManifest(
                **payload
            )

    def test_rejects_invalid_checksum_and_invalid_event_range(self) -> None:
        invalid_checksum = create_manifest_payload()
        invalid_checksum["datasetChecksum"] = "not-a-checksum"

        with self.assertRaises(ValidationError):
            TrainingDatasetManifest(
                **invalid_checksum
            )

        invalid_range = create_manifest_payload()
        invalid_range["firstEventAt"] = "2026-08-09T16:01:00Z"
        invalid_range["lastEventAt"] = "2026-08-09T16:02:00Z"

        with self.assertRaises(ValidationError):
            TrainingDatasetManifest(
                **invalid_range
            )

    def test_rejects_materialized_count_above_source_count(self) -> None:
        payload = create_manifest_payload()
        payload["sourceEventCount"] = 10000
        payload["materializedEventCount"] = 10001

        with self.assertRaises(ValidationError):
            TrainingDatasetManifest(
                **payload
            )

    def test_rejects_user_identity_and_arbitrary_event_metadata(self) -> None:
        user_payload = create_event_payload()
        user_payload["userId"] = "user-1"

        with self.assertRaises(ValidationError):
            TrainingDatasetEvent(
                **user_payload
            )

        metadata_payload = create_event_payload()
        metadata_payload["metadata"] = {
            "device": "private-device-data",
        }

        with self.assertRaises(ValidationError):
            TrainingDatasetEvent(
                **metadata_payload
            )

        details_payload = create_event_payload()
        details_payload["details"] = "report free text"

        with self.assertRaises(ValidationError):
            TrainingDatasetEvent(
                **details_payload
            )

    def test_rejects_extra_content_fields(self) -> None:
        payload = create_event_payload()

        content = dict(
            payload["content"]
        )

        content["userId"] = "user-1"

        payload["content"] = content

        with self.assertRaises(ValidationError):
            TrainingDatasetEvent(
                **payload
            )

    def test_rejects_empty_non_final_page(self) -> None:
        with self.assertRaises(ValidationError):
            TrainingDatasetPage(
                datasetId="dataset-1",
                schemaVersion=1,
                pageNumber=1,
                events=[],
                isFinalPage=False,
            )

    def test_allows_empty_final_page_transport(self) -> None:
        page = TrainingDatasetPage(
            datasetId="dataset-1",
            schemaVersion=1,
            pageNumber=2,
            events=[],
            isFinalPage=True,
        )

        self.assertTrue(
            page.isFinalPage
        )

        self.assertEqual(
            page.events,
            [],
        )

    def test_rejects_unsupported_schema_version(self) -> None:
        payload = create_event_payload()
        payload["schemaVersion"] = 2

        with self.assertRaises(ValidationError):
            TrainingDatasetEvent(
                **payload
            )


if __name__ == "__main__":
    unittest.main()