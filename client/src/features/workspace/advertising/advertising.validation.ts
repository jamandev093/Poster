import type {
  AdvertisingCampaign,
  AdvertisingRequest,
  AdvertisingRequestVersion,
  CampaignBillingConfiguration,
  CampaignPlacementAllocation,
  PlacementSurface,
} from "./advertising.types";

export interface AdvertisingValidationResult {
  valid: boolean;

  errors: string[];
}

const ISO_DATE_PATTERN =
  /^\d{4}-\d{2}-\d{2}$/;

const ISO_DATE_TIME_PATTERN =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/;

const SUPPORTED_CURRENCIES =
  new Set([
    "INR",
    "USD",
  ]);

const SUPPORTED_PLACEMENTS =
  new Set<PlacementSurface>([
    "home",
    "search",
    "trending",
  ]);

function isNonEmptyString(
  value: string
): boolean {
  return value.trim().length > 0;
}

function isValidUrl(
  value: string
): boolean {
  try {
    const url =
      new URL(value);

    return (
      url.protocol === "https:" ||
      url.protocol === "http:"
    );
  } catch {
    return false;
  }
}

function isValidEmail(
  value: string
): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
    value.trim()
  );
}

function isValidDate(
  value: string
): boolean {
  if (
    !ISO_DATE_PATTERN.test(
      value
    )
  ) {
    return false;
  }

  const date =
    new Date(
      `${value}T00:00:00Z`
    );

  return !Number.isNaN(
    date.getTime()
  );
}

function isValidDateTime(
  value: string
): boolean {
  if (
    !ISO_DATE_TIME_PATTERN.test(
      value
    )
  ) {
    return false;
  }

  return !Number.isNaN(
    new Date(value).getTime()
  );
}

function isValidMinorAmount(
  value:
    number |
    undefined
): boolean {
  if (
    value === undefined
  ) {
    return true;
  }

  return (
    Number.isSafeInteger(
      value
    ) &&
    value >= 0
  );
}

function validateCurrency(
  currency: string
): string[] {
  const errors:
    string[] = [];

  if (
    !SUPPORTED_CURRENCIES.has(
      currency
    )
  ) {
    errors.push(
      `Unsupported currency: ${currency}.`
    );
  }

  return errors;
}

function validateRequestVersion(
  version:
    AdvertisingRequestVersion
): string[] {
  const errors:
    string[] = [];

  if (
    !Number.isSafeInteger(
      version.version
    ) ||
    version.version <= 0
  ) {
    errors.push(
      "Request version must be a positive integer."
    );
  }

  if (
    !isValidDateTime(
      version.submittedAt
    )
  ) {
    errors.push(
      `Request version ${version.version} has an invalid submission timestamp.`
    );
  }

  if (
    !isNonEmptyString(
      version.submittedBy.actorId
    )
  ) {
    errors.push(
      `Request version ${version.version} requires a submitting actor ID.`
    );
  }

  if (
    !isNonEmptyString(
      version.creativeVersionId
    )
  ) {
    errors.push(
      `Request version ${version.version} requires a creative version ID.`
    );
  }

  return errors;
}

function validateRequestVersions(
  request:
    AdvertisingRequest
): string[] {
  const errors:
    string[] = [];

  if (
    request.versions.length ===
    0
  ) {
    errors.push(
      "Advertising request requires at least one submitted version."
    );

    return errors;
  }

  const versionNumbers =
    request.versions.map(
      (
        version
      ) =>
        version.version
    );

  const uniqueVersions =
    new Set(
      versionNumbers
    );

  if (
    uniqueVersions.size !==
    versionNumbers.length
  ) {
    errors.push(
      "Advertising request versions must be unique."
    );
  }

  const sortedVersions =
    [
      ...versionNumbers,
    ].sort(
      (
        first,
        second
      ) =>
        first -
        second
    );

  sortedVersions.forEach(
    (
      version,
      index
    ) => {
      const expected =
        index +
        1;

      if (
        version !==
        expected
      ) {
        errors.push(
          "Advertising request versions must be sequential and start at 1."
        );
      }
    }
  );

  request.versions.forEach(
    (
      version
    ) => {
      errors.push(
        ...validateRequestVersion(
          version
        )
      );
    }
  );

  const latestVersion =
    Math.max(
      ...versionNumbers
    );

  if (
    request.currentVersion !==
    latestVersion
  ) {
    errors.push(
      "Current request version must match the latest submitted version."
    );
  }

  if (
    request.approvedVersion !==
      undefined &&
    !uniqueVersions.has(
      request.approvedVersion
    )
  ) {
    errors.push(
      "Approved request version must reference an existing version."
    );
  }

  return errors;
}

