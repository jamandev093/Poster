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

import type {
  AdminCopyrightCaseDetails,
  AdminCopyrightCaseSummary,
  AdminCopyrightService,
} from "./src/application/copyright/index.js";

import {
  CopyrightApplicationError,
} from "./src/application/copyright/index.js";

import type {
  AuthorizationContext,
  PlatformPermission,
} from "./src/domains/authorization/index.js";

import type {
  ContentSourceAuditEventRecord,
  DiscoveryContentRecord,
} from "./src/domains/content-sources/index.js";

import type {
  CopyrightAuditEventRecord,
  CopyrightCaseRecord,
  CopyrightEvidenceReferenceRecord,
  CopyrightVerificationCheckRecord,
} from "./src/domains/copyright/index.js";

import {
  registerErrorHandler,
} from "./src/plugins/error-handler.js";

import {
  adminCopyrightRoutes,
} from "./src/routes/admin-copyright.routes.js";

const ADMIN_USER_ID =
  "00000000-0000-4000-8000-000000000101";

const SESSION_ID =
  "00000000-0000-4000-8000-000000000102";

const CASE_ID =
  "00000000-0000-4000-8000-000000000701";

const CONTENT_ID =
  "00000000-0000-4000-8000-000000000501";

const SOURCE_ID =
  "00000000-0000-4000-8000-000000000401";

const RECEIVED_AT =
  new Date(
    "2026-08-01T08:00:00.000Z"
  );

const VERIFIED_AT =
  new Date(
    "2026-08-01T09:00:00.000Z"
  );

const ACTION_AT =
  new Date(
    "2026-08-01T10:00:00.000Z"
  );

const COPYRIGHT_CASE:
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
    RECEIVED_AT,

  resolvedAt:
    null,

  resolvedByUserId:
    null,

  createdAt:
    RECEIVED_AT,

  updatedAt:
    VERIFIED_AT,

  rowVersion:
    "3",
};

const DISCOVERY_CONTENT:
  DiscoveryContentRecord = {
  id:
    CONTENT_ID,

  publicId:
    "CNT-2003",

  sourceId:
    SOURCE_ID,

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
    "5",
};

const VERIFICATION_CHECK:
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
    ADMIN_USER_ID,

  verifiedAt:
    VERIFIED_AT,

  createdAt:
    RECEIVED_AT,

  updatedAt:
    VERIFIED_AT,

  rowVersion:
    "2",
};

const EVIDENCE_REFERENCE:
  CopyrightEvidenceReferenceRecord = {
  id:
    "00000000-0000-4000-8000-000000000802",

  caseId:
    CASE_ID,

  evidenceType:
    "original_work_url",

  label:
    "Original publisher work",

  referenceValue:
    "https://example.com/original-work",

  storageObjectKey:
    null,

  sha256Digest:
    null,

  submittedAt:
    RECEIVED_AT,

  createdAt:
    RECEIVED_AT,
};

const COPYRIGHT_AUDIT:
  CopyrightAuditEventRecord = {
  id:
    "00000000-0000-4000-8000-000000000901",

  caseId:
    CASE_ID,

  action:
    "Copyright case submitted",

  actorUserId:
    null,

  actorLabel:
    "Copyright Web App",

  previousStatus:
    null,

  resultingStatus:
    "needs_action",

  metadata: {
    source:
      "copyright_web_app",
  },

  occurredAt:
    RECEIVED_AT,
};

const CONTENT_AUDIT:
  ContentSourceAuditEventRecord = {
  id:
    "00000000-0000-4000-8000-000000000902",

  entityType:
    "content",

  sourceId:
    SOURCE_ID,

  contentId:
    CONTENT_ID,

  action:
    "Content imported",

  actorUserId:
    null,

  actorLabel:
    "Poster ingestion",

  metadata:
    {},

  occurredAt:
    new Date(
      "2026-07-20T09:00:00.000Z"
    ),
};

const SUMMARY:
  AdminCopyrightCaseSummary = {
  case:
    COPYRIGHT_CASE,

  content:
    DISCOVERY_CONTENT,
};

