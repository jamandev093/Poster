import type {
  FastifyPluginAsync,
  FastifyRequest,
} from "fastify";

import {
  WalletCreditingConflictError,
  WalletCreditingValidationError,
  type CreditVerifiedWalletPaymentInput,
  type WalletCreditingService,
} from "../application/payments/index.js";

import {
  RazorpaySignatureValidationError,
  RazorpaySignatureVerificationError,
  type RazorpayPaymentSignatureVerifier,
} from "../integrations/payments/index.js";

export interface ClientWalletPaymentRouteActor {
  userId: string;
  organizationId: string;
}

export interface ClientWalletPaymentRoutesDependencies {
  authenticateClientRequest: (
    request: FastifyRequest
  ) => Promise<ClientWalletPaymentRouteActor>;

  signatureVerifier:
    RazorpayPaymentSignatureVerifier;

  walletCreditingService:
    WalletCreditingService;
}

export class ClientWalletPaymentRouteAuthenticationError extends Error {
  readonly code =
    "client_wallet_payment_authentication_failed";

  constructor() {
    super("Client authentication is required.");
    this.name = "ClientWalletPaymentRouteAuthenticationError";
  }
}

class ClientWalletPaymentRouteValidationError extends Error {
  readonly code =
    "client_wallet_payment_validation_failed";

  constructor(
    message: string
  ) {
    super(message);
    this.name = "ClientWalletPaymentRouteValidationError";
  }
}

interface ParsedPaymentVerificationBody {
  fundingOrderId: string;
  providerOrderId: string;
  providerPaymentId: string;
  providerSignature: string;
  amountMinorUnits: bigint;
  currency: "INR";
  methodDetails?: Record<string, unknown>;
  providerPayload?: Record<string, unknown>;
  paidAt?: Date | null;
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
    throw new ClientWalletPaymentRouteValidationError(
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
    throw new ClientWalletPaymentRouteValidationError(
      "amountMinorUnits must be a positive integer string."
    );
  }

  const amount =
    BigInt(raw);

  if (amount <= 0n) {
    throw new ClientWalletPaymentRouteValidationError(
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
    throw new ClientWalletPaymentRouteValidationError(
      "Only INR Wallet payment verification is supported."
    );
  }

  return "INR";
}

function parseOptionalRecord(
  value: unknown,
  field: string
): Record<string, unknown> | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (!isRecord(value)) {
    throw new ClientWalletPaymentRouteValidationError(
      `${field} must be an object.`
    );
  }

  return value;
}

function parseOptionalDate(
  value: unknown,
  field: string
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
      field
    );

  const parsed =
    new Date(raw);

  if (Number.isNaN(parsed.getTime())) {
    throw new ClientWalletPaymentRouteValidationError(
      `${field} must be a valid ISO timestamp.`
    );
  }

  return parsed;
}

function parsePaymentVerificationBody(
  body: unknown
): ParsedPaymentVerificationBody {
  if (!isRecord(body)) {
    throw new ClientWalletPaymentRouteValidationError(
      "Request body must be an object."
    );
  }

  const parsed: ParsedPaymentVerificationBody = {
    fundingOrderId:
      requireString(
        body.fundingOrderId,
        "fundingOrderId"
      ),

    providerOrderId:
      requireString(
        body.providerOrderId,
        "providerOrderId"
      ),

    providerPaymentId:
      requireString(
        body.providerPaymentId,
        "providerPaymentId"
      ),

    providerSignature:
      requireString(
        body.providerSignature,
        "providerSignature"
      ),

    amountMinorUnits:
      parseAmountMinorUnits(
        body.amountMinorUnits
      ),

    currency:
      parseCurrency(
        body.currency
      ),
  };

  const methodDetails =
    parseOptionalRecord(
      body.methodDetails,
      "methodDetails"
    );

  if (methodDetails !== undefined) {
    parsed.methodDetails =
      methodDetails;
  }

  const providerPayload =
    parseOptionalRecord(
      body.providerPayload,
      "providerPayload"
    );

  if (providerPayload !== undefined) {
    parsed.providerPayload =
      providerPayload;
  }

  const paidAt =
    parseOptionalDate(
      body.paidAt,
      "paidAt"
    );

  if (paidAt !== undefined) {
    parsed.paidAt =
      paidAt;
  }

  return parsed;
}

