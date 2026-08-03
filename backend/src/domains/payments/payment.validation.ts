import {
  LEDGER_ENTRY_DIRECTIONS,
  LEDGER_ENTRY_TYPES,
  PAYMENT_CURRENCY_CODES,
  PAYMENT_PROVIDERS,
  type CreateLedgerEntryInput,
  type CreateWalletFundingOrderInput,
  type PaymentValidationError,
} from "./payment.types.js";

const MIN_WALLET_FUNDING_MINOR = 10000n;
const MAX_WALLET_FUNDING_MINOR = 100000000n;

function isNonEmptyString(value: string): boolean {
  return value.trim().length > 0;
}

export function validateWalletFundingOrderInput(
  input: CreateWalletFundingOrderInput
): PaymentValidationError[] {
  const errors: PaymentValidationError[] = [];

  if (!isNonEmptyString(input.organizationId)) {
    errors.push({ field: "organizationId", message: "Organization is required." });
  }

  if (!isNonEmptyString(input.walletId)) {
    errors.push({ field: "walletId", message: "Wallet is required." });
  }

  if (!isNonEmptyString(input.actorUserId)) {
    errors.push({ field: "actorUserId", message: "Actor user is required." });
  }

  if (!isNonEmptyString(input.idempotencyKey)) {
    errors.push({ field: "idempotencyKey", message: "Idempotency key is required." });
  }

  if (!PAYMENT_CURRENCY_CODES.includes(input.currency)) {
    errors.push({ field: "currency", message: "Only INR Wallet funding is supported for v1." });
  }

  if (!PAYMENT_PROVIDERS.includes(input.provider)) {
    errors.push({ field: "provider", message: "Only Razorpay is supported for v1 Wallet funding." });
  }

  if (input.amountMinorUnits < MIN_WALLET_FUNDING_MINOR) {
    errors.push({ field: "amountMinorUnits", message: "Wallet funding amount must be at least 100 INR." });
  }

  if (input.amountMinorUnits > MAX_WALLET_FUNDING_MINOR) {
    errors.push({ field: "amountMinorUnits", message: "Wallet funding amount must not exceed 10,00,000 INR." });
  }

  return errors;
}

export function calculateLedgerBalanceAfter(
  input: Pick<
    CreateLedgerEntryInput,
    "amountMinorUnits" | "balanceBeforeMinorUnits" | "direction"
  >
): bigint {
  if (input.direction === "credit") {
    return input.balanceBeforeMinorUnits + input.amountMinorUnits;
  }

  if (input.direction === "debit") {
    return input.balanceBeforeMinorUnits - input.amountMinorUnits;
  }

  return input.balanceBeforeMinorUnits;
}

export function validateLedgerEntryInput(
  input: CreateLedgerEntryInput
): PaymentValidationError[] {
  const errors: PaymentValidationError[] = [];

  if (!isNonEmptyString(input.organizationId)) {
    errors.push({ field: "organizationId", message: "Organization is required." });
  }

  if (!isNonEmptyString(input.walletId)) {
    errors.push({ field: "walletId", message: "Wallet is required." });
  }

  if (!isNonEmptyString(input.actorUserId)) {
    errors.push({ field: "actorUserId", message: "Actor user is required." });
  }

  if (!isNonEmptyString(input.idempotencyKey)) {
    errors.push({ field: "idempotencyKey", message: "Idempotency key is required." });
  }

  if (!PAYMENT_CURRENCY_CODES.includes(input.currency)) {
    errors.push({ field: "currency", message: "Only INR ledger entries are supported for v1." });
  }

  if (!LEDGER_ENTRY_TYPES.includes(input.entryType)) {
    errors.push({ field: "entryType", message: "Ledger entry type is not supported." });
  }

  if (!LEDGER_ENTRY_DIRECTIONS.includes(input.direction)) {
    errors.push({ field: "direction", message: "Ledger direction is not supported." });
  }

  if (input.amountMinorUnits <= 0n) {
    errors.push({ field: "amountMinorUnits", message: "Ledger amount must be greater than zero." });
  }

  const expectedAfter = calculateLedgerBalanceAfter(input);

  if (input.balanceAfterMinorUnits !== expectedAfter) {
    errors.push({
      field: "balanceAfterMinorUnits",
      message: "Ledger balance after amount does not match the entry direction.",
    });
  }

  if (input.balanceAfterMinorUnits < 0n) {
    errors.push({
      field: "balanceAfterMinorUnits",
      message: "Ledger entry would create a negative Wallet balance.",
    });
  }

  return errors;
}
