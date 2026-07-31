import {
  adminAuthenticatedRequest,
} from "@/features/auth/services/auth-api.service";

import type {
  AdminAccountProfile,
  AdminAccountProfileDraft,
  UpdateAdminAccountProfileInput,
} from "../contracts/account-profile.types";

interface AdminAccountProfileApiResponse {
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

function mapProfileResponse(
  response:
    AdminAccountProfileApiResponse
): AdminAccountProfile {
  return {
    ...response,

    jobTitle:
      response.jobTitle ?? "",

    businessEmail:
      response.businessEmail ?? "",

    primaryPhone:
      response.primaryPhone ?? "",

    alternatePhone:
      response.alternatePhone ?? "",

    signalAccount:
      response.signalAccount ?? "",

    telegramUsername:
      response.telegramUsername ?? "",
  };
}

function optionalText(
  value: string
): string | null {
  const normalized =
    value.trim();

  return normalized.length > 0
    ? normalized
    : null;
}

export function profileToDraft(
  profile:
    AdminAccountProfile
): AdminAccountProfileDraft {
  return {
    fullName:
      profile.fullName,

    displayName:
      profile.displayName,

    jobTitle:
      profile.jobTitle,

    businessEmail:
      profile.businessEmail,

    primaryPhone:
      profile.primaryPhone,

    alternatePhone:
      profile.alternatePhone,

    signalAccount:
      profile.signalAccount,

    telegramUsername:
      profile.telegramUsername,

    preferredLanguage:
      profile.preferredLanguage,

    timeZone:
      profile.timeZone,
  };
}

export async function loadAdminProfile(
  accessToken: string
): Promise<AdminAccountProfile> {
  const response =
    await adminAuthenticatedRequest<
      AdminAccountProfileApiResponse
    >(
      "/admin/profile",
      accessToken,
      {
        method: "GET",
      }
    );

  return mapProfileResponse(
    response
  );
}

export async function updateAdminProfile(
  accessToken: string,
  current:
    AdminAccountProfile,
  draft:
    AdminAccountProfileDraft
): Promise<AdminAccountProfile> {
  const input:
    UpdateAdminAccountProfileInput = {
    expectedRowVersion:
      current.rowVersion,

    fullName:
      draft.fullName.trim(),

    displayName:
      draft.displayName.trim(),

    jobTitle:
      optionalText(
        draft.jobTitle
      ),

    businessEmail:
      optionalText(
        draft.businessEmail
      )?.toLowerCase() ??
      null,

    primaryPhone:
      optionalText(
        draft.primaryPhone
      ),

    alternatePhone:
      optionalText(
        draft.alternatePhone
      ),

    signalAccount:
      optionalText(
        draft.signalAccount
      ),

    telegramUsername:
      optionalText(
        draft.telegramUsername
      ),

    preferredLanguage:
      draft.preferredLanguage,

    timeZone:
      draft.timeZone.trim(),
  };

  const response =
    await adminAuthenticatedRequest<
      AdminAccountProfileApiResponse
    >(
      "/admin/profile",
      accessToken,
      {
        method: "PATCH",
        body:
          JSON.stringify(input),
      }
    );

  return mapProfileResponse(
    response
  );
}
