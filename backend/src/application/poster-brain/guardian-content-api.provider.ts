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

export interface PosterBrainGuardianContentApiProviderDependencies {
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

function positivePage(
  cursor: string | null
): number {
  if (cursor === null) {
    return 1;
  }

  if (!/^\d+$/.test(cursor)) {
    throw new PosterBrainContentApiProviderError({
      code:
        "invalid_response",

      retryable:
        false,

      message:
        "Guardian page cursor is invalid.",
    });
  }

  const page =
    Number(cursor);

  if (
    !Number.isSafeInteger(page) ||
    page < 1
  ) {
    throw new PosterBrainContentApiProviderError({
      code:
        "invalid_response",

      retryable:
        false,

      message:
        "Guardian page cursor is invalid.",
    });
  }

  return page;
}

function tags(
  raw: unknown
): readonly string[] {
  const output: string[] =
    [];

  const seen =
    new Set<string>();

  for (const value of array(raw)) {
    const tag =
      record(value);

    const title =
      text(
        tag?.["webTitle"]
      );

    if (title === null) {
      continue;
    }

    const key =
      title.toLowerCase();

    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    output.push(title);
  }

  return output;
}

export function createPosterBrainGuardianContentApiProvider(
  dependencies:
    PosterBrainGuardianContentApiProviderDependencies
): PosterBrainContentApiProvider {
  return {
    providerKey:
      "guardian",

    displayName:
      "The Guardian Open Platform",

    capabilities: {
      metadataOnly:
        true,

      providerClass:
        "official",

      supportedContentKinds: [
        "article",
      ],

      requiredEnvironmentKeys: [
        "GUARDIAN_API_KEY",
      ],

      supportsCursorPagination:
        true,

      supportsQuotaMetadata:
        false,

      maxPageSize:
        50,
    },

    async fetchPage(
      request
    ) {
      const query =
        request.query?.trim() ??
        "";

      const section =
        request.sourceExternalId?.trim() ??
        "";

      if (
        !query &&
        !section
      ) {
        throw new PosterBrainContentApiProviderError({
          code:
            "invalid_response",

          retryable:
            false,

          message:
            "Guardian acquisition requires a query or section.",
        });
      }

      const page =
        positivePage(
          request.cursor
        );

      const url =
        new URL(
          "https://content.guardianapis.com/search"
        );

      url.searchParams.set(
        "api-key",
        dependencies.apiKey
      );

      url.searchParams.set(
        "page",
        String(page)
      );

      url.searchParams.set(
        "page-size",
        String(
          Math.min(
            request.pageSize,
            50
          )
        )
      );

      url.searchParams.set(
        "order-by",
        "newest"
      );

      /*
       * Deliberately request keyword metadata only.
       * Never request body/bodyText/full article fields.
       */
      url.searchParams.set(
        "show-tags",
        "keyword"
      );

      if (query) {
        url.searchParams.set(
          "q",
          query
        );
      }

      if (section) {
        url.searchParams.set(
          "section",
          section
        );
      }

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

      if (
        response === null ||
        text(response["status"]) !== "ok"
      ) {
        throw new PosterBrainContentApiProviderError({
          code:
            "invalid_response",

          retryable:
            false,

          message:
            "Guardian API returned an invalid response.",
        });
      }

      const items:
        PosterBrainContentApiProviderItem[] =
        [];

      for (
        const raw
        of array(
          response["results"]
        )
      ) {
        const result =
          record(raw);

        const id =
          text(
            result?.["id"]
          );

        const title =
          text(
            result?.["webTitle"]
          );

        const originalUrl =
          text(
            result?.["webUrl"]
          );

        if (
          id === null ||
          title === null ||
          originalUrl === null
        ) {
          continue;
        }

        const sectionId =
          text(
            result?.["sectionId"]
          );

        const sectionName =
          text(
            result?.["sectionName"]
          );

        items.push({
          externalContentId:
            `guardian:${id}`,

          contentKind:
            "article",

          title,

          /*
           * Copyright-safe discovery record:
           * no article body, no body excerpt.
           */
          excerpt:
            "",

          originalUrl,

          thumbnailUrl:
            null,

          imageUrl:
            null,

          publisherName:
            "The Guardian",

          sourceExternalId:
            sectionId,

          sourceName:
            sectionName ??
            "The Guardian",

          sourceUrl:
            sectionId === null
              ? "https://www.theguardian.com/"
              : `https://www.theguardian.com/${encodeURIComponent(sectionId)}`,

          languageCode:
            "en",

          regionCode:
            "GB",

          publishedAt:
            text(
              result?.["webPublicationDate"]
            ),

          durationSeconds:
            null,

          tags:
            tags(
              result?.["tags"]
            ),

          topics:
            sectionName === null
              ? []
              : [
                  sectionName,
                ],

          metadata: {
            guardianContentId:
              id,

            contentType:
              text(
                result?.["type"]
              ),

            sectionId,
          },
        });
      }

      const currentPage =
        Number(
          response["currentPage"]
        );

      const pages =
        Number(
          response["pages"]
        );

      const nextCursor =
        Number.isSafeInteger(currentPage) &&
        Number.isSafeInteger(pages) &&
        currentPage < pages
          ? String(
              currentPage +
              1
            )
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