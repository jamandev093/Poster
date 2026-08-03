import {
  request as httpsRequest,
} from "node:https";

import {
  Buffer,
} from "node:buffer";

export interface RazorpayOrderAdapterConfig {
  keyId: string;
  keySecret: string;
  apiBaseUrl?: string;
  timeoutMs?: number;
  httpClient?: RazorpayHttpClient;
}

export interface RazorpayHttpRequest {
  method: "POST";
  url: URL;
  headers: Record<string, string>;
  body: string;
  timeoutMs: number;
}

export interface RazorpayHttpResponse {
  statusCode: number;
  bodyText: string;
}

export interface RazorpayHttpClient {
  request: (
    request: RazorpayHttpRequest
  ) => Promise<RazorpayHttpResponse>;
}

export interface CreateRazorpayOrderInput {
  amountMinorUnits: bigint;
  currency: "INR";
  receipt: string;
  notes?: Record<string, string>;
}

export interface RazorpayOrderResult {
  provider: "razorpay";
  providerOrderId: string;
  amountMinorUnits: bigint;
  amountPaidMinorUnits: bigint;
  amountDueMinorUnits: bigint;
  currency: "INR";
  receipt: string | null;
  status: string;
  rawPayload: Record<string, unknown>;
}

export class RazorpayOrderConfigurationError extends Error {
  readonly code =
    "razorpay_order_configuration_error";

  constructor(
    message: string
  ) {
    super(message);
    this.name = "RazorpayOrderConfigurationError";
  }
}

export class RazorpayOrderValidationError extends Error {
  readonly code =
    "razorpay_order_validation_error";

  constructor(
    message: string
  ) {
    super(message);
    this.name = "RazorpayOrderValidationError";
  }
}

export class RazorpayOrderUpstreamError extends Error {
  readonly code =
    "razorpay_order_upstream_error";

  readonly statusCode:
    number;

  readonly responseBody:
    string;

  constructor(
    statusCode: number,
    responseBody: string
  ) {
    super("Razorpay order creation failed.");
    this.name = "RazorpayOrderUpstreamError";
    this.statusCode = statusCode;
    this.responseBody = responseBody;
  }
}

export class RazorpayOrderResponseError extends Error {
  readonly code =
    "razorpay_order_response_error";

  constructor(
    message: string
  ) {
    super(message);
    this.name = "RazorpayOrderResponseError";
  }
}

const DEFAULT_RAZORPAY_API_BASE_URL =
  "https://api.razorpay.com";

const DEFAULT_TIMEOUT_MS =
  10000;

function requireConfigText(
  value: string,
  field: string
): string {
  const trimmed =
    value.trim();

  if (trimmed.length === 0) {
    throw new RazorpayOrderConfigurationError(
      `${field} is required.`
    );
  }

  return trimmed;
}

function validateInput(
  input: CreateRazorpayOrderInput
): void {
  if (input.amountMinorUnits <= 0n) {
    throw new RazorpayOrderValidationError(
      "Razorpay order amount must be greater than zero."
    );
  }

  if (input.amountMinorUnits > BigInt(Number.MAX_SAFE_INTEGER)) {
    throw new RazorpayOrderValidationError(
      "Razorpay order amount exceeds safe JSON integer limits."
    );
  }

  if (input.currency !== "INR") {
    throw new RazorpayOrderValidationError(
      "Only INR Razorpay orders are supported for v1."
    );
  }

  if (input.receipt.trim().length === 0) {
    throw new RazorpayOrderValidationError(
      "Razorpay order receipt is required."
    );
  }
}

