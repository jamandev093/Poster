"use client";

import {
  useCallback,
} from "react";

import {
  useAuthoritativeAction,
} from "../content-sources/use-authoritative-action";

import {
  removeAdminContent,
  restoreAdminContent,
} from "./content-api.service";

import type {
  AdminContentDetailsResponse,
  RemoveAdminContentRequest,
} from "./content-api.types";

interface UseContentActionsOptions {
  onCompleted:
    (
      details:
        AdminContentDetailsResponse
    ) => void;
}

export function useContentActions(
  options:
    UseContentActionsOptions
) {
  const action =
    useAuthoritativeAction();

  const remove =
    useCallback(
      async (
        contentId: string,
        input:
          RemoveAdminContentRequest
      ) => {
        const result =
          await action.run(
            signal =>
              removeAdminContent(
                contentId,
                input,
                signal
              )
          );

        if (
          result
        ) {
          options.onCompleted(
            result
          );
        }

        return result;
      },
      [
        action,
        options,
      ]
    );

  const restore =
    useCallback(
      async (
        contentId: string,
        expectedRowVersion: string
      ) => {
        const result =
          await action.run(
            signal =>
              restoreAdminContent(
                contentId,
                {
                  expectedRowVersion,
                },
                signal
              )
          );

        if (
          result
        ) {
          options.onCompleted(
            result
          );
        }

        return result;
      },
      [
        action,
        options,
      ]
    );

  return {
    error:
      action.error,

    isRunning:
      action.isRunning,

    clearError:
      action.clearError,

    remove,
    restore,
  };
}