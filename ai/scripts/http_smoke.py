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
    headers = {"accept": "application/json"}

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
        raw_body = response.read().decode("utf-8")

    if status < 200 or status >= 300:
        raise RuntimeError(
            f"{method} {url} returned HTTP {status}: {raw_body}"
        )

    parsed = json.loads(raw_body)

    if not isinstance(parsed, dict):
        raise RuntimeError("Expected JSON object response.")

    return parsed


def _verify_health(base_url: str) -> dict[str, Any]:
    result = _read_json_response(
        method="GET",
        url=f"{base_url}/health",
    )

    if result.get("status") != "ok":
        raise AssertionError("Health endpoint is not OK.")

    if result.get("trainingMinEvents", 0) < 10000:
        raise AssertionError("Unsafe training threshold.")

    return result


def _verify_classification(base_url: str) -> dict[str, Any]:
    result = _read_json_response(
        method="POST",
        url=f"{base_url}/v1/classify",
        payload={
            "sourceKey": "source-one",
            "url": "https://publisher.example/ai-story",
            "title": "AI infrastructure expands",
            "excerpt": "Cloud providers expand AI infrastructure.",
            "categories": ["AI", "Infrastructure"],
            "publishedAt": "2026-08-09T06:40:00.000Z",
        },
    )

    if result.get("primaryCategory") != "technology":
        raise AssertionError("Unexpected classification result.")

    return result


def _verify_embedding(base_url: str) -> dict[str, Any]:
    result = _read_json_response(
        method="POST",
        url=f"{base_url}/v1/embed",
        payload={
            "text": "Poster knowledge discovery",
        },
    )

    if result.get("available") is not False:
        raise AssertionError(
            "Embedding capability must remain unavailable until a real model exists."
        )

    if result.get("dimensions") != 0:
        raise AssertionError("Disabled embedding dimensions must be zero.")

    if result.get("vector") != []:
        raise AssertionError("Disabled embedding vector must be empty.")

    if result.get("reason") != "embedding_model_not_configured":
        raise AssertionError("Unexpected embedding unavailable reason.")

    return result


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--base-url",
        default="http://127.0.0.1:8080",
    )

    args = parser.parse_args()
    base_url = args.base_url.rstrip("/")

    health = _verify_health(base_url)
    classification = _verify_classification(base_url)
    embedding = _verify_embedding(base_url)

    print("HEALTH RESPONSE")
    print(json.dumps(health, indent=2, sort_keys=True))

    print()
    print("CLASSIFICATION RESPONSE")
    print(json.dumps(classification, indent=2, sort_keys=True))

    print()
    print("EMBEDDING RESPONSE")
    print(json.dumps(embedding, indent=2, sort_keys=True))

    print()
    print("S06E embedding HTTP contract PASS")


if __name__ == "__main__":
    main()