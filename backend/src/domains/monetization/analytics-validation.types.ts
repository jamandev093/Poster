export const MONETIZATION_EVENT_VALIDATION_STATUSES = [
  "pending",
  "valid",
  "invalid",
  "duplicate",
] as const;

export type MonetizationEventValidationStatus =
  (typeof MONETIZATION_EVENT_VALIDATION_STATUSES)[number];

export interface MonetizationEventValidationRecord {
  eventId: string;

  validationStatus:
    MonetizationEventValidationStatus;

  invalidReasonCodes:
    string[];

  duplicateOfEventId:
    string |
    null;

  validatorVersion:
    string |
    null;

  validatedAt:
    Date |
    null;

  createdAt: Date;

  updatedAt: Date;

  rowVersion: string;
}

export interface CreatePendingEventValidationInput {
  eventId: string;
}

export interface CompleteEventValidationInput {
  eventId: string;

  expectedRowVersion: string;

  validationStatus:
    Exclude<
      MonetizationEventValidationStatus,
      "pending"
    >;

  invalidReasonCodes:
    string[];

  duplicateOfEventId:
    string |
    null;

  validatorVersion: string;

  validatedAt: Date;
}