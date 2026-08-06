export function getAddFundsFailureMessage(
  error:
    unknown
): string {
  if (error instanceof Error) {
    const message =
      error.message;

    if (
      message.includes(
        "closed before payment was completed"
      )
    ) {
      return "Razorpay Checkout was closed before payment was completed. No funds were added. You can try again when ready.";
    }

    if (
      message.includes(
        "could not be loaded"
      ) ||
      message.includes(
        "can only run in the browser"
      ) ||
      message.includes(
        "loaded without exposing the runtime"
      )
    ) {
      return "Razorpay Checkout could not be opened. Check the browser or network connection and try again. No funds were added.";
    }

    if (
      message.includes(
        "signature"
      ) ||
      message.includes(
        "verification"
      ) ||
      message.includes(
        "verified"
      )
    ) {
      return "Poster Backend could not verify the Razorpay payment. No funds were added. Please retry or contact support if Razorpay shows a debit.";
    }

    return message;
  }

  return "Wallet funding could not be completed. No funds were added.";
}
