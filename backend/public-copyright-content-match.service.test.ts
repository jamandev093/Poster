import {
  describe,
  expect,
  it,
  vi,
} from "vitest";

import {
  createPublicCopyrightService,
} from "./src/application/copyright/public-copyright.service.js";

import type {
  DiscoveryContentRecord,
} from "./src/domains/content-sources/index.js";

const NOW =
  new Date(
    "2026-08-06T15:45:00.000Z"
  );

const CONTENT =
  {
    id:
      "00000000-0000-4000-8000-000000000501",

    publicId:
      "CNT-2003",

    sourceId:
      "00000000-0000-4000-8000-000000000401",

    title:
      "Example discovery record",

    publisherName:
      "Example Publisher",

    originalUrl:
      "https://publisher.example/original-story",

    acquisitionMethod:
      "rss",

    status:
      "active",

    publishedAt:
      null,

    addedAt:
      NOW,

    removedAt:
      null,

    removalReason:
      null,

    removalNote:
      null,

    copyrightCaseId:
      null,

    copyrightClaimant:
      null,

    preventReimport:
      false,

    createdAt:
      NOW,

    updatedAt:
      NOW,

    rowVersion:
      "1",
  } satisfies DiscoveryContentRecord;

function createMocks() {
  const findContentByPublicId =
    vi.fn()
      .mockImplementation(
        async publicId =>
          publicId === "CNT-2003"
            ? CONTENT
            : null
      );

  const findContentByOriginalUrl =
    vi.fn()
      .mockImplementation(
        async originalUrl =>
          originalUrl ===
          "https://publisher.example/original-story"
            ? CONTENT
            : null
      );

  const service =
    createPublicCopyrightService({
      dependencies: {
        findContentByPublicId,
        findContentByOriginalUrl,
      },
    });

  return {
    service,
    findContentByPublicId,
    findContentByOriginalUrl,
  };
}

describe(
  "Public Copyright content match service",
  () => {
    it(
      "matches a Poster Content ID and returns safe public fields only",
      async () => {
        const mocks =
          createMocks();

        const match =
          await mocks.service.lookupContentMatches?.({
            identifiers: [
              " cnt-2003 ",
            ],
          });

        expect(
          mocks.findContentByPublicId
        ).toHaveBeenCalledWith(
          "CNT-2003"
        );

        expect(
          match
        ).toMatchObject({
          exactMatchCount:
            1,

          notFoundCount:
            0,

          invalidCount:
            0,

          duplicateCount:
            0,

          results: [
            {
              input:
                " cnt-2003 ",

              status:
                "exact_match",

              content: {
                publicId:
                  "CNT-2003",

                title:
                  "Example discovery record",

                publisherName:
                  "Example Publisher",

                originalUrl:
                  "https://publisher.example/original-story",

                status:
                  "active",
              },
            },
          ],
        });

        expect(
          JSON.stringify(
            match
          )
        ).not.toContain(
          "00000000-0000-4000"
        );

        expect(
          JSON.stringify(
            match
          )
        ).not.toContain(
          "rowVersion"
        );
      }
    );

    it(
      "matches an original URL using the existing discovery-content resolver",
      async () => {
        const mocks =
          createMocks();

        const match =
          await mocks.service.lookupContentMatches?.({
            identifiers: [
              "https://publisher.example/original-story",
            ],
          });

        expect(
          mocks.findContentByOriginalUrl
        ).toHaveBeenCalledWith(
          "https://publisher.example/original-story"
        );

        expect(
          match?.results[0]?.status
        ).toBe(
          "exact_match"
        );
      }
    );

    it(
      "marks another identifier for the same content as duplicate",
      async () => {
        const mocks =
          createMocks();

        const match =
          await mocks.service.lookupContentMatches?.({
            identifiers: [
              "CNT-2003",
              "https://poster.example/content/CNT-2003",
            ],
          });

        expect(
          match
        ).toMatchObject({
          exactMatchCount:
            1,

          duplicateCount:
            1,

          results: [
            {
              status:
                "exact_match",
            },
            {
              status:
                "duplicate",

              duplicateOfPublicId:
                "CNT-2003",
            },
          ],
        });
      }
    );

    it(
      "returns invalid and not-found results without exposing inventory",
      async () => {
        const mocks =
          createMocks();

        const match =
          await mocks.service.lookupContentMatches?.({
            identifiers: [
              "not a content identifier",
              "CNT-9999",
            ],
          });

        expect(
          match
        ).toMatchObject({
          exactMatchCount:
            0,

          invalidCount:
            1,

          notFoundCount:
            1,

          results: [
            {
              status:
                "invalid",
            },
            {
              status:
                "not_found",
            },
          ],
        });
      }
    );

    it(
      "rejects more than 100 identifiers before repository access",
      async () => {
        const mocks =
          createMocks();

        await expect(
          mocks.service.lookupContentMatches?.({
            identifiers:
              Array.from(
                {
                  length:
                    101,
                },
                (
                  _,
                  index
                ) => `CNT-${index + 1}`
              ),
          })
        ).rejects.toMatchObject({
          code:
            "COPYRIGHT_CONTENT_MATCH_VALIDATION_FAILED",

          statusCode:
            400,
        });

        expect(
          mocks.findContentByPublicId
        ).not.toHaveBeenCalled();
      }
    );
  }
);