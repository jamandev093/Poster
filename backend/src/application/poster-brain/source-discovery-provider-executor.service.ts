import {
  createPosterBrainContentApiProviderRegistryService,
} from "./content-api-provider-registry.service.js";

import {
  createPosterBrainLargeDiscoveryApiProvidersFromRuntimeEnv,
} from "./large-discovery-api-runtime.service.js";

import type {
  PosterBrainOfficialApiHttpFetch,
} from "./official-content-api-http.js";

import type {
  PosterBrainSourceDiscoveryProviderExecutor,
} from "./source-discovery.types.js";

export interface PosterBrainSourceDiscoveryProviderExecutorDependencies {
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

export function createPosterBrainSourceDiscoveryProviderExecutor(
  dependencies:
    PosterBrainSourceDiscoveryProviderExecutorDependencies = {}
): PosterBrainSourceDiscoveryProviderExecutor {
  const environment =
    dependencies.environment ??
    process.env;

  const runtime =
    createPosterBrainLargeDiscoveryApiProvidersFromRuntimeEnv({
      environment,

      ...(dependencies.fetchImplementation === undefined
        ? {}
        : {
            fetchImplementation:
              dependencies.fetchImplementation,
          }),
    });

  const registry =
    createPosterBrainContentApiProviderRegistryService({
      providers:
        runtime.providers,

      environment,
    });

  return {
    providerKeys:
      runtime.providers.map(
        provider =>
          provider.providerKey
      ),

    async execute(
      input
    ) {
      const result =
        await registry.execute({
          providerKey:
            input.providerKey,

          query:
            input.query,

          pageSize:
            input.pageSize,

          ...(input.cursor === undefined
            ? {}
            : {
                cursor:
                  input.cursor,
              }),
        });

      if (
        result.status !==
        "succeeded"
      ) {
        return {
          status:
            result.status,

          items:
            [],

          nextCursor:
            null,
        };
      }

      return {
        status:
          "succeeded",

        items:
          result.items.map(
            item => ({
              externalContentId:
                item.externalContentId,

              originalUrl:
                item.originalUrl,

              publisherName:
                item.publisherName,

              sourceExternalId:
                item.sourceExternalId,

              sourceName:
                item.sourceName,
            })
          ),

        nextCursor:
          result.nextCursor,
      };
    },
  };
}