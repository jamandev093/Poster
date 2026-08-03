import type {
  FastifyPluginAsync,
  FastifyRequest,
} from "fastify";

import {
  WalletFundingValidationError,
  type StartWalletFundingInput,
  type WalletFundingService,
} from "../application/payments/index.js";

import type {
  WalletFundingOrderRecord,
} from "../domains/payments/index.js";

export interface ClientWalletRouteActor {
  userId: string;
  organizationId: string;
}

export interface ClientWalletRoutesDependencies {
  authenticateClientRequest: (
    request: FastifyRequest
  ) => Promise<ClientWalletRouteActor>;

  walletFundingService: WalletFundingService;
}

export class ClientWalletRouteAuthenticationError extends Error {
  readonly code =
    "client_wallet_authentication_failed";

  constructor() {
    super("Client authentication is required.");
    this.name = "ClientWalletRouteAuthenticationError";
  }
}

class ClientWalletRouteValidationError extends Error {
  readonly code =
    "client_wallet_validation_failed";

  constructor(message: string) {
    super(message);
    this.name = "ClientWalletRouteValidationError";
  }
}

interface ParsedStartWalletFundingBody {
  amountMinorUnits: bigint;
  currency: "INR";
  idempotencyKey: string;
  providerPayload?: Record<string, unknown>;
  expiresAt?: Date | null;
}

function isRecord(
  value: unknown
): value is Record<string, unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}

function requireString(
  value: unknown,
  field: string
): string {
  if (
    typeof value !== "string" ||
    value.trim().length === 0
  ) {
    throw new ClientWalletRouteValidationError(
      `${field} is required.`
    );
  }

  return value.trim();
}

function parseAmountMinorUnits(
  value: unknown
): bigint {
  const raw =
    requireString(
      value,
      "amountMinorUnits"
    );

  if (!/^[0-9]+$/.test(raw)) {
    throw new ClientWalletRouteValidationError(
      "amountMinorUnits must be a positive integer string."
    );
  }

  const amount =
    BigInt(raw);

  if (amount <= 0n) {
    throw new ClientWalletRouteValidationError(
      "amountMinorUnits must be greater than zero."
    );
  }

  return amount;
}

function parseCurrency(
  value: unknown
): "INR" {
  const currency =
    requireString(
      value,
      "currency"
    );

  if (currency !== "INR") {
    throw new ClientWalletRouteValidationError(
      "Only INR Wallet funding is supported."
    );
  }

  return "INR";
}

function parseProviderPayload(
  value: unknown
): Record<string, unknown> | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (!isRecord(value)) {
    throw new ClientWalletRouteValidationError(
      "providerPayload must be an object."
    );
  }

  return value;
}

function parseExpiresAt(
  value: unknown
): Date | null | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (value === null) {
    return null;
  }

  const raw =
    requireString(
      value,
      "expiresAt"
    );

  const parsed =
    new Date(raw);

  if (Number.isNaN(parsed.getTime())) {
    throw new ClientWalletRouteValidationError(
      "expiresAt must be a valid ISO timestamp."
    );
  }

  return parsed;
}

function parseStartWalletFundingBody(
  body: unknown
): ParsedStartWalletFundingBody {
  if (!isRecord(body)) {
    throw new ClientWalletRouteValidationError(
      "Request body must be an object."
    );
  }

  const parsed: ParsedStartWalletFundingBody = {
    amountMinorUnits:
      parseAmountMinorUnits(
        body.amountMinorUnits
      ),

    currency:
      parseCurrency(
        body.currency
      ),

    idempotencyKey:
      requireString(
        body.idempotencyKey,
        "idempotencyKey"
      ),
  };

  const providerPayload =
    parseProviderPayload(
      body.providerPayload
    );

  if (providerPayload !== undefined) {
    parsed.providerPayload =
      providerPayload;
  }

  const expiresAt =
    parseExpiresAt(
      body.expiresAt
    );

  if (expiresAt !== undefined) {
    parsed.expiresAt =
      expiresAt;
  }

  return parsed;
}

function formatWalletFundingOrder(
  order: WalletFundingOrderRecord
) {
  return {
    id: order.id,
    organizationId: order.organizationId,
    walletId: order.walletId,
    requestedByUserId: order.requestedByUserId,
    provider: order.provider,
    providerOrderId: order.providerOrderId,
    providerReceipt: order.providerReceipt,
    amountMinorUnits: order.amount.minorUnits.toString(),
    currency: order.amount.currency,
    status: order.status,
    idempotencyKey: order.idempotencyKey,
    expiresAt: order.expiresAt?.toISOString() ?? null,
    creditedAt: order.creditedAt?.toISOString() ?? null,
    createdAt: order.createdAt.toISOString(),
    updatedAt: order.updatedAt.toISOString(),
    rowVersion: order.rowVersion,
  };
}

function mapRouteError(
  error: unknown
): {
  statusCode: number;
  body: Record<string, unknown>;
} | null {
  if (error instanceof ClientWalletRouteAuthenticationError) {
    return {
      statusCode: 401,
      body: {
        error: {
          code: error.code,
          message: error.message,
        },
      },
    };
  }

  if (error instanceof ClientWalletRouteValidationError) {
    return {
      statusCode: 400,
      body: {
        error: {
          code: error.code,
          message: error.message,
        },
      },
    };
  }

  if (error instanceof WalletFundingValidationError) {
    return {
      statusCode: 400,
      body: {
        error: {
          code: error.code,
          message: error.message,
          details: error.details,
        },
      },
    };
  }

  return null;
}

export function createClientWalletRoutes(
  dependencies: ClientWalletRoutesDependencies
): FastifyPluginAsync {
  return async fastify => {
    fastify.post(
      "/api/v1/client/wallet/funding-orders",
      async (
        request,
        reply
      ) => {
        try {
          const actor =
            await dependencies.authenticateClientRequest(
              request
            );

          const body =
            parseStartWalletFundingBody(
              request.body
            );

          const fundingInput: StartWalletFundingInput = {
            organizationId:
              actor.organizationId,

            actorUserId:
              actor.userId,

            amountMinorUnits:
              body.amountMinorUnits,

            currency:
              body.currency,

            idempotencyKey:
              body.idempotencyKey,

            provider:
              "razorpay",
          };

          if (body.providerPayload !== undefined) {
            fundingInput.providerPayload =
              body.providerPayload;
          }

          if (body.expiresAt !== undefined) {
            fundingInput.expiresAt =
              body.expiresAt;
          }

          const order =
            await dependencies.walletFundingService.startFunding(
              fundingInput
            );

          return reply
            .code(201)
            .send({
              order:
                formatWalletFundingOrder(
                  order
                ),
            });
        } catch (error) {
          const mapped =
            mapRouteError(error);

          if (mapped) {
            return reply
              .code(mapped.statusCode)
              .send(mapped.body);
          }

          throw error;
        }
      }
    );
  };
}