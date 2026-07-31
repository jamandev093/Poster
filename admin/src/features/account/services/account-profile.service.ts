import type {
  AdminAccountProfile,
  AdminAccountProfileDraft,
} from "../contracts/account-profile.types";

const STORAGE_KEY =
  "poster-admin-account-profile";

function storageAvailable() {
  return (
    typeof window !== "undefined" &&
    typeof window.localStorage !==
      "undefined"
  );
}

export function createInitialAdminProfile(
  input: {
    userId: string;
    loginEmail: string;
    fullName: string;
    emailVerifiedAt:
      | string
      | null;
    createdAt: string;
  }
): AdminAccountProfile {
  return {
    userId: input.userId,
    loginEmail: input.loginEmail,
    fullName: input.fullName,
    displayName: input.fullName,
    jobTitle: "Administrator",
    businessEmail:
      input.loginEmail,
    primaryPhone: "",
    alternatePhone: "",
    signalAccount: "",
    telegramUsername: "",
    preferredLanguage: "en",
    timeZone:
      "Asia/Kolkata",
    emailVerifiedAt:
      input.emailVerifiedAt,
    createdAt:
      input.createdAt,
    lastLoginAt:
      new Date().toISOString(),
  };
}

export function loadStoredAdminProfile():
  AdminAccountProfile | null {
  if (!storageAvailable()) {
    return null;
  }

  const stored =
    window.localStorage.getItem(
      STORAGE_KEY
    );

  if (!stored) {
    return null;
  }

  try {
    return JSON.parse(
      stored
    ) as AdminAccountProfile;
  } catch {
    return null;
  }
}

export function saveStoredAdminProfile(
  current: AdminAccountProfile,
  draft: AdminAccountProfileDraft
): AdminAccountProfile {
  const nextProfile:
    AdminAccountProfile = {
    ...current,

    fullName:
      draft.fullName.trim(),

    displayName:
      draft.displayName.trim(),

    jobTitle:
      draft.jobTitle.trim(),

    businessEmail:
      draft.businessEmail
        .trim()
        .toLowerCase(),

    primaryPhone:
      draft.primaryPhone.trim(),

    alternatePhone:
      draft.alternatePhone.trim(),

    signalAccount:
      draft.signalAccount.trim(),

    telegramUsername:
      draft.telegramUsername.trim(),

    preferredLanguage:
      draft.preferredLanguage,

    timeZone:
      draft.timeZone,
  };

  if (storageAvailable()) {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(nextProfile)
    );
  }

  return nextProfile;
}
