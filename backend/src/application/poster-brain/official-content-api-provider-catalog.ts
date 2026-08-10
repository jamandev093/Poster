export type PosterBrainOfficialProviderAccessMode =
  | "public"
  | "credential"
  | "permission_review";

export type PosterBrainOfficialProviderDiscoveryMode =
  | "query"
  | "source"
  | "query_and_source";

export interface PosterBrainOfficialContentApiProviderCatalogEntry {
  readonly providerKey:
    string;

  readonly operator:
    string;

  readonly accessMode:
    PosterBrainOfficialProviderAccessMode;

  readonly discoveryMode:
    PosterBrainOfficialProviderDiscoveryMode;

  readonly metadataOnly:
    true;

  readonly originalPublisherUrlRequired:
    true;

  readonly playbackAssetsAllowed:
    false;

  readonly fullContentBodyAllowed:
    false;

  readonly requiredEnvironmentKeys:
    readonly string[];
}

export const POSTER_BRAIN_OFFICIAL_CONTENT_API_PROVIDER_CATALOG:
  readonly PosterBrainOfficialContentApiProviderCatalogEntry[] =
  [
    {
      providerKey:
        "youtube",

      operator:
        "Google / YouTube",

      accessMode:
        "credential",

      discoveryMode:
        "query_and_source",

      metadataOnly:
        true,

      originalPublisherUrlRequired:
        true,

      playbackAssetsAllowed:
        false,

      fullContentBodyAllowed:
        false,

      requiredEnvironmentKeys: [
        "YOUTUBE_API_KEY",
      ],
    },

    {
      providerKey:
        "nasa-images",

      operator:
        "NASA",

      accessMode:
        "public",

      discoveryMode:
        "query",

      metadataOnly:
        true,

      originalPublisherUrlRequired:
        true,

      playbackAssetsAllowed:
        false,

      fullContentBodyAllowed:
        false,

      requiredEnvironmentKeys:
        [],
    },

    {
      providerKey:
        "x",

      operator:
        "X",

      accessMode:
        "credential",

      discoveryMode:
        "query_and_source",

      metadataOnly:
        true,

      originalPublisherUrlRequired:
        true,

      playbackAssetsAllowed:
        false,

      fullContentBodyAllowed:
        false,

      requiredEnvironmentKeys: [
        "X_BEARER_TOKEN",
      ],
    },

    {
      providerKey:
        "facebook-pages",

      operator:
        "Meta / Facebook",

      accessMode:
        "permission_review",

      discoveryMode:
        "source",

      metadataOnly:
        true,

      originalPublisherUrlRequired:
        true,

      playbackAssetsAllowed:
        false,

      fullContentBodyAllowed:
        false,

      requiredEnvironmentKeys: [
        "META_GRAPH_ACCESS_TOKEN",
      ],
    },
  ];