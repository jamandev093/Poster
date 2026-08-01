"use client";

import {
  useCallback,
} from "react";

import {
  useAuthoritativeList,
} from "../content-sources/use-authoritative-list";

import {
  fetchAdminSources,
} from "./source-api.service";

export function useAdminSources() {
  const load =
    useCallback(
      (
        signal:
          AbortSignal
      ) =>
        fetchAdminSources(
          signal
        ),
      []
    );

  return useAuthoritativeList(
    load
  );
}