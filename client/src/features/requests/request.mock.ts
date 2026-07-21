import type {
  ClientRequestRecord,
  ClientRequestStatus,
  ClientRequestType,
} from "./request.types";

export const clientRequests: ClientRequestRecord[] = [
  {
    id: "ADV-1001",
    type: "direct_sponsorship",
    status: "pending_review",

    organization: "Example Cloud",
    contactName: "Aarav Mehta",
    businessEmail: "marketing@examplecloud.com",
    website: "https://examplecloud.com",

    campaignName: "Cloud Skills Campaign",
    submittedAt: "2026-07-20",

    requestedPlacements: ["home", "search"],
    requestedStartDate: "2026-07-25",
    requestedEndDate: "2026-08-15",

    proposedContractValue: 500000,
    conversionDefinition: "Completed course registration",

    creative: {
      headline: "Build your cloud skills",
      body:
        "Professional cloud learning designed for working professionals.",
      callToAction: "Explore courses",
      destinationUrl:
        "https://examplecloud.com/cloud-skills",
    },
  },

  {
    id: "ADV-1002",
    type: "affiliate",
    status: "changes_requested",

    organization: "Example Cloud",
    contactName: "Aarav Mehta",
    businessEmail: "marketing@examplecloud.com",
    website: "https://examplecloud.com",

    campaignName: "Learning Partner Offer",
    submittedAt: "2026-07-19",

    requestedPlacements: ["search", "trending"],
    requestedStartDate: "2026-08-01",
    requestedEndDate: "2026-08-31",

    proposedBudget: 150000,
    commissionModel: "₹400 per verified enrollment",
    conversionDefinition: "Completed paid course enrollment",

    creative: {
      headline: "Advance your professional skills",
      body:
        "Access role-focused learning and certification programs.",
      callToAction: "View learning offer",
      destinationUrl:
        "https://examplecloud.com/learning-offer",
    },

    reviewNote:
      "Add the final destination tracking method and replace the temporary campaign image before resubmitting.",
  },

  {
    id: "ADV-1003",
    type: "direct_sponsorship",
    status: "approved",

    organization: "Example Cloud",
    contactName: "Aarav Mehta",
    businessEmail: "marketing@examplecloud.com",
    website: "https://examplecloud.com",

    campaignName: "Future Skills Sponsorship",
    submittedAt: "2026-07-16",

    requestedPlacements: ["home"],
    requestedStartDate: "2026-08-10",
    requestedEndDate: "2026-09-10",

    proposedContractValue: 300000,
    conversionDefinition: "Program registration",

    creative: {
      headline: "Prepare for future-ready careers",
      body:
        "Explore professional programs for emerging technology roles.",
      callToAction: "View programs",
      destinationUrl:
        "https://examplecloud.com/future-skills",
    },

    linkedCampaignId: "CMP-3010",
  },

  {
    id: "ADV-1004",
    type: "affiliate",
    status: "approved",

    organization: "Example Cloud",
    contactName: "Aarav Mehta",
    businessEmail: "marketing@examplecloud.com",
    website: "https://examplecloud.com",

    campaignName: "Knowledge Academy Partnership",
    submittedAt: "2026-07-12",

    requestedPlacements: ["search", "trending"],
    requestedStartDate: "2026-07-20",
    requestedEndDate: "2026-08-20",

    commissionModel: "12% per completed purchase",
    conversionDefinition: "Completed course purchase",

    creative: {
      headline: "Learn with industry specialists",
      body:
        "Practical courses for professional and technical development.",
      callToAction: "Browse courses",
      destinationUrl:
        "https://examplecloud.com/academy",
    },

    linkedCampaignId: "CMP-3020",
  },

  {
    id: "ADV-1005",
    type: "direct_sponsorship",
    status: "rejected",

    organization: "Example Cloud",
    contactName: "Aarav Mehta",
    businessEmail: "marketing@examplecloud.com",
    website: "https://examplecloud.com",

    campaignName: "General Brand Awareness",
    submittedAt: "2026-07-08",

    requestedPlacements: ["home", "search", "trending"],
    requestedStartDate: "2026-07-15",
    requestedEndDate: "2026-08-15",

    proposedContractValue: 200000,

    creative: {
      headline: "Discover Example Cloud",
      body: "General awareness campaign.",
      callToAction: "Learn more",
      destinationUrl: "https://examplecloud.com",
    },

    reviewNote:
      "This proposal was too broad for Poster’s learning and professional-growth audience. A more relevant campaign may be submitted as a new request.",
  },
];

export function getClientRequestById(
  requestId: string
): ClientRequestRecord | undefined {
  return clientRequests.find(
    (request) =>
      request.id.toLowerCase() === requestId.toLowerCase()
  );
}

export function getRequestTypeLabel(
  type: ClientRequestType
): string {
  switch (type) {
    case "direct_sponsorship":
      return "Direct Sponsorship";

    case "affiliate":
      return "Affiliate";
  }
}

export function getRequestStatusLabel(
  status: ClientRequestStatus
): string {
  switch (status) {
    case "pending_review":
      return "Pending review";

    case "changes_requested":
      return "Changes requested";

    case "approved":
      return "Approved";

    case "rejected":
      return "Rejected";
  }
}

export function formatClientDate(
  date: string
): string {
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(`${date}T00:00:00`));
}

export function formatClientCurrency(
  amount: number
): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}