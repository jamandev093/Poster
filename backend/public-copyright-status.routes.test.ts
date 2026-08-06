import Fastify from "fastify";

import {
  describe,
  expect,
  it,
  vi,
} from "vitest";

import {
  PublicCopyrightSubmissionError,
  type PublicCopyrightService,
  type PublicCopyrightStatusLookup,
} from "./src/application/copyright/index.js";

import {
  publicCopyrightRoutes,
} from "./src/routes/public-copyright.routes.js";

const NOW =
  new Date(
    "2026-08-06T12:45:00.000Z"
  );

const STATUS_LOOKUP =
  {
    reference:
      "CR-900001",

    requestType:
      "copyright_strike",

    status:
      "needs_action",

    verificationStatus:
      "pending",

    actionTaken:
      null,

    preventReimport:
      false,

    receivedAt:
      NOW,

    resolvedAt:
      null,

    affectedContent: {
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
  } satisfies PublicCopyrightStatusLookup;

function createServiceMocks() {
  const submitSingleClaim =
    vi.fn(
      async () => {
        throw new Error(
          "submitSingleClaim should not be called by status tests."
        );
      }
    );

  const lookupStatus =
    vi.fn()
      .mockResolvedValue(
        STATUS_LOOKUP
      );

  const service = {
    submitSingleClaim,
    lookupStatus,
  } satisfies PublicCopyrightService;

  return {
    service,
    lookupStatus,
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
  "Public Copyright status routes",
  () => {
    it(
      "returns public copyright status without authentication",
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
              "/api/v1/public/copyright/status",

            payload: {
              reference:
                "CR-900001",

              email:
                "rights@example.com",
            },
          });

        expect(
          response.statusCode
        ).toBe(
          200
        );

        expect(
          mocks.lookupStatus
        ).toHaveBeenCalledWith({
          reference:
            "CR-900001",

          email:
            "rights@example.com",
        });

        const body =
          response.json();

        expect(
          body
        ).toMatchObject({
          status: {
            reference:
              "CR-900001",

            requestType:
              "copyright_strike",

            status:
              "needs_action",

            verificationStatus:
              "pending",

            receivedAt:
              NOW.toISOString(),

            resolvedAt:
              null,

            affectedContent: {
              publicId:
                "CNT-2003",

              title:
                "Example discovery record",
            },
          },
        });

        expect(
          JSON.stringify(
            body
          )
        ).not.toContain(
          "rights@example.com"
        );

        expect(
          JSON.stringify(
            body
          )
        ).not.toContain(
          "00000000-0000-4000"
        );

        await app.close();
      }
    );

    it(
      "maps invalid status body shape to HTTP 400",
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
              "/api/v1/public/copyright/status",

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
          mocks.lookupStatus
        ).not.toHaveBeenCalled();

        expect(
          response.json()
        ).toMatchObject({
          error: {
            code:
              "COPYRIGHT_STATUS_VALIDATION_FAILED",

            issues: [
              "body must be a JSON object.",
            ],
          },
        });

        await app.close();
      }
    );

    it(
      "maps unmatched status lookups to HTTP 404 with a generic message",
      async () => {
        const mocks =
          createServiceMocks();

        mocks.lookupStatus
          .mockRejectedValueOnce(
            new PublicCopyrightSubmissionError(
              "COPYRIGHT_STATUS_NOT_FOUND",
              "No matching copyright request was found with those details.",
              404
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
              "/api/v1/public/copyright/status",

            payload: {
              reference:
                "CR-900001",

              email:
                "wrong@example.com",
            },
          });

        expect(
          response.statusCode
        ).toBe(
          404
        );

        expect(
          response.json()
        ).toMatchObject({
          error: {
            code:
              "COPYRIGHT_STATUS_NOT_FOUND",

            message:
              "No matching copyright request was found with those details.",
          },
        });

        await app.close();
      }
    );
  }
);