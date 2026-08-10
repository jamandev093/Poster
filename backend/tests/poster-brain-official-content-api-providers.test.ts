import {
  describe,
  expect,
  it,
} from "vitest";

import {
  createPosterBrainContentApiProviderRegistryService,
  createPosterBrainNasaImagesContentApiProvider,
  createPosterBrainOfficialContentApiProvidersFromRuntimeEnv,
  createPosterBrainYouTubeContentApiProvider,
  fetchPosterBrainOfficialApiJson,
} from "../src/application/poster-brain/index.js";

import type {
  PosterBrainOfficialApiHttpFetch,
} from "../src/application/poster-brain/official-content-api-http.js";

function response(
  payload:
    unknown,

  status:
    number = 200
) {
  return {
    ok:
      status >= 200 &&
      status < 300,

    status,

    async json() {
      return payload;
    },
  };
}

describe(
  "Poster Brain official content API providers",
  () => {

    it(
      "discovers YouTube videos as metadata-only records and enriches tags and duration",
      async () => {
        const urls:
          string[] =
          [];

        const fetchImplementation:
          PosterBrainOfficialApiHttpFetch =
          async (
            rawUrl
          ) => {
            urls.push(
              rawUrl
            );

            const url =
              new URL(
                rawUrl
              );

            if (
              url.pathname.endsWith(
                "/search"
              )
            ) {
              expect(
                url.searchParams.get(
                  "q"
                )
              ).toBe(
                "quantum physics"
              );

              expect(
                url.searchParams.get(
                  "type"
                )
              ).toBe(
                "video"
              );

              expect(
                url.searchParams.get(
                  "relevanceLanguage"
                )
              ).toBe(
                "en"
              );

              return response({
                nextPageToken:
                  "NEXT",

                items: [
                  {
                    id: {
                      videoId:
                        "abc123",
                    },

                    snippet: {
                      publishedAt:
                        "2026-08-10T10:00:00Z",

                      channelId:
                        "channel-1",

                      title:
                        "Quantum Physics Explained",

                      description:
                        "An educational physics video.",

                      channelTitle:
                        "Science Channel",

                      thumbnails: {
                        high: {
                          url:
                            "https://img.youtube.com/example.jpg",
                        },
                      },

                      liveBroadcastContent:
                        "none",
                    },
                  },
                ],
              });
            }

            expect(
              url.pathname.endsWith(
                "/videos"
              )
            ).toBe(
              true
            );

            expect(
              url.searchParams.get(
                "id"
              )
            ).toBe(
              "abc123"
            );

            return response({
              items: [
                {
                  id:
                    "abc123",

                  snippet: {
                    publishedAt:
                      "2026-08-10T10:00:00Z",

                    channelId:
                      "channel-1",

                    title:
                      "Quantum Physics Explained",

                    description:
                      "An educational physics video.",

                    channelTitle:
                      "Science Channel",

                    tags: [
                      "physics",
                      "quantum mechanics",
                    ],

                    categoryId:
                      "27",

                    defaultAudioLanguage:
                      "en",
                  },

                  contentDetails: {
                    duration:
                      "PT12M30S",
                  },
                },
              ],
            });
          };

        const provider =
          createPosterBrainYouTubeContentApiProvider({
            apiKey:
              "test-key",

            fetchImplementation,
          });

        const registry =
          createPosterBrainContentApiProviderRegistryService({
            providers: [
              provider,
            ],

            environment: {
              YOUTUBE_API_KEY:
                "test-key",
            },
          });

        const result =
          await registry.execute({
            providerKey:
              "youtube",

            query:
              "quantum physics",

            languageCode:
              "en",

            regionCode:
              "US",

            pageSize:
              25,
          });

        expect(
          result.status
        ).toBe(
          "succeeded"
        );

        expect(
          urls
        ).toHaveLength(
          2
        );

        expect(
          result.nextCursor
        ).toBe(
          "NEXT"
        );

        expect(
          result.items
        ).toHaveLength(
          1
        );

        expect(
          result.items[0]
        ).toMatchObject({
          externalContentId:
            "youtube:abc123",

          contentKind:
            "video",

          title:
            "Quantum Physics Explained",

          originalUrl:
            "https://www.youtube.com/watch?v=abc123",

          thumbnailUrl:
            "https://img.youtube.com/example.jpg",

          imageUrl:
            null,

          publisherName:
            "Science Channel",

          durationSeconds:
            750,

          tags: [
            "physics",
            "quantum mechanics",
          ],
        });

        expect(
          JSON.stringify(
            result.items[0]
              ?.metadata
          )
        ).not.toMatch(
          /playback|stream|videoUrl|mediaUrl|embed/i
        );
      }
    );

    it(
      "supports latest-video acquisition from an official YouTube channel id",
      async () => {
        const fetchImplementation:
          PosterBrainOfficialApiHttpFetch =
          async (
            rawUrl
          ) => {
            const url =
              new URL(
                rawUrl
              );

            if (
              url.pathname.endsWith(
                "/search"
              )
            ) {
              expect(
                url.searchParams.get(
                  "channelId"
                )
              ).toBe(
                "official-channel"
              );

              expect(
                url.searchParams.get(
                  "order"
                )
              ).toBe(
                "date"
              );

              return response({
                items:
                  [],
              });
            }

            return response({
              items:
                [],
            });
          };

        const provider =
          createPosterBrainYouTubeContentApiProvider({
            apiKey:
              "test-key",

            fetchImplementation,
          });

        await provider.fetchPage({
          query:
            null,

          sourceExternalId:
            "official-channel",

          cursor:
            null,

          pageSize:
            25,

          languageCode:
            "en",

          regionCode:
            null,

          signal:
            new AbortController()
              .signal,
        });
      }
    );

    it(
      "maps NASA Image and Video Library results to NASA details pages without media playback assets",
      async () => {
        const fetchImplementation:
          PosterBrainOfficialApiHttpFetch =
          async (
            rawUrl
          ) => {
            const url =
              new URL(
                rawUrl
              );

            expect(
              url.hostname
            ).toBe(
              "images-api.nasa.gov"
            );

            expect(
              url.searchParams.get(
                "q"
              )
            ).toBe(
              "exoplanet"
            );

            expect(
              url.searchParams.get(
                "media_type"
              )
            ).toBe(
              "image,video"
            );

            return response({
              collection: {
                links: [
                  {
                    rel:
                      "next",

                    href:
                      "https://images-api.nasa.gov/search?q=exoplanet&page=2",
                  },
                ],

                items: [
                  {
                    data: [
                      {
                        nasa_id:
                          "PIA12345",

                        title:
                          "Exoplanet Illustration",

                        description:
                          "Artist illustration of an exoplanet.",

                        media_type:
                          "image",

                        center:
                          "JPL",

                        date_created:
                          "2026-08-10T10:00:00Z",

                        keywords: [
                          "exoplanet",
                          "astronomy",
                        ],

                        photographer:
                          "NASA/JPL",
                      },
                    ],

                    links: [
                      {
                        href:
                          "https://images-assets.nasa.gov/image/preview.jpg",

                        render:
                          "image",
                      },
                    ],
                  },

                  {
                    data: [
                      {
                        nasa_id:
                          "VID123",

                        title:
                          "Space Telescope Mission",

                        description:
                          "Mission overview video metadata.",

                        media_type:
                          "video",

                        center:
                          "GSFC",

                        date_created:
                          "2026-08-09T10:00:00Z",

                        keywords: [
                          "telescope",
                          "space",
                        ],
                      },
                    ],

                    links: [
                      {
                        href:
                          "https://images-assets.nasa.gov/video/thumb.jpg",

                        render:
                          "image",
                      },
                    ],
                  },
                ],
              },
            });
          };

        const provider =
          createPosterBrainNasaImagesContentApiProvider({
            fetchImplementation,
          });

        const registry =
          createPosterBrainContentApiProviderRegistryService({
            providers: [
              provider,
            ],

            environment:
              {},
          });

        const result =
          await registry.execute({
            providerKey:
              "nasa-images",

            query:
              "exoplanet",

            pageSize:
              50,
          });

        expect(
          result.status
        ).toBe(
          "succeeded"
        );

        expect(
          result.nextCursor
        ).toBe(
          "2"
        );

        expect(
          result.items
        ).toHaveLength(
          2
        );

        expect(
          result.items[0]
        ).toMatchObject({
          externalContentId:
            "nasa-images:PIA12345",

          contentKind:
            "image",

          originalUrl:
            "https://images.nasa.gov/details/PIA12345",

          publisherName:
            "NASA",

          sourceName:
            "NASA JPL",

          languageCode:
            "en",
        });

        expect(
          result.items[1]
        ).toMatchObject({
          externalContentId:
            "nasa-images:VID123",

          contentKind:
            "video",

          originalUrl:
            "https://images.nasa.gov/details/VID123",

          imageUrl:
            null,

          thumbnailUrl:
            "https://images-assets.nasa.gov/video/thumb.jpg",
        });

        expect(
          JSON.stringify(
            result.items[1]
              ?.metadata
          )
        ).not.toMatch(
          /playback|stream|download|mediaUrl|videoUrl|embed/i
        );
      }
    );

    it(
      "keeps YouTube disabled-safe without credentials while NASA remains a public official provider",
      async () => {
        const fetchImplementation:
          PosterBrainOfficialApiHttpFetch =
          async () =>
            response({
              collection: {
                items:
                  [],
                links:
                  [],
              },
            });

        const providers =
          createPosterBrainOfficialContentApiProvidersFromRuntimeEnv({
            environment:
              {},

            fetchImplementation,
          });

        expect(
          providers.map(
            provider =>
              provider.providerKey
          )
        ).toEqual(
          expect.arrayContaining([
            "youtube",
            "nasa-images",
            "x",
            "facebook-pages",
          ])
        );

        const registry =
          createPosterBrainContentApiProviderRegistryService({
            providers,

            environment:
              {},
          });

        const youtube =
          await registry.execute({
            providerKey:
              "youtube",

            query:
              "science",
          });

        expect(
          youtube.status
        ).toBe(
          "disabled"
        );

        expect(
          youtube.reason
        ).toBe(
          "missing_credentials:YOUTUBE_API_KEY"
        );

        const nasa =
          await registry.execute({
            providerKey:
              "nasa-images",

            query:
              "space",
          });

        expect(
          nasa.status
        ).toBe(
          "succeeded"
        );
      }
    );

    it(
      "maps YouTube quota exhaustion as a permanent provider result",
      async () => {
        const fetchImplementation:
          PosterBrainOfficialApiHttpFetch =
          async () =>
            response(
              {
                error: {
                  errors: [
                    {
                      reason:
                        "quotaExceeded",
                    },
                  ],
                },
              },
              403
            );

        const provider =
          createPosterBrainYouTubeContentApiProvider({
            apiKey:
              "test-key",

            fetchImplementation,
          });

        const registry =
          createPosterBrainContentApiProviderRegistryService({
            providers: [
              provider,
            ],

            environment: {
              YOUTUBE_API_KEY:
                "test-key",
            },
          });

        const result =
          await registry.execute({
            providerKey:
              "youtube",

            query:
              "science",
          });

        expect(
          result.status
        ).toBe(
          "failed"
        );

        expect(
          result.reason
        ).toBe(
          "quota_exhausted"
        );

        expect(
          result.attempts
        ).toBe(
          1
        );
      }
    );

    it(
      "maps transient official API rate limits into the existing bounded retry contract",
      async () => {
        const delays:
          number[] =
          [];

        let attempts =
          0;

        const fetchImplementation:
          PosterBrainOfficialApiHttpFetch =
          async () => {
            attempts +=
              1;

            if (
              attempts ===
              1
            ) {
              return response(
                {},
                429
              );
            }

            return response({
              collection: {
                items:
                  [],
                links:
                  [],
              },
            });
          };

        const provider =
          createPosterBrainNasaImagesContentApiProvider({
            fetchImplementation,
          });

        const registry =
          createPosterBrainContentApiProviderRegistryService({
            providers: [
              provider,
            ],

            environment:
              {},

            retryDelayMs:
              5,

            sleep:
              async milliseconds => {
                delays.push(
                  milliseconds
                );
              },
          });

        const result =
          await registry.execute({
            providerKey:
              "nasa-images",

            query:
              "astronomy",
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
          delays
        ).toEqual([
          5,
        ]);
      }
    );

    it(
      "rejects successful official API responses that are not valid JSON",
      async () => {
        await expect(
          fetchPosterBrainOfficialApiJson({
            url:
              "https://example.test/api",

            signal:
              new AbortController()
                .signal,

            fetchImplementation:
              async () => ({
                ok:
                  true,

                status:
                  200,

                async json() {
                  throw new Error(
                    "invalid json"
                  );
                },
              }),
          })
        ).rejects.toMatchObject({
          code:
            "invalid_response",
        });
      }
    );
  }
);