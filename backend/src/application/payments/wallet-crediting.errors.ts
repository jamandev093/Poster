export class WalletCreditingValidationError extends Error {
  readonly code =
    "wallet_crediting_validation_failed";

  constructor(
    message: string
  ) {
    super(message);
    this.name = "WalletCreditingValidationError";
  }
}

export class WalletCreditingConflictError extends Error {
  readonly code =
    "wallet_crediting_conflict";

  constructor(
    message: string
  ) {
    super(message);
    this.name = "WalletCreditingConflictError";
  }
}