import {
  PosterBrainContentApiProviderError,
} from "./content-api-provider-registry.service.js";

import type {
  PosterBrainContentApiProvider,
  PosterBrainContentApiProviderItem,
} from "./content-api-provider.types.js";

import {
  fetchPosterBrainOfficialApiJson,
  type PosterBrainOfficialApiHttpFetch,
} from "./official-content-api-http.js";

export interface PosterBrainSmithsonianContentApiProviderDependencies {
  readonly apiKey:
    string;

  readonly fetchImplementation?:
    PosterBrainOfficialApiHttpFetch;
}

function record(
  value: unknown
): Record<string, unknown> | null {
  if (
    value === null ||
    typeof value !== "object" ||
    Array.isArray(value)
  ) {
    return null;
  }

  return value as Record<string, unknown>;
}

function array(
  value: unknown
): readonly unknown[] {
  return Array.isArray(value)
    ? value
    : [];
}

function text(
  value: unknown
): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const cleaned =
    value
      .replace(/\s+/g, " ")
      .trim();

  return cleaned || null;
}

function httpText(
  value: unknown
): string | null {
  const candidate =
    text(value);

  if (candidate === null) {
    return null;
  }

  try {
    const url =
      new URL(candidate);

    if (
      url.protocol !== "http:" &&
      url.protocol !== "https:"
    ) {
      return null;
    }

    return url.toString();
  }
  catch {
    return null;
  }
}

function startOffset(
  cursor: string | null
): number {
  if (cursor === null) {
    return 0;
  }

  if (!/^\d+$/.test(cursor)) {
    throw new PosterBrainContentApiProviderError({
      code:
        "invalid_response",

      retryable:
        false,

      message:
        "Smithsonian cursor is invalid.",
    });
  }

  const value =
    Number(cursor);

  if (
    !Number.isSafeInteger(value) ||
    value < 0
  ) {
    throw new PosterBrainContentApiProviderError({
      code:
        "invalid_response",

      retryable:
        false,

      message:
        "Smithsonian cursor is invalid.",
    });
  }

  return value;
}

function descriptiveNonRepeating(
  row:
    Record<string, unknown>
): Record<string, unknown> | null {
  const content =
    record(
      row["content"]
    );

  return record(
    content?.["descriptiveNonRepeating"]
  );
}

function thumbnail(
  row:
    Record<string, unknown>
): string | null {
  const descriptive =
    descriptiveNonRepeating(
      row
    );

  const onlineMedia =
    record(
      descriptive?.["online_media"]
    );

  for (
    const raw
    of array(
      onlineMedia?.["media"]
    )
  ) {
    const media =
      record(raw);

    const value =
      httpText(
        media?.["thumbnail"]
      );

    if (value !== null) {
      return value;
    }
  }

  return null;
}

function recordUrl(
  row:
    Record<string, unknown>
): string | null {
  const direct =
    httpText(
      row["url"]
    );

  if (direct !== null) {
    return direct;
  }

  const descriptive =
    descriptiveNonRepeating(
      row
    );

  return httpText(
    descriptive?.["record_link"]
  );
}

function dataSource(
  row:
    Record<string, unknown>
): string | null {
  const descriptive =
    descriptiveNonRepeating(
      row
    );

  return text(
    descriptive?.["data_source"]
  );
}

export function createPosterBrainSmithsonianContentApiProvider(
  dependencies:
    PosterBrainSmithsonianContentApiProviderDependencies
): PosterBrainContentApiProvider {
  return {
    providerKey:
      "smithsonian",

    displayName:
      "Smithsonian Open Access API",

    capabilities: {
      metadataOnly:
        true,

      providerClass:
        "official",

      supportedContentKinds: [
        "image",
        "document",
        "other",
      ],

      requiredEnvironmentKeys: [
        "SMITHSONIAN_API_KEY",
      ],

      supportsCursorPagination:
        true,

      supportsQuotaMetadata:
        false,

      maxPageSize:
        100,
    },

    async fetchPage(
      request
    ) {
      const query =
        request.query?.trim() ??
        "";

      if (!query) {
        throw new PosterBrainContentApiProviderError({
          code:
            "invalid_response",

          retryable:
            false,

          message:
            "Smithsonian acquisition requires a discovery query.",
        });
      }

      const start =
        startOffset(
          request.cursor
        );

      const url =
        new URL(
          "https://api.si.edu/openaccess/api/v1.0/search"
        );

      url.searchParams.set(
        "q",
        query
      );

      url.searchParams.set(
        "start",
        String(start)
      );

      url.searchParams.set(
        "rows",
        String(
          Math.min(
            request.pageSize,
            100
          )
        )
      );

      url.searchParams.set(
        "sort",
        "relevancy"
      );

      url.searchParams.set(
        "type",
        "edanmdm"
      );

      url.searchParams.set(
        "row_group",
        "objects"
      );

      url.searchParams.set(
        "api_key",
        dependencies.apiKey
      );

      const payload =
        await fetchPosterBrainOfficialApiJson({
          url:
            url.toString(),

          signal:
            request.signal,

          ...(dependencies.fetchImplementation === undefined
            ? {}
            : {
                fetchImplementation:
                  dependencies.fetchImplementation,
              }),
        });

      const root =
        record(payload);

      const response =
        record(
          root?.["response"]
        );

      if (response === null) {
        throw new PosterBrainContentApiProviderError({
          code:
            "invalid_response",

          retryable:
            false,

          message:
            "Smithsonian API returned an invalid response.",
        });
      }

      const rows =
        array(
          response["rows"]
        );

      const items:
        PosterBrainContentApiProviderItem[] =
        [];

      for (const raw of rows) {
        const row =
          record(raw);

        if (row === null) {
          continue;
        }

        const id =
          text(
            row["id"]
          );

        const title =
          text(
            row["title"]
          );

        const originalUrl =
          recordUrl(row);

        if (
          id === null ||
          title === null ||
          originalUrl === null
        ) {
          continue;
        }

        const unitCode =
          text(
            row["unitCode"]
          );

        const source =
          dataSource(row) ??
          "Smithsonian Institution";

        items.push({
          externalContentId:
            `smithsonian:${id}`,

          contentKind:
            "other",

          title,

          excerpt:
            "",

          originalUrl,

          /*
           * Keep only the provider-hosted thumbnail reference.
           * Do not ingest full media/download URLs.
           */
          thumbnailUrl:
            thumbnail(row),

          imageUrl:
            null,

          publisherName:
            "Smithsonian Institution",

          sourceExternalId:
            unitCode,

          sourceName:
            source,

          sourceUrl:
            "https://www.si.edu/",

          languageCode:
            "en",

          regionCode:
            "US",

          publishedAt:
            null,

          durationSeconds:
            null,

          tags:
            [],

          topics:
            [],

          metadata: {
            smithsonianId:
              id,

            unitCode,

            dataSource:
              source,
          },
        });
      }

      const rowCount =
        Number(
          response["rowCount"]
        );

      const nextStart =
        start +
        rows.length;

      const nextCursor =
        Number.isFinite(rowCount) &&
        nextStart < rowCount
          ? String(nextStart)
          : null;

      return {
        items,
        nextCursor,
        quota:
          null,
      };
    },
  };
}