function validatePlacements(
  placements:
    PlacementSurface[]
): string[] {
  const errors:
    string[] = [];

  if (
    placements.length ===
    0
  ) {
    errors.push(
      "At least one advertising placement is required."
    );

    return errors;
  }

  const uniquePlacements =
    new Set(
      placements
    );

  if (
    uniquePlacements.size !==
    placements.length
  ) {
    errors.push(
      "Advertising placements must not contain duplicates."
    );
  }

  placements.forEach(
    (
      placement
    ) => {
      if (
        !SUPPORTED_PLACEMENTS.has(
          placement
        )
      ) {
        errors.push(
          `Unsupported advertising placement: ${placement}.`
        );
      }
    }
  );

  return errors;
}

export function validateAdvertisingRequest(
  request:
    AdvertisingRequest
): AdvertisingValidationResult {
  const errors:
    string[] = [];

  if (
    !request.id.startsWith(
      "ADV-"
    )
  ) {
    errors.push(
      "Advertising request ID must start with ADV-."
    );
  }

  if (
    !request.organizationId.startsWith(
      "ORG-"
    )
  ) {
    errors.push(
      "Organization ID must start with ORG-."
    );
  }

  if (
    !isNonEmptyString(
      request.organizationName
    )
  ) {
    errors.push(
      "Organization name is required."
    );
  }

  if (
    !isNonEmptyString(
      request.campaignName
    )
  ) {
    errors.push(
      "Campaign name is required."
    );
  }

  if (
    !isNonEmptyString(
      request.contactName
    )
  ) {
    errors.push(
      "Contact name is required."
    );
  }

  if (
    !isValidEmail(
      request.businessEmail
    )
  ) {
    errors.push(
      "A valid business email is required."
    );
  }

  if (
    !isValidUrl(
      request.website
    )
  ) {
    errors.push(
      "A valid organization website URL is required."
    );
  }

  errors.push(
    ...validatePlacements(
      request.requestedPlacements
    )
  );

  if (
    !isValidDate(
      request.requestedStartDate
    )
  ) {
    errors.push(
      "Requested start date is invalid."
    );
  }

  if (
    !isValidDate(
      request.requestedEndDate
    )
  ) {
    errors.push(
      "Requested end date is invalid."
    );
  }

  if (
    isValidDate(
      request.requestedStartDate
    ) &&
    isValidDate(
      request.requestedEndDate
    ) &&
    request.requestedEndDate <
      request.requestedStartDate
  ) {
    errors.push(
      "Requested end date must not be earlier than the start date."
    );
  }

  errors.push(
    ...validateCurrency(
      request.currency
    )
  );

  if (
    !isValidMinorAmount(
      request.proposedBudgetMinor
    )
  ) {
    errors.push(
      "Proposed budget must be a non-negative integer in minor currency units."
    );
  }

  if (
    !isValidMinorAmount(
      request.proposedContractValueMinor
    )
  ) {
    errors.push(
      "Proposed contract value must be a non-negative integer in minor currency units."
    );
  }

  if (
    request.type ===
      "direct_sponsorship" &&
    request.proposedContractValueMinor ===
      undefined &&
    request.proposedBudgetMinor ===
      undefined
  ) {
    errors.push(
      "Direct sponsorship requires a proposed contract value or budget."
    );
  }

  if (
    request.type ===
      "affiliate"
  ) {
    if (
      !request.commissionModel?.trim()
    ) {
      errors.push(
        "Affiliate request requires a commission model."
      );
    }

    if (
      !request.conversionDefinition?.trim()
    ) {
      errors.push(
        "Affiliate request requires a conversion definition."
      );
    }
  }

  if (
    !request.rightsConfirmed
  ) {
    errors.push(
      "Advertiser must confirm rights to the submitted creative."
    );
  }

  if (
    !isValidDateTime(
      request.createdAt
    )
  ) {
    errors.push(
      "Advertising request creation timestamp is invalid."
    );
  }

  if (
    !isValidDateTime(
      request.updatedAt
    )
  ) {
    errors.push(
      "Advertising request update timestamp is invalid."
    );
  }

  if (
    request.approvedAt &&
    !isValidDateTime(
      request.approvedAt
    )
  ) {
    errors.push(
      "Advertising request approval timestamp is invalid."
    );
  }

  if (
    request.approvalExpiresAt &&
    !isValidDateTime(
      request.approvalExpiresAt
    )
  ) {
    errors.push(
      "Advertising request approval expiry timestamp is invalid."
    );
  }

  errors.push(
    ...validateRequestVersions(
      request
    )
  );

  return {
    valid:
      errors.length ===
      0,

    errors,
  };
}

