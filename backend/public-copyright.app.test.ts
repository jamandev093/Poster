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
  PublicCopyrightClaimSubmission,
  PublicCopyrightService,
} from "./src/application/copyright/index.js";

const NOW =
  new Date(
    "2026-08-06T12:00:00.000Z"
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

  evidence: [],

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

describe(
  "Public Copyright app wiring",
  () => {
    it(
      "registers the public Copyright claim route in the main app",
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

            affectedContent:
              "CNT-2003",
          })
        );

        expect(
          response.json()
        ).toMatchObject({
          claim: {
            reference:
              "CR-900001",

            status:
              "needs_action",

            affectedContent: {
              publicId:
                "CNT-2003",
            },
          },
        });

        await app.close();
      }
    );

    it(
      "allows the Copyright web origin through CORS",
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
              "OPTIONS",

            url:
              "/api/v1/public/copyright/claims",

            headers: {
              origin:
                "http://localhost:3002",

              "access-control-request-method":
                "POST",
            },
          });

        expect(
          response.headers[
            "access-control-allow-origin"
          ]
        ).toBe(
          "http://localhost:3002"
        );

        await app.close();
      }
    );
  }
);