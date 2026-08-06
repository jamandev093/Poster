import Fastify from "fastify";

import {
  describe,
  expect,
  it,
  vi,
} from "vitest";

import {
  PublicCopyrightSubmissionError,
  type PublicCopyrightBulkSubmission,
  type PublicCopyrightService,
} from "./src/application/copyright/index.js";

import {
  publicCopyrightRoutes,
} from "./src/routes/public-copyright.routes.js";

const NOW =
  new Date(
    "2026-08-06T15:00:00.000Z"
  );

const VALID_BODY = {
  claimantName:
    "Example Publisher",

  organization:
    "Example Org",

  email:
    "rights@example.com",

  relationship:
    "publisher",

  workTitle:
    "Original Story Collection",

  originalUrl:
    "https://publisher.example/original-story",

  items: [
    {
      value:
        "CNT-2003",
    },
    {
      value:
        "https://publisher.example/original-story",
    },
  ],

  explanation:
    "Multiple Poster records reference protected work.",

  evidence:
    "Publisher rights page and archive references.",

  legalName:
    "Example Rights Manager",

  declarations: {
    goodFaith:
      true,

    accurate:
      true,

    authorized:
      true,
  },
};

const BULK_SUBMISSION =
  {
    case: {
      id:
        "00000000-0000-4000-8000-000000000901",

      publicId:
        "CR-910001",

      requestType:
        "copyright_request",

      status:
        "needs_action",

      contentId:
        "00000000-0000-4000-8000-000000000501",

      claimantName:
        "Example Publisher",

      claimantType:
        "Publisher / organization",

      claimantBusinessEmail:
        "rights@example.com",

      claimantWebsiteUrl:
        null,

      claimantReference:
        "Example Org",

      requestReason:
        "Multiple Poster records reference protected work.",

      submittedOriginalUrl:
        "https://publisher.example/original-story",

      supportingInformation:
        "Bulk request item count: 2",

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

      resolvedByUserId:
        null,

      createdAt:
        NOW,

      updatedAt:
        NOW,

      rowVersion:
        "1",
    },

    primaryContent: {
      id:
        "00000000-0000-4000-8000-000000000501",

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

    itemCount:
      2,

    evidence: [],

    audit: {
      id:
        "00000000-0000-4000-8000-000000001201",

      caseId:
        "00000000-0000-4000-8000-000000000901",

      action:
        "Public bulk copyright request submitted",

      actorUserId:
        null,

      actorLabel:
        "Public copyright claimant",

      previousStatus:
        null,

      resultingStatus:
        "needs_action",

      metadata:
        {},

      occurredAt:
        NOW,
    },
  } satisfies PublicCopyrightBulkSubmission;

function createServiceMocks() {
  const submitSingleClaim =
    vi.fn(
      async () => {
        throw new Error(
          "submitSingleClaim should not be called by bulk route tests."
        );
      }
    );

  const lookupStatus =
    vi.fn(
      async () => {
        throw new Error(
          "lookupStatus should not be called by bulk route tests."
        );
      }
    );

  const submitBulkRemoval =
    vi.fn()
      .mockResolvedValue(
        BULK_SUBMISSION
      );

  const service = {
    submitSingleClaim,
    submitBulkRemoval,
    lookupStatus,
  } satisfies PublicCopyrightService;

  return {
    service,
    submitBulkRemoval,
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
  "Public Copyright bulk routes",
  () => {
    it(
      "creates a public bulk copyright request without authentication",
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
              "/api/v1/public/copyright/bulk-removal",

            payload:
              VALID_BODY,
          });

        expect(
          response.statusCode
        ).toBe(
          201
        );

        expect(
          mocks.submitBulkRemoval
        ).toHaveBeenCalledWith(
          expect.objectContaining({
            claimantName:
              "Example Publisher",

            email:
              "rights@example.com",

            relationship:
              "publisher",

            items:
              VALID_BODY.items,

            declarations:
              VALID_BODY.declarations,
          })
        );

        const body =
          response.json();

        expect(
          body
        ).toMatchObject({
          bulkRequest: {
            reference:
              "CR-910001",

            requestType:
              "copyright_request",

            status:
              "needs_action",

            receivedAt:
              NOW.toISOString(),

            itemCount:
              2,

            primaryAffectedContent: {
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

            evidenceCount:
              0,
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
      "maps invalid bulk body shape to HTTP 400",
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
              "/api/v1/public/copyright/bulk-removal",

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
          mocks.submitBulkRemoval
        ).not.toHaveBeenCalled();

        expect(
          response.json()
        ).toMatchObject({
          error: {
            code:
              "COPYRIGHT_BULK_VALIDATION_FAILED",

            issues: [
              "body must be a JSON object.",
            ],
          },
        });

        await app.close();
      }
    );

    it(
      "maps bulk validation errors to HTTP 400",
      async () => {
        const mocks =
          createServiceMocks();

        mocks.submitBulkRemoval
          .mockRejectedValueOnce(
            new PublicCopyrightSubmissionError(
              "COPYRIGHT_BULK_VALIDATION_FAILED",
              "The bulk copyright request is invalid.",
              400,
              [
                "At least one affected item is required.",
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
              "/api/v1/public/copyright/bulk-removal",

            payload: {
              ...VALID_BODY,
              items: [],
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
              "COPYRIGHT_BULK_VALIDATION_FAILED",

            message:
              "The bulk copyright request is invalid.",

            issues: [
              "At least one affected item is required.",
            ],
          },
        });

        await app.close();
      }
    );

    it(
      "maps unknown bulk affected content to HTTP 404",
      async () => {
        const mocks =
          createServiceMocks();

        mocks.submitBulkRemoval
          .mockRejectedValueOnce(
            new PublicCopyrightSubmissionError(
              "COPYRIGHT_CONTENT_NOT_FOUND",
              "At least one affected Poster content record must match an existing active Poster record.",
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
              "/api/v1/public/copyright/bulk-removal",

            payload:
              VALID_BODY,
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
              "COPYRIGHT_CONTENT_NOT_FOUND",
          },
        });

        await app.close();
      }
    );
  }
);