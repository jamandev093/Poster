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
    Record<string, unknown>;

  updatedAt:
    string;
}

export interface PublicBusinessIdentityResponse {
  identity:
    PublicBusinessIdentity;
}