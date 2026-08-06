import Fastify from "fastify";

import {
  describe,
  expect,
  it,
  vi,
} from "vitest";

import {
  PublicCopyrightSubmissionError,
  type PublicCopyrightContentMatchLookup,
  type PublicCopyrightService,
} from "./src/application/copyright/index.js";

import {
  publicCopyrightRoutes,
} from "./src/routes/public-copyright.routes.js";

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
          "submitSingleClaim should not be called by content match tests."
        );
      }
    );

  const submitBulkRemoval =
    vi.fn(
      async () => {
        throw new Error(
          "submitBulkRemoval should not be called by content match tests."
        );
      }
    );

  const lookupStatus =
    vi.fn(
      async () => {
        throw new Error(
          "lookupStatus should not be called by content match tests."
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

async function buildRouteApp(
  service:
    PublicCopyrightService
) {
  const app =
    Fastify({
      logger:
        false,
    });

  await app.register(
    publicCopyrightRoutes,
    {
      prefix:
        "/api/v1",

      service,
    }
  );

  return app;
}

describe(
  "Public Copyright content match routes",
  () => {
    it(
      "returns safe content matches without authentication",
      async () => {
        const mocks =
          createServiceMocks();

        const app =
          await buildRouteApp(
            mocks.service
          );

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

        const body =
          response.json();

        expect(
          body
        ).toMatchObject({
          match: {
            counts: {
              exactMatchCount:
                1,

              notFoundCount:
                0,

              invalidCount:
                0,

              duplicateCount:
                0,
            },

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
          },
        });

        expect(
          JSON.stringify(
            body
          )
        ).not.toContain(
          "00000000-0000-4000"
        );

        expect(
          JSON.stringify(
            body
          )
        ).not.toContain(
          "rowVersion"
        );

        await app.close();
      }
    );

    it(
      "maps invalid content-match body shape to HTTP 400",
      async () => {
        const mocks =
          createServiceMocks();

        const app =
          await buildRouteApp(
            mocks.service
          );

        const response =
          await app.inject({
            method:
              "POST",

            url:
              "/api/v1/public/copyright/content-match",

            payload: [
              "not",
              "an",
              "object",
            ],
          });

        expect(
          response.statusCode
        ).toBe(
          400
        );

        expect(
          mocks.lookupContentMatches
        ).not.toHaveBeenCalled();

        expect(
          response.json()
        ).toMatchObject({
          error: {
            code:
              "COPYRIGHT_CONTENT_MATCH_VALIDATION_FAILED",

            issues: [
              "body must be a JSON object.",
            ],
          },
        });

        await app.close();
      }
    );

    it(
      "maps content-match service validation errors to HTTP 400",
      async () => {
        const mocks =
          createServiceMocks();

        mocks.lookupContentMatches
          .mockRejectedValueOnce(
            new PublicCopyrightSubmissionError(
              "COPYRIGHT_CONTENT_MATCH_VALIDATION_FAILED",
              "The content match lookup is invalid.",
              400,
              [
                "At least one identifier is required.",
              ]
            )
          );

        const app =
          await buildRouteApp(
            mocks.service
          );

        const response =
          await app.inject({
            method:
              "POST",

            url:
              "/api/v1/public/copyright/content-match",

            payload: {
              identifiers: [],
            },
          });

        expect(
          response.statusCode
        ).toBe(
          400
        );

        expect(
          response.json()
        ).toMatchObject({
          error: {
            code:
              "COPYRIGHT_CONTENT_MATCH_VALIDATION_FAILED",

            message:
              "The content match lookup is invalid.",

            issues: [
              "At least one identifier is required.",
            ],
          },
        });

        await app.close();
      }
    );
  }
);