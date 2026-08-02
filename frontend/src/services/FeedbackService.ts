import AsyncStorage from "@react-native-async-storage/async-storage";

import {
  feedbackReasons,
} from "../components/cards/feedback/feedbackReasons";

import {
  STORAGE_KEYS,
} from "../constants/storage";

const MAX_FEEDBACK_EVENTS = 500;

const VALID_REASON_IDS =
  new Set(
    feedbackReasons.map(
      (reason) => reason.id
    )
  );

export interface ArticleFeedbackEvent {
  id: string;

  articleId: string;

  reasonId: string;

  submittedAt: string;
}

export interface FeedbackSubmitResult {
  success: boolean;

  duplicate: boolean;
}

function isArticleFeedbackEvent(
  value: unknown
): value is ArticleFeedbackEvent {
  if (
    typeof value !== "object" ||
    value === null
  ) {
    return false;
  }

  const event =
    value as Partial<ArticleFeedbackEvent>;

  return (
    typeof event.id === "string" &&
    event.id.length > 0 &&
    typeof event.articleId ===
      "string" &&
    event.articleId.length > 0 &&
    typeof event.reasonId ===
      "string" &&
    VALID_REASON_IDS.has(
      event.reasonId
    ) &&
    typeof event.submittedAt ===
      "string" &&
    !Number.isNaN(
      Date.parse(
        event.submittedAt
      )
    )
  );
}

function parseFeedbackEvents(
  value: string | null
): ArticleFeedbackEvent[] {
  if (!value) {
    return [];
  }

  try {
    const parsed: unknown =
      JSON.parse(value);

    if (!Array.isArray(parsed)) {
      return [];
    }

    const validEvents =
      parsed.filter(
        isArticleFeedbackEvent
      );

    const uniqueEvents =
      new Map<
        string,
        ArticleFeedbackEvent
      >();

    validEvents.forEach(
      (event) => {
        const deduplicationKey = [
          event.articleId,
          event.reasonId,
        ].join(":");

        if (
          !uniqueEvents.has(
            deduplicationKey
          )
        ) {
          uniqueEvents.set(
            deduplicationKey,
            event
          );
        }
      }
    );

    return Array.from(
      uniqueEvents.values()
    );
  } catch {
    return [];
  }
}

function createFeedbackId(): string {
  return [
    "feedback",
    Date.now().toString(),
    Math.random()
      .toString(36)
      .slice(2, 10),
  ].join("-");
}

export default class FeedbackService {
  /**
   * AsyncStorage does not provide an
   * atomic append operation. Serializing
   * writes prevents concurrent feedback
   * submissions from overwriting one
   * another.
   */
  private static mutationQueue:
    Promise<void> =
    Promise.resolve();

  private static runMutation<T>(
    mutation: () => Promise<T>
  ): Promise<T> {
    const operation =
      FeedbackService
        .mutationQueue
        .then(mutation);

    FeedbackService
      .mutationQueue =
      operation.then(
        () => undefined,
        () => undefined
      );

    return operation;
  }

  private static async readEvents(): Promise<
    ArticleFeedbackEvent[]
  > {
    const value =
      await AsyncStorage.getItem(
        STORAGE_KEYS.ARTICLE_FEEDBACK
      );

    return parseFeedbackEvents(
      value
    );
  }

  private static async writeEvents(
    events:
      ArticleFeedbackEvent[]
  ): Promise<void> {
    const limitedEvents =
      events.slice(
        -MAX_FEEDBACK_EVENTS
      );

    await AsyncStorage.setItem(
      STORAGE_KEYS.ARTICLE_FEEDBACK,
      JSON.stringify(
        limitedEvents
      )
    );
  }

  static async submit(
    articleId: string,
    reason: string
  ): Promise<FeedbackSubmitResult> {
    const normalizedArticleId =
      articleId.trim();

    const normalizedReason =
      reason.trim();

    if (!normalizedArticleId) {
      throw new Error(
        "Article ID is required."
      );
    }

    if (
      !VALID_REASON_IDS.has(
        normalizedReason
      )
    ) {
      throw new Error(
        "Invalid article feedback reason."
      );
    }

    return FeedbackService.runMutation(
      async () => {
        const currentEvents =
          await FeedbackService.readEvents();

        const duplicate =
          currentEvents.some(
            (event) =>
              event.articleId ===
                normalizedArticleId &&
              event.reasonId ===
                normalizedReason
          );

        if (duplicate) {
          return {
            success: true,
            duplicate: true,
          };
        }

        const event:
          ArticleFeedbackEvent = {
            id: createFeedbackId(),

            articleId:
              normalizedArticleId,

            reasonId:
              normalizedReason,

            submittedAt:
              new Date().toISOString(),
          };

        await FeedbackService.writeEvents([
          ...currentEvents,
          event,
        ]);

        // TODO:
        // POST /feedback
        //
        // Send queued feedback events to
        // the backend when API integration
        // begins.

        return {
          success: true,
          duplicate: false,
        };
      }
    );
  }

  static async getSubmittedFeedback(): Promise<
    ArticleFeedbackEvent[]
  > {
    try {
      await FeedbackService
        .mutationQueue;

      return await FeedbackService.readEvents();
    } catch {
      return [];
    }
  }

  static async hasSubmitted(
    articleId: string,
    reason?: string
  ): Promise<boolean> {
    const normalizedArticleId =
      articleId.trim();

    if (!normalizedArticleId) {
      return false;
    }

    const events =
      await FeedbackService.getSubmittedFeedback();

    return events.some(
      (event) =>
        event.articleId ===
          normalizedArticleId &&
        (
          reason === undefined ||
          event.reasonId ===
            reason.trim()
        )
    );
  }

  static async clear(): Promise<void> {
    await FeedbackService.runMutation(
      async () => {
        await AsyncStorage.removeItem(
          STORAGE_KEYS.ARTICLE_FEEDBACK
        );
      }
    );
  }
}