import type {
  FastifyPluginAsync,
  FastifyReply,
  FastifyRequest,
} from "fastify";

import {
  ClientWalletAllocationConflictError,
  ClientWalletAllocationInsufficientBalanceError,
  ClientWalletAllocationNotFoundError,
  ClientWalletAllocationValidationError,
  type AllocateClientCampaignWalletInput,
  type ClientWalletAllocationMutationResult,
  type ClientWalletAllocationService,
  type ReleaseClientCampaignWalletInput,
} from "../application/payments/index.js";

export interface ClientWalletAllocationRouteActor {
  userId:
    string;

  organizationId:
    string;
}

export interface ClientWalletAllocationRoutesDependencies {
  authenticateClientRequest: (
    request:
      FastifyRequest
  ) => Promise<ClientWalletAllocationRouteActor>;

  walletAllocationService:
    ClientWalletAllocationService;
}

export class ClientWalletAllocationRouteAuthenticationError extends Error {
  readonly code =
    "client_wallet_allocation_authentication_failed";

  constructor() {
    super(
      "Client authentication is required."
    );

    this.name =
      "ClientWalletAllocationRouteAuthenticationError";
  }
}

class ClientWalletAllocationRouteValidationError extends Error {
  readonly code =
    "client_wallet_allocation_route_validation_failed";

  constructor(
    message:
      string
  ) {
    super(
      message
    );

    this.name =
      "ClientWalletAllocationRouteValidationError";
  }
}

interface AllocateRouteBody {
  campaignId?:
    unknown;

  amountMinorUnits?:
    unknown;

  currency?:
    unknown;

  idempotencyKey?:
    unknown;
}

interface ReleaseRouteParams {
  campaignId?:
    string;
}

interface ReleaseRouteBody {
  amountMinorUnits?:
    unknown;

  expectedRowVersion?:
    unknown;

  idempotencyKey?:
    unknown;
}

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

function parseRequiredString(
  value:
    unknown,

  field:
    string
): string {
  if (
    typeof value !== "string" ||
    value.trim().length === 0
  ) {
    throw new ClientWalletAllocationRouteValidationError(
      `${field} is required.`
    );
  }

  return value.trim();
}

function parseRequiredPositiveMinorUnits(
  value:
    unknown,

  field:
    string
): bigint {
  if (
    typeof value !== "string" ||
    !/^[1-9][0-9]*$/.test(
      value
    )
  ) {
    throw new ClientWalletAllocationRouteValidationError(
      `${field} must be a positive integer string.`
    );
  }

  return BigInt(
    value
  );
}

function parseOptionalPositiveMinorUnits(
  value:
    unknown,

  field:
    string
): bigint | undefined {
  if (
    value === undefined ||
    value === null ||
    value === ""
  ) {
    return undefined;
  }

  return parseRequiredPositiveMinorUnits(
    value,
    field
  );
}

function parseCurrency(
  value:
    unknown
): "INR" {
  if (
    value !== "INR"
  ) {
    throw new ClientWalletAllocationRouteValidationError(
      "currency must be INR."
    );
  }

  return "INR";
}

function parseAllocateBody(
  body:
    unknown
): Omit<
  AllocateClientCampaignWalletInput,
  "organizationId" |
  "actorUserId"
> {
  if (
    !isRecord(
      body
    )
  ) {
    throw new ClientWalletAllocationRouteValidationError(
      "Request body must be an object."
    );
  }

  const parsed =
    body as AllocateRouteBody;

  return {
    campaignId:
      parseRequiredString(
        parsed.campaignId,
        "campaignId"
      ),

    amountMinorUnits:
      parseRequiredPositiveMinorUnits(
        parsed.amountMinorUnits,
        "amountMinorUnits"
      ),

    currency:
      parseCurrency(
        parsed.currency
      ),

    idempotencyKey:
      parseRequiredString(
        parsed.idempotencyKey,
        "idempotencyKey"
      ),
  };
}

function parseReleaseBody(
  params:
    ReleaseRouteParams,

  body:
    unknown
): Omit<
  ReleaseClientCampaignWalletInput,
  "organizationId" |
  "actorUserId"
> {
  if (
    !isRecord(
      body
    )
  ) {
    throw new ClientWalletAllocationRouteValidationError(
      "Request body must be an object."
    );
  }

  const parsed =
    body as ReleaseRouteBody;

  const releaseInput:
    Omit<
      ReleaseClientCampaignWalletInput,
      "organizationId" |
      "actorUserId"
    > = {
      campaignId:
        parseRequiredString(
          params.campaignId,
          "campaignId"
        ),

      expectedRowVersion:
        parseRequiredString(
          parsed.expectedRowVersion,
          "expectedRowVersion"
        ),

      idempotencyKey:
        parseRequiredString(
          parsed.idempotencyKey,
          "idempotencyKey"
        ),
    };

  const amountMinorUnits =
    parseOptionalPositiveMinorUnits(
      parsed.amountMinorUnits,
      "amountMinorUnits"
    );

  if (
    amountMinorUnits !== undefined
  ) {
    releaseInput.amountMinorUnits =
      amountMinorUnits;
  }

  return releaseInput;
}

function serializeMoney(
  money:
    ClientWalletAllocationMutationResult[
      "wallet"
    ][
      "availableBalance"
    ]
) {
  return {
    minorUnits:
      money.minorUnits.toString(),

    currency:
      money.currency,
  };
}

