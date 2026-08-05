import type {
  OrganizationRecord,
  UpdateOrganizationProfileInput,
  UserIdentityRecord,
} from "../../domains/identity/identity.types.js";

import {
  findOrganizationById,
  updateOrganizationProfile,
} from "../../domains/identity/organization.repository.js";

import {
  findUserById,
} from "../../domains/identity/user.repository.js";

export type ClientAccountErrorCode =
  | "CLIENT_ACCOUNT_VALIDATION_ERROR"
  | "CLIENT_ACCOUNT_NOT_FOUND"
  | "CLIENT_ACCOUNT_VERSION_CONFLICT";

export interface ClientAccountValidationIssue {
  field:
    string;

  code:
    string;

  message:
    string;
}

export class ClientAccountValidationError extends Error {
  readonly code: ClientAccountErrorCode =
    "CLIENT_ACCOUNT_VALIDATION_ERROR";

  readonly issues:
    ClientAccountValidationIssue[];

  constructor(
    message:
      string,

    issues:
      ClientAccountValidationIssue[] =
        []
  ) {
    super(
      message
    );

    this.name =
      "ClientAccountValidationError";

    this.issues =
      issues;
  }
}

export class ClientAccountNotFoundError extends Error {
  readonly code: ClientAccountErrorCode =
    "CLIENT_ACCOUNT_NOT_FOUND";

  constructor(
    message:
      string =
        "Client account or organization was not found."
  ) {
    super(
      message
    );

    this.name =
      "ClientAccountNotFoundError";
  }
}

export class ClientAccountConflictError extends Error {
  readonly code: ClientAccountErrorCode =
    "CLIENT_ACCOUNT_VERSION_CONFLICT";

  constructor(
    message:
      string =
        "The Client organization was changed by another request. Refresh and try again."
  ) {
    super(
      message
    );

    this.name =
      "ClientAccountConflictError";
  }
}

export interface ClientAccountActor {
  userId:
    string;

  organizationId:
    string;
}

export interface ClientAccountSnapshot {
  user:
    UserIdentityRecord;

  organization:
    OrganizationRecord;
}

export interface UpdateClientOrganizationProfileInput
  extends ClientAccountActor {
  name:
    string;

  websiteUrl?:
    string | null;

  billingEmail?:
    string | null;

  countryCode:
    string;

  expectedRowVersion:
    string;
}

export interface UpdateClientAccountInput
  extends ClientAccountActor {
  organization:
    Omit<
      UpdateClientOrganizationProfileInput,
      "userId" | "organizationId"
    >;
}

export interface ClientAccountServiceDependencies {
  findUserById:
    typeof findUserById;

  findOrganizationById:
    typeof findOrganizationById;

  updateOrganizationProfile:
    typeof updateOrganizationProfile;
}

export interface ClientAccountService {
  getAccount(
    actor:
      ClientAccountActor
  ): Promise<ClientAccountSnapshot>;

  getCurrentOrganization(
    actor:
      ClientAccountActor
  ): Promise<OrganizationRecord>;

  updateCurrentOrganization(
    input:
      UpdateClientOrganizationProfileInput
  ): Promise<OrganizationRecord>;

  updateAccount(
    input:
      UpdateClientAccountInput
  ): Promise<ClientAccountSnapshot>;
}

const DEFAULT_DEPENDENCIES: ClientAccountServiceDependencies = {
  findUserById,
  findOrganizationById,
  updateOrganizationProfile,
};

function normalizeRequiredText(
  value:
    string,

  field:
    string
): string {
  const normalized =
    value.trim();

  if (!normalized) {
    throw new ClientAccountValidationError(
      `${field} is required.`,
      [
        {
          field,
          code:
            "required",
          message:
            `${field} is required.`,
        },
      ]
    );
  }

  return normalized;
}

function normalizeNullableText(
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
    value.trim();

  return normalized || null;
}

