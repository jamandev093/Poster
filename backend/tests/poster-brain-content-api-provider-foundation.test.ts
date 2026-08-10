import {
  describe,
  expect,
  it,
} from "vitest";

import {
  PosterBrainContentApiProviderError,
  createPosterBrainContentApiProviderRegistryService,
} from "../src/application/poster-brain/content-api-provider-registry.service.js";

import type {
  PosterBrainContentApiProvider,
  PosterBrainContentApiProviderItem,
} from "../src/application/poster-brain/content-api-provider.types.js";

function item(input?: {
  readonly languageCode?:
    string;

  readonly metadata?:
    Readonly<Record<string, unknown>>;

  readonly contentKind?:
    "article" | "video";
}): PosterBrainContentApiProviderItem {
  return {
    externalContentId:
      "item-1",

    contentKind:
      input?.contentKind ??
      "article",

    title:
      "NASA discovers a new exoplanet",

    excerpt:
      "Scientists report a new world orbiting a distant star.",

    originalUrl:
      "https://example.com/original/story",

    thumbnailUrl:
      "https://example.com/images/thumb.jpg",

    imageUrl:
      null,

    publisherName:
      "Example Science",

    sourceExternalId:
      "source-1",

    sourceName:
      "Example Science",

    sourceUrl:
      "https://example.com",

    languageCode:
      input?.languageCode ??
      "en",

    regionCode:
      "US",

    publishedAt:
      "2026-08-10T10:00:00.000Z",

    durationSeconds:
      input?.contentKind === "video"
        ? 240
        : null,

    tags: [
      "NASA",
      "space",
    ],

    topics: [
      "Space & Astronomy",
    ],

    metadata:
      input?.metadata ??
      {
        channelId:
          "channel-1",
      },
  };
}

function provider(input?: {
  readonly requiredEnvironmentKeys?:
    readonly string[];

  readonly fetchPage?:
    PosterBrainContentApiProvider["fetchPage"];
}): PosterBrainContentApiProvider {
  return {
    providerKey:
      "example-api",

    displayName:
      "Example API",

    capabilities: {
      metadataOnly:
        true,

      providerClass:
        "official",

      supportedContentKinds: [
        "article",
        "video",
      ],

      requiredEnvironmentKeys:
        input?.requiredEnvironmentKeys ??
        [],

      supportsCursorPagination:
        true,

      supportsQuotaMetadata:
        true,

      maxPageSize:
        50,
    },

    fetchPage:
      input?.fetchPage ??
      (
        async () => ({
          items: [
            item(),
          ],

          nextCursor:
            null,

          quota:
            null,
        })
      ),
  };
}

