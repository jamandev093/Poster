export const DECLARED_INTEREST_STATUSES = [
  "active",
  "removed",
] as const;

export type DeclaredInterestStatus =
  (typeof DECLARED_INTEREST_STATUSES)[number];

export interface UserDeclaredInterestRecord {
  userId: string;

  topicId: string;

  status:
    DeclaredInterestStatus;

  personalizationAllowed: boolean;

  campaignTargetingAllowed: boolean;

  declaredAt: Date;

  consentUpdatedAt: Date;

  removedAt:
    Date |
    null;

  createdAt: Date;

  updatedAt: Date;

  rowVersion: string;
}

export interface UpsertUserDeclaredInterestInput {
  userId: string;

  topicId: string;

  personalizationAllowed: boolean;

  campaignTargetingAllowed: boolean;

  changedAt: Date;
}

export interface UpdateDeclaredInterestConsentInput {
  userId: string;

  topicId: string;

  expectedRowVersion: string;

  personalizationAllowed: boolean;

  campaignTargetingAllowed: boolean;

  changedAt: Date;
}

export interface RemoveUserDeclaredInterestInput {
  userId: string;

  topicId: string;

  expectedRowVersion: string;

  removedAt: Date;
}

export function assertValidInterestConsent(
  personalizationAllowed: boolean,
  campaignTargetingAllowed: boolean
): void {
  if (
    campaignTargetingAllowed &&
    !personalizationAllowed
  ) {
    throw new RangeError(
      "Campaign targeting requires personalization consent."
    );
  }
}
