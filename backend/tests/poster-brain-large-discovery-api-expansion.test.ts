import {
  describe,
  expect,
  it,
} from "vitest";

import {
  POSTER_BRAIN_EVENT_REGISTRY_DISCOVERY_MANIFEST,
  POSTER_BRAIN_LARGE_DISCOVERY_API_MANIFEST_CATALOG,
  POSTER_BRAIN_NEWSCATCHER_DISCOVERY_MANIFEST,
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
  "Poster Brain large discovery API expansion",
  () => {

    it(
      "expands the discovery catalog with NewsCatcher and Event Registry",
      () => {
        expect(
          POSTER_BRAIN_LARGE_DISCOVERY_API_MANIFEST_CATALOG
            .map(
              manifest =>
                manifest.providerKey
            )
        ).toEqual([
          "newsapi",
          "gdelt",
          "newscatcher",
          "event-registry",
        ]);

        for (
          const manifest
          of POSTER_BRAIN_LARGE_DISCOVERY_API_MANIFEST_CATALOG
        ) {
          expect(
            manifest.providerClass
          ).toBe(
            "aggregator"
          );

          expect(
            manifest.policy
          ).toEqual({
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
          });
        }
      }
    );

    it(
      "maps NewsCatcher discovery metadata without ingesting article content",
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
              "https://v3-api.newscatcherapi.com"
            );

            expect(
              url.pathname
            ).toBe(
              "/api/search"
            );

            expect(
              url.searchParams.get(
                "q"
              )
            ).toBe(
              "artificial intelligence"
            );

            expect(
              url.searchParams.get(
                "lang"
              )
            ).toBe(
              "en"
            );

            expect(
              url.searchParams.get(
                "robots_compliant"
              )
            ).toBe(
              "true"
            );

            expect(
              url.searchParams.get(
                "exclude_duplicates"
              )
            ).toBe(
              "true"
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
                "page_size"
              )
            ).toBe(
              "25"
            );

            expect(
              request.headers[
                "x-api-token"
              ]
            ).toBe(
              "newscatcher-key"
            );

            return response({
              status:
                "ok",

              total_hits:
                100,

              page:
                1,

              total_pages:
                4,

              page_size:
                25,

              articles: [
                {
                  id:
                    "nc-article-1",

                  title:
                    "Researchers announce a new AI system",

                  description:
                    "A research team announced new machine-learning results.",

                  content:
                    "FULL ARTICLE CONTENT MUST NEVER ENTER POSTER",

                  link:
                    "https://science.example/articles/ai-system",

                  domain_url:
                    "science.example",

                  full_domain_url:
                    "www.science.example",

                  name_source:
                    "Science Example",

                  parent_url:
                    "https://science.example/articles",

                  media:
                    "https://science.example/images/ai-system.jpg",

                  language:
                    "en",

                  published_date:
                    "2026-08-10 12:30:00",

                  author:
                    "Research Desk",

                  country:
                    "US",

                  rights:
                    "science.example",

                  rank:
                    15,

                  paid_content:
                    false,
                },
              ],
            });
          };

        const provider =
          createPosterBrainGenericOfficialApiProvider({
            manifest:
              POSTER_BRAIN_NEWSCATCHER_DISCOVERY_MANIFEST,

            environment: {
              NEWSCATCHER_API_KEY:
                "newscatcher-key",
            },

            fetchImplementation,
          });

        const registry =
          createPosterBrainContentApiProviderRegistryService({
            providers: [
              provider,
            ],

            environment: {
              NEWSCATCHER_API_KEY:
                "newscatcher-key",
            },
          });

        const result =
          await registry.execute({
            providerKey:
              "newscatcher",

            query:
              "artificial intelligence",

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
          externalContentId:
            "newscatcher:nc-article-1",

          title:
            "Researchers announce a new AI system",

          excerpt:
            "A research team announced new machine-learning results.",

          originalUrl:
            "https://science.example/articles/ai-system",

          thumbnailUrl:
            "https://science.example/images/ai-system.jpg",

          publisherName:
            "Science Example",

          sourceExternalId:
            "science.example",

          sourceName:
            "Science Example",

          languageCode:
            "en",

          publishedAt:
            null,

          metadata: {
            newsCatcherId:
              "nc-article-1",

            publishedDate:
              "2026-08-10 12:30:00",

            domain:
              "science.example",

            author:
              "Research Desk",
          },
        });

        expect(
          JSON.stringify(
            result.items[0]
          )
        ).not.toContain(
          "FULL ARTICLE CONTENT MUST NEVER ENTER POSTER"
        );
      }
    );

    it(
      "requests Event Registry metadata with article body and media playback fields explicitly disabled",
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
              "https://eventregistry.org"
            );

            expect(
              url.pathname
            ).toBe(
              "/api/v1/article/getArticles"
            );

            expect(
              url.searchParams.get(
                "keyword"
              )
            ).toBe(
              "quantum computing"
            );

            expect(
              url.searchParams.get(
                "lang"
              )
            ).toBe(
              "eng"
            );

            expect(
              url.searchParams.get(
                "apiKey"
              )
            ).toBe(
              "event-registry-key"
            );

            expect(
              url.searchParams.get(
                "articlesPage"
              )
            ).toBe(
              "1"
            );

            expect(
              url.searchParams.get(
                "articlesCount"
              )
            ).toBe(
              "50"
            );

            expect(
              url.searchParams.get(
                "includeArticleBody"
              )
            ).toBe(
              "false"
            );

            expect(
              url.searchParams.get(
                "includeArticleVideos"
              )
            ).toBe(
              "false"
            );

            expect(
              url.searchParams.get(
                "includeArticleLinks"
              )
            ).toBe(
              "false"
            );

            expect(
              url.searchParams.get(
                "includeArticleOriginalArticle"
              )
            ).toBe(
              "false"
            );

            return response({
              articles: {
                page:
                  1,

                pages:
                  2,

                totalResults:
                  75,

                count:
                  50,

                results: [
                  {
                    uri:
                      "event-registry-123",

                    lang:
                      "eng",

                    dateTime:
                      "2026-08-10T13:15:00Z",

                    dataType:
                      "news",

                    url:
                      "https://physics.example/quantum-computing",

                    title:
                      "Quantum computing research advances",

                    body:
                      "FULL EVENT REGISTRY ARTICLE BODY MUST NEVER ENTER POSTER",

                    image:
                      "https://physics.example/images/quantum.jpg",

                    eventUri:
                      "event-123",

                    relevance:
                      1,

                    source: {
                      uri:
                        "physics.example",

                      title:
                        "Physics Example",

                      dataType:
                        "news",
                    },
                  },
                ],
              },
            });
          };

        const provider =
          createPosterBrainGenericOfficialApiProvider({
            manifest:
              POSTER_BRAIN_EVENT_REGISTRY_DISCOVERY_MANIFEST,

            environment: {
              EVENT_REGISTRY_API_KEY:
                "event-registry-key",
            },

            fetchImplementation,
          });

        const registry =
          createPosterBrainContentApiProviderRegistryService({
            providers: [
              provider,
            ],

            environment: {
              EVENT_REGISTRY_API_KEY:
                "event-registry-key",
            },
          });

        const result =
          await registry.execute({
            providerKey:
              "event-registry",

            query:
              "quantum computing",

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
          result.items[0]
        ).toMatchObject({
          externalContentId:
            "event-registry:event-registry-123",

          title:
            "Quantum computing research advances",

          excerpt:
            "",

          originalUrl:
            "https://physics.example/quantum-computing",

          thumbnailUrl:
            "https://physics.example/images/quantum.jpg",

          publisherName:
            "Physics Example",

          sourceExternalId:
            "physics.example",

          sourceName:
            "Physics Example",

          languageCode:
            "en",

          publishedAt:
            "2026-08-10T13:15:00.000Z",

          metadata: {
            eventRegistryUri:
              "event-registry-123",

            dataType:
              "news",

            eventUri:
              "event-123",

            relevance:
              1,

            sourceUri:
              "physics.example",
          },
        });

        expect(
          JSON.stringify(
            result.items[0]
          )
        ).not.toContain(
          "FULL EVENT REGISTRY ARTICLE BODY"
        );
      }
    );

    it(
      "keeps NewsCatcher and Event Registry disabled-safe without credentials",
      async () => {
        let called =
          false;

        const runtime =
          createPosterBrainLargeDiscoveryApiProvidersFromRuntimeEnv({
            environment:
              {},

            fetchImplementation:
              async () => {
                called =
                  true;

                throw new Error(
                  "network must not execute"
                );
              },
          });

        const keys =
          runtime.providers.map(
            provider =>
              provider.providerKey
          );

        expect(
          keys
        ).toEqual(
          expect.arrayContaining([
            "newscatcher",
            "event-registry",
          ])
        );

        const registry =
          createPosterBrainContentApiProviderRegistryService({
            providers:
              runtime.providers,

            environment:
              {},
          });

        const newscatcher =
          await registry.execute({
            providerKey:
              "newscatcher",

            query:
              "science",
          });

        const eventRegistry =
          await registry.execute({
            providerKey:
              "event-registry",

            query:
              "science",
          });

        expect(
          newscatcher
        ).toMatchObject({
          status:
            "disabled",

          attempts:
            0,

          reason:
            "missing_credentials:NEWSCATCHER_API_KEY",
        });

        expect(
          eventRegistry
        ).toMatchObject({
          status:
            "disabled",

          attempts:
            0,

          reason:
            "missing_credentials:EVENT_REGISTRY_API_KEY",
        });

        expect(
          called
        ).toBe(
          false
        );
      }
    );

    it(
      "holds both credentialed aggregators out of production runtime until rights approval",
      () => {
        const runtime =
          createPosterBrainLargeDiscoveryApiProvidersFromRuntimeEnv({
            environment: {
              NEWSCATCHER_API_KEY:
                "newscatcher-key",

              EVENT_REGISTRY_API_KEY:
                "event-registry-key",
            },
          });

        for (
          const providerKey
          of [
            "newscatcher",
            "event-registry",
          ]
        ) {
          expect(
            runtime.providers.some(
              provider =>
                provider.providerKey ===
                providerKey
            )
          ).toBe(
            false
          );

          expect(
            runtime.entries.find(
              entry =>
                entry.providerKey ===
                providerKey
            )
          ).toMatchObject({
            runtimeRegistered:
              false,

            activation: {
              active:
                false,

              reason:
                "rights_review_pending",
            },
          });
        }
      }
    );
  }
);