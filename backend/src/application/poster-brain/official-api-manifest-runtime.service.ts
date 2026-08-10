import type {
  PosterBrainContentApiProvider,
} from "./content-api-provider.types.js";

import {
  createPosterBrainGenericOfficialApiProvider,
} from "./official-api-generic.provider.js";

import {
  POSTER_BRAIN_MANIFEST_DRIVEN_OFFICIAL_API_CATALOG,
} from "./official-api-manifest-catalog.js";

import type {
  PosterBrainOfficialApiProviderManifest,
} from "./official-api-provider-manifest.types.js";

import {
  createPosterBrainOfficialApiManifestRegistry,
} from "./official-api-provider-manifest.registry.js";

import {
  evaluatePosterBrainOfficialApiProviderActivation,
  type PosterBrainOfficialApiActivationResult,
} from "./official-api-provider-activation.policy.js";

import type {
  PosterBrainOfficialApiHttpFetch,
} from "./official-content-api-http.js";

export interface PosterBrainManifestDrivenOfficialApiRuntimeEntry {
  readonly providerKey:
    string;

  readonly activation:
    PosterBrainOfficialApiActivationResult;

  readonly runtimeRegistered:
    boolean;
}

export interface PosterBrainManifestDrivenOfficialApiRuntime {
  readonly providers:
    readonly PosterBrainContentApiProvider[];

  readonly entries:
    readonly PosterBrainManifestDrivenOfficialApiRuntimeEntry[];
}

export interface PosterBrainManifestDrivenOfficialApiRuntimeDependencies {
  readonly manifests?:
    readonly PosterBrainOfficialApiProviderManifest[];

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

function mayRegister(
  activation:
    PosterBrainOfficialApiActivationResult
): boolean {
  return (
    activation.reason ===
      "active" ||
    activation.reason ===
      "missing_credentials"
  );
}

export function createPosterBrainManifestDrivenOfficialApiProvidersFromRuntimeEnv(
  dependencies:
    PosterBrainManifestDrivenOfficialApiRuntimeDependencies = {}
): PosterBrainManifestDrivenOfficialApiRuntime {
  const environment =
    dependencies.environment ??
    process.env;

  const registry =
    createPosterBrainOfficialApiManifestRegistry(
      dependencies.manifests ??
      POSTER_BRAIN_MANIFEST_DRIVEN_OFFICIAL_API_CATALOG
    );

  const providers:
    PosterBrainContentApiProvider[] =
    [];

  const entries:
    PosterBrainManifestDrivenOfficialApiRuntimeEntry[] =
    [];

  for (const manifest of registry.list()) {
    const activation =
      evaluatePosterBrainOfficialApiProviderActivation({
        manifest,
        environment,
      });

    const runtimeRegistered =
      mayRegister(
        activation
      );

    entries.push({
      providerKey:
        manifest.providerKey,

      activation,

      runtimeRegistered,
    });

    if (!runtimeRegistered) {
      continue;
    }

    providers.push(
      createPosterBrainGenericOfficialApiProvider({
        manifest,
        environment,

        ...(dependencies.fetchImplementation ===
        undefined
          ? {}
          : {
              fetchImplementation:
                dependencies.fetchImplementation,
            }),
      })
    );
  }

  return {
    providers,
    entries,
  };
}