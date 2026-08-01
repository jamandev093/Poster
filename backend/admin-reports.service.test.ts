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
  createAdminReportsService,
  type AdminReportsServiceDependencies,
} from "./src/application/reports/admin-reports.service.js";

import {
  ReportsApplicationError,
} from "./src/application/reports/reports.errors.js";

import type {
  CopyrightCaseRecord,
} from "./src/domains/copyright/index.js";

import type {
  AdminReportAuditEventRecord,
  AdminReportRecord,
} from "./src/domains/reports/index.js";

const REPORT_ID =
  "00000000-0000-4000-8000-000000000a01";

const COPYRIGHT_REPORT_ID =
  "00000000-0000-4000-8000-000000000a02";

const COPYRIGHT_CASE_ID =
  "00000000-0000-4000-8000-000000000701";

const CONTENT_ID =
  "00000000-0000-4000-8000-000000000501";

const ADMIN_ID =
  "00000000-0000-4000-8000-000000000101";

const RECEIVED_AT =
  new Date(
    "2026-08-01T08:00:00.000Z"
  );

const ACTION_AT =
  new Date(
    "2026-08-01T10:00:00.000Z"
  );

const BASE_REPORT:
  AdminReportRecord = {
  id:
    REPORT_ID,

  publicId:
    "RPT-2046",

  reportType:
    "misleading_content",

  status:
    "needs_action",

  reporterName:
    "Example Reporter",

  reporterReference:
    "User U-8250",

  affectedKind:
    "content",

  affectedRecordId:
    "CNT-2003",

  affectedTitle:
    "Example content title",

  affectedMetadata:
    "Example Publisher - Article record",

  reason:
    "The report says the headline may misrepresent the original source.",

  routedToCopyright:
    false,

  copyrightCaseId:
    null,

  resolutionNote:
    null,

  receivedAt:
    RECEIVED_AT,

  resolvedAt:
    null,

  resolvedByUserId:
    null,

  createdAt:
    RECEIVED_AT,

  updatedAt:
    RECEIVED_AT,

  rowVersion:
    "1",
};

const COPYRIGHT_REPORT:
  AdminReportRecord = {
  ...BASE_REPORT,

  id:
    COPYRIGHT_REPORT_ID,

  publicId:
    "RPT-2042",

  reportType:
    "copyright",

  affectedRecordId:
    CONTENT_ID,

  affectedTitle:
    "Example copyrighted work",

  affectedMetadata:
    "Example Publisher - Copyright concern",
};

const COPYRIGHT_CASE:
  CopyrightCaseRecord = {
  id:
    COPYRIGHT_CASE_ID,

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
    "The linked discovery record refers to protected publisher material.",

  submittedOriginalUrl:
    "https://example.com/original-work",

  supportingInformation:
    null,

  verificationStatus:
    "verified",

  actionTaken:
    null,

  preventReimport:
    false,

  receivedAt:
    RECEIVED_AT,

  resolvedAt:
    null,

  resolvedByUserId:
    null,

  createdAt:
    RECEIVED_AT,

  updatedAt:
    RECEIVED_AT,

  rowVersion:
    "1",
};

const AUDIT_EVENT:
  AdminReportAuditEventRecord = {
  id:
    "00000000-0000-4000-8000-000000000b01",

  reportId:
    REPORT_ID,

  action:
    "Report received",

  actorUserId:
    null,

  actorLabel:
    "System",

  previousStatus:
    null,

  resultingStatus:
    "needs_action",

  metadata:
    {},

  occurredAt:
    RECEIVED_AT,
};

function createDependencies() {
  const listReports =
    vi.fn()
      .mockResolvedValue([
        BASE_REPORT,
      ]);

  const listActionableReports =
    vi.fn()
      .mockResolvedValue([
        BASE_REPORT,
      ]);

  const findReport =
    vi.fn();

  const resolveReport =
    vi.fn();

  const routeReportToCopyright =
    vi.fn();

  const listAudit =
    vi.fn()
      .mockResolvedValue([
        AUDIT_EVENT,
      ]);

  const appendAudit =
    vi.fn()
      .mockResolvedValue({
        ...AUDIT_EVENT,

        id:
          "00000000-0000-4000-8000-000000000b02",

        action:
          "Report action",

        actorUserId:
          ADMIN_ID,

        actorLabel:
          "Poster Admin",

        occurredAt:
          ACTION_AT,
      });

  const findCopyrightCase =
    vi.fn();

  const dependencies = {
    listReports,
    listActionableReports,
    findReport,
    resolveReport,
    routeReportToCopyright,
    listAudit,
    appendAudit,
    findCopyrightCase,

    now:
      () =>
        ACTION_AT,
  } as unknown as
    AdminReportsServiceDependencies;

  return {
    dependencies,
    listReports,
    listActionableReports,
    findReport,
    resolveReport,
    routeReportToCopyright,
    listAudit,
    appendAudit,
    findCopyrightCase,
  };
}