const DETAILS:
  AdminCopyrightCaseDetails = {
  ...SUMMARY,

  verificationChecks: [
    VERIFICATION_CHECK,
  ],

  evidence: [
    EVIDENCE_REFERENCE,
  ],

  audit: [
    COPYRIGHT_AUDIT,
  ],

  contentAudit: [
    CONTENT_AUDIT,
  ],
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

  const getById =
    vi.fn();

  const remove =
    vi.fn();

  const dismiss =
    vi.fn();

  const restore =
    vi.fn();

  const service = {
    list,
    getById,
    remove,
    dismiss,
    restore,
  } as unknown as
    AdminCopyrightService;

  return {
    service,
    list,
    getById,
    remove,
    dismiss,
    restore,
  };
}

async function buildTestApp(
  service:
    AdminCopyrightService,
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
    adminCopyrightRoutes,
    {
      prefix:
        "/api/v1/admin",

      service,
    }
  );

  return app;
}

describe(
  "Poster Admin Copyright HTTP routes",
  () => {
    beforeEach(
      () => {
        vi.clearAllMocks();
      }
    );

    it(
      "returns serialized Copyright cases to an authorized Admin",
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
              "copyright.read",
            ])
          );

        const response =
          await app.inject({
            method:
              "GET",

            url:
              "/api/v1/admin/copyright",
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
          body.cases
        ).toHaveLength(
          1
        );

        expect(
          body.cases[0]
        ).toMatchObject({
          case: {
            id:
              CASE_ID,

            publicId:
              "CR-1001",

            claimantName:
              "Example Publisher",

            receivedAt:
              RECEIVED_AT.toISOString(),

            rowVersion:
              "3",
          },

          content: {
            id:
              CONTENT_ID,

            publicId:
              "CNT-2003",

            originalUrl:
              "https://example.com/original-work",

            rowVersion:
              "5",
          },
        });

        expect(
          mocks.list
        ).toHaveBeenCalledTimes(
          1
        );

        await app.close();
      }
    );

    it(
      "rejects unauthenticated Copyright access",
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
              "/api/v1/admin/copyright",
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
      "rejects an Admin without copyright.read",
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
              "/api/v1/admin/copyright",
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
      "returns serialized case details, verification, evidence and immutable audit history",
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
              "copyright.read",
            ])
          );

        const response =
          await app.inject({
            method:
              "GET",

            url:
              `/api/v1/admin/copyright/${CASE_ID}`,
          });

        expect(
          response.statusCode
        ).toBe(
          200
        );

        const body =
          response.json();

        expect(
          body.case.id
        ).toBe(
          CASE_ID
        );

        expect(
          body.verificationChecks
        ).toEqual([
          expect.objectContaining({
            checkKey:
              "poster_content_match",

            status:
              "passed",

            verifiedAt:
              VERIFIED_AT.toISOString(),
          }),
        ]);

        expect(
          body.evidence
        ).toEqual([
          expect.objectContaining({
            evidenceType:
              "original_work_url",

            referenceValue:
              "https://example.com/original-work",
          }),
        ]);

        expect(
          body.audit
        ).toEqual([
          expect.objectContaining({
            action:
              "Copyright case submitted",

            occurredAt:
              RECEIVED_AT.toISOString(),
          }),
        ]);

        expect(
          body.contentAudit
        ).toHaveLength(
          1
        );

        expect(
          mocks.getById
        ).toHaveBeenCalledWith(
          CASE_ID
        );

        await app.close();
      }
    );

    it(
      "removes verified content using the authenticated Admin identity",
      async () => {
        const mocks =
          createServiceMocks();

        mocks.remove
          .mockResolvedValue({
            ...DETAILS,

            case: {
              ...COPYRIGHT_CASE,

              status:
                "removed",

              actionTaken:
                "removed_prevent_reimport",

              preventReimport:
                true,

              resolvedAt:
                ACTION_AT,

              resolvedByUserId:
                ADMIN_USER_ID,

              rowVersion:
                "4",
            },

            content: {
              ...DISCOVERY_CONTENT,

              status:
                "removed",

              removedAt:
                ACTION_AT,

              removalReason:
                "copyright",

              copyrightCaseId:
                "CR-1001",

              copyrightClaimant:
                "Example Publisher",

              preventReimport:
                true,

              rowVersion:
                "6",
            },
          });

        const app =
          await buildTestApp(
            mocks.service,
            createAuthorizationContext([
              "admin.access",
              "copyright.read",
              "copyright.manage",
            ])
          );

        const response =
          await app.inject({
            method:
              "POST",

            url:
              `/api/v1/admin/copyright/${CASE_ID}/remove`,

            payload: {
              expectedRowVersion:
                "3",

              contentExpectedRowVersion:
                "5",

              internalNote:
                "Verified rights-holder request.",

              preventReimport:
                true,
            },
          });

        expect(
          response.statusCode
        ).toBe(
          200
        );

        expect(
          mocks.remove
        ).toHaveBeenCalledWith({
          caseId:
            CASE_ID,

          expectedRowVersion:
            "3",

          contentExpectedRowVersion:
            "5",

          internalNote:
            "Verified rights-holder request.",

          preventReimport:
            true,

          actorUserId:
            ADMIN_USER_ID,

          actorLabel:
            "Poster Admin",
        });

        expect(
          response.json()
            .case
            .preventReimport
        ).toBe(
          true
        );

        await app.close();
      }
    );

    it(
      "rejects malformed removal input before calling the service",
      async () => {
        const mocks =
          createServiceMocks();

        const app =
          await buildTestApp(
            mocks.service,
            createAuthorizationContext([
              "admin.access",
              "copyright.manage",
            ])
          );

        const response =
          await app.inject({
            method:
              "POST",

            url:
              `/api/v1/admin/copyright/${CASE_ID}/remove`,

            payload: {
              expectedRowVersion:
                "",

              contentExpectedRowVersion:
                "5",

              preventReimport:
                "yes",
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
              "INVALID_COPYRIGHT_ACTION",
          },
        });

        expect(
          mocks.remove
        ).not.toHaveBeenCalled();

        await app.close();
      }
    );

    it(
      "maps a Copyright case version conflict to HTTP 409",
      async () => {
        const mocks =
          createServiceMocks();

        mocks.dismiss
          .mockRejectedValue(
            new CopyrightApplicationError(
              "COPYRIGHT_CASE_VERSION_CONFLICT",
              "The copyright case changed before dismissal completed."
            )
          );

        const app =
          await buildTestApp(
            mocks.service,
            createAuthorizationContext([
              "admin.access",
              "copyright.manage",
            ])
          );

        const response =
          await app.inject({
            method:
              "POST",

            url:
              `/api/v1/admin/copyright/${CASE_ID}/dismiss`,

            payload: {
              expectedRowVersion:
                "3",
            },
          });

        expect(
          response.statusCode
        ).toBe(
          409
        );

        expect(
          response.json()
        ).toEqual({
          error: {
            code:
              "COPYRIGHT_CASE_VERSION_CONFLICT",

            message:
              "The copyright case changed before dismissal completed.",
          },
        });

        await app.close();
      }
    );

    it(
      "maps a blocked Copyright restoration to HTTP 422",
      async () => {
        const mocks =
          createServiceMocks();

        mocks.restore
          .mockRejectedValue(
            new CopyrightApplicationError(
              "COPYRIGHT_RESTORE_BLOCKED",
              "Prevent-reimport copyright cases cannot be restored."
            )
          );

        const app =
          await buildTestApp(
            mocks.service,
            createAuthorizationContext([
              "admin.access",
              "copyright.manage",
            ])
          );

        const response =
          await app.inject({
            method:
              "POST",

            url:
              `/api/v1/admin/copyright/${CASE_ID}/restore`,

            payload: {
              expectedRowVersion:
                "4",

              contentExpectedRowVersion:
                "6",
            },
          });

        expect(
          response.statusCode
        ).toBe(
          422
        );

        expect(
          response.json()
        ).toEqual({
          error: {
            code:
              "COPYRIGHT_RESTORE_BLOCKED",

            message:
              "Prevent-reimport copyright cases cannot be restored.",
          },
        });

        await app.close();
      }
    );

    it(
      "rejects Copyright mutation without copyright.manage",
      async () => {
        const mocks =
          createServiceMocks();

        const app =
          await buildTestApp(
            mocks.service,
            createAuthorizationContext([
              "admin.access",
              "copyright.read",
            ])
          );

        const response =
          await app.inject({
            method:
              "POST",

            url:
              `/api/v1/admin/copyright/${CASE_ID}/dismiss`,

            payload: {
              expectedRowVersion:
                "3",
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