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

/*
 * NewsCatcher News API
 *
 * Uses the official GET search interface so Poster can reuse the
 * existing generic manifest transport.
 *
 * The upstream response can contain article content. Poster never
 * maps that field. Only discovery metadata, image reference and the
 * original publisher URL enter Poster.
 *
 * Production activation remains held until Poster explicitly
 * approves the applicable commercial/API terms.
 */
export const POSTER_BRAIN_NEWSCATCHER_DISCOVERY_MANIFEST:
  PosterBrainOfficialApiProviderManifest =
  {
    providerKey:
      "newscatcher",

    providerClass:
      "aggregator",

    displayName:
      "NewsCatcher News API",

    operator:
      "NewsCatcher",

    maxPageSize:
      100,

    auth: {
      type:
        "api_key_header",

      environmentKey:
        "NEWSCATCHER_API_KEY",

      headerName:
        "x-api-token",
    },

    request: {
      baseUrl:
        "https://v3-api.newscatcherapi.com",

      endpointPath:
        "/api/search",

      fixedParameters: {
        lang:
          "en",

        search_in:
          "title_content",

        include_translation_fields:
          "false",

        include_nlp_data:
          "false",

        exclude_duplicates:
          "true",

        robots_compliant:
          "true",
      },

      queryParameter:
        "q",

      sourceParameter:
        "sources",

      pageSizeParameter:
        "page_size",

      pagination: {
        type:
          "page",

        requestParameter:
          "page",

        responseCurrentPagePath:
          "page",

        responseTotalPagesPath:
          "total_pages",
      },
    },

    response: {
      collectionPath:
        "articles",

      contentKind:
        "article",

      id: {
        path:
          "id",
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
          "link",
      },

      thumbnailUrl: {
        path:
          "media",
      },

      publisherName: {
        path:
          "name_source",
      },

      sourceExternalId: {
        path:
          "domain_url",
      },

      sourceName: {
        path:
          "name_source",
      },

      sourceUrl: {
        path:
          "parent_url",
      },

      languageCode: {
        path:
          "language",
      },

      /*
       * NewsCatcher commonly returns published_date using a
       * SQL-like UTC representation rather than Poster's
       * canonical ISO timestamp contract. Preserve provenance
       * in metadata instead of injecting an unsafe timestamp.
       */
      metadata: {
        newsCatcherId:
          "id",

        publishedDate:
          "published_date",

        domain:
          "domain_url",

        fullDomain:
          "full_domain_url",

        author:
          "author",

        country:
          "country",

        rights:
          "rights",

        rank:
          "rank",

        paidContent:
          "paid_content",
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

/*
 * Event Registry / NewsAPI.ai
 *
 * Event Registry can return full article bodies by default.
 * Poster explicitly requests includeArticleBody=false and never
 * maps body, videos, article links or original-article payloads.
 *
 * Production activation remains held until rights/commercial
 * approval is explicitly completed.
 */
export const POSTER_BRAIN_EVENT_REGISTRY_DISCOVERY_MANIFEST:
  PosterBrainOfficialApiProviderManifest =
  {
    providerKey:
      "event-registry",

    providerClass:
      "aggregator",

    displayName:
      "Event Registry / NewsAPI.ai",

    operator:
      "Event Registry",

    maxPageSize:
      100,

    auth: {
      type:
        "api_key_query",

      environmentKey:
        "EVENT_REGISTRY_API_KEY",

      parameterName:
        "apiKey",
    },

    request: {
      baseUrl:
        "https://eventregistry.org",

      endpointPath:
        "/api/v1/article/getArticles",

      fixedParameters: {
        resultType:
          "articles",

        lang:
          "eng",

        dataType:
          "news",

        articlesSortBy:
          "date",

        articlesSortByAsc:
          "false",

        isDuplicateFilter:
          "skipDuplicates",

        includeArticleTitle:
          "true",

        includeArticleBasicInfo:
          "true",

        includeArticleBody:
          "false",

        includeArticleImage:
          "true",

        includeArticleVideos:
          "false",

        includeArticleLinks:
          "false",

        includeArticleOriginalArticle:
          "false",
      },

      queryParameter:
        "keyword",

      sourceParameter:
        "sourceUri",

      pageSizeParameter:
        "articlesCount",

      pagination: {
        type:
          "page",

        requestParameter:
          "articlesPage",

        responseCurrentPagePath:
          "articles.page",

        responseTotalPagesPath:
          "articles.pages",
      },
    },

    response: {
      collectionPath:
        "articles.results",

      contentKind:
        "article",

      id: {
        path:
          "uri",
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
          "image",
      },

      publisherName: {
        path:
          "source.title",
      },

      sourceExternalId: {
        path:
          "source.uri",
      },

      sourceName: {
        path:
          "source.title",
      },

      languageCode: {
        literal:
          "en",
      },

      publishedAt: {
        path:
          "dateTime",
      },

      metadata: {
        eventRegistryUri:
          "uri",

        dataType:
          "dataType",

        eventUri:
          "eventUri",

        relevance:
          "relevance",

        sourceUri:
          "source.uri",
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
export const POSTER_BRAIN_LARGE_DISCOVERY_API_MANIFEST_CATALOG:
  readonly PosterBrainOfficialApiProviderManifest[] =
  [
    POSTER_BRAIN_NEWSAPI_DISCOVERY_MANIFEST,
    POSTER_BRAIN_GDELT_DISCOVERY_MANIFEST,
    POSTER_BRAIN_NEWSCATCHER_DISCOVERY_MANIFEST,
    POSTER_BRAIN_EVENT_REGISTRY_DISCOVERY_MANIFEST,
  ];