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

export interface PosterBrainPubMedContentApiProviderDependencies {
  readonly developerEmail:
    string;

  readonly apiKey?:
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
      .replace(/<[^>]*>/g, " ")
      .replace(/\s+/g, " ")
      .trim();

  return cleaned || null;
}

function cursorOffset(
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
        "PubMed cursor is invalid.",
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
        "PubMed cursor is invalid.",
    });
  }

  return value;
}

function appendCommonParameters(
  url: URL,
  dependencies:
    PosterBrainPubMedContentApiProviderDependencies
): void {
  url.searchParams.set(
    "tool",
    "Poster"
  );

  url.searchParams.set(
    "email",
    dependencies.developerEmail
  );

  const apiKey =
    dependencies.apiKey
      ?.trim() ??
    "";

  if (apiKey) {
    url.searchParams.set(
      "api_key",
      apiKey
    );
  }
}

function publishedAt(
  summary:
    Record<string, unknown>
): string | null {
  const value =
    text(
      summary["sortpubdate"]
    );

  if (value === null) {
    return null;
  }

  const match =
    /^(\d{4})\/(\d{2})\/(\d{2})(?:\s+(\d{2}):(\d{2}))?$/
      .exec(value);

  if (match === null) {
    return null;
  }

  const iso =
    `${match[1]}-${match[2]}-${match[3]}T${match[4] ?? "00"}:${match[5] ?? "00"}:00.000Z`;

  const parsed =
    new Date(iso);

  return Number.isNaN(
    parsed.getTime()
  )
    ? null
    : parsed.toISOString();
}

function firstAuthor(
  summary:
    Record<string, unknown>
): string | null {
  for (
    const raw
    of array(
      summary["authors"]
    )
  ) {
    const author =
      record(raw);

    const name =
      text(
        author?.["name"]
      );

    if (name !== null) {
      return name;
    }
  }

  return null;
}

function doi(
  summary:
    Record<string, unknown>
): string | null {
  for (
    const raw
    of array(
      summary["articleids"]
    )
  ) {
    const articleId =
      record(raw);

    if (
      text(
        articleId?.["idtype"]
      )?.toLowerCase() !==
      "doi"
    ) {
      continue;
    }

    return text(
      articleId?.["value"]
    );
  }

  return null;
}

