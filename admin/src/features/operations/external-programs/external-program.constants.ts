import type {
  ExternalProgramPaymentSchedule,
  ExternalProgramPayoutMethod,
  ExternalProgramStatus,
  ExternalProgramType,
} from "./external-program.types";

export const PROGRAM_STATUS_OPTIONS:
  ReadonlyArray<{
    value: ExternalProgramStatus;
    label: string;
  }> = [
  {
    value: "not_applied",
    label: "Not applied",
  },
  {
    value: "applied",
    label: "Applied",
  },
  {
    value: "under_review",
    label: "Under review",
  },
  {
    value: "approved",
    label: "Approved",
  },
  {
    value: "rejected",
    label: "Rejected",
  },
  {
    value: "suspended",
    label: "Suspended",
  },
  {
    value: "closed",
    label: "Closed",
  },
];

export const PROGRAM_TYPE_OPTIONS:
  ReadonlyArray<{
    value: ExternalProgramType;
    label: string;
  }> = [
  {
    value: "affiliate",
    label: "Affiliate",
  },
  {
    value: "referral",
    label: "Referral",
  },
  {
    value: "publisher",
    label: "Publisher",
  },
  {
    value: "reseller",
    label: "Reseller",
  },
  {
    value: "lead_generation",
    label: "Lead generation",
  },
  {
    value: "marketplace",
    label: "Marketplace",
  },
  {
    value: "custom",
    label: "Custom",
  },
];

export const PAYOUT_METHOD_OPTIONS:
  ReadonlyArray<{
    value: ExternalProgramPayoutMethod;
    label: string;
  }> = [
  {
    value: "bank_transfer",
    label: "Bank transfer",
  },
  {
    value: "international_bank_transfer",
    label: "International bank transfer",
  },
  {
    value: "paypal",
    label: "PayPal",
  },
  {
    value: "payoneer",
    label: "Payoneer",
  },
  {
    value: "platform_wallet",
    label: "Platform wallet",
  },
  {
    value: "cheque",
    label: "Cheque",
  },
  {
    value: "razorpay",
    label: "Razorpay",
  },
  {
    value: "other",
    label: "Other",
  },
];

export const PAYMENT_SCHEDULE_OPTIONS:
  ReadonlyArray<{
    value: ExternalProgramPaymentSchedule;
    label: string;
  }> = [
  {
    value: "weekly",
    label: "Weekly",
  },
  {
    value: "biweekly",
    label: "Every two weeks",
  },
  {
    value: "monthly",
    label: "Monthly",
  },
  {
    value: "quarterly",
    label: "Quarterly",
  },
  {
    value: "threshold_based",
    label: "Threshold based",
  },
  {
    value: "manual",
    label: "Manual",
  },
  {
    value: "other",
    label: "Other",
  },
];

export function programStatusLabel(
  status: ExternalProgramStatus
) {
  return (
    PROGRAM_STATUS_OPTIONS.find(
      (option) =>
        option.value === status
    )?.label ?? status
  );
}

export function programTypeLabel(
  type: ExternalProgramType
) {
  return (
    PROGRAM_TYPE_OPTIONS.find(
      (option) =>
        option.value === type
    )?.label ?? type
  );
}

export function payoutMethodLabel(
  method: ExternalProgramPayoutMethod
) {
  return (
    PAYOUT_METHOD_OPTIONS.find(
      (option) =>
        option.value === method
    )?.label ?? method
  );
}

export function paymentScheduleLabel(
  schedule: ExternalProgramPaymentSchedule
) {
  return (
    PAYMENT_SCHEDULE_OPTIONS.find(
      (option) =>
        option.value === schedule
    )?.label ?? schedule
  );
}
