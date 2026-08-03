import type {
  PaymentValidationError,
} from "../../domains/payments/index.js";

export class WalletFundingValidationError extends Error {
  readonly code =
    "wallet_funding_validation_failed";

  readonly details:
    PaymentValidationError[];

  constructor(
    details:
      PaymentValidationError[]
  ) {
    super(
      "Wallet funding request is invalid."
    );

    this.name =
      "WalletFundingValidationError";

    this.details =
      details;
  }
}