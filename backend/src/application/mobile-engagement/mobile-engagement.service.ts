import type {
  MobileAdInteractionEventType,
  MobileEngagementMetadata,
  MobileEngagementRepository,
  RecordMobileAdInteractionInput,
  RecordMobileAdInteractionResult,
  RecordMobileReportEventInput,
  RecordMobileReportEventResult,
  RecordMobileShareEventInput,
  RecordMobileShareEventResult,
} from "../../domains/mobile-engagement/index.js";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const REPORT_REASON_PATTERN =
  /^[a-z0-9_-]{2,64}$/;

const SUPPORTED_AD_EVENT_TYPES =
  new Set<MobileAdInteractionEventType>([
    "impression",
    "view",
    "click",
    "dismiss",
    "hide",
  ]);

export interface MobileEngagementService {
  recordShareEvent(
    input:
      RecordMobileShareEventInput
  ): Promise<RecordMobileShareEventResult>;

  recordReportEvent(
    input:
      RecordMobileReportEventInput
  ): Promise<RecordMobileReportEventResult>;

  recordAdInteraction(
    input:
      RecordMobileAdInteractionInput
  ): Promise<RecordMobileAdInteractionResult>;
}

function normalizeUuid(
  value:
    string,
  label:
    string
): string {
  const normalized =
    value.trim();

  if (
    !UUID_PATTERN.test(
      normalized
    )
  ) {
    throw new Error(
      `${label} must be a valid UUID.`
    );
  }

  return normalized;
}

function normalizeOptionalUuid(
  value:
    string |
    null |
    undefined,
  label:
    string
): string | null {
  if (
    value === undefined ||
    value === null ||
    value.trim().length === 0
  ) {
    return null;
  }

  return normalizeUuid(
    value,
    label
  );
}

function normalizeRequiredText(
  value:
    string,
  label:
    string,
  maxLength:
    number
): string {
  const normalized =
    value
      .trim()
      .replace(
        /\s+/g,
        " "
      );

  if (!normalized) {
    throw new Error(
      `${label} is required.`
    );
  }

  if (
    normalized.length >
    maxLength
  ) {
    throw new Error(
      `${label} is too long.`
    );
  }

  return normalized;
}

function normalizeOptionalText(
  value:
    string |
    null |
    undefined,
  label:
    string,
  maxLength:
    number
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
      .replace(
        /\s+/g,
        " "
      );

  if (!normalized) {
    return null;
  }

  if (
    normalized.length >
    maxLength
  ) {
    throw new Error(
      `${label} is too long.`
    );
  }

  return normalized;
}

function normalizeUrl(
  value:
    string
): string {
  const normalized =
    value.trim();

  let parsed:
    URL;

  try {
    parsed =
      new URL(
        normalized
      );
  } catch {
    throw new Error(
      "Original URL must be a valid publisher URL."
    );
  }

  if (
    parsed.protocol !== "https:" &&
    parsed.protocol !== "http:"
  ) {
    throw new Error(
      "Original URL must be a valid publisher URL."
    );
  }

  return parsed.toString();
}

function normalizeReasonId(
  value:
    string
): string {
  const normalized =
    value
      .trim()
      .toLowerCase();

  if (
    !REPORT_REASON_PATTERN.test(
      normalized
    )
  ) {
    throw new Error(
      "Report reason is invalid."
    );
  }

  return normalized;
}

function normalizeMetadata(
  value:
    MobileEngagementMetadata |
    null |
    undefined,
  label:
    string
): MobileEngagementMetadata {
  if (
    value === undefined ||
    value === null
  ) {
    return {};
  }

  if (
    typeof value !== "object" ||
    Array.isArray(value)
  ) {
    throw new Error(
      `${label} must be an object.`
    );
  }

  return value;
}

function normalizeOccurredAt(
  value:
    string |
    null |
    undefined
): string | null {
  if (
    value === undefined ||
    value === null ||
    value.trim().length === 0
  ) {
    return null;
  }

  const normalized =
    value.trim();

  if (
    Number.isNaN(
      Date.parse(
        normalized
      )
    )
  ) {
    throw new Error(
      "Ad interaction occurredAt is invalid."
    );
  }

  return new Date(
    normalized
  ).toISOString();
}

function normalizeAdEventType(
  value:
    MobileAdInteractionEventType
): MobileAdInteractionEventType {
  if (
    !SUPPORTED_AD_EVENT_TYPES.has(
      value
    )
  ) {
    throw new Error(
      "Ad interaction event type is invalid."
    );
  }

  return value;
}

export class DefaultMobileEngagementService
  implements MobileEngagementService {
  constructor(
    private readonly repository:
      MobileEngagementRepository
  ) {}

  async recordShareEvent(
    input:
      RecordMobileShareEventInput
  ): Promise<RecordMobileShareEventResult> {
    return this.repository.recordShareEvent({
      userId:
        normalizeUuid(
          input.userId,
          "User ID"
        ),

      contentId:
        normalizeUuid(
          input.contentId,
          "Content ID"
        ),

      originalUrl:
        normalizeUrl(
          input.originalUrl
        ),

      publisher:
        normalizeRequiredText(
          input.publisher,
          "Publisher",
          240
        ),

      shareTarget:
        normalizeOptionalText(
          input.shareTarget,
          "Share target",
          120
        ),

      activityType:
        normalizeOptionalText(
          input.activityType,
          "Activity type",
          160
        ),

      metadata:
        normalizeMetadata(
          input.metadata,
          "Share metadata"
        ),
    });
  }

  async recordReportEvent(
    input:
      RecordMobileReportEventInput
  ): Promise<RecordMobileReportEventResult> {
    return this.repository.recordReportEvent({
      userId:
        normalizeUuid(
          input.userId,
          "User ID"
        ),

      contentId:
        normalizeUuid(
          input.contentId,
          "Content ID"
        ),

      reasonId:
        normalizeReasonId(
          input.reasonId
        ),

      details:
        normalizeOptionalText(
          input.details,
          "Report details",
          2000
        ),

      reportContext:
        normalizeMetadata(
          input.reportContext,
          "Report context"
        ),
    });
  }

  async recordAdInteraction(
    input:
      RecordMobileAdInteractionInput
  ): Promise<RecordMobileAdInteractionResult> {
    return this.repository.recordAdInteraction({
      userId:
        normalizeUuid(
          input.userId,
          "User ID"
        ),

      eventType:
        normalizeAdEventType(
          input.eventType
        ),

      placement:
        normalizeRequiredText(
          input.placement,
          "Placement",
          160
        ),

      adSlotId:
        normalizeOptionalUuid(
          input.adSlotId,
          "Ad slot ID"
        ),

      campaignId:
        normalizeOptionalUuid(
          input.campaignId,
          "Campaign ID"
        ),

      creativeId:
        normalizeOptionalUuid(
          input.creativeId,
          "Creative ID"
        ),

      contentId:
        normalizeOptionalUuid(
          input.contentId,
          "Content ID"
        ),

      deduplicationKey:
        normalizeOptionalText(
          input.deduplicationKey,
          "Deduplication key",
          240
        ),

      occurredAt:
        normalizeOccurredAt(
          input.occurredAt
        ),

      metadata:
        normalizeMetadata(
          input.metadata,
          "Ad interaction metadata"
        ),
    });
  }
}

export function createMobileEngagementService(
  repository:
    MobileEngagementRepository
): MobileEngagementService {
  return new DefaultMobileEngagementService(
    repository
  );
}
