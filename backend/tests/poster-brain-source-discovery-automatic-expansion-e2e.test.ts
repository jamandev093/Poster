import {
  describe,
  expect,
  it,
} from "vitest";

import {
  createPosterBrainSourceDiscoveryRuntimeComposition,
} from "../src/application/poster-brain/index.js";

import type {
  PosterBrainPersistentSourceCandidateRecord,
  PosterBrainSourceCandidateRepository,
  PosterBrainSourceDiscoveryProviderExecutor,
  PosterBrainSourceDiscoveryRuntimeRepository,
  PosterBrainSourceDiscoveryTaxonomyTopic,
  PosterBrainSourceTopicAffinityObservation,
  PosterBrainSourceTopicAffinityRecord,
  PosterBrainSourceTopicAffinityRepository,
} from "../src/application/poster-brain/index.js";

import type {
  PosterBrainOfficialApiHttpFetch,
} from "../src/application/poster-brain/official-content-api-http.js";

const ROOT_TOPIC_ID =
  "00000000-0000-4000-8000-000000000501";

const CHILD_TOPIC_ID =
  "00000000-0000-4000-8000-000000000502";

const NOW =
  "2026-08-10T15:00:00.000Z";

const TOPICS:
  readonly PosterBrainSourceDiscoveryTaxonomyTopic[] =
  [
    {
      id:
        ROOT_TOPIC_ID,

      slug:
        "science",

      name:
        "Science",

      description:
        "Science",

      parentTopicId:
        null,

      sortOrder:
        100,
    },

    {
      id:
        CHILD_TOPIC_ID,

      slug:
        "physics",

      name:
        "Physics",

      description:
        "Physics",

      parentTopicId:
        ROOT_TOPIC_ID,

      sortOrder:
        110,
    },
  ];

function createCandidateMemory() {
  const records =
    new Map<
      string,
      PosterBrainPersistentSourceCandidateRecord
    >();

  const repository = {
    async observe(
      candidate
    ) {
      const current =
        records.get(
          candidate.candidateKey
        );

      const next:
        PosterBrainPersistentSourceCandidateRecord =
        current === undefined
          ? {
              candidateKey:
                candidate.candidateKey,

              canonicalHost:
                candidate.canonicalHost,

              canonicalOrigin:
                candidate.canonicalOrigin,

              displayName:
                candidate.displayName,

              sourceType:
                candidate.sourceType,

              status:
                candidate.status,

              sourceExternalIds:
                [
                  ...candidate
                    .sourceExternalIds,
                ],

              providerKeys:
                [
                  ...candidate
                    .providerKeys,
                ],

              firstSeenAt:
                candidate.firstSeenAt,

              lastSeenAt:
                candidate.lastSeenAt,

              observationCount:
                candidate.observationCount,
            }
          : {
              ...current,

              sourceExternalIds:
                [
                  ...new Set([
                    ...current
                      .sourceExternalIds,

                    ...candidate
                      .sourceExternalIds,
                  ]),
                ].sort(),

              providerKeys:
                [
                  ...new Set([
                    ...current
                      .providerKeys,

                    ...candidate
                      .providerKeys,
                  ]),
                ].sort(),

              firstSeenAt:
                current.firstSeenAt <=
                candidate.firstSeenAt
                  ? current.firstSeenAt
                  : candidate.firstSeenAt,

              lastSeenAt:
                current.lastSeenAt >=
                candidate.lastSeenAt
                  ? current.lastSeenAt
                  : candidate.lastSeenAt,

              observationCount:
                current.observationCount +
                candidate.observationCount,
            };

      records.set(
        next.candidateKey,
        next
      );

      return next;
    },

    async get(
      candidateKey
    ) {
      return (
        records.get(
          candidateKey
        ) ??
        null
      );
    },

    async list(
      options = {}
    ) {
      return [
        ...records.values(),
      ]
        .filter(
          record =>
            options.status ===
              undefined ||
            record.status ===
              options.status
        )
        .sort(
          (
            left,
            right
          ) =>
            left.candidateKey
              .localeCompare(
                right.candidateKey
              )
        );
    },

    async setStatus(
      candidateKey,
      status
    ) {
      const current =
        records.get(
          candidateKey
        );

      if (current === undefined) {
        throw new Error(
          "Candidate not found."
        );
      }

      const next = {
        ...current,
        status,
      };

      records.set(
        candidateKey,
        next
      );

      return next;
    },
  } satisfies PosterBrainSourceCandidateRepository;

  return {
    records,
    repository,
  };
}

