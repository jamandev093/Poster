import type {
  ExternalEarningEventType,
  ExternalEarningSource,
  ExternalEarningStatus,
  ExternalPayoutStatus,
} from "./external-earning.types";

export const EARNING_STATUS_OPTIONS:
  ReadonlyArray<{
    value: ExternalEarningStatus;
    label: string;
  }> = [
  {
    value: "pending",
    label: "Pending",
  },
  {
    value: "confirmed",
    label: "Confirmed",
  },
  {
    value: "approved",
    label: "Approved",
  },
  {
    value: "payable",
    label: "Payable",
  },
  {
    value: "paid",
    label: "Paid",
  },
  {
    value: "reversed",
    label: "Reversed",
  },
  {
    value: "rejected",
    label: "Rejected",
  },
];

export const EARNING_EVENT_OPTIONS:
  ReadonlyArray<{
    value: ExternalEarningEventType;
    label: string;
  }> = [
  {
    value: "sale",
    label: "Sale",
  },
  {
    value: "lead",
    label: "Lead",
  },
  {
    value: "qualified_lead",
    label: "Qualified lead",
  },
  {
    value: "signup",
    label: "Signup",
  },
  {
    value: "trial_started",
    label: "Trial started",
  },
  {
    value: "subscription",
    label: "Subscription",
  },
  {
    value: "service_purchase",
    label: "Service purchase",
  },
  {
    value: "booking",
    label: "Booking",
  },
  {
    value: "installation_completed",
    label: "Installation completed",
  },
  {
    value: "application_submitted",
    label: "Application submitted",
  },
  {
    value: "app_installed",
    label: "App installed",
  },
  {
    value: "custom",
    label: "Custom",
  },
];

export const EARNING_SOURCE_OPTIONS:
  ReadonlyArray<{
    value: ExternalEarningSource;
    label: string;
  }> = [
  {
    value: "manual",
    label: "Manual entry",
  },
  {
    value: "platform_dashboard",
    label: "Platform dashboard",
  },
  {
    value: "statement",
    label: "Statement",
  },
  {
    value: "csv_import",
    label: "CSV import",
  },
  {
    value: "api",
    label: "API",
  },
  {
    value: "webhook",
    label: "Webhook",
  },
];

export const PAYOUT_STATUS_OPTIONS:
  ReadonlyArray<{
    value: ExternalPayoutStatus;
    label: string;
  }> = [
  {
    value: "not_payable",
    label: "Not payable",
  },
  {
    value: "awaiting_threshold",
    label: "Awaiting threshold",
  },
  {
    value: "scheduled",
    label: "Scheduled",
  },
  {
    value: "processing",
    label: "Processing",
  },
  {
    value: "paid",
    label: "Paid",
  },
  {
    value: "failed",
    label: "Failed",
  },
  {
    value: "reversed",
    label: "Reversed",
  },
];

export function earningStatusLabel(
  status: ExternalEarningStatus
) {
  return (
    EARNING_STATUS_OPTIONS.find(
      (option) =>
        option.value === status
    )?.label ?? status
  );
}

export function earningEventLabel(
  eventType: ExternalEarningEventType
) {
  return (
    EARNING_EVENT_OPTIONS.find(
      (option) =>
        option.value === eventType
    )?.label ?? eventType
  );
}

export function earningSourceLabel(
  source: ExternalEarningSource
) {
  return (
    EARNING_SOURCE_OPTIONS.find(
      (option) =>
        option.value === source
    )?.label ?? source
  );
}

export function payoutStatusLabel(
  status: ExternalPayoutStatus
) {
  return (
    PAYOUT_STATUS_OPTIONS.find(
      (option) =>
        option.value === status
    )?.label ?? status
  );
}
