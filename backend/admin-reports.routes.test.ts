import Fastify, {
  type FastifyInstance,
} from "fastify";

import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

import {
  ReportsApplicationError,
  type AdminReportDetails,
  type AdminReportSummary,
  type AdminReportsService,
} from "./src/application/reports/index.js";

import type {
  AuthorizationContext,
  PlatformPermission,
} from "./src/domains/authorization/index.js";

import type {
  CopyrightCaseRecord,
} from "./src/domains/copyright/index.js";

import type {
  AdminReportAuditEventRecord,
  AdminReportRecord,
} from "./src/domains/reports/index.js";

import {
  registerErrorHandler,
} from "./src/plugins/error-handler.js";

import {
  adminReportsRoutes,
} from "./src/routes/admin-reports.routes.js";

const ADMIN_USER_ID =
  "00000000-0000-4000-8000-000000000101";

const SESSION_ID =
  "00000000-0000-4000-8000-000000000102";

const REPORT_ID =
  "00000000-0000-4000-8000-000000000a01";

const COPYRIGHT_REPORT_ID =
  "00000000-0000-4000-8000-000000000a02";

const COPYRIGHT_CASE_ID =
  "00000000-0000-4000-8000-000000000701";

const CONTENT_ID =
  "00000000-0000-4000-8000-000000000501";

const RECEIVED_AT =
  new Date(
    "2026-08-01T08:00:00.000Z"
  );

const ACTION_AT =
  new Date(
    "2026-08-01T10:00:00.000Z"
  );

const REPORT:
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
    "Example Publisher - Article",

  reason:
    "The headline may misrepresent the original source.",

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
  ...REPORT,

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

const REPORT_AUDIT:
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
    "Poster reporting workflow",

  previousStatus:
    null,

  resultingStatus:
    "needs_action",

  metadata: {
    source:
      "mobile_app",
  },

  occurredAt:
    RECEIVED_AT,
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
    "The linked record refers to protected publisher material.",

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
    "3",
};

const SUMMARY:
  AdminReportSummary = {
  report:
    REPORT,
};

const DETAILS:
  AdminReportDetails = {
  report:
    REPORT,

  audit: [
    REPORT_AUDIT,
  ],

  copyrightCase:
    null,
};

function createAuthorizationContext(
  permissions:
    readonly PlatformPermission[]
): AuthorizationContext {
  return {
    userId:
      ADMIN_USER_ID,

    sessionId:
      SESSION_ID,

    email:
      "admin@getpostar.com",

    fullName:
      "Poster Admin",

    accountStatus:
      "active",

    platformRoles: [
      "copyright_admin",
    ],

    platformPermissions:
      permissions,

    organizationMemberships:
      [],
  };
}

function createServiceMocks() {
  const list =
    vi.fn();

  const listActionable =
    vi.fn();

  const getById =
    vi.fn();

  const resolve =
    vi.fn();

  const dismiss =
    vi.fn();

  const routeToCopyright =
    vi.fn();

  const service = {
    list,
    listActionable,
    getById,
    resolve,
    dismiss,
    routeToCopyright,
  } as unknown as
    AdminReportsService;

  return {
    service,
    list,
    listActionable,
    getById,
    resolve,
    dismiss,
    routeToCopyright,
  };
}

async function buildTestApp(
  service:
    AdminReportsService,
  authorizationContext:
    AuthorizationContext |
    null
): Promise<FastifyInstance> {
  const app =
    Fastify({
      logger:
        false,
    });

  app.addHook(
    "onRequest",
    async request => {
      Object.defineProperty(
        request,
        "authorizationContext",
        {
          configurable:
            true,

          enumerable:
            true,

          value:
            authorizationContext,

          writable:
            true,
        }
      );
    }
  );

  registerErrorHandler(
    app
  );

  await app.register(
    adminReportsRoutes,
    {
      prefix:
        "/api/v1/admin",

      service,
    }
  );

  return app;
}