function serializeWallet(
  wallet:
    ClientWalletAllocationMutationResult[
      "wallet"
    ]
) {
  return {
    id:
      wallet.id,

    organizationId:
      wallet.organizationId,

    currency:
      wallet.currency,

    status:
      wallet.status,

    availableBalance:
      serializeMoney(
        wallet.availableBalance
      ),

    reservedBalance:
      serializeMoney(
        wallet.reservedBalance
      ),

    totalCredited:
      serializeMoney(
        wallet.totalCredited
      ),

    totalSpent:
      serializeMoney(
        wallet.totalSpent
      ),

    totalRefunded:
      serializeMoney(
        wallet.totalRefunded
      ),

    rowVersion:
      wallet.rowVersion,
  };
}

function serializeAllocation(
  allocation:
    ClientWalletAllocationMutationResult[
      "allocation"
    ]
) {
  return {
    id:
      allocation.id,

    organizationId:
      allocation.organizationId,

    walletId:
      allocation.walletId,

    campaignId:
      allocation.campaignId,

    currency:
      allocation.currency,

    status:
      allocation.status,

    allocated:
      serializeMoney(
        allocation.allocated
      ),

    reserved:
      serializeMoney(
        allocation.reserved
      ),

    spent:
      serializeMoney(
        allocation.spent
      ),

    released:
      serializeMoney(
        allocation.released
      ),

    refunded:
      serializeMoney(
        allocation.refunded
      ),

    createdByUserId:
      allocation.createdByUserId,

    createdAt:
      allocation.createdAt.toISOString(),

    updatedAt:
      allocation.updatedAt.toISOString(),

    rowVersion:
      allocation.rowVersion,
  };
}

function serializeMutationResult(
  result:
    ClientWalletAllocationMutationResult
) {
  return {
    wallet:
      serializeWallet(
        result.wallet
      ),

    allocation:
      serializeAllocation(
        result.allocation
      ),
  };
}

async function sendMappedErrorOrThrow(
  reply:
    FastifyReply,

  error:
    unknown
) {
  if (
    error instanceof ClientWalletAllocationRouteAuthenticationError
  ) {
    return reply
      .code(
        401
      )
      .send({
        error: {
          code:
            error.code,

          message:
            error.message,
        },
      });
  }

  if (
    error instanceof ClientWalletAllocationRouteValidationError ||
    error instanceof ClientWalletAllocationValidationError
  ) {
    return reply
      .code(
        400
      )
      .send({
        error: {
          code:
            "client_wallet_allocation_validation_failed",

          message:
            error.message,

          details:
            error instanceof ClientWalletAllocationValidationError
              ? error.details
              : undefined,
        },
      });
  }

  if (
    error instanceof ClientWalletAllocationNotFoundError
  ) {
    return reply
      .code(
        404
      )
      .send({
        error: {
          code:
            error.code,

          message:
            error.message,
        },
      });
  }

  if (
    error instanceof ClientWalletAllocationConflictError ||
    error instanceof ClientWalletAllocationInsufficientBalanceError
  ) {
    return reply
      .code(
        409
      )
      .send({
        error: {
          code:
            error.code,

          message:
            error.message,
        },
      });
  }

  throw error;
}

async function authenticateRouteActor(
  dependencies:
    ClientWalletAllocationRoutesDependencies,

  request:
    FastifyRequest
): Promise<ClientWalletAllocationRouteActor> {
  const actor =
    await dependencies.authenticateClientRequest(
      request
    );

  if (
    !actor.userId ||
    !actor.organizationId
  ) {
    throw new ClientWalletAllocationRouteAuthenticationError();
  }

  return actor;
}

export function createClientWalletAllocationRoutes(
  dependencies:
    ClientWalletAllocationRoutesDependencies
): FastifyPluginAsync {
  return async fastify => {
    fastify.post(
      "/api/v1/client/wallet/campaign-allocations",
      async (
        request,
        reply
      ) => {
        try {
          const actor =
            await authenticateRouteActor(
              dependencies,
              request
            );

          const parsedBody =
            parseAllocateBody(
              request.body
            );

          const result =
            await dependencies.walletAllocationService.allocateCampaignWalletFunds({
              organizationId:
                actor.organizationId,

              actorUserId:
                actor.userId,

              ...parsedBody,
            });

          return reply
            .code(
              201
            )
            .send(
              serializeMutationResult(
                result
              )
            );
        } catch (error) {
          return await sendMappedErrorOrThrow(
            reply,
            error
          );
        }
      }
    );

    fastify.post<{
      Params:
        ReleaseRouteParams;
    }>(
      "/api/v1/client/wallet/campaign-allocations/:campaignId/release",
      async (
        request,
        reply
      ) => {
        try {
          const actor =
            await authenticateRouteActor(
              dependencies,
              request
            );

          const parsedBody =
            parseReleaseBody(
              request.params,
              request.body
            );

          const result =
            await dependencies.walletAllocationService.releaseCampaignWalletFunds({
              organizationId:
                actor.organizationId,

              actorUserId:
                actor.userId,

              ...parsedBody,
            });

          return reply
            .code(
              200
            )
            .send(
              serializeMutationResult(
                result
              )
            );
        } catch (error) {
          return await sendMappedErrorOrThrow(
            reply,
            error
          );
        }
      }
    );
  };
}