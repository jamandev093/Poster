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

export interface PosterBrainYouTubeContentApiProviderDependencies {
  readonly apiKey:
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
        typeof item === "string"
    )
    .map(
      item =>
        item.trim()
    )
    .filter(
      item =>
        item.length > 0
    );
}

function thumbnail(
  snippet:
    Record<string, unknown>
): string | null {
  const thumbnails =
    record(
      snippet["thumbnails"]
    );

  for (const size of [
    "maxres",
    "standard",
    "high",
    "medium",
    "default",
  ]) {
    const candidate =
      record(
        thumbnails?.[size]
      );

    const url =
      text(
        candidate?.["url"]
      );

    if (url !== null) {
      return url;
    }
  }

  return null;
}

function parseDurationSeconds(
  value:
    string | null
): number | null {
  if (value === null) {
    return null;
  }

  const match =
    /^P(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+(?:\.\d+)?)S)?)?$/
      .exec(
        value
      );

  if (match === null) {
    return null;
  }

  const days =
    Number(
      match[1] ??
      0
    );

  const hours =
    Number(
      match[2] ??
      0
    );

  const minutes =
    Number(
      match[3] ??
      0
    );

  const seconds =
    Number(
      match[4] ??
      0
    );

  const total =
    (
      days *
      86400
    ) +
    (
      hours *
      3600
    ) +
    (
      minutes *
      60
    ) +
    seconds;

  return Number.isFinite(total)
    ? total
    : null;
}

function language(
  videoSnippet:
    Record<string, unknown> | null
): string {
  return (
    text(
      videoSnippet?.["defaultAudioLanguage"]
    ) ??
    text(
      videoSnippet?.["defaultLanguage"]
    ) ??
    "en"
  );
}

