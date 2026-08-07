import {
  Share,
} from "react-native";

import type {
  Article,
} from "../types/article";

import MobileActionsApiService from "./MobileActionsApiService";

import type {
  MobileActionEngagementMetadata,
} from "./MobileActionsApiService";

export interface ArticleShareResult {
  shared:
    boolean;

  dismissed:
    boolean;

  activityType?:
    string;

  backendEventRecorded?:
    boolean;
}

export interface ArticleShareOptions {
  article?:
    Article;

  surface?:
    string;

  shareTarget?:
    string |
    null;

  metadata?:
    MobileActionEngagementMetadata;
}

function normalizeTitle(
  value:
    string
): string {
  return value
    .trim()
    .replace(/\s+/g, " ");
}

function normalizeUrl(
  value:
    string
): string {
  return value.trim();
}

function isSupportedWebUrl(
  value:
    string
): boolean {
  try {
    const parsedUrl =
      new URL(
        value
      );

    return (
      parsedUrl.protocol ===
        "https:" ||
      parsedUrl.protocol ===
        "http:"
    );
  } catch {
    return false;
  }
}

function buildShareMetadata(
  options:
    ArticleShareOptions
): MobileActionEngagementMetadata {
  return {
    ...(options.metadata ?? {}),

    surface:
      options.surface ??
      options.metadata?.surface ??
      "unknown",
  };
}

export default class ShareService {
  /**
   * Opens the native device share sheet first. Backend
   * recording is best-effort and never blocks sharing.
   */
  static async article(
    title:
      string,
    url:
      string,
    options:
      ArticleShareOptions =
      {}
  ): Promise<ArticleShareResult> {
    const normalizedTitle =
      normalizeTitle(
        title
      );

    const normalizedUrl =
      normalizeUrl(
        url
      );

    if (!normalizedTitle) {
      throw new Error(
        "An article title is required for sharing."
      );
    }

    if (
      !isSupportedWebUrl(
        normalizedUrl
      )
    ) {
      throw new Error(
        "A valid publisher URL is required for sharing."
      );
    }

    const result =
      await Share.share({
        title:
          normalizedTitle,

        message:
          `${normalizedTitle}\n\n${normalizedUrl}`,

        url:
          normalizedUrl,
      });

    if (
      result.action ===
      Share.dismissedAction
    ) {
      return {
        shared:
          false,

        dismissed:
          true,
      };
    }

    const shared =
      result.action ===
      Share.sharedAction;

    let backendEventRecorded =
      false;

    if (
      shared &&
      options.article
    ) {
      try {
        await MobileActionsApiService
          .recordArticleShare(
            options.article,
            {
              shareTarget:
                options.shareTarget ??
                "system_share_sheet",

              activityType:
                result.activityType ??
                null,

              metadata:
                buildShareMetadata(
                  options
                ),
            }
          );

        backendEventRecorded =
          true;
      } catch {
        /*
         * Native sharing already succeeded. Backend
         * event recording is best-effort so users are
         * never shown a share failure because analytics
         * persistence is unavailable.
         */
      }
    }

    return {
      shared,

      dismissed:
        false,

      activityType:
        result.activityType ??
        undefined,

      backendEventRecorded,
    };
  }
}
