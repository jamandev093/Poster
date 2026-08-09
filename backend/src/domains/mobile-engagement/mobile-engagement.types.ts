export type MobileAdInteractionEventType =
  | "impression"
  | "view"
  | "click"
  | "dismiss"
  | "hide";

export type MobileOrganicContentEventType =
  | "impression"
  | "open_original_click";

export type MobileOrganicContentEventSurface =
  | "home"
  | "search"
  | "trending"
  | "bookmarks";

export interface MobileEngagementMetadata {
  [key:
    string]:
    unknown;
}

export interface RecordMobileShareEventInput {
  userId:
    string;

  contentId:
    string;

  originalUrl:
    string;

  publisher:
    string;

  shareTarget?:
    string |
    null;

  activityType?:
    string |
    null;

  metadata?:
    MobileEngagementMetadata |
    null;
}

export interface RecordMobileReportEventInput {
  userId:
    string;

  contentId:
    string;

  reasonId:
    string;

  details?:
    string |
    null;

  reportContext?:
    MobileEngagementMetadata |
    null;
}

export interface RecordMobileOrganicContentEventInput {
  userId:
    string;

  contentId:
    string;

  eventType:
    MobileOrganicContentEventType;

  surface:
    MobileOrganicContentEventSurface;

  sourceContext?:
    string |
    null;

  deduplicationKey?:
    string |
    null;

  occurredAt?:
    string |
    null;

  metadata?:
    MobileEngagementMetadata |
    null;
}

export interface RecordMobileAdInteractionInput {
  userId:
    string;

  eventType:
    MobileAdInteractionEventType;

  placement:
    string;

  adSlotId?:
    string |
    null;

  campaignId?:
    string |
    null;

  creativeId?:
    string |
    null;

  contentId?:
    string |
    null;

  deduplicationKey?:
    string |
    null;

  occurredAt?:
    string |
    null;

  metadata?:
    MobileEngagementMetadata |
    null;
}

export interface RecordMobileShareEventResult {
  success:
    true;

  eventId:
    string;
}

export interface RecordMobileReportEventResult {
  success:
    true;

  duplicate:
    boolean;

  reportId:
    string |
    null;
}

export interface RecordMobileOrganicContentEventResult {
  success:
    true;

  duplicate:
    boolean;

  eventId:
    string |
    null;
}

export interface RecordMobileAdInteractionResult {
  success:
    true;

  duplicate:
    boolean;

  interactionId:
    string |
    null;
}

export interface MobileEngagementRepository {
  recordShareEvent(
    input:
      RecordMobileShareEventInput
  ): Promise<RecordMobileShareEventResult>;

  recordReportEvent(
    input:
      RecordMobileReportEventInput
  ): Promise<RecordMobileReportEventResult>;

  recordOrganicContentEvent(
    input:
      RecordMobileOrganicContentEventInput
  ): Promise<RecordMobileOrganicContentEventResult>;

  recordAdInteraction(
    input:
      RecordMobileAdInteractionInput
  ): Promise<RecordMobileAdInteractionResult>;
}
