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

  preferredLanguage: string;

  timeZone: string;

  emailVerifiedAt:
    | string
    | null;

  createdAt: string;

  lastLoginAt:
    | string
    | null;
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
  preferredLanguage: string;
  timeZone: string;
}

export type AdminAccountProfileErrors =
  Partial<
    Record<
      keyof AdminAccountProfileDraft,
      string
    >
  >;