export function createPosterBrainPubMedContentApiProvider(
  dependencies:
    PosterBrainPubMedContentApiProviderDependencies
): PosterBrainContentApiProvider {
  return {
    providerKey:
      "pubmed",

    displayName:
      "NCBI PubMed E-utilities",

    capabilities: {
      metadataOnly:
        true,

      providerClass:
        "official",

      supportedContentKinds: [
        "article",
      ],

      /*
       * API itself is public, but Poster requires an
       * identifiable developer email for production use.
       */
      requiredEnvironmentKeys: [
        "NCBI_EUTILS_EMAIL",
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

      const journal =
        request.sourceExternalId?.trim() ??
        "";

      if (
        !query &&
        !journal
      ) {
        throw new PosterBrainContentApiProviderError({
          code:
            "invalid_response",

          retryable:
            false,

          message:
            "PubMed acquisition requires a query or journal name.",
        });
      }

      const offset =
        cursorOffset(
          request.cursor
        );

      const pageSize =
        Math.min(
          request.pageSize,
          100
        );

      const terms:
        string[] =
        [];

      if (query) {
        terms.push(
          `(${query})`
        );
      }

      if (journal) {
        terms.push(
          `"${journal}"[jour]`
        );
      }

      terms.push(
        "english[Language]"
      );

      const searchUrl =
        new URL(
          "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi"
        );

      searchUrl.searchParams.set(
        "db",
        "pubmed"
      );

      searchUrl.searchParams.set(
        "retmode",
        "json"
      );

      searchUrl.searchParams.set(
        "retmax",
        String(pageSize)
      );

      searchUrl.searchParams.set(
        "retstart",
        String(offset)
      );

      searchUrl.searchParams.set(
        "sort",
        "pub date"
      );

      searchUrl.searchParams.set(
        "term",
        terms.join(" AND ")
      );

      appendCommonParameters(
        searchUrl,
        dependencies
      );

      const searchPayload =
        await fetchPosterBrainOfficialApiJson({
          url:
            searchUrl.toString(),

          signal:
            request.signal,

          ...(dependencies.fetchImplementation === undefined
            ? {}
            : {
                fetchImplementation:
                  dependencies.fetchImplementation,
              }),
        });

      const searchRoot =
        record(
          searchPayload
        );

      const searchResult =
        record(
          searchRoot?.["esearchresult"]
        );

      if (searchResult === null) {
        throw new PosterBrainContentApiProviderError({
          code:
            "invalid_response",

          retryable:
            false,

          message:
            "PubMed ESearch returned an invalid response.",
        });
      }

      const ids =
        array(
          searchResult["idlist"]
        )
          .map(text)
          .filter(
            (value): value is string =>
              value !== null
          );

      if (ids.length === 0) {
        return {
          items:
            [],

          nextCursor:
            null,

          quota:
            null,
        };
      }

      const summaryUrl =
        new URL(
          "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi"
        );

      summaryUrl.searchParams.set(
        "db",
        "pubmed"
      );

      summaryUrl.searchParams.set(
        "retmode",
        "json"
      );

      summaryUrl.searchParams.set(
        "version",
        "2.0"
      );

      summaryUrl.searchParams.set(
        "id",
        ids.join(",")
      );

      appendCommonParameters(
        summaryUrl,
        dependencies
      );

      const summaryPayload =
        await fetchPosterBrainOfficialApiJson({
          url:
            summaryUrl.toString(),

          signal:
            request.signal,

          ...(dependencies.fetchImplementation === undefined
            ? {}
            : {
                fetchImplementation:
                  dependencies.fetchImplementation,
              }),
        });

      const summaryRoot =
        record(
          summaryPayload
        );

      const result =
        record(
          summaryRoot?.["result"]
        );

      if (result === null) {
        throw new PosterBrainContentApiProviderError({
          code:
            "invalid_response",

          retryable:
            false,

          message:
            "PubMed ESummary returned an invalid response.",
        });
      }

      const items:
        PosterBrainContentApiProviderItem[] =
        [];

      for (const pmid of ids) {
        const summary =
          record(
            result[pmid]
          );

        if (summary === null) {
          continue;
        }

        const title =
          text(
            summary["title"]
          );

        if (title === null) {
          continue;
        }

        const journalName =
          text(
            summary["fulljournalname"]
          ) ??
          text(
            summary["source"]
          ) ??
          "PubMed";

        items.push({
          externalContentId:
            `pubmed:${pmid}`,

          contentKind:
            "article",

          title,

          /*
           * Intentionally do not ingest abstracts.
           */
          excerpt:
            "",

          originalUrl:
            `https://pubmed.ncbi.nlm.nih.gov/${encodeURIComponent(pmid)}/`,

          thumbnailUrl:
            null,

          imageUrl:
            null,

          publisherName:
            journalName,

          sourceExternalId:
            journalName,

          sourceName:
            journalName,

          sourceUrl:
            null,

          languageCode:
            "en",

          regionCode:
            null,

          publishedAt:
            publishedAt(
              summary
            ),

          durationSeconds:
            null,

          tags:
            [],

          topics: [
            "Medicine",
            "Biomedical Research",
          ],

          metadata: {
            pmid,

            doi:
              doi(summary),

            firstAuthor:
              firstAuthor(summary),

            publicationDate:
              text(
                summary["pubdate"]
              ),
          },
        });
      }

      const total =
        Number(
          searchResult["count"]
        );

      const nextOffset =
        offset +
        ids.length;

      const nextCursor =
        Number.isFinite(total) &&
        nextOffset < total
          ? String(nextOffset)
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