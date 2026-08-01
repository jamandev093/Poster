"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import {
  fetchCopyrightCaseDetails,
} from "./copyright-api.service";

import type {
  AdminCopyrightCaseDetails,
} from "./copyright-api.types";

interface CopyrightCaseDetailsState {
  data:
    AdminCopyrightCaseDetails |
    null;

  error:
    string |
    null;

  isLoading: boolean;

  isRefreshing: boolean;
}

const EMPTY_STATE:
  CopyrightCaseDetailsState = {
  data:
    null,

  error:
    null,

  isLoading:
    false,

  isRefreshing:
    false,
};

export function useCopyrightCaseDetails(
  caseId:
    string |
    null
) {
  const [
    state,
    setState,
  ] =
    useState<
      CopyrightCaseDetailsState
    >(
      EMPTY_STATE
    );

  const requestRef =
    useRef<
      AbortController |
      null
    >(
      null
    );

  const requestIdRef =
    useRef(
      0
    );

  const mountedRef =
    useRef(
      false
    );

  const load =
    useCallback(
      async (
        selectedCaseId:
          string,
        mode:
          | "initial"
          | "refresh"
      ) => {
        requestRef
          .current
          ?.abort();

        const controller =
          new AbortController();

        requestRef.current =
          controller;

        const requestId =
          requestIdRef.current +
          1;

        requestIdRef.current =
          requestId;

        setState(
          current => ({
            ...current,

            error:
              null,

            isLoading:
              mode ===
                "initial" &&
              current.data ===
                null,

            isRefreshing:
              mode ===
                "refresh" ||
              current.data !==
                null,
          })
        );

        try {
          const data =
            await fetchCopyrightCaseDetails(
              selectedCaseId,
              controller.signal
            );

          if (
            !mountedRef.current ||
            requestId !==
              requestIdRef.current
          ) {
            return;
          }

          setState({
            data,
            error:
              null,

            isLoading:
              false,

            isRefreshing:
              false,
          });
        } catch (
          error
        ) {
          if (
            controller
              .signal
              .aborted ||
            !mountedRef.current ||
            requestId !==
              requestIdRef.current
          ) {
            return;
          }

          setState(
            current => ({
              ...current,

              error:
                error instanceof
                  Error
                  ? error.message
                  : "Copyright case details could not be loaded.",

              isLoading:
                false,

              isRefreshing:
                false,
            })
          );
        } finally {
          if (
            requestRef.current ===
            controller
          ) {
            requestRef.current =
              null;
          }
        }
      },
      []
    );

  useEffect(
    () => {
      mountedRef.current =
        true;

      if (
        !caseId
      ) {
        requestRef
          .current
          ?.abort();

        requestRef.current =
          null;

        setState(
          EMPTY_STATE
        );

        return () => {
          mountedRef.current =
            false;
        };
      }

      setState({
        data:
          null,

        error:
          null,

        isLoading:
          true,

        isRefreshing:
          false,
      });

      void load(
        caseId,
        "initial"
      );

      return () => {
        mountedRef.current =
          false;

        requestRef
          .current
          ?.abort();

        requestRef.current =
          null;
      };
    },
    [
      caseId,
      load,
    ]
  );

  const refresh =
    useCallback(
      () => {
        if (
          !caseId
        ) {
          return;
        }

        void load(
          caseId,
          state.data
            ? "refresh"
            : "initial"
        );
      },
      [
        caseId,
        load,
        state.data,
      ]
    );

  const replace =
    useCallback(
      (
        data:
          AdminCopyrightCaseDetails
      ) => {
        setState({
          data,
          error:
            null,

          isLoading:
            false,

          isRefreshing:
            false,
        });
      },
      []
    );

  return {
    ...state,
    refresh,
    replace,
  };
}