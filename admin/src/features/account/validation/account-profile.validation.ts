import type {
  AdminAccountProfileDraft,
  AdminAccountProfileErrors,
} from "../contracts/account-profile.types";

const EMAIL_PATTERN =
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const PHONE_PATTERN =
  /^[+()\-\s0-9]{7,24}$/;

const SIGNAL_PATTERN =
  /^(@?[A-Za-z0-9_.+-]{2,64}|\+[0-9]{7,18})$/;

export function validateAdminAccountProfile(
  draft: AdminAccountProfileDraft
): AdminAccountProfileErrors {
  const errors:
    AdminAccountProfileErrors = {};

  if (!draft.fullName.trim()) {
    errors.fullName =
      "Full name is required.";
  } else if (
    draft.fullName.trim().length >
    200
  ) {
    errors.fullName =
      "Full name must contain 200 characters or fewer.";
  }

  if (!draft.displayName.trim()) {
    errors.displayName =
      "Display name is required.";
  }

  if (
    draft.businessEmail.trim() &&
    !EMAIL_PATTERN.test(
      draft.businessEmail.trim()
    )
  ) {
    errors.businessEmail =
      "Enter a valid business email.";
  }

  if (
    draft.primaryPhone.trim() &&
    !PHONE_PATTERN.test(
      draft.primaryPhone.trim()
    )
  ) {
    errors.primaryPhone =
      "Enter a valid phone number.";
  }

  if (
    draft.alternatePhone.trim() &&
    !PHONE_PATTERN.test(
      draft.alternatePhone.trim()
    )
  ) {
    errors.alternatePhone =
      "Enter a valid alternate phone number.";
  }

  if (
    draft.signalAccount.trim() &&
    !SIGNAL_PATTERN.test(
      draft.signalAccount.trim()
    )
  ) {
    errors.signalAccount =
      "Enter a Signal username or international phone number.";
  }

  if (!draft.preferredLanguage) {
    errors.preferredLanguage =
      "Select a preferred language.";
  }

  if (!draft.timeZone) {
    errors.timeZone =
      "Select a time zone.";
  }

  return errors;
}

export function hasAdminAccountProfileErrors(
  errors: AdminAccountProfileErrors
) {
  return Object.keys(errors).length > 0;
}
