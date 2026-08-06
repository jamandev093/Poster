import {
  describe,
  expect,
  it,
  vi,
} from "vitest";

import {
  createPublicCopyrightService,
} from "./src/application/copyright/public-copyright.service.js";

import type {
  DiscoveryContentRecord,
} from "./src/domains/content-sources/index.js";

import type {
  CopyrightAuditEventRecord,
  CopyrightCaseRecord,
  CopyrightEvidenceReferenceRecord,
} from "./src/domains/copyright/index.js";

const NOW =
  new Date(
    "2026-08-06T14:00:00.000Z"
  );

const CONTENT_ID =
  "00000000-0000-4000-8000-000000000501";

const CASE_ID =
  "00000000-0000-4000-8000-000000000901";

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

const BULK_CASE =
  {
    id:
      CASE_ID,

    publicId:
      "CR-910001",

    requestType:
      "copyright_request",

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
  } satisfies CopyrightCaseRecord;

function createEvidence(
  input: {
    caseId: string;
    evidenceType: CopyrightEvidenceReferenceRecord["evidenceType"];
    label: string;
    referenceValue: string;
    storageObjectKey?: string | null;
    sha256Digest?: string | null;
    submittedAt: Date;
  },
  index: number
): CopyrightEvidenceReferenceRecord {
  return {
    id:
      `00000000-0000-4000-8000-0000000010${index}`,

    caseId:
      input.caseId,

    evidenceType:
      input.evidenceType,

    label:
      input.label,

    referenceValue:
      input.referenceValue,

    storageObjectKey:
      input.storageObjectKey ?? null,

    sha256Digest:
      input.sha256Digest ?? null,

    submittedAt:
      input.submittedAt,

    createdAt:
      NOW,
  };
}

function createAudit():
  CopyrightAuditEventRecord {
  return {
    id:
      "00000000-0000-4000-8000-000000001201",

    caseId:
      CASE_ID,

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
  };
}

function createMocks(
  content:
    DiscoveryContentRecord |
    null = CONTENT
) {
  const findContentByPublicId =
    vi.fn()
      .mockImplementation(
        async publicId =>
          publicId === "CNT-2003"
            ? content
            : null
      );

  const findContentByOriginalUrl =
    vi.fn()
      .mockImplementation(
        async originalUrl =>
          originalUrl ===
          "https://publisher.example/original-story"
            ? content
            : null
      );

  const createCase =
    vi.fn()
      .mockResolvedValue(
        BULK_CASE
      );

  const appendEvidence =
    vi.fn()
      .mockImplementation(
        async input =>
          createEvidence(
            input,
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
          () => "CR-910001",
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
    "Original Story Collection",

  originalUrl:
    "https://publisher.example/original-story",

  items: [
    {
      value:
        "cnt-2003",
    },
    {
      value:
        "https://publisher.example/original-story",
    },
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
};

describe(
  "Public Copyright bulk service",
  () => {
    it(
      "creates one copyright_request case for a normalized bulk removal request",
      async () => {
        const mocks =
          createMocks();

        const result =
          await mocks.service.submitBulkRemoval(
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
              "CR-910001",

            requestType:
              "copyright_request",

            contentId:
              CONTENT_ID,

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
        ).toHaveBeenCalledWith(
          expect.objectContaining({
            evidenceType:
              "publisher_reference",

            label:
              "Bulk affected item 1",

            referenceValue:
              "CNT-2003",
          }),
          undefined
        );

        expect(
          mocks.appendAudit
        ).toHaveBeenCalledWith(
          expect.objectContaining({
            action:
              "Public bulk copyright request submitted",

            actorUserId:
              null,

            resultingStatus:
              "needs_action",

            metadata:
              expect.objectContaining({
                requestType:
                  "copyright_request",

                itemCount:
                  2,

                primaryContentPublicId:
                  "CNT-2003",
              }),
          }),
          undefined
        );

        expect(
          result.case.publicId
        ).toBe(
          "CR-910001"
        );

        expect(
          result.itemCount
        ).toBe(
          2
        );

        expect(
          result.primaryContent.publicId
        ).toBe(
          "CNT-2003"
        );
      }
    );

    it(
      "uses original URL lookup when the first affected item is a URL",
      async () => {
        const mocks =
          createMocks();

        await mocks.service.submitBulkRemoval({
          ...VALID_INPUT,
          items: [
            {
              value:
                "https://publisher.example/original-story",
            },
          ],
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
      "rejects bulk submissions without opening a transaction when declarations are missing",
      async () => {
        const mocks =
          createMocks();

        await expect(
          mocks.service.submitBulkRemoval({
            ...VALID_INPUT,
            declarations: {
              goodFaith:
                true,

              accurate:
                true,

              authorized:
                false,
            },
          })
        ).rejects.toMatchObject({
          code:
            "COPYRIGHT_BULK_VALIDATION_FAILED",

          statusCode:
            400,
        });

        expect(
          mocks.runTransaction
        ).not.toHaveBeenCalled();
      }
    );

    it(
      "rejects more than 100 normalized affected items",
      async () => {
        const mocks =
          createMocks();

        await expect(
          mocks.service.submitBulkRemoval({
            ...VALID_INPUT,
            items:
              Array.from(
                {
                  length:
                    101,
                },
                (
                  _,
                  index
                ) => ({
                  value:
                    `CNT-${index + 1}`,
                })
              ),
          })
        ).rejects.toMatchObject({
          code:
            "COPYRIGHT_BULK_VALIDATION_FAILED",

          statusCode:
            400,
        });

        expect(
          mocks.runTransaction
        ).not.toHaveBeenCalled();
      }
    );

    it(
      "rejects a bulk request when no active affected content can be resolved",
      async () => {
        const mocks =
          createMocks(
            null
          );

        await expect(
          mocks.service.submitBulkRemoval(
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
      "rejects a bulk request when matching content is already removed and no active content remains",
      async () => {
        const mocks =
          createMocks({
            ...CONTENT,
            status:
              "removed",

            removedAt:
              NOW,

            removalReason:
              "copyright",
          });

        await expect(
          mocks.service.submitBulkRemoval(
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
  }
);