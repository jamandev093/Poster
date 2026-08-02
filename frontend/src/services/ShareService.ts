import {
  Share,
  ShareAction,
} from "react-native";

export interface ArticleShareResult {
  shared: boolean;

  dismissed: boolean;

  activityType?: string;
}

function normalizeTitle(
  value: string
): string {
  return value
    .trim()
    .replace(/\s+/g, " ");
}

function normalizeUrl(
  value: string
): string {
  return value.trim();
}

function isSupportedWebUrl(
  value: string
): boolean {
  try {
    const parsedUrl =
      new URL(value);

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

export default class ShareService {
  static async article(
    title: string,
    url: string
  ): Promise<ArticleShareResult> {
    const normalizedTitle =
      normalizeTitle(title);

    const normalizedUrl =
      normalizeUrl(url);

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
        shared: false,

        dismissed: true,
      };
    }

    return {
      shared:
        result.action ===
        Share.sharedAction,

      dismissed: false,

      activityType:
        result.activityType ??
        undefined,
    };
  }
}