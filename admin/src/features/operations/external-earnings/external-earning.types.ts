export type ExternalEarningStatus =
  | "pending"
  | "confirmed"
  | "approved"
  | "payable"
  | "paid"
  | "reversed"
  | "rejected";

export type ExternalEarningEventType =
  | "sale"
  | "lead"
  | "qualified_lead"
  | "signup"
  | "trial_started"
  | "subscription"
  | "service_purchase"
  | "booking"
  | "installation_completed"
  | "application_submitted"
  | "app_installed"
  | "custom";

export type ExternalEarningSource =
  | "manual"
  | "platform_dashboard"
  | "statement"
  | "csv_import"
  | "api"
  | "webhook";

export type ExternalPayoutStatus =
  | "not_payable"
  | "awaiting_threshold"
  | "scheduled"
  | "processing"
  | "paid"
  | "failed"
  | "reversed";

export interface ExternalEarningAmount {
  currency: string;
  grossAmount: number;
  commissionAmount: number;
  taxWithheld: number;
  fees: number;
  netAmount: number;
}

export interface ExternalEarningAuditEntry {
  id: string;

  action:
    | "created"
    | "updated"
    | "confirmed"
    | "approved"
    | "marked_payable"
    | "marked_paid"
    | "reversed"
    | "rejected"
    | "reconciled";

  message: string;
  actor: string;
  occurredAt: string;
}

export interface ExternalEarningRecord {
  id: string;

  programId: string;
  promotionId: string;

  externalConversionId: string;
  externalOrderId: string;
  externalPayoutId: string;

  eventType: ExternalEarningEventType;
  source: ExternalEarningSource;

  conversionDate: string;
  confirmationDate: string;
  payoutDate: string;

  status: ExternalEarningStatus;
  payoutStatus: ExternalPayoutStatus;

  amount: ExternalEarningAmount;

  customerCountry: string;

  statementReference: string;
  evidenceUrl: string;

  reversalReason: string;
  rejectionReason: string;

  notes: string;

  createdAt: string;
  updatedAt: string;

  auditHistory: ExternalEarningAuditEntry[];
}

export interface ExternalEarningDraft {
  programId: string;
  promotionId: string;

  externalConversionId: string;
  externalOrderId: string;
  externalPayoutId: string;

  eventType: ExternalEarningEventType;
  source: ExternalEarningSource;

  conversionDate: string;
  confirmationDate: string;
  payoutDate: string;

  status: ExternalEarningStatus;
  payoutStatus: ExternalPayoutStatus;

  currency: string;
  grossAmount: string;
  commissionAmount: string;
  taxWithheld: string;
  fees: string;
  netAmount: string;

  customerCountry: string;

  statementReference: string;
  evidenceUrl: string;

  reversalReason: string;
  rejectionReason: string;

  notes: string;
}

export type ExternalEarningErrors =
  Partial<
    Record<
      keyof ExternalEarningDraft,
      string
    >
  >;
