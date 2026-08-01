"use client";

import {
  useCallback,
} from "react";

import {
  useAuthoritativeAction,
} from "../content-sources/use-authoritative-action";

import {
  blockAdminSource,
  enableAdminSource,
  pauseAdminSource,
  unblockAdminSource,
} from "./source-api.service";

import type {
  AdminSourceRecord,
} from "./source-api.types";

interface UseSourceActionsOptions {
  onCompleted:
    (
      source:
        AdminSourceRecord
    ) => void;
}

export function useSourceActions(
  options:
    UseSourceActionsOptions
) {
  const action =
    useAuthoritativeAction();

  const pause =
    useCallback(
      async (
        source:
          AdminSourceRecord
      ) => {
        const result =
          await action.run(
            signal =>
              pauseAdminSource(
                source.id,
                {
                  expectedRowVersion:
                    source.rowVersion,
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

  const enable =
    useCallback(
      async (
        source:
          AdminSourceRecord
      ) => {
        const result =
          await action.run(
            signal =>
              enableAdminSource(
                source.id,
                {
                  expectedRowVersion:
                    source.rowVersion,
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

  const unblock =
    useCallback(
      async (
        source:
          AdminSourceRecord
      ) => {
        const result =
          await action.run(
            signal =>
              unblockAdminSource(
                source.id,
                {
                  expectedRowVersion:
                    source.rowVersion,
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

  const block =
    useCallback(
      async (
        source:
          AdminSourceRecord,
        removeExistingContent:
          boolean
      ) => {
        const result =
          await action.run(
            signal =>
              blockAdminSource(
                source.id,
                {
                  expectedRowVersion:
                    source.rowVersion,

                  removeExistingContent,
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

    pause,
    enable,
    unblock,
    block,
  };
}