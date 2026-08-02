import {
  findBusinessIdentityByKey,
  type BusinessIdentityRecord,
  type JsonObject,
} from "../../domains/business-identity/index.js";

import {
  BusinessIdentityError,
} from "./business-identity.errors.js";

export interface PublicBusinessIdentity {
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

  updatedAt:
    Date;
}

export interface PublicBusinessIdentityService {
  getPublicIdentity:
    () => Promise<
      PublicBusinessIdentity
    >;
}

export interface PublicBusinessIdentityServiceDependencies {
  findIdentity:
    typeof findBusinessIdentityByKey;
}

export interface CreatePublicBusinessIdentityServiceOptions {
  dependencies?:
    Partial<
      PublicBusinessIdentityServiceDependencies
    >;
}

function toPublicIdentity(
  identity:
    BusinessIdentityRecord
): PublicBusinessIdentity {
  return {
    publicBrandName:
      identity.publicBrandName,

    legalBusinessName:
      identity.legalBusinessName,

    websiteUrl:
      identity.websiteUrl,

    officialBusinessEmail:
      identity.officialBusinessEmail,

    supportEmail:
      identity.supportEmail,

    publisherRelationsEmail:
      identity.publisherRelationsEmail,

    advertisingEmail:
      identity.advertisingEmail,

    copyrightEmail:
      identity.copyrightEmail,

    signalUrl:
      identity.signalUrl,

    signalLabel:
      identity.signalLabel,

    copyrightPortalUrl:
      identity.copyrightPortalUrl,

    clientPortalUrl:
      identity.clientPortalUrl,

    socialLinks:
      identity.socialLinks,

    updatedAt:
      identity.updatedAt,
  };
}

export function createPublicBusinessIdentityService(
  options:
    CreatePublicBusinessIdentityServiceOptions =
    {}
): PublicBusinessIdentityService {
  const dependencies:
    PublicBusinessIdentityServiceDependencies = {
    findIdentity:
      findBusinessIdentityByKey,

    ...options.dependencies,
  };

  return {
    async getPublicIdentity() {
      const identity =
        await dependencies.findIdentity(
          "official"
        );

      if (
        !identity
      ) {
        throw new BusinessIdentityError({
          code:
            "BUSINESS_IDENTITY_NOT_FOUND",

          message:
            "The official business identity has not been configured.",

          statusCode:
            404,
        });
      }

      return toPublicIdentity(
        identity
      );
    },
  };
}