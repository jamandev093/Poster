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
  ANALYTICS_VALIDATOR_VERSION,
  createAnalyticsValidationService,
  type AnalyticsValidationServiceDependencies,
} from "../src/application/monetization/index.js";

import type {
  MonetizationCampaignEventRecord,
  MonetizationEventValidationRecord,
} from "../src/domains/monetization/index.js";

const EVENT_ID =
  "00000000-0000-4000-8000-000000001301";

const DUPLICATE_EVENT_ID =
  "00000000-0000-4000-8000-000000001302";

const CAMPAIGN_ID =
  "00000000-0000-4000-8000-000000001201";

const VALIDATED_AT =
  new Date(
    "2026-08-01T16:00:00.000Z"
  );

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
    new Date(
      "2026-08-01T15:59:30.000Z"
    ),

  receivedAt:
    new Date(
      "2026-08-01T15:59:35.000Z"
    ),

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

const PENDING_VALIDATION:
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
    VALIDATED_AT,

  updatedAt:
    VALIDATED_AT,

  rowVersion:
    "1",
};

function createDependencies() {
  const findEvent =
    vi.fn()
      .mockResolvedValue(
        EVENT
      );

  const findValidation =
    vi.fn()
      .mockResolvedValue(
        PENDING_VALIDATION
      );

  const findTrustedDuplicate =
    vi.fn()
      .mockResolvedValue(
        null
      );

  const completeValidation =
    vi.fn()
      .mockImplementation(
        async input => ({
          ...PENDING_VALIDATION,

          validationStatus:
            input.validationStatus,

          invalidReasonCodes:
            input.invalidReasonCodes,

          duplicateOfEventId:
            input.duplicateOfEventId,

          validatorVersion:
            input.validatorVersion,

          validatedAt:
            input.validatedAt,

          rowVersion:
            "2",
        })
      );

  const dependencies = {
    findEvent,
    findValidation,
    findTrustedDuplicate,
    completeValidation,

    now:
      () =>
        VALIDATED_AT,
  } as unknown as
    AnalyticsValidationServiceDependencies;

  return {
    dependencies,
    findEvent,
    findValidation,
    findTrustedDuplicate,
    completeValidation,
  };
}

describe(
  "Analytics validation service",
  () => {
    beforeEach(
      () => {
        vi.clearAllMocks();
      }
    );

    it(
      "marks a trusted event as valid",
      async () => {
        const mocks =
          createDependencies();

        const service =
          createAnalyticsValidationService({
            dependencies:
              mocks.dependencies,
          });

        const result =
          await service.validate({
            eventId:
              EVENT_ID,

            expectedRowVersion:
              "1",
          });

        expect(
          mocks.completeValidation
        ).toHaveBeenCalledWith(
          expect.objectContaining({
            eventId:
              EVENT_ID,

            validationStatus:
              "valid",

            invalidReasonCodes:
              [],

            duplicateOfEventId:
              null,

            validatorVersion:
              ANALYTICS_VALIDATOR_VERSION,
          }),
          undefined
        );

        expect(
          result.validationStatus
        ).toBe(
          "valid"
        );
      }
    );

    it(
      "marks a repeated trusted request event as duplicate",
      async () => {
        const mocks =
          createDependencies();

        mocks.findTrustedDuplicate
          .mockResolvedValue({
            ...EVENT,

            id:
              DUPLICATE_EVENT_ID,

            eventKey:
              "evt-home-previous",
          });

        const service =
          createAnalyticsValidationService({
            dependencies:
              mocks.dependencies,
          });

        const result =
          await service.validate({
            eventId:
              EVENT_ID,

            expectedRowVersion:
              "1",
          });

        expect(
          result.validationStatus
        ).toBe(
          "duplicate"
        );

        expect(
          result.duplicateOfEventId
        ).toBe(
          DUPLICATE_EVENT_ID
        );

        expect(
          result.invalidReasonCodes
        ).toEqual([
          "duplicate_request_event",
        ]);
      }
    );

    it(
      "marks clicks without a request key as invalid",
      async () => {
        const mocks =
          createDependencies();

        mocks.findEvent
          .mockResolvedValue({
            ...EVENT,

            eventType:
              "click",

            requestKeyHash:
              null,
          });

        const service =
          createAnalyticsValidationService({
            dependencies:
              mocks.dependencies,
          });

        const result =
          await service.validate({
            eventId:
              EVENT_ID,

            expectedRowVersion:
              "1",
          });

        expect(
          result.validationStatus
        ).toBe(
          "invalid"
        );

        expect(
          result.invalidReasonCodes
        ).toContain(
          "missing_request_key"
        );
      }
    );

    it(
      "rejects a missing event",
      async () => {
        const mocks =
          createDependencies();

        mocks.findEvent
          .mockResolvedValue(
            null
          );

        const service =
          createAnalyticsValidationService({
            dependencies:
              mocks.dependencies,
          });

        await expect(
          service.validate({
            eventId:
              EVENT_ID,

            expectedRowVersion:
              "1",
          })
        ).rejects.toMatchObject({
          code:
            "ANALYTICS_EVENT_NOT_FOUND",
        });

        expect(
          mocks.completeValidation
        ).not.toHaveBeenCalled();
      }
    );

    it(
      "rejects an already completed validation",
      async () => {
        const mocks =
          createDependencies();

        mocks.findValidation
          .mockResolvedValue({
            ...PENDING_VALIDATION,

            validationStatus:
              "valid",

            validatedAt:
              VALIDATED_AT,

            validatorVersion:
              ANALYTICS_VALIDATOR_VERSION,

            rowVersion:
              "2",
          });

        const service =
          createAnalyticsValidationService({
            dependencies:
              mocks.dependencies,
          });

        await expect(
          service.validate({
            eventId:
              EVENT_ID,

            expectedRowVersion:
              "2",
          })
        ).rejects.toMatchObject({
          code:
            "ANALYTICS_VALIDATION_ALREADY_COMPLETED",
        });
      }
    );

    it(
      "reports optimistic concurrency failure",
      async () => {
        const mocks =
          createDependencies();

        mocks.completeValidation
          .mockResolvedValue(
            null
          );

        const service =
          createAnalyticsValidationService({
            dependencies:
              mocks.dependencies,
          });

        await expect(
          service.validate({
            eventId:
              EVENT_ID,

            expectedRowVersion:
              "1",
          })
        ).rejects.toMatchObject({
          code:
            "ANALYTICS_VALIDATION_VERSION_CONFLICT",
        });
      }
    );
  }
);