import Fastify, {
  type FastifyInstance,
} from "fastify";

import {
  describe,
  expect,
  it,
  vi,
} from "vitest";

import {
  BusinessIdentityError,
  type PublicBusinessIdentityService,
} from "../src/application/business-identity/index.js";

import {
  publicBusinessIdentityRoutes,
} from "../src/routes/public-business-identity.routes.js";

const NOW =
  new Date(
    "2026-08-02T15:30:00.000Z"
  );

function createServiceMocks() {
  const getPublicIdentity =
    vi.fn()
      .mockResolvedValue({
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

  const service = {
    getPublicIdentity,
  } satisfies
    PublicBusinessIdentityService;

  return {
    getPublicIdentity,
    service,
  };
}

async function buildApp(
  service:
    PublicBusinessIdentityService
): Promise<
  FastifyInstance
> {
  const app =
    Fastify({
      logger:
        false,
    });

  await app.register(
    publicBusinessIdentityRoutes,
    {
      prefix:
        "/api/v1",

      service,
    }
  );

  return app;
}

describe(
  "Public Business Identity HTTP route",
  () => {
    it(
      "returns public business identity without Admin authentication",
      async () => {
        const mocks =
          createServiceMocks();

        const app =
          await buildApp(
            mocks.service
          );

        const response =
          await app.inject({
            method:
              "GET",

            url:
              "/api/v1/public/business-identity",
          });

        expect(
          response.statusCode
        ).toBe(
          200
        );

        const body =
          response.json();

        expect(
          body
        ).toMatchObject({
          identity: {
            publicBrandName:
              "Poster",

            officialBusinessEmail:
              "hello@getpostar.com",

            updatedAt:
              NOW.toISOString(),
          },
        });

        expect(
          body.identity.rowVersion
        ).toBeUndefined();

        expect(
          body.identity.updatedByUserId
        ).toBeUndefined();

        await app.close();
      }
    );

    it(
      "maps missing identity to HTTP 404",
      async () => {
        const mocks =
          createServiceMocks();

        mocks.getPublicIdentity
          .mockRejectedValueOnce(
            new BusinessIdentityError({
              code:
                "BUSINESS_IDENTITY_NOT_FOUND",

              message:
                "The official business identity has not been configured.",

              statusCode:
                404,
            })
          );

        const app =
          await buildApp(
            mocks.service
          );

        const response =
          await app.inject({
            method:
              "GET",

            url:
              "/api/v1/public/business-identity",
          });

        expect(
          response.statusCode
        ).toBe(
          404
        );

        expect(
          response.json()
        ).toMatchObject({
          error: {
            code:
              "BUSINESS_IDENTITY_NOT_FOUND",
          },
        });

        await app.close();
      }
    );
  }
);