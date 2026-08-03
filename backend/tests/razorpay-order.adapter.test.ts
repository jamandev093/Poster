import {
  Buffer,
} from "node:buffer";

import {
  describe,
  expect,
  it,
  vi,
} from "vitest";

import {
  RazorpayOrderResponseError,
  RazorpayOrderUpstreamError,
  RazorpayOrderValidationError,
  createRazorpayOrderAdapter,
  type RazorpayHttpClient,
} from "../src/integrations/payments/index.js";

function createHttpClient(
  body:
    Record<string, unknown>,
  statusCode =
    200
) {
  const request =
    vi.fn<
      RazorpayHttpClient[
        "request"
      ]
    >()
      .mockResolvedValue({
        statusCode,
        bodyText:
          JSON.stringify(body),
      });

  return {
    httpClient: {
      request,
    } satisfies RazorpayHttpClient,

    request,
  };
}

describe("Razorpay order adapter", () => {
  it("creates a Razorpay order request and maps the response", async () => {
    const {
      httpClient,
      request,
    } =
      createHttpClient({
        id:
          "order_razorpay_0001",

        amount:
          500000,

        amount_paid:
          0,

        amount_due:
          500000,

        currency:
          "INR",

        receipt:
          "wallet-funding-0001",

        status:
          "created",
      });

    const adapter =
      createRazorpayOrderAdapter({
        keyId:
          "rzp_test_key",

        keySecret:
          "rzp_test_secret",

        apiBaseUrl:
          "https://api.razorpay.com",

        timeoutMs:
          5000,

        httpClient,
      });

    const result =
      await adapter.createOrder({
        amountMinorUnits:
          500000n,

        currency:
          "INR",

        receipt:
          "wallet-funding-0001",

        notes: {
          organizationId:
            "org_0001",
        },
      });

    expect(result).toMatchObject({
      provider:
        "razorpay",

      providerOrderId:
        "order_razorpay_0001",

      amountMinorUnits:
        500000n,

      amountDueMinorUnits:
        500000n,

      currency:
        "INR",

      receipt:
        "wallet-funding-0001",

      status:
        "created",
    });

    const firstCall =
      request.mock.calls[0];

    expect(firstCall).toBeDefined();

    expect(firstCall?.[0].method).toBe("POST");
    expect(firstCall?.[0].url.toString()).toBe(
      "https://api.razorpay.com/v1/orders"
    );

    expect(firstCall?.[0].headers.Authorization).toBe(
      "Basic " +
        Buffer
          .from("rzp_test_key:rzp_test_secret")
          .toString("base64")
    );

    expect(JSON.parse(firstCall?.[0].body ?? "{}")).toMatchObject({
      amount:
        500000,

      currency:
        "INR",

      receipt:
        "wallet-funding-0001",

      notes: {
        organizationId:
          "org_0001",
      },
    });
  });

  it("rejects invalid amounts before sending an HTTP request", async () => {
    const {
      httpClient,
      request,
    } =
      createHttpClient({});

    const adapter =
      createRazorpayOrderAdapter({
        keyId:
          "rzp_test_key",

        keySecret:
          "rzp_test_secret",

        httpClient,
      });

    await expect(
      adapter.createOrder({
        amountMinorUnits:
          0n,

        currency:
          "INR",

        receipt:
          "wallet-funding-0001",
      })
    ).rejects.toBeInstanceOf(
      RazorpayOrderValidationError
    );

    expect(request).not.toHaveBeenCalled();
  });

  it("maps Razorpay non-success responses as upstream errors", async () => {
    const {
      httpClient,
    } =
      createHttpClient(
        {
          error: {
            description:
              "Bad request",
          },
        },
        400
      );

    const adapter =
      createRazorpayOrderAdapter({
        keyId:
          "rzp_test_key",

        keySecret:
          "rzp_test_secret",

        httpClient,
      });

    await expect(
      adapter.createOrder({
        amountMinorUnits:
          500000n,

        currency:
          "INR",

        receipt:
          "wallet-funding-0001",
      })
    ).rejects.toBeInstanceOf(
      RazorpayOrderUpstreamError
    );
  });

  it("rejects malformed Razorpay order responses", async () => {
    const {
      httpClient,
    } =
      createHttpClient({
        id:
          "order_razorpay_0001",

        amount:
          500000,
      });

    const adapter =
      createRazorpayOrderAdapter({
        keyId:
          "rzp_test_key",

        keySecret:
          "rzp_test_secret",

        httpClient,
      });

    await expect(
      adapter.createOrder({
        amountMinorUnits:
          500000n,

        currency:
          "INR",

        receipt:
          "wallet-funding-0001",
      })
    ).rejects.toBeInstanceOf(
      RazorpayOrderResponseError
    );
  });
});