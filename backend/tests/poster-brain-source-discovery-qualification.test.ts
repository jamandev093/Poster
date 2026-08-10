import {
  describe,
  expect,
  it,
  vi,
} from "vitest";

import {
  createPosterBrainSourceDiscoveryQualificationService,
  createPosterBrainSourceQualificationService,
  createPosterBrainSourceTopicAffinityRepository,
} from "../src/application/poster-brain/index.js";

import type {
  PosterBrainPersistentSourceCandidateRecord,
  PosterBrainSourceCandidateRepository,
  PosterBrainSourceDiscoveryOrchestrator,
  PosterBrainSourceTopicAffinityQueryExecutor,
  PosterBrainSourceTopicAffinityRepository,
} from "../src/application/poster-brain/index.js";

const CANDIDATE =
  "host:science.example";

const TOPIC_ID =
  "00000000-0000-4000-8000-000000000501";

function candidate(
  overrides:
    Partial<PosterBrainPersistentSourceCandidateRecord> = {}
): PosterBrainPersistentSourceCandidateRecord {
  return {
    candidateKey:
      CANDIDATE,

    canonicalHost:
      "science.example",

    canonicalOrigin:
      "https://science.example",

    displayName:
      "Science Example",

    sourceType:
      "publisher",

    status:
      "discovered",

    sourceExternalIds: [
      "science.example",
    ],

    providerKeys: [
      "gdelt",
      "event-registry",
    ],

    firstSeenAt:
      "2026-08-10T10:00:00.000Z",

    lastSeenAt:
      "2026-08-10T12:00:00.000Z",

    observationCount:
      4,

    ...overrides,
  };
}