function formatPaymentVerificationResult(
  result:
    Awaited<
      ReturnType<
        WalletCreditingService[
          "creditVerifiedPayment"
        ]
      >
    >
) {
  if ("payment" in result) {
    return {
      payment: {
        id:
          result.payment.id,

        provider:
          result.payment.provider,

        providerPaymentId:
          result.payment.providerPaymentId,

        amountMinorUnits:
          result.payment.amount.minorUnits.toString(),

        currency:
          result.payment.amount.currency,

        status:
          result.payment.status,

        paidAt:
          result.payment.paidAt?.toISOString() ?? null,
      },

      wallet: {
        id:
          result.wallet.id,

        availableBalanceMinorUnits:
          result.wallet.availableBalance.minorUnits.toString(),

        reservedBalanceMinorUnits:
          result.wallet.reservedBalance.minorUnits.toString(),

        currency:
          result.wallet.currency,

        rowVersion:
          result.wallet.rowVersion,
      },

      fundingOrder: {
        id:
          result.fundingOrder.id,

        status:
          result.fundingOrder.status,

        creditedAt:
          result.fundingOrder.creditedAt?.toISOString() ?? null,

        rowVersion:
          result.fundingOrder.rowVersion,
      },

      replay:
        false,
    };
  }

  return {
    payment: {
      id:
        result.id,

      provider:
        result.provider,

      providerPaymentId:
        result.providerPaymentId,

      amountMinorUnits:
        result.amount.minorUnits.toString(),

      currency:
        result.amount.currency,

      status:
        result.status,

      paidAt:
        result.paidAt?.toISOString() ?? null,
    },

    replay:
      true,
  };
}

function mapRouteError(
  error: unknown
): {
  statusCode: number;
  body: Record<string, unknown>;
} | null {
  if (error instanceof ClientWalletPaymentRouteAuthenticationError) {
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
    error instanceof ClientWalletPaymentRouteValidationError ||
    error instanceof WalletCreditingValidationError ||
    error instanceof RazorpaySignatureValidationError
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

  if (error instanceof RazorpaySignatureVerificationError) {
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

  if (error instanceof WalletCreditingConflictError) {
    return {
      statusCode:
        409,

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

export function createClientWalletPaymentRoutes(
  dependencies: ClientWalletPaymentRoutesDependencies
): FastifyPluginAsync {
  return async fastify => {
    fastify.post(
      "/api/v1/client/wallet/payment-verifications",
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
            parsePaymentVerificationBody(
              request.body
            );

          const signatureDigest =
            dependencies.signatureVerifier.assertPaymentSignature({
              providerOrderId:
                body.providerOrderId,

              providerPaymentId:
                body.providerPaymentId,

              providerSignature:
                body.providerSignature,
            });

          const creditInput:
            CreditVerifiedWalletPaymentInput = {
              organizationId:
                actor.organizationId,

              actorUserId:
                actor.userId,

              fundingOrderId:
                body.fundingOrderId,

              provider:
                "razorpay",

              providerOrderId:
                body.providerOrderId,

              providerPaymentId:
                body.providerPaymentId,

              providerSignatureDigest:
                signatureDigest,

              amountMinorUnits:
                body.amountMinorUnits,

              currency:
                body.currency,
            };

          if (body.methodDetails !== undefined) {
            creditInput.methodDetails =
              body.methodDetails;
          }

          if (body.providerPayload !== undefined) {
            creditInput.providerPayload =
              body.providerPayload;
          }

          if (body.paidAt !== undefined) {
            creditInput.paidAt =
              body.paidAt;
          }

          const result =
            await dependencies.walletCreditingService.creditVerifiedPayment(
              creditInput
            );

          return reply
            .code(200)
            .send({
              verification:
                formatPaymentVerificationResult(
                  result
                ),
            });
        } catch (error) {
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
      }
    );
  };
}