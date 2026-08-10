import {
  describe,
  expect,
  it,
} from "vitest";

import {
  POSTER_BRAIN_OFFICIAL_CONTENT_API_PROVIDER_CATALOG,
  createPosterBrainContentApiProviderRegistryService,
  createPosterBrainGuardianContentApiProvider,
  createPosterBrainOfficialContentApiProvidersFromRuntimeEnv,
  createPosterBrainPubMedContentApiProvider,
  createPosterBrainSmithsonianContentApiProvider,
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
  "Poster Brain direct publisher, science and institution official APIs",
  () => {

    it(
      "maps Guardian search results without requesting or storing article body text",
      async () => {
        const fetchImplementation:
          PosterBrainOfficialApiHttpFetch =
          async rawUrl => {
            const url =
              new URL(rawUrl);

            expect(
              url.hostname
            ).toBe(
              "content.guardianapis.com"
            );

            expect(
              url.pathname
            ).toBe(
              "/search"
            );

            expect(
              url.searchParams.get(
                "q"
              )
            ).toBe(
              "climate science"
            );

            expect(
              url.searchParams.get(
                "api-key"
              )
            ).toBe(
              "guardian-key"
            );

            expect(
              url.searchParams.get(
                "show-tags"
              )
            ).toBe(
              "keyword"
            );

            expect(
              url.searchParams.has(
                "show-fields"
              )
            ).toBe(
              false
            );

            expect(
              rawUrl
            ).not.toMatch(
              /body|bodyText|fullText/i
            );

            return response({
              response: {
                status:
                  "ok",

                currentPage:
                  1,

                pages:
                  2,

                results: [
                  {
                    id:
                      "environment/2026/aug/10/example",

                    type:
                      "article",

                    sectionId:
                      "environment",

                    sectionName:
                      "Environment",

                    webPublicationDate:
                      "2026-08-10T10:00:00Z",

                    webTitle:
                      "New climate research published",

                    webUrl:
                      "https://www.theguardian.com/environment/2026/aug/10/example",

                    tags: [
                      {
                        webTitle:
                          "Climate science",
                      },

                      {
                        webTitle:
                          "Research",
                      },
                    ],
                  },
                ],
              },
            });
          };

        const provider =
          createPosterBrainGuardianContentApiProvider({
            apiKey:
              "guardian-key",

            fetchImplementation,
          });

        const registry =
          createPosterBrainContentApiProviderRegistryService({
            providers: [
              provider,
            ],

            environment: {
              GUARDIAN_API_KEY:
                "guardian-key",
            },
          });

        const result =
          await registry.execute({
            providerKey:
              "guardian",

            query:
              "climate science",

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
            "guardian:environment/2026/aug/10/example",

          contentKind:
            "article",

          title:
            "New climate research published",

          excerpt:
            "",

          originalUrl:
            "https://www.theguardian.com/environment/2026/aug/10/example",

          thumbnailUrl:
            null,

          imageUrl:
            null,

          publisherName:
            "The Guardian",

          tags: [
            "Climate science",
            "Research",
          ],
        });

        expect(
          JSON.stringify(
            result.items[0]
          )
        ).not.toMatch(
          /article body|fulltext|bodytext/i
        );
      }
    );

    it(
      "uses PubMed ESearch and ESummary metadata only without abstracts",
      async () => {
        const urls:
          string[] =
          [];

        const fetchImplementation:
          PosterBrainOfficialApiHttpFetch =
          async rawUrl => {
            urls.push(rawUrl);

            const url =
              new URL(rawUrl);

            expect(
              url.hostname
            ).toBe(
              "eutils.ncbi.nlm.nih.gov"
            );

            expect(
              url.searchParams.get(
                "tool"
              )
            ).toBe(
              "Poster"
            );

            expect(
              url.searchParams.get(
                "email"
              )
            ).toBe(
              "developer@getpostar.com"
            );

            expect(
              url.searchParams.get(
                "api_key"
              )
            ).toBe(
              "ncbi-key"
            );

            if (
              url.pathname.endsWith(
                "/esearch.fcgi"
              )
            ) {
              expect(
                url.searchParams.get(
                  "db"
                )
              ).toBe(
                "pubmed"
              );

              expect(
                url.searchParams.get(
                  "term"
                )
              ).toContain(
                "english[Language]"
              );

              return response({
                esearchresult: {
                  count:
                    "25",

                  idlist: [
                    "12345678",
                  ],
                },
              });
            }

            expect(
              url.pathname.endsWith(
                "/esummary.fcgi"
              )
            ).toBe(
              true
            );

            expect(
              url.searchParams.get(
                "id"
              )
            ).toBe(
              "12345678"
            );

            return response({
              result: {
                uids: [
                  "12345678",
                ],

                "12345678": {
                  uid:
                    "12345678",

                  title:
                    "A study of exoplanet atmospheric chemistry.",

                  fulljournalname:
                    "Journal of Example Science",

                  pubdate:
                    "2026 Aug 10",

                  sortpubdate:
                    "2026/08/10 00:00",

                  authors: [
                    {
                      name:
                        "Example A",
                    },
                  ],

                  articleids: [
                    {
                      idtype:
                        "doi",

                      value:
                        "10.1000/example",
                    },
                  ],
                },
              },
            });
          };

        const provider =
          createPosterBrainPubMedContentApiProvider({
            developerEmail:
              "developer@getpostar.com",

            apiKey:
              "ncbi-key",

            fetchImplementation,
          });

        const registry =
          createPosterBrainContentApiProviderRegistryService({
            providers: [
              provider,
            ],

            environment: {
              NCBI_EUTILS_EMAIL:
                "developer@getpostar.com",
            },
          });

        const result =
          await registry.execute({
            providerKey:
              "pubmed",

            query:
              "exoplanet atmosphere",

            pageSize:
              10,
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
          "1"
        );

        expect(
          result.items[0]
        ).toMatchObject({
          externalContentId:
            "pubmed:12345678",

          title:
            "A study of exoplanet atmospheric chemistry.",

          excerpt:
            "",

          originalUrl:
            "https://pubmed.ncbi.nlm.nih.gov/12345678/",

          publisherName:
            "Journal of Example Science",

          publishedAt:
            "2026-08-10T00:00:00.000Z",

          metadata: {
            pmid:
              "12345678",

            doi:
              "10.1000/example",

            firstAuthor:
              "Example A",
          },
        });

        expect(
          urls.join(" ")
        ).not.toMatch(
          /efetch|abstract/i
        );
      }
    );

    it(
      "maps Smithsonian Open Access records using only metadata, record link and thumbnail reference",
      async () => {
        const fetchImplementation:
          PosterBrainOfficialApiHttpFetch =
          async rawUrl => {
            const url =
              new URL(rawUrl);

            expect(
              url.hostname
            ).toBe(
              "api.si.edu"
            );

            expect(
              url.pathname
            ).toBe(
              "/openaccess/api/v1.0/search"
            );

            expect(
              url.searchParams.get(
                "q"
              )
            ).toBe(
              "Apollo 11"
            );

            expect(
              url.searchParams.get(
                "api_key"
              )
            ).toBe(
              "smithsonian-key"
            );

            return response({
              response: {
                rowCount:
                  200,

                rows: [
                  {
                    id:
                      "edanmdm-nasm_A19700102000",

                    title:
                      "Apollo 11 Command Module",

                    unitCode:
                      "NASM",

                    url:
                      "https://airandspace.si.edu/collection-objects/apollo-11-command-module",

                    content: {
                      descriptiveNonRepeating: {
                        data_source:
                          "National Air and Space Museum",

                        online_media: {
                          media: [
                            {
                              thumbnail:
                                "https://ids.si.edu/ids/deliveryService/id/thumbnail.jpg",

                              /*
                               * Full media content exists upstream,
                               * but Poster provider must ignore it.
                               */
                              content:
                                "https://ids.si.edu/ids/deliveryService/id/full.jpg",
                            },
                          ],
                        },
                      },
                    },
                  },
                ],
              },
            });
          };

        const provider =
          createPosterBrainSmithsonianContentApiProvider({
            apiKey:
              "smithsonian-key",

            fetchImplementation,
          });

        const registry =
          createPosterBrainContentApiProviderRegistryService({
            providers: [
              provider,
            ],

            environment: {
              SMITHSONIAN_API_KEY:
                "smithsonian-key",
            },
          });

        const result =
          await registry.execute({
            providerKey:
              "smithsonian",

            query:
              "Apollo 11",

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
          "1"
        );

        expect(
          result.items[0]
        ).toMatchObject({
          externalContentId:
            "smithsonian:edanmdm-nasm_A19700102000",

          title:
            "Apollo 11 Command Module",

          originalUrl:
            "https://airandspace.si.edu/collection-objects/apollo-11-command-module",

          thumbnailUrl:
            "https://ids.si.edu/ids/deliveryService/id/thumbnail.jpg",

          imageUrl:
            null,

          publisherName:
            "Smithsonian Institution",

          sourceExternalId:
            "NASM",

          sourceName:
            "National Air and Space Museum",
        });

        expect(
          JSON.stringify(
            result.items[0]
          )
        ).not.toContain(
          "/full.jpg"
        );
      }
    );

    it(
      "keeps credential or policy gated additions disabled-safe",
      async () => {
        const providers =
          createPosterBrainOfficialContentApiProvidersFromRuntimeEnv({
            environment:
              {},

            fetchImplementation:
              async () => {
                throw new Error(
                  "must not execute gated provider"
                );
              },
          });

        const keys =
          providers.map(
            provider =>
              provider.providerKey
          );

        expect(
          keys
        ).toEqual([
          "youtube",
          "nasa-images",
          "x",
          "facebook-pages",
          "guardian",
          "pubmed",
          "smithsonian",
        ]);

        const registry =
          createPosterBrainContentApiProviderRegistryService({
            providers,

            environment:
              {},
          });

        const guardian =
          await registry.execute({
            providerKey:
              "guardian",

            query:
              "science",
          });

        const pubmed =
          await registry.execute({
            providerKey:
              "pubmed",

            query:
              "medicine",
          });

        const smithsonian =
          await registry.execute({
            providerKey:
              "smithsonian",

            query:
              "history",
          });

        expect(
          guardian
        ).toMatchObject({
          status:
            "disabled",

          attempts:
            0,

          reason:
            "missing_credentials:GUARDIAN_API_KEY",
        });

        expect(
          pubmed
        ).toMatchObject({
          status:
            "disabled",

          attempts:
            0,

          reason:
            "missing_credentials:NCBI_EUTILS_EMAIL",
        });

        expect(
          smithsonian
        ).toMatchObject({
          status:
            "disabled",

          attempts:
            0,

          reason:
            "missing_credentials:SMITHSONIAN_API_KEY",
        });
      }
    );

    it(
      "locks all seven current official providers to Poster metadata-only copyright policy",
      () => {
        const catalog =
          POSTER_BRAIN_OFFICIAL_CONTENT_API_PROVIDER_CATALOG;

        expect(
          catalog.map(
            entry =>
              entry.providerKey
          )
        ).toEqual([
          "youtube",
          "nasa-images",
          "x",
          "facebook-pages",
          "guardian",
          "pubmed",
          "smithsonian",
        ]);

        expect(
          catalog
        ).toHaveLength(
          7
        );

        for (
          const entry
          of catalog
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

        expect(
          catalog.find(
            entry =>
              entry.providerKey ===
              "guardian"
          )?.accessMode
        ).toBe(
          "permission_review"
        );
      }
    );
  }
);