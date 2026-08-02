export type JsonPrimitive =
  | string
  | number
  | boolean
  | null;

export type JsonValue =
  | JsonPrimitive
  | JsonObject
  | JsonValue[];

export interface JsonObject {
  [key: string]:
    JsonValue;
}

export const BUSINESS_IDENTITY_KEYS = [
  "official",
] as const;

export type BusinessIdentityKey =
  (typeof BUSINESS_IDENTITY_KEYS)[number];

export interface BusinessIdentityRecord {
  key:
    BusinessIdentityKey;

  publicBrandName:
    string;

  legalBusinessName:
    string | null;

  websiteUrl:
    string;

  officialBusinessEmail:
    string;

  supportEmail:
    string | null;

  publisherRelationsEmail:
    string | null;

  advertisingEmail:
    string | null;

  copyrightEmail:
    string | null;

  signalUrl:
    string | null;

  signalLabel:
    string | null;

  copyrightPortalUrl:
    string | null;

  clientPortalUrl:
    string | null;

  socialLinks:
    JsonObject;

  updatedByUserId:
    string | null;

  createdAt:
    Date;

  updatedAt:
    Date;

  rowVersion:
    string;
}

export interface BusinessIdentityDraftInput {
  publicBrandName:
    string;

  legalBusinessName:
    string | null;

  websiteUrl:
    string;

  officialBusinessEmail:
    string;

  supportEmail:
    string | null;

  publisherRelationsEmail:
    string | null;

  advertisingEmail:
    string | null;

  copyrightEmail:
    string | null;

  signalUrl:
    string | null;

  signalLabel:
    string | null;

  copyrightPortalUrl:
    string | null;

  clientPortalUrl:
    string | null;

  socialLinks:
    JsonObject;
}

export interface UpsertBusinessIdentityInput
  extends BusinessIdentityDraftInput {
  key:
    BusinessIdentityKey;

  updatedByUserId:
    string;

  now:
    Date;

  expectedRowVersion?:
    string;
}

export type BusinessIdentityUpsertResult =
  | {
      status:
        "updated";

      identity:
        BusinessIdentityRecord;
    }
  | {
      status:
        "conflict";
    };

export interface BusinessIdentityValidationIssue {
  field:
    string;

  code:
    | "required"
    | "invalid"
    | "too_short"
    | "too_long"
    | "unsupported";

  message:
    string;
}