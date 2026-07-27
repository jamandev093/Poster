import type {
  CreateWalletFundingOrderInput,
  WalletFundingCheckoutOrder,
} from "../wallet/wallet.funding.types";

interface ApiErrorPayload {
  message?:
    string;

  error?:
    string;
}

function getApiBaseUrl():
  string {
  const configuredBaseUrl =
    process.env
      .NEXT_PUBLIC_POSTER_API_BASE_URL
      ?.trim();

  if (
    !configuredBaseUrl
  ) {
    throw new Error(
      "Wallet funding is not connected to the Poster Backend yet."
    );
  }

  return configuredBaseUrl.replace(
    /\/+$/,
    ""
  );
}

async function readApiError(
  response:
    Response
): Promise<string> {
  try {
    const payload =
      await response.json() as
        ApiErrorPayload;

    return (
      payload.message ??
      payload.error ??
      "The Wallet funding request could not be completed."
    );
  } catch {
    return "The Wallet funding request could not be completed.";
  }
}

export async function createWalletFundingOrder(
  input:
    CreateWalletFundingOrderInput
): Promise<WalletFundingCheckoutOrder> {
  const apiBaseUrl =
    getApiBaseUrl();

  const response =
    await fetch(
      `${apiBaseUrl}/api/client/wallet/funding-orders`,
      {
        method:
          "POST",

        headers: {
          "Content-Type":
            "application/json",
        },

        credentials:
          "include",

        body:
          JSON.stringify(
            input
          ),
      }
    );

  if (
    !response.ok
  ) {
    throw new Error(
      await readApiError(
        response
      )
    );
  }

  return await response.json() as
    WalletFundingCheckoutOrder;
}