describe(
  "Poster Admin Reports HTTP routes",
  () => {
    beforeEach(
      () => {
        vi.clearAllMocks();
      }
    );

    it(
      "returns serialized reports to an authorized Admin",
      async () => {
        const mocks =
          createServiceMocks();

        mocks.list
          .mockResolvedValue([
            SUMMARY,
          ]);

        const app =
          await buildTestApp(
            mocks.service,
            createAuthorizationContext([
              "admin.access",
              "reports.read",
            ])
          );

        const response =
          await app.inject({
            method:
              "GET",

            url:
              "/api/v1/admin/reports",
          });

        expect(
          response.statusCode
        ).toBe(
          200
        );

        const body =
          response.json();

        expect(
          body.generatedAt
        ).toEqual(
          expect.any(
            String
          )
        );

        expect(
          body.reports
        ).toEqual([
          {
            report:
              expect.objectContaining({
                id:
                  REPORT_ID,

                publicId:
                  "RPT-2046",

                reportType:
                  "misleading_content",

                status:
                  "needs_action",

                receivedAt:
                  RECEIVED_AT.toISOString(),

                rowVersion:
                  "1",
              }),
          },
        ]);

        expect(
          mocks.list
        ).toHaveBeenCalledTimes(
          1
        );

        await app.close();
      }
    );

    it(
      "returns only actionable reports through the actionable endpoint",
      async () => {
        const mocks =
          createServiceMocks();

        mocks.listActionable
          .mockResolvedValue([
            SUMMARY,
          ]);

        const app =
          await buildTestApp(
            mocks.service,
            createAuthorizationContext([
              "admin.access",
              "reports.read",
            ])
          );

        const response =
          await app.inject({
            method:
              "GET",

            url:
              "/api/v1/admin/reports/actionable",
          });

        expect(
          response.statusCode
        ).toBe(
          200
        );

        expect(
          response.json()
            .reports[0]
            .report
            .status
        ).toBe(
          "needs_action"
        );

        expect(
          mocks.listActionable
        ).toHaveBeenCalledTimes(
          1
        );

        await app.close();
      }
    );

    it(
      "rejects unauthenticated report access",
      async () => {
        const mocks =
          createServiceMocks();

        const app =
          await buildTestApp(
            mocks.service,
            null
          );

        const response =
          await app.inject({
            method:
              "GET",

            url:
              "/api/v1/admin/reports",
          });

        expect(
          response.statusCode
        ).toBe(
          401
        );

        expect(
          mocks.list
        ).not.toHaveBeenCalled();

        await app.close();
      }
    );

    it(
      "rejects an Admin without reports.read",
      async () => {
        const mocks =
          createServiceMocks();

        const app =
          await buildTestApp(
            mocks.service,
            createAuthorizationContext([
              "admin.access",
              "dashboard.read",
            ])
          );

        const response =
          await app.inject({
            method:
              "GET",

            url:
              "/api/v1/admin/reports",
          });

        expect(
          response.statusCode
        ).toBe(
          403
        );

        expect(
          mocks.list
        ).not.toHaveBeenCalled();

        await app.close();
      }
    );

    it(
      "returns report details with immutable audit history",
      async () => {
        const mocks =
          createServiceMocks();

        mocks.getById
          .mockResolvedValue(
            DETAILS
          );

        const app =
          await buildTestApp(
            mocks.service,
            createAuthorizationContext([
              "admin.access",
              "reports.read",
            ])
          );

        const response =
          await app.inject({
            method:
              "GET",

            url:
              `/api/v1/admin/reports/${REPORT_ID}`,
          });

        expect(
          response.statusCode
        ).toBe(
          200
        );

        const body =
          response.json();

        expect(
          body.report.id
        ).toBe(
          REPORT_ID
        );

        expect(
          body.audit
        ).toEqual([
          expect.objectContaining({
            action:
              "Report received",

            resultingStatus:
              "needs_action",

            occurredAt:
              RECEIVED_AT.toISOString(),
          }),
        ]);

        expect(
          body.copyrightCase
        ).toBeNull();

        expect(
          mocks.getById
        ).toHaveBeenCalledWith(
          REPORT_ID
        );

        await app.close();
      }
    );

    it(
      "resolves a report using the authenticated Admin identity",
      async () => {
        const mocks =
          createServiceMocks();

        mocks.resolve
          .mockResolvedValue({
            ...DETAILS,

            report: {
              ...REPORT,

              status:
                "resolved",

              resolutionNote:
                "Reviewed and corrected.",

              resolvedAt:
                ACTION_AT,

              resolvedByUserId:
                ADMIN_USER_ID,

              updatedAt:
                ACTION_AT,

              rowVersion:
                "2",
            },
          });

        const app =
          await buildTestApp(
            mocks.service,
            createAuthorizationContext([
              "admin.access",
              "reports.read",
              "reports.manage",
            ])
          );

        const response =
          await app.inject({
            method:
              "POST",

            url:
              `/api/v1/admin/reports/${REPORT_ID}/resolve`,

            payload: {
              expectedRowVersion:
                "1",

              resolutionNote:
                "Reviewed and corrected.",
            },
          });

        expect(
          response.statusCode
        ).toBe(
          200
        );

        expect(
          mocks.resolve
        ).toHaveBeenCalledWith({
          reportId:
            REPORT_ID,

          expectedRowVersion:
            "1",

          resolutionNote:
            "Reviewed and corrected.",

          actorUserId:
            ADMIN_USER_ID,

          actorLabel:
            "Poster Admin",
        });

        expect(
          response.json()
            .report
            .status
        ).toBe(
          "resolved"
        );

        await app.close();
      }
    );

    it(
      "dismisses an actionable report",
      async () => {
        const mocks =
          createServiceMocks();

        mocks.dismiss
          .mockResolvedValue({
            ...DETAILS,

            report: {
              ...REPORT,

              status:
                "dismissed",

              resolutionNote:
                "No operational action required.",

              resolvedAt:
                ACTION_AT,

              resolvedByUserId:
                ADMIN_USER_ID,

              updatedAt:
                ACTION_AT,

              rowVersion:
                "2",
            },
          });

        const app =
          await buildTestApp(
            mocks.service,
            createAuthorizationContext([
              "admin.access",
              "reports.manage",
            ])
          );

        const response =
          await app.inject({
            method:
              "POST",

            url:
              `/api/v1/admin/reports/${REPORT_ID}/dismiss`,

            payload: {
              expectedRowVersion:
                "1",

              resolutionNote:
                "No operational action required.",
            },
          });

        expect(
          response.statusCode
        ).toBe(
          200
        );

        expect(
          mocks.dismiss
        ).toHaveBeenCalledWith({
          reportId:
            REPORT_ID,

          expectedRowVersion:
            "1",

          resolutionNote:
            "No operational action required.",

          actorUserId:
            ADMIN_USER_ID,

          actorLabel:
            "Poster Admin",
        });

        await app.close();
      }
    );

    it(
      "routes a Copyright report using a validated Copyright case UUID",
      async () => {
        const mocks =
          createServiceMocks();

        mocks.routeToCopyright
          .mockResolvedValue({
            report: {
              ...COPYRIGHT_REPORT,

              status:
                "resolved",

              routedToCopyright:
                true,

              copyrightCaseId:
                COPYRIGHT_CASE_ID,

              resolutionNote:
                "Linked to Copyright management.",

              resolvedAt:
                ACTION_AT,

              resolvedByUserId:
                ADMIN_USER_ID,

              updatedAt:
                ACTION_AT,

              rowVersion:
                "2",
            },

            audit: [
              REPORT_AUDIT,
            ],

            copyrightCase:
              COPYRIGHT_CASE,
          });

        const app =
          await buildTestApp(
            mocks.service,
            createAuthorizationContext([
              "admin.access",
              "reports.manage",
            ])
          );

        const response =
          await app.inject({
            method:
              "POST",

            url:
              `/api/v1/admin/reports/${COPYRIGHT_REPORT_ID}/route-copyright`,

            payload: {
              expectedRowVersion:
                "1",

              copyrightCaseId:
                COPYRIGHT_CASE_ID,

              resolutionNote:
                "Linked to Copyright management.",
            },
          });

        expect(
          response.statusCode
        ).toBe(
          200
        );

        expect(
          mocks.routeToCopyright
        ).toHaveBeenCalledWith({
          reportId:
            COPYRIGHT_REPORT_ID,

          expectedRowVersion:
            "1",

          copyrightCaseId:
            COPYRIGHT_CASE_ID,

          resolutionNote:
            "Linked to Copyright management.",

          actorUserId:
            ADMIN_USER_ID,

          actorLabel:
            "Poster Admin",
        });

        expect(
          response.json()
            .copyrightCase
            .publicId
        ).toBe(
          "CR-1001"
        );

        await app.close();
      }
    );

    it(
      "rejects malformed report action input before calling the service",
      async () => {
        const mocks =
          createServiceMocks();

        const app =
          await buildTestApp(
            mocks.service,
            createAuthorizationContext([
              "admin.access",
              "reports.manage",
            ])
          );

        const response =
          await app.inject({
            method:
              "POST",

            url:
              `/api/v1/admin/reports/${REPORT_ID}/resolve`,

            payload: {
              expectedRowVersion:
                "",

              resolutionNote:
                42,
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
              "INVALID_REPORT_ACTION",
          },
        });

        expect(
          mocks.resolve
        ).not.toHaveBeenCalled();

        await app.close();
      }
    );

    it(
      "maps report application failures to 404, 409 and 422 responses",
      async () => {
        const mocks =
          createServiceMocks();

        const authorization =
          createAuthorizationContext([
            "admin.access",
            "reports.read",
            "reports.manage",
          ]);

        mocks.getById
          .mockRejectedValueOnce(
            new ReportsApplicationError(
              "REPORT_NOT_FOUND",
              "Admin report was not found."
            )
          );

        const app =
          await buildTestApp(
            mocks.service,
            authorization
          );

        const notFoundResponse =
          await app.inject({
            method:
              "GET",

            url:
              `/api/v1/admin/reports/${REPORT_ID}`,
          });

        expect(
          notFoundResponse.statusCode
        ).toBe(
          404
        );

        mocks.dismiss
          .mockRejectedValueOnce(
            new ReportsApplicationError(
              "REPORT_VERSION_CONFLICT",
              "The report changed before dismissal completed."
            )
          );

        const conflictResponse =
          await app.inject({
            method:
              "POST",

            url:
              `/api/v1/admin/reports/${REPORT_ID}/dismiss`,

            payload: {
              expectedRowVersion:
                "1",
            },
          });

        expect(
          conflictResponse.statusCode
        ).toBe(
          409
        );

        mocks.routeToCopyright
          .mockRejectedValueOnce(
            new ReportsApplicationError(
              "REPORT_COPYRIGHT_CONTENT_MISMATCH",
              "The selected Copyright case does not match the affected content."
            )
          );

        const validationResponse =
          await app.inject({
            method:
              "POST",

            url:
              `/api/v1/admin/reports/${COPYRIGHT_REPORT_ID}/route-copyright`,

            payload: {
              expectedRowVersion:
                "1",

              copyrightCaseId:
                COPYRIGHT_CASE_ID,
            },
          });

        expect(
          validationResponse.statusCode
        ).toBe(
          422
        );

        expect(
          validationResponse.json()
        ).toEqual({
          error: {
            code:
              "REPORT_COPYRIGHT_CONTENT_MISMATCH",

            message:
              "The selected Copyright case does not match the affected content.",
          },
        });

        await app.close();
      }
    );

    it(
      "rejects report mutation without reports.manage",
      async () => {
        const mocks =
          createServiceMocks();

        const app =
          await buildTestApp(
            mocks.service,
            createAuthorizationContext([
              "admin.access",
              "reports.read",
            ])
          );

        const response =
          await app.inject({
            method:
              "POST",

            url:
              `/api/v1/admin/reports/${REPORT_ID}/dismiss`,

            payload: {
              expectedRowVersion:
                "1",
            },
          });

        expect(
          response.statusCode
        ).toBe(
          403
        );

        expect(
          mocks.dismiss
        ).not.toHaveBeenCalled();

        await app.close();
      }
    );
  }
);