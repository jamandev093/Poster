import type {
  DatabaseQueryExecutor,
} from "../../database/database.pool.js";

import {
  normalizePosterPromotionCreative,
  validatePosterPromotionCreative,
} from "../../domains/monetization/poster-promotion.validation.js";

import type {
  CampaignCommercialStatus,
  CampaignReadinessStatus,
  CampaignStatus,
  MonetizationCampaignRecord,
  MonetizationPlacement,

  PosterPromotionMediaReference,
  PosterPromotionRecord,
  PosterPromotionRepository,
} from "../../domains/monetization/index.js";

import {
  createPosterPromotionValidationError,
  PosterPromotionError,
} from "./poster-promotion.errors.js";

export type PosterPromotionSaveMode =
  | "draft"
  | "schedule";

export interface CreatePosterPromotionInput {
  actorUserId:
    string;

  organizationId:
    string;

  campaignReference:
    string;

  name:
    string;

  placements:
    readonly MonetizationPlacement[];

  scheduledStartDate:
    string;

  scheduledEndDate:
    string;

  mode:
    PosterPromotionSaveMode;

  purpose:
    string;

  headline:
    string;

  body:
    string;

  callToAction:
    string;

  destinationUrl:
    string;

  media:
    PosterPromotionMediaReference |
    null;
}

export interface UpdatePosterPromotionInput {
  campaignId:
    string;

  actorUserId:
    string;

  expectedCampaignRowVersion:
    string;

  expectedCreativeRowVersion:
    string;

  name:
    string;

  placements:
    readonly MonetizationPlacement[];

  scheduledStartDate:
    string;

  scheduledEndDate:
    string;

  mode:
    PosterPromotionSaveMode;

  purpose:
    string;

  headline:
    string;

  body:
    string;

  callToAction:
    string;

  destinationUrl:
    string;

  media:
    PosterPromotionMediaReference |
    null;
}

export interface CreatePosterPromotionCampaignInput {
  actorUserId:
    string;

  organizationId:
    string;

  campaignReference:
    string;

  name:
    string;

  placements:
    readonly MonetizationPlacement[];

  scheduledStartDate:
    string;

  scheduledEndDate:
    string;

  status:
    Extract<
      CampaignStatus,
      "draft" |
      "scheduled"
    >;

  readinessStatus:
    CampaignReadinessStatus;

  commercialStatus:
    CampaignCommercialStatus;

  createdAt:
    Date;
}

export interface UpdatePosterPromotionCampaignInput {
  campaignId:
    string;

  expectedRowVersion:
    string;

  name:
    string;

  placements:
    readonly MonetizationPlacement[];

  scheduledStartDate:
    string;

  scheduledEndDate:
    string;

  status:
    Extract<
      CampaignStatus,
      "draft" |
      "scheduled"
    >;

  updatedAt:
    Date;
}

export type UpdatePosterPromotionCampaignResult =
  | {
      status:
        "updated";

      campaign:
        MonetizationCampaignRecord;
    }
  | {
      status:
        "conflict";

      campaign:
        MonetizationCampaignRecord;
    }
  | {
      status:
        "not_found";
    };

export interface PosterPromotionAuditInput {
  actorUserId:
    string;

  action:
    string;

  entityType:
    "poster_promotion";

  entityId:
    string;

  metadata:
    Record<
      string,
      unknown
    >;

  occurredAt:
    Date;
}

export interface AdminPosterPromotionServiceDependencies {
  runTransaction:
    <TResult>(
      operation:
        (
          executor:
            DatabaseQueryExecutor
        ) =>
          Promise<TResult>
    ) =>
      Promise<TResult>;

  findCampaign:
    (
      campaignId:
        string,
      executor?:
        DatabaseQueryExecutor
    ) =>
      Promise<
        MonetizationCampaignRecord |
        null
      >;

  createCampaign:
    (
      input:
        CreatePosterPromotionCampaignInput,
      executor:
        DatabaseQueryExecutor
    ) =>
      Promise<
        MonetizationCampaignRecord
      >;