describe(
  "Poster Brain source-topic affinity and qualification",
  () => {

    it(
      "persists deduplicated source-topic evidence against canonical taxonomy UUIDs",
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
          PosterBrainSourceTopicAffinityQueryExecutor =
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
                  {
                    candidate_key:
                      CANDIDATE,

                    topic_id:
                      TOPIC_ID,

                    topic_slug:
                      "physics",

                    observation_count:
                      "3",

                    provider_count:
                      "2",

                    distinct_content_count:
                      "3",

                    first_seen_at:
                      "2026-08-10T10:00:00Z",

                    last_seen_at:
                      "2026-08-10T12:00:00Z",

                    inserted:
                      true,
                  },
                ],
              };
            },
          };

        const repository =
          createPosterBrainSourceTopicAffinityRepository(
            executor
          );

        const result =
          await repository.observe({
            candidateKey:
              CANDIDATE,

            topicId:
              TOPIC_ID,

            providerKey:
              "GDELT",

            externalContentId:
              "story-1",

            observedAt:
              "2026-08-10T12:00:00Z",
          });

        expect(
          result
        ).toMatchObject({
          inserted:
            true,

          affinity: {
            candidateKey:
              CANDIDATE,

            topicId:
              TOPIC_ID,

            topicSlug:
              "physics",

            observationCount:
              3,

            providerCount:
              2,

            distinctContentCount:
              3,
          },
        });

        expect(
          calls[0]?.sql
        ).toContain(
          "poster_brain_source_topic_affinity_evidence"
        );

        expect(
          calls[0]?.sql
        ).toContain(
          "ON CONFLICT"
        );

        expect(
          calls[0]?.values[1]
        ).toBe(
          TOPIC_ID
        );

        expect(
          calls[0]?.values[3]
        ).toBe(
          "gdelt"
        );
      }
    );

    it(
      "qualifies only sources with independent provider and content evidence",
      () => {
        const service =
          createPosterBrainSourceQualificationService();

        const decision =
          service.evaluate(
            candidate(),
            {
              candidateKey:
                CANDIDATE,

              topicCount:
                2,

              providerCount:
                2,

              distinctContentCount:
                3,

              affinityObservationCount:
                4,
            }
          );

        expect(
          decision
        ).toMatchObject({
          shouldQualify:
            true,

          reason:
            "qualified",

          score:
            85,
        });
      }
    );

    it(
      "does not qualify a repeatedly observed source from only one discovery provider",
      () => {
        const service =
          createPosterBrainSourceQualificationService();

        const decision =
          service.evaluate(
            candidate({
              observationCount:
                20,
            }),
            {
              candidateKey:
                CANDIDATE,

              topicCount:
                3,

              providerCount:
                1,

              distinctContentCount:
                20,

              affinityObservationCount:
                20,
            }
          );

        expect(
          decision.shouldQualify
        ).toBe(
          false
        );

        expect(
          decision.reason
        ).toBe(
          "insufficient_provider_diversity"
        );
      }
    );

    it(
      "preserves explicit rejected lifecycle state regardless of discovery score",
      () => {
        const service =
          createPosterBrainSourceQualificationService();

        const decision =
          service.evaluate(
            candidate({
              status:
                "rejected",

              observationCount:
                100,
            }),
            {
              candidateKey:
                CANDIDATE,

              topicCount:
                10,

              providerCount:
                4,

              distinctContentCount:
                100,

              affinityObservationCount:
                100,
            }
          );

        expect(
          decision.shouldQualify
        ).toBe(
          false
        );

        expect(
          decision.reason
        ).toBe(
          "existing_status_preserved"
        );
      }
    );

    it(
      "runs discovery, persists taxonomy affinity, and promotes independently supported sources",
      async () => {
        const discoveryOrchestrator = {
          run:
            vi.fn(
              async () => ({
                parentTopicId:
                  TOPIC_ID,

                parentTopicSlug:
                  "physics",

                plannedTopicCount:
                  1,

                plannedQueryCount:
                  1,

                providerCount:
                  2,

                providerRequestCount:
                  2,

                succeededRequestCount:
                  2,

                disabledRequestCount:
                  0,

                failedRequestCount:
                  0,

                discoveredItemCount:
                  3,

                rejectedItemCount:
                  0,

                persistedObservationCount:
                  3,

                uniqueCandidateCount:
                  1,

                observations: [
                  {
                    candidateKey:
                      CANDIDATE,

                    topicId:
                      TOPIC_ID,

                    topicSlug:
                      "physics",

                    queryKey:
                      "physics-id:physics",

                    providerKey:
                      "gdelt",

                    externalContentId:
                      "story-1",
                  },

                  {
                    candidateKey:
                      CANDIDATE,

                    topicId:
                      TOPIC_ID,

                    topicSlug:
                      "physics",

                    queryKey:
                      "physics-id:physics",

                    providerKey:
                      "event-registry",

                    externalContentId:
                      "story-2",
                  },

                  {
                    candidateKey:
                      CANDIDATE,

                    topicId:
                      TOPIC_ID,

                    topicSlug:
                      "physics",

                    queryKey:
                      "physics-id:physics",

                    providerKey:
                      "gdelt",

                    externalContentId:
                      "story-3",
                  },
                ],
              })
            ),
        } as unknown as PosterBrainSourceDiscoveryOrchestrator;

        const observe =
          vi.fn(
            async () => ({
              inserted:
                true,

              affinity: {
                candidateKey:
                  CANDIDATE,

                topicId:
                  TOPIC_ID,

                topicSlug:
                  "physics",

                observationCount:
                  3,

                providerCount:
                  2,

                distinctContentCount:
                  3,

                firstSeenAt:
                  "2026-08-10T10:00:00.000Z",

                lastSeenAt:
                  "2026-08-10T12:00:00.000Z",
              },
            })
          );

        const affinityRepository = {
          observe,

          async listForCandidate() {
            return [];
          },

          async summarizeCandidate() {
            return {
              candidateKey:
                CANDIDATE,

              topicCount:
                1,

              providerCount:
                2,

              distinctContentCount:
                3,

              affinityObservationCount:
                3,
            };
          },
        } satisfies PosterBrainSourceTopicAffinityRepository;

        const setStatus =
          vi.fn(
            async (
              _candidateKey:
                string,
              status:
                "discovered" |
                "qualified" |
                "rejected"
            ) =>
              candidate({
                status,
              })
          );

        const sourceCandidateRepository = {
          async observe() {
            throw new Error(
              "not used"
            );
          },

          async get() {
            return candidate({
              observationCount:
                3,
            });
          },

          async list() {
            return [];
          },

          setStatus,
        } satisfies PosterBrainSourceCandidateRepository;

        const service =
          createPosterBrainSourceDiscoveryQualificationService({
            discoveryOrchestrator,
            sourceCandidateRepository,
            affinityRepository,

            now:
              () =>
                "2026-08-10T12:00:00Z",
          });

        const result =
          await service.run({
            parentTopicSlug:
              "physics",
          });

        expect(
          observe
        ).toHaveBeenCalledTimes(
          3
        );

        expect(
          setStatus
        ).toHaveBeenCalledWith(
          CANDIDATE,
          "qualified"
        );

        expect(
          result
        ).toMatchObject({
          affinityInsertedCount:
            3,

          affinityDuplicateCount:
            0,

          affinityFailureCount:
            0,

          qualifiedCandidateCount:
            1,

          qualificationFailureCount:
            0,
        });

        expect(
          result.decisions[0]
        ).toMatchObject({
          candidateKey:
            CANDIDATE,

          shouldQualify:
            true,

          reason:
            "qualified",

          score:
            80,
        });
      }
    );
  }
);