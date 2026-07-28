export const EMAIL_DELIVERY_CATEGORIES = [
  "signup_verification",
] as const;

export type EmailDeliveryCategory =
  (typeof EMAIL_DELIVERY_CATEGORIES)[number];

/**
 * Provider-neutral email message.
 *
 * Message bodies may contain short-lived authentication
 * challenges. They must never be written to application logs,
 * analytics events, database columns, or error messages.
 */
export interface EmailDeliveryMessage {
  category:
    EmailDeliveryCategory;

  to:
    string;

  subject:
    string;

  text:
    string;

  html:
    string;

  /**
   * Stable provider idempotency key.
   *
   * Use a token-record UUID or another non-secret identifier.
   * Never use the raw verification code as this value.
   */
  idempotencyKey:
    string;
}

export interface EmailDeliveryReceipt {
  provider:
    string;

  messageId:
    string;

  acceptedAt:
    Date;
}

export interface EmailDeliveryProvider {
  readonly providerName:
    string;

  sendEmail:
    (
      message:
        EmailDeliveryMessage
    ) => Promise<
      EmailDeliveryReceipt
    >;
}

export class EmailDeliveryConfigurationError
  extends Error {
  public readonly operational =
    true;

  public constructor(
    message:
      string
  ) {
    super(
      message
    );

    this.name =
      "EmailDeliveryConfigurationError";

    Object.setPrototypeOf(
      this,
      new.target.prototype
    );
  }
}