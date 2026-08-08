import type {
  PosterBrainRankingCandidate,
} from "./ranking-scoring.types.js";

import type {
  PosterBrainDiscoveryContentRankingRow,
} from "./ranking-candidate-mapper.types.js";

function normalizeText(
  value: string
): string {
  return value.replace(/\s+/g, " ").trim();
}

function parseJsonArray(
  value: unknown
): readonly unknown[] {
  if (Array.isArray(value)) {
    return value;
  }

  if (typeof value !== "string") {
    return [];
  }

  const trimmed =
    value.trim();

  if (!trimmed) {
    return [];
  }

  try {
    const parsed =
      JSON.parse(trimmed);

    return Array.isArray(parsed)
      ? parsed
      : [];
  } catch {
    return [];
  }
}

function toStringArray(
  value: unknown
): readonly string[] {
  const seen =
    new Set<string>();

  const result: string[] =
    [];

  for (const entry of parseJsonArray(value)) {
    if (
      typeof entry !== "string" &&
      typeof entry !== "number"
    ) {
      continue;
    }

    const text =
      normalizeText(String(entry));

    if (!text) {
      continue;
    }

    const key =
      text.toLowerCase();

    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    result.push(text);
  }

  return result;
}

function toNumber(
  value: string | number | null,
  fallback: number
): number {
  if (typeof value === "number") {
    return Number.isFinite(value)
      ? value
      : fallback;
  }

  if (typeof value === "string") {
    const parsed =
      Number(value);

    return Number.isFinite(parsed)
      ? parsed
      : fallback;
  }

  return fallback;
}

function toIsoString(
  value: string | Date,
  label: string
): string {
  const date =
    value instanceof Date
      ? value
      : new Date(value);

  if (Number.isNaN(date.getTime())) {
    throw new Error(
      `Poster Brain ranking candidate mapper received invalid ${label}.`
    );
  }

  return date.toISOString();
}

function toNullableIsoString(
  value: string | Date | null,
  label: string
): string | null {
  if (value === null) {
    return null;
  }

  return toIsoString(value, label);
}

function requireNonBlank(
  value: string,
  label: string
): string {
  const normalized =
    normalizeText(value);

  if (!normalized) {
    throw new Error(
      `Poster Brain ranking candidate mapper requires ${label}.`
    );
  }

  return normalized;
}

export function mapPosterBrainDiscoveryContentRowToRankingCandidate(
  row: PosterBrainDiscoveryContentRankingRow
): PosterBrainRankingCandidate {
  return {
    externalContentId:
      requireNonBlank(
        row.externalContentId,
        "externalContentId"
      ),
    title:
      requireNonBlank(
        row.title,
        "title"
      ),
    publisherName:
      requireNonBlank(
        row.publisherName,
        "publisherName"
      ),
    publishedAt:
      toNullableIsoString(
        row.publishedAt,
        "publishedAt"
      ),
    discoveredAt:
      toIsoString(
        row.discoveredAt,
        "discoveredAt"
      ),
    sourcePriorityScore:
      toNumber(
        row.sourcePriorityScore,
        0.5
      ),
    qualityScore:
      toNumber(
        row.qualityScore,
        0.5
      ),
    tags:
      toStringArray(row.tags),
    canonicalTopicIds:
      toStringArray(row.canonicalTopicIds),
    evolvingTopicIds:
      toStringArray(row.evolvingTopicIds),
    searchKeywords:
      toStringArray(row.searchKeywords),
    engagement:
      {
        impressions:
          Math.max(0, toNumber(row.impressions, 0)),
        clicks:
          Math.max(0, toNumber(row.clicks, 0)),
        shares:
          Math.max(0, toNumber(row.shares, 0)),
        bookmarks:
          Math.max(0, toNumber(row.bookmarks, 0)),
        reports:
          Math.max(0, toNumber(row.reports, 0)),
        hides:
          Math.max(0, toNumber(row.hides, 0)),
      },
  };
}

export function mapPosterBrainDiscoveryContentRowsToRankingCandidates(
  rows: readonly PosterBrainDiscoveryContentRankingRow[]
): readonly PosterBrainRankingCandidate[] {
  return rows.map(
    mapPosterBrainDiscoveryContentRowToRankingCandidate
  );
}