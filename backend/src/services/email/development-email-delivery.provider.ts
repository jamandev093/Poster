import {
  randomUUID,
} from "node:crypto";

import {
  EmailDeliveryConfigurationError,
  type EmailDeliveryMessage,
  type EmailDeliveryProvider,
  type EmailDeliveryReceipt,
} from "./email-delivery.types.js";

export interface CapturedDevelopmentEmail
  extends EmailDeliveryMessage {
  provider:
    string;

  messageId:
    string;

  acceptedAt:
    Date;
}

export interface DevelopmentEmailDeliveryProvider
  extends EmailDeliveryProvider {
  getCapturedEmails:
    () => readonly CapturedDevelopmentEmail[];

  clearCapturedEmails:
    () => void;
}

export interface DevelopmentEmailDeliveryProviderOptions {
  nodeEnvironment?:
    string;

  now?:
    () => Date;

  createMessageId?:
    () => string;
}

function assertValidAcceptedAt(
  value: Date
): void {
  if (
    !Number.isFinite(
      value.getTime()
    )
  ) {
    throw new RangeError(
      "Email delivery acceptance time must be a valid date."
    );
  }
}

/**
 * Creates a local-only, in-memory email provider.
 *
 * Security properties:
 *
 * - never writes messages to stdout or stderr;
 * - never writes messages to files;
 * - never persists messages to PostgreSQL;
 * - refuses to initialize in production;
 * - stores captured messages only in the current process.
 */
export function createDevelopmentEmailDeliveryProvider(
  options:
    DevelopmentEmailDeliveryProviderOptions =
    {}
): DevelopmentEmailDeliveryProvider {
  const nodeEnvironment =
    options.nodeEnvironment ??
    process.env.NODE_ENV ??
    "development";

  if (
    nodeEnvironment ===
    "production"
  ) {
    throw new EmailDeliveryConfigurationError(
      "The development email provider cannot run in production."
    );
  }

  const now =
    options.now ??
    (() => new Date());

  const createMessageId =
    options.createMessageId ??
    randomUUID;

  const providerName =
    "poster-development-capture";

  const capturedEmails:
    CapturedDevelopmentEmail[] = [];

  return {
    providerName,

    async sendEmail(
      message
    ): Promise<
      EmailDeliveryReceipt
    > {
      const acceptedAt =
        now();

      assertValidAcceptedAt(
        acceptedAt
      );

      const messageId =
        createMessageId()
          .trim();

      if (
        messageId.length ===
        0
      ) {
        throw new EmailDeliveryConfigurationError(
          "Development email message identifier cannot be empty."
        );
      }

      capturedEmails.push({
        ...message,

        provider:
          providerName,

        messageId,

        acceptedAt:
          new Date(
            acceptedAt.getTime()
          ),
      });

      return {
        provider:
          providerName,

        messageId,

        acceptedAt:
          new Date(
            acceptedAt.getTime()
          ),
      };
    },

    getCapturedEmails() {
      return capturedEmails.map(
        (
          email
        ) => ({
          ...email,

          acceptedAt:
            new Date(
              email.acceptedAt.getTime()
            ),
        })
      );
    },

    clearCapturedEmails() {
      capturedEmails.length =
        0;
    },
  };
}