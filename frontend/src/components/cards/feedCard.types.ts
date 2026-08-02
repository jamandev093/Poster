import {
  Article,
} from "../../types/article";

import {
  FeedbackReason,
} from "./feedback/feedbackReasons";

export type FeedItem = Article & {
  sponsored?: boolean;

  recommended?: boolean;

  helpful?: boolean;

  bookmarked?: boolean;
};

export interface FeedCardProps {
  article: FeedItem;

  onPress: () => void;

  onWorthReading?: () => void;

  onHelpful?: () => void;

  onShare?: () => void;

  onBookmark?: () => void;

  onFeedback?: (
    reason: FeedbackReason
  ) => void;
}