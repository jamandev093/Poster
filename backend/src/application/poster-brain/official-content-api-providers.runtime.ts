import type {
  PosterBrainContentApiProvider,
} from "./content-api-provider.types.js";

import type {
  PosterBrainOfficialApiHttpFetch,
} from "./official-content-api-http.js";

import {
  createPosterBrainFacebookPagesContentApiProvider,
} from "./facebook-pages-content-api.provider.js";

import {
  createPosterBrainNasaImagesContentApiProvider,
} from "./nasa-images-content-api.provider.js";

import {
  createPosterBrainXContentApiProvider,
} from "./x-content-api.provider.js";

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

  const xBearerToken =
    environment
      .X_BEARER_TOKEN
      ?.trim() ??
    "";

  const metaAccessToken =
    environment
      .META_GRAPH_ACCESS_TOKEN
      ?.trim() ??
    "";

  const metaGraphVersion =
    environment
      .META_GRAPH_API_VERSION
      ?.trim() ||
    "v26.0";

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

  const x =
    dependencies.fetchImplementation ===
    undefined
      ? createPosterBrainXContentApiProvider({
          bearerToken:
            xBearerToken,
        })
      : createPosterBrainXContentApiProvider({
          bearerToken:
            xBearerToken,

          fetchImplementation:
            dependencies.fetchImplementation,
        });

  const facebook =
    dependencies.fetchImplementation ===
    undefined
      ? createPosterBrainFacebookPagesContentApiProvider({
          accessToken:
            metaAccessToken,

          apiVersion:
            metaGraphVersion,
        })
      : createPosterBrainFacebookPagesContentApiProvider({
          accessToken:
            metaAccessToken,

          apiVersion:
            metaGraphVersion,

          fetchImplementation:
            dependencies.fetchImplementation,
        });

  return [
    youtube,
    nasa,
    x,
    facebook,
  ];
}