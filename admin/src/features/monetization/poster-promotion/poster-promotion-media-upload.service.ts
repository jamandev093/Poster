export type PosterPromotionUploadMediaType =
  | "image"
  | "video";

export interface VerifiedPosterPromotionMedia {
  assetId:
    string;

  type:
    PosterPromotionUploadMediaType;

  fileName:
    string;

  mimeType:
    string;

  sizeBytes:
    number;
}

interface UploadSessionResponse {
  media: {
    assetId:
      string;

    type:
      PosterPromotionUploadMediaType;

    fileName:
      string;

    mimeType:
      string;

    sizeBytes:
      number;

    status:
      "pending_upload";

    rowVersion:
      string;
  };

  upload: {
    url:
      string;

    method:
      "PUT";

    expiresAt:
      string;

    requiredHeaders:
      Record<
        string,
        string
      >;
  };
}

interface VerifyResponse {
  status:
    "ready";

  media:
    VerifiedPosterPromotionMedia & {
      rowVersion:
        string;
    };
}

interface ApiErrorBody {
  error?: {
    message?:
      string;
  };
}

const MEDIA_API_PREFIX =
  "/api/v1/admin/monetization/poster-promotions/media";

async function createRequestError(
  response:
    Response,
  fallback:
    string
): Promise<Error> {
  try {
    const body =
      await response.json() as
        ApiErrorBody;

    return new Error(
      body.error?.message ??
      fallback
    );
  } catch {
    return new Error(
      fallback
    );
  }
}

async function createUploadSession(
  file:
    File,
  type:
    PosterPromotionUploadMediaType
): Promise<UploadSessionResponse> {
  const response =
    await fetch(
      `${MEDIA_API_PREFIX}/uploads`,
      {
        method:
          "POST",

        credentials:
          "include",

        cache:
          "no-store",

        headers: {
          accept:
            "application/json",

          "content-type":
            "application/json",
        },

        body:
          JSON.stringify({
            type,

            fileName:
              file.name,

            mimeType:
              file.type,

            sizeBytes:
              file.size,
          }),
      }
    );

  if (!response.ok) {
    throw await createRequestError(
      response,
      "Poster Promotion media upload could not be started."
    );
  }

  return await response.json() as
    UploadSessionResponse;
}

async function putFile(
  file:
    File,
  session:
    UploadSessionResponse
): Promise<void> {
  if (
    session.upload.method !==
    "PUT"
  ) {
    throw new Error(
      "Poster Promotion media returned an unsupported upload method."
    );
  }

  const response =
    await fetch(
      session.upload.url,
      {
        method:
          "PUT",

        credentials:
          "omit",

        headers:
          session.upload
            .requiredHeaders,

        body:
          file,
      }
    );

  if (!response.ok) {
    throw new Error(
      "Poster Promotion media could not be uploaded to storage."
    );
  }
}

async function verifyUpload(
  session:
    UploadSessionResponse
): Promise<
  VerifiedPosterPromotionMedia
> {
  const response =
    await fetch(
      `${MEDIA_API_PREFIX}/${encodeURIComponent(
        session.media.assetId
      )}/verify`,
      {
        method:
          "POST",

        credentials:
          "include",

        cache:
          "no-store",

        headers: {
          accept:
            "application/json",

          "content-type":
            "application/json",
        },

        body:
          JSON.stringify({
            expectedRowVersion:
              session.media
                .rowVersion,
          }),
      }
    );

  if (!response.ok) {
    throw await createRequestError(
      response,
      "Poster Promotion media upload could not be verified."
    );
  }

  const result =
    await response.json() as
      VerifyResponse;

  if (
    result.status !==
    "ready"
  ) {
    throw new Error(
      "Poster Promotion media did not become ready."
    );
  }

  return {
    assetId:
      result.media.assetId,

    type:
      result.media.type,

    fileName:
      result.media.fileName,

    mimeType:
      result.media.mimeType,

    sizeBytes:
      result.media.sizeBytes,
  };
}

export async function uploadPosterPromotionMedia(
  file:
    File,
  type:
    PosterPromotionUploadMediaType
): Promise<
  VerifiedPosterPromotionMedia
> {
  const session =
    await createUploadSession(
      file,
      type
    );

  await putFile(
    file,
    session
  );

  return await verifyUpload(
    session
  );
}