function normalizeCountryCodeForUpdate(
  value:
    string
): string {
  const normalized =
    normalizeRequiredText(
      value,
      "countryCode"
    ).toUpperCase();

  if (
    !/^[A-Z]{2}$/.test(
      normalized
    )
  ) {
    throw new ClientAccountValidationError(
      "countryCode must be a two-letter ISO country code.",
      [
        {
          field:
            "countryCode",
          code:
            "invalid",
          message:
            "countryCode must be a two-letter ISO country code.",
        },
      ]
    );
  }

  return normalized;
}

function normalizeExpectedRowVersion(
  value:
    string
): string {
  const normalized =
    normalizeRequiredText(
      value,
      "expectedRowVersion"
    );

  if (
    !/^[0-9]+$/.test(
      normalized
    )
  ) {
    throw new ClientAccountValidationError(
      "expectedRowVersion must be a numeric row version.",
      [
        {
          field:
            "expectedRowVersion",
          code:
            "invalid",
          message:
            "expectedRowVersion must be a numeric row version.",
        },
      ]
    );
  }

  return normalized;
}

function normalizeActor(
  actor:
    ClientAccountActor
): ClientAccountActor {
  return {
    userId:
      normalizeRequiredText(
        actor.userId,
        "userId"
      ),

    organizationId:
      normalizeRequiredText(
        actor.organizationId,
        "organizationId"
      ),
  };
}

function normalizeOrganizationUpdate(
  input:
    UpdateClientOrganizationProfileInput
): UpdateOrganizationProfileInput {
  const displayName =
    normalizeRequiredText(
      input.name,
      "name"
    );

  return {
    organizationId:
      normalizeRequiredText(
        input.organizationId,
        "organizationId"
      ),

    expectedRowVersion:
      normalizeExpectedRowVersion(
        input.expectedRowVersion
      ),

    legalName:
      displayName,

    displayName,

    websiteUrl:
      normalizeNullableText(
        input.websiteUrl
      ),

    billingEmail:
      normalizeNullableText(
        input.billingEmail
      ),

    countryCode:
      normalizeCountryCodeForUpdate(
        input.countryCode
      ),
  };
}

export function createClientAccountService(
  dependencies:
    Partial<ClientAccountServiceDependencies> =
      {}
): ClientAccountService {
  const resolved: ClientAccountServiceDependencies = {
    ...DEFAULT_DEPENDENCIES,
    ...dependencies,
  };

  async function getAccountSnapshot(
    actor:
      ClientAccountActor
  ): Promise<ClientAccountSnapshot> {
    const normalizedActor =
      normalizeActor(
        actor
      );

    const [
      user,
      organization,
    ] =
      await Promise.all([
        resolved.findUserById(
          normalizedActor.userId
        ),

        resolved.findOrganizationById(
          normalizedActor.organizationId
        ),
      ]);

    if (
      !user ||
      !organization
    ) {
      throw new ClientAccountNotFoundError();
    }

    return {
      user,
      organization,
    };
  }

  async function updateOrganization(
    input:
      UpdateClientOrganizationProfileInput
  ): Promise<OrganizationRecord> {
    normalizeActor(
      input
    );

    const updated =
      await resolved.updateOrganizationProfile(
        normalizeOrganizationUpdate(
          input
        )
      );

    if (!updated) {
      throw new ClientAccountConflictError();
    }

    return updated;
  }

  return {
    async getAccount(
      actor
    ) {
      return await getAccountSnapshot(
        actor
      );
    },

    async getCurrentOrganization(
      actor
    ) {
      const snapshot =
        await getAccountSnapshot(
          actor
        );

      return snapshot.organization;
    },

    async updateCurrentOrganization(
      input
    ) {
      return await updateOrganization(
        input
      );
    },

    async updateAccount(
      input
    ) {
      const actor =
        normalizeActor(
          input
        );

      const user =
        await resolved.findUserById(
          actor.userId
        );

      if (!user) {
        throw new ClientAccountNotFoundError();
      }

      const organization =
        await updateOrganization({
          ...input.organization,
          userId:
            actor.userId,
          organizationId:
            actor.organizationId,
        });

      return {
        user,
        organization,
      };
    },
  };
}