export class DirectSponsorshipApiError
  extends Error {
  readonly causeValue:
    unknown;

  constructor(
    message: string,
    causeValue?: unknown
  ) {
    super(
      message
    );

    this.name =
      "DirectSponsorshipApiError";

    this.causeValue =
      causeValue;
  }
}

export function getDirectSponsorshipErrorMessage(
  error: unknown
): string {
  if (
    error instanceof
    DirectSponsorshipApiError
  ) {
    return error.message;
  }

  if (
    error instanceof
    Error &&
    error.message.trim()
  ) {
    return error.message;
  }

  return "Direct sponsorship campaigns could not be loaded.";
}