function createAffinityMemory() {
  const evidence:
    PosterBrainSourceTopicAffinityObservation[] =
    [];

  const identities =
    new Set<string>();

  function rowsFor(
    candidateKey:
      string,

    topicId?:
      string
  ) {
    return evidence.filter(
      row =>
        row.candidateKey ===
          candidateKey &&
        (
          topicId ===
            undefined ||
          row.topicId ===
            topicId
        )
    );
  }

  function affinity(
    candidateKey:
      string,

    topicId:
      string
  ): PosterBrainSourceTopicAffinityRecord {
    const rows =
      rowsFor(
        candidateKey,
        topicId
      );

    const topic =
      TOPICS.find(
        item =>
          item.id ===
          topicId
      );

    if (
      rows.length === 0 ||
      topic === undefined
    ) {
      throw new Error(
        "Affinity evidence missing."
      );
    }

    const instants =
      rows
        .map(
          row =>
            row.observedAt
        )
        .sort();

    return {
      candidateKey,
      topicId,

      topicSlug:
        topic.slug,

      observationCount:
        rows.length,

      providerCount:
        new Set(
          rows.map(
            row =>
              row.providerKey
          )
        ).size,

      distinctContentCount:
        new Set(
          rows.map(
            row =>
              [
                row.providerKey,
                row.externalContentId,
              ].join("|")
          )
        ).size,

      firstSeenAt:
        instants[0]!,

      lastSeenAt:
        instants[
          instants.length - 1
        ]!,
    };
  }

  const repository = {
    async observe(
      input
    ) {
      const identity =
        [
          input.candidateKey,
          input.topicId,
          input.providerKey,
          input.externalContentId,
        ].join("|");

      const inserted =
        !identities.has(
          identity
        );

      if (inserted) {
        identities.add(
          identity
        );

        evidence.push({
          ...input,
        });
      }

      return {
        inserted,

        affinity:
          affinity(
            input.candidateKey,
            input.topicId
          ),
      };
    },

    async listForCandidate(
      candidateKey
    ) {
      const topicIds =
        [
          ...new Set(
            rowsFor(
              candidateKey
            )
              .map(
                row =>
                  row.topicId
              )
          ),
        ].sort();

      return topicIds.map(
        topicId =>
          affinity(
            candidateKey,
            topicId
          )
      );
    },

    async summarizeCandidate(
      candidateKey
    ) {
      const rows =
        rowsFor(
          candidateKey
        );

      if (rows.length === 0) {
        return null;
      }

      return {
        candidateKey,

        topicCount:
          new Set(
            rows.map(
              row =>
                row.topicId
            )
          ).size,

        providerCount:
          new Set(
            rows.map(
              row =>
                row.providerKey
            )
          ).size,

        distinctContentCount:
          new Set(
            rows.map(
              row =>
                [
                  row.providerKey,
                  row.externalContentId,
                ].join("|")
            )
          ).size,

        affinityObservationCount:
          rows.length,
      };
    },
  } satisfies PosterBrainSourceTopicAffinityRepository;

  return {
    evidence,
    repository,
  };
}

function createRuntimeMemory() {
  let claimed =
    false;

  let success:
    Parameters<
      PosterBrainSourceDiscoveryRuntimeRepository[
        "markSucceeded"
      ]
    >[0] |
    null =
    null;

  let failure:
    Parameters<
      PosterBrainSourceDiscoveryRuntimeRepository[
        "markFailed"
      ]
    >[0] |
    null =
    null;

  const repository = {
    async claimDueRoots() {
      if (claimed) {
        return [];
      }

      claimed =
        true;

      return [
        {
          rootTopicId:
            ROOT_TOPIC_ID,

          rootTopicSlug:
            "science",

          rootTopicName:
            "Science",

          sortOrder:
            100,

          consecutiveFailures:
            0,
        },
      ];
    },

    async markSucceeded(
      input
    ) {
      success =
        input;
    },

    async markFailed(
      input
    ) {
      failure =
        input;
    },
  } satisfies PosterBrainSourceDiscoveryRuntimeRepository;

  return {
    repository,

    success:
      () =>
        success,

    failure:
      () =>
        failure,
  };
}

