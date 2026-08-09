from __future__ import annotations

import hashlib
import json
import math

from collections.abc import Iterable
from dataclasses import dataclass
from datetime import (
    datetime,
    timezone,
)
from typing import Any

from app.models.training_dataset import (
    TrainingDatasetEvent,
    TrainingDatasetHandoffRequest,
    TrainingDatasetPage,
    TrainingDatasetSchemaVersion,
)


class TrainingDatasetHandoffValidationError(ValueError):
    """Raised when a frozen training dataset handoff is inconsistent."""


@dataclass(
    frozen=True,
    slots=True,
)
class TrainingDatasetHandoffValidationResult:
    """
    Verified identity and transport statistics for one complete
    Backend-owned frozen training dataset.

    Validation alone never starts model training.
    """

    dataset_id: str
    schema_version: TrainingDatasetSchemaVersion
    dataset_checksum: str
    page_count: int
    event_count: int
    content_count: int
    first_event_at: datetime
    last_event_at: datetime
    source_cutoff_at: datetime


def _event_order_key(
    occurred_at: datetime,
    event_key: str,
) -> tuple[datetime, str]:
    return (
        occurred_at,
        event_key,
    )


def _backend_iso_timestamp(
    value: datetime,
) -> str:
    """
    Reproduce JavaScript Date.toISOString() formatting used by
    the Backend normalized dataset contract:
    UTC plus exactly three fractional millisecond digits.
    """

    if value.tzinfo is None:
        raise TrainingDatasetHandoffValidationError(
            "Training dataset timestamps must include a timezone."
        )

    utc_value = value.astimezone(
        timezone.utc
    )

    milliseconds = (
        utc_value.microsecond //
        1000
    )

    return (
        utc_value.strftime(
            "%Y-%m-%dT%H:%M:%S"
        )
        +
        f".{milliseconds:03d}Z"
    )


def _canonicalize_backend_value(
    value: Any,
) -> Any:
    """
    Mirror Backend canonicalizeJson() + JSON.stringify():
    - object keys sorted recursively
    - array order preserved
    - timestamps normalized to Backend ISO form
    - integral finite floats use JavaScript JSON number form
    """

    if isinstance(
        value,
        datetime,
    ):
        return _backend_iso_timestamp(
            value
        )

    if isinstance(
        value,
        float,
    ):
        if not math.isfinite(
            value
        ):
            raise TrainingDatasetHandoffValidationError(
                "Training dataset checksum input cannot contain "
                "NaN or infinity."
            )

        return value

    if isinstance(
        value,
        list,
    ):
        return [
            _canonicalize_backend_value(
                item
            )
            for item in value
        ]

    if isinstance(
        value,
        tuple,
    ):
        return [
            _canonicalize_backend_value(
                item
            )
            for item in value
        ]

    if isinstance(
        value,
        dict,
    ):
        return {
            key:
                _canonicalize_backend_value(
                    value[key]
                )
            for key in sorted(
                value
            )
        }

    return value


def _javascript_key_sort_key(
    value: str,
) -> bytes:
    """
    JavaScript Array.sort() compares strings by UTF-16 code units.

    Backend Object.keys(...).sort() therefore cannot be reproduced
    by Python code-point sorting for every valid Unicode key.
    """

    return value.encode(
        "utf-16-be",
        errors="surrogatepass",
    )