describe(
  "Admin Reports application service",
  () => {
    beforeEach(
      () => {
        vi.clearAllMocks();
      }
    );

    it(
      "lists all reports as summaries",
      async () => {
        const mocks =
          createDependencies();

        const service =
          createAdminReportsService({
            dependencies:
              mocks.dependencies,
          });

        const result =
          await service.list();

        expect(
          mocks.listReports
        ).toHaveBeenCalledTimes(
          1
        );

        expect(
          result
        ).toEqual([
          {
            report:
              BASE_REPORT,
          },
        ]);
      }
    );

    it(
      "lists only actionable reports",
      async () => {
        const mocks =
          createDependencies();

        const service =
          createAdminReportsService({
            dependencies:
              mocks.dependencies,
          });

        const result =
          await service
            .listActionable();

        expect(
          mocks.listActionableReports
        ).toHaveBeenCalledTimes(
          1
        );

        expect(
          result[0]
            ?.report
            .status
        ).toBe(
          "needs_action"
        );
      }
    );

    it(
      "returns report details with immutable audit history",
      async () => {
        const mocks =
          createDependencies();

        mocks.findReport
          .mockResolvedValue(
            BASE_REPORT
          );

        const service =
          createAdminReportsService({
            dependencies:
              mocks.dependencies,
          });

        const details =
          await service.getById(
            REPORT_ID
          );

        expect(
          mocks.listAudit
        ).toHaveBeenCalledWith(
          REPORT_ID
        );

        expect(
          details.report
        ).toEqual(
          BASE_REPORT
        );

        expect(
          details.audit
        ).toEqual([
          AUDIT_EVENT,
        ]);

        expect(
          details.copyrightCase
        ).toBeNull();
      }
    );

    it(
      "throws REPORT_NOT_FOUND for an unknown report",
      async () => {
        const mocks =
          createDependencies();

        mocks.findReport
          .mockResolvedValue(
            null
          );

        const service =
          createAdminReportsService({
            dependencies:
              mocks.dependencies,
          });

        await expect(
          service.getById(
            REPORT_ID
          )
        ).rejects.toMatchObject({
          code:
            "REPORT_NOT_FOUND",
        } satisfies Partial<
          ReportsApplicationError
        >);
      }
    );

    it(
      "resolves a non-Copyright report and appends immutable audit",
      async () => {
        const mocks =
          createDependencies();

        const resolvedReport:
          AdminReportRecord = {
          ...BASE_REPORT,

          status:
            "resolved",

          resolutionNote:
            "The affected record was reviewed and corrected.",

          resolvedAt:
            ACTION_AT,

          resolvedByUserId:
            ADMIN_ID,

          updatedAt:
            ACTION_AT,

          rowVersion:
            "2",
        };

        mocks.findReport
          .mockResolvedValueOnce(
            BASE_REPORT
          );

        mocks.resolveReport
          .mockResolvedValue(
            resolvedReport
          );

        const service =
          createAdminReportsService({
            dependencies:
              mocks.dependencies,
          });

        const details =
          await service.resolve({
            reportId:
              REPORT_ID,

            expectedRowVersion:
              "1",

            resolutionNote:
              "The affected record was reviewed and corrected.",

            actorUserId:
              ADMIN_ID,

            actorLabel:
              "Poster Admin",
          });

        expect(
          mocks.resolveReport
        ).toHaveBeenCalledWith(
          {
            reportId:
              REPORT_ID,

            expectedRowVersion:
              "1",

            status:
              "resolved",

            resolutionNote:
              "The affected record was reviewed and corrected.",

            resolvedAt:
              ACTION_AT,

            resolvedByUserId:
              ADMIN_ID,
          },
          undefined
        );

        expect(
          mocks.appendAudit
        ).toHaveBeenCalledWith(
          expect.objectContaining({
            reportId:
              REPORT_ID,

            action:
              "Report resolved",

            previousStatus:
              "needs_action",

            resultingStatus:
              "resolved",

            actorUserId:
              ADMIN_ID,
          }),
          undefined
        );

        expect(
          details.report.status
        ).toBe(
          "resolved"
        );
      }
    );

    it(
      "dismisses an actionable report",
      async () => {
        const mocks =
          createDependencies();

        const dismissedReport:
          AdminReportRecord = {
          ...BASE_REPORT,

          status:
            "dismissed",

          resolutionNote:
            "No further operational action is required.",

          resolvedAt:
            ACTION_AT,

          resolvedByUserId:
            ADMIN_ID,

          updatedAt:
            ACTION_AT,

          rowVersion:
            "2",
        };

        mocks.findReport
          .mockResolvedValueOnce(
            BASE_REPORT
          );

        mocks.resolveReport
          .mockResolvedValue(
            dismissedReport
          );

        const service =
          createAdminReportsService({
            dependencies:
              mocks.dependencies,
          });

        const details =
          await service.dismiss({
            reportId:
              REPORT_ID,

            expectedRowVersion:
              "1",

            resolutionNote:
              "No further operational action is required.",

            actorUserId:
              ADMIN_ID,

            actorLabel:
              "Poster Admin",
          });

        expect(
          mocks.resolveReport
        ).toHaveBeenCalledWith(
          expect.objectContaining({
            status:
              "dismissed",
          }),
          undefined
        );

        expect(
          mocks.appendAudit
        ).toHaveBeenCalledWith(
          expect.objectContaining({
            action:
              "Report dismissed - no further operational action required",

            resultingStatus:
              "dismissed",
          }),
          undefined
        );

        expect(
          details.report.status
        ).toBe(
          "dismissed"
        );
      }
    );

    it(
      "routes a Copyright report to a matching Copyright case",
      async () => {
        const mocks =
          createDependencies();

        const routedReport:
          AdminReportRecord = {
          ...COPYRIGHT_REPORT,

          status:
            "resolved",

          routedToCopyright:
            true,

          copyrightCaseId:
            COPYRIGHT_CASE_ID,

          resolutionNote:
            "Linked to the verified Copyright workflow.",

          resolvedAt:
            ACTION_AT,

          resolvedByUserId:
            ADMIN_ID,

          updatedAt:
            ACTION_AT,

          rowVersion:
            "2",
        };

        mocks.findReport
          .mockResolvedValueOnce(
            COPYRIGHT_REPORT
          );

        mocks.findCopyrightCase
          .mockResolvedValue(
            COPYRIGHT_CASE
          );

        mocks.routeReportToCopyright
          .mockResolvedValue(
            routedReport
          );

        const service =
          createAdminReportsService({
            dependencies:
              mocks.dependencies,
          });

        const details =
          await service
            .routeToCopyright({
              reportId:
                COPYRIGHT_REPORT_ID,

              expectedRowVersion:
                "1",

              copyrightCaseId:
                COPYRIGHT_CASE_ID,

              resolutionNote:
                "Linked to the verified Copyright workflow.",

              actorUserId:
                ADMIN_ID,

              actorLabel:
                "Poster Admin",
            });

        expect(
          mocks.routeReportToCopyright
        ).toHaveBeenCalledWith(
          {
            reportId:
              COPYRIGHT_REPORT_ID,

            expectedRowVersion:
              "1",

            copyrightCaseId:
              COPYRIGHT_CASE_ID,

            resolutionNote:
              "Linked to the verified Copyright workflow.",

            resolvedAt:
              ACTION_AT,

            resolvedByUserId:
              ADMIN_ID,
          },
          undefined
        );

        expect(
          mocks.appendAudit
        ).toHaveBeenCalledWith(
          expect.objectContaining({
            action:
              "Report routed to Copyright management",

            metadata:
              expect.objectContaining({
                copyrightCaseId:
                  COPYRIGHT_CASE_ID,

                copyrightCasePublicId:
                  "CR-1001",

                copyrightContentId:
                  CONTENT_ID,
              }),
          }),
          undefined
        );

        expect(
          details.report
            .routedToCopyright
        ).toBe(
          true
        );

        expect(
          details.copyrightCase
        ).toEqual(
          COPYRIGHT_CASE
        );
      }
    );

    it(
      "blocks normal resolution for Copyright reports",
      async () => {
        const mocks =
          createDependencies();

        mocks.findReport
          .mockResolvedValue(
            COPYRIGHT_REPORT
          );

        const service =
          createAdminReportsService({
            dependencies:
              mocks.dependencies,
          });

        await expect(
          service.resolve({
            reportId:
              COPYRIGHT_REPORT_ID,

            expectedRowVersion:
              "1",

            actorUserId:
              ADMIN_ID,

            actorLabel:
              "Poster Admin",
          })
        ).rejects.toMatchObject({
          code:
            "REPORT_COPYRIGHT_TYPE_REQUIRED",
        } satisfies Partial<
          ReportsApplicationError
        >);

        expect(
          mocks.resolveReport
        ).not.toHaveBeenCalled();

        expect(
          mocks.appendAudit
        ).not.toHaveBeenCalled();
      }
    );

    it(
      "rejects Copyright routing for a non-Copyright report",
      async () => {
        const mocks =
          createDependencies();

        mocks.findReport
          .mockResolvedValue(
            BASE_REPORT
          );

        const service =
          createAdminReportsService({
            dependencies:
              mocks.dependencies,
          });

        await expect(
          service.routeToCopyright({
            reportId:
              REPORT_ID,

            expectedRowVersion:
              "1",

            copyrightCaseId:
              COPYRIGHT_CASE_ID,

            actorUserId:
              ADMIN_ID,

            actorLabel:
              "Poster Admin",
          })
        ).rejects.toMatchObject({
          code:
            "REPORT_COPYRIGHT_TYPE_REQUIRED",
        } satisfies Partial<
          ReportsApplicationError
        >);

        expect(
          mocks.findCopyrightCase
        ).not.toHaveBeenCalled();

        expect(
          mocks.routeReportToCopyright
        ).not.toHaveBeenCalled();
      }
    );

    it(
      "rejects a Copyright case linked to a different affected content UUID",
      async () => {
        const mocks =
          createDependencies();

        const mismatchedReport:
          AdminReportRecord = {
          ...COPYRIGHT_REPORT,

          affectedRecordId:
            "00000000-0000-4000-8000-000000000999",
        };

        mocks.findReport
          .mockResolvedValue(
            mismatchedReport
          );

        mocks.findCopyrightCase
          .mockResolvedValue(
            COPYRIGHT_CASE
          );

        const service =
          createAdminReportsService({
            dependencies:
              mocks.dependencies,
          });

        await expect(
          service.routeToCopyright({
            reportId:
              COPYRIGHT_REPORT_ID,

            expectedRowVersion:
              "1",

            copyrightCaseId:
              COPYRIGHT_CASE_ID,

            actorUserId:
              ADMIN_ID,

            actorLabel:
              "Poster Admin",
          })
        ).rejects.toMatchObject({
          code:
            "REPORT_COPYRIGHT_CONTENT_MISMATCH",
        } satisfies Partial<
          ReportsApplicationError
        >);

        expect(
          mocks.routeReportToCopyright
        ).not.toHaveBeenCalled();
      }
    );

    it(
      "rejects actions against a completed report",
      async () => {
        const mocks =
          createDependencies();

        mocks.findReport
          .mockResolvedValue({
            ...BASE_REPORT,

            status:
              "resolved",

            resolvedAt:
              ACTION_AT,

            resolvedByUserId:
              ADMIN_ID,
          });

        const service =
          createAdminReportsService({
            dependencies:
              mocks.dependencies,
          });

        await expect(
          service.dismiss({
            reportId:
              REPORT_ID,

            expectedRowVersion:
              "2",

            actorUserId:
              ADMIN_ID,

            actorLabel:
              "Poster Admin",
          })
        ).rejects.toMatchObject({
          code:
            "REPORT_STATE_CONFLICT",
        } satisfies Partial<
          ReportsApplicationError
        >);

        expect(
          mocks.resolveReport
        ).not.toHaveBeenCalled();
      }
    );

    it(
      "reports optimistic concurrency failure before appending audit",
      async () => {
        const mocks =
          createDependencies();

        mocks.findReport
          .mockResolvedValue(
            BASE_REPORT
          );

        mocks.resolveReport
          .mockResolvedValue(
            null
          );

        const service =
          createAdminReportsService({
            dependencies:
              mocks.dependencies,
          });

        await expect(
          service.resolve({
            reportId:
              REPORT_ID,

            expectedRowVersion:
              "1",

            actorUserId:
              ADMIN_ID,

            actorLabel:
              "Poster Admin",
          })
        ).rejects.toMatchObject({
          code:
            "REPORT_VERSION_CONFLICT",
        } satisfies Partial<
          ReportsApplicationError
        >);

        expect(
          mocks.appendAudit
        ).not.toHaveBeenCalled();
      }
    );
  }
);