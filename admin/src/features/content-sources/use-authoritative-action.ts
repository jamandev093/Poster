"use client";

import {
  useCallback,
  useRef,
  useState,
} from "react";

interface AuthoritativeActionState {
  error:
    string |
    null;

  isRunning: boolean;
}

export function useAuthoritativeAction() {
  const [
    state,
    setState,
  ] =
    useState<AuthoritativeActionState>({
      error:
        null,

      isRunning:
        false,
    });

  const requestRef =
    useRef<
      AbortController |
      null
    >(
      null
    );

  const run =
    useCallback(
      async <TResult>(
        action:
          (
            signal:
              AbortSignal
          ) => Promise<TResult>
      ): Promise<TResult | null> => {
        requestRef
          .current
          ?.abort();

        const controller =
          new AbortController();

        requestRef.current =
          controller;

        setState({
          error:
            null,

          isRunning:
            true,
        });

        try {
          return await action(
            controller.signal
          );
        } catch (
          error
        ) {
          if (
            controller.signal.aborted
          ) {
            return null;
          }

          setState({
            error:
              error instanceof Error
                ? error.message
                : "The requested action could not be completed.",

            isRunning:
              false,
          });

          return null;
        } finally {
          if (
            requestRef.current ===
            controller
          ) {
            requestRef.current =
              null;

            setState(
              current => ({
                ...current,

                isRunning:
                  false,
              })
            );
          }
        }
      },
      []
    );

  const clearError =
    useCallback(
      () => {
        setState(
          current => ({
            ...current,

            error:
              null,
          })
        );
      },
      []
    );

  const cancel =
    useCallback(
      () => {
        requestRef
          .current
          ?.abort();

        requestRef.current =
          null;

        setState(
          current => ({
            ...current,

            isRunning:
              false,
          })
        );
      },
      []
    );

  return {
    ...state,
    run,
    cancel,
    clearError,
  };
}