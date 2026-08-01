"use client";

import {
  useCallback,
  useRef,
  useState,
} from "react";

import {
  dismissCopyrightCase,
  removeCopyrightContent,
  restoreCopyrightCase,
} from "./copyright-api.service";

import type {
  AdminCopyrightCaseDetails,
  CopyrightDismissRequest,
  CopyrightRemoveRequest,
  CopyrightRestoreRequest,
} from "./copyright-api.types";

type CopyrightActionName =
  | "remove"
  | "dismiss"
  | "restore";

interface UseCopyrightActionsOptions {
  onCompleted?:
    (
      details:
        AdminCopyrightCaseDetails
    ) => void;
}

export function useCopyrightActions(
  options:
    UseCopyrightActionsOptions =
    {}
) {
  const [
    action,
    setAction,
  ] =
    useState<
      CopyrightActionName |
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

  const requestRef =
    useRef<
      AbortController |
      null
    >(
      null
    );

  const run =
    useCallback(
      async (
        actionName:
          CopyrightActionName,
        operation:
          (
            signal:
              AbortSignal
          ) => Promise<
            AdminCopyrightCaseDetails
          >
      ): Promise<
        AdminCopyrightCaseDetails |
        null
      > => {
        if (
          action
        ) {
          return null;
        }

        const controller =
          new AbortController();

        requestRef.current =
          controller;

        setAction(
          actionName
        );

        setError(
          null
        );

        try {
          const details =
            await operation(
              controller.signal
            );

          options
            .onCompleted
            ?.(
              details
            );

          return details;
        } catch (
          caught
        ) {
          if (
            controller
              .signal
              .aborted
          ) {
            return null;
          }

          setError(
            caught instanceof
              Error
              ? caught.message
              : "The Copyright action could not be completed."
          );

          return null;
        } finally {
          if (
            requestRef.current ===
            controller
          ) {
            requestRef.current =
              null;
          }

          setAction(
            null
          );
        }
      },
      [
        action,
        options,
      ]
    );

  const remove =
    useCallback(
      (
        caseId: string,
        input:
          CopyrightRemoveRequest
      ) =>
        run(
          "remove",
          signal =>
            removeCopyrightContent(
              caseId,
              input,
              signal
            )
        ),
      [
        run,
      ]
    );

  const dismiss =
    useCallback(
      (
        caseId: string,
        input:
          CopyrightDismissRequest
      ) =>
        run(
          "dismiss",
          signal =>
            dismissCopyrightCase(
              caseId,
              input,
              signal
            )
        ),
      [
        run,
      ]
    );

  const restore =
    useCallback(
      (
        caseId: string,
        input:
          CopyrightRestoreRequest
      ) =>
        run(
          "restore",
          signal =>
            restoreCopyrightCase(
              caseId,
              input,
              signal
            )
        ),
      [
        run,
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
    action,
    error,

    isRunning:
      action !==
      null,

    isRemoving:
      action ===
      "remove",

    isDismissing:
      action ===
      "dismiss",

    isRestoring:
      action ===
      "restore",

    remove,
    dismiss,
    restore,
    clearError,
  };
}