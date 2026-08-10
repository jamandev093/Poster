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

export interface PosterBrainXContentApiProviderDependencies {
  readonly bearerToken:
    string;

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

function hashtags(
  entities:
    unknown
): readonly string[] {
  const entityRecord =
    record(
      entities
    );

  const values =
    array(
      entityRecord?.["hashtags"]
    );

  const seen =
    new Set<string>();

  const output:
    string[] =
    [];

  for (const raw of values) {
    const item =
      record(
        raw
      );

    const tag =
      text(
        item?.["tag"]
      );

    if (tag === null) {
      continue;
    }

    const key =
      tag.toLowerCase();

    if (seen.has(key)) {
      continue;
    }

    seen.add(key);

    output.push(
      tag
    );
  }

  return output;
}

export function createPosterBrainXContentApiProvider(
  dependencies:
    PosterBrainXContentApiProviderDependencies
): PosterBrainContentApiProvider {
  return {
    providerKey:
      "x",

    displayName:
      "X API",

    capabilities: {
      metadataOnly:
        true,

      providerClass:
        "official",

      supportedContentKinds: [
        "other",
      ],

      requiredEnvironmentKeys: [
        "X_BEARER_TOKEN",
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

      const userId =
        request.sourceExternalId?.trim() ??
        "";

      if (
        !query &&
        !userId
      ) {
        throw new PosterBrainContentApiProviderError({
          code:
            "invalid_response",

          retryable:
            false,

          message:
            "X acquisition requires a query or official user ID.",
        });
      }

      const url =
        userId
          ? new URL(
              `https://api.x.com/2/users/${encodeURIComponent(userId)}/tweets`
            )
          : new URL(
              "https://api.x.com/2/tweets/search/recent"
            );

      const minimumPageSize =
        userId
          ? 5
          : 10;

      url.searchParams.set(
        "max_results",
        String(
          Math.max(
            minimumPageSize,
            Math.min(
              request.pageSize,
              100
            )
          )
        )
      );

      url.searchParams.set(
        "post.fields",
        "id,text,created_at,lang,author_id,entities"
      );

      url.searchParams.set(
        "expansions",
        "author_id"
      );

      url.searchParams.set(
        "user.fields",
        "id,name,username"
      );

      if (!userId) {
        url.searchParams.set(
          "query",
          `${query} lang:en`
        );
      }

      if (request.cursor) {
        url.searchParams.set(
          "pagination_token",
          request.cursor
        );
      }

      const payload =
        await fetchPosterBrainOfficialApiJson({
          url:
            url.toString(),

          signal:
            request.signal,

          headers: {
            authorization:
              `Bearer ${dependencies.bearerToken}`,
          },

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

      if (root === null) {
        throw new PosterBrainContentApiProviderError({
          code:
            "invalid_response",

          retryable:
            false,

          message:
            "X API returned an invalid response.",
        });
      }

      const users =
        new Map<
          string,
          {
            readonly name:
              string;

            readonly username:
              string;
          }
        >();

      const includes =
        record(
          root["includes"]
        );

      for (
        const raw
        of array(
          includes?.["users"]
        )
      ) {
        const user =
          record(
            raw
          );

        const id =
          text(
            user?.["id"]
          );

        const name =
          text(
            user?.["name"]
          );

        const username =
          text(
            user?.["username"]
          );

        if (
          id !== null &&
          name !== null &&
          username !== null
        ) {
          users.set(
            id,
            {
              name,
              username,
            }
          );
        }
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
            post?.["text"]
          );

        if (
          postId === null ||
          body === null
        ) {
          continue;
        }

        const authorId =
          text(
            post?.["author_id"]
          );

        const author =
          authorId === null
            ? undefined
            : users.get(
                authorId
              );

        const username =
          author?.username ??
          null;

        const publisherName =
          author?.name ??
          (
            username === null
              ? "X"
              : `@${username}`
          );

        const title =
          bounded(
            body,
            140
          );

        const excerpt =
          bounded(
            body,
            500
          );

        items.push({
          externalContentId:
            `x:${postId}`,

          contentKind:
            "other",

          title,

          excerpt,

          originalUrl:
            username === null
              ? `https://x.com/i/web/status/${encodeURIComponent(postId)}`
              : `https://x.com/${encodeURIComponent(username)}/status/${encodeURIComponent(postId)}`,

          thumbnailUrl:
            null,

          imageUrl:
            null,

          publisherName,

          sourceExternalId:
            authorId,

          sourceName:
            publisherName,

          sourceUrl:
            username === null
              ? null
              : `https://x.com/${encodeURIComponent(username)}`,

          languageCode:
            text(
              post?.["lang"]
            ) ??
            "en",

          regionCode:
            request.regionCode,

          publishedAt:
            text(
              post?.["created_at"]
            ),

          durationSeconds:
            null,

          tags:
            hashtags(
              post?.["entities"]
            ),

          topics:
            [],

          metadata: {
            postId,
            authorId,
            username,
          },
        });
      }

      const meta =
        record(
          root["meta"]
        );

      return {
        items,

        nextCursor:
          text(
            meta?.["next_token"]
          ),

        quota:
          null,
      };
    },
  };
}