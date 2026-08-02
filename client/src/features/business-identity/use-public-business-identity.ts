"use client";

import {
  useCallback,
  useEffect,
  useState,
} from "react";

import type {
  PublicBusinessIdentity,
} from "./public-business-identity.types";

import {
  getPublicBusinessIdentity,
} from "./public-business-identity.service";

interface PublicBusinessIdentityState {
  identity:
    PublicBusinessIdentity | null;

  isLoading:
    boolean;
}

export function usePublicBusinessIdentity() {
  const [
    state,
    setState,
  ] =
    useState<
      PublicBusinessIdentityState
    >({
      identity:
        null,

      isLoading:
        true,
    });

  const load =
    useCallback(
      async () => {
        const identity =
          await getPublicBusinessIdentity();

        setState({
          identity,

          isLoading:
            false,
        });
      },
      []
    );

  useEffect(
    () => {
      const timer =
        setTimeout(
          () => {
            void load();
          },
          0
        );

      return () =>
        clearTimeout(
          timer
        );
    },
    [
      load,
    ]
  );

  return state;
}