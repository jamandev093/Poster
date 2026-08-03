import type {
  MoneyAmount,
  PaymentCurrencyCode,
} from "./payment.types.js";

export const INVOICE_STATUSES = [
  "draft",
  "issued",
  "payment_pending",
  "partially_paid",
  "paid",
  "overdue",
  "cancelled",
  "refund_pending",
  "partially_refunded",
  "refunded",
] as const;

export type InvoiceStatus =
  (typeof INVOICE_STATUSES)[number];

export interface AdvertiserInvoiceRecord {
  id: string;
  organizationId: string;
  campaignId: string | null;
  invoiceNumber: string;
  status: InvoiceStatus;
  subtotal: MoneyAmount;
  tax: MoneyAmount;
  total: MoneyAmount;
  paid: MoneyAmount;
  refunded: MoneyAmount;
  issuedAt: Date | null;
  dueAt: Date | null;
  paidAt: Date | null;
  cancelledAt: Date | null;
  documentUrl: string | null;
  metadata: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
  rowVersion: string;
}

export interface CreateAdvertiserInvoiceInput {
  organizationId: string;
  campaignId?: string | null;
  invoiceNumber: string;
  currency: PaymentCurrencyCode;
  subtotalMinorUnits: bigint;
  taxMinorUnits: bigint;
  metadata?: Record<string, unknown>;
  issuedAt?: Date | null;
  dueAt?: Date | null;
  documentUrl?: string | null;
}