def _javascript_number_text(
    value: float,
) -> str:
    """
    Reproduce the JSON.stringify() representation for a finite
    IEEE-754 number from Python's shortest round-trip float text.

    ECMAScript uses fixed notation for exponents -6 through 20
    and exponent notation outside that range.
    """

    if not math.isfinite(
        value
    ):
        raise TrainingDatasetHandoffValidationError(
            "Training dataset checksum input cannot contain "
            "NaN or infinity."
        )

    if value == 0:
        return "0"

    sign = (
        "-"
        if value < 0
        else ""
    )

    text = repr(
        abs(value)
    ).lower()

    if "e" not in text:
        if text.endswith(
            ".0"
        ):
            text = text[:-2]

        return sign + text

    mantissa, exponent_text = (
        text.split(
            "e",
            1,
        )
    )

    exponent = int(
        exponent_text
    )

    digits = mantissa.replace(
        ".",
        "",
    )

    if (
        exponent >= -6
        and exponent < 21
    ):
        decimal_position = (
            1 + exponent
        )

        if decimal_position <= 0:
            fixed = (
                "0." +
                (
                    "0" *
                    (-decimal_position)
                ) +
                digits
            )
        elif decimal_position >= len(
            digits
        ):
            fixed = (
                digits +
                (
                    "0" *
                    (
                        decimal_position -
                        len(digits)
                    )
                )
            )
        else:
            fixed = (
                digits[
                    :decimal_position
                ] +
                "." +
                digits[
                    decimal_position:
                ]
            )

        return sign + fixed

    coefficient = digits[0]

    if len(
        digits
    ) > 1:
        coefficient += (
            "." +
            digits[1:]
        )

    exponent_sign = (
        "+"
        if exponent >= 0
        else "-"
    )

    return (
        sign +
        coefficient +
        "e" +
        exponent_sign +
        str(
            abs(exponent)
        )
    )


def _serialize_backend_json(
    value: Any,
) -> str:
    """
    Serialize the normalized dataset value using the same relevant
    JSON.stringify() rules used by the TypeScript snapshot checksum.
    """

    if value is None:
        return "null"

    if value is True:
        return "true"

    if value is False:
        return "false"

    if isinstance(
        value,
        str,
    ):
        return json.dumps(
            value,
            ensure_ascii=False,
            separators=(
                ",",
                ":",
            ),
        )

    if isinstance(
        value,
        int,
    ):
        return str(
            value
        )

    if isinstance(
        value,
        float,
    ):
        return _javascript_number_text(
            value
        )

    if isinstance(
        value,
        list,
    ):
        return (
            "[" +
            ",".join(
                _serialize_backend_json(
                    item
                )
                for item in value
            ) +
            "]"
        )

    if isinstance(
        value,
        dict,
    ):
        keys = sorted(
            value.keys(),
            key=_javascript_key_sort_key,
        )

        parts: list[str] = []

        for key in keys:
            if not isinstance(
                key,
                str,
            ):
                raise TrainingDatasetHandoffValidationError(
                    "Training dataset checksum object keys must be strings."
                )

            parts.append(
                (
                    json.dumps(
                        key,
                        ensure_ascii=False,
                        separators=(
                            ",",
                            ":",
                        ),
                    ) +
                    ":" +
                    _serialize_backend_json(
                        value[key]
                    )
                )
            )

        return (
            "{" +
            ",".join(
                parts
            ) +
            "}"
        )

    raise TrainingDatasetHandoffValidationError(
        "Training dataset checksum contains an unsupported value type."
    )

def _canonical_event_bytes(
    event: TrainingDatasetEvent,
) -> bytes:
    event_data = event.model_dump(
        mode="python",
    )

    canonical = (
        _canonicalize_backend_value(
            event_data
        )
    )

    serialized = _serialize_backend_json(
        canonical
    )

    return serialized.encode(
        "utf-8"
    )