  updateCampaign:
    (
      input:
        UpdatePosterPromotionCampaignInput,
      executor:
        DatabaseQueryExecutor
    ) =>
      Promise<
        UpdatePosterPromotionCampaignResult
      >;

  promotionRepository:
    PosterPromotionRepository;

  createAuditEntry:
    (
      input:
        PosterPromotionAuditInput,
      executor:
        DatabaseQueryExecutor
    ) =>
      Promise<void>;

  now:
    () =>
      Date;
}

export interface AdminPosterPromotionService {
  get:
    (
      campaignId:
        string
    ) =>
      Promise<
        PosterPromotionRecord |
        null
      >;

  create:
    (
      input:
        CreatePosterPromotionInput
    ) =>
      Promise<
        PosterPromotionRecord
      >;

  update:
    (
      input:
        UpdatePosterPromotionInput
    ) =>
      Promise<
        PosterPromotionRecord
      >;
}

function validateCampaignFields(
  input: {
    name:
      string;

    placements:
      readonly MonetizationPlacement[];

    scheduledStartDate:
      string;

    scheduledEndDate:
      string;
  }
): {
  path:
    string;

  message:
    string;
}[] {
  const issues: {
    path:
      string;

    message:
      string;
  }[] =
    [];

  const name =
    input.name.trim();

  if (
    name.length <
    3
  ) {
    issues.push({
      path:
        "name",

      message:
        "Promotion name must contain at least 3 characters.",
    });
  }

  if (
    name.length >
    160
  ) {
    issues.push({
      path:
        "name",

      message:
        "Promotion name must contain no more than 160 characters.",
    });
  }

  if (
    input.placements.length ===
    0
  ) {
    issues.push({
      path:
        "placements",

      message:
        "Select at least one Poster Promotion placement.",
    });
  }

  if (
    new Set(
      input.placements
    ).size !==
    input.placements.length
  ) {
    issues.push({
      path:
        "placements",

      message:
        "Poster Promotion placements must not contain duplicates.",
    });
  }

  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(
      input.scheduledStartDate
    )
  ) {
    issues.push({
      path:
        "scheduledStartDate",

      message:
        "Scheduled start date must use YYYY-MM-DD.",
    });
  }

  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(
      input.scheduledEndDate
    )
  ) {
    issues.push({
      path:
        "scheduledEndDate",

      message:
        "Scheduled end date must use YYYY-MM-DD.",
    });
  }

  if (
    input.scheduledStartDate &&
    input.scheduledEndDate &&
    input.scheduledEndDate <
      input.scheduledStartDate
  ) {
    issues.push({
      path:
        "scheduledEndDate",

      message:
        "Scheduled end date must be on or after the start date.",
    });
  }

  return issues;
}

function assertPosterPromotionCampaign(
  campaign:
    MonetizationCampaignRecord
): void {
  if (
    campaign.campaignType !==
    "poster_promotion"
  ) {
    throw new PosterPromotionError({
      code:
        "POSTER_PROMOTION_CAMPAIGN_TYPE_MISMATCH",

      message:
        "The requested campaign is not a Poster Promotion.",

      statusCode:
        409,
    });
  }
}

function assertEditableCampaign(
  campaign:
    MonetizationCampaignRecord
): void {
  if (
    campaign.status ===
      "ended" ||
    campaign.status ===
      "disabled"
  ) {
    throw new PosterPromotionError({
      code:
        "POSTER_PROMOTION_TERMINAL",

      message:
        "Ended or disabled Poster Promotions cannot be edited.",

      statusCode:
        409,
    });
  }
}

function statusForMode(
  mode:
    PosterPromotionSaveMode
): Extract<
  CampaignStatus,
  "draft" |
  "scheduled"
> {
  return mode ===
    "schedule"
    ? "scheduled"
    : "draft";
}

function readinessForMode(
  mode:
    PosterPromotionSaveMode
): CampaignReadinessStatus {
  return mode ===
    "schedule"
    ? "ready"
    : "pending_setup";
}

