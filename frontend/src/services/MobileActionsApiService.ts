import AuthService, {
  AuthenticationApiError,
} from "./AuthService";

import {
  Article,
} from "../types/article";

declare const process: {
  env?: {
    EXPO_PUBLIC_POSTER_API_BASE_URL?: string;
  };
};

const DEFAULT_POSTER_API_BASE_URL =
  "http://localhost:4000";

const API_VERSION_PREFIX =
  "/api/v1";

const AUTHENTICATION_REQUIRED_CODE =
  "AUTHENTICATION_REQUIRED";

export interface MobileActionArticleSnapshot {
  title:
    string;

  summary:
    string;

  publisher:
    string;

  publisherUrl:
    string;

  image:
    string;

  publishedAt:
    string;

  discoveredAt:
    string;

  category:
    string;

  originalUrl:
    string;

  verified:
    boolean;
}

export interface MobileActionBookmarkRecord {
  id:
    string;

  userId:
    string;

  contentId:
    string;

  articleSnapshot:
    MobileActionArticleSnapshot |
    null;

  createdAt:
    string;
}

export interface MobileActionBookmarksResponse {
  bookmarks:
    MobileActionBookmarkRecord[];
}

export interface MobileActionInteractionState {
  bookmarkedIds:
    string[];

  recommendedIds:
    string[];

  helpfulIds:
    string[];
}

export interface MobileActionToggleBookmarkResult {
  contentId:
    string;

  bookmarked:
    boolean;
}

export interface MobileActionInteractionResult {
  interactionType:
    "worth_reading" |
    "helpful";

  created:
    boolean;
}

export interface MobileActionFeedbackResult {
  success:
    boolean;

  duplicate:
    boolean;
}

function normalizeApiBaseUrl(
  value:
    string |
    undefined
): string {
  const normalized =
    (value ?? DEFAULT_POSTER_API_BASE_URL)
      .trim()
      .replace(/\/+$/, "");

  return normalized ||
    DEFAULT_POSTER_API_BASE_URL;
}

function buildMobileActionsUrl(
  path:
    string
): string {
  const baseUrl =
    normalizeApiBaseUrl(
      process.env
        ?.EXPO_PUBLIC_POSTER_API_BASE_URL
    );

  const normalizedPath =
    path.startsWith("/")
      ? path
      : `/${path}`;

  return `${baseUrl}${API_VERSION_PREFIX}/mobile/actions${normalizedPath}`;
}

function isRecord(
  value:
    unknown
): value is Record<string, unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}

function getRecordString(
  record:
    Record<string, unknown>,
  key:
    string
): string | null {
  const value =
    record[key];

  return typeof value === "string"
    ? value
    : null;
}

function getErrorMessageFromBody(
  body:
    unknown
): {
  message:
    string |
    null;

  code:
    string |
    null;
} {
  if (!isRecord(body)) {
    return {
      message:
        null,

      code:
        null,
    };
  }

  const directMessage =
    getRecordString(
      body,
      "message"
    );

  const directCode =
    getRecordString(
      body,
      "code"
    );

  if (
    directMessage ||
    directCode
  ) {
    return {
      message:
        directMessage,

      code:
        directCode,
    };
  }

  const error =
    body.error;

  if (
    isRecord(error)
  ) {
    return {
      message:
        getRecordString(
          error,
          "message"
        ),

      code:
        getRecordString(
          error,
          "code"
        ),
    };
  }

  return {
    message:
      null,

    code:
      null,
  };
}

async function readJsonResponse(
  response:
    Response
): Promise<unknown> {
  const text =
    await response.text();

  if (!text) {
    return null;
  }

  try {
    return JSON.parse(
      text
    ) as unknown;
  } catch {
    return text;
  }
}

function assertStringArray(
  value:
    unknown,
  label:
    string
): string[] {
  if (!Array.isArray(value)) {
    throw new Error(
      `${label} must be an array.`
    );
  }

  return value.filter(
    (item): item is string =>
      typeof item === "string" &&
      item.trim().length > 0
  );
}

