"use client";

import {
  useCallback,
} from "react";

import {
  useAuthoritativeList,
} from "../content-sources/use-authoritative-list";

import {
  fetchAdminContent,
} from "./content-api.service";

export function useAdminContent() {
  const load =
    useCallback(
      (
        signal:
          AbortSignal
      ) =>
        fetchAdminContent(
          signal
        ),
      []
    );

  return useAuthoritativeList(
    load
  );
}