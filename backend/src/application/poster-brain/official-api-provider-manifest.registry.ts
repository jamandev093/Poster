import type {
  PosterBrainOfficialApiProviderManifest,
  PosterBrainOfficialApiValueMapping,
} from "./official-api-provider-manifest.types.js";

const FORBIDDEN_CONTENT_PATH_MARKERS =
  [
    "audiourl",
    "bodytext",
    "captions",
    "contentbody",
    "dashurl",
    "downloadurl",
    "embedurl",
    "fullarticle",
    "fullcontent",
    "fulltext",
    "hlsurl",
    "manifesturl",
    "mediafile",
    "mediaurl",
    "playbackurl",
    "playerurl",
    "rawhtml",
    "streamurl",
    "transcript",
    "videourl",
  ];

function normalizeMarker(
  value:
    string
): string {
  return value
    .replace(
      /[^a-zA-Z0-9]/g,
      ""
    )
    .toLowerCase();
}

function assertSafePath(
  path:
    string,
  field:
    string
): void {
  const normalized =
    normalizeMarker(
      path
    );

  for (
    const marker
    of FORBIDDEN_CONTENT_PATH_MARKERS
  ) {
    if (
      normalized.includes(
        marker
      )
    ) {
      throw new Error(
        `Official API manifest ${field} attempts to map forbidden content: ${marker}`
      );
    }
  }
}

function assertMapping(
  mapping:
    PosterBrainOfficialApiValueMapping | undefined,
  field:
    string
): void {
  if (mapping === undefined) {
    return;
  }

  if ("path" in mapping) {
    if (!mapping.path.trim()) {
      throw new Error(
        `Official API manifest ${field} path cannot be empty.`
      );
    }

    assertSafePath(
      mapping.path,
      field
    );

    return;
  }

  if (!mapping.literal.trim()) {
    throw new Error(
      `Official API manifest ${field} literal cannot be empty.`
    );
  }
}

function assertEnvironmentKey(
  value:
    string
): void {
  if (
    !/^[A-Z][A-Z0-9_]*$/.test(
      value
    )
  ) {
    throw new Error(
      `Invalid official API environment key: ${value}`
    );
  }
}

export function validatePosterBrainOfficialApiProviderManifest(
  manifest:
    PosterBrainOfficialApiProviderManifest
): PosterBrainOfficialApiProviderManifest {
  if (
    !/^[a-z0-9][a-z0-9._-]*$/.test(
      manifest.providerKey
    )
  ) {
    throw new Error(
      "Official API manifest providerKey is invalid."
    );
  }

  if (!manifest.displayName.trim()) {
    throw new Error(
      "Official API manifest displayName is required."
    );
  }

  if (!manifest.operator.trim()) {
    throw new Error(
      "Official API manifest operator is required."
    );
  }

  if (
    !Number.isSafeInteger(
      manifest.maxPageSize
    ) ||
    manifest.maxPageSize <= 0 ||
    manifest.maxPageSize > 500
  ) {
    throw new Error(
      "Official API manifest maxPageSize is invalid."
    );
  }

  let baseUrl:
    URL;

  try {
    baseUrl =
      new URL(
        manifest.request.baseUrl
      );
  }
  catch {
    throw new Error(
      "Official API manifest baseUrl is invalid."
    );
  }

  if (
    baseUrl.protocol !==
    "https:"
  ) {
    throw new Error(
      "Official API manifests must use HTTPS."
    );
  }

  if (
    !manifest.request.endpointPath.startsWith(
      "/"
    )
  ) {
    throw new Error(
      "Official API manifest endpointPath must start with /."
    );
  }

  if (
    manifest.policy.metadataOnly !==
      true ||
    manifest.policy.originalPublisherUrlRequired !==
      true ||
    manifest.policy.playbackAssetsAllowed !==
      false ||
    manifest.policy.downloadableMediaAllowed !==
      false ||
    manifest.policy.fullContentBodyAllowed !==
      false
  ) {
    throw new Error(
      "Official API manifest violates Poster metadata-only policy."
    );
  }

  if (
    manifest.auth.type !==
    "none"
  ) {
    assertEnvironmentKey(
      manifest.auth.environmentKey
    );
  }

  assertSafePath(
    manifest.response.collectionPath,
    "collectionPath"
  );

  assertMapping(
    manifest.response.id,
    "id"
  );

  assertMapping(
    manifest.response.title,
    "title"
  );

  assertMapping(
    manifest.response.excerpt,
    "excerpt"
  );

  assertMapping(
    manifest.response.originalUrl,
    "originalUrl"
  );

  assertMapping(
    manifest.response.thumbnailUrl,
    "thumbnailUrl"
  );

  assertMapping(
    manifest.response.imageUrl,
    "imageUrl"
  );

  assertMapping(
    manifest.response.publisherName,
    "publisherName"
  );

  assertMapping(
    manifest.response.sourceExternalId,
    "sourceExternalId"
  );

  assertMapping(
    manifest.response.sourceName,
    "sourceName"
  );

  assertMapping(
    manifest.response.sourceUrl,
    "sourceUrl"
  );

  assertMapping(
    manifest.response.languageCode,
    "languageCode"
  );

  assertMapping(
    manifest.response.regionCode,
    "regionCode"
  );

  assertMapping(
    manifest.response.publishedAt,
    "publishedAt"
  );

  assertMapping(
    manifest.response.durationSeconds,
    "durationSeconds"
  );

  assertMapping(
    manifest.response.tags,
    "tags"
  );

  assertMapping(
    manifest.response.topics,
    "topics"
  );

  for (
    const [
      key,
      path,
    ]
    of Object.entries(
      manifest.response.metadata ??
      {}
    )
  ) {
    assertSafePath(
      key,
      `metadata.${key}`
    );

    assertSafePath(
      path,
      `metadata.${key}`
    );
  }

  return manifest;
}

export interface PosterBrainOfficialApiManifestRegistry {
  list():
    readonly PosterBrainOfficialApiProviderManifest[];

  get(
    providerKey:
      string
  ):
    PosterBrainOfficialApiProviderManifest |
    null;
}

export function createPosterBrainOfficialApiManifestRegistry(
  manifests:
    readonly PosterBrainOfficialApiProviderManifest[]
): PosterBrainOfficialApiManifestRegistry {
  const byKey =
    new Map<
      string,
      PosterBrainOfficialApiProviderManifest
    >();

  for (const manifest of manifests) {
    const validated =
      validatePosterBrainOfficialApiProviderManifest(
        manifest
      );

    if (
      byKey.has(
        validated.providerKey
      )
    ) {
      throw new Error(
        `Duplicate official API manifest: ${validated.providerKey}`
      );
    }

    byKey.set(
      validated.providerKey,
      validated
    );
  }

  return {
    list() {
      return [
        ...byKey.values(),
      ];
    },

    get(
      providerKey
    ) {
      return (
        byKey.get(
          providerKey
            .trim()
            .toLowerCase()
        ) ??
        null
      );
    },
  };
}