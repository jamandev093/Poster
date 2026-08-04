export type ClientWalletAllocationErrorCode =
  | "client_wallet_allocation_validation_failed"
  | "client_wallet_allocation_not_found"
  | "client_wallet_allocation_conflict"
  | "client_wallet_allocation_insufficient_balance";

export interface ClientWalletAllocationValidationIssue {
  field:
    string;

  code:
    string;

  message:
    string;
}

export class ClientWalletAllocationValidationError extends Error {
  readonly code:
    ClientWalletAllocationErrorCode =
      "client_wallet_allocation_validation_failed";

  readonly details:
    ClientWalletAllocationValidationIssue[];

  constructor(
    details:
      ClientWalletAllocationValidationIssue[]
  ) {
    super(
      "Client Wallet allocation request validation failed."
    );

    this.name =
      "ClientWalletAllocationValidationError";

    this.details =
      details;
  }
}

export class ClientWalletAllocationNotFoundError extends Error {
  readonly code:
    ClientWalletAllocationErrorCode =
      "client_wallet_allocation_not_found";

  constructor(
    message =
      "Client Wallet allocation record was not found."
  ) {
    super(
      message
    );

    this.name =
      "ClientWalletAllocationNotFoundError";
  }
}

export class ClientWalletAllocationConflictError extends Error {
  readonly code:
    ClientWalletAllocationErrorCode =
      "client_wallet_allocation_conflict";

  constructor(
    message =
      "Client Wallet allocation changed before the request could be completed."
  ) {
    super(
      message
    );

    this.name =
      "ClientWalletAllocationConflictError";
  }
}

export class ClientWalletAllocationInsufficientBalanceError extends Error {
  readonly code:
    ClientWalletAllocationErrorCode =
      "client_wallet_allocation_insufficient_balance";

  constructor(
    message =
      "Available Wallet balance is not sufficient for this allocation."
  ) {
    super(
      message
    );

    this.name =
      "ClientWalletAllocationInsufficientBalanceError";
  }
}