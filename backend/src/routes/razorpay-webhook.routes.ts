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
  RazorpayWebhookValidationError,
  RazorpayWebhookVerificationError,
  readRazorpayWebhookEventIdHeader,
  readRazorpayWebhookSignatureHeader,
  type RazorpayWebhookVerifier,
} from "../integrations/payments/index.js";

export interface RazorpayWebhookRoutesDependencies {
  webhookVerifier:
    RazorpayWebhookVerifier;

  walletCreditingService:
    WalletCreditingService;

  readRawBody: (
    request: FastifyRequest
  ) => Promise<string | Buffer>;

  systemActorUserId:
    string;
}

class RazorpayWebhookRouteValidationError extends Error {
  readonly code =
    "razorpay_webhook_route_validation_failed";

  constructor(
    message: string
  ) {
    super(message);
    this.name = "RazorpayWebhookRouteValidationError";
  }
}

interface ParsedCapturedPaymentWebhook {
  organizationId: string;
  fundingOrderId: string;
  providerOrderId: string;
  providerPaymentId: string;
  amountMinorUnits: bigint;
  currency: "INR";
  methodDetails: Record<string, unknown>;
  providerPayload: Record<string, unknown>;
  paidAt: Date | null;
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
    throw new RazorpayWebhookRouteValidationError(
      `${field} is required.`
    );
  }

  return value.trim();
}

function requireSafeInteger(
  value: unknown,
  field: string
): number {
  if (
    typeof value !== "number" ||
    !Number.isSafeInteger(value)
  ) {
    throw new RazorpayWebhookRouteValidationError(
      `${field} must be a safe integer.`
    );
  }

  return value;
}

function parseCurrency(
  value: unknown
): "INR" {
  const currency =
    requireString(
      value,
      "payload.payment.entity.currency"
    );

  if (currency !== "INR") {
    throw new RazorpayWebhookRouteValidationError(
      "Only INR Razorpay webhook payments are supported."
    );
  }

  return "INR";
}

function parsePaidAt(
  value: unknown
): Date | null {
  if (value === undefined || value === null) {
    return null;
  }

  const timestampSeconds =
    requireSafeInteger(
      value,
      "payload.payment.entity.created_at"
    );

  return new Date(
    timestampSeconds * 1000
  );
}

function readNestedRecord(
  value: Record<string, unknown>,
  path: string[]
): Record<string, unknown> {
  let current:
    unknown = value;

  for (const segment of path) {
    if (!isRecord(current)) {
      throw new RazorpayWebhookRouteValidationError(
        `${path.join(".")} is required.`
      );
    }

    current =
      current[segment];
  }

  if (!isRecord(current)) {
    throw new RazorpayWebhookRouteValidationError(
      `${path.join(".")} is required.`
    );
  }

  return current;
}

function parseCapturedPaymentWebhook(
  body: unknown
): ParsedCapturedPaymentWebhook {
  if (!isRecord(body)) {
    throw new RazorpayWebhookRouteValidationError(
      "Webhook body must be an object."
    );
  }

  const paymentEntity =
    readNestedRecord(
      body,
      [
        "payload",
        "payment",
        "entity",
      ]
    );

  const notes =
    readNestedRecord(
      paymentEntity,
      [
        "notes",
      ]
    );

  const amountMinorUnits =
    BigInt(
      requireSafeInteger(
        paymentEntity.amount,
        "payload.payment.entity.amount"
      )
    );

  if (amountMinorUnits <= 0n) {
    throw new RazorpayWebhookRouteValidationError(
      "payload.payment.entity.amount must be greater than zero."
    );
  }

  const methodDetails:
    Record<string, unknown> = {};

  for (const key of [
    "method",
    "bank",
    "wallet",
    "vpa",
    "card_id",
    "email",
    "contact",
  ]) {
    if (paymentEntity[key] !== undefined) {
      methodDetails[key] =
        paymentEntity[key];
    }
  }

  return {
    organizationId:
      requireString(
        notes.organizationId,
        "payload.payment.entity.notes.organizationId"
      ),

    fundingOrderId:
      requireString(
        notes.fundingOrderId,
        "payload.payment.entity.notes.fundingOrderId"
      ),

    providerOrderId:
      requireString(
        paymentEntity.order_id,
        "payload.payment.entity.order_id"
      ),

    providerPaymentId:
      requireString(
        paymentEntity.id,
        "payload.payment.entity.id"
      ),

    amountMinorUnits,

    currency:
      parseCurrency(
        paymentEntity.currency
      ),

    methodDetails,

    providerPayload:
      body,

    paidAt:
      parsePaidAt(
        paymentEntity.created_at
      ),
  };
}

function requireSystemActorUserId(
  value: string
): string {
  const trimmed =
    value.trim();

  if (trimmed.length === 0) {
    throw new RazorpayWebhookRouteValidationError(
      "systemActorUserId is required."
    );
  }

  return trimmed;
}

function mapRouteError(
  error: unknown
): {
  statusCode: number;
  body: Record<string, unknown>;
} | null {
  if (
    error instanceof RazorpayWebhookRouteValidationError ||
    error instanceof RazorpayWebhookValidationError ||
    error instanceof WalletCreditingValidationError
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

  if (error instanceof RazorpayWebhookVerificationError) {
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

export function createRazorpayWebhookRoutes(
  dependencies: RazorpayWebhookRoutesDependencies
): FastifyPluginAsync {
  return async fastify => {
    fastify.post(
      "/api/v1/webhooks/razorpay",
      async (
        request,
        reply
      ) => {
        try {
          const providerSignature =
            readRazorpayWebhookSignatureHeader(
              request.headers
            );

          const eventId =
            readRazorpayWebhookEventIdHeader(
              request.headers
            );

          const rawBody =
            await dependencies.readRawBody(
              request
            );

          dependencies.webhookVerifier.assertWebhookSignature({
            rawBody,

            providerSignature,
          });

          const body =
            request.body;

          if (!isRecord(body)) {
            throw new RazorpayWebhookRouteValidationError(
              "Webhook body must be an object."
            );
          }

          const event =
            requireString(
              body.event,
              "event"
            );

          if (event !== "payment.captured") {
            return reply
              .code(200)
              .send({
                webhook: {
                  provider:
                    "razorpay",

                  event,

                  eventId,

                  processed:
                    false,
                },
              });
          }

          const payment =
            parseCapturedPaymentWebhook(
              body
            );

          const creditInput:
            CreditVerifiedWalletPaymentInput = {
              organizationId:
                payment.organizationId,

              actorUserId:
                requireSystemActorUserId(
                  dependencies.systemActorUserId
                ),

              fundingOrderId:
                payment.fundingOrderId,

              provider:
                "razorpay",

              providerOrderId:
                payment.providerOrderId,

              providerPaymentId:
                payment.providerPaymentId,

              providerSignatureDigest:
                dependencies.webhookVerifier.assertWebhookSignature({
                  rawBody,

                  providerSignature,
                }),

              amountMinorUnits:
                payment.amountMinorUnits,

              currency:
                payment.currency,

              methodDetails:
                payment.methodDetails,

              providerPayload:
                {
                  ...payment.providerPayload,

                  razorpayEventId:
                    eventId,
                },

              paidAt:
                payment.paidAt,
            };

          await dependencies.walletCreditingService.creditVerifiedPayment(
            creditInput
          );

          return reply
            .code(200)
            .send({
              webhook: {
                provider:
                  "razorpay",

                event,

                eventId,

                processed:
                  true,
              },
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