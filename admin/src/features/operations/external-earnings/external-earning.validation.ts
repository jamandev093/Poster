import type {
  ExternalEarningDraft,
  ExternalEarningErrors,
} from "./external-earning.types";

export const EMPTY_EXTERNAL_EARNING_DRAFT:
  ExternalEarningDraft = {
  programId: "",
  promotionId: "",

  externalConversionId: "",
  externalOrderId: "",
  externalPayoutId: "",

  eventType: "sale",
  source: "manual",

  conversionDate: "",
  confirmationDate: "",
  payoutDate: "",

  status: "pending",
  payoutStatus: "not_payable",

  currency: "INR",
  grossAmount: "",
  commissionAmount: "",
  taxWithheld: "",
  fees: "",
  netAmount: "0.00",

  customerCountry: "",

  statementReference: "",
  evidenceUrl: "",

  reversalReason: "",
  rejectionReason: "",

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

function isValidOptionalAmount(
  value: string
) {
  if (!value.trim()) {
    return true;
  }

  const number = Number(value);

  return (
    Number.isFinite(number) &&
    number >= 0
  );
}

function isValidRequiredAmount(
  value: string
) {
  if (!value.trim()) {
    return false;
  }

  return isValidOptionalAmount(value);
}

function requiresConfirmationDate(
  status: ExternalEarningDraft["status"]
) {
  return [
    "confirmed",
    "approved",
    "payable",
    "paid",
  ].includes(status);
}

function requiresCommissionAmount(
  status: ExternalEarningDraft["status"]
) {
  return [
    "approved",
    "payable",
    "paid",
  ].includes(status);
}

export function calculateNetAmount(
  commissionAmount: string,
  taxWithheld: string,
  fees: string
) {
  const commission =
    Number(commissionAmount) || 0;

  const tax =
    Number(taxWithheld) || 0;

  const feeAmount =
    Number(fees) || 0;

  return Math.max(
    0,
    commission -
      tax -
      feeAmount
  );
}

export function validateExternalEarning(
  draft: ExternalEarningDraft
) {
  const errors:
    ExternalEarningErrors = {};

  if (!draft.programId) {
    errors.programId =
      "Select an approved external program.";
  }

  if (!draft.promotionId) {
    errors.promotionId =
      "Select an external promotion.";
  }

  if (
    !draft.externalConversionId.trim()
  ) {
    errors.externalConversionId =
      "External conversion ID is required.";
  }

  if (!draft.conversionDate) {
    errors.conversionDate =
      "Conversion date is required.";
  }

  if (!draft.currency.trim()) {
    errors.currency =
      "Currency is required.";
  }

  if (
    !isValidOptionalAmount(
      draft.grossAmount
    )
  ) {
    errors.grossAmount =
      "Enter a valid non-negative gross amount.";
  }

  if (
    requiresCommissionAmount(
      draft.status
    ) &&
    !isValidRequiredAmount(
      draft.commissionAmount
    )
  ) {
    errors.commissionAmount =
      "Commission amount is required for approved, payable or paid earnings.";
  } else if (
    !isValidOptionalAmount(
      draft.commissionAmount
    )
  ) {
    errors.commissionAmount =
      "Enter a valid non-negative commission amount.";
  }

  if (
    !isValidOptionalAmount(
      draft.taxWithheld
    )
  ) {
    errors.taxWithheld =
      "Enter a valid non-negative tax amount.";
  }

  if (
    !isValidOptionalAmount(
      draft.fees
    )
  ) {
    errors.fees =
      "Enter a valid non-negative fee amount.";
  }

  if (
    requiresConfirmationDate(
      draft.status
    ) &&
    !draft.confirmationDate
  ) {
    errors.confirmationDate =
      "Confirmation date is required for this earning status.";
  }

  if (
    draft.confirmationDate &&
    draft.conversionDate &&
    draft.confirmationDate <
      draft.conversionDate
  ) {
    errors.confirmationDate =
      "Confirmation date cannot be before the conversion date.";
  }

  if (
    draft.payoutDate &&
    draft.confirmationDate &&
    draft.payoutDate <
      draft.confirmationDate
  ) {
    errors.payoutDate =
      "Payout date cannot be before the confirmation date.";
  }

  if (
    draft.status === "paid"
  ) {
    if (
      !draft.externalPayoutId.trim()
    ) {
      errors.externalPayoutId =
        "External payout ID is required when the earning is paid.";
    }

    if (!draft.payoutDate) {
      errors.payoutDate =
        "Payout date is required when the earning is paid.";
    }

    if (
      draft.payoutStatus !== "paid"
    ) {
      errors.payoutStatus =
        "Paid earnings require Paid payout status.";
    }
  }

  if (
    draft.payoutStatus === "paid" &&
    !draft.payoutDate
  ) {
    errors.payoutDate =
      "Paid payouts require a payout date.";
  }

  if (
    draft.status === "reversed" &&
    !draft.reversalReason.trim()
  ) {
    errors.reversalReason =
      "Enter the reversal reason.";
  }

  if (
    draft.status === "rejected" &&
    !draft.rejectionReason.trim()
  ) {
    errors.rejectionReason =
      "Enter the rejection reason.";
  }

  if (
    !isValidOptionalUrl(
      draft.evidenceUrl
    )
  ) {
    errors.evidenceUrl =
      "Enter a valid evidence URL.";
  }

  return errors;
}

export function hasExternalEarningErrors(
  errors: ExternalEarningErrors
) {
  return Object.keys(errors).length > 0;
}
