export const POSTER_BRAIN_AI_LEARNING_DATASET_SCHEMA_VERSION =
  1 as const;

export type PosterBrainAiLearningDatasetSchemaVersion =
  typeof POSTER_BRAIN_AI_LEARNING_DATASET_SCHEMA_VERSION;

export type PosterBrainAiLearningSignalSource =
  | "organic_content_event"
  | "share"
  | "report"
  | "bookmark"
  | "article_interaction"
  | "article_feedback";

export type PosterBrainAiLearningSignalType =
  | "impression"
  | "open_original_click"
  | "share"
  | "report"
  | "bookmark"
  | "worth_reading"
  | "helpful"
  | "article_feedback";

export type PosterBrainAiLearningSurface =
  | "home"
  | "search"
  | "trending"
  | "bookmarks";

export type PosterBrainAiLearningReportStatus =
  | "pending"
  | "triaged"
  | "resolved"
  | "dismissed";

export type PosterBrainAiLearningContentStatus =
  | "active"
  | "hidden"
  | "removed"
  | "copyright_blocked";

export interface PosterBrainAiLearningContentFeatures {
  readonly contentId:
    string;

  readonly sourceKey:
    string |
    null;

  readonly publisherName:
    string |
    null;

  readonly title:
    string;

  readonly excerpt:
    string;

  readonly mediaType:
    string;

  readonly languageCode:
    string;

  readonly regionCode:
    string |
    null;

  readonly category:
    string |
    null;

  readonly canonicalTopicIds:
    readonly string[];

  readonly evolvingTopicIds:
    readonly string[];

  readonly tags:
    readonly string[];

  readonly searchKeywords:
    readonly string[];

  readonly aiClassification:
    Readonly<Record<string, unknown>>;

  readonly qualityScore:
    number;

  readonly publishedAt:
    string |
    null;

  readonly contentStatus:
    PosterBrainAiLearningContentStatus;
}

/**
 * One normalized row represents exactly one persisted organic
 * learning-signal row from the Backend database.
 *
 * Privacy boundary:
 * - no user ID
 * - no report free-text details
 * - no arbitrary event metadata
 * - no commercial/ad interaction data
 *
 * Semantic weighting and model labels are intentionally deferred
 * to the dataset transformation/training layer so this contract
 * does not invent learning meaning.
 */
export interface PosterBrainAiLearningDatasetEvent {
  readonly schemaVersion:
    PosterBrainAiLearningDatasetSchemaVersion;

  /**
   * Stable identity composed from the source table family and
   * the persisted source-event identifier.
   */
  readonly eventKey:
    string;

  readonly source:
    PosterBrainAiLearningSignalSource;

  readonly sourceEventId:
    string;

  readonly signalType:
    PosterBrainAiLearningSignalType;

  readonly occurredAt:
    string;

  /**
   * Present only when the underlying organic event recorded a
   * supported Mobile discovery surface.
   */
  readonly surface:
    PosterBrainAiLearningSurface |
    null;

  /**
   * Preserves feedback/report reason semantics without assigning
   * an invented training label.
   */
  readonly reasonId:
    string |
    null;

  /**
   * Present only for report rows.
   */
  readonly reportStatus:
    PosterBrainAiLearningReportStatus |
    null;

  /**
   * Present only for bookmark rows.
   *
   * A deleted bookmark remains a historical real save observation,
   * but bookmarkActive communicates its current state so a later
   * training transformer can handle withdrawal correctly.
   */
  readonly bookmarkActive:
    boolean |
    null;

  readonly content:
    PosterBrainAiLearningContentFeatures;
}

export interface PosterBrainAiLearningDatasetPage {
  readonly events:
    readonly PosterBrainAiLearningDatasetEvent[];

  readonly nextCursor:
    string |
    null;
}