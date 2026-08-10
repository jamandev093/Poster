import {
  PosterBrainContentApiProviderError,
} from "./content-api-provider-registry.service.js";

import type {
  PosterBrainContentApiProvider,
  PosterBrainContentApiProviderContentKind,
  PosterBrainContentApiProviderItem,
} from "./content-api-provider.types.js";

import {
  fetchPosterBrainOfficialApiJson,
  type PosterBrainOfficialApiHttpFetch,
} from "./official-content-api-http.js";

export interface PosterBrainNasaImagesContentApiProviderDependencies {
  readonly fetchImplementation?:
    PosterBrainOfficialApiHttpFetch;
}

function record(
  value:
    unknown
): Record<string, unknown> | null {
  if (
    value === null ||
    typeof value !== "object" ||
    Array.isArray(value)
  ) {
    return null;
  }

  return value as
    Record<string, unknown>;
}

function array(
  value:
    unknown
): readonly unknown[] {
  return Array.isArray(value)
    ? value
    : [];
}

function text(
  value:
    unknown
): string | null {
  if (
    typeof value !==
    "string"
  ) {
    return null;
  }

  const cleaned =
    value.trim();

  return cleaned
    ? cleaned
    : null;
}

function strings(
  value:
    unknown
): readonly string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter(
      (
        item
      ): item is string =>
        typeof item ===
        "string"
    )
    .map(
      item =>
        item.trim()
    )
    .filter(
      item =>
        item.length >
        0
    );
}

function contentKind(
  mediaType:
    string | null
): PosterBrainContentApiProviderContentKind | null {
  if (
    mediaType ===
    "image"
  ) {
    return "image";
  }

  if (
    mediaType ===
    "video"
  ) {
    return "video";
  }

  return null;
}

function previewImage(
  rawLinks:
    unknown
): string | null {
  for (
    const raw
    of array(
      rawLinks
    )
  ) {
    const link =
      record(
        raw
      );

    const href =
      text(
        link?.["href"]
      );

    const render =
      text(
        link?.["render"]
      );

    if (
      href !== null &&
      render === "image"
    ) {
      return href;
    }
  }

  return null;
}

function nextPage(
  rawLinks:
    unknown
): string | null {
  for (
    const raw
    of array(
      rawLinks
    )
  ) {
    const link =
      record(
        raw
      );

    if (
      text(
        link?.["rel"]
      ) !== "next"
    ) {
      continue;
    }

    const href =
      text(
        link?.["href"]
      );

    if (href === null) {
      continue;
    }

    try {
      const parsed =
        new URL(
          href
        );

      return (
        parsed.searchParams.get(
          "page"
        )
      );
    }
    catch {
      continue;
    }
  }

  return null;
}

function cursorPage(
  cursor:
    string | null
): number {
  if (cursor === null) {
    return 1;
  }

  if (
    !/^\d+$/.test(
      cursor
    )
  ) {
    throw new PosterBrainContentApiProviderError({
      code:
        "invalid_response",

      retryable:
        false,

      message:
        "NASA Images cursor must be a positive page number.",
    });
  }

  const parsed =
    Number(
      cursor
    );

  if (
    !Number.isSafeInteger(
      parsed
    ) ||
    parsed < 1
  ) {
    throw new PosterBrainContentApiProviderError({
      code:
        "invalid_response",

      retryable:
        false,

      message:
        "NASA Images cursor must be a positive page number.",
    });
  }

  return parsed;
}

export function createPosterBrainNasaImagesContentApiProvider(
  dependencies:
    PosterBrainNasaImagesContentApiProviderDependencies = {}
): PosterBrainContentApiProvider {
  return {
    providerKey:
      "nasa-images",

    displayName:
      "NASA Image and Video Library",

    capabilities: {
      metadataOnly:
        true,

      providerClass:
        "official",

      supportedContentKinds: [
        "image",
        "video",
      ],

      requiredEnvironmentKeys:
        [],

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
            "NASA Images acquisition requires a discovery query.",
        });
      }

      const page =
        cursorPage(
          request.cursor
        );

      const url =
        new URL(
          "https://images-api.nasa.gov/search"
        );

      url.searchParams.set(
        "q",
        query
      );

      url.searchParams.set(
        "media_type",
        "image,video"
      );

      url.searchParams.set(
        "page",
        String(
          page
        )
      );

      url.searchParams.set(
        "page_size",
        String(
          Math.min(
            request.pageSize,
            100
          )
        )
      );

      const payload =
        await fetchPosterBrainOfficialApiJson({
          url:
            url.toString(),

          signal:
            request.signal,

          ...(dependencies.fetchImplementation ===
          undefined
            ? {}
            : {
                fetchImplementation:
                  dependencies.fetchImplementation,
              }),
        });

      const root =
        record(
          payload
        );

      const collection =
        record(
          root?.["collection"]
        );

      if (collection === null) {
        throw new PosterBrainContentApiProviderError({
          code:
            "invalid_response",

          retryable:
            false,

          message:
            "NASA Images returned an invalid collection.",
        });
      }

      const items:
        PosterBrainContentApiProviderItem[] =
        [];

      for (
        const raw
        of array(
          collection["items"]
        )
      ) {
        const item =
          record(
            raw
          );

        if (item === null) {
          continue;
        }

        const data =
          array(
            item["data"]
          );

        const metadata =
          record(
            data[0]
          );

        if (metadata === null) {
          continue;
        }

        const nasaId =
          text(
            metadata["nasa_id"]
          );

        const title =
          text(
            metadata["title"]
          );

        const mediaType =
          text(
            metadata["media_type"]
          );

        const kind =
          contentKind(
            mediaType
          );

        if (
          nasaId === null ||
          title === null ||
          kind === null
        ) {
          continue;
        }

        const preview =
          previewImage(
            item["links"]
          );

        const center =
          text(
            metadata["center"]
          );

        items.push({
          externalContentId:
            `nasa-images:${nasaId}`,

          contentKind:
            kind,

          title,

          excerpt:
            text(
              metadata["description"]
            ) ??
            text(
              metadata[
                "description_508"
              ]
            ) ??
            "",

          originalUrl:
            `https://images.nasa.gov/details/${encodeURIComponent(nasaId)}`,

          thumbnailUrl:
            preview,

          imageUrl:
            kind === "image"
              ? preview
              : null,

          publisherName:
            "NASA",

          sourceExternalId:
            center,

          sourceName:
            center === null
              ? "NASA"
              : `NASA ${center}`,

          sourceUrl:
            "https://www.nasa.gov/",

          languageCode:
            "en",

          regionCode:
            "US",

          publishedAt:
            text(
              metadata[
                "date_created"
              ]
            ),

          durationSeconds:
            null,

          tags:
            strings(
              metadata["keywords"]
            ),

          topics:
            [],

          metadata: {
            nasaId,

            center,

            photographer:
              text(
                metadata[
                  "photographer"
                ]
              ),

            secondaryCreator:
              text(
                metadata[
                  "secondary_creator"
                ]
              ),

            location:
              text(
                metadata[
                  "location"
                ]
              ),

            mediaType,
          },
        });
      }

      return {
        items,

        nextCursor:
          nextPage(
            collection[
              "links"
            ]
          ),

        quota:
          null,
      };
    },
  };
}