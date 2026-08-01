import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

vi.mock(
  "./src/database/database.transaction.js",
  () => ({
    runDatabaseTransaction:
      async <T>(
        operation:
          (
            executor:
              never
          ) => Promise<T>
      ): Promise<T> =>
        await operation(
          undefined as never
        ),
  })
);

import {
  createAdminCopyrightService,
  type AdminCopyrightServiceDependencies,
} from "./src/application/copyright/admin-copyright.service.js";

import {
  CopyrightApplicationError,
} from "./src/application/copyright/copyright.errors.js";

import type {
  DiscoveryContentRecord,
} from "./src/domains/content-sources/index.js";

import type {
  CopyrightCaseRecord,
  CopyrightVerificationCheckRecord,
} from "./src/domains/copyright/index.js";

const CASE_ID =
  "00000000-0000-4000-8000-000000000701";

const CONTENT_ID =
  "00000000-0000-4000-8000-000000000501";

const ADMIN_ID =
  "00000000-0000-4000-8000-000000000101";

const ACTION_AT =
  new Date(
    "2026-08-01T10:00:00.000Z"
  );

const ACTIVE_CONTENT:
  DiscoveryContentRecord = {
  id:
    CONTENT_ID,

  publicId:
    "CNT-2003",

  sourceId:
    "00000000-0000-4000-8000-000000000401",

  title:
    "Example copyrighted work",

  publisherName:
    "Example Publisher",

  originalUrl:
    "https://example.com/original-work",

  acquisitionMethod:
    "rss",

  status:
    "active",

  publishedAt:
    new Date(
      "2026-07-20T08:00:00.000Z"
    ),

  addedAt:
    new Date(
      "2026-07-20T09:00:00.000Z"
    ),

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
    new Date(
      "2026-07-20T09:00:00.000Z"
    ),

  updatedAt:
    new Date(
      "2026-07-20T09:00:00.000Z"
    ),

  rowVersion:
    "1",
};

const REMOVED_CONTENT:
  DiscoveryContentRecord = {
  ...ACTIVE_CONTENT,

  status:
    "removed",

  removedAt:
    ACTION_AT,

  removalReason:
    "copyright",

  removalNote:
    "Verified rights-holder request.",

  copyrightCaseId:
    "CR-1001",

  copyrightClaimant:
    "Example Publisher",

  preventReimport:
    true,

  updatedAt:
    ACTION_AT,

  rowVersion:
    "2",
};

const RESTORABLE_CONTENT:
  DiscoveryContentRecord = {
  ...REMOVED_CONTENT,

  preventReimport:
    false,

  rowVersion:
    "2",
};

const BASE_CASE:
  CopyrightCaseRecord = {
  id:
    CASE_ID,

  publicId:
    "CR-1001",

  requestType:
    "copyright_strike",

  status:
    "needs_action",

  contentId:
    CONTENT_ID,

  claimantName:
    "Example Publisher",

  claimantType:
    "Publisher",

  claimantBusinessEmail:
    "rights@example.com",

  claimantWebsiteUrl:
    "https://example.com",

  claimantReference:
    "RIGHTS-2026-1001",

  requestReason:
    "The linked Poster discovery record refers to protected publisher material.",

  submittedOriginalUrl:
    "https://example.com/original-work",

  supportingInformation:
    "Submitted through the verified publisher rights workflow.",

  verificationStatus:
    "verified",

  actionTaken:
    null,

  preventReimport:
    false,

  receivedAt:
    new Date(
      "2026-08-01T08:00:00.000Z"
    ),

  resolvedAt:
    null,

  resolvedByUserId:
    null,

  createdAt:
    new Date(
      "2026-08-01T08:00:00.000Z"
    ),

  updatedAt:
    new Date(
      "2026-08-01T08:00:00.000Z"
    ),

  rowVersion:
    "1",
};

const PASSED_CHECK:
  CopyrightVerificationCheckRecord = {
  id:
    "00000000-0000-4000-8000-000000000801",

  caseId:
    CASE_ID,

  checkKey:
    "poster_content_match",

  label:
    "Poster content match",

  status:
    "passed",

  detail:
    "The Poster content ID and original URL match the submitted claim.",

  verifiedByUserId:
    ADMIN_ID,

  verifiedAt:
    new Date(
      "2026-08-01T09:00:00.000Z"
    ),

  createdAt:
    new Date(
      "2026-08-01T08:30:00.000Z"
    ),

  updatedAt:
    new Date(
      "2026-08-01T09:00:00.000Z"
    ),

  rowVersion:
    "2",
};

