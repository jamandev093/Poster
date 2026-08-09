from __future__ import annotations

from datetime import UTC, datetime


EMBEDDING_UNAVAILABLE_REASON = "embedding_model_not_configured"


def create_embedding_result(
    *,
    text: str,
    provider_name: str,
    model_name: str,
    now: str | None = None,
) -> dict[str, object]:
    if not text.strip():
        raise ValueError("Embedding text cannot be empty.")

    generated_at = (
        now
        or datetime.now(UTC).isoformat().replace("+00:00", "Z")
    )

    return {
        "available": False,
        "dimensions": 0,
        "vector": [],
        "provider": provider_name,
        "model": model_name,
        "generatedAt": generated_at,
        "reason": EMBEDDING_UNAVAILABLE_REASON,
    }