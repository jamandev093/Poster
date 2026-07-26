import type {
  SupportedCurrency,
} from "./currency.types";

import {
  minorToMajorAmount,
} from "./currency.types";

import type {
  CardNetwork,
  PaymentMethod,
  PaymentMethodDetails,
  PaymentProvider,
} from "./payment.types";

import type {
  RefundExecutionMode,
  RefundReason,
} from "./refund.types";

import type {
  SettlementMode,
  SettlementSource,
} from "./settlement.types";

/**
 * Payment-domain display formatting only.
 *
 * Financial calculations, state transitions, payment
 * verification, refunds, and ledger operations must not
 * be implemented in this module.
 */

export interface CurrencyFormatOptions {
  locale?: string;

  minimumFractionDigits?: number;

  maximumFractionDigits?: number;

  showCurrencyCode?: boolean;
}

export interface DateTimeFormatOptions {
  locale?: string;

  timeZone?: string;

  includeTime?: boolean;

  includeSeconds?: boolean;
}

const DEFAULT_LOCALE =
  "en-US";

const DEFAULT_TIME_ZONE =
  "Asia/Kolkata";

export function formatMoneyMinor(
  amountMinor:
    number,
  currency:
    SupportedCurrency,
  options:
    CurrencyFormatOptions = {}
): string {
  if (
    !Number.isSafeInteger(
      amountMinor
    )
  ) {
    return "—";
  }

  const majorAmount =
    minorToMajorAmount(
      amountMinor,
      currency
    );

  const formatter =
    new Intl.NumberFormat(
      options.locale ??
        DEFAULT_LOCALE,
      {
        style:
          "currency",

        currency,

        currencyDisplay:
          options.showCurrencyCode
            ? "code"
            : "symbol",

        minimumFractionDigits:
          options
            .minimumFractionDigits ??
          2,

        maximumFractionDigits:
          options
            .maximumFractionDigits ??
          2,
      }
    );

  return formatter.format(
    majorAmount
  );
}

export function formatSignedMoneyMinor(
  amountMinor:
    number,
  currency:
    SupportedCurrency,
  options:
    CurrencyFormatOptions = {}
): string {
  if (
    !Number.isSafeInteger(
      amountMinor
    )
  ) {
    return "—";
  }

  const formatted =
    formatMoneyMinor(
      Math.abs(
        amountMinor
      ),
      currency,
      options
    );

  if (
    amountMinor > 0
  ) {
    return `+${formatted}`;
  }

  if (
    amountMinor < 0
  ) {
    return `−${formatted}`;
  }

  return formatted;
}

export function formatFinancialDate(
  value:
    string |
    undefined,
  options:
    DateTimeFormatOptions = {}
): string {
  if (!value) {
    return "—";
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "—";
  }

  return new Intl.DateTimeFormat(
    options.locale ??
      DEFAULT_LOCALE,
    {
      day:
        "numeric",

      month:
        "short",

      year:
        "numeric",

      timeZone:
        options.timeZone ??
        DEFAULT_TIME_ZONE,
    }
  ).format(
    date
  );
}

export function formatFinancialDateTime(
  value:
    string |
    undefined,
  options:
    DateTimeFormatOptions = {}
): string {
  if (!value) {
    return "—";
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "—";
  }

  return new Intl.DateTimeFormat(
    options.locale ??
      DEFAULT_LOCALE,
    {
      day:
        "numeric",

      month:
        "short",

      year:
        "numeric",

      hour:
        "numeric",

      minute:
        "2-digit",

      second:
        options.includeSeconds
          ? "2-digit"
          : undefined,

      hour12:
        true,

      timeZone:
        options.timeZone ??
        DEFAULT_TIME_ZONE,

      timeZoneName:
        "short",
    }
  ).format(
    date
  );
}

export function formatPercentage(
  value:
    number |
    null |
    undefined,
  fractionDigits:
    number = 2
): string {
  if (
    value === null ||
    value === undefined ||
    !Number.isFinite(
      value
    )
  ) {
    return "—";
  }

  return `${value.toFixed(
    fractionDigits
  )}%`;
}

export function formatFinancialCount(
  value:
    number |
    null |
    undefined,
  locale:
    string = DEFAULT_LOCALE
): string {
  if (
    value === null ||
    value === undefined ||
    !Number.isFinite(
      value
    )
  ) {
    return "—";
  }

  return new Intl.NumberFormat(
    locale,
    {
      maximumFractionDigits:
        0,
    }
  ).format(
    value
  );
}

export function getPaymentProviderLabel(
  provider:
    PaymentProvider
): string {
  switch (provider) {
    case "razorpay":
      return "Razorpay";

    case "manual_bank_transfer":
      return "Manual bank transfer";
  }
}

