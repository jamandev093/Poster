import type {
  BusinessIdentity,
} from "./business-identity.types";

export const INITIAL_BUSINESS_IDENTITY:
  BusinessIdentity = {
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
    null,

  copyrightEmail:
    null,

  signalUrl:
    null,

  signalLabel:
    "Contact on Signal",

  copyrightPortalUrl:
    "https://copyright.getpostar.com",

  clientPortalUrl:
    null,

  socialLinks:
    {},

  updatedByUserId:
    null,

  createdAt:
    "2026-08-02T15:30:00.000Z",

  updatedAt:
    "2026-08-02T15:30:00.000Z",

  rowVersion:
    "1",
};

export const BUSINESS_IDENTITY_MOCK =
  INITIAL_BUSINESS_IDENTITY;