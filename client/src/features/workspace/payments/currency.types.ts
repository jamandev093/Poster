/**
 * Canonical currency and monetary-value contracts.
 *
 * These types must remain compatible across:
 *
 * - Client Web App
 * - Admin Web App
 * - Backend payment services
 * - Razorpay integration
 * - PostgreSQL financial records
 * - Invoices, refunds, settlements, and ledger entries
 *
 * Money must never be stored as floating-point major units.
 */

export type SupportedCurrency =
  | "INR"
  | "USD";

export type CurrencyMinorUnit =
  | 2;

export interface CurrencyDefinition {
  code:
    SupportedCurrency;

  minorUnit:
    CurrencyMinorUnit;

  symbol:
    string;

  displayName:
    string;
}

export const SUPPORTED_CURRENCY_DEFINITIONS:
  Record<
    SupportedCurrency,
    CurrencyDefinition
  > = {
  INR: {
    code:
      "INR",

    minorUnit:
      2,

    symbol:
      "",

    displayName:
      "Indian Rupee",
  },

  USD: {
    code:
      "USD",

    minorUnit:
      2,

    symbol:
      "$",

    displayName:
      "US Dollar",
  },
};

export interface MoneyAmount {
  currency:
    SupportedCurrency;

  /**
   * Monetary value in minor units.
   *
   * Examples:
   *
   * INR 100.00 -> 10000 paise
   * USD 100.00 -> 10000 cents
   */
  amountMinor:
    number;
}

export interface SignedMoneyAmount {
  currency:
    SupportedCurrency;

  /**
   * Signed value in minor units.
   *
   * Used only where both positive and negative adjustments
   * are valid, such as ledger corrections.
   */
  amountMinor:
    number;
}

export interface CurrencyExchangeReference {
  sourceCurrency:
    SupportedCurrency;

  targetCurrency:
    SupportedCurrency;

  sourceAmountMinor:
    number;

  targetAmountMinor:
    number;

  /**
   * Informational exchange rate recorded by the payment
   * provider or reconciliation service.
   *
   * The exact charged and settled minor-unit amounts remain
   * authoritative.
   */
  exchangeRate?:
    string;

  providerFeeMinor?:
    number;

  taxMinor?:
    number;

  recordedAt:
    string;
}

export function isSupportedCurrency(
  value:
    string
): value is SupportedCurrency {
  return (
    value === "INR" ||
    value === "USD"
  );
}

export function getCurrencyDefinition(
  currency:
    SupportedCurrency
): CurrencyDefinition {
  return SUPPORTED_CURRENCY_DEFINITIONS[
    currency
  ];
}

export function isValidMinorAmount(
  amountMinor:
    number
): boolean {
  return (
    Number.isSafeInteger(
      amountMinor
    ) &&
    amountMinor >= 0
  );
}

export function isValidSignedMinorAmount(
  amountMinor:
    number
): boolean {
  return Number.isSafeInteger(
    amountMinor
  );
}

export function assertSameCurrency(
  first:
    SupportedCurrency,
  second:
    SupportedCurrency
): void {
  if (
    first !==
    second
  ) {
    throw new Error(
      `Currency mismatch: ${first} and ${second}.`
    );
  }
}

export function addMoneyAmounts(
  first:
    MoneyAmount,
  second:
    MoneyAmount
): MoneyAmount {
  assertSameCurrency(
    first.currency,
    second.currency
  );

  return {
    currency:
      first.currency,

    amountMinor:
      first.amountMinor +
      second.amountMinor,
  };
}

export function subtractMoneyAmounts(
  first:
    MoneyAmount,
  second:
    MoneyAmount
): SignedMoneyAmount {
  assertSameCurrency(
    first.currency,
    second.currency
  );

  return {
    currency:
      first.currency,

    amountMinor:
      first.amountMinor -
      second.amountMinor,
  };
}

export function createZeroMoneyAmount(
  currency:
    SupportedCurrency
): MoneyAmount {
  return {
    currency,

    amountMinor:
      0,
  };
}

export function majorToMinorAmount(
  majorAmount:
    number,
  currency:
    SupportedCurrency
): number {
  if (
    !Number.isFinite(
      majorAmount
    )
  ) {
    throw new Error(
      "Major currency amount must be finite."
    );
  }

  const definition =
    getCurrencyDefinition(
      currency
    );

  const multiplier =
    10 **
    definition.minorUnit;

  const amountMinor =
    Math.round(
      majorAmount *
        multiplier
    );

  if (
    !Number.isSafeInteger(
      amountMinor
    )
  ) {
    throw new Error(
      "Converted minor-unit amount exceeds the safe integer range."
    );
  }

  return amountMinor;
}

export function minorToMajorAmount(
  amountMinor:
    number,
  currency:
    SupportedCurrency
): number {
  if (
    !Number.isSafeInteger(
      amountMinor
    )
  ) {
    throw new Error(
      "Minor currency amount must be a safe integer."
    );
  }

  const definition =
    getCurrencyDefinition(
      currency
    );

  const divisor =
    10 **
    definition.minorUnit;

  return (
    amountMinor /
    divisor
  );
}