export function getPaymentMethodLabel(
  method:
    PaymentMethod
): string {
  switch (method) {
    case "upi":
      return "UPI";

    case "card":
      return "Card";

    case "netbanking":
      return "Netbanking";

    case "bank_transfer":
      return "Bank transfer";

    case "wallet":
      return "Wallet";

    case "unknown":
      return "Payment method unavailable";
  }
}

export function getCardNetworkLabel(
  network:
    CardNetwork
): string {
  switch (network) {
    case "visa":
      return "Visa";

    case "mastercard":
      return "Mastercard";

    case "rupay":
      return "RuPay";

    case "amex":
      return "American Express";

    case "other":
      return "Other card";
  }
}

export function formatPaymentMethodDetails(
  details:
    PaymentMethodDetails
): string {
  switch (details.method) {
    case "card": {
      const network =
        details.cardNetwork
          ? getCardNetworkLabel(
              details.cardNetwork
            )
          : "Card";

      const lastFour =
        details.cardLastFour
          ? ` ending ${details.cardLastFour}`
          : "";

      return `${network}${lastFour}`;
    }

    case "upi":
      return details.upiHandleMasked
        ? `UPI ${details.upiHandleMasked}`
        : "UPI";

    case "netbanking":
      return details.bankName
        ? `${details.bankName} netbanking`
        : "Netbanking";

    case "bank_transfer":
      return details.bankName
        ? `${details.bankName} bank transfer`
        : "Bank transfer";

    case "wallet":
      return "Wallet";

    case "unknown":
      return "Payment method unavailable";
  }
}

export function maskReference(
  value:
    string |
    undefined,
  visibleCharacters:
    number = 4
): string {
  if (!value) {
    return "—";
  }

  const normalized =
    value.trim();

  if (
    normalized.length <=
    visibleCharacters
  ) {
    return normalized;
  }

  return `••••${normalized.slice(
    -visibleCharacters
  )}`;
}

export function formatProviderReference(
  provider:
    PaymentProvider,
  reference:
    string |
    undefined
): string {
  if (!reference) {
    return "—";
  }

  return `${getPaymentProviderLabel(
    provider
  )} · ${maskReference(
    reference,
    8
  )}`;
}

export function getSettlementModeLabel(
  mode:
    SettlementMode
): string {
  switch (mode) {
    case "standard":
      return "Standard settlement";

    case "instant":
      return "Instant settlement";

    case "manual":
      return "Manual settlement";
  }
}

export function getSettlementSourceLabel(
  source:
    SettlementSource
): string {
  switch (source) {
    case "razorpay":
      return "Razorpay";

    case "manual_bank_transfer":
      return "Manual bank transfer";
  }
}

export function getRefundExecutionModeLabel(
  mode:
    RefundExecutionMode
): string {
  switch (mode) {
    case "normal":
      return "Standard refund";

    case "instant":
      return "Instant refund";

    case "manual":
      return "Manual refund";
  }
}

export function getRefundReasonLabel(
  reason:
    RefundReason
): string {
  switch (reason) {
    case "unused_campaign_balance":
      return "Unused campaign balance";

    case "invalid_traffic_credit":
      return "Invalid-traffic credit";

    case "duplicate_charge":
      return "Duplicate charge";

    case "campaign_cancelled":
      return "Campaign cancelled";

    case "campaign_under_delivery":
      return "Campaign under-delivery";

    case "contract_adjustment":
      return "Contract adjustment";

    case "payment_error":
      return "Payment error";

    case "billing_correction":
      return "Billing correction";

    case "goodwill":
      return "Goodwill refund";

    case "other":
      return "Other";
  }
}

export function formatMaskedBankAccount(
  accountLastFour:
    string,
  bankName?:
    string
): string {
  const maskedAccount =
    `•••• ${accountLastFour}`;

  return bankName
    ? `${bankName} · ${maskedAccount}`
    : maskedAccount;
}

export function formatPaymentInternationality(
  international:
    boolean
): string {
  return international
    ? "International payment"
    : "Domestic payment";
}

export function formatDataUpdatedLabel(
  updatedAt:
    string |
    undefined
): string {
  if (!updatedAt) {
    return "Update time unavailable";
  }

  return `Updated ${formatFinancialDateTime(
    updatedAt
  )}`;
}

export function formatReconciledLabel(
  reconciledAt:
    string |
    undefined
): string {
  if (!reconciledAt) {
    return "Not yet reconciled";
  }

  return `Reconciled ${formatFinancialDateTime(
    reconciledAt
  )}`;
}
