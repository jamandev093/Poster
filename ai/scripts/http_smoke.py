from __future__ import annotations

import argparse
import json
from typing import Any
from urllib.request import Request, urlopen


def _read_json_response(
    *,
    method: str,
    url: str,
    payload: dict[str, Any] | None = None,
) -> dict[str, Any]:
    body: bytes | None = None

    headers = {
        "accept": "application/json",
    }

    if payload is not None:
        body = json.dumps(payload).encode("utf-8")
        headers["content-type"] = "application/json"

    request = Request(
        url=url,
        data=body,
        headers=headers,
        method=method,
    )

    with urlopen(request, timeout=10) as response:
        status = response.status
        content_type = response.headers.get(
            "content-type",
            "",
        )

        raw_body = response.read().decode("utf-8")

    if status < 200 or status >= 300:
        raise RuntimeError(
            f"{method} {url} returned HTTP {status}: {raw_body}"
        )

    if "application/json" not in content_type.lower():
        raise RuntimeError(
            f"{method} {url} did not return JSON: {content_type}"
        )

    parsed = json.loads(raw_body)

    if not isinstance(parsed, dict):
        raise RuntimeError(
            f"{method} {url} returned a non-object JSON response."
        )

    return parsed


def _require_non_empty_string(
    body: dict[str, Any],
    field: str,
) -> str:
    value = body.get(field)

    if not isinstance(value, str) or not value.strip():
        raise AssertionError(
            f"Expected non-empty string field: {field}"
        )

    return value


def _verify_health(
    base_url: str,
) -> dict[str, Any]:
    health = _read_json_response(
        method="GET",
        url=f"{base_url}/health",
    )

    if health.get("status") != "ok":
        raise AssertionError(
            f"Unexpected health status: {health.get('status')!r}"
        )

    _require_non_empty_string(
        health,
        "service",
    )

    _require_non_empty_string(
        health,
        "version",
    )

    _require_non_empty_string(
        health,
        "environment",
    )

    _require_non_empty_string(
        health,
        "provider",
    )

    _require_non_empty_string(
        health,
        "model",
    )

    if health.get("autoLearningEnabled") is not True:
        raise AssertionError(
            "Expected autoLearningEnabled=true."
        )

    training_min_events = health.get(
        "trainingMinEvents"
    )

    if (
        not isinstance(training_min_events, int)
        or training_min_events < 10000
    ):
        raise AssertionError(
            "Expected trainingMinEvents >= 10000."
        )

    if health.get("modelPromotionRequiresEvalPass") is not True:
        raise AssertionError(
            "Expected modelPromotionRequiresEvalPass=true."
        )

    return health


def _verify_classification(
    base_url: str,
) -> dict[str, Any]:
    payload = {
        "sourceKey": "source-one",
        "url": "https://publisher.example/ai-story",
        "title": "AI infrastructure expands",
        "excerpt": "Cloud providers expand AI infrastructure.",
        "categories": [
            "AI",
            "Infrastructure",
        ],
        "publishedAt": "2026-08-09T06:40:00.000Z",
    }

    classification = _read_json_response(
        method="POST",
        url=f"{base_url}/v1/classify",
        payload=payload,
    )

    primary_category = _require_non_empty_string(
        classification,
        "primaryCategory",
    )

    if primary_category != "technology":
        raise AssertionError(
            "Expected primaryCategory='technology', "
            f"received {primary_category!r}."
        )

    topics = classification.get(
        "topics"
    )

    if not isinstance(topics, list) or not topics:
        raise AssertionError(
            "Expected a non-empty topics array."
        )

    if "technology" not in topics:
        raise AssertionError(
            "Expected topics to include 'technology'."
        )

    confidence = classification.get(
        "confidence"
    )

    if (
        not isinstance(confidence, (int, float))
        or isinstance(confidence, bool)
        or confidence < 0
        or confidence > 1
    ):
        raise AssertionError(
            "Expected confidence between 0 and 1."
        )

    _require_non_empty_string(
        classification,
        "provider",
    )

    _require_non_empty_string(
        classification,
        "model",
    )

    _require_non_empty_string(
        classification,
        "classifiedAt",
    )

    return classification


def main() -> None:
    parser = argparse.ArgumentParser(
        description=(
            "Smoke-test the running Poster Python AI HTTP service."
        )
    )

    parser.add_argument(
        "--base-url",
        default="http://127.0.0.1:8080",
    )

    arguments = parser.parse_args()

    base_url = arguments.base_url.rstrip("/")

    health = _verify_health(
        base_url
    )

    classification = _verify_classification(
        base_url
    )

    print("HEALTH RESPONSE")
    print(
        json.dumps(
            health,
            indent=2,
            sort_keys=True,
        )
    )

    print()
    print("CLASSIFICATION RESPONSE")
    print(
        json.dumps(
            classification,
            indent=2,
            sort_keys=True,
        )
    )

    print()
    print("S06D HTTP smoke PASS")


if __name__ == "__main__":
    main()