function validateCampaignBilling(
  billing:
    CampaignBillingConfiguration
): string[] {
  const errors:
    string[] = [];

  errors.push(
    ...validateCurrency(
      billing.currency
    )
  );

  const moneyFields = [
    {
      label:
        "approved rate",
      value:
        billing.approvedRateMinor,
    },
    {
      label:
        "budget",
      value:
        billing.budgetMinor,
    },
    {
      label:
        "contract value",
      value:
        billing.contractValueMinor,
    },
    {
      label:
        "spend limit",
      value:
        billing.spendLimitMinor,
    },
  ];

  moneyFields.forEach(
    (
      field
    ) => {
      if (
        !isValidMinorAmount(
          field.value
        )
      ) {
        errors.push(
          `Campaign ${field.label} must be a non-negative integer in minor currency units.`
        );
      }
    }
  );

  if (
    (
      billing.model ===
        "cpc" ||
      billing.model ===
        "cpm" ||
      billing.model ===
        "cpa"
    ) &&
    billing.approvedRateMinor ===
      undefined
  ) {
    errors.push(
      `${billing.model.toUpperCase()} billing requires an approved rate.`
    );
  }

  if (
    billing.model ===
      "fixed_contract" &&
    billing.contractValueMinor ===
      undefined
  ) {
    errors.push(
      "Fixed-contract billing requires a contract value."
    );
  }

  if (
    billing.model ===
      "affiliate" &&
    !billing.conversionDefinition?.trim()
  ) {
    errors.push(
      "Affiliate billing requires a conversion definition."
    );
  }

  if (
    billing.deliveryTarget !==
      undefined &&
    (
      !Number.isSafeInteger(
        billing.deliveryTarget
      ) ||
      billing.deliveryTarget <
        0
    )
  ) {
    errors.push(
      "Campaign delivery target must be a non-negative integer."
    );
  }

  return errors;
}

function validatePlacementAllocation(
  placement:
    CampaignPlacementAllocation
): string[] {
  const errors:
    string[] = [];

  if (
    !isNonEmptyString(
      placement.placementId
    )
  ) {
    errors.push(
      "Campaign placement requires an ID."
    );
  }

  if (
    !SUPPORTED_PLACEMENTS.has(
      placement.surface
    )
  ) {
    errors.push(
      `Unsupported campaign placement surface: ${placement.surface}.`
    );
  }

  if (
    !isNonEmptyString(
      placement.creativeVersionId
    )
  ) {
    errors.push(
      "Campaign placement requires a creative version ID."
    );
  }

  if (
    placement.allocationPercentage !==
      undefined &&
    (
      !Number.isFinite(
        placement.allocationPercentage
      ) ||
      placement.allocationPercentage <
        0 ||
      placement.allocationPercentage >
        100
    )
  ) {
    errors.push(
      "Placement allocation percentage must be between 0 and 100."
    );
  }

  if (
    placement.priority !==
      undefined &&
    (
      !Number.isSafeInteger(
        placement.priority
      ) ||
      placement.priority <
        0
    )
  ) {
    errors.push(
      "Placement priority must be a non-negative integer."
    );
  }

  if (
    placement.startAt &&
    !isValidDateTime(
      placement.startAt
    )
  ) {
    errors.push(
      "Placement start timestamp is invalid."
    );
  }

  if (
    placement.endAt &&
    !isValidDateTime(
      placement.endAt
    )
  ) {
    errors.push(
      "Placement end timestamp is invalid."
    );
  }

  if (
    placement.startAt &&
    placement.endAt &&
    isValidDateTime(
      placement.startAt
    ) &&
    isValidDateTime(
      placement.endAt
    ) &&
    placement.endAt <
      placement.startAt
  ) {
    errors.push(
      "Placement end timestamp must not be earlier than its start timestamp."
    );
  }

  return errors;
}