function createDependencies() {
  const listCases =
    vi.fn();

  const findCase =
    vi.fn();

  const resolveCase =
    vi.fn();

  const reopenCase =
    vi.fn();

  const listVerification =
    vi.fn()
      .mockResolvedValue([
        PASSED_CHECK,
      ]);

  const listEvidence =
    vi.fn()
      .mockResolvedValue(
        []
      );

  const listAudit =
    vi.fn()
      .mockResolvedValue(
        []
      );

  const appendAudit =
    vi.fn()
      .mockResolvedValue({
        id:
          "00000000-0000-4000-8000-000000000901",

        caseId:
          CASE_ID,

        action:
          "Copyright action",

        actorUserId:
          ADMIN_ID,

        actorLabel:
          "Poster Admin",

        previousStatus:
          "needs_action",

        resultingStatus:
          "removed",

        metadata:
          {},

        occurredAt:
          ACTION_AT,
      });

  const findContent =
    vi.fn();

  const removeContent =
    vi.fn();

  const restoreContent =
    vi.fn();

  const listContentAudit =
    vi.fn()
      .mockResolvedValue(
        []
      );

  const appendContentAudit =
    vi.fn()
      .mockResolvedValue({
        id:
          "00000000-0000-4000-8000-000000000902",

        entityType:
          "content",

        sourceId:
          null,

        contentId:
          CONTENT_ID,

        action:
          "Content action",

        actorUserId:
          ADMIN_ID,

        actorLabel:
          "Poster Admin",

        metadata:
          {},

        occurredAt:
          ACTION_AT,
      });

  const dependencies = {
    listCases,
    findCase,
    resolveCase,
    reopenCase,
    listVerification,
    listEvidence,
    listAudit,
    appendAudit,
    findContent,
    removeContent,
    restoreContent,
    listContentAudit,
    appendContentAudit,

    now:
      () =>
        ACTION_AT,
  } as unknown as
    AdminCopyrightServiceDependencies;

  return {
    dependencies,
    listCases,
    findCase,
    resolveCase,
    reopenCase,
    listVerification,
    listEvidence,
    listAudit,
    appendAudit,
    findContent,
    removeContent,
    restoreContent,
    listContentAudit,
    appendContentAudit,
  };
}

