import {
  PosterBrainContentApiProviderError,
} from "./content-api-provider-registry.service.js";

import type {
  PosterBrainContentApiProvider,
  PosterBrainContentApiProviderItem,
} from "./content-api-provider.types.js";

import {
  readPosterBrainOfficialApiJsonArray,
  readPosterBrainOfficialApiJsonPath,
} from "./official-api-json-path.js";

import type {
  PosterBrainOfficialApiProviderManifest,
  PosterBrainOfficialApiValueMapping,
} from "./official-api-provider-manifest.types.js";

import {
  validatePosterBrainOfficialApiProviderManifest,
} from "./official-api-provider-manifest.registry.js";

import {
  fetchPosterBrainOfficialApiJson,
  type PosterBrainOfficialApiHttpFetch,
} from "./official-content-api-http.js";

export interface PosterBrainGenericOfficialApiProviderDependencies {
  readonly manifest:
    PosterBrainOfficialApiProviderManifest;

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

function text(
  value:
    unknown
): string | null {
  if (
    typeof value !==
    "string"
  ) {
    return null;
  }

  const cleaned =
    value
      .replace(
        /\s+/g,
        " "
      )
      .trim();

  return cleaned
    ? cleaned
    : null;
}

function bounded(
  value:
    string,
  maximum:
    number
): string {
  return value.length <= maximum
    ? value
    : value
        .slice(
          0,
          maximum
        )
        .trimEnd();
}

function mappedValue(
  item:
    unknown,

  mapping:
    PosterBrainOfficialApiValueMapping | undefined
): unknown {
  if (mapping === undefined) {
    return undefined;
  }

  if ("literal" in mapping) {
    return mapping.literal;
  }

  return readPosterBrainOfficialApiJsonPath(
    item,
    mapping.path
  );
}

function mappedText(
  item:
    unknown,

  mapping:
    PosterBrainOfficialApiValueMapping | undefined
): string | null {
  return text(
    mappedValue(
      item,
      mapping
    )
  );
}

function mappedNumber(
  item:
    unknown,

  mapping:
    PosterBrainOfficialApiValueMapping | undefined
): number | null {
  const value =
    mappedValue(
      item,
      mapping
    );

  if (
    typeof value ===
      "number" &&
    Number.isFinite(value)
  ) {
    return value;
  }

  if (
    typeof value ===
    "string" &&
    value.trim() &&
    Number.isFinite(
      Number(value)
    )
  ) {
    return Number(value);
  }

  return null;
}

function mappedStrings(
  item:
    unknown,

  mapping:
    PosterBrainOfficialApiValueMapping | undefined
): readonly string[] {
  const value =
    mappedValue(
      item,
      mapping
    );

  if (!Array.isArray(value)) {
    return [];
  }

  const output:
    string[] =
    [];

  const seen =
    new Set<string>();

  for (const raw of value) {
    const cleaned =
      text(raw);

    if (cleaned === null) {
      continue;
    }

    const key =
      cleaned.toLowerCase();

    if (seen.has(key)) {
      continue;
    }

    seen.add(key);

    output.push(
      cleaned
    );
  }

  return output;
}

function primitiveMetadata(
  item:
    unknown,

  mappings:
    Readonly<
      Record<
        string,
        string
      >
    > | undefined
): Readonly<
  Record<
    string,
    unknown
  >
> {
  const output:
    Record<
      string,
      unknown
    > =
    {};

  for (
    const [
      key,
      path,
    ]
    of Object.entries(
      mappings ??
      {}
    )
  ) {
    const value =
      readPosterBrainOfficialApiJsonPath(
        item,
        path
      );

    if (
      value === null ||
      typeof value ===
        "string" ||
      typeof value ===
        "number" ||
      typeof value ===
        "boolean"
    ) {
      output[key] =
        value;
    }
  }

  return output;
}

function environmentCredential(
  manifest:
    PosterBrainOfficialApiProviderManifest,

  environment:
    Readonly<
      Record<
        string,
        string | undefined
      >
    >
): string {
  if (
    manifest.auth.type ===
    "none"
  ) {
    return "";
  }

  return (
    environment[
      manifest.auth
        .environmentKey
    ]?.trim() ??
    ""
  );
}

function requiredEnvironmentKeys(
  manifest:
    PosterBrainOfficialApiProviderManifest
): readonly string[] {
  return manifest.auth.type ===
    "none"
    ? []
    : [
        manifest.auth
          .environmentKey,
      ];
}

function nextCursor(
  input: {
    readonly payload:
      unknown;

    readonly rawItemCount:
      number;

    readonly currentCursor:
      string | null;

    readonly pageSize:
      number;

    readonly manifest:
      PosterBrainOfficialApiProviderManifest;
  }
): string | null {
  const pagination =
    input.manifest
      .request
      .pagination;

  if (
    pagination.type ===
    "none"
  ) {
    return null;
  }

  if (
    pagination.type ===
    "cursor"
  ) {
    return text(
      readPosterBrainOfficialApiJsonPath(
        input.payload,
        pagination
          .responseNextCursorPath
      )
    );
  }

  if (
    pagination.type ===
    "page"
  ) {
    const current =
      Number(
        readPosterBrainOfficialApiJsonPath(
          input.payload,
          pagination
            .responseCurrentPagePath
        )
      );

    const total =
      Number(
        readPosterBrainOfficialApiJsonPath(
          input.payload,
          pagination
            .responseTotalPagesPath
        )
      );

    if (
      !Number.isSafeInteger(
        current
      ) ||
      !Number.isSafeInteger(
        total
      ) ||
      current >= total
    ) {
      return null;
    }

    return String(
      current +
      1
    );
  }

  const total =
    Number(
      readPosterBrainOfficialApiJsonPath(
        input.payload,
        pagination
          .responseTotalPath
      )
    );

  if (!Number.isFinite(total)) {
    return null;
  }

  if (
    pagination.type ===
    "page_total_results"
  ) {
    const currentPage =
      input.currentCursor ===
        null
        ? 1
        : Number(
            input.currentCursor
          );

    if (
      !Number.isSafeInteger(
        currentPage
      ) ||
      currentPage < 1
    ) {
      return null;
    }

    const consumed =
      currentPage *
      input.pageSize;

    return consumed < total
      ? String(
          currentPage +
          1
        )
      : null;
  }

  const current =
    input.currentCursor ===
      null
      ? 0
      : Number(
          input.currentCursor
        );

  if (
    !Number.isSafeInteger(
      current
    ) ||
    current < 0
  ) {
    return null;
  }

  const candidate =
    current +
    input.rawItemCount;

  return candidate < total
    ? String(candidate)
    : null;
}

export function createPosterBrainGenericOfficialApiProvider(
  dependencies:
    PosterBrainGenericOfficialApiProviderDependencies
): PosterBrainContentApiProvider {
  const manifest =
    validatePosterBrainOfficialApiProviderManifest(
      dependencies.manifest
    );

  const environment =
    dependencies.environment ??
    process.env;

  return {
    providerKey:
      manifest.providerKey,

    displayName:
      manifest.displayName,

    capabilities: {
      metadataOnly:
        true,

      providerClass:
        manifest.providerClass ??
        "official",

      supportedContentKinds: [
        manifest.response
          .contentKind,
      ],

      requiredEnvironmentKeys:
        requiredEnvironmentKeys(
          manifest
        ),

      supportsCursorPagination:
        manifest.request
          .pagination
          .type !==
        "none",

      supportsQuotaMetadata:
        false,

      maxPageSize:
        manifest.maxPageSize,
    },

    async fetchPage(
      request
    ) {
      if (
        request.query ===
          null &&
        request.sourceExternalId ===
          null
      ) {
        throw new PosterBrainContentApiProviderError({
          code:
            "invalid_response",

          retryable:
            false,

          message:
            `Official API provider ${manifest.providerKey} requires a query or source.`,
        });
      }

      const url =
        new URL(
          manifest.request
            .endpointPath,
          manifest.request
            .baseUrl
        );

      for (
        const [
          key,
          value,
        ]
        of Object.entries(
          manifest.request
            .fixedParameters ??
          {}
        )
      ) {
        url.searchParams.set(
          key,
          value
        );
      }

      if (
        request.query !==
          null &&
        manifest.request
          .queryParameter !==
          undefined
      ) {
        url.searchParams.set(
          manifest.request
            .queryParameter,
          (
            request.query +
            (
              manifest.request
                .querySuffix ??
              ""
            )
          ).trim()
        );
      }

      if (
        request.sourceExternalId !==
          null &&
        manifest.request
          .sourceParameter !==
          undefined
      ) {
        url.searchParams.set(
          manifest.request
            .sourceParameter,
          request.sourceExternalId
        );
      }

      if (
        manifest.request
          .languageParameter !==
        undefined
      ) {
        url.searchParams.set(
          manifest.request
            .languageParameter,
          manifest.request
            .languageValue ??
          "en"
        );
      }

      if (
        manifest.request
          .pageSizeParameter !==
        undefined
      ) {
        url.searchParams.set(
          manifest.request
            .pageSizeParameter,
          String(
            Math.min(
              request.pageSize,
              manifest.maxPageSize
            )
          )
        );
      }

      const pagination =
        manifest.request
          .pagination;

      if (
        pagination.type !==
        "none"
      ) {
        const value =
          request.cursor ??
          (
            pagination.type ===
            "offset"
              ? "0"
              : (
                  pagination.type ===
                    "page" ||
                  pagination.type ===
                    "page_total_results"
                )
                ? "1"
                : pagination.type ===
                    "cursor"
                  ? (
                      pagination.initialCursor ??
                      null
                    )
                  : null
          );

        if (value !== null) {
          url.searchParams.set(
            pagination
              .requestParameter,
            value
          );
        }
      }

      const credential =
        environmentCredential(
          manifest,
          environment
        );

      const headers:
        Record<
          string,
          string
        > =
        {};

      if (
        manifest.auth.type ===
        "api_key_query"
      ) {
        url.searchParams.set(
          manifest.auth
            .parameterName,
          credential
        );
      }
      else if (
        manifest.auth.type ===
        "api_key_header"
      ) {
        headers[
          manifest.auth
            .headerName
        ] =
          credential;
      }
      else if (
        manifest.auth.type ===
        "bearer"
      ) {
        headers[
          manifest.auth
            .headerName ??
          "authorization"
        ] =
          `Bearer ${credential}`;
      }

      const payload =
        await fetchPosterBrainOfficialApiJson({
          url:
            url.toString(),

          signal:
            request.signal,

          ...(Object.keys(headers).length ===
          0
            ? {}
            : {
                headers,
              }),

          ...(dependencies.fetchImplementation ===
          undefined
            ? {}
            : {
                fetchImplementation:
                  dependencies.fetchImplementation,
              }),
        });

      const rawItems =
        readPosterBrainOfficialApiJsonArray(
          payload,
          manifest.response
            .collectionPath
        );

      if (rawItems === null) {
        throw new PosterBrainContentApiProviderError({
          code:
            "invalid_response",

          retryable:
            false,

          message:
            `Official API provider ${manifest.providerKey} returned an invalid collection.`,
        });
      }

      const items:
        PosterBrainContentApiProviderItem[] =
        [];

      for (const rawItem of rawItems) {
        const id =
          mappedText(
            rawItem,
            manifest.response.id
          );

        const title =
          mappedText(
            rawItem,
            manifest.response.title
          );

        const originalUrl =
          mappedText(
            rawItem,
            manifest.response
              .originalUrl
          );

        const publisherName =
          mappedText(
            rawItem,
            manifest.response
              .publisherName
          );

        if (
          id === null ||
          title === null ||
          originalUrl === null ||
          publisherName === null
        ) {
          continue;
        }

        const excerpt =
          mappedText(
            rawItem,
            manifest.response
              .excerpt
          );

        items.push({
          externalContentId:
            `${manifest.providerKey}:${id}`,

          contentKind:
            manifest.response
              .contentKind,

          title:
            bounded(
              title,
              300
            ),

          excerpt:
            excerpt === null
              ? ""
              : bounded(
                  excerpt,
                  500
                ),

          originalUrl,

          thumbnailUrl:
            mappedText(
              rawItem,
              manifest.response
                .thumbnailUrl
            ),

          imageUrl:
            mappedText(
              rawItem,
              manifest.response
                .imageUrl
            ),

          publisherName,

          sourceExternalId:
            mappedText(
              rawItem,
              manifest.response
                .sourceExternalId
            ),

          sourceName:
            mappedText(
              rawItem,
              manifest.response
                .sourceName
            ) ??
            publisherName,

          sourceUrl:
            mappedText(
              rawItem,
              manifest.response
                .sourceUrl
            ),

          languageCode:
            mappedText(
              rawItem,
              manifest.response
                .languageCode
            ) ??
            "und",

          regionCode:
            mappedText(
              rawItem,
              manifest.response
                .regionCode
            ) ??
            request.regionCode,

          publishedAt:
            mappedText(
              rawItem,
              manifest.response
                .publishedAt
            ),

          durationSeconds:
            mappedNumber(
              rawItem,
              manifest.response
                .durationSeconds
            ),

          tags:
            mappedStrings(
              rawItem,
              manifest.response
                .tags
            ),

          topics:
            mappedStrings(
              rawItem,
              manifest.response
                .topics
            ),

          metadata:
            primitiveMetadata(
              rawItem,
              manifest.response
                .metadata
            ),
        });
      }

      return {
        items,

        nextCursor:
          nextCursor({
            payload,

            rawItemCount:
              rawItems.length,

            currentCursor:
              request.cursor,

            pageSize:
              Math.min(
                request.pageSize,
                manifest.maxPageSize
              ),

            manifest,
          }),

        quota:
          null,
      };
    },
  };
}