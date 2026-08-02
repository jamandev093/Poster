import {
  describe,
  expect,
  it,
} from "vitest";

import type {
  DatabaseQueryExecutor,
} from "../src/database/database.pool.js";

import {
  findBusinessIdentityByKey,
  upsertBusinessIdentity,
} from "../src/domains/business-identity/index.js";

const ADMIN_ID =
  "00000000-0000-4000-8000-000000000101";

const NOW =
  new Date(
    "2026-08-02T15:30:00.000Z"
  );

const ROW = {
  identity_key:
    "official" as const,

  public_brand_name:
    "Poster",

  legal_business_name:
    null,

  website_url:
    "https://getpostar.com",

  official_business_email:
    "hello@getpostar.com",

  support_email:
    "hello@getpostar.com",

  publisher_relations_email:
    "publishers@getpostar.com",

  advertising_email:
    "ads@getpostar.com",

  copyright_email:
    "copyright@getpostar.com",

  signal_url:
    "https://signal.me/#example",

  signal_label:
    "Contact Poster on Signal",

  copyright_portal_url:
    "https://copyright.getpostar.com",

  client_portal_url:
    "https://client.getpostar.com",

  social_links:
    {},

  updated_by_user_id:
    ADMIN_ID,

  created_at:
    NOW,

  updated_at:
    NOW,

  row_version:
    "1",
};

function createExecutor(
  rowsByCall:
    readonly (
      readonly Record<
        string,
        unknown
      >[]
    )[]
) {
  const calls: {
    text:
      string;

    values:
      readonly unknown[];
  }[] =
    [];

  let callIndex =
    0;

  const executor = {
    query:
      async (
        text:
          string,
        values?:
          readonly unknown[]
      ) => {
        calls.push({
          text,

          values:
            values ??
            [],
        });

        const rows =
          rowsByCall[
            callIndex
          ] ??
          [];

        callIndex +=
          1;

        return {
          command:
            "",

          rowCount:
            rows.length,

          oid:
            0,

          fields:
            [],

          rows:
            Array.from(
              rows
            ),
        };
      },
  } as unknown as
    DatabaseQueryExecutor;

  return {
    calls,
    executor,
  };
}

function createInput() {
  return {
    key:
      "official" as const,

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

    updatedByUserId:
      ADMIN_ID,

    now:
      NOW,

    expectedRowVersion:
      "1",
  };
}

describe(
  "Business Identity repository",
  () => {
    it(
      "finds the official business identity",
      async () => {
        const mocks =
          createExecutor([
            [
              ROW,
            ],
          ]);

        const result =
          await findBusinessIdentityByKey(
            "official",
            mocks.executor
          );

        expect(
          result
        ).toEqual(
          expect.objectContaining({
            key:
              "official",

            publicBrandName:
              "Poster",

            officialBusinessEmail:
              "hello@getpostar.com",
          })
        );

        expect(
          mocks.calls[0]?.text
        ).toContain(
          "FROM app.business_identities"
        );
      }
    );

    it(
      "upserts the official business identity with row-version protection",
      async () => {
        const mocks =
          createExecutor([
            [
              ROW,
            ],
          ]);

        const result =
          await upsertBusinessIdentity(
            createInput(),
            mocks.executor
          );

        expect(
          result
        ).toEqual({
          status:
            "updated",

          identity:
            expect.objectContaining({
              key:
                "official",
            }),
        });

        expect(
          mocks.calls[0]?.text
        ).toContain(
          "ON CONFLICT (identity_key)"
        );

        expect(
          mocks.calls[0]?.text
        ).toContain(
          "row_version = app.business_identities.row_version + 1"
        );

        expect(
          mocks.calls[0]?.values
        ).toContain(
          "Poster"
        );
      }
    );

    it(
      "returns conflict when row-version update does not return a row",
      async () => {
        const mocks =
          createExecutor([
            [],
          ]);

        await expect(
          upsertBusinessIdentity(
            createInput(),
            mocks.executor
          )
        ).resolves.toEqual({
          status:
            "conflict",
        });
      }
    );
  }
);