"use client";

import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  useClientAccount,
} from "@/features/account/useClientAccount";
import {
  getClientCommercialRequest,
} from "./client-commercial-request.service";

import type {
  ClientCommercialRequestApiRecord,
  ClientCommercialRequestDetailResponse,
} from "./client-commercial-request.service";

export interface UseClientCommercialRequestResult {
  organizationId:
    string |
    null;

  request:
    ClientCommercialRequestApiRecord |
    null;

  detail:
    ClientCommercialRequestDetailResponse |
    null;

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

  return "Poster Backend could not load this advertising request. Try again.";
}

export function useClientCommercialRequest(
  requestId:
    string |
    null
): UseClientCommercialRequestResult {  const {
    account,
    isLoading:
      isAccountLoading,
  } =
    useClientAccount();

  const organizationId =
    account?.organization.id ??
    null;

  const [
    detail,
    setDetail,
  ] =
    useState<ClientCommercialRequestDetailResponse | null>(
      null
    );

  const [
    isLoading,
    setIsLoading,
  ] =
    useState(
      Boolean(
        requestId
      )
    );

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

  const loadRequest =
    useCallback(
      async (
        mode:
          "initial" |
          "refresh"
      ) => {
        if (!requestId) {
          setDetail(
            null
          );

          setErrorMessage(
            null
          );

          setIsLoading(
            false
          );

          setIsRefreshing(
            false
          );

          return;
        }

        if (
          isAccountLoading
        ) {
          return;
        }

        if (!organizationId) {
          setDetail(
            null
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
          const nextDetail =
            await getClientCommercialRequest(
              {
                organizationId,
                requestId,
              }
            );

          setDetail(
            nextDetail
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
        isAccountLoading,
        requestId,
      ]
    );

  useEffect(
    () => {
      let isActive =
        true;

      async function loadInitialRequest() {
        if (!isActive) {
          return;
        }

        await loadRequest(
          "initial"
        );
      }

      void loadInitialRequest();

      return () => {
        isActive =
          false;
      };
    },
    [
      loadRequest,
    ]
  );

  const refresh =
    useCallback(
      async () => {
        await loadRequest(
          "refresh"
        );
      },
      [
        loadRequest,
      ]
    );

  return {
    organizationId,
    request:
      detail?.request ??
      null,
    detail,
    isLoading,
    isRefreshing,
    errorMessage,
    refresh,
  };
}
