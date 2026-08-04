"use client";

import {
  useCallback,
  useMemo,
  useState,
} from "react";

import {
  allocateClientCampaignWalletFunds,
  releaseClientCampaignWalletFunds,
  type AllocateClientCampaignWalletInput,
  type ClientWalletAllocationMutationResult,
  type ReleaseClientCampaignWalletInput,
} from "../services/client-wallet-allocation.service";

export type ClientWalletAllocationAction =
  | "allocate"
  | "release";

export type ClientWalletAllocationActionStatus =
  | "idle"
  | "submitting"
  | "succeeded"
  | "failed";

export interface ClientWalletAllocationActionState {
  status:
    ClientWalletAllocationActionStatus;

  activeAction:
    ClientWalletAllocationAction |
    null;

  isSubmitting:
    boolean;

  errorMessage:
    string |
    null;

  successMessage:
    string |
    null;

  result:
    ClientWalletAllocationMutationResult |
    null;
}

export interface UseClientWalletAllocationActionsOptions {
  onMutationComplete?:
    (
      result:
        ClientWalletAllocationMutationResult,

      action:
        ClientWalletAllocationAction
    ) => Promise<void> | void;
}

export interface UseClientWalletAllocationActionsResult
  extends ClientWalletAllocationActionState {
  allocate:
    (
      input:
        AllocateClientCampaignWalletInput
    ) => Promise<ClientWalletAllocationMutationResult>;

  release:
    (
      input:
        ReleaseClientCampaignWalletInput
    ) => Promise<ClientWalletAllocationMutationResult>;

  reset:
    () => void;
}

function getErrorMessage(
  error:
    unknown
): string {
  if (error instanceof Error) {
    return error.message;
  }

  return "Campaign Wallet allocation could not be updated.";
}

function createIdleState():
  ClientWalletAllocationActionState {
  return {
    status:
      "idle",

    activeAction:
      null,

    isSubmitting:
      false,

    errorMessage:
      null,

    successMessage:
      null,

    result:
      null,
  };
}

function createSubmittingState(
  action:
    ClientWalletAllocationAction
): ClientWalletAllocationActionState {
  return {
    status:
      "submitting",

    activeAction:
      action,

    isSubmitting:
      true,

    errorMessage:
      null,

    successMessage:
      null,

    result:
      null,
  };
}

function createSucceededState(
  action:
    ClientWalletAllocationAction,

  result:
    ClientWalletAllocationMutationResult
): ClientWalletAllocationActionState {
  return {
    status:
      "succeeded",

    activeAction:
      action,

    isSubmitting:
      false,

    errorMessage:
      null,

    successMessage:
      action === "allocate"
        ? "Campaign allocation updated."
        : "Campaign allocation released.",

    result,
  };
}

function createFailedState(
  action:
    ClientWalletAllocationAction,

  error:
    unknown
): ClientWalletAllocationActionState {
  return {
    status:
      "failed",

    activeAction:
      action,

    isSubmitting:
      false,

    errorMessage:
      getErrorMessage(
        error
      ),

    successMessage:
      null,

    result:
      null,
  };
}

function normalizeReleaseInput(
  input:
    ReleaseClientCampaignWalletInput
): ReleaseClientCampaignWalletInput {
  const normalized:
    ReleaseClientCampaignWalletInput = {
      campaignId:
        input.campaignId,

      expectedRowVersion:
        input.expectedRowVersion,
  };

  if (
    input.amountMinorUnits !== undefined
  ) {
    normalized.amountMinorUnits =
      input.amountMinorUnits;
  }

  if (
    input.idempotencyKey !== undefined
  ) {
    normalized.idempotencyKey =
      input.idempotencyKey;
  }

  return normalized;
}

export function useClientWalletAllocationActions(
  options:
    UseClientWalletAllocationActionsOptions =
      {}
): UseClientWalletAllocationActionsResult {
  const [
    state,
    setState,
  ] =
    useState<ClientWalletAllocationActionState>(
      createIdleState
    );

  const reset =
    useCallback(
      () => {
        setState(
          createIdleState()
        );
      },
      []
    );

  const allocate =
    useCallback(
      async (
        input:
          AllocateClientCampaignWalletInput
      ): Promise<ClientWalletAllocationMutationResult> => {
        setState(
          createSubmittingState(
            "allocate"
          )
        );

        try {
          const result =
            await allocateClientCampaignWalletFunds(
              input
            );

          await options.onMutationComplete?.(
            result,
            "allocate"
          );

          setState(
            createSucceededState(
              "allocate",
              result
            )
          );

          return result;
        } catch (error) {
          setState(
            createFailedState(
              "allocate",
              error
            )
          );

          throw error;
        }
      },
      [
        options,
      ]
    );

  const release =
    useCallback(
      async (
        input:
          ReleaseClientCampaignWalletInput
      ): Promise<ClientWalletAllocationMutationResult> => {
        setState(
          createSubmittingState(
            "release"
          )
        );

        try {
          const result =
            await releaseClientCampaignWalletFunds(
              normalizeReleaseInput(
                input
              )
            );

          await options.onMutationComplete?.(
            result,
            "release"
          );

          setState(
            createSucceededState(
              "release",
              result
            )
          );

          return result;
        } catch (error) {
          setState(
            createFailedState(
              "release",
              error
            )
          );

          throw error;
        }
      },
      [
        options,
      ]
    );

  return useMemo(
    () => ({
      ...state,
      allocate,
      release,
      reset,
    }),
    [
      state,
      allocate,
      release,
      reset,
    ]
  );
}