import { describe, expect, it } from "vitest";

import { getAddFundsFailureMessage } from "./add-funds-errors";

describe("getAddFundsFailureMessage", () => {
  it("explains that cancelled checkout does not add funds", () => {
    expect(
      getAddFundsFailureMessage(
        new Error("Razorpay Checkout was closed before payment was completed.")
      )
    ).toContain("No funds were added");
  });

  it("explains that checkout loading failures do not add funds", () => {
    expect(
      getAddFundsFailureMessage(
        new Error("Razorpay Checkout could not be loaded.")
      )
    ).toContain("Razorpay Checkout could not be opened");
  });

  it("explains that backend verification failures do not add funds", () => {
    expect(
      getAddFundsFailureMessage(
        new Error("Payment verification failed because the signature is invalid.")
      )
    ).toContain("Poster Backend could not verify the Razorpay payment");
  });

  it("keeps unknown Error messages visible", () => {
    expect(
      getAddFundsFailureMessage(
        new Error("Gateway temporarily unavailable.")
      )
    ).toBe("Gateway temporarily unavailable.");
  });

  it("uses the general safe fallback for non-error values", () => {
    expect(
      getAddFundsFailureMessage("failed")
    ).toBe("Wallet funding could not be completed. No funds were added.");
  });
});