export function validateAdvertisingCampaign(
  campaign:
    AdvertisingCampaign
): AdvertisingValidationResult {
  const errors:
    string[] = [];

  if (
    !campaign.id.startsWith(
      "CMP-"
    )
  ) {
    errors.push(
      "Campaign ID must start with CMP-."
    );
  }

  if (
    !campaign.requestId.startsWith(
      "ADV-"
    )
  ) {
    errors.push(
      "Campaign request ID must start with ADV-."
    );
  }

  if (
    !campaign.organizationId.startsWith(
      "ORG-"
    )
  ) {
    errors.push(
      "Campaign organization ID must start with ORG-."
    );
  }

  if (
    !Number.isSafeInteger(
      campaign.approvedRequestVersion
    ) ||
    campaign.approvedRequestVersion <=
      0
  ) {
    errors.push(
      "Campaign must reference a positive approved request version."
    );
  }

  if (
    !isNonEmptyString(
      campaign.name
    )
  ) {
    errors.push(
      "Campaign name is required."
    );
  }

  if (
    !isValidUrl(
      campaign.destinationUrl
    )
  ) {
    errors.push(
      "Campaign requires a valid destination URL."
    );
  }

  if (
    !isValidDateTime(
      campaign.scheduledStartAt
    )
  ) {
    errors.push(
      "Campaign scheduled start timestamp is invalid."
    );
  }

  if (
    !isValidDateTime(
      campaign.scheduledEndAt
    )
  ) {
    errors.push(
      "Campaign scheduled end timestamp is invalid."
    );
  }

  if (
    isValidDateTime(
      campaign.scheduledStartAt
    ) &&
    isValidDateTime(
      campaign.scheduledEndAt
    ) &&
    campaign.scheduledEndAt <
      campaign.scheduledStartAt
  ) {
    errors.push(
      "Campaign scheduled end must not be earlier than its start."
    );
  }

  if (
    !isNonEmptyString(
      campaign.approvedCreativeVersionId
    )
  ) {
    errors.push(
      "Campaign requires an approved creative version ID."
    );
  }

  if (
    campaign.placements.length ===
    0
  ) {
    errors.push(
      "Campaign requires at least one placement allocation."
    );
  }

  const placementIds =
    campaign.placements.map(
      (
        placement
      ) =>
        placement.placementId
    );

  if (
    new Set(
      placementIds
    ).size !==
    placementIds.length
  ) {
    errors.push(
      "Campaign placement IDs must be unique."
    );
  }

  campaign.placements.forEach(
    (
      placement
    ) => {
      errors.push(
        ...validatePlacementAllocation(
          placement
        )
      );
    }
  );

  const allocationTotal =
    campaign.placements.reduce(
      (
        total,
        placement
      ) =>
        total +
        (
          placement.allocationPercentage ??
          0
        ),
      0
    );

  const hasAllocations =
    campaign.placements.some(
      (
        placement
      ) =>
        placement.allocationPercentage !==
        undefined
    );

  if (
    hasAllocations &&
    Math.abs(
      allocationTotal -
      100
    ) >
      0.001
  ) {
    errors.push(
      "Campaign placement allocation percentages must total 100."
    );
  }

  errors.push(
    ...validateCampaignBilling(
      campaign.billing
    )
  );

  if (
    !isNonEmptyString(
      campaign.createdBy.actorId
    )
  ) {
    errors.push(
      "Campaign requires a creating actor ID."
    );
  }

  if (
    !isValidDateTime(
      campaign.createdAt
    )
  ) {
    errors.push(
      "Campaign creation timestamp is invalid."
    );
  }

  if (
    !isValidDateTime(
      campaign.updatedAt
    )
  ) {
    errors.push(
      "Campaign update timestamp is invalid."
    );
  }

  return {
    valid:
      errors.length ===
      0,

    errors,
  };
}
