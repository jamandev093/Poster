import {
  describe,
  expect,
  it,
  vi,
} from "vitest";

import {
  buildApp,
} from "./src/app.js";

import type {
  PublicCopyrightContentMatchLookup,
  PublicCopyrightService,
} from "./src/application/copyright/index.js";

const MATCH_LOOKUP =
  {
    results: [
      {
        input:
          "CNT-2003",

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

    exactMatchCount:
      1,

    notFoundCount:
      0,

    invalidCount:
      0,

    duplicateCount:
      0,
  } satisfies PublicCopyrightContentMatchLookup;

function createServiceMocks() {
  const submitSingleClaim =
    vi.fn(
      async () => {
        throw new Error(
          "submitSingleClaim should not be called by content-match app tests."
        );
      }
    );

  const submitBulkRemoval =
    vi.fn(
      async () => {
        throw new Error(
          "submitBulkRemoval should not be called by content-match app tests."
        );
      }
    );

  const lookupStatus =
    vi.fn(
      async () => {
        throw new Error(
          "lookupStatus should not be called by content-match app tests."
        );
      }
    );

  const lookupContentMatches =
    vi.fn()
      .mockResolvedValue(
        MATCH_LOOKUP
      );

  const service = {
    submitSingleClaim,
    submitBulkRemoval,
    lookupContentMatches,
    lookupStatus,
  } satisfies PublicCopyrightService;

  return {
    service,
    lookupContentMatches,
  };
}

describe(
  "Public Copyright content match app wiring",
  () => {
    it(
      "registers the public Copyright content-match route in the main app",
      async () => {
        const mocks =
          createServiceMocks();

        const app =
          await buildApp({
            publicCopyrightService:
              mocks.service,
          });

        const response =
          await app.inject({
            method:
              "POST",

            url:
              "/api/v1/public/copyright/content-match",

            payload: {
              identifiers: [
                "CNT-2003",
              ],
            },
          });

        expect(
          response.statusCode
        ).toBe(
          200
        );

        expect(
          mocks.lookupContentMatches
        ).toHaveBeenCalledWith({
          identifiers: [
            "CNT-2003",
          ],
        });

        expect(
          response.json()
        ).toMatchObject({
          match: {
            counts: {
              exactMatchCount:
                1,
            },

            results: [
              {
                status:
                  "exact_match",

                content: {
                  publicId:
                    "CNT-2003",
                },
              },
            ],
          },
        });

        await app.close();
      }
    );
  }
);