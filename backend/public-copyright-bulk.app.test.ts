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
  PublicCopyrightBulkSubmission,
  PublicCopyrightService,
} from "./src/application/copyright/index.js";

const NOW =
  new Date(
    "2026-08-06T15:20:00.000Z"
  );

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
          "submitSingleClaim should not be called by bulk app tests."
        );
      }
    );

  const lookupStatus =
    vi.fn(
      async () => {
        throw new Error(
          "lookupStatus should not be called by bulk app tests."
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

describe(
  "Public Copyright bulk app wiring",
  () => {
    it(
      "registers the public Copyright bulk-removal route in the main app",
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
              "/api/v1/public/copyright/bulk-removal",

            payload: {
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
            },
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

            items: [
              {
                value:
                  "CNT-2003",
              },
            ],
          })
        );

        expect(
          response.json()
        ).toMatchObject({
          bulkRequest: {
            reference:
              "CR-910001",

            requestType:
              "copyright_request",

            itemCount:
              2,

            primaryAffectedContent: {
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