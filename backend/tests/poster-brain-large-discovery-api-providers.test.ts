import {
  describe,
  expect,
  it,
} from "vitest";

import {
  POSTER_BRAIN_GDELT_DISCOVERY_MANIFEST,
  POSTER_BRAIN_LARGE_DISCOVERY_API_MANIFEST_CATALOG,
  POSTER_BRAIN_NEWSAPI_DISCOVERY_MANIFEST,
  createPosterBrainContentApiProviderRegistryService,
  createPosterBrainGenericOfficialApiProvider,
  createPosterBrainLargeDiscoveryApiProvidersFromRuntimeEnv,
} from "../src/application/poster-brain/index.js";

import type {
  PosterBrainOfficialApiHttpFetch,
} from "../src/application/poster-brain/official-content-api-http.js";

function response(
  payload:
    unknown
) {
  return {
    ok:
      true,

    status:
      200,

    async json() {
      return payload;
    },
  };
}

describe(
  "Poster Brain large discovery API providers",
  () => {

    it(
      "keeps the large discovery catalog separate from direct official publishers",
      () => {
        expect(
          POSTER_BRAIN_LARGE_DISCOVERY_API_MANIFEST_CATALOG
            .map(
              manifest =>
                [
                  manifest.providerKey,
                  manifest.providerClass,
                ]
            )
        ).toEqual(
          expect.arrayContaining([
            [
              "newsapi",
              "aggregator",
            ],

            [
              "gdelt",
              "aggregator",
            ],
          ])
        );
      }
    );

    it(
      "maps NewsAPI discovery metadata but never maps its content body",
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
              url.origin
            ).toBe(
              "https://newsapi.org"
            );

            expect(
              url.pathname
            ).toBe(
              "/v2/everything"
            );

            expect(
              url.searchParams.get(
                "q"
              )
            ).toBe(
              "space science"
            );

            expect(
              url.searchParams.get(
                "language"
              )
            ).toBe(
              "en"
            );

            expect(
              url.searchParams.get(
                "searchIn"
              )
            ).toBe(
              "title,description"
            );

            expect(
              url.searchParams.get(
                "page"
              )
            ).toBe(
              "1"
            );

            expect(
              url.searchParams.get(
                "pageSize"
              )
            ).toBe(
              "25"
            );

            expect(
              request.headers[
                "X-Api-Key"
              ]
            ).toBe(
              "newsapi-key"
            );

            return response({
              status:
                "ok",

              totalResults:
                50,

              articles: [
                {
                  source: {
                    id:
                      "example-science",

                    name:
                      "Example Science",
                  },

                  author:
                    "Example Author",

                  title:
                    "A new space telescope discovery",

                  description:
                    "Researchers report a new astronomical observation.",

                  url:
                    "https://example.test/articles/space-telescope",

                  urlToImage:
                    "https://example.test/images/space-thumb.jpg",

                  publishedAt:
                    "2026-08-10T10:00:00Z",

                  content:
                    "FULL OR TRUNCATED ARTICLE CONTENT MUST NEVER ENTER POSTER",
                },
              ],
            });
          };

        const provider =
          createPosterBrainGenericOfficialApiProvider({
            manifest:
              POSTER_BRAIN_NEWSAPI_DISCOVERY_MANIFEST,

            environment: {
              NEWSAPI_API_KEY:
                "newsapi-key",
            },

            fetchImplementation,
          });

        expect(
          provider.capabilities
            .providerClass
        ).toBe(
          "aggregator"
        );

        const registry =
          createPosterBrainContentApiProviderRegistryService({
            providers: [
              provider,
            ],

            environment: {
              NEWSAPI_API_KEY:
                "newsapi-key",
            },
          });

        const result =
          await registry.execute({
            providerKey:
              "newsapi",

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
          "2"
        );

        expect(
          result.items[0]
        ).toMatchObject({
          contentKind:
            "article",

          title:
            "A new space telescope discovery",

          excerpt:
            "Researchers report a new astronomical observation.",

          originalUrl:
            "https://example.test/articles/space-telescope",

          thumbnailUrl:
            "https://example.test/images/space-thumb.jpg",

          publisherName:
            "Example Science",

          languageCode:
            "en",
        });

        expect(
          JSON.stringify(
            result.items[0]
          )
        ).not.toContain(
          "FULL OR TRUNCATED ARTICLE CONTENT"
        );
      }
    );

    it(
      "keeps NewsAPI production runtime commercially gated even when credentials exist",
      () => {
        const runtime =
          createPosterBrainLargeDiscoveryApiProvidersFromRuntimeEnv({
            environment: {
              NEWSAPI_API_KEY:
                "newsapi-key",
            },
          });

        expect(
          runtime.providers.some(
            provider =>
              provider.providerKey ===
              "newsapi"
          )
        ).toBe(
          false
        );

        expect(
          runtime.entries.find(
            entry =>
              entry.providerKey ===
              "newsapi"
          )
        ).toMatchObject({
          runtimeRegistered:
            false,

          activation: {
            active:
              false,

            reason:
              "commercial_review_pending",
          },
        });
      }
    );

    it(
      "uses GDELT as an English metadata-only source discovery provider",
      async () => {
        const fetchImplementation:
          PosterBrainOfficialApiHttpFetch =
          async rawUrl => {
            const url =
              new URL(
                rawUrl
              );

            expect(
              url.origin
            ).toBe(
              "https://api.gdeltproject.org"
            );

            expect(
              url.pathname
            ).toBe(
              "/api/v2/doc/doc"
            );

            expect(
              url.searchParams.get(
                "query"
              )
            ).toBe(
              "exoplanet sourcelang:english"
            );

            expect(
              url.searchParams.get(
                "mode"
              )
            ).toBe(
              "artlist"
            );

            expect(
              url.searchParams.get(
                "format"
              )
            ).toBe(
              "json"
            );

            expect(
              url.searchParams.get(
                "sort"
              )
            ).toBe(
              "datedesc"
            );

            expect(
              url.searchParams.get(
                "maxrecords"
              )
            ).toBe(
              "100"
            );

            return response({
              articles: [
                {
                  url:
                    "https://science.example/article/exoplanet",

                  url_mobile:
                    "https://science.example/mobile/exoplanet",

                  title:
                    "Scientists study a nearby exoplanet",

                  seendate:
                    "20260810T120000Z",

                  socialimage:
                    "https://science.example/images/exoplanet.jpg",

                  domain:
                    "science.example",

                  language:
                    "English",

                  sourcecountry:
                    "United States",

                  translatedcontent:
                    "CONTENT MUST NEVER BE INGESTED",
                },
              ],
            });
          };

        const provider =
          createPosterBrainGenericOfficialApiProvider({
            manifest:
              POSTER_BRAIN_GDELT_DISCOVERY_MANIFEST,

            environment:
              {},

            fetchImplementation,
          });

        expect(
          provider.capabilities
            .providerClass
        ).toBe(
          "aggregator"
        );

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
              "gdelt",

            query:
              "exoplanet",

            pageSize:
              100,
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
        ).toMatchObject({
          originalUrl:
            "https://science.example/article/exoplanet",

          title:
            "Scientists study a nearby exoplanet",

          thumbnailUrl:
            "https://science.example/images/exoplanet.jpg",

          publisherName:
            "science.example",

          sourceExternalId:
            "science.example",

          languageCode:
            "en",
        });

        const serialized =
          JSON.stringify(
            result.items[0]
          );

        expect(
          serialized
        ).not.toContain(
          "/mobile/exoplanet"
        );

        expect(
          serialized
        ).not.toContain(
          "CONTENT MUST NEVER BE INGESTED"
        );
      }
    );

    it(
      "registers GDELT but does not bypass NewsAPI commercial activation policy",
      () => {
        const runtime =
          createPosterBrainLargeDiscoveryApiProvidersFromRuntimeEnv({
            environment:
              {},
          });

        expect(
          runtime.providers.map(
            provider =>
              provider.providerKey
          )
        ).toEqual(
          expect.arrayContaining([
            "newsapi",
            "gdelt",
          ])
        );

        /*
         * With no NewsAPI key it stays registered only so the
         * existing registry can return disabled-safe without
         * issuing a network request.
         */
        expect(
          runtime.entries.find(
            entry =>
              entry.providerKey ===
              "newsapi"
          )
        ).toMatchObject({
          activation: {
            active:
              false,

            reason:
              "missing_credentials",
          },

          runtimeRegistered:
            true,
        });

        expect(
          runtime.entries.find(
            entry =>
              entry.providerKey ===
              "gdelt"
          )
        ).toMatchObject({
          activation: {
            active:
              true,

            reason:
              "active",
          },

          runtimeRegistered:
            true,
        });
      }
    );
  }
);