"use client";

import {
  useCallback,
  useState,
} from "react";

import {
  DirectSponsorshipMutationError,
  getTransitionErrorMessage,
  transitionDirectSponsorship,
  type TransitionDirectSponsorshipInput,
} from "./direct-sponsorship.mutations";

export interface UseDirectSponsorshipTransitionOptions {
  onSuccess:
    () => void;

  onConflict?:
    () => void;
}

export function useDirectSponsorshipTransition(
  options:
    UseDirectSponsorshipTransitionOptions
) {
  const {
    onConflict,
    onSuccess,
  } =
    options;

  const [
    pendingCampaignId,
    setPendingCampaignId,
  ] =
    useState<
      string |
      null
    >(
      null
    );

  const [
    error,
    setError,
  ] =
    useState<
      string |
      null
    >(
      null
    );

  const execute =
    useCallback(
      async (
        input:
          TransitionDirectSponsorshipInput
      ): Promise<boolean> => {
        if (
          pendingCampaignId
        ) {
          return false;
        }

        setPendingCampaignId(
          input.campaignId
        );

        setError(
          null
        );

        try {
          await transitionDirectSponsorship(
            input
          );

          onSuccess();

          return true;
        } catch (
          mutationError
        ) {
          if (
            mutationError instanceof
              DirectSponsorshipMutationError &&
            mutationError.code ===
              "CAMPAIGN_VERSION_CONFLICT"
          ) {
            onConflict?.();
          }

          setError(
            getTransitionErrorMessage(
              mutationError
            )
          );

          return false;
        } finally {
          setPendingCampaignId(
            null
          );
        }
      },
      [
        onConflict,
        onSuccess,
        pendingCampaignId,
      ]
    );

  const clearError =
    useCallback(
      () => {
        setError(
          null
        );
      },
      []
    );

  return {
    clearError,
    error,
    execute,

    isPending:
      pendingCampaignId !==
      null,

    pendingCampaignId,
  };
}