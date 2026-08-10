import type {
  PosterBrainContentApiProvider,
} from "./content-api-provider.types.js";

import type {
  PosterBrainOfficialApiHttpFetch,
} from "./official-content-api-http.js";

import {
  createPosterBrainManifestDrivenOfficialApiProvidersFromRuntimeEnv,
} from "./official-api-manifest-runtime.service.js";

import {
  createPosterBrainFacebookPagesContentApiProvider,
} from "./facebook-pages-content-api.provider.js";

import {
  createPosterBrainGuardianContentApiProvider,
} from "./guardian-content-api.provider.js";

import {
  createPosterBrainNasaImagesContentApiProvider,
} from "./nasa-images-content-api.provider.js";

import {
  createPosterBrainPubMedContentApiProvider,
} from "./pubmed-content-api.provider.js";

import {
  createPosterBrainSmithsonianContentApiProvider,
} from "./smithsonian-content-api.provider.js";

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

  const fetchImplementation =
    dependencies.fetchImplementation;

  const youtubeKey =
    environment.YOUTUBE_API_KEY?.trim() ??
    "";

  const xBearerToken =
    environment.X_BEARER_TOKEN?.trim() ??
    "";

  const metaAccessToken =
    environment.META_GRAPH_ACCESS_TOKEN?.trim() ??
    "";

  const metaGraphVersion =
    environment.META_GRAPH_API_VERSION?.trim() ||
    "v26.0";

  const guardianKey =
    environment.GUARDIAN_API_KEY?.trim() ??
    "";

  const ncbiEmail =
    environment.NCBI_EUTILS_EMAIL?.trim() ??
    "";

  const ncbiApiKey =
    environment.NCBI_EUTILS_API_KEY?.trim() ??
    "";

  const smithsonianKey =
    environment.SMITHSONIAN_API_KEY?.trim() ??
    "";

  const youtube =
    createPosterBrainYouTubeContentApiProvider({
      apiKey:
        youtubeKey,

      ...(fetchImplementation === undefined
        ? {}
        : {
            fetchImplementation,
          }),
    });

  const nasa =
    createPosterBrainNasaImagesContentApiProvider(
      fetchImplementation === undefined
        ? {}
        : {
            fetchImplementation,
          }
    );

  const x =
    createPosterBrainXContentApiProvider({
      bearerToken:
        xBearerToken,

      ...(fetchImplementation === undefined
        ? {}
        : {
            fetchImplementation,
          }),
    });

  const facebook =
    createPosterBrainFacebookPagesContentApiProvider({
      accessToken:
        metaAccessToken,

      apiVersion:
        metaGraphVersion,

      ...(fetchImplementation === undefined
        ? {}
        : {
            fetchImplementation,
          }),
    });

  const guardian =
    createPosterBrainGuardianContentApiProvider({
      apiKey:
        guardianKey,

      ...(fetchImplementation === undefined
        ? {}
        : {
            fetchImplementation,
          }),
    });

  const pubmed =
    createPosterBrainPubMedContentApiProvider({
      developerEmail:
        ncbiEmail,

      ...(ncbiApiKey
        ? {
            apiKey:
              ncbiApiKey,
          }
        : {}),

      ...(fetchImplementation === undefined
        ? {}
        : {
            fetchImplementation,
          }),
    });

  const smithsonian =
    createPosterBrainSmithsonianContentApiProvider({
      apiKey:
        smithsonianKey,

      ...(fetchImplementation === undefined
        ? {}
        : {
            fetchImplementation,
          }),
    });

  const manifestDriven =
    createPosterBrainManifestDrivenOfficialApiProvidersFromRuntimeEnv({
      environment,

      ...(fetchImplementation === undefined
        ? {}
        : {
            fetchImplementation,
          }),
    });

  return [
    youtube,
    nasa,
    x,
    facebook,
    guardian,
    pubmed,
    smithsonian,
    ...manifestDriven.providers,
  ];
}