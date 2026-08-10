import {
  describe,
  expect,
  it,
} from "vitest";

import {
  createPosterBrainContentApiProviderRegistryService,
  createPosterBrainGenericOfficialApiProvider,
  createPosterBrainOfficialApiManifestRegistry,
  evaluatePosterBrainOfficialApiProviderActivation,
} from "../src/application/poster-brain/index.js";

import type {
  PosterBrainOfficialApiProviderManifest,
} from "../src/application/poster-brain/index.js";

import type {
  PosterBrainOfficialApiHttpFetch,
} from "../src/application/poster-brain/official-content-api-http.js";

function manifest(
  overrides?: {
    readonly rightsStatus?:
      "pending" |
      "approved" |
      "blocked";

    readonly commercialUseStatus?:
      "pending" |
      "approved" |
      "restricted";

    readonly technicalStatus?:
      "pending" |
      "validated";

    readonly enabled?:
      boolean;
  }
): PosterBrainOfficialApiProviderManifest {
  return {
    providerKey:
      "example-science",

    displayName:
      "Example Science API",

    operator:
      "Example Science",

    maxPageSize:
      100,

    auth: {
      type:
        "api_key_query",

      environmentKey:
        "EXAMPLE_SCIENCE_API_KEY",

      parameterName:
        "api_key",
    },

    request: {
      baseUrl:
        "https://api.example.test",

      endpointPath:
        "/v1/search",

      fixedParameters: {
        format:
          "json",
      },

      queryParameter:
        "q",

      languageParameter:
        "language",

      languageValue:
        "en",

      pageSizeParameter:
        "limit",

      pagination: {
        type:
          "cursor",

        requestParameter:
          "cursor",

        responseNextCursorPath:
          "meta.nextCursor",
      },
    },

    response: {
      collectionPath:
        "results.items",

      contentKind:
        "article",

      id: {
        path:
          "id",
      },

      title: {
        path:
          "headline",
      },

      excerpt: {
        path:
          "description",
      },

      originalUrl: {
        path:
          "links.original",
      },

      thumbnailUrl: {
        path:
          "images.thumbnail",
      },

      publisherName: {
        path:
          "publisher.name",
      },

      sourceExternalId: {
        path:
          "publisher.id",
      },

      sourceName: {
        path:
          "publisher.name",
      },

      sourceUrl: {
        path:
          "publisher.url",
      },

      languageCode: {
        path:
          "language",
      },

      publishedAt: {
        path:
          "publishedAt",
      },

      tags: {
        path:
          "tags",
      },

      topics: {
        path:
          "topics",
      },

      metadata: {
        category:
          "category",

        sourceType:
          "sourceType",
      },
    },

    activation: {
      enabled:
        overrides?.enabled ??
        true,

      technicalStatus:
        overrides?.technicalStatus ??
        "validated",

      rightsStatus:
        overrides?.rightsStatus ??
        "approved",

      commercialUseStatus:
        overrides?.commercialUseStatus ??
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
}

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
  "Poster Brain official API integration engine",
  () => {

    it(
      "maps an ordinary official REST API from a manifest without a custom adapter",
      async () => {
        const fetchImplementation:
          PosterBrainOfficialApiHttpFetch =
          async rawUrl => {
            const url =
              new URL(rawUrl);

            expect(
              url.origin
            ).toBe(
              "https://api.example.test"
            );

            expect(
              url.pathname
            ).toBe(
              "/v1/search"
            );

            expect(
              url.searchParams.get(
                "q"
              )
            ).toBe(
              "quantum computing"
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
                "limit"
              )
            ).toBe(
              "50"
            );

            expect(
              url.searchParams.get(
                "cursor"
              )
            ).toBe(
              "CURSOR-1"
            );

            expect(
              url.searchParams.get(
                "api_key"
              )
            ).toBe(
              "secret"
            );

            return response({
              meta: {
                nextCursor:
                  "CURSOR-2",
              },

              results: {
                items: [
                  {
                    id:
                      "article-1",

                    headline:
                      "New quantum computing research",

                    description:
                      "Researchers report a new result in quantum computing.",

                    links: {
                      original:
                        "https://www.example.test/research/article-1",
                    },

                    images: {
                      thumbnail:
                        "https://cdn.example.test/thumb/article-1.jpg",
                    },

                    publisher: {
                      id:
                        "publisher-1",

                      name:
                        "Example Science",

                      url:
                        "https://www.example.test/",
                    },

                    language:
                      "en",

                    publishedAt:
                      "2026-08-10T12:00:00.000Z",

                    tags: [
                      "Quantum Computing",
                      "Physics",
                    ],

                    topics: [
                      "Computer Science",
                    ],

                    category:
                      "science",

                    sourceType:
                      "journal",
                  },
                ],
              },
            });
          };

        const provider =
          createPosterBrainGenericOfficialApiProvider({
            manifest:
              manifest(),

            environment: {
              EXAMPLE_SCIENCE_API_KEY:
                "secret",
            },

            fetchImplementation,
          });

        const registry =
          createPosterBrainContentApiProviderRegistryService({
            providers: [
              provider,
            ],

            environment: {
              EXAMPLE_SCIENCE_API_KEY:
                "secret",
            },
          });

        const result =
          await registry.execute({
            providerKey:
              "example-science",

            query:
              "quantum computing",

            cursor:
              "CURSOR-1",

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
          "CURSOR-2"
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
            "example-science:article-1",

          contentKind:
            "article",

          title:
            "New quantum computing research",

          excerpt:
            "Researchers report a new result in quantum computing.",

          originalUrl:
            "https://www.example.test/research/article-1",

          thumbnailUrl:
            "https://cdn.example.test/thumb/article-1.jpg",

          publisherName:
            "Example Science",

          sourceExternalId:
            "publisher-1",

          languageCode:
            "en",

          tags: [
            "Quantum Computing",
            "Physics",
          ],

          topics: [
            "Computer Science",
          ],

          metadata: {
            category:
              "science",

            sourceType:
              "journal",
          },
        });
      }
    );

    it(
      "keeps manifest providers disabled-safe when credentials are absent",
      async () => {
        let called =
          false;

        const provider =
          createPosterBrainGenericOfficialApiProvider({
            manifest:
              manifest(),

            environment:
              {},

            fetchImplementation:
              async () => {
                called =
                  true;

                throw new Error(
                  "must not execute"
                );
              },
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
              "example-science",

            query:
              "physics",
          });

        expect(
          result
        ).toMatchObject({
          status:
            "disabled",

          attempts:
            0,

          reason:
            "missing_credentials:EXAMPLE_SCIENCE_API_KEY",
        });

        expect(
          called
        ).toBe(
          false
        );
      }
    );

    it(
      "rejects manifest mappings that attempt to ingest full content or playback assets",
      () => {
        const unsafeBody = {
          ...manifest(),

          response: {
            ...manifest().response,

            excerpt: {
              path:
                "content.bodyText",
            },
          },
        } satisfies PosterBrainOfficialApiProviderManifest;

        expect(
          () =>
            createPosterBrainOfficialApiManifestRegistry([
              unsafeBody,
            ])
        ).toThrow(
          "forbidden content"
        );

        const unsafePlayback = {
          ...manifest(),

          response: {
            ...manifest().response,

            metadata: {
              playbackUrl:
                "media.playbackUrl",
            },
          },
        } satisfies PosterBrainOfficialApiProviderManifest;

        expect(
          () =>
            createPosterBrainOfficialApiManifestRegistry([
              unsafePlayback,
            ])
        ).toThrow(
          "forbidden content"
        );
      }
    );

    it(
      "keeps technical availability separate from rights and commercial activation",
      () => {
        expect(
          evaluatePosterBrainOfficialApiProviderActivation({
            manifest:
              manifest(),

            environment:
              {},
          })
        ).toMatchObject({
          active:
            false,

          reason:
            "missing_credentials",
        });

        expect(
          evaluatePosterBrainOfficialApiProviderActivation({
            manifest:
              manifest({
                technicalStatus:
                  "pending",
              }),

            environment: {
              EXAMPLE_SCIENCE_API_KEY:
                "secret",
            },
          })
        ).toMatchObject({
          active:
            false,

          reason:
            "technical_validation_pending",
        });

        expect(
          evaluatePosterBrainOfficialApiProviderActivation({
            manifest:
              manifest({
                rightsStatus:
                  "pending",
              }),

            environment: {
              EXAMPLE_SCIENCE_API_KEY:
                "secret",
            },
          })
        ).toMatchObject({
          active:
            false,

          reason:
            "rights_review_pending",
        });

        expect(
          evaluatePosterBrainOfficialApiProviderActivation({
            manifest:
              manifest({
                commercialUseStatus:
                  "restricted",
              }),

            environment: {
              EXAMPLE_SCIENCE_API_KEY:
                "secret",
            },
          })
        ).toMatchObject({
          active:
            false,

          reason:
            "commercial_use_restricted",
        });

        expect(
          evaluatePosterBrainOfficialApiProviderActivation({
            manifest:
              manifest(),

            environment: {
              EXAMPLE_SCIENCE_API_KEY:
                "secret",
            },
          })
        ).toEqual({
          active:
            true,

          reason:
            "active",

          missingEnvironmentKeys:
            [],
        });
      }
    );

    it(
      "maintains an authoritative validated manifest registry",
      () => {
        const registry =
          createPosterBrainOfficialApiManifestRegistry([
            manifest(),
          ]);

        expect(
          registry.list()
        ).toHaveLength(
          1
        );

        expect(
          registry.get(
            "example-science"
          )?.operator
        ).toBe(
          "Example Science"
        );

        expect(
          () =>
            createPosterBrainOfficialApiManifestRegistry([
              manifest(),
              manifest(),
            ])
        ).toThrow(
          "Duplicate official API manifest"
        );
      }
    );
  }
);