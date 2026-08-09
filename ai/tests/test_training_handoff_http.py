from __future__ import annotations

import asyncio
import hashlib
import json
import unittest

from datetime import (
    datetime,
    timedelta,
    timezone,
)
from typing import Any

from app.main import create_app

from app.models.training_dataset import (
    TrainingDatasetEvent,
    TrainingDatasetHandoffRequest,
    TrainingDatasetManifest,
    TrainingDatasetPage,
)

from app.models.training_handoff_http import (
    MAX_TRAINING_DATASET_PAGE_EVENTS,
    TRAINING_DATASET_HANDOFF_CONTENT_TYPE,
    TrainingDatasetHandoffManifestLine,
    TrainingDatasetHandoffPageLine,
)

from app.services.training_dataset_handoff import (
    _canonical_event_bytes,
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

EVENT_COUNT = 10000
CONTENT_COUNT = 20
PAGE_SIZE = 2500


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
) -> TrainingDatasetEvent:
    return TrainingDatasetEvent(
        schemaVersion=1,
        eventKey=(
            "organic_content_event:"
            f"event-{index:05d}"
        ),
        source="organic_content_event",
        sourceEventId=f"event-{index:05d}",
        signalType="impression",
        occurredAt=event_time(
            index
        ),
        surface="home",
        reasonId=None,
        reportStatus=None,
        bookmarkActive=None,
        content={
            "contentId": (
                f"content-{index % CONTENT_COUNT:02d}"
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
            "qualityScore": 0.8,
            "publishedAt": (
                SOURCE_CUTOFF -
                timedelta(days=1)
            ),
            "contentStatus": "active",
        },
    )


def create_events() -> list[TrainingDatasetEvent]:
    return [
        create_event(
            index
        )
        for index in range(
            EVENT_COUNT
        )
    ]


def create_checksum(
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
    events: list[TrainingDatasetEvent],
) -> TrainingDatasetManifest:
    return TrainingDatasetManifest(
        datasetId="dataset-http-1",
        schemaVersion=1,
        sourceEventCount=len(
            events
        ),
        materializedEventCount=len(
            events
        ),
        materializedContentCount=CONTENT_COUNT,
        sourceCutoffAt=SOURCE_CUTOFF,
        firstEventAt=events[-1].occurredAt,
        lastEventAt=events[0].occurredAt,
        datasetChecksum=create_checksum(
            events
        ),
    )


def encode_ndjson_line(
    value: Any,
) -> bytes:
    if hasattr(
        value,
        "model_dump",
    ):
        payload = value.model_dump(
            mode="json",
        )
    else:
        payload = value

    return (
        json.dumps(
            payload,
            ensure_ascii=False,
            separators=(
                ",",
                ":",
            ),
        ).encode(
            "utf-8"
        ) +
        b"\n"
    )


def create_valid_body() -> tuple[
    bytes,
    TrainingDatasetManifest,
]:
    events = create_events()

    manifest = create_manifest(
        events
    )

    handoff = (
        TrainingDatasetHandoffRequest(
            manifest=manifest,
        )
    )

    body_parts: list[bytes] = [
        encode_ndjson_line(
            TrainingDatasetHandoffManifestLine(
                handoff=handoff,
            )
        )
    ]

    page_number = 1

    for start in range(
        0,
        len(events),
        PAGE_SIZE,
    ):
        end = min(
            start + PAGE_SIZE,
            len(events),
        )

        page = TrainingDatasetPage(
            datasetId=manifest.datasetId,
            schemaVersion=1,
            pageNumber=page_number,
            events=events[
                start:end
            ],
            isFinalPage=(
                end ==
                len(events)
            ),
        )

        self_bounded_count = len(
            page.events
        )

        if (
            self_bounded_count >
            MAX_TRAINING_DATASET_PAGE_EVENTS
        ):
            raise AssertionError(
                "Test generated an oversized page."
            )

        body_parts.append(
            encode_ndjson_line(
                TrainingDatasetHandoffPageLine(
                    page=page,
                )
            )
        )

        page_number += 1

    return (
        b"".join(
            body_parts
        ),
        manifest,
    )


async def asgi_request(
    *,
    body: bytes,
    content_type: str,
    chunk_size: int = 4096,
    declared_content_length: int | None = None,
) -> tuple[
    int,
    dict[str, str],
    bytes,
]:
    app = create_app()

    headers: list[
        tuple[bytes, bytes]
    ] = [
        (
            b"content-type",
            content_type.encode(
                "latin-1"
            ),
        ),
    ]

    if declared_content_length is None:
        declared_content_length = len(
            body
        )

    headers.append(
        (
            b"content-length",
            str(
                declared_content_length
            ).encode(
                "ascii"
            ),
        )
    )

    scope = {
        "type": "http",
        "asgi": {
            "version": "3.0",
            "spec_version": "2.5",
        },
        "http_version": "1.1",
        "method": "POST",
        "scheme": "http",
        "path": "/v1/training-dataset/handoff",
        "raw_path": b"/v1/training-dataset/handoff",
        "query_string": b"",
        "root_path": "",
        "headers": headers,
        "client": (
            "127.0.0.1",
            12345,
        ),
        "server": (
            "testserver",
            80,
        ),
        "state": {},
    }

    chunks = [
        body[
            index:
            index + chunk_size
        ]
        for index in range(
            0,
            len(body),
            chunk_size,
        )
    ]

    if not chunks:
        chunks = [
            b"",
        ]

    receive_index = 0

    async def receive() -> dict[str, Any]:
        nonlocal receive_index

        if receive_index < len(
            chunks
        ):
            index = receive_index
            receive_index += 1

            return {
                "type": "http.request",
                "body": chunks[index],
                "more_body": (
                    receive_index <
                    len(chunks)
                ),
            }

        return {
            "type": "http.disconnect",
        }

    messages: list[
        dict[str, Any]
    ] = []

    async def send(
        message: dict[str, Any],
    ) -> None:
        messages.append(
            message
        )

    await app(
        scope,
        receive,
        send,
    )

    response_start = next(
        (
            message
            for message in messages
            if message[
                "type"
            ] ==
            "http.response.start"
        ),
        None,
    )

    if response_start is None:
        raise AssertionError(
            "ASGI application produced no response start."
        )

    status_code = int(
        response_start[
            "status"
        ]
    )

    response_headers = {
        key.decode(
            "latin-1"
        ).lower():
            value.decode(
                "latin-1"
            )
        for key, value
        in response_start.get(
            "headers",
            []
        )
    }

    response_body = b"".join(
        message.get(
            "body",
            b"",
        )
        for message in messages
        if message[
            "type"
        ] ==
        "http.response.body"
    )

    return (
        status_code,
        response_headers,
        response_body,
    )


def run_request(
    **kwargs: Any,
) -> tuple[
    int,
    dict[str, str],
    bytes,
]:
    return asyncio.run(
        asgi_request(
            **kwargs
        )
    )


class TrainingHandoffHttpTests(
    unittest.TestCase
):
    @classmethod
    def setUpClass(
        cls,
    ) -> None:
        (
            cls.valid_body,
            cls.valid_manifest,
        ) = create_valid_body()

    def test_registered_endpoint_accepts_real_10000_event_chunked_ndjson(
        self,
    ) -> None:
        (
            status_code,
            headers,
            body,
        ) = run_request(
            body=self.valid_body,
            content_type=(
                TRAINING_DATASET_HANDOFF_CONTENT_TYPE +
                "; charset=utf-8"
            ),
            chunk_size=4096,
        )

        self.assertEqual(
            status_code,
            200,
        )

        self.assertIn(
            "application/json",
            headers.get(
                "content-type",
                "",
            ),
        )

        result = json.loads(
            body.decode(
                "utf-8"
            )
        )

        self.assertEqual(
            result["status"],
            "validated",
        )

        self.assertTrue(
            result["accepted"]
        )

        self.assertEqual(
            result["datasetId"],
            self.valid_manifest.datasetId,
        )

        self.assertEqual(
            result["schemaVersion"],
            1,
        )

        self.assertEqual(
            result["datasetChecksum"],
            self.valid_manifest.datasetChecksum,
        )

        self.assertEqual(
            result["eventCount"],
            EVENT_COUNT,
        )

        self.assertEqual(
            result["contentCount"],
            CONTENT_COUNT,
        )

        self.assertEqual(
            result["pageCount"],
            4,
        )

        self.assertFalse(
            result["trainingStarted"]
        )

    def test_rejects_wrong_content_type_with_415(
        self,
    ) -> None:
        (
            status_code,
            _,
            body,
        ) = run_request(
            body=b"{}",
            content_type="application/json",
        )

        self.assertEqual(
            status_code,
            415,
        )

        result = json.loads(
            body.decode(
                "utf-8"
            )
        )

        self.assertEqual(
            result["detail"],
            "training_dataset_handoff_requires_ndjson",
        )

    def test_rejects_malformed_ndjson_with_privacy_safe_422(
        self,
    ) -> None:
        (
            status_code,
            _,
            body,
        ) = run_request(
            body=(
                b'{"kind":"manifest","handoff":'
                b'not-valid-json\n'
            ),
            content_type=(
                TRAINING_DATASET_HANDOFF_CONTENT_TYPE
            ),
            chunk_size=7,
        )

        self.assertEqual(
            status_code,
            422,
        )

        result = json.loads(
            body.decode(
                "utf-8"
            )
        )

        self.assertEqual(
            result["detail"],
            "training_dataset_transport_invalid",
        )

        self.assertNotIn(
            "not-valid-json",
            body.decode(
                "utf-8"
            ),
        )

    def test_rejects_page_before_manifest_with_422(
        self,
    ) -> None:
        body = (
            b'{"kind":"page","page":{}}\n'
        )

        (
            status_code,
            _,
            response_body,
        ) = run_request(
            body=body,
            content_type=(
                TRAINING_DATASET_HANDOFF_CONTENT_TYPE
            ),
        )

        self.assertEqual(
            status_code,
            422,
        )

        result = json.loads(
            response_body.decode(
                "utf-8"
            )
        )

        self.assertEqual(
            result["detail"],
            "training_dataset_transport_invalid",
        )

    def test_rejects_oversized_declared_request_without_reading_body(
        self,
    ) -> None:
        (
            status_code,
            _,
            body,
        ) = run_request(
            body=b"x",
            content_type=(
                TRAINING_DATASET_HANDOFF_CONTENT_TYPE
            ),
            declared_content_length=(
                (512 * 1024 * 1024) +
                1
            ),
        )

        self.assertEqual(
            status_code,
            413,
        )

        result = json.loads(
            body.decode(
                "utf-8"
            )
        )

        self.assertEqual(
            result["detail"],
            "training_dataset_handoff_too_large",
        )


if __name__ == "__main__":
    unittest.main()