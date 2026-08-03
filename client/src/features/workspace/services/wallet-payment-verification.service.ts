import type {
  SupportedCurrency,
} from "../payments/currency.types";

import {
  requestPosterApiJson,
} from "./client-api.service";

export interface VerifyWalletFundingPaymentInput {
  fundingOrderId:
    string;

  providerOrderId:
    string;

  providerPaymentId:
    string;

  providerSignature:
    string;

  amountMinor:
    number;

  currency:
    SupportedCurrency;
}

export interface WalletPaymentVerificationPayment {
  id:
    string;

  provider:
    string;

  providerPaymentId:
    string;

  amountMinorUnits:
    string;

  currency:
    SupportedCurrency;

  status:
    string;

  paidAt:
    string | null;
}

export interface WalletPaymentVerificationWallet {
  id:
    string;

  availableBalanceMinorUnits:
    string;

  reservedBalanceMinorUnits:
    string;

  currency:
    SupportedCurrency;

  rowVersion:
    string;
}

export interface WalletPaymentVerificationFundingOrder {
  id:
    string;

  status:
    string;

  creditedAt:
    string | null;

  rowVersion:
    string;
}

export interface WalletPaymentVerificationResult {
  payment:
    WalletPaymentVerificationPayment;

  wallet?:
    WalletPaymentVerificationWallet;

  fundingOrder?:
    WalletPaymentVerificationFundingOrder;

  replay:
    boolean;
}

interface WalletPaymentVerificationResponse {
  verification:
    WalletPaymentVerificationResult;
}

export async function verifyWalletFundingPayment(
  input:
    VerifyWalletFundingPaymentInput
): Promise<WalletPaymentVerificationResult> {
  const response =
    await requestPosterApiJson<WalletPaymentVerificationResponse>(
      "/api/v1/client/wallet/payment-verifications",
      {
        method:
          "POST",

        body:
          JSON.stringify({
            fundingOrderId:
              input.fundingOrderId,

            providerOrderId:
              input.providerOrderId,

            providerPaymentId:
              input.providerPaymentId,

            providerSignature:
              input.providerSignature,

            amountMinorUnits:
              String(
                input.amountMinor
              ),

            currency:
              input.currency,

            methodDetails: {
              channel:
                "razorpay_checkout",
            },

            providerPayload: {
              source:
                "client_wallet_ui_checkout_callback",

              provider:
                "razorpay",
            },

            paidAt:
              new Date().toISOString(),
          }),
      }
    );

  return response.verification;
}