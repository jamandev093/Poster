import type {
  PosterBrainContentApiProvider,
} from "./content-api-provider.types.js";

import type {
  PosterBrainOfficialApiHttpFetch,
} from "./official-content-api-http.js";

import {
  createPosterBrainNasaImagesContentApiProvider,
} from "./nasa-images-content-api.provider.js";

import {
  createPosterBrainYouTubeContentApiProvider,
} from "./youtube-content-api.provider.js";

export interface PosterBrainOfficialContentApiProvidersRuntimeDependencies {
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

export function createPosterBrainOfficialContentApiProvidersFromRuntimeEnv(
  dependencies:
    PosterBrainOfficialContentApiProvidersRuntimeDependencies = {}
): readonly PosterBrainContentApiProvider[] {
  const environment =
    dependencies.environment ??
    process.env;

  const youtubeKey =
    environment
      .YOUTUBE_API_KEY
      ?.trim() ??
    "";

  const youtube =
    dependencies.fetchImplementation ===
    undefined
      ? createPosterBrainYouTubeContentApiProvider({
          apiKey:
            youtubeKey,
        })
      : createPosterBrainYouTubeContentApiProvider({
          apiKey:
            youtubeKey,

          fetchImplementation:
            dependencies.fetchImplementation,
        });

  const nasa =
    dependencies.fetchImplementation ===
    undefined
      ? createPosterBrainNasaImagesContentApiProvider()
      : createPosterBrainNasaImagesContentApiProvider({
          fetchImplementation:
            dependencies.fetchImplementation,
        });

  return [
    youtube,
    nasa,
  ];
}