function commercialStatusForPosterPromotion():
  CampaignCommercialStatus {
  return "approved";
}

function buildCreativeInput(
  input: {
    purpose:
      string;

    headline:
      string;

    body:
      string;

    callToAction:
      string;

    destinationUrl:
      string;

    media:
      PosterPromotionMediaReference |
      null;
  }
) {
  return normalizePosterPromotionCreative({
    campaignId:
      "00000000-0000-0000-0000-000000000000",

    purpose:
      input.purpose,

    headline:
      input.headline,

    body:
      input.body,

    callToAction:
      input.callToAction,

    destinationUrl:
      input.destinationUrl,

    media:
      input.media,
  });
}

function validateCreateOrUpdate(
  input: {
    name:
      string;

    placements:
      readonly MonetizationPlacement[];

    scheduledStartDate:
      string;

    scheduledEndDate:
      string;

    mode:
      PosterPromotionSaveMode;

    purpose:
      string;

    headline:
      string;

    body:
      string;

    callToAction:
      string;

    destinationUrl:
      string;

    media:
      PosterPromotionMediaReference |
      null;
  }
): ReturnType<
  typeof buildCreativeInput
> {
  const creative =
    buildCreativeInput(
      input
    );

  const issues = [
    ...validateCampaignFields(
      input
    ),

    ...validatePosterPromotionCreative(
      creative,
      input.mode
    ),
  ];

  if (
    issues.length >
    0
  ) {
    throw createPosterPromotionValidationError(
      issues
    );
  }

  return creative;
}

