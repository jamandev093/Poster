import type {
  ClientCampaignRecord,
  ClientCampaignStatus,
  ClientCampaignType,
  ClientTrackingStatus,
} from "./campaign.types";

export const clientCampaigns: ClientCampaignRecord[] = [
  {
    id: "CMP-3001",
    requestId: "ADV-1001",

    name: "Cloud Skills Campaign",
    type: "direct_sponsorship",
    status: "active",

    organization: "Example Cloud",
    placements: ["home", "search"],

    startDate: "2026-07-01",
    endDate: "2026-07-31",

    trackingStatus: "connected",
    conversionDefinition: "Completed course registration",

    performance: {
      impressions: 728000,
      clicks: 18240,
      conversions: 620,
    },

    financials: {
      currency: "INR",
      contractValue: 500000,
      deliveryTarget: 1000000,
      delivered: 728000,
    },
  },

  {
    id: "CMP-3010",
    requestId: "ADV-1003",

    name: "Future Skills Sponsorship",
    type: "direct_sponsorship",
    status: "draft",

    organization: "Example Cloud",
    placements: ["home"],

    startDate: "2026-08-10",
    endDate: "2026-09-10",

    trackingStatus: "not_configured",
    conversionDefinition: "Program registration",

    performance: {
      impressions: 0,
      clicks: 0,
      conversions: null,
    },

    financials: {
      currency: "INR",
      contractValue: 300000,
      deliveryTarget: 600000,
      delivered: 0,
    },
  },

  {
    id: "CMP-3020",
    requestId: "ADV-1004",

    name: "Knowledge Academy Partnership",
    type: "affiliate",
    status: "active",

    organization: "Example Cloud",
    placements: ["search", "trending"],

    startDate: "2026-07-20",
    endDate: "2026-08-20",

    trackingStatus: "connected",
    conversionDefinition: "Completed course purchase",

    performance: {
      impressions: 64000,
      clicks: 2240,
      conversions: 104,
    },

    financials: {
      currency: "INR",
      commission: 41600,
      revenue: 41600,
    },
  },

  {
    id: "CMP-3021",
    requestId: "ADV-1006",

    name: "Certification Partner Campaign",
    type: "affiliate",
    status: "scheduled",

    organization: "Example Cloud",
    placements: ["trending"],

    startDate: "2026-08-05",
    endDate: "2026-09-05",

    trackingStatus: "not_configured",
    conversionDefinition: "Verified certification purchase",

    performance: {
      impressions: 0,
      clicks: 0,
      conversions: null,
    },

    financials: {
      currency: "INR",
      commission: 0,
      revenue: 0,
    },
  },

  {
    id: "CMP-2990",
    requestId: "ADV-0990",

    name: "Professional Learning Launch",
    type: "direct_sponsorship",
    status: "ended",

    organization: "Example Cloud",
    placements: ["home"],

    startDate: "2026-05-01",
    endDate: "2026-05-31",

    trackingStatus: "connected",
    conversionDefinition: "Learning program registration",

    performance: {
      impressions: 450000,
      clicks: 11250,
      conversions: 386,
    },

    financials: {
      currency: "INR",
      contractValue: 250000,
      deliveryTarget: 450000,
      delivered: 450000,
    },
  },
];

export function getClientCampaignById(
  campaignId: string
): ClientCampaignRecord | undefined {
  return clientCampaigns.find(
    (campaign) =>
      campaign.id.toLowerCase() === campaignId.toLowerCase()
  );
}

export function getCampaignTypeLabel(
  type: ClientCampaignType
): string {
  switch (type) {
    case "direct_sponsorship":
      return "Direct Sponsorship";

    case "affiliate":
      return "Affiliate";
  }
}

export function getCampaignStatusLabel(
  status: ClientCampaignStatus
): string {
  switch (status) {
    case "draft":
      return "Draft";

    case "scheduled":
      return "Scheduled";

    case "active":
      return "Active";

    case "paused":
      return "Paused";

    case "ended":
      return "Ended";
  }
}

export function getTrackingStatusLabel(
  status: ClientTrackingStatus
): string {
  switch (status) {
    case "connected":
      return "Connected";

    case "not_configured":
      return "Not configured";

    case "unavailable":
      return "Unavailable";
  }
}

export function calculateCampaignCtr(
  impressions: number,
  clicks: number
): number {
  if (impressions <= 0) {
    return 0;
  }

  return (clicks / impressions) * 100;
}

export function calculateConversionRate(
  clicks: number,
  conversions: number | null
): number | null {
  if (conversions === null) {
    return null;
  }

  if (clicks <= 0) {
    return 0;
  }

  return (conversions / clicks) * 100;
}

export function calculateDeliveryProgress(
  target?: number,
  delivered?: number
): number | null {
  if (
    target === undefined ||
    delivered === undefined ||
    target <= 0
  ) {
    return null;
  }

  return Math.min(100, (delivered / target) * 100);
}

export function calculateRevenuePerClick(
  clicks: number,
  revenue?: number
): number | null {
  if (revenue === undefined) {
    return null;
  }

  if (clicks <= 0) {
    return 0;
  }

  return revenue / clicks;
}

export function formatCampaignCurrency(
  value: number
): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatCampaignNumber(
  value: number
): string {
  return new Intl.NumberFormat("en-IN").format(value);
}

export function formatCampaignDate(
  value: string
): string {
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(`${value}T00:00:00`));
}