function parseArticleSnapshot(
  value:
    unknown
): MobileActionArticleSnapshot | null {
  if (!isRecord(value)) {
    return null;
  }

  const title =
    getRecordString(
      value,
      "title"
    );

  const summary =
    getRecordString(
      value,
      "summary"
    );

  const publisher =
    getRecordString(
      value,
      "publisher"
    );

  const publisherUrl =
    getRecordString(
      value,
      "publisherUrl"
    );

  const image =
    getRecordString(
      value,
      "image"
    );

  const publishedAt =
    getRecordString(
      value,
      "publishedAt"
    );

  const discoveredAt =
    getRecordString(
      value,
      "discoveredAt"
    );

  const category =
    getRecordString(
      value,
      "category"
    );

  const originalUrl =
    getRecordString(
      value,
      "originalUrl"
    );

  const verified =
    value.verified;

  if (
    !title ||
    summary === null ||
    !publisher ||
    publisherUrl === null ||
    image === null ||
    !publishedAt ||
    !discoveredAt ||
    !category ||
    !originalUrl ||
    typeof verified !== "boolean"
  ) {
    return null;
  }

  return {
    title,
    summary,
    publisher,
    publisherUrl,
    image,
    publishedAt,
    discoveredAt,
    category,
    originalUrl,
    verified,
  };
}

function parseBookmarkRecord(
  value:
    unknown
): MobileActionBookmarkRecord {
  if (!isRecord(value)) {
    throw new Error(
      "Bookmark record is invalid."
    );
  }

  const id =
    getRecordString(
      value,
      "id"
    );

  const userId =
    getRecordString(
      value,
      "userId"
    );

  const contentId =
    getRecordString(
      value,
      "contentId"
    );

  const createdAt =
    getRecordString(
      value,
      "createdAt"
    );

  if (
    !id ||
    !userId ||
    !contentId ||
    !createdAt
  ) {
    throw new Error(
      "Bookmark record contract is incomplete."
    );
  }

  return {
    id,
    userId,
    contentId,

    articleSnapshot:
      parseArticleSnapshot(
        value.articleSnapshot
      ),

    createdAt,
  };
}

function parseBookmarksResponse(
  value:
    unknown
): MobileActionBookmarksResponse {
  if (
    !isRecord(value) ||
    !Array.isArray(value.bookmarks)
  ) {
    throw new Error(
      "Bookmarks response contract is incomplete."
    );
  }

  return {
    bookmarks:
      value.bookmarks.map(
        parseBookmarkRecord
      ),
  };
}

function parseInteractionState(
  value:
    unknown
): MobileActionInteractionState {
  if (!isRecord(value)) {
    throw new Error(
      "Interaction state response is invalid."
    );
  }

  return {
    bookmarkedIds:
      assertStringArray(
        value.bookmarkedIds,
        "bookmarkedIds"
      ),

    recommendedIds:
      assertStringArray(
        value.recommendedIds,
        "recommendedIds"
      ),

    helpfulIds:
      assertStringArray(
        value.helpfulIds,
        "helpfulIds"
      ),
  };
}

function parseToggleBookmarkResult(
  value:
    unknown
): MobileActionToggleBookmarkResult {
  if (!isRecord(value)) {
    throw new Error(
      "Bookmark toggle response is invalid."
    );
  }

  const contentId =
    getRecordString(
      value,
      "contentId"
    );

  if (
    !contentId ||
    typeof value.bookmarked !== "boolean"
  ) {
    throw new Error(
      "Bookmark toggle response contract is incomplete."
    );
  }

  return {
    contentId,

    bookmarked:
      value.bookmarked,
  };
}

function parseInteractionResult(
  value:
    unknown
): MobileActionInteractionResult {
  if (!isRecord(value)) {
    throw new Error(
      "Interaction response is invalid."
    );
  }

  const interactionType =
    value.interactionType;

  if (
    (
      interactionType !== "worth_reading" &&
      interactionType !== "helpful"
    ) ||
    typeof value.created !== "boolean"
  ) {
    throw new Error(
      "Interaction response contract is incomplete."
    );
  }

  return {
    interactionType,

    created:
      value.created,
  };
}

function parseFeedbackResult(
  value:
    unknown
): MobileActionFeedbackResult {
  if (!isRecord(value)) {
    throw new Error(
      "Feedback response is invalid."
    );
  }

  if (
    typeof value.success !== "boolean" ||
    typeof value.duplicate !== "boolean"
  ) {
    throw new Error(
      "Feedback response contract is incomplete."
    );
  }

  return {
    success:
      value.success,

    duplicate:
      value.duplicate,
  };
}