export function createAdminPosterPromotionService(
  dependencies:
    AdminPosterPromotionServiceDependencies
): AdminPosterPromotionService {
  return {
    async get(
      campaignId:
        string
    ): Promise<
      PosterPromotionRecord |
      null
    > {
      const campaign =
        await dependencies.findCampaign(
          campaignId
        );

      if (
        !campaign
      ) {
        return null;
      }

      assertPosterPromotionCampaign(
        campaign
      );

      const creative =
        await dependencies.promotionRepository
          .findCreativeByCampaignId(
            campaignId
          );

      if (
        !creative
      ) {
        return null;
      }

      return {
        campaign,
        creative,
      };
    },

    async create(
      input:
        CreatePosterPromotionInput
    ): Promise<
      PosterPromotionRecord
    > {
      const creative =
        validateCreateOrUpdate(
          input
        );

      return await dependencies.runTransaction(
        async executor => {
          const now =
            dependencies.now();

          const campaign =
            await dependencies.createCampaign(
              {
                actorUserId:
                  input.actorUserId,

                organizationId:
                  input.organizationId,

                campaignReference:
                  input.campaignReference.trim(),

                name:
                  input.name.trim(),

                placements: [
                  ...input.placements,
                ],

                scheduledStartDate:
                  input.scheduledStartDate,

                scheduledEndDate:
                  input.scheduledEndDate,

                status:
                  statusForMode(
                    input.mode
                  ),

                readinessStatus:
                  readinessForMode(
                    input.mode
                  ),

                commercialStatus:
                  commercialStatusForPosterPromotion(),

                createdAt:
                  now,
              },
              executor
            );

          const createdCreative =
            await dependencies.promotionRepository
              .createCreative(
                {
                  campaignId:
                    campaign.id,

                  purpose:
                    creative.purpose,

                  headline:
                    creative.headline,

                  body:
                    creative.body,

                  callToAction:
                    creative.callToAction,

                  destinationUrl:
                    creative.destinationUrl,

                  media:
                    creative.media,
                },
                executor
              );

          await dependencies.createAuditEntry(
            {
              actorUserId:
                input.actorUserId,

              action:
                input.mode ===
                  "schedule"
                  ? "poster_promotion.created_and_scheduled"
                  : "poster_promotion.created_as_draft",

              entityType:
                "poster_promotion",

              entityId:
                campaign.id,

              metadata: {
                campaignReference:
                  campaign.campaignReference,

                status:
                  campaign.status,

                placements:
                  campaign.placements,

                creativeRowVersion:
                  createdCreative.rowVersion,
              },

              occurredAt:
                now,
            },
            executor
          );

          return {
            campaign,
            creative:
              createdCreative,
          };
        }
      );
    },

    async update(
      input:
        UpdatePosterPromotionInput
    ): Promise<
      PosterPromotionRecord
    > {
      const creative =
        validateCreateOrUpdate(
          input
        );

      return await dependencies.runTransaction(
        async executor => {
          const currentCampaign =
            await dependencies.findCampaign(
              input.campaignId,
              executor
            );

          if (
            !currentCampaign
          ) {
            throw new PosterPromotionError({
              code:
                "POSTER_PROMOTION_NOT_FOUND",

              message:
                "Poster Promotion was not found.",

              statusCode:
                404,
            });
          }

          assertPosterPromotionCampaign(
            currentCampaign
          );

          assertEditableCampaign(
            currentCampaign
          );

          const now =
            dependencies.now();

          const campaignResult =
            await dependencies.updateCampaign(
              {
                campaignId:
                  input.campaignId,

                expectedRowVersion:
                  input.expectedCampaignRowVersion,

                name:
                  input.name.trim(),

                placements: [
                  ...input.placements,
                ],

                scheduledStartDate:
                  input.scheduledStartDate,

                scheduledEndDate:
                  input.scheduledEndDate,

                status:
                  statusForMode(
                    input.mode
                  ),

                updatedAt:
                  now,
              },
              executor
            );

          if (
            campaignResult.status ===
            "not_found"
          ) {
            throw new PosterPromotionError({
              code:
                "POSTER_PROMOTION_NOT_FOUND",

              message:
                "Poster Promotion was not found.",

              statusCode:
                404,
            });
          }

          if (
            campaignResult.status ===
            "conflict"
          ) {
            throw new PosterPromotionError({
              code:
                "POSTER_PROMOTION_CAMPAIGN_CONFLICT",

              message:
                "The Poster Promotion campaign changed after it was loaded.",

              statusCode:
                409,
            });
          }

          const creativeResult =
            await dependencies.promotionRepository
              .updateCreative(
                {
                  campaignId:
                    input.campaignId,

                  expectedRowVersion:
                    input.expectedCreativeRowVersion,

                  purpose:
                    creative.purpose,

                  headline:
                    creative.headline,

                  body:
                    creative.body,

                  callToAction:
                    creative.callToAction,

                  destinationUrl:
                    creative.destinationUrl,

                  media:
                    creative.media,
                },
                executor
              );

          if (
            creativeResult.status ===
            "not_found"
          ) {
            throw new PosterPromotionError({
              code:
                "POSTER_PROMOTION_NOT_FOUND",

              message:
                "Poster Promotion creative data was not found.",

              statusCode:
                404,
            });
          }

          if (
            creativeResult.status ===
            "conflict"
          ) {
            throw new PosterPromotionError({
              code:
                "POSTER_PROMOTION_CREATIVE_CONFLICT",

              message:
                "The Poster Promotion creative changed after it was loaded.",

              statusCode:
                409,
            });
          }

          await dependencies.createAuditEntry(
            {
              actorUserId:
                input.actorUserId,

              action:
                input.mode ===
                  "schedule"
                  ? "poster_promotion.updated_and_scheduled"
                  : "poster_promotion.updated_as_draft",

              entityType:
                "poster_promotion",

              entityId:
                input.campaignId,

              metadata: {
                previousCampaignRowVersion:
                  input.expectedCampaignRowVersion,

                campaignRowVersion:
                  campaignResult.campaign.rowVersion,

                previousCreativeRowVersion:
                  input.expectedCreativeRowVersion,

                creativeRowVersion:
                  creativeResult.creative.rowVersion,

                status:
                  campaignResult.campaign.status,
              },

              occurredAt:
                now,
            },
            executor
          );

          return {
            campaign:
              campaignResult.campaign,

            creative:
              creativeResult.creative,
          };
        }
      );
    },
  };
}