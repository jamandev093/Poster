import {
  describe,
  expect,
  it,
} from "vitest";

import {
  createPosterBrainSourceCandidateRepository,
  extractPosterBrainSourceCandidate,
} from "../src/application/poster-brain/index.js";

import type {
  PosterBrainSourceCandidateQueryExecutor,
} from "../src/application/poster-brain/index.js";

function databaseRow(
  overrides:
    Partial<
      Record<
        string,
        unknown
      >
    > = {}
): Record<
  string,
  unknown
> {
  return {
    candidate_key:
      "host:science.example",

    canonical_host:
      "science.example",

    canonical_origin:
      "https://science.example",

    display_name:
      "Science Example",

    source_type:
      "publisher",

    status:
      "discovered",

    source_external_ids: [
      "science.example",
    ],

    provider_keys: [
      "gdelt",
    ],

    first_seen_at:
      "2026-08-10T10:00:00.000Z",

    last_seen_at:
      "2026-08-10T10:00:00.000Z",

    observation_count:
      "1",

    ...overrides,
  };
}

describe(
  "Poster Brain persistent source candidate repository",
  () => {

    it(
      "atomically upserts a discovered source and its provenance evidence",
      async () => {
        const calls:
          Array<{
            readonly sql:
              string;

            readonly values:
              readonly unknown[];
          }> =
          [];

        const executor:
          PosterBrainSourceCandidateQueryExecutor =
          {
            async query(
              sql,
              values = []
            ) {
              calls.push({
                sql,
                values,
              });

              return {
                rows: [
                  databaseRow(),
                ],
              };
            },
          };

        const repository =
          createPosterBrainSourceCandidateRepository(
            executor
          );

        const candidate =
          extractPosterBrainSourceCandidate({
            providerKey:
              "gdelt",

            externalContentId:
              "gdelt-1",

            originalUrl:
              "https://science.example/article/1",

            publisherName:
              "Science Example",

            sourceExternalId:
              "science.example",

            sourceName:
              "Science Example",

            sourceUrl:
              null,

            observedAt:
              "2026-08-10T10:00:00Z",
          });

        expect(
          candidate
        ).not.toBeNull();

        const persisted =
          await repository.observe(
            candidate!
          );

        expect(
          persisted
        ).toMatchObject({
          candidateKey:
            "host:science.example",

          canonicalHost:
            "science.example",

          status:
            "discovered",

          providerKeys: [
            "gdelt",
          ],

          observationCount:
            1,
        });

        expect(
          calls
        ).toHaveLength(
          1
        );

        expect(
          calls[0]?.sql
        ).toContain(
          "INSERT INTO app.poster_brain_source_candidates"
        );

        expect(
          calls[0]?.sql
        ).toContain(
          "INSERT INTO app.poster_brain_source_candidate_evidence"
        );

        expect(
          calls[0]?.sql
        ).toContain(
          "ON CONFLICT (candidate_key)"
        );

        expect(
          calls[0]?.sql
        ).toContain(
          "observation_count"
        );

        const evidenceJson =
          String(
            calls[0]?.values[11]
          );

        expect(
          evidenceJson
        ).toContain(
          '"provider_key":"gdelt"'
        );

        expect(
          evidenceJson
        ).toContain(
          '"external_content_id":"gdelt-1"'
        );

        expect(
          evidenceJson
        ).not.toContain(
          "userId"
        );

        expect(
          evidenceJson
        ).not.toContain(
          "mobile_ad"
        );
      }
    );

    it(
      "reads a persisted candidate using canonical host identity",
      async () => {
        const executor:
          PosterBrainSourceCandidateQueryExecutor =
          {
            async query() {
              return {
                rows: [
                  databaseRow({
                    provider_keys: [
                      "event-registry",
                      "gdelt",
                    ],

                    observation_count:
                      "4",
                  }),
                ],
              };
            },
          };

        const repository =
          createPosterBrainSourceCandidateRepository(
            executor
          );

        const result =
          await repository.get(
            "host:science.example"
          );

        expect(
          result
        ).toMatchObject({
          candidateKey:
            "host:science.example",

          providerKeys: [
            "event-registry",
            "gdelt",
          ],

          observationCount:
            4,
        });
      }
    );

    it(
      "supports explicit discovered to qualified or rejected lifecycle changes",
      async () => {
        const calls:
          Array<{
            readonly sql:
              string;

            readonly values:
              readonly unknown[];
          }> =
          [];

        const executor:
          PosterBrainSourceCandidateQueryExecutor =
          {
            async query(
              sql,
              values = []
            ) {
              calls.push({
                sql,
                values,
              });

              return {
                rows: [
                  databaseRow({
                    status:
                      values[1] ??
                      "discovered",
                  }),
                ],
              };
            },
          };

        const repository =
          createPosterBrainSourceCandidateRepository(
            executor
          );

        const qualified =
          await repository.setStatus(
            "host:science.example",
            "qualified"
          );

        expect(
          qualified.status
        ).toBe(
          "qualified"
        );

        expect(
          calls[0]?.sql
        ).toContain(
          "UPDATE app.poster_brain_source_candidates"
        );

        expect(
          calls[0]?.values
        ).toEqual([
          "host:science.example",
          "qualified",
        ]);
      }
    );

    it(
      "lists discovery candidates with bounded status filtering",
      async () => {
        const calls:
          Array<{
            readonly values:
              readonly unknown[];
          }> =
          [];

        const executor:
          PosterBrainSourceCandidateQueryExecutor =
          {
            async query(
              _sql,
              values = []
            ) {
              calls.push({
                values,
              });

              return {
                rows: [
                  databaseRow({
                    status:
                      "qualified",
                  }),
                ],
              };
            },
          };

        const repository =
          createPosterBrainSourceCandidateRepository(
            executor
          );

        const result =
          await repository.list({
            status:
              "qualified",

            limit:
              50,
          });

        expect(
          result
        ).toHaveLength(
          1
        );

        expect(
          result[0]?.status
        ).toBe(
          "qualified"
        );

        expect(
          calls[0]?.values
        ).toEqual([
          "qualified",
          50,
        ]);

        await expect(
          repository.list({
            limit:
              1001,
          })
        ).rejects.toThrow(
          "between 1 and 1000"
        );
      }
    );

    it(
      "refuses malformed database rows rather than inventing registry state",
      async () => {
        const executor:
          PosterBrainSourceCandidateQueryExecutor =
          {
            async query() {
              return {
                rows: [
                  databaseRow({
                    observation_count:
                      "0",
                  }),
                ],
              };
            },
          };

        const repository =
          createPosterBrainSourceCandidateRepository(
            executor
          );

        await expect(
          repository.get(
            "host:science.example"
          )
        ).rejects.toThrow(
          "observation_count"
        );
      }
    );
  }
);