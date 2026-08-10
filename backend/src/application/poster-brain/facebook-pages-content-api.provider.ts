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

export interface PosterBrainFacebookPagesContentApiProviderDependencies {
  readonly accessToken:
    string;

  readonly apiVersion?:
    string;

  readonly fetchImplementation?:
    PosterBrainOfficialApiHttpFetch;
}

const DEFAULT_META_GRAPH_VERSION =
  "v26.0";

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
    value
      .replace(
        /\s+/g,
        " "
      )
      .trim();

  return cleaned
    ? cleaned
    : null;
}

function bounded(
  value:
    string,
  maximum:
    number
): string {
  return value.length <= maximum
    ? value
    : value
        .slice(
          0,
          maximum
        )
        .trimEnd();
}

function normalizeVersion(
  value:
    string | undefined
): string {
  const cleaned =
    value?.trim() ??
    DEFAULT_META_GRAPH_VERSION;

  if (
    !/^v\d+\.\d+$/.test(
      cleaned
    )
  ) {
    throw new Error(
      "META_GRAPH_API_VERSION must use vNN.N format."
    );
  }

  return cleaned;
}

export function createPosterBrainFacebookPagesContentApiProvider(
  dependencies:
    PosterBrainFacebookPagesContentApiProviderDependencies
): PosterBrainContentApiProvider {
  const apiVersion =
    normalizeVersion(
      dependencies.apiVersion
    );

  return {
    providerKey:
      "facebook-pages",

    displayName:
      "Facebook Pages API",

    capabilities: {
      metadataOnly:
        true,

      providerClass:
        "official",

      supportedContentKinds: [
        "other",
      ],

      requiredEnvironmentKeys: [
        "META_GRAPH_ACCESS_TOKEN",
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
      const pageId =
        request.sourceExternalId?.trim() ??
        "";

      if (!pageId) {
        throw new PosterBrainContentApiProviderError({
          code:
            "invalid_response",

          retryable:
            false,

          message:
            "Facebook Pages acquisition requires an authorized Page ID.",
        });
      }

      const pageUrl =
        new URL(
          `https://graph.facebook.com/${apiVersion}/${encodeURIComponent(pageId)}`
        );

      pageUrl.searchParams.set(
        "fields",
        "id,name,link"
      );

      pageUrl.searchParams.set(
        "access_token",
        dependencies.accessToken
      );

      const pagePayload =
        await fetchPosterBrainOfficialApiJson({
          url:
            pageUrl.toString(),

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

      const page =
        record(
          pagePayload
        );

      const pageName =
        text(
          page?.["name"]
        );

      if (pageName === null) {
        throw new PosterBrainContentApiProviderError({
          code:
            "invalid_response",

          retryable:
            false,

          message:
            "Facebook Pages API returned invalid Page metadata.",
        });
      }

      const pageLink =
        text(
          page?.["link"]
        ) ??
        `https://www.facebook.com/${encodeURIComponent(pageId)}`;

      const postsUrl =
        new URL(
          `https://graph.facebook.com/${apiVersion}/${encodeURIComponent(pageId)}/posts`
        );

      postsUrl.searchParams.set(
        "fields",
        "id,message,created_time,permalink_url"
      );

      postsUrl.searchParams.set(
        "limit",
        String(
          Math.min(
            request.pageSize,
            100
          )
        )
      );

      postsUrl.searchParams.set(
        "access_token",
        dependencies.accessToken
      );

      if (request.cursor) {
        postsUrl.searchParams.set(
          "after",
          request.cursor
        );
      }

      const postsPayload =
        await fetchPosterBrainOfficialApiJson({
          url:
            postsUrl.toString(),

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
          postsPayload
        );

      if (root === null) {
        throw new PosterBrainContentApiProviderError({
          code:
            "invalid_response",

          retryable:
            false,

          message:
            "Facebook Pages API returned invalid post data.",
        });
      }

      const items:
        PosterBrainContentApiProviderItem[] =
        [];

      for (
        const raw
        of array(
          root["data"]
        )
      ) {
        const post =
          record(
            raw
          );

        const postId =
          text(
            post?.["id"]
          );

        const body =
          text(
            post?.["message"]
          );

        const permalink =
          text(
            post?.["permalink_url"]
          );

        if (
          postId === null ||
          body === null ||
          permalink === null
        ) {
          continue;
        }

        items.push({
          externalContentId:
            `facebook:${postId}`,

          contentKind:
            "other",

          title:
            bounded(
              body,
              140
            ),

          excerpt:
            bounded(
              body,
              500
            ),

          originalUrl:
            permalink,

          thumbnailUrl:
            null,

          imageUrl:
            null,

          publisherName:
            pageName,

          sourceExternalId:
            pageId,

          sourceName:
            pageName,

          sourceUrl:
            pageLink,

          languageCode:
            "en",

          regionCode:
            request.regionCode,

          publishedAt:
            text(
              post?.["created_time"]
            ),

          durationSeconds:
            null,

          tags:
            [],

          topics:
            [],

          metadata: {
            postId,
            pageId,
          },
        });
      }

      const paging =
        record(
          root["paging"]
        );

      const cursors =
        record(
          paging?.["cursors"]
        );

      return {
        items,

        nextCursor:
          text(
            cursors?.["after"]
          ),

        quota:
          null,
      };
    },
  };
}