describe(
  "Poster Brain automatic source expansion E2E",
  () => {

    it(
      "runs the production provider engine through GDELT into candidate and affinity state without activating gated providers",
      async () => {
        const candidates =
          createCandidateMemory();

        const affinities =
          createAffinityMemory();

        const runtime =
          createRuntimeMemory();

        const fetched:
          string[] =
          [];

        const fetchImplementation:
          PosterBrainOfficialApiHttpFetch =
          async rawUrl => {
            const url =
              new URL(
                rawUrl
              );

            fetched.push(
              url.toString()
            );

            expect(
              url.origin
            ).toBe(
              "https://api.gdeltproject.org"
            );

            const query =
              url.searchParams
                .get(
                  "query"
                ) ??
              "science";

            const key =
              query
                .toLowerCase()
                .replace(
                  /[^a-z0-9]+/g,
                  "-"
                )
                .replace(
                  /^-|-$/g,
                  ""
                );

            return {
              ok:
                true,

              status:
                200,

              async json() {
                return {
                  articles:
                    [
                      1,
                      2,
                      3,
                    ].map(
                      index => ({
                        url:
                          `https://science.example/articles/${key}-${index}`,

                        title:
                          `Science discovery ${index}`,

                        seendate:
                          "20260810T120000Z",

                        socialimage:
                          `https://science.example/images/${index}.jpg`,

                        domain:
                          "science.example",

                        language:
                          "English",

                        sourcecountry:
                          "United States",

                        /*
                         * Provider mapper must ignore this.
                         */
                        translatedcontent:
                          "FULL CONTENT MUST NEVER ENTER POSTER",
                      })
                    ),
                };
              },
            };
          };

        const composition =
          createPosterBrainSourceDiscoveryRuntimeComposition({
            environment:
              {},

            fetchImplementation,

            now:
              () =>
                NOW,

            listActiveTopics:
              async () =>
                TOPICS,

            sourceCandidateRepository:
              candidates.repository,

            affinityRepository:
              affinities.repository,

            runtimeRepository:
              runtime.repository,
          });

        expect(
          composition.providerKeys
        ).toContain(
          "gdelt"
        );

        const result =
          await composition
            .runtimeService
            .runDueSourceDiscovery({
              maxRoots:
                1,

              maxDepth:
                1,

              maxTopics:
                2,

              pageSize:
                3,

              maxPagesPerQuery:
                1,
            });

        expect(
          result.status
        ).toBe(
          "completed"
        );

        expect(
          fetched.length
        ).toBeGreaterThan(
          0
        );

        expect(
          fetched.every(
            value =>
              value.startsWith(
                "https://api.gdeltproject.org/"
              )
          )
        ).toBe(
          true
        );

        expect(
          candidates.records
            .size
        ).toBe(
          1
        );

        const candidate =
          candidates.records.get(
            "host:science.example"
          );

        expect(
          candidate
        ).toMatchObject({
          canonicalHost:
            "science.example",

          sourceType:
            "publisher",

          status:
            "discovered",
        });

        /*
         * One approved provider alone is intentionally not enough
         * for automatic qualification. No confidence is invented.
         */
        expect(
          candidate?.providerKeys
        ).toEqual([
          "gdelt",
        ]);

        expect(
          affinities.evidence
            .length
        ).toBeGreaterThan(
          0
        );

        expect(
          runtime.success()
        ).toEqual(
          expect.objectContaining({
            summary:
              expect.objectContaining({
                uniqueCandidateCount:
                  1,

                qualifiedCandidateCount:
                  0,
              }),
          })
        );

        expect(
          runtime.failure()
        ).toBeNull();
      }
    );

    it(
      "automatically qualifies a source only after independent multi-provider evidence reaches the locked threshold",
      async () => {
        const candidates =
          createCandidateMemory();

        const affinities =
          createAffinityMemory();

        const runtime =
          createRuntimeMemory();

        const providerExecutor = {
          providerKeys: [
            "provider-a",
            "provider-b",
          ],

          async execute(
            input
          ) {
            return {
              status:
                "succeeded" as const,

              items:
                [
                  1,
                  2,
                  3,
                ].map(
                  index => ({
                    externalContentId:
                      `${input.providerKey}-${index}`,

                    originalUrl:
                      `https://science.example/articles/${input.providerKey}-${index}`,

                    publisherName:
                      "Science Example",

                    sourceExternalId:
                      "science.example",

                    sourceName:
                      "Science Example",
                  })
                ),

              nextCursor:
                null,
            };
          },
        } satisfies PosterBrainSourceDiscoveryProviderExecutor;

        const composition =
          createPosterBrainSourceDiscoveryRuntimeComposition({
            providerExecutor,

            now:
              () =>
                NOW,

            listActiveTopics:
              async () =>
                [
                  TOPICS[0]!,
                ],

            sourceCandidateRepository:
              candidates.repository,

            affinityRepository:
              affinities.repository,

            runtimeRepository:
              runtime.repository,
          });

        const result =
          await composition
            .runtimeService
            .runDueSourceDiscovery({
              maxRoots:
                1,

              maxDepth:
                0,

              maxTopics:
                1,

              pageSize:
                3,

              maxPagesPerQuery:
                1,
            });

        expect(
          result.status
        ).toBe(
          "completed"
        );

        expect(
          result.roots[0]
        ).toMatchObject({
          status:
            "succeeded",

          uniqueCandidateCount:
            1,

          qualifiedCandidateCount:
            1,
        });

        expect(
          candidates.records.get(
            "host:science.example"
          )
        ).toMatchObject({
          providerKeys: [
            "provider-a",
            "provider-b",
          ],

          observationCount:
            6,

          status:
            "qualified",
        });

        const summary =
          await affinities
            .repository
            .summarizeCandidate(
              "host:science.example"
            );

        expect(
          summary
        ).toMatchObject({
          providerCount:
            2,

          distinctContentCount:
            6,

          topicCount:
            1,

          affinityObservationCount:
            6,
        });

        expect(
          runtime.success()
        ).toEqual(
          expect.objectContaining({
            summary:
              expect.objectContaining({
                qualifiedCandidateCount:
                  1,
              }),
          })
        );

        expect(
          runtime.failure()
        ).toBeNull();
      }
    );
  }
);