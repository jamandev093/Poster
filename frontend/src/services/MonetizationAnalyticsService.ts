import AsyncStorage from "@react-native-async-storage/async-storage";

import {
  MonetizationEntryType,
  MonetizationPlacement,
} from "../components/ads";

const STORAGE_KEY =
  "@poster/monetization_events_v1";

const MAX_QUEUED_EVENTS = 500;

const EVENT_TYPES:
  readonly MonetizationEventType[] = [
    "impression",
    "click",
    "report",
  ];

const MONETIZATION_TYPES:
  readonly MonetizationEntryType[] = [
    "poster_promotion",
    "poster_affiliate",
    "direct_sponsorship",
    "google_native_ad",
  ];

const PLACEMENTS:
  readonly MonetizationPlacement[] = [
    "home",
    "search",
    "trending",
  ];

export type MonetizationEventType =
  | "impression"
  | "click"
  | "report";

export interface MonetizationAnalyticsEvent {
  id: string;

  eventType:
    MonetizationEventType;

  itemId: string;

  monetizationType:
    MonetizationEntryType;

  placement:
    MonetizationPlacement;

  campaignId?: string;

  advertiserName?: string;

  reportReason?: string;

  occurredAt: string;
}

interface RecordEventOptions {
  itemId: string;

  monetizationType:
    MonetizationEntryType;

  placement:
    MonetizationPlacement;

  campaignId?: string;

  advertiserName?: string;
}

interface RecordReportOptions
  extends RecordEventOptions {
  reportReason?: string;
}

function isIncludedValue<T extends string>(
  values: readonly T[],
  value: unknown
): value is T {
  return (
    typeof value === "string" &&
    values.includes(value as T)
  );
}

function isOptionalString(
  value: unknown
): value is string | undefined {
  return (
    value === undefined ||
    typeof value === "string"
  );
}

function isAnalyticsEvent(
  value: unknown
): value is MonetizationAnalyticsEvent {
  if (
    typeof value !== "object" ||
    value === null
  ) {
    return false;
  }

  const event =
    value as Partial<MonetizationAnalyticsEvent>;

  return (
    typeof event.id === "string" &&
    event.id.length > 0 &&
    isIncludedValue(
      EVENT_TYPES,
      event.eventType
    ) &&
    typeof event.itemId === "string" &&
    event.itemId.length > 0 &&
    isIncludedValue(
      MONETIZATION_TYPES,
      event.monetizationType
    ) &&
    isIncludedValue(
      PLACEMENTS,
      event.placement
    ) &&
    isOptionalString(
      event.campaignId
    ) &&
    isOptionalString(
      event.advertiserName
    ) &&
    isOptionalString(
      event.reportReason
    ) &&
    typeof event.occurredAt ===
      "string" &&
    !Number.isNaN(
      Date.parse(
        event.occurredAt
      )
    )
  );
}

function parseEvents(
  value: string | null
): MonetizationAnalyticsEvent[] {
  if (!value) {
    return [];
  }

  try {
    const parsed: unknown =
      JSON.parse(value);

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter(
      isAnalyticsEvent
    );
  } catch {
    return [];
  }
}

function createEventId(): string {
  return [
    "monetization",
    Date.now().toString(),
    Math.random()
      .toString(36)
      .slice(2, 10),
  ].join("-");
}

export default class MonetizationAnalyticsService {
  private static recordedImpressions =
    new Set<string>();

  /**
   * AsyncStorage does not provide an
   * atomic append operation. Serializing
   * writes prevents concurrent events
   * from overwriting one another.
   */
  private static writeQueue:
    Promise<void> =
    Promise.resolve();

  private static async enqueue(
    event:
      MonetizationAnalyticsEvent
  ): Promise<void> {
    const writeOperation =
      MonetizationAnalyticsService
        .writeQueue
        .then(async () => {
          const storedValue =
            await AsyncStorage.getItem(
              STORAGE_KEY
            );

          const currentEvents =
            parseEvents(storedValue);

          const nextEvents = [
            ...currentEvents,
            event,
          ].slice(
            -MAX_QUEUED_EVENTS
          );

          await AsyncStorage.setItem(
            STORAGE_KEY,
            JSON.stringify(
              nextEvents
            )
          );

          // TODO:
          // Send events to the backend
          // analytics endpoint when API
          // integration begins.
        });

    MonetizationAnalyticsService
      .writeQueue =
      writeOperation.catch(
        () => undefined
      );

    await writeOperation;
  }

  private static createEvent(
    eventType:
      MonetizationEventType,
    options:
      RecordEventOptions,
    reportReason?: string
  ): MonetizationAnalyticsEvent {
    return {
      id: createEventId(),

      eventType,

      itemId:
        options.itemId,

      monetizationType:
        options.monetizationType,

      placement:
        options.placement,

      campaignId:
        options.campaignId,

      advertiserName:
        options.advertiserName,

      reportReason,

      occurredAt:
        new Date().toISOString(),
    };
  }

  static async recordImpression(
    options:
      RecordEventOptions
  ): Promise<void> {
    const impressionKey = [
      options.placement,
      options.monetizationType,
      options.itemId,
    ].join(":");

    if (
      MonetizationAnalyticsService
        .recordedImpressions
        .has(impressionKey)
    ) {
      return;
    }

    MonetizationAnalyticsService
      .recordedImpressions
      .add(impressionKey);

    try {
      await MonetizationAnalyticsService.enqueue(
        MonetizationAnalyticsService.createEvent(
          "impression",
          options
        )
      );
    } catch {
      MonetizationAnalyticsService
        .recordedImpressions
        .delete(impressionKey);

      throw new Error(
        "Monetization impression could not be queued."
      );
    }
  }

  static async recordClick(
    options:
      RecordEventOptions
  ): Promise<void> {
    await MonetizationAnalyticsService.enqueue(
      MonetizationAnalyticsService.createEvent(
        "click",
        options
      )
    );
  }

  static async recordReport(
    options:
      RecordReportOptions
  ): Promise<void> {
    await MonetizationAnalyticsService.enqueue(
      MonetizationAnalyticsService.createEvent(
        "report",
        options,
        options.reportReason
      )
    );
  }

  static async getQueuedEvents(): Promise<
    MonetizationAnalyticsEvent[]
  > {
    try {
      await MonetizationAnalyticsService
        .writeQueue;

      const value =
        await AsyncStorage.getItem(
          STORAGE_KEY
        );

      return parseEvents(value);
    } catch {
      return [];
    }
  }

  static async clearQueuedEvents(): Promise<void> {
    await MonetizationAnalyticsService
      .writeQueue;

    await AsyncStorage.removeItem(
      STORAGE_KEY
    );

    MonetizationAnalyticsService
      .recordedImpressions
      .clear();
  }

  static resetSessionImpressions(): void {
    MonetizationAnalyticsService
      .recordedImpressions
      .clear();
  }
}