import {
  POSTER_BRAIN_LARGE_DISCOVERY_API_MANIFEST_CATALOG,
} from "./large-discovery-api-manifest-catalog.js";

import {
  createPosterBrainManifestDrivenOfficialApiProvidersFromRuntimeEnv,
  type PosterBrainManifestDrivenOfficialApiRuntime,
} from "./official-api-manifest-runtime.service.js";

import type {
  PosterBrainOfficialApiHttpFetch,
} from "./official-content-api-http.js";

export interface PosterBrainLargeDiscoveryApiRuntimeDependencies {
  readonly environment?:
    Readonly<
      Record<
        string,
        string | undefined
      >
    >;

  readonly fetchImplementation?:
    PosterBrainOfficialApiHttpFetch;
}

export function createPosterBrainLargeDiscoveryApiProvidersFromRuntimeEnv(
  dependencies:
    PosterBrainLargeDiscoveryApiRuntimeDependencies = {}
): PosterBrainManifestDrivenOfficialApiRuntime {
  return createPosterBrainManifestDrivenOfficialApiProvidersFromRuntimeEnv({
    manifests:
      POSTER_BRAIN_LARGE_DISCOVERY_API_MANIFEST_CATALOG,

    ...(dependencies.environment === undefined
      ? {}
      : {
          environment:
            dependencies.environment,
        }),

    ...(dependencies.fetchImplementation === undefined
      ? {}
      : {
          fetchImplementation:
            dependencies.fetchImplementation,
        }),
  });
}