import type {
  CommercialRequest,
  CommercialCreative,
} from "../monetization.types";

import {
  approveCommercialRequest,
  getCommercialRequest,
  listCommercialRequests,
  rejectCommercialRequest,
  requestCommercialRequestChanges,
  type CommercialRequestRecord,
  type CommercialRequestRevisionRecord,
  type MonetizationCampaignRecord,
} from "./commercial-request-api";

import type {
  CommercialRequestDetail,
  CommercialRequestGateway,
  CommercialRequestListInput,
} from "./commercial-request.types";

function readString(
  record:
    Record<string, unknown>,
  key: string
): string | null {
  const value =
    record[key];

  return typeof value ===
    "string"
    ? value
    : null;
}

function readBoolean(
  record:
    Record<string, unknown>,
  key: string
): boolean | null {
  const value =
    record[key];

  return typeof value ===
    "boolean"
    ? value
    : null;
}

function readOptionalNumber(
  value:
    string |
    null
): number | undefined {
  if (
    value === null
  ) {
    return undefined;
  }

  const parsed =
    Number(
      value
    );

  if (
    !Number.isSafeInteger(
      parsed
    )
  ) {
    return undefined;
  }

  return parsed / 100;
}

function mapCreative(
  request:
    CommercialRequestRecord
): CommercialCreative {
  const creative =
    request.creativeSpec;

  return {
    headline:
      readString(
        creative,
        "headline"
      ) ??
      request.title,

    body:
      readString(
        creative,
        "body"
      ) ??
      request.objective,

    callToAction:
      readString(
        creative,
        "callToAction"
      ) ??
      "Learn more",

    destinationUrl:
      readString(
        creative,
        "destinationUrl"
      ) ??
      request.destinationUrl,

    imageName:
      readString(
        creative,
        "imageName"
      ) ??
      undefined,

    logoName:
      readString(
        creative,
        "logoName"
      ) ??
      undefined,
  };
}

function mapRequest(
  request:
    CommercialRequestRecord,
  campaign?:
    MonetizationCampaignRecord |
    null
): CommercialRequest {
  const terms =
    request.commercialTerms;

  const proposedAmount =
    readOptionalNumber(
      request.budgetMinorUnits
    );

  return {
    id:
      request.id,

    type:
      request.requestType,

    status:
      request.status,

    organization:
      readString(
        terms,
        "organizationName"
      ) ??
      request.organizationId,

    contactName:
      readString(
        terms,
        "contactName"
      ) ??
      request.submittedByUserId,

    businessEmail:
      readString(
        terms,
        "businessEmail"
      ) ??
      "Not supplied",

    website:
      readString(
        terms,
        "website"
      ) ??
      request.destinationUrl,

    campaignName:
      campaign?.name ??
      request.title,

    submittedAt:
      request.submittedAt,

    requestedPlacements:
      [
        ...request.requestedPlacements,
      ],

    requestedStartDate:
      request.requestedStartDate,

    requestedEndDate:
      request.requestedEndDate,

    proposedBudget:
      request.requestType ===
      "affiliate"
        ? proposedAmount
        : undefined,

    proposedContractValue:
      request.requestType ===
      "direct_sponsorship"
        ? proposedAmount
        : undefined,

    commissionModel:
      readString(
        terms,
        "commissionModel"
      ) ??
      undefined,

    conversionDefinition:
      readString(
        terms,
        "conversionDefinition"
      ) ??
      undefined,

    rightsConfirmed:
      readBoolean(
        terms,
        "rightsConfirmed"
      ) ??
      false,

    creative:
      mapCreative(
        request
      ),

    linkedCampaignId:
      campaign
        ?.campaignReference,

    reviewNote:
      request.decisionNote ??
      undefined,
  };
}

function summarizeRevision(
  revision:
    CommercialRequestRevisionRecord
): string {
  const title =
    readString(
      revision.payload,
      "title"
    );

  const objective =
    readString(
      revision.payload,
      "objective"
    );

  if (
    title &&
    objective
  ) {
    return `${title}: ${objective}`;
  }

  if (
    objective
  ) {
    return objective;
  }

  if (
    title
  ) {
    return title;
  }

  return `Advertising request revision ${revision.revisionNumber}.`;
}

