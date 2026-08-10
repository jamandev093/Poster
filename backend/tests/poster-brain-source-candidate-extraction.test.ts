import {
  describe,
  expect,
  it,
} from "vitest";

import {
  createPosterBrainSourceCandidateMemoryRegistry,
  extractPosterBrainSourceCandidate,
} from "../src/application/poster-brain/index.js";

describe(
  "Poster Brain source candidate extraction",
  () => {

    it(
      "extracts a normalized publisher candidate from discovery metadata",
      () => {
        const candidate =
          extractPosterBrainSourceCandidate({
            providerKey:
              "newsapi",

            externalContentId:
              "article-1",

            originalUrl:
              "https://www.example.com/science/article-1?utm_source=test",

            publisherName:
              "Example Science",

            sourceExternalId:
              "example-science",

            sourceName:
              "Example Science",

            sourceUrl:
              "https://www.example.com/science",

            observedAt:
              "2026-08-10T12:00:00Z",
          });

        expect(
          candidate
        ).toMatchObject({
          candidateKey:
            "host:example.com",

          canonicalHost:
            "example.com",

          canonicalOrigin:
            "https://example.com",

          displayName:
            "Example Science",

          sourceType:
            "publisher",

          status:
            "discovered",

          sourceExternalIds: [
            "example-science",
          ],

          providerKeys: [
            "newsapi",
          ],

          firstSeenAt:
            "2026-08-10T12:00:00.000Z",

          lastSeenAt:
            "2026-08-10T12:00:00.000Z",

          observationCount:
            1,
        });
      }
    );

    it(
      "deduplicates the same source observed through multiple discovery providers",
      () => {
        const registry =
          createPosterBrainSourceCandidateMemoryRegistry();

        const first =
          extractPosterBrainSourceCandidate({
            providerKey:
              "gdelt",

            externalContentId:
              "gdelt-1",

            originalUrl:
              "https://science.example/article/one",

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

        const second =
          extractPosterBrainSourceCandidate({
            providerKey:
              "event-registry",

            externalContentId:
              "er-1",

            originalUrl:
              "https://www.science.example/article/two",

            publisherName:
              "Science Example",

            sourceExternalId:
              "source-123",

            sourceName:
              "Science Example",

            sourceUrl:
              "https://science.example/",

            observedAt:
              "2026-08-10T11:00:00Z",
          });

        expect(
          first
        ).not.toBeNull();

        expect(
          second
        ).not.toBeNull();

        registry.observe(
          first!
        );

        const merged =
          registry.observe(
            second!
          );

        expect(
          registry.list()
        ).toHaveLength(
          1
        );

        expect(
          merged
        ).toMatchObject({
          candidateKey:
            "host:science.example",

          canonicalHost:
            "science.example",

          providerKeys: [
            "event-registry",
            "gdelt",
          ],

          sourceExternalIds: [
            "science.example",
            "source-123",
          ],

          firstSeenAt:
            "2026-08-10T10:00:00.000Z",

          lastSeenAt:
            "2026-08-10T11:00:00.000Z",

          observationCount:
            2,
        });

        expect(
          merged.evidence
        ).toHaveLength(
          2
        );
      }
    );

    it(
      "recognizes institutions separately from ordinary publishers",
      () => {
        const candidate =
          extractPosterBrainSourceCandidate({
            providerKey:
              "crossref",

            externalContentId:
              "crossref-1",

            originalUrl:
              "https://research.nasa.gov/article",

            publisherName:
              "NASA",

            sourceExternalId:
              "nasa",

            sourceName:
              "National Aeronautics and Space Administration",

            sourceUrl:
              "https://www.nasa.gov/",

            observedAt:
              "2026-08-10T12:00:00Z",
          });

        expect(
          candidate?.sourceType
        ).toBe(
          "institution"
        );
      }
    );

    it(
      "treats publisher channels on major platforms as channel candidates",
      () => {
        const candidate =
          extractPosterBrainSourceCandidate({
            providerKey:
              "youtube",

            externalContentId:
              "youtube:video-1",

            originalUrl:
              "https://www.youtube.com/watch?v=video-1",

            publisherName:
              "NASA",

            sourceExternalId:
              "UCNASA",

            sourceName:
              "NASA",

            sourceUrl:
              "https://www.youtube.com/channel/UCNASA",

            observedAt:
              "2026-08-10T12:00:00Z",
          });

        expect(
          candidate
        ).toMatchObject({
          candidateKey:
            "host:youtube.com",

          canonicalHost:
            "youtube.com",

          sourceType:
            "channel",
        });
      }
    );

    it(
      "rejects invalid non-web destination URLs instead of inventing source identities",
      () => {
        expect(
          extractPosterBrainSourceCandidate({
            providerKey:
              "newsapi",

            externalContentId:
              "bad",

            originalUrl:
              "javascript:alert(1)",

            publisherName:
              "Bad Source",

            sourceExternalId:
              null,

            sourceName:
              null,

            sourceUrl:
              null,
          })
        ).toBeNull();
      }
    );

    it(
      "preserves observation count while deduplicating repeated evidence",
      () => {
        const registry =
          createPosterBrainSourceCandidateMemoryRegistry();

        const candidate =
          extractPosterBrainSourceCandidate({
            providerKey:
              "newscatcher",

            externalContentId:
              "article-1",

            originalUrl:
              "https://publisher.example/article-1",

            publisherName:
              "Publisher Example",

            sourceExternalId:
              "publisher.example",

            sourceName:
              "Publisher Example",

            sourceUrl:
              "https://publisher.example/",

            observedAt:
              "2026-08-10T12:00:00Z",
          });

        expect(
          candidate
        ).not.toBeNull();

        registry.observe(
          candidate!
        );

        const second =
          registry.observe(
            candidate!
          );

        expect(
          second.evidence
        ).toHaveLength(
          1
        );

        expect(
          second.observationCount
        ).toBe(
          2
        );
      }
    );
  }
);