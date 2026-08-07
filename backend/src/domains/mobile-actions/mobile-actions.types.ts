export type MobileArticleInteractionType =
  | "worth_reading"
  | "helpful";

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

export interface MobileUserBookmarkRecord {
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

export interface MobileUserInteractionState {
  bookmarkedIds:
    string[];

  recommendedIds:
    string[];

  helpfulIds:
    string[];
}

export interface SaveMobileUserBookmarkInput {
  userId:
    string;

  contentId:
    string;

  articleSnapshot?:
    MobileActionArticleSnapshot |
    null;
}

export interface RemoveMobileUserBookmarkInput {
  userId:
    string;

  contentId:
    string;
}

export interface SaveMobileArticleInteractionInput {
  userId:
    string;

  contentId:
    string;

  interactionType:
    MobileArticleInteractionType;
}

export interface SaveMobileArticleFeedbackInput {
  userId:
    string;

  contentId:
    string;

  reasonId:
    string;
}

export interface SaveMobileArticleInteractionResult {
  interactionType:
    MobileArticleInteractionType;

  created:
    boolean;
}

export interface SaveMobileArticleFeedbackResult {
  success:
    true;

  duplicate:
    boolean;
}

export interface MobileUserActionsRepository {
  listBookmarks(
    userId:
      string
  ): Promise<MobileUserBookmarkRecord[]>;

  listInteractionState(
    userId:
      string
  ): Promise<MobileUserInteractionState>;

  findActiveBookmark(
    input:
      RemoveMobileUserBookmarkInput
  ): Promise<MobileUserBookmarkRecord | null>;

  saveBookmark(
    input:
      SaveMobileUserBookmarkInput
  ): Promise<MobileUserBookmarkRecord>;

  removeBookmark(
    input:
      RemoveMobileUserBookmarkInput
  ): Promise<boolean>;

  saveInteraction(
    input:
      SaveMobileArticleInteractionInput
  ): Promise<SaveMobileArticleInteractionResult>;

  saveFeedback(
    input:
      SaveMobileArticleFeedbackInput
  ): Promise<SaveMobileArticleFeedbackResult>;
}