async function requestMobileActionsJson<TResponse>(
  path:
    string,
  options:
    {
      method:
        "GET" |
        "POST";

      body?:
        Record<string, unknown>;
    },
  parse:
    (
      value:
        unknown
    ) => TResponse
): Promise<TResponse> {
  const accessToken =
    await AuthService.getAccessToken();

  const normalizedAccessToken =
    accessToken?.trim() ?? "";

  if (!normalizedAccessToken) {
    throw new AuthenticationApiError(
      "Sign in again to sync Poster actions.",
      401,
      AUTHENTICATION_REQUIRED_CODE
    );
  }

  const response =
    await fetch(
      buildMobileActionsUrl(
        path
      ),
      {
        method:
          options.method,

        headers: {
          Accept:
            "application/json",

          ...(options.body
            ? {
                "Content-Type":
                  "application/json",
              }
            : {}),

          Authorization:
            `Bearer ${normalizedAccessToken}`,
        },

        credentials:
          "include",

        ...(options.body
          ? {
              body:
                JSON.stringify(
                  options.body
                ),
            }
          : {}),
      }
    );

  const responseBody =
    await readJsonResponse(
      response
    );

  if (!response.ok) {
    const errorDetails =
      getErrorMessageFromBody(
        responseBody
      );

    throw new AuthenticationApiError(
      errorDetails.message ??
        "Poster could not sync your action. Please try again.",
      response.status,
      errorDetails.code
    );
  }

  return parse(
    responseBody
  );
}

export default class MobileActionsApiService {
  static buildArticleSnapshot(
    article:
      Article
  ): MobileActionArticleSnapshot {
    return {
      title:
        article.title,

      summary:
        article.summary,

      publisher:
        article.publisher,

      publisherUrl:
        article.publisherUrl,

      image:
        article.image,

      publishedAt:
        article.publishedAt,

      discoveredAt:
        article.discoveredAt,

      category:
        article.category,

      originalUrl:
        article.originalUrl,

      verified:
        article.verified,
    };
  }

  static mapBookmarkRecordToArticle(
    bookmark:
      MobileActionBookmarkRecord
  ): Article | null {
    const snapshot =
      bookmark.articleSnapshot;

    if (!snapshot) {
      return null;
    }

    return {
      id:
        bookmark.contentId,

      title:
        snapshot.title,

      summary:
        snapshot.summary,

      publisher:
        snapshot.publisher,

      publisherUrl:
        snapshot.publisherUrl,

      image:
        snapshot.image,

      publishedAt:
        snapshot.publishedAt,

      discoveredAt:
        snapshot.discoveredAt,

      category:
        snapshot.category,

      originalUrl:
        snapshot.originalUrl,

      verified:
        snapshot.verified,
    };
  }

  static async listBookmarks():
    Promise<MobileActionBookmarkRecord[]> {
    const response =
      await requestMobileActionsJson(
        "/bookmarks",
        {
          method:
            "GET",
        },
        parseBookmarksResponse
      );

    return response.bookmarks;
  }

  static async getInteractionState():
    Promise<MobileActionInteractionState> {
    return requestMobileActionsJson(
      "/state",
      {
        method:
          "GET",
      },
      parseInteractionState
    );
  }

  static async toggleBookmark(
    article:
      Article
  ): Promise<MobileActionToggleBookmarkResult> {
    return requestMobileActionsJson(
      "/bookmarks/toggle",
      {
        method:
          "POST",

        body: {
          contentId:
            article.id,

          articleSnapshot:
            MobileActionsApiService
              .buildArticleSnapshot(
                article
              ),
        },
      },
      parseToggleBookmarkResult
    );
  }

  static async markWorthReading(
    contentId:
      string
  ): Promise<MobileActionInteractionResult> {
    return requestMobileActionsJson(
      "/worth-reading",
      {
        method:
          "POST",

        body: {
          contentId,
        },
      },
      parseInteractionResult
    );
  }

  static async markHelpful(
    contentId:
      string
  ): Promise<MobileActionInteractionResult> {
    return requestMobileActionsJson(
      "/helpful",
      {
        method:
          "POST",

        body: {
          contentId,
        },
      },
      parseInteractionResult
    );
  }

  static async submitFeedback(
    contentId:
      string,
    reasonId:
      string
  ): Promise<MobileActionFeedbackResult> {
    return requestMobileActionsJson(
      "/feedback",
      {
        method:
          "POST",

        body: {
          contentId,
          reasonId,
        },
      },
      parseFeedbackResult
    );
  }
}
