import {
  DirectSponsoredCampaign,
  GoogleNativeAdPlaceholder,
  MonetizationPlacement,
  PosterAffiliatePromotion,
  PosterPromotion,
} from "../components/ads";

import { Article } from "../types/article";
import { FeedEntry } from "../types/feedEntry";

interface BuildFeedEntriesOptions {
  articles: Article[];

  placement:
    MonetizationPlacement;

  posterPromotion?: PosterPromotion;

  affiliatePromotion?:
    PosterAffiliatePromotion;

  directCampaign?:
    DirectSponsoredCampaign;

  googleAd?:
    GoogleNativeAdPlaceholder;

  organicItemsBeforeFirstMonetized?: number;

  organicItemsBetweenMonetized?: number;

  maximumMonetizedItems?: number;
}

function isEligibleForPlacement(
  itemPlacement:
    MonetizationPlacement,
  placement:
    MonetizationPlacement
): boolean {
  return itemPlacement === placement;
}

function createArticleEntry(
  article: Article
): FeedEntry {
  return {
    id: `article-${article.id}`,

    type: "article",

    article,
  };
}

function createUniqueArticles(
  articles: readonly Article[]
): Article[] {
  const seenArticleIds =
    new Set<string>();

  const uniqueArticles:
    Article[] = [];

  articles.forEach((article) => {
    const articleId =
      article.id.trim();

    if (
      !articleId ||
      seenArticleIds.has(
        articleId
      )
    ) {
      return;
    }

    seenArticleIds.add(
      articleId
    );

    uniqueArticles.push(
      article
    );
  });

  return uniqueArticles;
}

function createUniqueMonetizationQueue(
  entries: readonly FeedEntry[]
): FeedEntry[] {
  const seenEntryIds =
    new Set<string>();

  return entries.filter(
    (entry) => {
      if (
        seenEntryIds.has(
          entry.id
        )
      ) {
        return false;
      }

      seenEntryIds.add(
        entry.id
      );

      return true;
    }
  );
}

function normalizePositiveInteger(
  value: number,
  fallback: number
): number {
  if (
    !Number.isFinite(value)
  ) {
    return fallback;
  }

  return Math.max(
    1,
    Math.floor(value)
  );
}

function normalizeMaximum(
  value: number
): number {
  if (
    !Number.isFinite(value)
  ) {
    return 0;
  }

  return Math.max(
    0,
    Math.floor(value)
  );
}

export default function buildFeedEntries({
  articles,
  placement,
  posterPromotion,
  affiliatePromotion,
  directCampaign,
  googleAd,
  organicItemsBeforeFirstMonetized = 6,
  organicItemsBetweenMonetized = 6,
  maximumMonetizedItems = 2,
}: BuildFeedEntriesOptions): FeedEntry[] {
  const uniqueArticles =
    createUniqueArticles(
      articles
    );

  const monetizationCandidates:
    FeedEntry[] = [];

  if (
    directCampaign &&
    directCampaign.status ===
      "active" &&
    isEligibleForPlacement(
      directCampaign.placement,
      placement
    )
  ) {
    monetizationCandidates.push({
      id:
        `direct-${directCampaign.id}`,

      type:
        "direct_sponsorship",

      campaign:
        directCampaign,
    });
  }

  if (
    affiliatePromotion &&
    affiliatePromotion.status ===
      "active" &&
    isEligibleForPlacement(
      affiliatePromotion.placement,
      placement
    )
  ) {
    monetizationCandidates.push({
      id:
        `affiliate-${affiliatePromotion.id}`,

      type:
        "poster_affiliate",

      promotion:
        affiliatePromotion,
    });
  }

  if (
    googleAd &&
    googleAd.status !==
      "failed" &&
    googleAd.status !==
      "no_fill" &&
    isEligibleForPlacement(
      googleAd.placement,
      placement
    )
  ) {
    monetizationCandidates.push({
      id:
        `google-${googleAd.id}`,

      type:
        "google_native_ad",

      ad:
        googleAd,
    });
  }

  if (
    posterPromotion &&
    posterPromotion.status ===
      "active" &&
    isEligibleForPlacement(
      posterPromotion.placement,
      placement
    )
  ) {
    monetizationCandidates.push({
      id:
        `poster-${posterPromotion.id}`,

      type:
        "poster_promotion",

      promotion:
        posterPromotion,
    });
  }

  const monetizationQueue =
    createUniqueMonetizationQueue(
      monetizationCandidates
    );

  const firstInsertionAt =
    normalizePositiveInteger(
      organicItemsBeforeFirstMonetized,
      6
    );

  const insertionSpacing =
    normalizePositiveInteger(
      organicItemsBetweenMonetized,
      6
    );

  const maximumItems =
    normalizeMaximum(
      maximumMonetizedItems
    );

  if (
    uniqueArticles.length === 0 ||
    monetizationQueue.length === 0 ||
    maximumItems === 0
  ) {
    return uniqueArticles.map(
      createArticleEntry
    );
  }

  const result:
    FeedEntry[] = [];

  let organicCount = 0;

  let nextInsertionAt =
    firstInsertionAt;

  let monetizedCount = 0;

  for (
    const article of
    uniqueArticles
  ) {
    result.push(
      createArticleEntry(
        article
      )
    );

    organicCount += 1;

    const canInsert =
      organicCount >=
        nextInsertionAt &&
      monetizedCount <
        maximumItems &&
      monetizationQueue.length >
        0;

    if (!canInsert) {
      continue;
    }

    const nextMonetizedEntry =
      monetizationQueue.shift();

    if (!nextMonetizedEntry) {
      continue;
    }

    result.push(
      nextMonetizedEntry
    );

    monetizedCount += 1;

    nextInsertionAt =
      organicCount +
      insertionSpacing;
  }

  return result;
}