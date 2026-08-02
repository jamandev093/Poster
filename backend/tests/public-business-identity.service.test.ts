import {
  describe,
  expect,
  it,
  vi,
} from "vitest";

import {
  BusinessIdentityError,
  createPublicBusinessIdentityService,
  type PublicBusinessIdentityServiceDependencies,
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
    "5",
};

function createDependencies() {
  const findIdentity =
    vi.fn<
      PublicBusinessIdentityServiceDependencies[
        "findIdentity"
      ]
    >()
      .mockResolvedValue(
        IDENTITY
      );

  const dependencies = {
    findIdentity,
  } satisfies
    PublicBusinessIdentityServiceDependencies;

  return {
    dependencies,
    findIdentity,
  };
}

describe(
  "Public Business Identity service",
  () => {
    it(
      "returns safe public identity fields only",
      async () => {
        const mocks =
          createDependencies();

        const service =
          createPublicBusinessIdentityService({
            dependencies:
              mocks.dependencies,
          });

        const result =
          await service.getPublicIdentity();

        expect(
          result
        ).toEqual({
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

          updatedAt:
            NOW,
        });

        expect(
          "rowVersion" in result
        ).toBe(
          false
        );

        expect(
          "updatedByUserId" in result
        ).toBe(
          false
        );
      }
    );

    it(
      "reports a missing official identity explicitly",
      async () => {
        const mocks =
          createDependencies();

        mocks.findIdentity
          .mockResolvedValueOnce(
            null
          );

        const service =
          createPublicBusinessIdentityService({
            dependencies:
              mocks.dependencies,
          });

        await expect(
          service.getPublicIdentity()
        ).rejects.toBeInstanceOf(
          BusinessIdentityError
        );
      }
    );
  }
);