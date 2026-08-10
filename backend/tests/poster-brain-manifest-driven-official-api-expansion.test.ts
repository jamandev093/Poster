import {
  describe,
  expect,
  it,
} from "vitest";

import {
  POSTER_BRAIN_MANIFEST_DRIVEN_OFFICIAL_API_CATALOG,
  createPosterBrainContentApiProviderRegistryService,
  createPosterBrainManifestDrivenOfficialApiProvidersFromRuntimeEnv,
  createPosterBrainOfficialContentApiProvidersFromRuntimeEnv,
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
  "Poster Brain manifest-driven official API expansion",
  () => {

    it(
      "registers approved manifests, keeps missing credentials disabled-safe, and policy-holds pending rights",
      () => {
        const runtime =
          createPosterBrainManifestDrivenOfficialApiProvidersFromRuntimeEnv({
            environment:
              {},
          });

        expect(
          runtime.providers.map(
            provider =>
              provider.providerKey
          )
        ).toEqual([
          "crossref",
          "openalex",
        ]);

        expect(
          runtime.entries
        ).toEqual([
          {
            providerKey:
              "crossref",

            activation: {
              active:
                true,

              reason:
                "active",

              missingEnvironmentKeys:
                [],
            },

            runtimeRegistered:
              true,
          },

          {
            providerKey:
              "openalex",

            activation: {
              active:
                false,

              reason:
                "missing_credentials",

              missingEnvironmentKeys: [
                "OPENALEX_API_KEY",
              ],
            },

            runtimeRegistered:
              true,
          },

          {
            providerKey:
              "library-of-congress",

            activation: {
              active:
                false,

              reason:
                "rights_review_pending",

              missingEnvironmentKeys:
                [],
            },

            runtimeRegistered:
              false,
          },
        ]);
      }
    );

    it(
      "maps Crossref metadata while dropping non-English or unknown-language records and never exposing abstracts",
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
              "https://api.crossref.org"
            );

            expect(
              url.pathname
            ).toBe(
              "/works"
            );

            expect(
              url.searchParams.get(
                "query"
              )
            ).toBe(
              "quantum gravity"
            );

            expect(
              url.searchParams.get(
                "rows"
              )
            ).toBe(
              "25"
            );

            expect(
              url.searchParams.get(
                "offset"
              )
            ).toBe(
              "0"
            );

            return response({
              message: {
                "total-results":
                  50,

                items: [
                  {
                    DOI:
                      "10.1000/example",

                    title: [
                      "Quantum gravity research",
                    ],

                    URL:
                      "https://doi.org/10.1000/example",

                    publisher:
                      "Example Publisher",

                    "container-title": [
                      "Journal of Physics",
                    ],

                    ISSN: [
                      "1234-5678",
                    ],

                    language:
                      "en",

                    subject: [
                      "Physics",
                      "Quantum Theory",
                    ],

                    type:
                      "journal-article",

                    abstract:
                      "COPYRIGHTED ABSTRACT MUST NOT BE INGESTED",

                    link: [
                      {
                        URL:
                          "https://publisher.example/full.pdf",
                      },
                    ],
                  },

                  {
                    DOI:
                      "10.1000/unknown-language",

                    title: [
                      "Unknown language record",
                    ],

                    URL:
                      "https://doi.org/10.1000/unknown-language",

                    publisher:
                      "Example Publisher",
                  },
                ],
              },
            });
          };

        const runtime =
          createPosterBrainManifestDrivenOfficialApiProvidersFromRuntimeEnv({
            environment:
              {},

            fetchImplementation,
          });

        const registry =
          createPosterBrainContentApiProviderRegistryService({
            providers:
              runtime.providers,

            environment:
              {},
          });

        const result =
          await registry.execute({
            providerKey:
              "crossref",

            query:
              "quantum gravity",

            pageSize:
              25,
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
          result.droppedNonEnglishItems
        ).toBe(
          1
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
            "crossref:10.1000/example",

          title:
            "Quantum gravity research",

          excerpt:
            "",

          originalUrl:
            "https://doi.org/10.1000/example",

          publisherName:
            "Example Publisher",

          sourceExternalId:
            "1234-5678",

          sourceName:
            "Journal of Physics",

          tags: [
            "Physics",
            "Quantum Theory",
          ],
        });

        const serialized =
          JSON.stringify(
            result.items[0]
          );

        expect(
          serialized
        ).not.toContain(
          "COPYRIGHTED ABSTRACT"
        );

        expect(
          serialized
        ).not.toContain(
          "full.pdf"
        );
      }
    );

    it(
      "maps OpenAlex CC0 scholarly metadata and excludes PDF/content assets",
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
              "https://api.openalex.org"
            );

            expect(
              url.pathname
            ).toBe(
              "/works"
            );

            expect(
              url.searchParams.get(
                "search"
              )
            ).toBe(
              "machine learning"
            );

            expect(
              url.searchParams.get(
                "filter"
              )
            ).toBe(
              "language:en"
            );

            expect(
              url.searchParams.get(
                "cursor"
              )
            ).toBe(
              "*"
            );

            expect(
              url.searchParams.get(
                "per-page"
              )
            ).toBe(
              "25"
            );

            expect(
              url.searchParams.get(
                "api_key"
              )
            ).toBe(
              "openalex-key"
            );

            return response({
              meta: {
                next_cursor:
                  "OA-CURSOR-2",
              },

              results: [
                {
                  id:
                    "https://openalex.org/W123",

                  doi:
                    "https://doi.org/10.1000/openalex",

                  display_name:
                    "Machine learning for astronomy",

                  publication_date:
                    "2026-08-10",

                  type:
                    "article",

                  language:
                    "en",

                  cited_by_count:
                    42,

                  primary_topic: {
                    display_name:
                      "Astronomical Machine Learning",
                  },

                  primary_location: {
                    landing_page_url:
                      "https://publisher.example/article",

                    pdf_url:
                      "https://publisher.example/article.pdf",

                    source: {
                      id:
                        "https://openalex.org/S123",

                      display_name:
                        "Example Astronomy Journal",
                    },
                  },

                  content_url:
                    "https://api.openalex.org/content/full",
                },
              ],
            });
          };

        const runtime =
          createPosterBrainManifestDrivenOfficialApiProvidersFromRuntimeEnv({
            environment: {
              OPENALEX_API_KEY:
                "openalex-key",
            },

            fetchImplementation,
          });

        const registry =
          createPosterBrainContentApiProviderRegistryService({
            providers:
              runtime.providers,

            environment: {
              OPENALEX_API_KEY:
                "openalex-key",
            },
          });

        const result =
          await registry.execute({
            providerKey:
              "openalex",

            query:
              "machine learning",

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
          "OA-CURSOR-2"
        );

        expect(
          result.items[0]
        ).toMatchObject({
          externalContentId:
            "openalex:https://openalex.org/W123",

          title:
            "Machine learning for astronomy",

          excerpt:
            "",

          originalUrl:
            "https://publisher.example/article",

          publisherName:
            "Example Astronomy Journal",

          sourceExternalId:
            "https://openalex.org/S123",

          sourceName:
            "Example Astronomy Journal",

          publishedAt:
            "2026-08-10T00:00:00.000Z",

          metadata: {
            openAlexId:
              "https://openalex.org/W123",

            doi:
              "https://doi.org/10.1000/openalex",

            workType:
              "article",

            citedByCount:
              42,

            primaryTopic:
              "Astronomical Machine Learning",
          },
        });

        const serialized =
          JSON.stringify(
            result.items[0]
          );

        expect(
          serialized
        ).not.toContain(
          "article.pdf"
        );

        expect(
          serialized
        ).not.toContain(
          "/content/full"
        );
      }
    );

    it(
      "keeps OpenAlex disabled-safe when its runtime API key is absent",
      async () => {
        let called =
          false;

        const runtime =
          createPosterBrainManifestDrivenOfficialApiProvidersFromRuntimeEnv({
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
            providers:
              runtime.providers,

            environment:
              {},
          });

        const result =
          await registry.execute({
            providerKey:
              "openalex",

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
            "missing_credentials:OPENALEX_API_KEY",
        });

        expect(
          called
        ).toBe(
          false
        );
      }
    );

    it(
      "holds Library of Congress out of runtime until rights review is explicitly approved",
      () => {
        const runtime =
          createPosterBrainManifestDrivenOfficialApiProvidersFromRuntimeEnv({
            environment:
              {},
          });

        expect(
          runtime.providers.some(
            provider =>
              provider.providerKey ===
              "library-of-congress"
          )
        ).toBe(
          false
        );

        expect(
          runtime.entries.find(
            entry =>
              entry.providerKey ===
              "library-of-congress"
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
    );

    it(
      "unifies legacy and manifest-driven official providers without enabling policy-held sources",
      () => {
        const providers =
          createPosterBrainOfficialContentApiProvidersFromRuntimeEnv({
            environment:
              {},

            fetchImplementation:
              async () => {
                throw new Error(
                  "network must not execute during catalog proof"
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
          "guardian",
          "pubmed",
          "smithsonian",
          "crossref",
          "openalex",
        ]);

        expect(
          providers.some(
            provider =>
              provider.providerKey ===
              "library-of-congress"
          )
        ).toBe(
          false
        );

        expect(
          POSTER_BRAIN_MANIFEST_DRIVEN_OFFICIAL_API_CATALOG
        ).toHaveLength(
          3
        );
      }
    );
  }
);