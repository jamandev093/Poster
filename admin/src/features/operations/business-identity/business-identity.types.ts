export interface BusinessIdentity {
  key:
    "official";

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

  updatedByUserId:
    string | null;

  createdAt:
    string;

  updatedAt:
    string;

  rowVersion:
    string;
}

export interface BusinessIdentityResponse {
  identity:
    BusinessIdentity;
}

export interface UpdateBusinessIdentityRequest {
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

  expectedRowVersion:
    string;
}

export interface BusinessIdentityApiIssue {
  path:
    string;

  message:
    string;
}

export interface BusinessIdentityApiErrorBody {
  error?: {
    code?:
      string;

    message?:
      string;

    requestId?:
      string;

    details?:
      BusinessIdentityApiIssue[];
  };
}