export function createPosterBrainYouTubeContentApiProvider(
  dependencies:
    PosterBrainYouTubeContentApiProviderDependencies
): PosterBrainContentApiProvider {
  return {
    providerKey:
      "youtube",

    displayName:
      "YouTube Data API",

    capabilities: {
      metadataOnly:
        true,

      providerClass:
        "official",

      supportedContentKinds: [
        "video",
      ],

      requiredEnvironmentKeys: [
        "YOUTUBE_API_KEY",
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

      const sourceExternalId =
        request.sourceExternalId?.trim() ??
        "";

      if (
        !query &&
        !sourceExternalId
      ) {
        throw new PosterBrainContentApiProviderError({
          code:
            "invalid_response",

          retryable:
            false,

          message:
            "YouTube acquisition requires a search query or channel ID.",
        });
      }

      const searchUrl =
        new URL(
          "https://www.googleapis.com/youtube/v3/search"
        );

      searchUrl.searchParams.set(
        "part",
        "snippet"
      );

      searchUrl.searchParams.set(
        "type",
        "video"
      );

      searchUrl.searchParams.set(
        "maxResults",
        String(
          Math.min(
            request.pageSize,
            50
          )
        )
      );

      searchUrl.searchParams.set(
        "relevanceLanguage",
        "en"
      );

      searchUrl.searchParams.set(
        "key",
        dependencies.apiKey
      );

      if (query) {
        searchUrl.searchParams.set(
          "q",
          query
        );
      }

      if (sourceExternalId) {
        searchUrl.searchParams.set(
          "channelId",
          sourceExternalId
        );

        searchUrl.searchParams.set(
          "order",
          "date"
        );
      }

      if (request.cursor) {
        searchUrl.searchParams.set(
          "pageToken",
          request.cursor
        );
      }

      if (request.regionCode) {
        searchUrl.searchParams.set(
          "regionCode",
          request.regionCode
        );
      }

      const searchPayload =
        await fetchPosterBrainOfficialApiJson({
          url:
            searchUrl.toString(),

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

      const searchRoot =
        record(
          searchPayload
        );

      if (searchRoot === null) {
        throw new PosterBrainContentApiProviderError({
          code:
            "invalid_response",

          retryable:
            false,

          message:
            "YouTube search returned an invalid response.",
        });
      }

      const searchItems =
        array(
          searchRoot["items"]
        );

      const ids =
        searchItems
          .map(
            item => {
              const itemRecord =
                record(
                  item
                );

              const id =
                record(
                  itemRecord?.["id"]
                );

              return text(
                id?.["videoId"]
              );
            }
          )
          .filter(
            (
              value
            ): value is string =>
              value !== null
          );

      const detailById =
        new Map<
          string,
          Record<string, unknown>
        >();

      if (
        ids.length >
        0
      ) {
        const videosUrl =
          new URL(
            "https://www.googleapis.com/youtube/v3/videos"
          );

        videosUrl.searchParams.set(
          "part",
          "snippet,contentDetails"
        );

        videosUrl.searchParams.set(
          "id",
          ids.join(",")
        );

        videosUrl.searchParams.set(
          "key",
          dependencies.apiKey
        );

        const detailsPayload =
          await fetchPosterBrainOfficialApiJson({
            url:
              videosUrl.toString(),

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

        const detailsRoot =
          record(
            detailsPayload
          );

        if (detailsRoot === null) {
          throw new PosterBrainContentApiProviderError({
            code:
              "invalid_response",

            retryable:
              false,

            message:
              "YouTube video metadata returned an invalid response.",
          });
        }

        for (
          const raw
          of array(
            detailsRoot["items"]
          )
        ) {
          const detail =
            record(
              raw
            );

          const id =
            text(
              detail?.["id"]
            );

          if (
            detail !== null &&
            id !== null
          ) {
            detailById.set(
              id,
              detail
            );
          }
        }
      }

      const items:
        PosterBrainContentApiProviderItem[] =
        [];

      for (
        const raw
        of searchItems
      ) {
        const searchItem =
          record(
            raw
          );

        const idRecord =
          record(
            searchItem?.["id"]
          );

        const videoId =
          text(
            idRecord?.["videoId"]
          );

        const searchSnippet =
          record(
            searchItem?.["snippet"]
          );

        if (
          videoId === null ||
          searchSnippet === null
        ) {
          continue;
        }

        const detail =
          detailById.get(
            videoId
          ) ??
          null;

        const videoSnippet =
          record(
            detail?.["snippet"]
          );

        const contentDetails =
          record(
            detail?.["contentDetails"]
          );

        const channelId =
          text(
            videoSnippet?.["channelId"]
          ) ??
          text(
            searchSnippet["channelId"]
          );

        const channelTitle =
          text(
            videoSnippet?.["channelTitle"]
          ) ??
          text(
            searchSnippet["channelTitle"]
          ) ??
          "YouTube";

        const title =
          text(
            videoSnippet?.["title"]
          ) ??
          text(
            searchSnippet["title"]
          );

        if (title === null) {
          continue;
        }

        const description =
          text(
            videoSnippet?.["description"]
          ) ??
          text(
            searchSnippet["description"]
          ) ??
          "";

        items.push({
          externalContentId:
            `youtube:${videoId}`,

          contentKind:
            "video",

          title,

          excerpt:
            description,

          originalUrl:
            `https://www.youtube.com/watch?v=${encodeURIComponent(videoId)}`,

          thumbnailUrl:
            videoSnippet === null
              ? thumbnail(
                  searchSnippet
                )
              : (
                  thumbnail(
                    videoSnippet
                  ) ??
                  thumbnail(
                    searchSnippet
                  )
                ),

          imageUrl:
            null,

          publisherName:
            channelTitle,

          sourceExternalId:
            channelId,

          sourceName:
            channelTitle,

          sourceUrl:
            channelId === null
              ? null
              : `https://www.youtube.com/channel/${encodeURIComponent(channelId)}`,

          languageCode:
            language(
              videoSnippet
            ),

          regionCode:
            request.regionCode,

          publishedAt:
            text(
              videoSnippet?.["publishedAt"]
            ) ??
            text(
              searchSnippet["publishedAt"]
            ),

          durationSeconds:
            parseDurationSeconds(
              text(
                contentDetails?.["duration"]
              )
            ),

          tags:
            strings(
              videoSnippet?.["tags"]
            ),

          topics:
            [],

          metadata: {
            videoId,

            channelId,

            categoryId:
              text(
                videoSnippet?.["categoryId"]
              ),

            liveBroadcastContent:
              text(
                searchSnippet[
                  "liveBroadcastContent"
                ]
              ),
          },
        });
      }

      return {
        items,

        nextCursor:
          text(
            searchRoot[
              "nextPageToken"
            ]
          ),

        quota:
          null,
      };
    },
  };
}