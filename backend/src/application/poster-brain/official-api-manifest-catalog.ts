import type {
  PosterBrainOfficialApiProviderManifest,
} from "./official-api-provider-manifest.types.js";

/*
 * Crossref:
 * Metadata discovery only.
 * Abstracts and full-text links are intentionally not mapped.
 */
export const POSTER_BRAIN_CROSSREF_OFFICIAL_API_MANIFEST:
  PosterBrainOfficialApiProviderManifest =
  {
    providerKey:
      "crossref",

    displayName:
      "Crossref REST API",

    operator:
      "Crossref",

    maxPageSize:
      100,

    auth: {
      type:
        "none",
    },

    request: {
      baseUrl:
        "https://api.crossref.org",

      endpointPath:
        "/works",

      queryParameter:
        "query",

      pageSizeParameter:
        "rows",

      pagination: {
        type:
          "offset",

        requestParameter:
          "offset",

        responseTotalPath:
          "message.total-results",
      },
    },

    response: {
      collectionPath:
        "message.items",

      contentKind:
        "article",

      id: {
        path:
          "DOI",
      },

      title: {
        path:
          "title[0]",
      },

      originalUrl: {
        path:
          "URL",
      },

      publisherName: {
        path:
          "publisher",
      },

      sourceExternalId: {
        path:
          "ISSN[0]",
      },

      sourceName: {
        path:
          "container-title[0]",
      },

      languageCode: {
        path:
          "language",
      },

      tags: {
        path:
          "subject",
      },

      metadata: {
        doi:
          "DOI",

        workType:
          "type",
      },
    },

    activation: {
      enabled:
        true,

      technicalStatus:
        "validated",

      rightsStatus:
        "approved",

      commercialUseStatus:
        "approved",
    },

    policy: {
      metadataOnly:
        true,

      originalPublisherUrlRequired:
        true,

      playbackAssetsAllowed:
        false,

      downloadableMediaAllowed:
        false,

      fullContentBodyAllowed:
        false,
    },
  };

/*
 * OpenAlex:
 * CC0 scholarly metadata.
 * No PDF URL, content_url, abstract index or downloadable asset is mapped.
 */
export const POSTER_BRAIN_OPENALEX_OFFICIAL_API_MANIFEST:
  PosterBrainOfficialApiProviderManifest =
  {
    providerKey:
      "openalex",

    displayName:
      "OpenAlex API",

    operator:
      "OpenAlex",

    maxPageSize:
      100,

    auth: {
      type:
        "api_key_query",

      environmentKey:
        "OPENALEX_API_KEY",

      parameterName:
        "api_key",
    },

    request: {
      baseUrl:
        "https://api.openalex.org",

      endpointPath:
        "/works",

      fixedParameters: {
        filter:
          "language:en",
      },

      queryParameter:
        "search",

      pageSizeParameter:
        "per-page",

      pagination: {
        type:
          "cursor",

        requestParameter:
          "cursor",

        responseNextCursorPath:
          "meta.next_cursor",

        initialCursor:
          "*",
      },
    },

    response: {
      collectionPath:
        "results",

      contentKind:
        "article",

      id: {
        path:
          "id",
      },

      title: {
        path:
          "display_name",
      },

      originalUrl: {
        path:
          "primary_location.landing_page_url",
      },

      publisherName: {
        path:
          "primary_location.source.display_name",
      },

      sourceExternalId: {
        path:
          "primary_location.source.id",
      },

      sourceName: {
        path:
          "primary_location.source.display_name",
      },

      sourceUrl: {
        path:
          "primary_location.source.id",
      },

      languageCode: {
        path:
          "language",
      },

      publishedAt: {
        path:
          "publication_date",
      },

      metadata: {
        openAlexId:
          "id",

        doi:
          "doi",

        workType:
          "type",

        citedByCount:
          "cited_by_count",

        primaryTopic:
          "primary_topic.display_name",
      },
    },

    activation: {
      enabled:
        true,

      technicalStatus:
        "validated",

      rightsStatus:
        "approved",

      commercialUseStatus:
        "approved",
    },

    policy: {
      metadataOnly:
        true,

      originalPublisherUrlRequired:
        true,

      playbackAssetsAllowed:
        false,

      downloadableMediaAllowed:
        false,

      fullContentBodyAllowed:
        false,
    },
  };

/*
 * Library of Congress:
 * Technically supported, but kept out of active runtime until
 * Poster completes source-rights/commercial-use review.
 */
export const POSTER_BRAIN_LIBRARY_OF_CONGRESS_OFFICIAL_API_MANIFEST:
  PosterBrainOfficialApiProviderManifest =
  {
    providerKey:
      "library-of-congress",

    displayName:
      "Library of Congress JSON API",

    operator:
      "Library of Congress",

    maxPageSize:
      100,

    auth: {
      type:
        "none",
    },

    request: {
      baseUrl:
        "https://www.loc.gov",

      endpointPath:
        "/search/",

      fixedParameters: {
        fo:
          "json",

        fa:
          "language:english",
      },

      queryParameter:
        "q",

      pageSizeParameter:
        "c",

      pagination: {
        type:
          "page",

        requestParameter:
          "sp",

        responseCurrentPagePath:
          "pagination.current",

        responseTotalPagesPath:
          "pagination.total",
      },
    },

    response: {
      collectionPath:
        "results",

      contentKind:
        "other",

      id: {
        path:
          "id",
      },

      title: {
        path:
          "title",
      },

      originalUrl: {
        path:
          "id",
      },

      thumbnailUrl: {
        path:
          "image_url[0]",
      },

      publisherName: {
        literal:
          "Library of Congress",
      },

      sourceName: {
        literal:
          "Library of Congress",
      },

      sourceUrl: {
        literal:
          "https://www.loc.gov/",
      },

      languageCode: {
        literal:
          "en",
      },

      publishedAt: {
        path:
          "date",
      },

      tags: {
        path:
          "subject",
      },

      metadata: {
        originalFormat:
          "original_format[0]",

        digitized:
          "digitized",
      },
    },

    activation: {
      enabled:
        true,

      technicalStatus:
        "validated",

      rightsStatus:
        "pending",

      commercialUseStatus:
        "pending",
    },

    policy: {
      metadataOnly:
        true,

      originalPublisherUrlRequired:
        true,

      playbackAssetsAllowed:
        false,

      downloadableMediaAllowed:
        false,

      fullContentBodyAllowed:
        false,
    },
  };

export const POSTER_BRAIN_MANIFEST_DRIVEN_OFFICIAL_API_CATALOG:
  readonly PosterBrainOfficialApiProviderManifest[] =
  [
    POSTER_BRAIN_CROSSREF_OFFICIAL_API_MANIFEST,
    POSTER_BRAIN_OPENALEX_OFFICIAL_API_MANIFEST,
    POSTER_BRAIN_LIBRARY_OF_CONGRESS_OFFICIAL_API_MANIFEST,
  ];