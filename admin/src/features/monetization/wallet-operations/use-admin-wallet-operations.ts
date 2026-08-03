"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import {
  fetchAdminWalletOperations,
} from "./admin-wallet-operations.service";

import type {
  AdminWalletOperationsResponse,
} from "./admin-wallet-operations.types";

interface AdminWalletOperationsState {
  data:
    AdminWalletOperationsResponse |
    null;

  error:
    string |
    null;

  isLoading:
    boolean;

  isRefreshing:
    boolean;
}

const INITIAL_STATE:
  AdminWalletOperationsState = {
  data: null,
  error: null,
  isLoading: true,
  isRefreshing: false,
};

function getErrorMessage(
  error:
    unknown
): string {
  if (error instanceof Error) {
    return error.message;
  }

  return "Wallet Operations could not be loaded.";
}

export function useAdminWalletOperations() {
  const [
    state,
    setState,
  ] =
    useState<AdminWalletOperationsState>(
      INITIAL_STATE
    );

  const activeRequestRef =
    useRef<AbortController | null>(
      null
    );

  useEffect(
    () => {
      let isActive =
        true;

      const controller =
        new AbortController();

      activeRequestRef.current =
        controller;

      async function loadInitial() {
        try {
          const data =
            await fetchAdminWalletOperations(
              controller.signal
            );

          if (!isActive) {
            return;
          }

          setState({
            data,
            error: null,
            isLoading: false,
            isRefreshing: false,
          });
        } catch (error) {
          if (
            controller.signal.aborted ||
            !isActive
          ) {
            return;
          }

          setState({
            data: null,
            error:
              getErrorMessage(
                error
              ),
            isLoading: false,
            isRefreshing: false,
          });
        }
      }

      void loadInitial();

      return () => {
        isActive =
          false;

        controller.abort();

        if (
          activeRequestRef.current ===
          controller
        ) {
          activeRequestRef.current =
            null;
        }
      };
    },
    []
  );

  const refresh =
    useCallback(
      async () => {
        activeRequestRef
          .current
          ?.abort();

        const controller =
          new AbortController();

        activeRequestRef.current =
          controller;

        setState(
          current => ({
            ...current,
            error: null,
            isLoading:
              current.data === null,
            isRefreshing:
              current.data !== null,
          })
        );

        try {
          const data =
            await fetchAdminWalletOperations(
              controller.signal
            );

          setState({
            data,
            error: null,
            isLoading: false,
            isRefreshing: false,
          });
        } catch (error) {
          if (
            controller.signal.aborted
          ) {
            return;
          }

          setState(
            current => ({
              ...current,
              error:
                getErrorMessage(
                  error
                ),
              isLoading: false,
              isRefreshing: false,
            })
          );
        } finally {
          if (
            activeRequestRef.current ===
            controller
          ) {
            activeRequestRef.current =
              null;
          }
        }
      },
      []
    );

  return {
    ...state,
    refresh,
  };
}