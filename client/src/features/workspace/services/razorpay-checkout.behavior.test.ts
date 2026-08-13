import {
  afterEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

import {
  loadRazorpayCheckout,
  openRazorpayCheckout,
} from "./razorpay-checkout.service";

import type {
  WalletFundingCheckoutOrder,
} from "../wallet/wallet.funding.types";

interface PaymentResponse {
  razorpay_order_id:
    string;

  razorpay_payment_id:
    string;

  razorpay_signature:
    string;
}

interface CheckoutOptionsProbe {
  key:
    string;

  amount:
    number;

  currency:
    string;

  name?:
    string;

  description?:
    string;

  order_id:
    string;

  handler:
    (
      response:
        PaymentResponse
    ) => void;

  prefill:
    Record<
      string,
      string
    >;

  notes: {
    source:
      string;

    fundingOrderId:
      string;

    walletId:
      string;

    organizationId:
      string;
  };

  theme: {
    color:
      string;
  };

  modal: {
    ondismiss:
      () => void;
  };
}

type RazorpayConstructorProbe =
  new (
    options:
      CheckoutOptionsProbe
  ) => {
    open:
      () => void;
  };

interface FakeScript {
  id:
    string;

  src:
    string;

  async:
    boolean;

  parentNode:
    object |
    null;

  addEventListener:
    (
      type:
        string,
      listener:
        () => void
    ) => void;

  remove:
    () => void;

  emit:
    (
      type:
        string
    ) => void;
}

function createOrder(
  overrides:
    Partial<
      WalletFundingCheckoutOrder
    > =
      {}
):
  WalletFundingCheckoutOrder {
  return {
    fundingOrderId:
      "WFO-1",

    walletId:
      "WLT-1",

    organizationId:
      "ORG-1",

    status:
      "verification_pending",

    currency:
      "INR",

    amountMinor:
      5000,

    provider:
      "razorpay",

    providerOrderId:
      "order_1",

    publicKeyId:
      "rzp_test_key",

    checkoutName:
      "Poster Wallet",

    checkoutDescription:
      "Add verified funds.",

    customerName:
      "Poster Client",

    customerEmail:
      "client@example.com",

    customerPhone:
      "9999999999",

    expiresAt:
      "2099-01-01T00:15:00.000Z",

    createdAt:
      "2099-01-01T00:00:00.000Z",

    ...overrides,
  };
}

function installFakeBrowser() {
  const scripts =
    new Map<
      string,
      FakeScript
    >();

  const appended:
    FakeScript[] =
      [];

  function createScript():
    FakeScript {
    const listeners =
      new Map<
        string,
        Array<
          () => void
        >
      >();

    const script:
      FakeScript = {
      id:
        "",

      src:
        "",

      async:
        false,

      parentNode:
        null,

      addEventListener(
        type,
        listener
      ) {
        const existing =
          listeners.get(
            type
          ) ?? [];

        existing.push(
          listener
        );

        listeners.set(
          type,
          existing
        );
      },

      remove() {
        if (
          script.id
        ) {
          scripts.delete(
            script.id
          );
        }

        script.parentNode =
          null;
      },

      emit(
        type
      ) {
        for (
          const listener
          of listeners.get(
            type
          ) ?? []
        ) {
          listener();
        }
      },
    };

    return script;
  }

  function appendScript(
    script:
      FakeScript
  ) {
    script.parentNode =
      {};

    if (
      script.id
    ) {
      scripts.set(
        script.id,
        script
      );
    }

    appended.push(
      script
    );

    return script;
  }

  const documentProbe = {
    getElementById(
      id:
        string
    ) {
      return (
        scripts.get(
          id
        ) ??
        null
      );
    },

    createElement(
      tag:
        string
    ) {
      if (
        tag !==
        "script"
      ) {
        throw new Error(
          `Unexpected element creation: ${tag}`
        );
      }

      return createScript();
    },

    body: {
      appendChild:
        appendScript,
    },
  };

  const windowProbe:
    {
      Razorpay?:
        RazorpayConstructorProbe;
    } = {};

  vi.stubGlobal(
    "document",
    documentProbe
  );

  vi.stubGlobal(
    "window",
    windowProbe
  );

  return {
    appended,
    windowProbe,
  };
}

describe(
  "Razorpay Checkout browser lifecycle",
  () => {
    afterEach(
      () => {
        vi.restoreAllMocks();
        vi.unstubAllGlobals();
      }
    );

    it(
      "rejects outside browser runtime",
      async () => {
        vi.stubGlobal(
          "window",
          undefined
        );

        vi.stubGlobal(
          "document",
          undefined
        );

        await expect(
          loadRazorpayCheckout()
        ).rejects.toThrow(
          "Razorpay Checkout can only run in the browser."
        );
      }
    );

    it(
      "reuses an already available Razorpay runtime",
      async () => {
        const browser =
          installFakeBrowser();

        class ExistingRazorpay {
          open() {
          }
        }

        browser.windowProbe.Razorpay =
          ExistingRazorpay as
            RazorpayConstructorProbe;

        await expect(
          loadRazorpayCheckout()
        ).resolves.toBe(
          ExistingRazorpay
        );

        expect(
          browser.appended
        ).toHaveLength(
          0
        );
      }
    );

    it(
      "injects the official Razorpay script into document body and resolves after load",
      async () => {
        const browser =
          installFakeBrowser();

        const pending =
          loadRazorpayCheckout();

        expect(
          browser.appended
        ).toHaveLength(
          1
        );

        const script =
          browser.appended[0];

        expect(
          script.id
        ).toBe(
          "poster-razorpay-checkout-script"
        );

        expect(
          script.src
        ).toBe(
          "https://checkout.razorpay.com/v1/checkout.js"
        );

        expect(
          script.async
        ).toBe(
          true
        );

        class LoadedRazorpay {
          open() {
          }
        }

        browser.windowProbe.Razorpay =
          LoadedRazorpay as
            RazorpayConstructorProbe;

        script.emit(
          "load"
        );

        await expect(
          pending
        ).resolves.toBe(
          LoadedRazorpay
        );
      }
    );

    it(
      "rejects Razorpay script loading failure without unhandled rejection",
      async () => {
        const browser =
          installFakeBrowser();

        const pending =
          loadRazorpayCheckout();

        expect(
          browser.appended
        ).toHaveLength(
          1
        );

        const assertion =
          expect(
            pending
          ).rejects.toThrow(
            "Razorpay Checkout could not be loaded."
          );

        browser.appended[0]
          .emit(
            "error"
          );

        await assertion;
      }
    );

    it(
      "fails closed when loaded script exposes no Razorpay runtime",
      async () => {
        const browser =
          installFakeBrowser();

        const pending =
          loadRazorpayCheckout();

        expect(
          browser.appended
        ).toHaveLength(
          1
        );

        const assertion =
          expect(
            pending
          ).rejects.toThrow(
            "Razorpay Checkout loaded without exposing the runtime."
          );

        browser.appended[0]
          .emit(
            "load"
          );

        await assertion;
      }
    );

    it(
      "maps Wallet funding order into exact Razorpay options and result",
      async () => {
        const browser =
          installFakeBrowser();

        let captured:
          CheckoutOptionsProbe |
          null =
            null;

        class FakeRazorpay {
          constructor(
            options:
              CheckoutOptionsProbe
          ) {
            captured =
              options;
          }

          open() {
            if (!captured) {
              throw new Error(
                "Checkout options missing."
              );
            }

            captured.handler({
              razorpay_order_id:
                "order_1",

              razorpay_payment_id:
                "pay_1",

              razorpay_signature:
                "signature_1",
            });
          }
        }

        browser.windowProbe.Razorpay =
          FakeRazorpay as
            RazorpayConstructorProbe;

        const result =
          await openRazorpayCheckout(
            createOrder()
          );

        expect(
          result
        ).toEqual({
          providerOrderId:
            "order_1",

          providerPaymentId:
            "pay_1",

          providerSignature:
            "signature_1",
        });

        expect(
          captured
        ).toMatchObject({
          key:
            "rzp_test_key",

          amount:
            5000,

          currency:
            "INR",

          name:
            "Poster Wallet",

          description:
            "Add verified funds.",

          order_id:
            "order_1",

          prefill: {
            name:
              "Poster Client",

            email:
              "client@example.com",

            contact:
              "9999999999",
          },

          notes: {
            source:
              "poster_client_wallet",

            fundingOrderId:
              "WFO-1",

            walletId:
              "WLT-1",

            organizationId:
              "ORG-1",
          },

          theme: {
            color:
              "#5B86E5",
          },
        });
      }
    );

    it(
      "rejects checkout dismissal",
      async () => {
        const browser =
          installFakeBrowser();

        let captured:
          CheckoutOptionsProbe |
          null =
            null;

        class FakeRazorpay {
          constructor(
            options:
              CheckoutOptionsProbe
          ) {
            captured =
              options;
          }

          open() {
            captured?.modal
              .ondismiss();
          }
        }

        browser.windowProbe.Razorpay =
          FakeRazorpay as
            RazorpayConstructorProbe;

        await expect(
          openRazorpayCheckout(
            createOrder()
          )
        ).rejects.toThrow(
          "Razorpay Checkout was closed before payment was completed."
        );
      }
    );

    it(
      "settles only once when successful response is followed by dismissal",
      async () => {
        const browser =
          installFakeBrowser();

        let captured:
          CheckoutOptionsProbe |
          null =
            null;

        class FakeRazorpay {
          constructor(
            options:
              CheckoutOptionsProbe
          ) {
            captured =
              options;
          }

          open() {
            if (!captured) {
              throw new Error(
                "Checkout options missing."
              );
            }

            captured.handler({
              razorpay_order_id:
                "order_1",

              razorpay_payment_id:
                "pay_1",

              razorpay_signature:
                "signature_1",
            });

            captured.modal
              .ondismiss();
          }
        }

        browser.windowProbe.Razorpay =
          FakeRazorpay as
            RazorpayConstructorProbe;

        await expect(
          openRazorpayCheckout(
            createOrder()
          )
        ).resolves.toEqual({
          providerOrderId:
            "order_1",

          providerPaymentId:
            "pay_1",

          providerSignature:
            "signature_1",
        });
      }
    );

    it(
      "rejects missing public key",
      async () => {
        const browser =
          installFakeBrowser();

        class FakeRazorpay {
          open() {
          }
        }

        browser.windowProbe.Razorpay =
          FakeRazorpay as
            RazorpayConstructorProbe;

        await expect(
          openRazorpayCheckout(
            createOrder({
              publicKeyId:
                "",
            })
          )
        ).rejects.toThrow(
          "Razorpay public key is required to open Razorpay Checkout."
        );
      }
    );

    it(
      "rejects missing provider order id",
      async () => {
        const browser =
          installFakeBrowser();

        class FakeRazorpay {
          open() {
          }
        }

        browser.windowProbe.Razorpay =
          FakeRazorpay as
            RazorpayConstructorProbe;

        await expect(
          openRazorpayCheckout(
            createOrder({
              providerOrderId:
                "",
            })
          )
        ).rejects.toThrow(
          "Razorpay order id is required to open Razorpay Checkout."
        );
      }
    );

    it(
      "rejects incomplete Razorpay payment callback",
      async () => {
        const browser =
          installFakeBrowser();

        let captured:
          CheckoutOptionsProbe |
          null =
            null;

        class FakeRazorpay {
          constructor(
            options:
              CheckoutOptionsProbe
          ) {
            captured =
              options;
          }

          open() {
            captured?.handler({
              razorpay_order_id:
                "order_1",

              razorpay_payment_id:
                "",

              razorpay_signature:
                "signature_1",
            });
          }
        }

        browser.windowProbe.Razorpay =
          FakeRazorpay as
            RazorpayConstructorProbe;

        await expect(
          openRazorpayCheckout(
            createOrder()
          )
        ).rejects.toThrow(
          "Razorpay payment id is required to open Razorpay Checkout."
        );
      }
    );
  }
);