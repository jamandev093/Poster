import type {
  CreateWalletFundingOrderInput,
  WalletFundingCheckoutOrder,
  WalletFundingOrderStatus,
} from "../wallet/wallet.funding.types";

import {
  requestPosterApiJson,
} from "./client-api.service";
import { createSecureRandomToken } from "./secure-random-token";

interface BackendWalletFundingOrder {
  id?: string;
  fundingOrderId?: string;
  walletId?: string;
  organizationId?: string;
  status?: string;
  amountMinor?: number;
  amountMinorUnits?: string;
  currency?: "INR";
  provider?: "razorpay";
  providerOrderId?: string | null;
  providerReceipt?: string | null;
  publicKeyId?: string;
  checkoutName?: string;
  checkoutDescription?: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  expiresAt?: string | null;
  createdAt?: string;
}

interface BackendWalletFundingOrderResponse {
  order:
    BackendWalletFundingOrder;
}

function createFundingIdempotencyKey(
  input:
    CreateWalletFundingOrderInput
): string {
  return [
    "client-wallet-funding",
    input.organizationId,
    input.walletId,
    input.amountMinor,
    Date.now(),
    createSecureRandomToken(),
  ].join(":");
}

function normalizeAmountMinor(
  order:
    BackendWalletFundingOrder,
  input:
    CreateWalletFundingOrderInput
): number {
  if (
    typeof order.amountMinor === "number" &&
    Number.isSafeInteger(order.amountMinor)
  ) {
    return order.amountMinor;
  }

  if (
    typeof order.amountMinorUnits === "string" &&
    /^[0-9]+$/.test(order.amountMinorUnits)
  ) {
    const parsed =
      Number(order.amountMinorUnits);

    if (Number.isSafeInteger(parsed)) {
      return parsed;
    }
  }

  return input.amountMinor;
}

function normalizeFundingOrderStatus(
  status:
    string | undefined
): WalletFundingOrderStatus {
  switch (status) {
    case "created":
    case "pending_provider":
    case "checkout_opened":
    case "payment_submitted":
    case "verification_pending":
    case "verified":
    case "credited":
    case "failed":
    case "expired":
    case "cancelled":
      return status;

    default:
      return "created";
  }
}

function mapBackendFundingOrder(
  order:
    BackendWalletFundingOrder,
  input:
    CreateWalletFundingOrderInput
): WalletFundingCheckoutOrder {
  const fundingOrderId =
    order.fundingOrderId ??
    order.id;

  if (!fundingOrderId) {
    throw new Error(
      "The Wallet funding order response did not include an order id."
    );
  }

  const amountMinor =
    normalizeAmountMinor(
      order,
      input
    );

  return {
    fundingOrderId:
      fundingOrderId as WalletFundingCheckoutOrder[
        "fundingOrderId"
      ],

    walletId:
      (
        order.walletId ??
        input.walletId
      ) as WalletFundingCheckoutOrder[
        "walletId"
      ],

    organizationId:
      (
        order.organizationId ??
        input.organizationId
      ) as WalletFundingCheckoutOrder[
        "organizationId"
      ],

    status:
      normalizeFundingOrderStatus(
        order.status
      ),

    currency:
      order.currency ??
      input.currency,

    amountMinor,

    provider:
      "razorpay",

    providerOrderId:
      order.providerOrderId ??
      "",

    publicKeyId:
      order.publicKeyId ??
      process.env
        .NEXT_PUBLIC_RAZORPAY_KEY_ID
        ?.trim() ??
      "",

    checkoutName:
      order.checkoutName ??
      "Poster Wallet",

    checkoutDescription:
      order.checkoutDescription ??
      "Add verified funds to your Poster Wallet.",

    customerName:
      order.customerName,

    customerEmail:
      order.customerEmail,

    customerPhone:
      order.customerPhone,

    expiresAt:
      order.expiresAt ??
      new Date(
        Date.now() +
          15 * 60 * 1000
      ).toISOString(),

    createdAt:
      order.createdAt ??
      new Date().toISOString(),
  };
}

export async function createWalletFundingOrder(
  input:
    CreateWalletFundingOrderInput
): Promise<WalletFundingCheckoutOrder> {
  const response =
    await requestPosterApiJson<BackendWalletFundingOrderResponse>(
      "/api/v1/client/wallet/funding-orders",
      {
        method:
          "POST",

        body:
          JSON.stringify({
            amountMinorUnits:
              String(input.amountMinor),

            currency:
              input.currency,

            idempotencyKey:
              createFundingIdempotencyKey(
                input
              ),

            providerPayload: {
              source:
                "client_wallet_ui",

              walletId:
                input.walletId,

              organizationId:
                input.organizationId,
            },
          }),
      }
    );

  return mapBackendFundingOrder(
    response.order,
    input
  );
}