function mapDetail(
  request:
    CommercialRequestRecord,
  revisions:
    CommercialRequestRevisionRecord[]
): CommercialRequestDetail {
  return {
    request:
      mapRequest(
        request
      ),

    revisions:
      revisions.map(
        revision => ({
          id:
            revision.id,

          revisionNumber:
            revision.revisionNumber,

          submittedBy:
            revision.submittedByUserId,

          submittedAt:
            revision.createdAt,

          summary:
            summarizeRevision(
              revision
            ),
        })
      ),
  };
}

function matchesQuery(
  request:
    CommercialRequestRecord,
  query: string
): boolean {
  const normalized =
    query
      .trim()
      .toLowerCase();

  if (
    !normalized
  ) {
    return true;
  }

  const terms =
    request.commercialTerms;

  return [
    request.id,
    request.requestReference,
    request.organizationId,
    request.title,
    request.destinationUrl,

    readString(
      terms,
      "organizationName"
    ),

    readString(
      terms,
      "businessEmail"
    ),

    readString(
      terms,
      "website"
    ),
  ]
    .filter(
      (
        value
      ): value is string =>
        typeof value ===
        "string"
    )
    .some(
      value =>
        value
          .toLowerCase()
          .includes(
            normalized
          )
    );
}

export function createApiCommercialRequestGateway():
  CommercialRequestGateway {
  const records =
    new Map<
      string,
      CommercialRequestRecord
    >();

  const remember =
    (
      request:
        CommercialRequestRecord
    ): CommercialRequestRecord => {
      records.set(
        request.id,
        request
      );

      return request;
    };

  const getCurrent =
    async (
      requestId: string
    ): Promise<CommercialRequestRecord> => {
      const cached =
        records.get(
          requestId
        );

      if (
        cached
      ) {
        return cached;
      }

      const details =
        await getCommercialRequest(
          requestId
        );

      return remember(
        details.request
      );
    };

  const requireDecisionNote =
    (
      note: string
    ): string => {
      const normalized =
        note.trim();

      if (
        normalized.length ===
        0
      ) {
        throw new Error(
          "A review note is required for this decision."
        );
      }

      return normalized;
    };

  return {
    async list(
      input:
        CommercialRequestListInput
    ) {
      const response =
        await listCommercialRequests({
          status:
            input.status ===
            "all"
              ? null
              : input.status,

          requestType:
            input.type ===
            "all"
              ? null
              : input.type,

          limit:
            100,

          offset:
            0,
        });

      response.items.forEach(
        remember
      );

      return response.items
        .filter(
          request =>
            matchesQuery(
              request,
              input.query
            )
        )
        .map(
          request =>
            mapRequest(
              request
            )
        );
    },

    async get(
      requestId
    ) {
      try {
        const response =
          await getCommercialRequest(
            requestId
          );

        remember(
          response.request
        );

        return mapDetail(
          response.request,
          response.revisions
        );
      } catch (
        error
      ) {
        if (
          error instanceof
            Error &&
          error.message ===
            "The advertising request was not found."
        ) {
          return null;
        }

        throw error;
      }
    },

    async requestChanges(
      input
    ) {
      const current =
        await getCurrent(
          input.requestId
        );

      const response =
        await requestCommercialRequestChanges(
          current.id,
          {
            expectedRowVersion:
              current.rowVersion,

            decisionNote:
              requireDecisionNote(
                input.note
              ),
          }
        );

      remember(
        response.request
      );

      return mapRequest(
        response.request
      );
    },

    async reject(
      input
    ) {
      const current =
        await getCurrent(
          input.requestId
        );

      const response =
        await rejectCommercialRequest(
          current.id,
          {
            expectedRowVersion:
              current.rowVersion,

            decisionNote:
              requireDecisionNote(
                input.note
              ),
          }
        );

      remember(
        response.request
      );

      return mapRequest(
        response.request
      );
    },

    async approve(
      input
    ) {
      const current =
        await getCurrent(
          input.requestId
        );

      const campaignName =
        input.campaignName
          .trim();

      if (
        campaignName.length ===
        0
      ) {
        throw new Error(
          "A campaign name is required before approval."
        );
      }

      const response =
        await approveCommercialRequest(
          current.id,
          {
            expectedRowVersion:
              current.rowVersion,

            decisionNote:
              input.note.trim() ||
              null,

            campaignName,
          }
        );

      remember(
        response.request
      );

      return mapRequest(
        response.request,
        response.campaign
      );
    },
  };
}