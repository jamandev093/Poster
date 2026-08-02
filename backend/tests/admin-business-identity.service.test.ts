import {
  describe,
  expect,
  it,
  vi,
} from "vitest";

import type {
  DatabaseQueryExecutor,
} from "../src/database/database.pool.js";

import {
  createAdminBusinessIdentityService,
  BusinessIdentityError,
  type AdminBusinessIdentityServiceDependencies,
} from "../src/application/business-identity/index.js";

import type {
  BusinessIdentityRecord,
} from "../src/domains/business-identity/index.js";

const ADMIN_ID =
  "00000000-0000-4000-8000-000000000101";

const NOW =
  new Date(
    "2026-08-02T15:30:00.000Z"
  );

const IDENTITY:
  BusinessIdentityRecord = {
  key:
    "official",

  publicBrandName:
    "Poster",

  legalBusinessName:
    null,

  websiteUrl:
    "https://getpostar.com",

  officialBusinessEmail:
    "hello@getpostar.com",

  supportEmail:
    "hello@getpostar.com",

  publisherRelationsEmail:
    "publishers@getpostar.com",

  advertisingEmail:
    "ads@getpostar.com",

  copyrightEmail:
    "copyright@getpostar.com",

  signalUrl:
    "https://signal.me/#example",

  signalLabel:
    "Contact Poster on Signal",

  copyrightPortalUrl:
    "https://copyright.getpostar.com",

  clientPortalUrl:
    "https://client.getpostar.com",

  socialLinks:
    {},

  updatedByUserId:
    ADMIN_ID,

  createdAt:
    NOW,

  updatedAt:
    NOW,

  rowVersion:
    "1",
};

function createDraft() {
  return {
    publicBrandName:
      " Poster ",

    legalBusinessName:
      null,

    websiteUrl:
      "https://getpostar.com",

    officialBusinessEmail:
      "hello@getpostar.com",

    supportEmail:
      "hello@getpostar.com",

    publisherRelationsEmail:
      "publishers@getpostar.com",

    advertisingEmail:
      "ads@getpostar.com",

    copyrightEmail:
      "copyright@getpostar.com",

    signalUrl:
      "https://signal.me/#example",

    signalLabel:
      " Contact Poster on Signal ",

    copyrightPortalUrl:
      "https://copyright.getpostar.com",

    clientPortalUrl:
      "https://client.getpostar.com",

    socialLinks:
      {},

    actorUserId:
      ADMIN_ID,

    expectedRowVersion:
      "1",
  };
}

function createDependencies() {
  const executor =
    {} as DatabaseQueryExecutor;

  const findIdentity =
    vi.fn<
      AdminBusinessIdentityServiceDependencies[
        "findIdentity"
      ]
    >()
      .mockResolvedValue(
        IDENTITY
      );

  const upsertIdentity =
    vi.fn<
      AdminBusinessIdentityServiceDependencies[
        "upsertIdentity"
      ]
    >()
      .mockResolvedValue({
        status:
          "updated",

        identity:
          IDENTITY,
      });

  const createAuditEntry =
    vi.fn<
      AdminBusinessIdentityServiceDependencies[
        "createAuditEntry"
      ]
    >()
      .mockResolvedValue();

  const runTransaction:
    AdminBusinessIdentityServiceDependencies[
      "runTransaction"
    ] =
    async operation =>
      await operation(
        executor
      );

  const dependencies = {
    findIdentity,
    upsertIdentity,
    createAuditEntry,
    runTransaction,
    now:
      () =>
        NOW,
  } satisfies
    AdminBusinessIdentityServiceDependencies;

  return {
    dependencies,
    findIdentity,
    upsertIdentity,
    createAuditEntry,
  };
}

describe(
  "Admin Business Identity application service",
  () => {
    it(
      "returns the official business identity",
      async () => {
        const mocks =
          createDependencies();

        const service =
          createAdminBusinessIdentityService({
            dependencies:
              mocks.dependencies,
          });

        await expect(
          service.getOfficial()
        ).resolves.toEqual(
          IDENTITY
        );

        expect(
          mocks.findIdentity
        ).toHaveBeenCalledWith(
          "official"
        );
      }
    );

    it(
      "reports missing official identity explicitly",
      async () => {
        const mocks =
          createDependencies();

        mocks.findIdentity
          .mockResolvedValueOnce(
            null
          );

        const service =
          createAdminBusinessIdentityService({
            dependencies:
              mocks.dependencies,
          });

        await expect(
          service.getOfficial()
        ).rejects.toMatchObject({
          code:
            "BUSINESS_IDENTITY_NOT_FOUND",

          statusCode:
            404,
        });
      }
    );

    it(
      "updates the official identity and writes an audit entry transactionally",
      async () => {
        const mocks =
          createDependencies();

        const service =
          createAdminBusinessIdentityService({
            dependencies:
              mocks.dependencies,
          });

        const result =
          await service.updateOfficial(
            createDraft()
          );

        expect(
          result
        ).toEqual(
          IDENTITY
        );

        expect(
          mocks.upsertIdentity
        ).toHaveBeenCalledWith(
          expect.objectContaining({
            key:
              "official",

            publicBrandName:
              "Poster",

            signalLabel:
              "Contact Poster on Signal",

            updatedByUserId:
              ADMIN_ID,

            expectedRowVersion:
              "1",
          }),
          expect.anything()
        );

        expect(
          mocks.createAuditEntry
        ).toHaveBeenCalledWith(
          expect.objectContaining({
            actorUserId:
              ADMIN_ID,

            action:
              "operations.business_identity.updated",

            entityType:
              "business_identity",

            entityId:
              "official",
          }),
          expect.anything()
        );
      }
    );

    it(
      "rejects invalid official contact values before repository writes",
      async () => {
        const mocks =
          createDependencies();

        const service =
          createAdminBusinessIdentityService({
            dependencies:
              mocks.dependencies,
          });

        await expect(
          service.updateOfficial({
            ...createDraft(),

            officialBusinessEmail:
              "hello@example.com",
          })
        ).rejects.toBeInstanceOf(
          BusinessIdentityError
        );

        expect(
          mocks.upsertIdentity
        ).not.toHaveBeenCalled();
      }
    );

    it(
      "maps row-version conflicts to a stable error",
      async () => {
        const mocks =
          createDependencies();

        mocks.upsertIdentity
          .mockResolvedValueOnce({
            status:
              "conflict",
          });

        const service =
          createAdminBusinessIdentityService({
            dependencies:
              mocks.dependencies,
          });

        await expect(
          service.updateOfficial(
            createDraft()
          )
        ).rejects.toMatchObject({
          code:
            "BUSINESS_IDENTITY_VERSION_CONFLICT",

          statusCode:
            409,
        });
      }
    );
  }
);