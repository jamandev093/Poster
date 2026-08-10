import {
  describe,
  expect,
  it,
} from "vitest";

import {
  POSTER_BRAIN_OFFICIAL_CONTENT_API_PROVIDER_CATALOG,
  createPosterBrainContentApiProviderRegistryService,
  createPosterBrainFacebookPagesContentApiProvider,
  createPosterBrainOfficialContentApiProvidersFromRuntimeEnv,
  createPosterBrainXContentApiProvider,
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
  "Poster Brain access-gated official content API providers",
  () => {

    it(
      "maps X recent-search posts to bounded metadata-only discovery records",
      async () => {
        const fetchImplementation:
          PosterBrainOfficialApiHttpFetch =
          async (
            rawUrl,
            request
          ) => {
            const url =
              new URL(
                rawUrl
              );

            expect(
              url.pathname
            ).toBe(
              "/2/tweets/search/recent"
            );

            expect(
              url.searchParams.get(
                "query"
              )
            ).toBe(
              "space science lang:en"
            );

            expect(
              url.searchParams.get(
                "max_results"
              )
            ).toBe(
              "25"
            );

            expect(
              request.headers[
                "authorization"
              ]
            ).toBe(
              "Bearer x-token"
            );

            return response({
              data: [
                {
                  id:
                    "12345",

                  text:
                    "NASA shares a new exoplanet discovery from deep-space observations.",

                  author_id:
                    "user-1",

                  created_at:
                    "2026-08-10T10:00:00.000Z",

                  lang:
                    "en",

                  entities: {
                    hashtags: [
                      {
                        tag:
                          "NASA",
                      },

                      {
                        tag:
                          "Astronomy",
                      },
                    ],
                  },
                },
              ],

              includes: {
                users: [
                  {
                    id:
                      "user-1",

                    name:
                      "NASA",

                    username:
                      "NASA",
                  },
                ],
              },

              meta: {
                next_token:
                  "NEXT-X",
              },
            });
          };

        const provider =
          createPosterBrainXContentApiProvider({
            bearerToken:
              "x-token",

            fetchImplementation,
          });

        const registry =
          createPosterBrainContentApiProviderRegistryService({
            providers: [
              provider,
            ],

            environment: {
              X_BEARER_TOKEN:
                "x-token",
            },
          });

        const result =
          await registry.execute({
            providerKey:
              "x",

            query:
              "space science",

            pageSize:
              25,
          });

        expect(
          result.status
        ).toBe(
          "succeeded"
        );

        expect(
          result.nextCursor
        ).toBe(
          "NEXT-X"
        );

        expect(
          result.items[0]
        ).toMatchObject({
          externalContentId:
            "x:12345",

          contentKind:
            "other",

          originalUrl:
            "https://x.com/NASA/status/12345",

          publisherName:
            "NASA",

          sourceExternalId:
            "user-1",

          sourceName:
            "NASA",

          tags: [
            "NASA",
            "Astronomy",
          ],
        });

        expect(
          JSON.stringify(
            result.items[0]
              ?.metadata
          )
        ).not.toContain(
          "exoplanet discovery"
        );
      }
    );

    it(
      "supports an official X account timeline by user id",
      async () => {
        const fetchImplementation:
          PosterBrainOfficialApiHttpFetch =
          async rawUrl => {
            const url =
              new URL(
                rawUrl
              );

            expect(
              url.pathname
            ).toBe(
              "/2/users/999/tweets"
            );

            expect(
              url.searchParams.get(
                "max_results"
              )
            ).toBe(
              "5"
            );

            expect(
              url.searchParams.get(
                "pagination_token"
              )
            ).toBe(
              "CURSOR"
            );

            return response({
              data:
                [],

              meta:
                {},
            });
          };

        const provider =
          createPosterBrainXContentApiProvider({
            bearerToken:
              "x-token",

            fetchImplementation,
          });

        await provider.fetchPage({
          query:
            null,

          sourceExternalId:
            "999",

          cursor:
            "CURSOR",

          pageSize:
            1,

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
      "maps authorized Facebook Page posts without requesting media assets",
      async () => {
        const urls:
          string[] =
          [];

        const longMessage =
          "A".repeat(
            700
          );

        const fetchImplementation:
          PosterBrainOfficialApiHttpFetch =
          async rawUrl => {
            urls.push(
              rawUrl
            );

            const url =
              new URL(
                rawUrl
              );

            expect(
              url.searchParams.get(
                "access_token"
              )
            ).toBe(
              "meta-token"
            );

            if (
              url.pathname ===
              "/v26.0/123"
            ) {
              expect(
                url.searchParams.get(
                  "fields"
                )
              ).toBe(
                "id,name,link"
              );

              return response({
                id:
                  "123",

                name:
                  "Example Science",

                link:
                  "https://www.facebook.com/example-science",
              });
            }

            expect(
              url.pathname
            ).toBe(
              "/v26.0/123/posts"
            );

            expect(
              url.searchParams.get(
                "fields"
              )
            ).toBe(
              "id,message,created_time,permalink_url"
            );

            expect(
              url.searchParams.get(
                "after"
              )
            ).toBe(
              "CURSOR"
            );

            return response({
              data: [
                {
                  id:
                    "123_456",

                  message:
                    longMessage,

                  created_time:
                    "2026-08-10T10:00:00.000Z",

                  permalink_url:
                    "https://www.facebook.com/example-science/posts/456",
                },
              ],

              paging: {
                cursors: {
                  after:
                    "NEXT-META",
                },
              },
            });
          };

        const provider =
          createPosterBrainFacebookPagesContentApiProvider({
            accessToken:
              "meta-token",

            apiVersion:
              "v26.0",

            fetchImplementation,
          });

        const registry =
          createPosterBrainContentApiProviderRegistryService({
            providers: [
              provider,
            ],

            environment: {
              META_GRAPH_ACCESS_TOKEN:
                "meta-token",
            },
          });

        const result =
          await registry.execute({
            providerKey:
              "facebook-pages",

            sourceExternalId:
              "123",

            cursor:
              "CURSOR",

            pageSize:
              50,
          });

        expect(
          urls
        ).toHaveLength(
          2
        );

        expect(
          result.status
        ).toBe(
          "succeeded"
        );

        expect(
          result.nextCursor
        ).toBe(
          "NEXT-META"
        );

        expect(
          result.items[0]
        ).toMatchObject({
          externalContentId:
            "facebook:123_456",

          publisherName:
            "Example Science",

          sourceExternalId:
            "123",

          sourceUrl:
            "https://www.facebook.com/example-science",

          originalUrl:
            "https://www.facebook.com/example-science/posts/456",

          thumbnailUrl:
            null,

          imageUrl:
            null,
        });

        expect(
          result.items[0]
            ?.title.length
        ).toBeLessThanOrEqual(
          140
        );

        expect(
          result.items[0]
            ?.excerpt.length
        ).toBeLessThanOrEqual(
          500
        );

        expect(
          JSON.stringify(
            result.items[0]
              ?.metadata
          )
        ).not.toContain(
          longMessage
        );
      }
    );

    it(
      "keeps X and Facebook Pages disabled-safe without granted credentials",
      async () => {
        const providers =
          createPosterBrainOfficialContentApiProvidersFromRuntimeEnv({
            environment:
              {},

            fetchImplementation:
              async () => {
                throw new Error(
                  "must not execute"
                );
              },
          });

        expect(
          providers.map(
            provider =>
              provider.providerKey
          )
        ).toEqual([
          "youtube",
          "nasa-images",
          "x",
          "facebook-pages",
        ]);

        const registry =
          createPosterBrainContentApiProviderRegistryService({
            providers,

            environment:
              {},
          });

        const x =
          await registry.execute({
            providerKey:
              "x",

            query:
              "science",
          });

        const facebook =
          await registry.execute({
            providerKey:
              "facebook-pages",

            sourceExternalId:
              "123",
          });

        expect(
          x
        ).toMatchObject({
          status:
            "disabled",

          attempts:
            0,

          reason:
            "missing_credentials:X_BEARER_TOKEN",
        });

        expect(
          facebook
        ).toMatchObject({
          status:
            "disabled",

          attempts:
            0,

          reason:
            "missing_credentials:META_GRAPH_ACCESS_TOKEN",
        });
      }
    );

    it(
      "locks every current official provider to metadata-only discovery",
      () => {
        expect(
          POSTER_BRAIN_OFFICIAL_CONTENT_API_PROVIDER_CATALOG
            .map(
              entry =>
                entry.providerKey
            )
        ).toEqual([
          "youtube",
          "nasa-images",
          "x",
          "facebook-pages",
        ]);

        for (
          const entry
          of POSTER_BRAIN_OFFICIAL_CONTENT_API_PROVIDER_CATALOG
        ) {
          expect(
            entry.metadataOnly
          ).toBe(
            true
          );

          expect(
            entry.originalPublisherUrlRequired
          ).toBe(
            true
          );

          expect(
            entry.playbackAssetsAllowed
          ).toBe(
            false
          );

          expect(
            entry.fullContentBodyAllowed
          ).toBe(
            false
          );
        }
      }
    );
  }
);