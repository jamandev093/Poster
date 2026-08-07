import AsyncStorage from "@react-native-async-storage/async-storage";

import {
  feedbackReasons,
} from "../components/cards/feedback/feedbackReasons";

import {
  STORAGE_KEYS,
} from "../constants/storage";

import MobileActionsApiService from "./MobileActionsApiService";

import type {
  MobileActionEngagementMetadata,
} from "./MobileActionsApiService";

const MAX_FEEDBACK_EVENTS =
  500;

const VALID_REASON_IDS =
  new Set(
    feedbackReasons.map(
      (reason) =>
        reason.id
    )
  );

export interface ArticleFeedbackEvent {
  id:
    string;

  articleId:
    string;

  reasonId:
    string;

  submittedAt:
    string;
}

export interface FeedbackSubmitOptions {
  surface?:
    string;

  details?:
    string |
    null;

  reportContext?:
    MobileActionEngagementMetadata;
}

export interface FeedbackSubmitResult {
  success:
    boolean;

  duplicate:
    boolean;

  reportRecorded?:
    boolean;

  reportDuplicate?:
    boolean;
}

function isArticleFeedbackEvent(
  value:
    unknown
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
  value:
    string |
    null
): ArticleFeedbackEvent[] {
  if (!value) {
    return [];
  }

  try {
    const parsed:
      unknown =
      JSON.parse(
        value
      );

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

function createFeedbackEvent(
  articleId:
    string,
  reasonId:
    string
): ArticleFeedbackEvent {
  return {
    id:
      createFeedbackId(),

    articleId,

    reasonId,

    submittedAt:
      new Date().toISOString(),
  };
}

function normalizeOptionalDetails(
  value:
    string |
    null |
    undefined
): string | null {
  if (
    value === undefined ||
    value === null
  ) {
    return null;
  }

  const normalized =
    value
      .trim()
      .replace(/\s+/g, " ");

  return normalized.length > 0
    ? normalized
    : null;
}

function buildReportContext(
  options:
    FeedbackSubmitOptions
): MobileActionEngagementMetadata {
  const inputContext =
    options.reportContext ??
    {};

  const contextSurface =
    typeof inputContext.surface ===
      "string" &&
    inputContext.surface.trim()
      .length > 0
      ? inputContext.surface.trim()
      : null;

  return {
    ...inputContext,

    surface:
      options.surface ??
      contextSurface ??
      "unknown",

    source:
      typeof inputContext.source ===
        "string"
        ? inputContext.source
        : "feedback_bottom_sheet",

    signalType:
      typeof inputContext.signalType ===
        "string"
        ? inputContext.signalType
        : "report_or_hide",
  };
}

export default class FeedbackService {
  /**
   * AsyncStorage remains the local
   * compatibility cache and offline
   * fallback. Backend article feedback
   * and moderation report/hide events
   * are best-effort so UI feedback is
   * never blocked by network failures.
   */
  private static mutationQueue:
    Promise<void> =
    Promise.resolve();

  private static runMutation<T>(
    mutation:
      () => Promise<T>
  ): Promise<T> {
    const operation =
      FeedbackService
        .mutationQueue
        .then(
          mutation
        );

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
    articleId:
      string,
    reason:
      string,
    options:
      FeedbackSubmitOptions =
      {}
  ): Promise<FeedbackSubmitResult> {
    const normalizedArticleId =
      articleId.trim();

    const normalizedReason =
      reason
        .trim()
        .toLowerCase();

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

    return FeedbackService
      .runMutation(
        async () => {
          const currentEvents =
            await FeedbackService
              .readEvents();

          const duplicate =
            currentEvents.some(
              (event) =>
                event.articleId ===
                  normalizedArticleId &&
                event.reasonId ===
                  normalizedReason
            );

          if (!duplicate) {
            await FeedbackService
              .writeEvents([
                ...currentEvents,
                createFeedbackEvent(
                  normalizedArticleId,
                  normalizedReason
                ),
              ]);
          }

          let feedbackResult:
            FeedbackSubmitResult = {
            success:
              true,

            duplicate,
          };

          try {
            const backendFeedback =
              await MobileActionsApiService
                .submitFeedback(
                  normalizedArticleId,
                  normalizedReason
                );

            feedbackResult = {
              success:
                backendFeedback.success,

              duplicate:
                backendFeedback.duplicate,
            };
          } catch {
            feedbackResult = {
              success:
                true,

              duplicate,
            };
          }

          try {
            const reportResult =
              await MobileActionsApiService
                .recordReportEvent({
                  contentId:
                    normalizedArticleId,

                  reasonId:
                    normalizedReason,

                  details:
                    normalizeOptionalDetails(
                      options.details
                    ),

                  reportContext:
                    buildReportContext(
                      options
                    ),
                });

            return {
              ...feedbackResult,

              reportRecorded:
                !reportResult.duplicate,

              reportDuplicate:
                reportResult.duplicate,
            };
          } catch {
            return {
              ...feedbackResult,

              reportRecorded:
                false,
            };
          }
        }
      );
  }

  static async getSubmittedFeedback(): Promise<
    ArticleFeedbackEvent[]
  > {
    try {
      await FeedbackService
        .mutationQueue;

      return await FeedbackService
        .readEvents();
    } catch {
      return [];
    }
  }

  static async hasSubmitted(
    articleId:
      string,
    reason?:
      string
  ): Promise<boolean> {
    const normalizedArticleId =
      articleId.trim();

    if (!normalizedArticleId) {
      return false;
    }

    const events =
      await FeedbackService
        .getSubmittedFeedback();

    return events.some(
      (event) =>
        event.articleId ===
          normalizedArticleId &&
        (
          reason === undefined ||
          event.reasonId ===
            reason.trim()
              .toLowerCase()
        )
    );
  }

  static async clear(): Promise<void> {
    await FeedbackService
      .runMutation(
        async () => {
          await AsyncStorage.removeItem(
            STORAGE_KEYS.ARTICLE_FEEDBACK
          );
        }
      );
  }
}
