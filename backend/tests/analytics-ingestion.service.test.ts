import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

vi.mock(
  "../src/database/database.transaction.js",
  () => ({
    runDatabaseTransaction:
      async <T>(
        operation:
          (
            executor:
              never
          ) => Promise<T>
      ): Promise<T> =>
        await operation(
          undefined as never
        ),
  })
);

import {
  createAnalyticsIngestionService,
  type AnalyticsIngestionServiceDependencies,
} from "../src/application/monetization/index.js";

import type {
  MonetizationCampaignEventRecord,
  MonetizationCampaignRecord,
  MonetizationEventValidationRecord,
} from "../src/domains/monetization/index.js";

const CAMPAIGN_ID =
  "00000000-0000-4000-8000-000000001201";

const EVENT_ID =
  "00000000-0000-4000-8000-000000001301";

const NOW =
  new Date(
    "2026-08-01T16:00:00.000Z"
  );

const OCCURRED_AT =
  new Date(
    "2026-08-01T15:59:30.000Z"
  );

const CAMPAIGN:
  MonetizationCampaignRecord = {
  id:
    CAMPAIGN_ID,

  campaignReference:
    "CMP-5001",

  sourceRequestId:
    null,

  organizationId:
    "00000000-0000-4000-8000-000000001101",

  name:
    "Active sponsorship",

  campaignType:
    "direct_sponsorship",

  origin:
    "client_request",

  status:
    "active",

  placements: [
    "home",
    "search",
  ],

  scheduledStartDate:
    "2026-08-01",

  scheduledEndDate:
    "2026-08-31",

  readinessStatus:
    "ready",

  commercialStatus:
    "funded",

  deliveryEligible:
    true,

  createdByUserId:
    "00000000-0000-4000-8000-000000000101",

  createdAt:
    NOW,

  updatedAt:
    NOW,

  rowVersion:
    "3",
};

const EVENT:
  MonetizationCampaignEventRecord = {
  id:
    EVENT_ID,

  eventKey:
    "evt-home-1001",

  campaignId:
    CAMPAIGN_ID,

  eventType:
    "impression",

  placement:
    "home",

  occurredAt:
    OCCURRED_AT,

  receivedAt:
    NOW,

  source:
    "mobile_app",

  schemaVersion:
    1,

  sessionKeyHash:
    "session-hash",

  userKeyHash:
    null,

  requestKeyHash:
    "request-hash",

  destinationHost:
    null,

  metadata:
    {},
};

const VALIDATION:
  MonetizationEventValidationRecord = {
  eventId:
    EVENT_ID,

  validationStatus:
    "pending",

  invalidReasonCodes:
    [],

  duplicateOfEventId:
    null,

  validatorVersion:
    null,

  validatedAt:
    null,

  createdAt:
    NOW,

  updatedAt:
    NOW,

  rowVersion:
    "1",
};

function createDependencies() {
  const findCampaign =
    vi.fn()
      .mockResolvedValue(
        CAMPAIGN
      );

  const findEventByKey =
    vi.fn()
      .mockResolvedValue(
        null
      );

  const createEvent =
    vi.fn()
      .mockResolvedValue(
        EVENT
      );

  const createPendingValidation =
    vi.fn()
      .mockResolvedValue(
        VALIDATION
      );

  const dependencies = {
    findCampaign,
    findEventByKey,
    createEvent,
    createPendingValidation,

    now:
      () =>
        NOW,
  } as unknown as
    AnalyticsIngestionServiceDependencies;

  return {
    dependencies,
    findCampaign,
    findEventByKey,
    createEvent,
    createPendingValidation,
  };
}

const INPUT = {
  eventKey:
    "evt-home-1001",

  campaignId:
    CAMPAIGN_ID,

  eventType:
    "impression" as const,

  placement:
    "home" as const,

  occurredAt:
    OCCURRED_AT,

  source:
    "mobile_app",

  sessionKeyHash:
    "session-hash",

  requestKeyHash:
    "request-hash",
};

describe(
  "Analytics ingestion service",
  () => {
    beforeEach(
      () => {
        vi.clearAllMocks();
      }
    );

    it(
      "creates an event and pending validation atomically",
      async () => {
        const mocks =
          createDependencies();

        const service =
          createAnalyticsIngestionService({
            dependencies:
              mocks.dependencies,
          });

        const result =
          await service.ingest(
            INPUT
          );

        expect(
          mocks.createEvent
        ).toHaveBeenCalledWith(
          expect.objectContaining({
            eventKey:
              INPUT.eventKey,

            receivedAt:
              NOW,
          }),
          undefined
        );

        expect(
          mocks.createPendingValidation
        ).toHaveBeenCalledWith(
          {
            eventId:
              EVENT_ID,
          },
          undefined
        );

        expect(
          result.idempotent
        ).toBe(
          false
        );
      }
    );

    it(
      "returns the existing event idempotently",
      async () => {
        const mocks =
          createDependencies();

        mocks.findEventByKey
          .mockResolvedValue(
            EVENT
          );

        const service =
          createAnalyticsIngestionService({
            dependencies:
              mocks.dependencies,
          });

        const result =
          await service.ingest(
            INPUT
          );

        expect(
          mocks.createEvent
        ).not.toHaveBeenCalled();

        expect(
          result.idempotent
        ).toBe(
          true
        );
      }
    );

    it(
      "rejects reuse of an event key for different immutable data",
      async () => {
        const mocks =
          createDependencies();

        mocks.findEventByKey
          .mockResolvedValue({
            ...EVENT,

            placement:
              "search",
          });

        const service =
          createAnalyticsIngestionService({
            dependencies:
              mocks.dependencies,
          });

        await expect(
          service.ingest(
            INPUT
          )
        ).rejects.toMatchObject({
          code:
            "ANALYTICS_EVENT_KEY_CONFLICT",
        });
      }
    );

    it(
      "rejects delivery events for an ineligible campaign",
      async () => {
        const mocks =
          createDependencies();

        mocks.findCampaign
          .mockResolvedValue({
            ...CAMPAIGN,

            status:
              "draft",

            deliveryEligible:
              false,
          });

        const service =
          createAnalyticsIngestionService({
            dependencies:
              mocks.dependencies,
          });

        await expect(
          service.ingest(
            INPUT
          )
        ).rejects.toMatchObject({
          code:
            "ANALYTICS_CAMPAIGN_NOT_ELIGIBLE",
        });

        expect(
          mocks.createEvent
        ).not.toHaveBeenCalled();
      }
    );

    it(
      "rejects an event for a placement not enabled on the campaign",
      async () => {
        const mocks =
          createDependencies();

        const service =
          createAnalyticsIngestionService({
            dependencies:
              mocks.dependencies,
          });

        await expect(
          service.ingest({
            ...INPUT,

            placement:
              "trending",
          })
        ).rejects.toMatchObject({
          code:
            "ANALYTICS_PLACEMENT_NOT_ALLOWED",
        });
      }
    );

    it(
      "rejects events outside the accepted time window",
      async () => {
        const mocks =
          createDependencies();

        const service =
          createAnalyticsIngestionService({
            dependencies:
              mocks.dependencies,
          });

        await expect(
          service.ingest({
            ...INPUT,

            occurredAt:
              new Date(
                "2026-06-01T00:00:00.000Z"
              ),
          })
        ).rejects.toMatchObject({
          code:
            "ANALYTICS_EVENT_TIME_INVALID",
        });

        expect(
          mocks.findCampaign
        ).not.toHaveBeenCalled();
      }
    );
  }
);