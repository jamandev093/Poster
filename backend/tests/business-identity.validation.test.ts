import {
  describe,
  expect,
  it,
} from "vitest";

import {
  validateBusinessIdentityDraft,
} from "../src/domains/business-identity/index.js";

const VALID_DRAFT = {
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
};

describe(
  "Business Identity validation",
  () => {
    it(
      "accepts official Poster business identity values",
      () => {
        expect(
          validateBusinessIdentityDraft(
            VALID_DRAFT
          )
        ).toEqual(
          []
        );
      }
    );

    it(
      "requires an official getpostar.com business email",
      () => {
        const issues =
          validateBusinessIdentityDraft({
            ...VALID_DRAFT,

            officialBusinessEmail:
              "hello@example.com",
          });

        expect(
          issues
        ).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              field:
                "officialBusinessEmail",

              code:
                "unsupported",
            }),
          ])
        );
      }
    );

    it(
      "rejects non-HTTPS public URLs",
      () => {
        const issues =
          validateBusinessIdentityDraft({
            ...VALID_DRAFT,

            websiteUrl:
              "http://getpostar.com",

            signalUrl:
              "http://signal.example",
          });

        expect(
          issues.map(
            issue =>
              issue.field
          )
        ).toEqual(
          expect.arrayContaining([
            "websiteUrl",
            "signalUrl",
          ])
        );
      }
    );

    it(
      "keeps social links as a JSON object",
      () => {
        const issues =
          validateBusinessIdentityDraft({
            ...VALID_DRAFT,

            socialLinks:
              [] as never,
          });

        expect(
          issues
        ).toEqual([
          expect.objectContaining({
            field:
              "socialLinks",
          }),
        ]);
      }
    );
  }
);