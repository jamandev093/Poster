import type {
  ExternalProgramDraft,
  ExternalProgramErrors,
} from "./external-program.types";

export const EMPTY_EXTERNAL_PROGRAM_DRAFT:
  ExternalProgramDraft = {
  programName: "",
  platformName: "",
  programType: "affiliate",

  applicationUrl: "",
  dashboardUrl: "",

  accountReference: "",
  trackingId: "",

  status: "not_applied",

  payoutMethod: "bank_transfer",
  payoutDestinationLabel: "",
  currency: "INR",
  minimumPayout: "",
  paymentSchedule: "monthly",

  applicationDate: "",
  approvalDate: "",
  nextReviewDate: "",

  notes: "",
};

function isValidOptionalUrl(
  value: string
) {
  if (!value.trim()) {
    return true;
  }

  try {
    const url = new URL(value);

    return (
      url.protocol === "https:" ||
      url.protocol === "http:"
    );
  } catch {
    return false;
  }
}

export function validateExternalProgram(
  draft: ExternalProgramDraft
) {
  const errors:
    ExternalProgramErrors = {};

  if (!draft.programName.trim()) {
    errors.programName =
      "Program name is required.";
  }

  if (!draft.platformName.trim()) {
    errors.platformName =
      "Platform name is required.";
  }

  if (
    !isValidOptionalUrl(
      draft.applicationUrl
    )
  ) {
    errors.applicationUrl =
      "Enter a valid application URL.";
  }

  if (
    !isValidOptionalUrl(
      draft.dashboardUrl
    )
  ) {
    errors.dashboardUrl =
      "Enter a valid dashboard URL.";
  }

  if (!draft.currency.trim()) {
    errors.currency =
      "Currency is required.";
  }

  if (
    draft.status === "approved" &&
    !draft.accountReference.trim()
  ) {
    errors.accountReference =
      "Approved programs require an account or publisher reference.";
  }

  if (
    draft.approvalDate &&
    draft.applicationDate &&
    draft.approvalDate <
      draft.applicationDate
  ) {
    errors.approvalDate =
      "Approval date cannot be before the application date.";
  }

  return errors;
}

export function hasExternalProgramErrors(
  errors: ExternalProgramErrors
) {
  return Object.keys(errors).length > 0;
}
