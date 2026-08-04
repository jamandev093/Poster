import {
  requestPosterApiJson,
} from "./client-api.service";

import type {
  ClientWalletApiCampaignAllocation,
  ClientWalletApiWallet,
} from "./client-wallet-read.service";

export type ClientWalletAllocationCurrency =
  "INR";

export interface AllocateClientCampaignWalletInput {
  campaignId:
    string;

  amountMinorUnits:
    string;

  currency:
    ClientWalletAllocationCurrency;

  idempotencyKey?:
    string;
}

export interface ReleaseClientCampaignWalletInput {
  campaignId:
    string;

  amountMinorUnits?:
    string;

  expectedRowVersion:
    string;

  idempotencyKey?:
    string;
}

export interface ClientWalletAllocationMutationResult {
  wallet:
    ClientWalletApiWallet;

  allocation:
    ClientWalletApiCampaignAllocation;
}

function createClientWalletAllocationIdempotencyKey(
  action:
    "allocate" |
    "release",

  campaignId:
    string
): string {
  return [
    "client-wallet-allocation",
    action,
    campaignId,
    Date.now(),
    Math.random().toString(36).slice(2),
  ].join(":");
}

function requireNonEmptyString(
  value:
    string,

  field:
    string
): string {
  const trimmed =
    value.trim();

  if (
    trimmed.length === 0
  ) {
    throw new Error(
      `${field} is required.`
    );
  }

  return trimmed;
}

function requirePositiveMinorUnits(
  value:
    string,

  field:
    string
): string {
  const trimmed =
    requireNonEmptyString(
      value,
      field
    );

  if (
    !/^[1-9][0-9]*$/.test(
      trimmed
    )
  ) {
    throw new Error(
      `${field} must be a positive integer string.`
    );
  }

  return trimmed;
}

export async function allocateClientCampaignWalletFunds(
  input:
    AllocateClientCampaignWalletInput
): Promise<ClientWalletAllocationMutationResult> {
  const campaignId =
    requireNonEmptyString(
      input.campaignId,
      "campaignId"
    );

  const amountMinorUnits =
    requirePositiveMinorUnits(
      input.amountMinorUnits,
      "amountMinorUnits"
    );

  return await requestPosterApiJson<ClientWalletAllocationMutationResult>(
    "/api/v1/client/wallet/campaign-allocations",
    {
      method:
        "POST",

      headers: {
        "Content-Type":
          "application/json",
      },

      body:
        JSON.stringify({
          campaignId,
          amountMinorUnits,
          currency:
            input.currency,
          idempotencyKey:
            input.idempotencyKey ??
            createClientWalletAllocationIdempotencyKey(
              "allocate",
              campaignId
            ),
        }),
    }
  );
}

export async function releaseClientCampaignWalletFunds(
  input:
    ReleaseClientCampaignWalletInput
): Promise<ClientWalletAllocationMutationResult> {
  const campaignId =
    requireNonEmptyString(
      input.campaignId,
      "campaignId"
    );

  const payload: {
    amountMinorUnits?:
      string;

    expectedRowVersion:
      string;

    idempotencyKey:
      string;
  } = {
    expectedRowVersion:
      requireNonEmptyString(
        input.expectedRowVersion,
        "expectedRowVersion"
      ),

    idempotencyKey:
      input.idempotencyKey ??
      createClientWalletAllocationIdempotencyKey(
        "release",
        campaignId
      ),
  };

  if (
    input.amountMinorUnits !== undefined
  ) {
    payload.amountMinorUnits =
      requirePositiveMinorUnits(
        input.amountMinorUnits,
        "amountMinorUnits"
      );
  }

  return await requestPosterApiJson<ClientWalletAllocationMutationResult>(
    `/api/v1/client/wallet/campaign-allocations/${encodeURIComponent(
      campaignId
    )}/release`,
    {
      method:
        "POST",

      headers: {
        "Content-Type":
          "application/json",
      },

      body:
        JSON.stringify(
          payload
        ),
    }
  );
}