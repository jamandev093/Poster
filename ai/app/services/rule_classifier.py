from __future__ import annotations

from datetime import UTC, datetime
import re
from typing import Iterable


CATEGORY_KEYWORDS: dict[str, tuple[str, ...]] = {
    "technology": (
        "ai",
        "artificial intelligence",
        "software",
        "cloud",
        "startup",
        "app",
        "data",
        "cyber",
        "robot",
        "chip",
        "semiconductor",
    ),
    "business": (
        "business",
        "market",
        "company",
        "startup",
        "funding",
        "retail",
        "commerce",
        "economy",
        "enterprise",
    ),
    "finance": (
        "finance",
        "bank",
        "stock",
        "stocks",
        "investment",
        "investor",
        "fund",
        "inflation",
        "revenue",
    ),
    "health": (
        "health",
        "medical",
        "doctor",
        "hospital",
        "medicine",
        "disease",
        "fitness",
        "nutrition",
    ),
    "science": (
        "science",
        "space",
        "research",
        "climate",
        "physics",
        "biology",
        "laboratory",
        "discovery",
    ),
    "sports": (
        "sport",
        "sports",
        "football",
        "cricket",
        "tennis",
        "basketball",
        "match",
        "league",
    ),
    "entertainment": (
        "film",
        "movie",
        "music",
        "celebrity",
        "series",
        "streaming",
        "entertainment",
    ),
    "politics": (
        "politics",
        "government",
        "election",
        "policy",
        "minister",
        "parliament",
        "law",
    ),
    "education": (
        "education",
        "school",
        "college",
        "university",
        "student",
        "learning",
        "course",
    ),
    "environment": (
        "environment",
        "climate",
        "pollution",
        "energy",
        "renewable",
        "sustainability",
        "wildlife",
    ),
}


def _clean_text(value: str | None) -> str:
    if value is None:
        return ""

    return re.sub(r"\s+", " ", value).strip()


def _normalize_category(value: str) -> str:
    cleaned = re.sub(r"[^a-z0-9]+", "-", value.strip().lower())
    cleaned = cleaned.strip("-")

    return cleaned if cleaned else "general"


def _unique(values: Iterable[str]) -> list[str]:
    seen: set[str] = set()
    result: list[str] = []

    for value in values:
        cleaned = _clean_text(value)

        if not cleaned:
            continue

        key = cleaned.lower()

        if key in seen:
            continue

        seen.add(key)
        result.append(cleaned)

    return result


def _keyword_matches(text: str, keyword: str) -> bool:
    normalized_keyword = keyword.strip().lower()

    if not normalized_keyword:
        return False

    pattern = r"(?<![a-z0-9])" + re.escape(normalized_keyword).replace(
        r"\ ",
        r"\s+",
    ) + r"(?![a-z0-9])"

    return re.search(pattern, text, flags=re.IGNORECASE) is not None


def _score_categories(text: str) -> dict[str, int]:
    normalized_text = text.lower()
    scores: dict[str, int] = {}

    for category, keywords in CATEGORY_KEYWORDS.items():
        score = 0

        for keyword in keywords:
            if _keyword_matches(normalized_text, keyword):
                score += 1

        if score > 0:
            scores[category] = score

    return scores


def classify_content(
    *,
    source_key: str,
    url: str,
    title: str,
    excerpt: str | None = None,
    categories: list[str] | None = None,
    now: str | None = None,
    provider_name: str = "poster-python-ai",
    model_name: str = "poster-rule-classifier-v1",
) -> dict[str, object]:
    text = " ".join(
        item
        for item in [
            _clean_text(source_key),
            _clean_text(url),
            _clean_text(title),
            _clean_text(excerpt),
            " ".join(categories or []),
        ]
        if item
    )

    scores = _score_categories(text)

    if scores:
        primary_category = max(
            scores.items(),
            key=lambda item: (item[1], item[0]),
        )[0]
        confidence = min(0.92, 0.58 + (scores[primary_category] * 0.08))
    elif categories:
        primary_category = _normalize_category(categories[0])
        confidence = 0.48
    else:
        primary_category = "general"
        confidence = 0.35

    topics = _unique(
        [
            primary_category,
            *(categories or []),
            *[
                category
                for category, score in sorted(
                    scores.items(),
                    key=lambda item: (-item[1], item[0]),
                )
                if category != primary_category
            ],
        ]
    )[:12]

    if not topics:
        topics = [primary_category]

    classified_at = now or datetime.now(UTC).isoformat().replace("+00:00", "Z")

    return {
        "primaryCategory": primary_category,
        "topics": topics,
        "confidence": round(confidence, 4),
        "provider": provider_name,
        "model": model_name,
        "classifiedAt": classified_at,
    }