def validate_training_dataset_handoff(
    handoff: TrainingDatasetHandoffRequest,
    pages: Iterable[TrainingDatasetPage],
) -> TrainingDatasetHandoffValidationResult:
    """
    Validate one complete ordered stream of bounded dataset pages.

    The Backend remains authoritative for storage and dataset creation.
    This function holds only the small amount of state required to
    validate transport sequencing, ordering, content cardinality, and
    cryptographic dataset identity while pages are consumed.
    """

    manifest = handoff.manifest

    expected_page_number = 1
    page_count = 0
    event_count = 0
    final_page_seen = False

    previous_order_key: tuple[
        datetime,
        str,
    ] | None = None

    first_streamed_event_at: datetime | None = None
    last_streamed_event_at: datetime | None = None

    content_ids: set[str] = set()

    checksum = hashlib.sha256()

    for page in pages:
        if final_page_seen:
            raise TrainingDatasetHandoffValidationError(
                "Training dataset contains a page after the final page."
            )

        if (
            page.datasetId !=
            manifest.datasetId
        ):
            raise TrainingDatasetHandoffValidationError(
                "Training dataset page datasetId does not match the manifest."
            )

        if (
            page.schemaVersion !=
            manifest.schemaVersion
        ):
            raise TrainingDatasetHandoffValidationError(
                "Training dataset page schemaVersion does not match the manifest."
            )

        if (
            page.pageNumber !=
            expected_page_number
        ):
            raise TrainingDatasetHandoffValidationError(
                "Training dataset page numbers must be contiguous and start at 1."
            )

        page_count += 1
        expected_page_number += 1

        for event in page.events:
            if (
                event.occurredAt >
                manifest.sourceCutoffAt
            ):
                raise TrainingDatasetHandoffValidationError(
                    "Training dataset event occurredAt exceeds the frozen source cutoff."
                )

            current_order_key = _event_order_key(
                event.occurredAt,
                event.eventKey,
            )

            if (
                previous_order_key is not None
                and current_order_key >= previous_order_key
            ):
                raise TrainingDatasetHandoffValidationError(
                    "Training dataset events must remain in strict descending "
                    "(occurredAt, eventKey) order."
                )

            previous_order_key = current_order_key

            if first_streamed_event_at is None:
                first_streamed_event_at = (
                    event.occurredAt
                )

            last_streamed_event_at = (
                event.occurredAt
            )

            content_ids.add(
                event.content.contentId
            )

            checksum.update(
                _canonical_event_bytes(
                    event
                )
            )

            checksum.update(
                b"\n"
            )

            event_count += 1

            if (
                event_count >
                manifest.materializedEventCount
            ):
                raise TrainingDatasetHandoffValidationError(
                    "Training dataset contains more events than the manifest."
                )

        if page.isFinalPage:
            final_page_seen = True

    if page_count == 0:
        raise TrainingDatasetHandoffValidationError(
            "Training dataset handoff contains no pages."
        )

    if not final_page_seen:
        raise TrainingDatasetHandoffValidationError(
            "Training dataset handoff is missing its final page."
        )

    if (
        event_count !=
        manifest.materializedEventCount
    ):
        raise TrainingDatasetHandoffValidationError(
            "Training dataset event count does not match materializedEventCount."
        )

    content_count = len(
        content_ids
    )

    if (
        content_count !=
        manifest.materializedContentCount
    ):
        raise TrainingDatasetHandoffValidationError(
            "Training dataset unique content count does not match "
            "materializedContentCount."
        )

    if (
        first_streamed_event_at is None
        or last_streamed_event_at is None
    ):
        raise TrainingDatasetHandoffValidationError(
            "A trainable dataset cannot contain zero events."
        )

    # Source pages are ordered newest -> oldest.
    if (
        first_streamed_event_at !=
        manifest.lastEventAt
    ):
        raise TrainingDatasetHandoffValidationError(
            "Training dataset latest event does not match manifest lastEventAt."
        )

    if (
        last_streamed_event_at !=
        manifest.firstEventAt
    ):
        raise TrainingDatasetHandoffValidationError(
            "Training dataset earliest event does not match manifest firstEventAt."
        )

    computed_checksum = (
        "sha256:" +
        checksum.hexdigest()
    )

    if (
        computed_checksum !=
        manifest.datasetChecksum
    ):
        raise TrainingDatasetHandoffValidationError(
            "Training dataset checksum does not match the manifest."
        )

    return TrainingDatasetHandoffValidationResult(
        dataset_id=manifest.datasetId,
        schema_version=manifest.schemaVersion,
        dataset_checksum=computed_checksum,
        page_count=page_count,
        event_count=event_count,
        content_count=content_count,
        first_event_at=last_streamed_event_at,
        last_event_at=first_streamed_event_at,
        source_cutoff_at=manifest.sourceCutoffAt,
    )