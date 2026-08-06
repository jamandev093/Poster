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
  PublicCopyrightService,
  PublicCopyrightStatusLookup,
} from "./src/application/copyright/index.js";

const NOW =
  new Date(
    "2026-08-06T13:00:00.000Z"
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
          "submitSingleClaim should not be called by status app tests."
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

describe(
  "Public Copyright status app wiring",
  () => {
    it(
      "registers the public Copyright status lookup route in the main app",
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

        expect(
          response.json()
        ).toMatchObject({
          status: {
            reference:
              "CR-900001",

            affectedContent: {
              publicId:
                "CNT-2003",
            },
          },
        });

        await app.close();
      }
    );
  }
);