describe(
  "Admin Copyright application service",
  () => {
    beforeEach(
      () => {
        vi.clearAllMocks();
      }
    );

    it(
      "removes verified content and enforces prevent-reimport atomically",
      async () => {
        const mocks =
          createDependencies();

        const removedCase:
          CopyrightCaseRecord = {
          ...BASE_CASE,

          status:
            "removed",

          actionTaken:
            "removed_prevent_reimport",

          preventReimport:
            true,

          resolvedAt:
            ACTION_AT,

          resolvedByUserId:
            ADMIN_ID,

          updatedAt:
            ACTION_AT,

          rowVersion:
            "2",
        };

        mocks.findCase
          .mockResolvedValueOnce(
            BASE_CASE
          );

        mocks.findContent
          .mockResolvedValueOnce(
            ACTIVE_CONTENT
          )
          .mockResolvedValueOnce(
            REMOVED_CONTENT
          );

        mocks.removeContent
          .mockResolvedValue(
            REMOVED_CONTENT
          );

        mocks.resolveCase
          .mockResolvedValue(
            removedCase
          );

        const service =
          createAdminCopyrightService({
            dependencies:
              mocks.dependencies,
          });

        const details =
          await service.remove({
            caseId:
              CASE_ID,

            expectedRowVersion:
              "1",

            contentExpectedRowVersion:
              "1",

            internalNote:
              "Verified rights-holder request.",

            preventReimport:
              true,

            actorUserId:
              ADMIN_ID,

            actorLabel:
              "Poster Admin",
          });

        expect(
          mocks.removeContent
        ).toHaveBeenCalledWith(
          {
            contentId:
              CONTENT_ID,

            expectedRowVersion:
              "1",

            reason:
              "copyright",

            note:
              "Verified rights-holder request.",

            copyrightCaseId:
              "CR-1001",

            copyrightClaimant:
              "Example Publisher",

            preventReimport:
              true,

            removedAt:
              ACTION_AT,
          },
          undefined
        );

        expect(
          mocks.resolveCase
        ).toHaveBeenCalledWith(
          expect.objectContaining({
            caseId:
              CASE_ID,

            actionTaken:
              "removed_prevent_reimport",

            preventReimport:
              true,

            resolvedByUserId:
              ADMIN_ID,
          }),
          undefined
        );

        expect(
          mocks.appendAudit
        ).toHaveBeenCalledTimes(
          1
        );

        expect(
          mocks.appendContentAudit
        ).toHaveBeenCalledTimes(
          1
        );

        expect(
          details.case.status
        ).toBe(
          "removed"
        );

        expect(
          details.case.preventReimport
        ).toBe(
          true
        );
      }
    );

    it(
      "blocks removal when verification is incomplete",
      async () => {
        const mocks =
          createDependencies();

        mocks.findCase
          .mockResolvedValue(
            BASE_CASE
          );

        mocks.listVerification
          .mockResolvedValue([
            {
              ...PASSED_CHECK,

              status:
                "review",
            },
          ]);

        const service =
          createAdminCopyrightService({
            dependencies:
              mocks.dependencies,
          });

        await expect(
          service.remove({
            caseId:
              CASE_ID,

            expectedRowVersion:
              "1",

            contentExpectedRowVersion:
              "1",

            internalNote:
              null,

            preventReimport:
              true,

            actorUserId:
              ADMIN_ID,

            actorLabel:
              "Poster Admin",
          })
        ).rejects.toMatchObject({
          code:
            "COPYRIGHT_VERIFICATION_INCOMPLETE",
        } satisfies Partial<
          CopyrightApplicationError
        >);

        expect(
          mocks.removeContent
        ).not.toHaveBeenCalled();

        expect(
          mocks.resolveCase
        ).not.toHaveBeenCalled();
      }
    );

    it(
      "dismisses a case without changing linked content",
      async () => {
        const mocks =
          createDependencies();

        const dismissedCase:
          CopyrightCaseRecord = {
          ...BASE_CASE,

          status:
            "resolved",

          actionTaken:
            "dismissed",

          resolvedAt:
            ACTION_AT,

          resolvedByUserId:
            ADMIN_ID,

          updatedAt:
            ACTION_AT,

          rowVersion:
            "2",
        };

        mocks.findCase
          .mockResolvedValueOnce(
            BASE_CASE
          );

        mocks.resolveCase
          .mockResolvedValue(
            dismissedCase
          );

        mocks.findContent
          .mockResolvedValue(
            ACTIVE_CONTENT
          );

        const service =
          createAdminCopyrightService({
            dependencies:
              mocks.dependencies,
          });

        const details =
          await service.dismiss({
            caseId:
              CASE_ID,

            expectedRowVersion:
              "1",

            actorUserId:
              ADMIN_ID,

            actorLabel:
              "Poster Admin",
          });

        expect(
          mocks.removeContent
        ).not.toHaveBeenCalled();

        expect(
          mocks.restoreContent
        ).not.toHaveBeenCalled();

        expect(
          mocks.resolveCase
        ).toHaveBeenCalledWith(
          expect.objectContaining({
            status:
              "resolved",

            actionTaken:
              "dismissed",

            preventReimport:
              false,
          }),
          undefined
        );

        expect(
          details.case.actionTaken
        ).toBe(
          "dismissed"
        );
      }
    );

    it(
      "blocks restoration for prevent-reimport copyright cases",
      async () => {
        const mocks =
          createDependencies();

        mocks.findCase
          .mockResolvedValue({
            ...BASE_CASE,

            status:
              "removed",

            actionTaken:
              "removed_prevent_reimport",

            preventReimport:
              true,

            resolvedAt:
              ACTION_AT,

            rowVersion:
              "2",
          });

        const service =
          createAdminCopyrightService({
            dependencies:
              mocks.dependencies,
          });

        await expect(
          service.restore({
            caseId:
              CASE_ID,

            expectedRowVersion:
              "2",

            contentExpectedRowVersion:
              "2",

            actorUserId:
              ADMIN_ID,

            actorLabel:
              "Poster Admin",
          })
        ).rejects.toMatchObject({
          code:
            "COPYRIGHT_RESTORE_BLOCKED",
        } satisfies Partial<
          CopyrightApplicationError
        >);

        expect(
          mocks.restoreContent
        ).not.toHaveBeenCalled();

        expect(
          mocks.reopenCase
        ).not.toHaveBeenCalled();
      }
    );

    it(
      "restores eligible content and records the resolved case",
      async () => {
        const mocks =
          createDependencies();

        const removedCase:
          CopyrightCaseRecord = {
          ...BASE_CASE,

          status:
            "removed",

          actionTaken:
            "removed",

          preventReimport:
            false,

          resolvedAt:
            new Date(
              "2026-08-01T09:30:00.000Z"
            ),

          resolvedByUserId:
            ADMIN_ID,

          rowVersion:
            "2",
        };

        const reopenedCase:
          CopyrightCaseRecord = {
          ...BASE_CASE,

          rowVersion:
            "3",
        };

        const restoredCase:
          CopyrightCaseRecord = {
          ...BASE_CASE,

          status:
            "resolved",

          actionTaken:
            "restored",

          resolvedAt:
            ACTION_AT,

          resolvedByUserId:
            ADMIN_ID,

          updatedAt:
            ACTION_AT,

          rowVersion:
            "4",
        };

        const restoredContent:
          DiscoveryContentRecord = {
          ...ACTIVE_CONTENT,

          rowVersion:
            "3",
        };

        mocks.findCase
          .mockResolvedValueOnce(
            removedCase
          );

        mocks.findContent
          .mockResolvedValueOnce(
            RESTORABLE_CONTENT
          )
          .mockResolvedValueOnce(
            restoredContent
          );

        mocks.restoreContent
          .mockResolvedValue(
            restoredContent
          );

        mocks.reopenCase
          .mockResolvedValue(
            reopenedCase
          );

        mocks.resolveCase
          .mockResolvedValue(
            restoredCase
          );

        const service =
          createAdminCopyrightService({
            dependencies:
              mocks.dependencies,
          });

        const details =
          await service.restore({
            caseId:
              CASE_ID,

            expectedRowVersion:
              "2",

            contentExpectedRowVersion:
              "2",

            actorUserId:
              ADMIN_ID,

            actorLabel:
              "Poster Admin",
          });

        expect(
          mocks.restoreContent
        ).toHaveBeenCalledWith(
          {
            contentId:
              CONTENT_ID,

            expectedRowVersion:
              "2",
          },
          undefined
        );

        expect(
          mocks.reopenCase
        ).toHaveBeenCalledWith(
          {
            caseId:
              CASE_ID,

            expectedRowVersion:
              "2",
          },
          undefined
        );

        expect(
          details.case.actionTaken
        ).toBe(
          "restored"
        );

        expect(
          details.content.status
        ).toBe(
          "active"
        );
      }
    );

    it(
      "reports a case version conflict when resolution loses optimistic concurrency",
      async () => {
        const mocks =
          createDependencies();

        mocks.findCase
          .mockResolvedValueOnce(
            BASE_CASE
          );

        mocks.findContent
          .mockResolvedValueOnce(
            ACTIVE_CONTENT
          );

        mocks.removeContent
          .mockResolvedValue(
            REMOVED_CONTENT
          );

        mocks.resolveCase
          .mockResolvedValue(
            null
          );

        const service =
          createAdminCopyrightService({
            dependencies:
              mocks.dependencies,
          });

        await expect(
          service.remove({
            caseId:
              CASE_ID,

            expectedRowVersion:
              "1",

            contentExpectedRowVersion:
              "1",

            internalNote:
              null,

            preventReimport:
              true,

            actorUserId:
              ADMIN_ID,

            actorLabel:
              "Poster Admin",
          })
        ).rejects.toMatchObject({
          code:
            "COPYRIGHT_CASE_VERSION_CONFLICT",
        } satisfies Partial<
          CopyrightApplicationError
        >);

        expect(
          mocks.appendAudit
        ).not.toHaveBeenCalled();

        expect(
          mocks.appendContentAudit
        ).not.toHaveBeenCalled();
      }
    );
  }
);