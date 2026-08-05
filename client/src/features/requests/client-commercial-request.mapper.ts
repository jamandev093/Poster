import type {
  CommercialCreative,
  CommercialRequest,
  CommercialRequestType,
} from "@/features/workspace/workspace.types";

import type {
  ClientCommercialRequestApiRecord,
  ClientCommercialRequestJsonObject,
  ClientCommercialRequestPlacement,
} from "./client-commercial-request.service";

function isRecord(
  value:
    unknown
): value is Record<string, unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(
      value
    )
  );
}

function getString(
  source:
    Record<string, unknown>,

  key:
    string,

  fallback:
    string =
      ""
): string {
  const value =
    source[key];

  return typeof value === "string"
    ? value
    : fallback;
}

function getBoolean(
  source:
    Record<string, unknown>,

  key:
    string,

  fallback:
    boolean =
      false
): boolean {
  const value =
    source[key];

  return typeof value === "boolean"
    ? value
    : fallback;
}

function getNumber(
  source:
    Record<string, unknown>,

  key:
    string
): number | undefined {
  const value =
    source[key];

  if (
    typeof value === "number" &&
    Number.isFinite(
      value
    )
  ) {
    return value;
  }

  return undefined;
}

function minorToMajor(
  value:
    number |
    null |
    undefined
): number | undefined {
  if (
    value === null ||
    value === undefined ||
    !Number.isFinite(
      value
    )
  ) {
    return undefined;
  }

  return Math.round(
    value
  ) / 100;
}

function getCreativeSpec(
  request:
    ClientCommercialRequestApiRecord
): ClientCommercialRequestJsonObject {
  return isRecord(
    request.creativeSpec
  )
    ? request.creativeSpec
    : {};
}

function getCommercialTerms(
  request:
    ClientCommercialRequestApiRecord
): ClientCommercialRequestJsonObject {
  return isRecord(
    request.commercialTerms
  )
    ? request.commercialTerms
    : {};
}

function mapRequestType(
  request:
    ClientCommercialRequestApiRecord
): CommercialRequestType {
  return (
    request.requestType ??
    request.type ??
    "direct_sponsorship"
  ) as CommercialRequestType;
}

function mapRequestedPlacements(
  request:
    ClientCommercialRequestApiRecord
): ClientCommercialRequestPlacement[] {
  return Array.isArray(
    request.requestedPlacements
  )
    ? request.requestedPlacements
    : [];
}

function mapCreative(
  request:
    ClientCommercialRequestApiRecord
): CommercialCreative {
  const creativeSpec =
    getCreativeSpec(
      request
    );

  const destinationUrl =
    request.destinationUrl ??
    getString(
      creativeSpec,
      "destinationUrl"
    );

  const creative = {
    layout:
      getString(
        creativeSpec,
        "layout",
        "standard"
      ),

    headline:
      getString(
        creativeSpec,
        "headline",
        request.title ??
          request.campaignName ??
          ""
      ),

    body:
      getString(
        creativeSpec,
        "body",
        request.objective ??
          ""
      ),

    callToAction:
      getString(
        creativeSpec,
        "callToAction",
        "Learn more"
      ),

    destinationUrl,

    primaryMedia:
      isRecord(
        creativeSpec.primaryMedia
      )
        ? creativeSpec.primaryMedia
        : undefined,

    logoMedia:
      isRecord(
        creativeSpec.logoMedia
      )
        ? creativeSpec.logoMedia
        : undefined,

    slidingCards:
      Array.isArray(
        creativeSpec.slidingCards
      )
        ? creativeSpec.slidingCards
        : undefined,
  };

  return creative as unknown as CommercialCreative;
}

export function canEditClientCommercialRequest(
  request:
    ClientCommercialRequestApiRecord
): boolean {
  return request.status ===
    "changes_requested";
}

export function mapClientCommercialRequestToCommercialRequest(
  request:
    ClientCommercialRequestApiRecord
): CommercialRequest {
  const commercialTerms =
    getCommercialTerms(
      request
    );

  const proposedBudgetMinor =
    request.budgetMinorUnits ??
    getNumber(
      commercialTerms,
      "proposedBudgetMinor"
    );

  const proposedContractValueMinor =
    getNumber(
      commercialTerms,
      "proposedContractValueMinor"
    );

  const mappedRequest = {
    id:
      request.id,

    type:
      mapRequestType(
        request
      ),

    status:
      request.status,

    campaignName:
      request.campaignName ??
      request.title ??
      "Untitled request",

    organizationName:
      getString(
        commercialTerms,
        "organizationName"
      ),

    contactName:
      getString(
        commercialTerms,
        "contactName"
      ),

    businessEmail:
      getString(
        commercialTerms,
        "businessEmail"
      ),

    website:
      getString(
        commercialTerms,
        "website"
      ),

    destinationUrl:
      request.destinationUrl ??
      getString(
        getCreativeSpec(
          request
        ),
        "destinationUrl"
      ),

    requestedPlacements:
      mapRequestedPlacements(
        request
      ),

    requestedStartDate:
      request.requestedStartDate ??
      "",

    requestedEndDate:
      request.requestedEndDate ??
      "",

    proposedBudget:
      minorToMajor(
        proposedBudgetMinor
      ),

    proposedContractValue:
      minorToMajor(
        proposedContractValueMinor
      ),

    commissionModel:
      getString(
        commercialTerms,
        "commissionModel"
      ),

    conversionDefinition:
      getString(
        commercialTerms,
        "conversionDefinition"
      ),

    campaignAllowanceAccepted:
      getBoolean(
        commercialTerms,
        "campaignAllowanceAccepted",
        true
      ),

    rightsConfirmed:
      true,

    creative:
      mapCreative(
        request
      ),

    review:
      {
        requestedChanges:
          [],

        reviewNote:
          getString(
            commercialTerms,
            "reviewNote"
          ),
      },

    linkedCampaignId:
      request.linkedCampaignId ??
      undefined,

    submittedAt:
      request.submittedAt,

    createdAt:
      request.createdAt,

    updatedAt:
      request.updatedAt,
  };

  return mappedRequest as unknown as CommercialRequest;
}