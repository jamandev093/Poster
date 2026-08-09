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

DATASET_ID = (
    "11111111-1111-4111-8111-111111111111"
)

EVENT_COUNT = 10000
CONTENT_COUNT = 500
PAGE_SIZE = 2500


def _event_time(
    index: int,
) -> datetime:
    return (
        SOURCE_CUTOFF -
        timedelta(
            seconds=index + 1,
        )
    )


def _content_index(
    index: int,
) -> int:
    return (
        index %
        CONTENT_COUNT
    )


def _create_event(
    index: int,
) -> TrainingDatasetEvent:
    content_index = (
        _content_index(
            index
        )
    )

    positive_content = (
        content_index <
        300
    )

    if index < 300:
        signal_type = (
            "open_original_click"
            if index % 2 == 0
            else "share"
        )

        source = (
            "organic_content_event"
            if signal_type ==
            "open_original_click"
            else "share"
        )

        report_status = None
        reason_id = None

    elif index < 500:
        signal_type = "report"
        source = "report"
        report_status = "resolved"
        reason_id = "reason-quality"

    else:
        signal_type = "impression"
        source = "organic_content_event"
        report_status = None
        reason_id = None

    topic = (
        "useful-technology"
        if positive_content
        else "misleading-rumor"
    )

    text = (
        "Reliable technology research and useful cloud engineering"
        if positive_content
        else
        "Misleading rumor with unverified deceptive claims"
    )

    return TrainingDatasetEvent.model_validate(
        {
            "schemaVersion": 1,
            "eventKey": (
                f"{source}:event-{index:05d}"
            ),
            "source": source,
            "sourceEventId": (
                f"event-{index:05d}"
            ),
            "signalType": signal_type,
            "occurredAt": (
                _event_time(
                    index
                )
            ),
            "surface": "home",
            "reasonId": reason_id,
            "reportStatus": report_status,
            "bookmarkActive": None,
            "content": {
                "contentId": (
                    f"content-{content_index:03d}"
                ),
                "sourceKey": "example-feed",
                "publisherName": "Example Publisher",
                "title": text,
                "excerpt": text,
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


def _create_events() -> list[
    TrainingDatasetEvent
]:
    return [
        _create_event(
            index
        )
        for index in range(
            EVENT_COUNT
        )
    ]


def _checksum(
    events: list[
        TrainingDatasetEvent
    ],
) -> str:
    digest = hashlib.sha256()

    for event in events:
        digest.update(
            _canonical_event_bytes(
                event
            )
        )

        digest.update(
            b"\n"
        )

    return (
        "sha256:" +
        digest.hexdigest()
    )


def _line(
    value: Any,
) -> bytes:
    if hasattr(
        value,
        "model_dump",
    ):
        value = value.model_dump(
            mode="json",
        )

    return (
        json.dumps(
            value,
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


def _valid_body() -> tuple[
    bytes,
    TrainingDatasetManifest,
]:
    events = _create_events()

    manifest = TrainingDatasetManifest(
        datasetId=DATASET_ID,
        schemaVersion=1,
        sourceEventCount=EVENT_COUNT,
        materializedEventCount=EVENT_COUNT,
        materializedContentCount=CONTENT_COUNT,
        sourceCutoffAt=SOURCE_CUTOFF,
        firstEventAt=events[-1].occurredAt,
        lastEventAt=events[0].occurredAt,
        datasetChecksum=_checksum(
            events
        ),
    )

    handoff = (
        TrainingDatasetHandoffRequest(
            manifest=manifest,
        )
    )

    parts: list[bytes] = [
        _line(
            TrainingDatasetHandoffManifestLine(
                handoff=handoff,
            )
        )
    ]

    page_number = 1

    for start in range(
        0,
        EVENT_COUNT,
        PAGE_SIZE,
    ):
        end = min(
            start +
            PAGE_SIZE,
            EVENT_COUNT,
        )

        parts.append(
            _line(
                TrainingDatasetHandoffPageLine(
                    page=TrainingDatasetPage(
                        datasetId=DATASET_ID,
                        schemaVersion=1,
                        pageNumber=page_number,
                        events=events[
                            start:end
                        ],
                        isFinalPage=(
                            end ==
                            EVENT_COUNT
                        ),
                    )
                )
            )
        )

        page_number += 1

    return (
        b"".join(
            parts
        ),
        manifest,
    )


async def _request(
    *,
    path: str,
    body: bytes,
    content_type: str = (
        TRAINING_DATASET_HANDOFF_CONTENT_TYPE
    ),
    chunk_size: int = 4096,
) -> tuple[int, bytes]:
    app = create_app()

    scope = {
        "type": "http",
        "asgi": {
            "version": "3.0",
            "spec_version": "2.5",
        },
        "http_version": "1.1",
        "method": "POST",
        "scheme": "http",
        "path": path,
        "raw_path": path.encode(
            "ascii"
        ),
        "query_string": b"",
        "root_path": "",
        "headers": [
            (
                b"content-type",
                content_type.encode(
                    "latin-1"
                ),
            ),
            (
                b"content-length",
                str(
                    len(body)
                ).encode(
                    "ascii"
                ),
            ),
        ],
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
            index +
            chunk_size
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

    async def receive() -> dict[
        str,
        Any
    ]:
        nonlocal receive_index

        if receive_index < len(
            chunks
        ):
            current = receive_index
            receive_index += 1

            return {
                "type":
                    "http.request",

                "body":
                    chunks[current],

                "more_body":
                    (
                        receive_index <
                        len(chunks)
                    ),
            }

        return {
            "type":
                "http.disconnect",
        }

    messages: list[
        dict[
            str,
            Any
        ]
    ] = []

    async def send(
        message: dict[
            str,
            Any
        ],
    ) -> None:
        messages.append(
            message
        )

    await app(
        scope,
        receive,
        send,
    )

    start = next(
        message
        for message in messages
        if message["type"] ==
        "http.response.start"
    )

    response_body = b"".join(
        message.get(
            "body",
            b"",
        )
        for message in messages
        if message["type"] ==
        "http.response.body"
    )

    return (
        int(
            start["status"]
        ),
        response_body,
    )


class TrainingHttpTests(
    unittest.TestCase
):
    @classmethod
    def setUpClass(
        cls,
    ) -> None:
        (
            cls.body,
            cls.manifest,
        ) = _valid_body()

    def test_validated_frozen_dataset_trains_real_candidate_model(
        self,
    ) -> None:
        status_code, body = (
            asyncio.run(
                _request(
                    path=(
                        "/v1/training-dataset/train"
                    ),
                    body=self.body,
                )
            )
        )

        self.assertEqual(
            status_code,
            200,
        )

        result = json.loads(
            body.decode(
                "utf-8"
            )
        )

        self.assertEqual(
            result["status"],
            "trained",
        )

        self.assertTrue(
            result["accepted"]
        )

        self.assertTrue(
            result[
                "trainingAttempted"
            ]
        )

        self.assertTrue(
            result[
                "candidateCreated"
            ]
        )

        self.assertFalse(
            result["promoted"]
        )

        self.assertEqual(
            result["datasetId"],
            DATASET_ID,
        )

        self.assertEqual(
            result[
                "datasetChecksum"
            ],
            self.manifest
            .datasetChecksum,
        )

        self.assertEqual(
            result[
                "sourceCutoffAt"
            ],
            "2026-08-09T16:00:00.000Z",
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

        self.assertEqual(
            result[
                "labeledEventCount"
            ],
            500,
        )

        self.assertEqual(
            result[
                "positiveEventCount"
            ],
            300,
        )

        self.assertEqual(
            result[
                "negativeEventCount"
            ],
            200,
        )

        candidate = (
            result["candidate"]
        )

        self.assertIsNotNone(
            candidate
        )

        self.assertEqual(
            candidate[
                "modelType"
            ],
            "hashed_logistic_engagement_v1",
        )

        self.assertEqual(
            candidate[
                "featureDimension"
            ],
            512,
        )

        self.assertEqual(
            len(
                candidate[
                    "weights"
                ]
            ),
            512,
        )

        self.assertTrue(
            candidate[
                "modelChecksum"
            ].startswith(
                "sha256:"
            )
        )

        self.assertGreater(
            candidate[
                "metrics"
            ][
                "validationEventCount"
            ],
            0,
        )

    def test_original_handoff_endpoint_remains_validation_only(
        self,
    ) -> None:
        status_code, body = (
            asyncio.run(
                _request(
                    path=(
                        "/v1/training-dataset/handoff"
                    ),
                    body=self.body,
                )
            )
        )

        self.assertEqual(
            status_code,
            200,
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

        self.assertFalse(
            result[
                "trainingStarted"
            ]
        )

        self.assertNotIn(
            "candidate",
            result,
        )

    def test_training_endpoint_rejects_invalid_transport_before_training(
        self,
    ) -> None:
        status_code, body = (
            asyncio.run(
                _request(
                    path=(
                        "/v1/training-dataset/train"
                    ),
                    body=(
                        b'{"kind":"manifest",'
                        b'"handoff":bad-json\n'
                    ),
                    chunk_size=7,
                )
            )
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


if __name__ == "__main__":
    unittest.main()