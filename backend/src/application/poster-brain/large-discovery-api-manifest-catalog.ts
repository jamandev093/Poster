import type {
  PosterBrainOfficialApiProviderManifest,
} from "./official-api-provider-manifest.types.js";

/*
 * NewsAPI.org
 *
 * Technical integration is validated, but commercial production
 * activation remains pending until Poster has the appropriate
 * production subscription / commercial terms.
 *
 * We intentionally search only title + description and never map
 * the API's "content" field.
 */
export const POSTER_BRAIN_NEWSAPI_DISCOVERY_MANIFEST:
  PosterBrainOfficialApiProviderManifest =
  {
    providerKey:
      "newsapi",

    providerClass:
      "aggregator",

    displayName:
      "NewsAPI",

    operator:
      "NewsAPI.org",

    maxPageSize:
      100,

    auth: {
      type:
        "api_key_header",

      environmentKey:
        "NEWSAPI_API_KEY",

      headerName:
        "X-Api-Key",
    },

    request: {
      baseUrl:
        "https://newsapi.org",

      endpointPath:
        "/v2/everything",

      fixedParameters: {
        language:
          "en",

        searchIn:
          "title,description",

        sortBy:
          "publishedAt",
      },

      queryParameter:
        "q",

      sourceParameter:
        "domains",

      pageSizeParameter:
        "pageSize",

      pagination: {
        type:
          "page_total_results",

        requestParameter:
          "page",

        responseTotalPath:
          "totalResults",
      },
    },

    response: {
      collectionPath:
        "articles",

      contentKind:
        "article",

      id: {
        path:
          "url",
      },

      title: {
        path:
          "title",
      },

      excerpt: {
        path:
          "description",
      },

      originalUrl: {
        path:
          "url",
      },

      thumbnailUrl: {
        path:
          "urlToImage",
      },

      publisherName: {
        path:
          "source.name",
      },

      sourceExternalId: {
        path:
          "source.id",
      },

      sourceName: {
        path:
          "source.name",
      },

      languageCode: {
        literal:
          "en",
      },

      publishedAt: {
        path:
          "publishedAt",
      },

      metadata: {
        author:
          "author",

        sourceId:
          "source.id",
      },
    },

    activation: {
      enabled:
        true,

      technicalStatus:
        "validated",

      rightsStatus:
        "approved",

      /*
       * Production use is not assumed from a development key.
       */
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

/*
 * GDELT DOC 2.0
 *
 * Used as a broad link/source discovery index.
 * English-source restriction is appended directly to the query.
 * No article body, translated body, download or playback asset
 * is mapped into Poster.
 */
export const POSTER_BRAIN_GDELT_DISCOVERY_MANIFEST:
  PosterBrainOfficialApiProviderManifest =
  {
    providerKey:
      "gdelt",

    providerClass:
      "aggregator",

    displayName:
      "GDELT DOC 2.0",

    operator:
      "The GDELT Project",

    maxPageSize:
      250,

    auth: {
      type:
        "none",
    },

    request: {
      baseUrl:
        "https://api.gdeltproject.org",

      endpointPath:
        "/api/v2/doc/doc",

      fixedParameters: {
        mode:
          "artlist",

        format:
          "json",

        sort:
          "datedesc",

        timespan:
          "1week",
      },

      queryParameter:
        "query",

      querySuffix:
        " sourcelang:english",

      pageSizeParameter:
        "maxrecords",

      pagination: {
        type:
          "none",
      },
    },

    response: {
      collectionPath:
        "articles",

      contentKind:
        "article",

      id: {
        path:
          "url",
      },

      title: {
        path:
          "title",
      },

      originalUrl: {
        path:
          "url",
      },

      thumbnailUrl: {
        path:
          "socialimage",
      },

      publisherName: {
        path:
          "domain",
      },

      sourceExternalId: {
        path:
          "domain",
      },

      sourceName: {
        path:
          "domain",
      },

      languageCode: {
        literal:
          "en",
      },

      /*
       * GDELT seendate uses compact YYYYMMDDTHHMMSSZ format.
       * Preserve it as provenance rather than pretending it is
       * already a canonical ISO timestamp.
       */
      metadata: {
        domain:
          "domain",

        sourceCountry:
          "sourcecountry",

        sourceLanguage:
          "language",

        seenDate:
          "seendate",
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

export const POSTER_BRAIN_LARGE_DISCOVERY_API_MANIFEST_CATALOG:
  readonly PosterBrainOfficialApiProviderManifest[] =
  [
    POSTER_BRAIN_NEWSAPI_DISCOVERY_MANIFEST,
    POSTER_BRAIN_GDELT_DISCOVERY_MANIFEST,
  ];