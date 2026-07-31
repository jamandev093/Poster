export type AdminPreferredLanguage =
  | "en"
  | "hi";

export interface AdminAccountProfile {
  userId: string;

  loginEmail: string;

  fullName: string;

  displayName: string;

  jobTitle: string;

  businessEmail: string;

  primaryPhone: string;

  alternatePhone: string;

  signalAccount: string;

  telegramUsername: string;

  preferredLanguage:
    AdminPreferredLanguage;

  timeZone: string;

  emailVerifiedAt:
    | string
    | null;

  lastLoginAt:
    | string
    | null;

  accountCreatedAt: string;

  createdAt: string;

  updatedAt: string;

  rowVersion: string;
}

export interface AdminAccountProfileDraft {
  fullName: string;
  displayName: string;
  jobTitle: string;
  businessEmail: string;
  primaryPhone: string;
  alternatePhone: string;
  signalAccount: string;
  telegramUsername: string;
  preferredLanguage:
    AdminPreferredLanguage;
  timeZone: string;
}

export interface UpdateAdminAccountProfileInput {
  expectedRowVersion: string;

  fullName: string;
  displayName: string;

  jobTitle:
    | string
    | null;

  businessEmail:
    | string
    | null;

  primaryPhone:
    | string
    | null;

  alternatePhone:
    | string
    | null;

  signalAccount:
    | string
    | null;

  telegramUsername:
    | string
    | null;

  preferredLanguage:
    AdminPreferredLanguage;

  timeZone: string;
}

export type AdminAccountProfileErrors =
  Partial<
    Record<
      keyof AdminAccountProfileDraft,
      string
    >
  >;
