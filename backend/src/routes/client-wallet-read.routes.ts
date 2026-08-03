import type {
  FastifyPluginAsync,
  FastifyRequest,
} from "fastify";

import {
  ClientWalletReadValidationError,
  type ClientWalletReadRequest,
  type ClientWalletReadService,
} from "../application/payments/index.js";

export interface ClientWalletReadRouteActor {
  userId: string;
  organizationId: string;
}

export interface ClientWalletReadRoutesDependencies {
  authenticateClientRequest: (
    request: FastifyRequest
  ) => Promise<ClientWalletReadRouteActor>;

  walletReadService:
    ClientWalletReadService;
}

export class ClientWalletReadRouteAuthenticationError extends Error {
  readonly code =
    "client_wallet_read_authentication_failed";

  constructor() {
    super("Client authentication is required.");
    this.name = "ClientWalletReadRouteAuthenticationError";
  }
}

class ClientWalletReadRouteValidationError extends Error {
  readonly code =
    "client_wallet_read_route_validation_failed";

  constructor(
    message: string
  ) {
    super(message);
    this.name = "ClientWalletReadRouteValidationError";
  }
}

const DEFAULT_LIMIT =
  25;

const MAX_LIMIT =
  100;

function isRecord(
  value: unknown
): value is Record<string, unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}

function parseLimit(
  query: unknown
): number {
  if (!isRecord(query)) {
    return DEFAULT_LIMIT;
  }

  const raw =
    query.limit;

  if (raw === undefined) {
    return DEFAULT_LIMIT;
  }

  const normalized =
    typeof raw === "number"
      ? String(raw)
      : typeof raw === "string"
        ? raw.trim()
        : "";

  if (!/^[0-9]+$/.test(normalized)) {
    throw new ClientWalletReadRouteValidationError(
      "limit must be a positive integer."
    );
  }

  const limit =
    Number(normalized);

  if (
    !Number.isSafeInteger(limit) ||
    limit < 1 ||
    limit > MAX_LIMIT
  ) {
    throw new ClientWalletReadRouteValidationError(
      `limit must be between 1 and ${MAX_LIMIT}.`
    );
  }

  return limit;
}

async function createReadRequest(
  dependencies: ClientWalletReadRoutesDependencies,
  request: FastifyRequest
): Promise<ClientWalletReadRequest> {
  const actor =
    await dependencies.authenticateClientRequest(
      request
    );

  return {
    organizationId:
      actor.organizationId,

    limit:
      parseLimit(
        request.query
      ),
  };
}

function mapRouteError(
  error: unknown
): {
  statusCode: number;
  body: Record<string, unknown>;
} | null {
  if (error instanceof ClientWalletReadRouteAuthenticationError) {
    return {
      statusCode:
        401,

      body: {
        error: {
          code:
            error.code,

          message:
            error.message,
        },
      },
    };
  }

  if (
    error instanceof ClientWalletReadRouteValidationError ||
    error instanceof ClientWalletReadValidationError
  ) {
    return {
      statusCode:
        400,

      body: {
        error: {
          code:
            error.code,

          message:
            error.message,
        },
      },
    };
  }

  return null;
}

async function sendMappedErrorOrThrow(
  reply: {
    code: (
      statusCode: number
    ) => {
      send: (
        body: Record<string, unknown>
      ) => unknown;
    };
  },
  error: unknown
) {
  const mapped =
    mapRouteError(
      error
    );

  if (mapped) {
    return reply
      .code(mapped.statusCode)
      .send(mapped.body);
  }

  throw error;
}

export function createClientWalletReadRoutes(
  dependencies: ClientWalletReadRoutesDependencies
): FastifyPluginAsync {
  return async fastify => {
    fastify.get(
      "/api/v1/client/wallet",
      async (
        request,
        reply
      ) => {
        try {
          const readRequest =
            await createReadRequest(
              dependencies,
              request
            );

          const overview =
            await dependencies.walletReadService.getOverview(
              readRequest
            );

          return reply
            .code(200)
            .send({
              wallet:
                overview.wallet,

              fundingOrders:
                overview.fundingOrders,

              ledgerEntries:
                overview.ledgerEntries,

              payments:
                overview.payments,

              invoices:
                overview.invoices,

              refunds:
                overview.refunds,

              campaignAllocations:
                overview.campaignAllocations,

              generatedAt:
                overview.generatedAt,
            });
        } catch (error) {
          return await sendMappedErrorOrThrow(
            reply,
            error
          );
        }
      }
    );

    fastify.get(
      "/api/v1/client/wallet/funding-orders",
      async (
        request,
        reply
      ) => {
        try {
          const readRequest =
            await createReadRequest(
              dependencies,
              request
            );

          const fundingOrders =
            await dependencies.walletReadService.listFundingOrders(
              readRequest
            );

          return reply
            .code(200)
            .send({
              fundingOrders,
            });
        } catch (error) {
          return await sendMappedErrorOrThrow(
            reply,
            error
          );
        }
      }
    );

    fastify.get(
      "/api/v1/client/wallet/ledger",
      async (
        request,
        reply
      ) => {
        try {
          const readRequest =
            await createReadRequest(
              dependencies,
              request
            );

          const ledgerEntries =
            await dependencies.walletReadService.listLedgerEntries(
              readRequest
            );

          return reply
            .code(200)
            .send({
              ledgerEntries,
            });
        } catch (error) {
          return await sendMappedErrorOrThrow(
            reply,
            error
          );
        }
      }
    );

    fastify.get(
      "/api/v1/client/wallet/payments",
      async (
        request,
        reply
      ) => {
        try {
          const readRequest =
            await createReadRequest(
              dependencies,
              request
            );

          const payments =
            await dependencies.walletReadService.listPayments(
              readRequest
            );

          return reply
            .code(200)
            .send({
              payments,
            });
        } catch (error) {
          return await sendMappedErrorOrThrow(
            reply,
            error
          );
        }
      }
    );

    fastify.get(
      "/api/v1/client/wallet/invoices",
      async (
        request,
        reply
      ) => {
        try {
          const readRequest =
            await createReadRequest(
              dependencies,
              request
            );

          const invoices =
            await dependencies.walletReadService.listInvoices(
              readRequest
            );

          return reply
            .code(200)
            .send({
              invoices,
            });
        } catch (error) {
          return await sendMappedErrorOrThrow(
            reply,
            error
          );
        }
      }
    );

    fastify.get(
      "/api/v1/client/wallet/refunds",
      async (
        request,
        reply
      ) => {
        try {
          const readRequest =
            await createReadRequest(
              dependencies,
              request
            );

          const refunds =
            await dependencies.walletReadService.listRefunds(
              readRequest
            );

          return reply
            .code(200)
            .send({
              refunds,
            });
        } catch (error) {
          return await sendMappedErrorOrThrow(
            reply,
            error
          );
        }
      }
    );

    fastify.get(
      "/api/v1/client/wallet/campaign-allocations",
      async (
        request,
        reply
      ) => {
        try {
          const readRequest =
            await createReadRequest(
              dependencies,
              request
            );

          const campaignAllocations =
            await dependencies.walletReadService.listCampaignAllocations(
              readRequest
            );

          return reply
            .code(200)
            .send({
              campaignAllocations,
            });
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