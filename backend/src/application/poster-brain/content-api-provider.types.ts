export type PosterBrainContentApiProviderClass =
  | "official"
  | "aggregator";

export type PosterBrainContentApiProviderContentKind =
  | "article"
  | "video"
  | "audio"
  | "image"
  | "document"
  | "other";

export type PosterBrainContentApiProviderHealth =
  | "healthy"
  | "degraded"
  | "disabled";

export interface PosterBrainContentApiProviderCapabilities {
  readonly metadataOnly: true;

  readonly providerClass:
    PosterBrainContentApiProviderClass;

  readonly supportedContentKinds:
    readonly PosterBrainContentApiProviderContentKind[];

  readonly requiredEnvironmentKeys:
    readonly string[];

  readonly supportsCursorPagination:
    boolean;

  readonly supportsQuotaMetadata:
    boolean;

  readonly maxPageSize:
    number;
}

export interface PosterBrainContentApiProviderQuota {
  readonly limit:
    number | null;

  readonly remaining:
    number | null;

  readonly resetAt:
    string | null;
}

export interface PosterBrainContentApiProviderItem {
  readonly externalContentId:
    string;

  readonly contentKind:
    PosterBrainContentApiProviderContentKind;

  readonly title:
    string;

  readonly excerpt:
    string;

  readonly originalUrl:
    string;

  readonly thumbnailUrl:
    string | null;

  readonly imageUrl:
    string | null;

  readonly publisherName:
    string;

  readonly sourceExternalId:
    string | null;

  readonly sourceName:
    string | null;

  readonly sourceUrl:
    string | null;

  readonly languageCode:
    string;

  readonly regionCode:
    string | null;

  readonly publishedAt:
    string | null;

  readonly durationSeconds:
    number | null;

  readonly tags:
    readonly string[];

  readonly topics:
    readonly string[];

  readonly metadata:
    Readonly<Record<string, unknown>>;
}

export interface PosterBrainContentApiProviderRequest {
  readonly query:
    string | null;

  readonly sourceExternalId:
    string | null;

  readonly cursor:
    string | null;

  readonly pageSize:
    number;

  readonly languageCode:
    "en";

  readonly regionCode:
    string | null;

  readonly signal:
    AbortSignal;
}

export interface PosterBrainContentApiProviderPage {
  readonly items:
    readonly PosterBrainContentApiProviderItem[];

  readonly nextCursor:
    string | null;

  readonly quota:
    PosterBrainContentApiProviderQuota | null;
}

export interface PosterBrainContentApiProvider {
  readonly providerKey:
    string;

  readonly displayName:
    string;

  readonly capabilities:
    PosterBrainContentApiProviderCapabilities;

  fetchPage(
    request:
      PosterBrainContentApiProviderRequest
  ): Promise<
    PosterBrainContentApiProviderPage
  >;
}

export type PosterBrainContentApiProviderExecutionStatus =
  | "succeeded"
  | "disabled"
  | "failed";

export interface PosterBrainContentApiProviderExecutionInput {
  readonly providerKey:
    string;

  readonly query?:
    string | null;

  readonly sourceExternalId?:
    string | null;

  readonly cursor?:
    string | null;

  readonly pageSize?:
    number;

  readonly languageCode?:
    string;

  readonly regionCode?:
    string | null;
}

export interface PosterBrainContentApiProviderExecutionResult {
  readonly providerKey:
    string;

  readonly status:
    PosterBrainContentApiProviderExecutionStatus;

  readonly health:
    PosterBrainContentApiProviderHealth;

  readonly reason:
    string | null;

  readonly attempts:
    number;

  readonly items:
    readonly PosterBrainContentApiProviderItem[];

  readonly droppedNonEnglishItems:
    number;

  readonly nextCursor:
    string | null;

  readonly quota:
    PosterBrainContentApiProviderQuota | null;
}