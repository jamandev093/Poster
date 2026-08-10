import type {
  PosterBrainContentApiProviderContentKind,
} from "./content-api-provider.types.js";

export type PosterBrainOfficialApiManifestAuth =
  | {
      readonly type:
        "none";
    }
  | {
      readonly type:
        "api_key_query";

      readonly environmentKey:
        string;

      readonly parameterName:
        string;
    }
  | {
      readonly type:
        "api_key_header";

      readonly environmentKey:
        string;

      readonly headerName:
        string;
    }
  | {
      readonly type:
        "bearer";

      readonly environmentKey:
        string;

      readonly headerName?:
        string;
    };

export type PosterBrainOfficialApiManifestPagination =
  | {
      readonly type:
        "none";
    }
  | {
      readonly type:
        "cursor";

      readonly requestParameter:
        string;

      readonly responseNextCursorPath:
        string;

      readonly initialCursor?:
        string;
    }
  | {
      readonly type:
        "page";

      readonly requestParameter:
        string;

      readonly responseCurrentPagePath:
        string;

      readonly responseTotalPagesPath:
        string;
    }
  | {
      readonly type:
        "offset";

      readonly requestParameter:
        string;

      readonly responseTotalPath:
        string;
    }
  | {
      readonly type:
        "page_total_results";

      readonly requestParameter:
        string;

      readonly responseTotalPath:
        string;
    };

export type PosterBrainOfficialApiValueMapping =
  | {
      readonly path:
        string;
    }
  | {
      readonly literal:
        string;
    };

export interface PosterBrainOfficialApiManifestRequest {
  readonly baseUrl:
    string;

  readonly endpointPath:
    string;

  readonly fixedParameters?:
    Readonly<
      Record<
        string,
        string
      >
    >;

  readonly queryParameter?:
    string;

  readonly querySuffix?:
    string;

  readonly sourceParameter?:
    string;

  readonly languageParameter?:
    string;

  readonly languageValue?:
    string;

  readonly pageSizeParameter?:
    string;

  readonly pagination:
    PosterBrainOfficialApiManifestPagination;
}

export interface PosterBrainOfficialApiManifestResponse {
  readonly collectionPath:
    string;

  readonly contentKind:
    PosterBrainContentApiProviderContentKind;

  readonly id:
    PosterBrainOfficialApiValueMapping;

  readonly title:
    PosterBrainOfficialApiValueMapping;

  readonly excerpt?:
    PosterBrainOfficialApiValueMapping;

  readonly originalUrl:
    PosterBrainOfficialApiValueMapping;

  readonly thumbnailUrl?:
    PosterBrainOfficialApiValueMapping;

  readonly imageUrl?:
    PosterBrainOfficialApiValueMapping;

  readonly publisherName:
    PosterBrainOfficialApiValueMapping;

  readonly sourceExternalId?:
    PosterBrainOfficialApiValueMapping;

  readonly sourceName?:
    PosterBrainOfficialApiValueMapping;

  readonly sourceUrl?:
    PosterBrainOfficialApiValueMapping;

  readonly languageCode?:
    PosterBrainOfficialApiValueMapping;

  readonly regionCode?:
    PosterBrainOfficialApiValueMapping;

  readonly publishedAt?:
    PosterBrainOfficialApiValueMapping;

  readonly durationSeconds?:
    PosterBrainOfficialApiValueMapping;

  readonly tags?:
    PosterBrainOfficialApiValueMapping;

  readonly topics?:
    PosterBrainOfficialApiValueMapping;

  readonly metadata?:
    Readonly<
      Record<
        string,
        string
      >
    >;
}

export type PosterBrainOfficialApiRightsStatus =
  | "pending"
  | "approved"
  | "blocked";

export type PosterBrainOfficialApiCommercialUseStatus =
  | "pending"
  | "approved"
  | "restricted";

export type PosterBrainOfficialApiTechnicalStatus =
  | "pending"
  | "validated";

export interface PosterBrainOfficialApiManifestActivation {
  readonly enabled:
    boolean;

  readonly technicalStatus:
    PosterBrainOfficialApiTechnicalStatus;

  readonly rightsStatus:
    PosterBrainOfficialApiRightsStatus;

  readonly commercialUseStatus:
    PosterBrainOfficialApiCommercialUseStatus;
}

export interface PosterBrainOfficialApiProviderManifest {
  readonly providerKey:
    string;

  readonly providerClass?:
    "official" |
    "aggregator";

  readonly displayName:
    string;

  readonly operator:
    string;

  readonly maxPageSize:
    number;

  readonly auth:
    PosterBrainOfficialApiManifestAuth;

  readonly request:
    PosterBrainOfficialApiManifestRequest;

  readonly response:
    PosterBrainOfficialApiManifestResponse;

  readonly activation:
    PosterBrainOfficialApiManifestActivation;

  readonly policy: {
    readonly metadataOnly:
      true;

    readonly originalPublisherUrlRequired:
      true;

    readonly playbackAssetsAllowed:
      false;

    readonly downloadableMediaAllowed:
      false;

    readonly fullContentBodyAllowed:
      false;
  };
}