function createAuthorizationHeader(
  keyId: string,
  keySecret: string
): string {
  return (
    "Basic " +
    Buffer
      .from(`${keyId}:${keySecret}`)
      .toString("base64")
  );
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

function requireStringField(
  payload: Record<string, unknown>,
  field: string
): string {
  const value =
    payload[field];

  if (
    typeof value !== "string" ||
    value.trim().length === 0
  ) {
    throw new RazorpayOrderResponseError(
      `Razorpay response is missing ${field}.`
    );
  }

  return value;
}

function requireIntegerField(
  payload: Record<string, unknown>,
  field: string
): bigint {
  const value =
    payload[field];

  if (
    typeof value !== "number" ||
    !Number.isSafeInteger(value)
  ) {
    throw new RazorpayOrderResponseError(
      `Razorpay response is missing ${field}.`
    );
  }

  return BigInt(value);
}

function parseRazorpayOrderResponse(
  bodyText: string
): RazorpayOrderResult {
  let parsed:
    unknown;

  try {
    parsed =
      JSON.parse(bodyText);
  } catch {
    throw new RazorpayOrderResponseError(
      "Razorpay response was not valid JSON."
    );
  }

  if (!isRecord(parsed)) {
    throw new RazorpayOrderResponseError(
      "Razorpay response was not an object."
    );
  }

  const currency =
    requireStringField(
      parsed,
      "currency"
    );

  if (currency !== "INR") {
    throw new RazorpayOrderResponseError(
      "Razorpay response currency did not match INR."
    );
  }

  const receiptValue =
    parsed.receipt;

  return {
    provider:
      "razorpay",

    providerOrderId:
      requireStringField(
        parsed,
        "id"
      ),

    amountMinorUnits:
      requireIntegerField(
        parsed,
        "amount"
      ),

    amountPaidMinorUnits:
      requireIntegerField(
        parsed,
        "amount_paid"
      ),

    amountDueMinorUnits:
      requireIntegerField(
        parsed,
        "amount_due"
      ),

    currency:
      "INR",

    receipt:
      typeof receiptValue === "string"
        ? receiptValue
        : null,

    status:
      requireStringField(
        parsed,
        "status"
      ),

    rawPayload:
      parsed,
  };
}

export function createNodeHttpsRazorpayHttpClient(): RazorpayHttpClient {
  return {
    request(
      input
    ) {
      return new Promise<RazorpayHttpResponse>(
        (
          resolve,
          reject
        ) => {
          const request =
            httpsRequest(
              {
                protocol:
                  input.url.protocol,

                hostname:
                  input.url.hostname,

                port:
                  input.url.port || undefined,

                path:
                  `${input.url.pathname}${input.url.search}`,

                method:
                  input.method,

                headers:
                  input.headers,

                timeout:
                  input.timeoutMs,
              },
              response => {
                const chunks:
                  Buffer[] = [];

                response.on(
                  "data",
                  chunk => {
                    chunks.push(
                      Buffer.isBuffer(chunk)
                        ? chunk
                        : Buffer.from(chunk)
                    );
                  }
                );

                response.on(
                  "end",
                  () => {
                    resolve({
                      statusCode:
                        response.statusCode ?? 0,

                      bodyText:
                        Buffer
                          .concat(chunks)
                          .toString("utf8"),
                    });
                  }
                );
              }
            );

          request.on(
            "timeout",
            () => {
              request.destroy(
                new Error("Razorpay order request timed out.")
              );
            }
          );

          request.on(
            "error",
            reject
          );

          request.write(
            input.body
          );

          request.end();
        }
      );
    },
  };
}

export interface RazorpayOrderAdapter {
  createOrder: (
    input: CreateRazorpayOrderInput
  ) => Promise<RazorpayOrderResult>;
}

export function createRazorpayOrderAdapter(
  config: RazorpayOrderAdapterConfig
): RazorpayOrderAdapter {
  const keyId =
    requireConfigText(
      config.keyId,
      "Razorpay key id"
    );

  const keySecret =
    requireConfigText(
      config.keySecret,
      "Razorpay key secret"
    );

  const apiBaseUrl =
    config.apiBaseUrl ??
    DEFAULT_RAZORPAY_API_BASE_URL;

  const timeoutMs =
    config.timeoutMs ??
    DEFAULT_TIMEOUT_MS;

  const httpClient =
    config.httpClient ??
    createNodeHttpsRazorpayHttpClient();

  return {
    async createOrder(
      input
    ) {
      validateInput(input);

      const url =
        new URL(
          "/v1/orders",
          apiBaseUrl
        );

      const payload: Record<string, unknown> = {
        amount:
          Number(input.amountMinorUnits),

        currency:
          input.currency,

        receipt:
          input.receipt,
      };

      if (input.notes !== undefined) {
        payload.notes =
          input.notes;
      }

      const response =
        await httpClient.request({
          method:
            "POST",

          url,

          headers: {
            Authorization:
              createAuthorizationHeader(
                keyId,
                keySecret
              ),

            "Content-Type":
              "application/json",
          },

          body:
            JSON.stringify(payload),

          timeoutMs,
        });

      if (
        response.statusCode < 200 ||
        response.statusCode >= 300
      ) {
        throw new RazorpayOrderUpstreamError(
          response.statusCode,
          response.bodyText
        );
      }

      return parseRazorpayOrderResponse(
        response.bodyText
      );
    },
  };
}