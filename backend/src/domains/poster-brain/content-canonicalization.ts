const TRACKING_QUERY_PARAMETERS =
  new Set([
    "utm_source",
    "utm_medium",
    "utm_campaign",
    "utm_term",
    "utm_content",
    "utm_id",
    "fbclid",
    "gclid",
    "mc_cid",
    "mc_eid",
  ]);

export function normalizePosterBrainWhitespace(
  value: string
): string {
  return value.replace(/\s+/g, " ").trim();
}

export function stripPosterBrainHtml(
  value: string
): string {
  return normalizePosterBrainWhitespace(
    value.replace(/<[^>]*>/g, " ")
  );
}

export function normalizePosterBrainUrl(
  value: string
): string | null {
  const trimmed =
    normalizePosterBrainWhitespace(value);

  if (!trimmed) {
    return null;
  }

  try {
    const url =
      new URL(trimmed);

    url.hash = "";

    for (const key of Array.from(url.searchParams.keys())) {
      if (TRACKING_QUERY_PARAMETERS.has(key.toLowerCase())) {
        url.searchParams.delete(key);
      }
    }

    url.hostname =
      url.hostname.toLowerCase();

    if (
      url.pathname.length > 1 &&
      url.pathname.endsWith("/")
    ) {
      url.pathname =
        url.pathname.slice(0, -1);
    }

    return url.toString();
  } catch {
    return null;
  }
}

export function createPosterBrainCanonicalIdentity(input: {
  readonly sourceKey: string;
  readonly canonicalUrl: string;
  readonly guid?: string | undefined;
  readonly title: string;
}): string {
  const guid =
    normalizePosterBrainWhitespace(input.guid ?? "");

  if (guid) {
    return `${input.sourceKey}:guid:${guid.toLowerCase()}`;
  }

  return `${input.sourceKey}:url:${input.canonicalUrl.toLowerCase()}`;
}
