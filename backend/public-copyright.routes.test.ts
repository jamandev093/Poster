import Fastify, {
  type FastifyInstance,
} from "fastify";

import {
  describe,
  expect,
  it,
  vi,
} from "vitest";

import {
  PublicCopyrightSubmissionError,
  type PublicCopyrightClaimSubmission,
  type PublicCopyrightService,
} from "./src/application/copyright/index.js";

import {
  publicCopyrightRoutes,
} from "./src/routes/public-copyright.routes.js";

const NOW =
  new Date(
    "2026-08-06T11:00:00.000Z"
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
    "Original Story",

  originalUrl:
    "https://publisher.example/original-story",

  affectedContent:
    "CNT-2003",

  explanation:
    "This Poster record references protected work.",

  evidence:
    "License reference and archive URL",

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

const SUBMISSION:
  PublicCopyrightClaimSubmission = {
  case: {
    id:
      "00000000-0000-4000-8000-000000000701",

    publicId:
      "CR-900001",

    requestType:
      "copyright_strike",

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
      "This Poster record references protected work.",

    submittedOriginalUrl:
      "https://publisher.example/original-story",

    supportingInformation:
      "Evidence text",

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

  content: {
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

  evidence: [
    {
      id:
        "00000000-0000-4000-8000-000000000801",

      caseId:
        "00000000-0000-4000-8000-000000000701",

      evidenceType:
        "original_work_url",

      label:
        "Original publication URL",

      referenceValue:
        "https://publisher.example/original-story",

      storageObjectKey:
        null,

      sha256Digest:
        null,

      submittedAt:
        NOW,

      createdAt:
        NOW,
    },
  ],

  audit: {
    id:
      "00000000-0000-4000-8000-000000000901",

    caseId:
      "00000000-0000-4000-8000-000000000701",

    action:
      "Public copyright claim submitted",

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
};

function createServiceMocks() {
  const submitSingleClaim =
    vi.fn()
      .mockResolvedValue(
        SUBMISSION
      );

  const service = {
    submitSingleClaim,
  } satisfies
    PublicCopyrightService;

  return {
    service,
    submitSingleClaim,
  };
}

async function buildApp(
  service:
    PublicCopyrightService
): Promise<
  FastifyInstance
> {
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
  "Public Copyright HTTP routes",
  () => {
    it(
      "creates a public single copyright claim without authentication",
      async () => {
        const mocks =
          createServiceMocks();

        const app =
          await buildApp(
            mocks.service
          );

        const response =
          await app.inject({
            method:
              "POST",

            url:
              "/api/v1/public/copyright/claims",

            payload:
              VALID_BODY,
          });

        expect(
          response.statusCode
        ).toBe(
          201
        );

        expect(
          mocks.submitSingleClaim
        ).toHaveBeenCalledWith(
          expect.objectContaining({
            claimantName:
              "Example Publisher",

            email:
              "rights@example.com",

            relationship:
              "publisher",

            affectedContent:
              "CNT-2003",

            declarations:
              VALID_BODY.declarations,
          })
        );

        const body =
          response.json();

        expect(
          body
        ).toMatchObject({
          claim: {
            reference:
              "CR-900001",

            requestType:
              "copyright_strike",

            status:
              "needs_action",

            receivedAt:
              NOW.toISOString(),

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

            evidenceCount:
              1,
          },
        });

        expect(
          body.claim.id
        ).toBeUndefined();

        expect(
          JSON.stringify(
            body
          )
        ).not.toContain(
          "rights@example.com"
        );

        await app.close();
      }
    );

    it(
      "maps invalid JSON body shape to HTTP 400",
      async () => {
        const mocks =
          createServiceMocks();

        const app =
          await buildApp(
            mocks.service
          );

        const response =
          await app.inject({
            method:
              "POST",

            url:
              "/api/v1/public/copyright/claims",

            payload:
              [
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
          mocks.submitSingleClaim
        ).not.toHaveBeenCalled();

        expect(
          response.json()
        ).toMatchObject({
          error: {
            code:
              "COPYRIGHT_VALIDATION_FAILED",

            issues: [
              "body must be a JSON object.",
            ],
          },
        });

        await app.close();
      }
    );

    it(
      "maps service validation errors to HTTP 400",
      async () => {
        const mocks =
          createServiceMocks();

        mocks.submitSingleClaim
          .mockRejectedValueOnce(
            new PublicCopyrightSubmissionError(
              "COPYRIGHT_VALIDATION_FAILED",
              "The copyright claim submission is invalid.",
              400,
              [
                "claimantName is required.",
              ]
            )
          );

        const app =
          await buildApp(
            mocks.service
          );

        const response =
          await app.inject({
            method:
              "POST",

            url:
              "/api/v1/public/copyright/claims",

            payload:
              {
                ...VALID_BODY,
                claimantName:
                  "",
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
              "COPYRIGHT_VALIDATION_FAILED",

            message:
              "The copyright claim submission is invalid.",

            issues: [
              "claimantName is required.",
            ],
          },
        });

        await app.close();
      }
    );

    it(
      "maps unknown affected content to HTTP 404",
      async () => {
        const mocks =
          createServiceMocks();

        mocks.submitSingleClaim
          .mockRejectedValueOnce(
            new PublicCopyrightSubmissionError(
              "COPYRIGHT_CONTENT_NOT_FOUND",
              "The affected Poster content record was not found.",
              404
            )
          );

        const app =
          await buildApp(
            mocks.service
          );

        const response =
          await app.inject({
            method:
              "POST",

            url:
              "/api/v1/public/copyright/claims",

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

    it(
      "maps removed affected content to HTTP 409",
      async () => {
        const mocks =
          createServiceMocks();

        mocks.submitSingleClaim
          .mockRejectedValueOnce(
            new PublicCopyrightSubmissionError(
              "COPYRIGHT_CONTENT_REMOVED",
              "The affected Poster content record is already removed.",
              409
            )
          );

        const app =
          await buildApp(
            mocks.service
          );

        const response =
          await app.inject({
            method:
              "POST",

            url:
              "/api/v1/public/copyright/claims",

            payload:
              VALID_BODY,
          });

        expect(
          response.statusCode
        ).toBe(
          409
        );

        expect(
          response.json()
        ).toMatchObject({
          error: {
            code:
              "COPYRIGHT_CONTENT_REMOVED",
          },
        });

        await app.close();
      }
    );
  }
);