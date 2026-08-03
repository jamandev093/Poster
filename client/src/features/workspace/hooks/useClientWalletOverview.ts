"use client";

import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  getClientWalletOverview,
  type ClientWalletApiOverview,
} from "../services/client-wallet-read.service";

export interface UseClientWalletOverviewResult {
  overview:
    ClientWalletApiOverview |
    null;

  isLoading:
    boolean;

  errorMessage:
    string |
    null;

  refresh:
    () => Promise<void>;
}

function getErrorMessage(
  error:
    unknown
): string {
  if (error instanceof Error) {
    return error.message;
  }

  return "Unable to load Wallet data.";
}

export function useClientWalletOverview(
  limit:
    number =
      25
): UseClientWalletOverviewResult {
  const [
    overview,
    setOverview,
  ] =
    useState<ClientWalletApiOverview | null>(
      null
    );

  const [
    isLoading,
    setIsLoading,
  ] =
    useState(
      true
    );

  const [
    errorMessage,
    setErrorMessage,
  ] =
    useState<string | null>(
      null
    );

  const refresh =
    useCallback(
      async () => {
        setIsLoading(
          true
        );

        setErrorMessage(
          null
        );

        try {
          const nextOverview =
            await getClientWalletOverview(
              limit
            );

          setOverview(
            nextOverview
          );
        } catch (error) {
          setErrorMessage(
            getErrorMessage(
              error
            )
          );
        } finally {
          setIsLoading(
            false
          );
        }
      },
      [
        limit,
      ]
    );

  useEffect(
    () => {
      let isActive =
        true;

      async function loadInitialOverview() {
        try {
          const nextOverview =
            await getClientWalletOverview(
              limit
            );

          if (!isActive) {
            return;
          }

          setOverview(
            nextOverview
          );

          setErrorMessage(
            null
          );
        } catch (error) {
          if (!isActive) {
            return;
          }

          setErrorMessage(
            getErrorMessage(
              error
            )
          );
        } finally {
          if (isActive) {
            setIsLoading(
              false
            );
          }
        }
      }

      void loadInitialOverview();

      return () => {
        isActive =
          false;
      };
    },
    [
      limit,
    ]
  );

  return {
    overview,
    isLoading,
    errorMessage,
    refresh,
  };
}