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
  CopyrightAuditEventRecord,
  CopyrightCaseRecord,
  CopyrightEvidenceReferenceRecord,
} from "./src/domains/copyright/index.js";

const CONTENT_ID =
  "00000000-0000-4000-8000-000000000501";

const CASE_ID =
  "00000000-0000-4000-8000-000000000701";

const NOW =
  new Date(
    "2026-08-06T09:00:00.000Z"
  );

const CONTENT:
  DiscoveryContentRecord = {
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
};

const CASE:
  CopyrightCaseRecord = {
  id:
    CASE_ID,

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
};

function createEvidence(
  index: number
): CopyrightEvidenceReferenceRecord {
  return {
    id:
      `00000000-0000-4000-8000-00000000080${index}`,

    caseId:
      CASE_ID,

    evidenceType:
      index === 1
        ? "original_work_url"
        : "supporting_url",

    label:
      index === 1
        ? "Original publication URL"
        : "Claimant supporting evidence",

    referenceValue:
      index === 1
        ? "https://publisher.example/original-story"
        : "License reference and archived source link",

    storageObjectKey:
      null,

    sha256Digest:
      null,

    submittedAt:
      NOW,

    createdAt:
      NOW,
  };
}

function createAudit():
  CopyrightAuditEventRecord {
  return {
    id:
      "00000000-0000-4000-8000-000000000901",

    caseId:
      CASE_ID,

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
  };
}

function createServiceMocks(
  content:
    DiscoveryContentRecord |
    null = CONTENT
) {
  const findContentByPublicId =
    vi.fn()
      .mockResolvedValue(
        content
      );

  const findContentByOriginalUrl =
    vi.fn()
      .mockResolvedValue(
        null
      );

  const createCase =
    vi.fn()
      .mockResolvedValue(
        CASE
      );

  const appendEvidence =
    vi.fn()
      .mockImplementation(
        async () =>
          createEvidence(
            appendEvidence.mock.calls.length
          )
      );

  const appendAudit =
    vi.fn()
      .mockResolvedValue(
        createAudit()
      );

  const runTransaction =
    vi.fn(
      async callback =>
        await callback(
          undefined
        )
    );

  const service =
    createPublicCopyrightService({
      dependencies: {
        findContentByPublicId,
        findContentByOriginalUrl,
        createCase,
        appendEvidence,
        appendAudit,
        runTransaction,
        generatePublicId:
          () => "CR-900001",
        now:
          () => NOW,
      },
    });

  return {
    service,
    findContentByPublicId,
    findContentByOriginalUrl,
    createCase,
    appendEvidence,
    appendAudit,
    runTransaction,
  };
}

const VALID_INPUT = {
  claimantName:
    "Example Publisher",

  organization:
    "Example Org",

  email:
    "rights@example.com",

  relationship:
    "publisher" as const,

  workTitle:
    "Original Story",

  originalUrl:
    "https://publisher.example/original-story",

  affectedContent:
    "CNT-2003",

  explanation:
    "This Poster record references protected work.",

  evidence:
    "License reference and archived source link",

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

describe(
  "Public Copyright service",
  () => {
    it(
      "creates a single public copyright claim with evidence and audit in one transaction",
      async () => {
        const mocks =
          createServiceMocks();

        const result =
          await mocks.service.submitSingleClaim(
            VALID_INPUT
          );

        expect(
          mocks.runTransaction
        ).toHaveBeenCalledTimes(
          1
        );

        expect(
          mocks.findContentByPublicId
        ).toHaveBeenCalledWith(
          "CNT-2003",
          undefined
        );

        expect(
          mocks.createCase
        ).toHaveBeenCalledWith(
          expect.objectContaining({
            publicId:
              "CR-900001",

            requestType:
              "copyright_strike",

            contentId:
              CONTENT_ID,

            claimantName:
              "Example Publisher",

            claimantType:
              "Publisher / organization",

            claimantBusinessEmail:
              "rights@example.com",

            submittedOriginalUrl:
              "https://publisher.example/original-story",

            receivedAt:
              NOW,
          }),
          undefined
        );

        expect(
          mocks.appendEvidence
        ).toHaveBeenCalledTimes(
          2
        );

        expect(
          mocks.appendAudit
        ).toHaveBeenCalledWith(
          expect.objectContaining({
            caseId:
              CASE_ID,

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

            occurredAt:
              NOW,
          }),
          undefined
        );

        expect(
          result.case.publicId
        ).toBe(
          "CR-900001"
        );

        expect(
          result.content.publicId
        ).toBe(
          "CNT-2003"
        );
      }
    );

    it(
      "resolves Poster URLs containing a CNT public id",
      async () => {
        const mocks =
          createServiceMocks();

        await mocks.service.submitSingleClaim({
          ...VALID_INPUT,
          affectedContent:
            "https://poster.example/content/CNT-2003",
        });

        expect(
          mocks.findContentByPublicId
        ).toHaveBeenCalledWith(
          "CNT-2003",
          undefined
        );
      }
    );

    it(
      "falls back to original URL lookup",
      async () => {
        const mocks =
          createServiceMocks();

        mocks.findContentByPublicId
          .mockResolvedValueOnce(
            null
          );

        mocks.findContentByOriginalUrl
          .mockResolvedValueOnce(
            CONTENT
          );

        await mocks.service.submitSingleClaim({
          ...VALID_INPUT,
          affectedContent:
            "https://publisher.example/original-story",
        });

        expect(
          mocks.findContentByOriginalUrl
        ).toHaveBeenCalledWith(
          "https://publisher.example/original-story",
          undefined
        );
      }
    );

    it(
      "rejects missing declarations before opening a transaction",
      async () => {
        const mocks =
          createServiceMocks();

        await expect(
          mocks.service.submitSingleClaim({
            ...VALID_INPUT,
            declarations: {
              goodFaith:
                true,

              accurate:
                false,

              authorized:
                true,
            },
          })
        ).rejects.toMatchObject({
          code:
            "COPYRIGHT_VALIDATION_FAILED",
          statusCode:
            400,
        });

        expect(
          mocks.runTransaction
        ).not.toHaveBeenCalled();
      }
    );

    it(
      "rejects unknown affected content",
      async () => {
        const mocks =
          createServiceMocks(
            null
          );

        await expect(
          mocks.service.submitSingleClaim(
            VALID_INPUT
          )
        ).rejects.toMatchObject({
          code:
            "COPYRIGHT_CONTENT_NOT_FOUND",
          statusCode:
            404,
        });
      }
    );

    it(
      "rejects already removed affected content",
      async () => {
        const mocks =
          createServiceMocks({
            ...CONTENT,
            status:
              "removed",

            removedAt:
              NOW,

            removalReason:
              "copyright",
          });

        await expect(
          mocks.service.submitSingleClaim(
            VALID_INPUT
          )
        ).rejects.toMatchObject({
          code:
            "COPYRIGHT_CONTENT_REMOVED",
          statusCode:
            409,
        });
      }
    );

    it(
      "exposes PublicCopyrightSubmissionError details",
      () => {
        const error =
          new PublicCopyrightSubmissionError(
            "COPYRIGHT_VALIDATION_FAILED",
            "Invalid submission.",
            400,
            [
              "claimantName is required.",
            ]
          );

        expect(
          error.name
        ).toBe(
          "PublicCopyrightSubmissionError"
        );

        expect(
          error.issues
        ).toEqual([
          "claimantName is required.",
        ]);
      }
    );
  }
);