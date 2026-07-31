export interface AdminProfileRecord {
  userId: string;

  loginEmail: string;

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
    | "en"
    | "hi";

  timeZone: string;

  emailVerifiedAt:
    | Date
    | null;

  lastLoginAt:
    | Date
    | null;

  accountCreatedAt: Date;

  createdAt: Date;

  updatedAt: Date;

  rowVersion: string;
}

export interface UpdateAdminProfileInput {
  userId: string;

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
    | "en"
    | "hi";

  timeZone: string;

  actorUserId: string;
}