describe(
  "Poster Brain content API provider foundation",
  () => {

    it(
      "stays disabled-safe when required credentials are absent",
      async () => {
        let called =
          false;

        const service =
          createPosterBrainContentApiProviderRegistryService({
            providers: [
              provider({
                requiredEnvironmentKeys: [
                  "EXAMPLE_API_KEY",
                ],

                fetchPage:
                  async () => {
                    called =
                      true;

                    throw new Error(
                      "must not execute"
                    );
                  },
              }),
            ],

            environment:
              {},
          });

        const result =
          await service.execute({
            providerKey:
              "example-api",
          });

        expect(
          result.status
        ).toBe(
          "disabled"
        );

        expect(
          result.health
        ).toBe(
          "disabled"
        );

        expect(
          result.reason
        ).toBe(
          "missing_credentials:EXAMPLE_API_KEY"
        );

        expect(
          result.attempts
        ).toBe(
          0
        );

        expect(
          called
        ).toBe(
          false
        );
      }
    );

    it(
      "enforces English-first acquisition and preserves pagination and quota",
      async () => {
        let request:
          Parameters<
            PosterBrainContentApiProvider["fetchPage"]
          >[0] |
          null =
          null;

        const service =
          createPosterBrainContentApiProviderRegistryService({
            providers: [
              provider({
                fetchPage:
                  async input => {
                    request =
                      input;

                    return {
                      items: [
                        item({
                          languageCode:
                            "en-US",
                        }),

                        item({
                          languageCode:
                            "fr",
                        }),
                      ],

                      nextCursor:
                        "page-2",

                      quota: {
                        limit:
                          10000,

                        remaining:
                          9999,

                        resetAt:
                          "2026-08-11T00:00:00.000Z",
                      },
                    };
                  },
              }),
            ],

            environment:
              {},
          });

        const result =
          await service.execute({
            providerKey:
              "example-api",

            query:
              "space research",

            pageSize:
              100,

            languageCode:
              "en",

            regionCode:
              "in",
          });

        expect(
          request
        ).toMatchObject({
          query:
            "space research",

          pageSize:
            50,

          languageCode:
            "en",

          regionCode:
            "IN",
        });

        expect(
          result.status
        ).toBe(
          "succeeded"
        );

        expect(
          result.items
        ).toHaveLength(
          1
        );

        expect(
          result.items[0]
            ?.languageCode
        ).toBe(
          "en"
        );

        expect(
          result.droppedNonEnglishItems
        ).toBe(
          1
        );

        expect(
          result.nextCursor
        ).toBe(
          "page-2"
        );

        expect(
          result.quota
        ).toMatchObject({
          limit:
            10000,

          remaining:
            9999,
        });
      }
    );

    it(
      "allows video discovery metadata but rejects playback or stream assets",
      async () => {
        const safe =
          createPosterBrainContentApiProviderRegistryService({
            providers: [
              provider({
                fetchPage:
                  async () => ({
                    items: [
                      item({
                        contentKind:
                          "video",

                        metadata: {
                          channelId:
                            "channel-1",

                          viewCount:
                            123,
                        },
                      }),
                    ],

                    nextCursor:
                      null,

                    quota:
                      null,
                  }),
              }),
            ],

            environment:
              {},
          });

        const safeResult =
          await safe.execute({
            providerKey:
              "example-api",
          });

        expect(
          safeResult.status
        ).toBe(
          "succeeded"
        );

        expect(
          safeResult.items[0]
            ?.contentKind
        ).toBe(
          "video"
        );

        expect(
          safeResult.items[0]
            ?.originalUrl
        ).toBe(
          "https://example.com/original/story"
        );

        const unsafe =
          createPosterBrainContentApiProviderRegistryService({
            providers: [
              provider({
                fetchPage:
                  async () => ({
                    items: [
                      item({
                        contentKind:
                          "video",

                        metadata: {
                          playbackUrl:
                            "https://cdn.example.com/video.mp4",
                        },
                      }),
                    ],

                    nextCursor:
                      null,

                    quota:
                      null,
                  }),
              }),
            ],

            environment:
              {},
          });

        const unsafeResult =
          await unsafe.execute({
            providerKey:
              "example-api",
          });

        expect(
          unsafeResult.status
        ).toBe(
          "failed"
        );

        expect(
          unsafeResult.reason
        ).toBe(
          "invalid_response"
        );

        expect(
          unsafeResult.items
        ).toEqual(
          []
        );
      }
    );

    it(
      "retries bounded transient provider failures",
      async () => {
        let attempts =
          0;

        const delays:
          number[] =
          [];

        const service =
          createPosterBrainContentApiProviderRegistryService({
            providers: [
              provider({
                fetchPage:
                  async () => {
                    attempts +=
                      1;

                    if (
                      attempts ===
                      1
                    ) {
                      throw new PosterBrainContentApiProviderError({
                        code:
                          "rate_limited",

                        retryable:
                          true,

                        message:
                          "retry",
                      });
                    }

                    return {
                      items: [
                        item(),
                      ],

                      nextCursor:
                        null,

                      quota:
                        null,
                    };
                  },
              }),
            ],

            environment:
              {},

            maxAttempts:
              3,

            retryDelayMs:
              10,

            sleep:
              async delay => {
                delays.push(
                  delay
                );
              },
          });

        const result =
          await service.execute({
            providerKey:
              "example-api",
          });

        expect(
          result.status
        ).toBe(
          "succeeded"
        );

        expect(
          result.attempts
        ).toBe(
          2
        );

        expect(
          attempts
        ).toBe(
          2
        );

        expect(
          delays
        ).toEqual([
          10,
        ]);
      }
    );

    it(
      "does not retry permanent authentication or response errors",
      async () => {
        let attempts =
          0;

        const service =
          createPosterBrainContentApiProviderRegistryService({
            providers: [
              provider({
                fetchPage:
                  async () => {
                    attempts +=
                      1;

                    throw new PosterBrainContentApiProviderError({
                      code:
                        "authentication_failed",

                      retryable:
                        false,

                      message:
                        "invalid API key",
                    });
                  },
              }),
            ],

            environment:
              {},
          });

        const result =
          await service.execute({
            providerKey:
              "example-api",
          });

        expect(
          result.status
        ).toBe(
          "failed"
        );

        expect(
          result.health
        ).toBe(
          "degraded"
        );

        expect(
          result.reason
        ).toBe(
          "authentication_failed"
        );

        expect(
          attempts
        ).toBe(
          1
        );
      }
    );

    it(
      "rejects non-English acquisition requests for Poster v1",
      async () => {
        const service =
          createPosterBrainContentApiProviderRegistryService({
            providers: [
              provider(),
            ],

            environment:
              {},
          });

        await expect(
          service.execute({
            providerKey:
              "example-api",

            languageCode:
              "fr",
          })
        ).rejects.toThrow(
          "English-only"
        );
      }
    );

    it(
      "rejects duplicate provider keys",
      () => {
        expect(
          () =>
            createPosterBrainContentApiProviderRegistryService({
              providers: [
                provider(),
                provider(),
              ],

              environment:
                {},
            })
        ).toThrow(
          "Duplicate Poster Brain API provider"
        );
      }
    );
  }
);