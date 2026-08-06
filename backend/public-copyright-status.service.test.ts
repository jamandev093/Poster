import {
  describe,
  expect,
  it,
  vi,
} from "vitest";

import {
  createPublicCopyrightService,
  PublicCopyrightSubmissionError,
} from "./src/application/copyright/public-copyright.service.js";

import type {
  DiscoveryContentRecord,
} from "./src/domains/content-sources/index.js";

import type {
  CopyrightCaseRecord,
} from "./src/domains/copyright/index.js";

const NOW =
  new Date(
    "2026-08-06T12:30:00.000Z"
  );

const CONTENT_ID =
  "00000000-0000-4000-8000-000000000501";

const CONTENT =
  {
    id:
      CONTENT_ID,

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

const CASE =
  {
    id:
      "00000000-0000-4000-8000-000000000701",

    publicId:
      "CR-900001",

    requestType:
      "copyright_strike",

    status:
      "needs_action",

    contentId:
      CONTENT_ID,

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
  } satisfies CopyrightCaseRecord;

function createMocks(
  caseRecord:
    CopyrightCaseRecord |
    null = CASE,
  content:
    DiscoveryContentRecord |
    null = CONTENT
) {
  const findCaseByPublicId =
    vi.fn()
      .mockResolvedValue(
        caseRecord
      );

  const findContentById =
    vi.fn()
      .mockResolvedValue(
        content
      );

  const service =
    createPublicCopyrightService({
      dependencies: {
        findCaseByPublicId,
        findContentById,
      },
    });

  return {
    service,
    findCaseByPublicId,
    findContentById,
  };
}

describe(
  "Public Copyright status service",
  () => {
    it(
      "returns safe public status for a matching reference and email",
      async () => {
        const mocks =
          createMocks();

        const status =
          await mocks.service.lookupStatus({
            reference:
              " cr-900001 ",

            email:
              "RIGHTS@example.com ",
          });

        expect(
          mocks.findCaseByPublicId
        ).toHaveBeenCalledWith(
          "CR-900001"
        );

        expect(
          mocks.findContentById
        ).toHaveBeenCalledWith(
          CONTENT_ID
        );

        expect(
          status
        ).toMatchObject({
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

          affectedContent: {
            publicId:
              "CNT-2003",

            title:
              "Example discovery record",

            publisherName:
              "Example Publisher",
          },
        });

        expect(
          JSON.stringify(
            status
          )
        ).not.toContain(
          "rights@example.com"
        );

        expect(
          JSON.stringify(
            status
          )
        ).not.toContain(
          "00000000-0000-4000"
        );
      }
    );

    it(
      "returns a generic not-found error for unknown references",
      async () => {
        const mocks =
          createMocks(
            null
          );

        await expect(
          mocks.service.lookupStatus({
            reference:
              "CR-900001",

            email:
              "rights@example.com",
          })
        ).rejects.toMatchObject({
          code:
            "COPYRIGHT_STATUS_NOT_FOUND",

          statusCode:
            404,
        });

        expect(
          mocks.findContentById
        ).not.toHaveBeenCalled();
      }
    );

    it(
      "returns a generic not-found error for email mismatch",
      async () => {
        const mocks =
          createMocks();

        await expect(
          mocks.service.lookupStatus({
            reference:
              "CR-900001",

            email:
              "other@example.com",
          })
        ).rejects.toMatchObject({
          code:
            "COPYRIGHT_STATUS_NOT_FOUND",

          statusCode:
            404,
        });

        expect(
          mocks.findContentById
        ).not.toHaveBeenCalled();
      }
    );

    it(
      "validates status lookup input before repository access",
      async () => {
        const mocks =
          createMocks();

        await expect(
          mocks.service.lookupStatus({
            reference:
              "not-a-reference",

            email:
              "not-an-email",
          })
        ).rejects.toMatchObject({
          code:
            "COPYRIGHT_STATUS_VALIDATION_FAILED",

          statusCode:
            400,
        });

        expect(
          mocks.findCaseByPublicId
        ).not.toHaveBeenCalled();
      }
    );

    it(
      "uses the shared public copyright error type for status failures",
      () => {
        const error =
          new PublicCopyrightSubmissionError(
            "COPYRIGHT_STATUS_NOT_FOUND",
            "No matching copyright request was found with those details.",
            404
          );

        expect(
          error.name
        ).toBe(
          "PublicCopyrightSubmissionError"
        );

        expect(
          error.code
        ).toBe(
          "COPYRIGHT_STATUS_NOT_FOUND"
        );
      }
    );
  }
);