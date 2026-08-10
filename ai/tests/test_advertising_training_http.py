from __future__ import annotations

import hashlib
import io
import json
import unittest

from app.api.advertising_training import (
    validate_advertising_training_dataset,
)


DATASET_ID = (
    "00000000-0000-4000-8000-000000000301"
)

CUTOFF = (
    "2026-08-10T15:00:00.000Z"
)


def _event(
    index: int,
) -> dict[str, object]:
    campaign_number = (
        index %
        100
    )

    return {
        "recordType":
            "event",

        "eventKey":
            f"advertising:event-{index:05d}",

        "sourceEventId":
            (
                "10000000-0000-4000-8000-"
                f"{index:012d}"
            ),

        "campaignId":
            (
                "00000000-0000-4000-8000-"
                f"{campaign_number:012d}"
            ),

        "eventType":
            (
                "click"
                if campaign_number < 20
                else "impression"
            ),

        "placement":
            (
                "home"
                if index % 3 == 0
                else (
                    "search"
                    if index % 3 == 1
                    else "trending"
                )
            ),

        "occurredAt":
            "2026-08-10T14:00:00.000Z",
    }


def _canonical(
    event: dict[str, object],
) -> bytes:
    payload = {
        "campaignId":
            event["campaignId"],

        "eventKey":
            event["eventKey"],

        "eventType":
            event["eventType"],

        "occurredAt":
            event["occurredAt"],

        "placement":
            event["placement"],

        "sourceEventId":
            event["sourceEventId"],
    }

    return (
        json.dumps(
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
        +
        b"\n"
    )


def _dataset_bytes(
    *,
    tamper_checksum: bool = False,
) -> bytes:
    events = [
        _event(
            index
        )
        for index in range(
            10_000
        )
    ]

    digest = hashlib.sha256()

    for event in events:
        digest.update(
            _canonical(
                event
            )
        )

    checksum = (
        "sha256:"
        +
        digest.hexdigest()
    )

    if tamper_checksum:
        checksum = (
            "sha256:"
            +
            "0" * 64
        )

    manifest = {
        "recordType":
            "manifest",

        "schemaVersion":
            1,

        "datasetId":
            DATASET_ID,

        "datasetChecksum":
            checksum,

        "sourceCutoffAt":
            CUTOFF,

        "materializedEventCount":
            10_000,
    }

    lines = [
        json.dumps(
            manifest,
            separators=(
                ",",
                ":",
            ),
        )
    ]

    lines.extend(
        json.dumps(
            event,
            separators=(
                ",",
                ":",
            ),
        )
        for event in events
    )

    return (
        (
            "\n".join(
                lines
            )
            +
            "\n"
        ).encode(
            "utf-8"
        )
    )


class AdvertisingTrainingHttpTests(
    unittest.TestCase
):
    def test_validates_frozen_backend_dataset_checksum(
        self,
    ) -> None:
        manifest = (
            validate_advertising_training_dataset(
                io.BytesIO(
                    _dataset_bytes()
                )
            )
        )

        self.assertEqual(
            manifest.datasetId,
            DATASET_ID,
        )

        self.assertEqual(
            manifest.materializedEventCount,
            10_000,
        )

    def test_rejects_checksum_mismatch(
        self,
    ) -> None:
        with self.assertRaisesRegex(
            ValueError,
            "checksum mismatch",
        ):
            validate_advertising_training_dataset(
                io.BytesIO(
                    _dataset_bytes(
                        tamper_checksum=True
                    )
                )
            )


if __name__ == "__main__":
    unittest.main()