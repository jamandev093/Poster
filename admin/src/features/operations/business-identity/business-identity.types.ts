export type BusinessIdentitySection =
  | "company"
  | "publisher"
  | "properties"
  | "compliance"
  | "payout"
  | "application-kit";

export type ReadinessStatus =
  | "complete"
  | "incomplete"
  | "not-applicable";

export interface BusinessCompanyProfile {
  brandName: string;
  legalBusinessName: string;
  businessType: string;
  foundedYear: string;
  country: string;
  businessEmail: string;
  businessPhone: string;
  websiteUrl: string;
  appUrl: string;
  shortDescription: string;
  detailedDescription: string;
}

export interface PublisherProfile {
  contentCategories: string;
  audienceDescription: string;
  primaryCountries: string;
  languages: string;
  promotionMethods: string;
  trafficSources: string;
  estimatedMonthlyReach: string;
}

export interface BusinessProperty {
  id: string;
  name: string;
  type:
    | "website"
    | "mobile_app"
    | "web_app"
    | "other";
  url: string;
  status:
    | "active"
    | "planned"
    | "inactive";
  approvedForPromotion: boolean;
}

export interface ComplianceProfile {
  affiliateDisclosure: string;
  privacyPolicyUrl: string;
  termsUrl: string;
  contactUrl: string;
  copyrightPolicyUrl: string;
  trafficIntegrityStatement: string;
  prohibitedCategories: string;
}

export interface PayoutReadiness {
  legalEntityStatus: ReadinessStatus;
  taxIdentityStatus: ReadinessStatus;
  gstStatus: ReadinessStatus;
  bankAccountStatus: ReadinessStatus;
  beneficiaryName: string;
  defaultCurrency: string;
  internalNotes: string;
}

export interface BusinessIdentityRecord {
  company: BusinessCompanyProfile;
  publisher: PublisherProfile;
  properties: BusinessProperty[];
  compliance: ComplianceProfile;
  payout: PayoutReadiness;
  updatedAt: string;
}
