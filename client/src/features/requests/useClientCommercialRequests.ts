"use client";

import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  getCurrentOrganization,
} from "@/features/workspace/workspace.selectors";

import {
  listClientCommercialRequests,
} from "./client-commercial-request.service";

import type {
  ClientCommercialRequestApiRecord,
} from "./client-commercial-request.service";

export interface UseClientCommercialRequestsResult {
  organizationId:
    string |
    null;

  requests:
    ClientCommercialRequestApiRecord[];

  isLoading:
    boolean;

  isRefreshing:
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
  if (
    error instanceof Error &&
    error.message.trim().length > 0
  ) {
    return error.message;
  }

  return "Poster Backend could not load advertising requests. Try again.";
}

export function useClientCommercialRequests(
  limit:
    number =
      100
): UseClientCommercialRequestsResult {
  const organization =
    getCurrentOrganization();

  const organizationId =
    organization?.id ??
    null;

  const [
    requests,
    setRequests,
  ] =
    useState<ClientCommercialRequestApiRecord[]>([]);

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
    errorMessage,
    setErrorMessage,
  ] =
    useState<string | null>(
      null
    );

  const loadRequests =
    useCallback(
      async (
        mode:
          "initial" |
          "refresh"
      ) => {
        if (!organizationId) {
          setRequests(
            []
          );

          setErrorMessage(
            "Poster Client organization could not be resolved. Sign in again."
          );

          setIsLoading(
            false
          );

          setIsRefreshing(
            false
          );

          return;
        }

        if (mode === "refresh") {
          setIsRefreshing(
            true
          );
        } else {
          setIsLoading(
            true
          );
        }

        try {
          const nextRequests =
            await listClientCommercialRequests(
              {
                organizationId,
                limit,
              }
            );

          setRequests(
            nextRequests
          );

          setErrorMessage(
            null
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

          setIsRefreshing(
            false
          );
        }
      },
      [
        organizationId,
        limit,
      ]
    );

  useEffect(
    () => {
      let isActive =
        true;

      async function loadInitialRequests() {
        if (!isActive) {
          return;
        }

        await loadRequests(
          "initial"
        );
      }

      void loadInitialRequests();

      return () => {
        isActive =
          false;
      };
    },
    [
      loadRequests,
    ]
  );

  const refresh =
    useCallback(
      async () => {
        await loadRequests(
          "refresh"
        );
      },
      [
        loadRequests,
      ]
    );

  return {
    organizationId,
    requests,
    isLoading,
    isRefreshing,
    errorMessage,
    refresh,
  };
}