import {
  commercialRequests,
} from "../monetization.mock";

import type {
  CommercialRequest,
} from "../monetization.types";

import type {
  CommercialRequestDetail,
  CommercialRequestGateway,
} from "./commercial-request.types";

function cloneRequest(
  request:
    CommercialRequest
): CommercialRequest {
  return {
    ...request,

    requestedPlacements: [
      ...request.requestedPlacements,
    ],

    creative: {
      ...request.creative,
    },
  };
}

export function createMockCommercialRequestGateway():
  CommercialRequestGateway {
  let requests =
    commercialRequests.map(
      cloneRequest
    );

  const details =
    new Map<
      string,
      CommercialRequestDetail
    >(
      requests.map(
        (
          request
        ) => [
          request.id,
          {
            request,

            revisions: [
              {
                id:
                  `${request.id}-revision-1`,

                revisionNumber:
                  1,

                submittedBy:
                  request.contactName,

                submittedAt:
                  request.submittedAt,

                summary:
                  "Initial advertising request submitted for Poster review.",
              },
            ],
          },
        ]
      )
    );

  function replaceRequest(
    requestId:
      string,
    update:
      (
        current:
          CommercialRequest
      ) => CommercialRequest
  ): CommercialRequest {
    const current =
      requests.find(
        (
          request
        ) =>
          request.id ===
          requestId
      );

    if (!current) {
      throw new Error(
        "Advertising request was not found."
      );
    }

    const updated =
      update(
        current
      );

    requests =
      requests.map(
        (
          request
        ) =>
          request.id ===
          requestId
            ? updated
            : request
      );

    const detail =
      details.get(
        requestId
      );

    if (detail) {
      details.set(
        requestId,
        {
          ...detail,

          request:
            updated,
        }
      );
    }

    return cloneRequest(
      updated
    );
  }

  return {
    async list(
      input
    ) {
      const query =
        input.query
          .trim()
          .toLowerCase();

      return requests
        .filter(
          (
            request
          ) => {
            if (
              input.status !==
                "all" &&
              request.status !==
                input.status
            ) {
              return false;
            }

            if (
              input.type !==
                "all" &&
              request.type !==
                input.type
            ) {
              return false;
            }

            if (!query) {
              return true;
            }

            return [
              request.id,
              request.organization,
              request.campaignName,
              request.businessEmail,
              request.website,
            ].some(
              (
                value
              ) =>
                value
                  .toLowerCase()
                  .includes(
                    query
                  )
            );
          }
        )
        .map(
          cloneRequest
        );
    },

    async get(
      requestId
    ) {
      const detail =
        details.get(
          requestId
        );

      if (!detail) {
        return null;
      }

      return {
        request:
          cloneRequest(
            detail.request
          ),

        revisions:
          detail.revisions.map(
            (
              revision
            ) => ({
              ...revision,
            })
          ),
      };
    },

    async requestChanges(
      input
    ) {
      return replaceRequest(
        input.requestId,
        (
          current
        ) => ({
          ...current,

          status:
            "changes_requested",

          reviewNote:
            input.note,
        })
      );
    },

    async reject(
      input
    ) {
      return replaceRequest(
        input.requestId,
        (
          current
        ) => ({
          ...current,

          status:
            "rejected",

          reviewNote:
            input.note,
        })
      );
    },

    async approve(
      input
    ) {
      return replaceRequest(
        input.requestId,
        (
          current
        ) => ({
          ...current,

          status:
            "approved",

          campaignName:
            input.campaignName,

          linkedCampaignId:
            current.linkedCampaignId ??
            `CMP-${Date.now()
              .toString()
              .slice(
                -6
              )}`,

          reviewNote:
            input.note ||
            undefined,
        })
      );
    },
  };
}
