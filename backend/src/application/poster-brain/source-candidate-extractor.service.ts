import type {
  PosterBrainSourceCandidate,
  PosterBrainSourceCandidateInput,
  PosterBrainSourceCandidateType,
} from "./source-candidate.types.js";

const GENERIC_PLATFORM_HOSTS =
  new Set([
    "youtube.com",
    "www.youtube.com",
    "x.com",
    "www.x.com",
    "facebook.com",
    "www.facebook.com",
  ]);

function normalizeText(
  value:
    string | null
): string | null {
  if (value === null) {
    return null;
  }

  const cleaned =
    value
      .replace(/\s+/g, " ")
      .trim();

  return cleaned || null;
}

function normalizeHost(
  hostname:
    string
): string {
  const lowered =
    hostname
      .trim()
      .toLowerCase();

  return lowered.startsWith(
    "www."
  )
    ? lowered.slice(4)
    : lowered;
}

function parseHttpUrl(
  value:
    string | null
): URL | null {
  const cleaned =
    normalizeText(
      value
    );

  if (cleaned === null) {
    return null;
  }

  try {
    const url =
      new URL(cleaned);

    if (
      url.protocol !== "http:" &&
      url.protocol !== "https:"
    ) {
      return null;
    }

    return url;
  }
  catch {
    return null;
  }
}

function canonicalOrigin(
  url:
    URL
): string {
  const host =
    normalizeHost(
      url.hostname
    );

  return `https://${host}`;
}

function inferSourceType(
  input:
    PosterBrainSourceCandidateInput,
  canonicalHost:
    string
): PosterBrainSourceCandidateType {
  if (
    GENERIC_PLATFORM_HOSTS.has(
      canonicalHost
    )
  ) {
    return input.sourceExternalId
      ? "channel"
      : "platform";
  }

  const name =
    (
      input.sourceName ??
      input.publisherName
    )
      .toLowerCase();

  if (
    name.includes("university") ||
    name.includes("institute") ||
    name.includes("institution") ||
    name.includes("laboratory") ||
    name.includes("museum") ||
    name.includes("library") ||
    name.includes("agency") ||
    name.includes("administration")
  ) {
    return "institution";
  }

  if (
    input.publisherName.trim()
      .length > 0
  ) {
    return "publisher";
  }

  return "unknown";
}

function observationTimestamp(
  value:
    string | undefined
): string {
  if (value === undefined) {
    return new Date()
      .toISOString();
  }

  const parsed =
    new Date(value);

  if (
    Number.isNaN(
      parsed.getTime()
    )
  ) {
    throw new Error(
      "Source candidate observedAt must be a valid timestamp."
    );
  }

  return parsed.toISOString();
}

export function extractPosterBrainSourceCandidate(
  input:
    PosterBrainSourceCandidateInput
): PosterBrainSourceCandidate | null {
  const originalUrl =
    parseHttpUrl(
      input.originalUrl
    );

  if (originalUrl === null) {
    return null;
  }

  /*
   * Prefer an explicit source URL only when it is a valid
   * web origin. Otherwise derive the candidate from the
   * original publisher destination URL.
   */
  const sourceUrl =
    parseHttpUrl(
      input.sourceUrl
    );

  const identityUrl =
    sourceUrl ??
    originalUrl;

  const host =
    normalizeHost(
      identityUrl.hostname
    );

  if (!host) {
    return null;
  }

  const displayName =
    normalizeText(
      input.sourceName
    ) ??
    normalizeText(
      input.publisherName
    ) ??
    host;

  const observedAt =
    observationTimestamp(
      input.observedAt
    );

  const sourceExternalId =
    normalizeText(
      input.sourceExternalId
    );

  const providerKey =
    input.providerKey
      .trim()
      .toLowerCase();

  if (!providerKey) {
    throw new Error(
      "Source candidate providerKey is required."
    );
  }

  return {
    candidateKey:
      `host:${host}`,

    canonicalHost:
      host,

    canonicalOrigin:
      canonicalOrigin(
        identityUrl
      ),

    displayName,

    sourceType:
      inferSourceType(
        input,
        host
      ),

    status:
      "discovered",

    sourceExternalIds:
      sourceExternalId === null
        ? []
        : [
            sourceExternalId,
          ],

    providerKeys: [
      providerKey,
    ],

    evidence: [
      {
        providerKey,

        externalContentId:
          input.externalContentId,

        originalUrl:
          originalUrl.toString(),

        observedAt,
      },
    ],

    firstSeenAt:
      observedAt,

    lastSeenAt:
      observedAt,

    observationCount:
      1,
  };
}