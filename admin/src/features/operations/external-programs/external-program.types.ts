export type ExternalProgramStatus =
  | "not_applied"
  | "applied"
  | "under_review"
  | "approved"
  | "rejected"
  | "suspended"
  | "closed";

export type ExternalProgramType =
  | "affiliate"
  | "referral"
  | "publisher"
  | "reseller"
  | "lead_generation"
  | "marketplace"
  | "custom";

export type ExternalProgramPayoutMethod =
  | "bank_transfer"
  | "international_bank_transfer"
  | "paypal"
  | "payoneer"
  | "platform_wallet"
  | "cheque"
  | "razorpay"
  | "other";

export type ExternalProgramPaymentSchedule =
  | "weekly"
  | "biweekly"
  | "monthly"
  | "quarterly"
  | "threshold_based"
  | "manual"
  | "other";

export interface ExternalProgramAuditEntry {
  id: string;

  action:
    | "created"
    | "updated"
    | "status_changed"
    | "application_opened"
    | "dashboard_opened";

  message: string;
  actor: string;
  occurredAt: string;
}

export interface ExternalProgramRecord {
  id: string;

  programName: string;
  platformName: string;
  programType: ExternalProgramType;

  applicationUrl: string;
  dashboardUrl: string;

  accountReference: string;
  trackingId: string;

  status: ExternalProgramStatus;

  payoutMethod: ExternalProgramPayoutMethod;
  payoutDestinationLabel: string;
  currency: string;
  minimumPayout: string;
  paymentSchedule: ExternalProgramPaymentSchedule;

  applicationDate: string;
  approvalDate: string;
  nextReviewDate: string;

  notes: string;

  createdAt: string;
  updatedAt: string;

  auditHistory: ExternalProgramAuditEntry[];
}

export interface ExternalProgramDraft {
  programName: string;
  platformName: string;
  programType: ExternalProgramType;

  applicationUrl: string;
  dashboardUrl: string;

  accountReference: string;
  trackingId: string;

  status: ExternalProgramStatus;

  payoutMethod: ExternalProgramPayoutMethod;
  payoutDestinationLabel: string;
  currency: string;
  minimumPayout: string;
  paymentSchedule: ExternalProgramPaymentSchedule;

  applicationDate: string;
  approvalDate: string;
  nextReviewDate: string;

  notes: string;
}

export type ExternalProgramErrors =
  Partial<
    Record<
      keyof ExternalProgramDraft,
      string
    >
  >;
