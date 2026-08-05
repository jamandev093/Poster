"use client";

import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  getClientAccount,
  updateClientCurrentOrganization,
} from "./client-account.service";

import type {
  ClientAccount,
  UpdateClientOrganizationInput,
} from "./client-account.service";

export interface UseClientAccountResult {
  account:
    ClientAccount |
    null;

  isLoading:
    boolean;

  isRefreshing:
    boolean;

  isSubmitting:
    boolean;

  errorMessage:
    string |
    null;

  savedAt:
    string |
    null;

  refresh:
    () => Promise<void>;

  updateOrganization:
    (
      input:
        UpdateClientOrganizationInput
    ) => Promise<void>;
}

function getErrorMessage(
  error:
    unknown
): string {
  if (error instanceof Error) {
    return error.message;
  }

  return "Client account could not be loaded.";
}

export function useClientAccount():
  UseClientAccountResult {
  const [
    account,
    setAccount,
  ] =
    useState<ClientAccount | null>(
      null
    );

  const [
    isLoading,
    setIsLoading,
  ] =
    useState(true);

  const [
    isRefreshing,
    setIsRefreshing,
  ] =
    useState(false);

  const [
    isSubmitting,
    setIsSubmitting,
  ] =
    useState(false);

  const [
    errorMessage,
    setErrorMessage,
  ] =
    useState<string | null>(
      null
    );

  const [
    savedAt,
    setSavedAt,
  ] =
    useState<string | null>(
      null
    );

  useEffect(
    () => {
      let isActive =
        true;

      async function loadInitialAccount() {
        try {
          const nextAccount =
            await getClientAccount();

          if (!isActive) {
            return;
          }

          setAccount(
            nextAccount
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

      void loadInitialAccount();

      return () => {
        isActive =
          false;
      };
    },
    []
  );

  const refresh =
    useCallback(
      async () => {
        setIsRefreshing(true);
        setErrorMessage(null);

        try {
          const nextAccount =
            await getClientAccount();

          setAccount(
            nextAccount
          );
        } catch (error) {
          setErrorMessage(
            getErrorMessage(
              error
            )
          );
        } finally {
          setIsLoading(false);
          setIsRefreshing(false);
        }
      },
      []
    );

  const updateOrganization =
    useCallback(
      async (
        input:
          UpdateClientOrganizationInput
      ) => {
        setIsSubmitting(true);
        setErrorMessage(null);
        setSavedAt(null);

        try {
          const organization =
            await updateClientCurrentOrganization(
              input
            );

          setAccount(
            current => {
              if (!current) {
                return current;
              }

              return {
                ...current,

                organization,
              };
            }
          );

          setSavedAt(
            new Date().toISOString()
          );
        } catch (error) {
          setErrorMessage(
            getErrorMessage(
              error
            )
          );

          throw error;
        } finally {
          setIsSubmitting(false);
        }
      },
      []
    );

  return {
    account,
    isLoading,
    isRefreshing,
    isSubmitting,
    errorMessage,
    savedAt,
    refresh,
    updateOrganization,
  };
}