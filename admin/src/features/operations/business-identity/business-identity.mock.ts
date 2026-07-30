import type {
  BusinessIdentityRecord,
} from "./business-identity.types";

export const INITIAL_BUSINESS_IDENTITY:
  BusinessIdentityRecord = {
  company: {
    brandName: "Poster",
    legalBusinessName: "",
    businessType: "",
    foundedYear: "2026",
    country: "India",
    businessEmail: "",
    businessPhone: "",
    websiteUrl: "https://getpostar.com",
    appUrl: "",
    shortDescription:
      "Poster is an AI-powered knowledge and content discovery platform.",
    detailedDescription:
      "Poster helps users discover relevant information, products and services while directing them to original external sources. Commercial recommendations are selected by Poster’s internal operations team and clearly disclosed.",
  },

  publisher: {
    contentCategories:
      "Technology, business, education, productivity and general knowledge",
    audienceDescription:
      "People using Poster to discover useful knowledge, trusted information, products and professional services.",
    primaryCountries:
      "India",
    languages:
      "English",
    promotionMethods:
      "Editorial recommendations, contextual discovery, search results and clearly disclosed promotional cards.",
    trafficSources:
      "Poster mobile application, getpostar.com and Poster-owned web experiences.",
    estimatedMonthlyReach:
      "",
  },

  properties: [
    {
      id: "property-website",
      name: "Poster public website",
      type: "website",
      url: "https://getpostar.com",
      status: "active",
      approvedForPromotion: true,
    },
    {
      id: "property-mobile",
      name: "Poster mobile application",
      type: "mobile_app",
      url: "",
      status: "planned",
      approvedForPromotion: false,
    },
  ],

  compliance: {
    affiliateDisclosure:
      "Affiliate · Poster may earn a commission when users complete an eligible action through this link.",
    privacyPolicyUrl:
      "https://getpostar.com/privacy",
    termsUrl:
      "https://getpostar.com/terms",
    contactUrl:
      "https://getpostar.com/contact",
    copyrightPolicyUrl:
      "https://getpostar.com/copyright-rights",
    trafficIntegrityStatement:
      "Poster does not use forced redirects, hidden links, cookie stuffing, fabricated traffic or misleading commercial claims.",
    prohibitedCategories:
      "Illegal products, unsafe products, misleading financial schemes, adult services and products that conflict with Poster policy.",
  },

  payout: {
    legalEntityStatus: "incomplete",
    taxIdentityStatus: "incomplete",
    gstStatus: "incomplete",
    bankAccountStatus: "incomplete",
    beneficiaryName: "",
    defaultCurrency: "INR",
    internalNotes: "",
  },

  updatedAt: "Not saved",
};
