import type {
  WalletFundingCheckoutOrder,
} from "../wallet/wallet.funding.types";

const RAZORPAY_SCRIPT_ID =
  "poster-razorpay-checkout-script";

const RAZORPAY_SCRIPT_SRC =
  "https://checkout.razorpay.com/v1/checkout.js";

export interface RazorpayCheckoutSuccess {
  providerOrderId:
    string;

  providerPaymentId:
    string;

  providerSignature:
    string;
}

interface RazorpayCheckoutPaymentResponse {
  razorpay_order_id:
    string;

  razorpay_payment_id:
    string;

  razorpay_signature:
    string;
}

interface RazorpayCheckoutPrefill {
  name?:
    string;

  email?:
    string;

  contact?:
    string;
}

interface RazorpayCheckoutOptions {
  key:
    string;

  amount:
    number;

  currency:
    string;

  name:
    string;

  description:
    string;

  order_id:
    string;

  handler:
    (
      response:
        RazorpayCheckoutPaymentResponse
    ) => void;

  prefill?:
    RazorpayCheckoutPrefill;

  notes?:
    Record<
      string,
      string
    >;

  theme?:
    {
      color?:
        string;
    };

  modal?:
    {
      ondismiss?:
        () => void;
    };
}

interface RazorpayCheckoutInstance {
  open:
    () => void;
}

type RazorpayCheckoutConstructor =
  new (
    options:
      RazorpayCheckoutOptions
  ) => RazorpayCheckoutInstance;

declare global {
  interface Window {
    Razorpay?:
      RazorpayCheckoutConstructor;
  }
}

function requireCheckoutText(
  value:
    string,
  field:
    string
): string {
  const trimmed =
    value.trim();

  if (!trimmed) {
    throw new Error(
      `${field} is required to open Razorpay Checkout.`
    );
  }

  return trimmed;
}

function isBrowserRuntime():
  boolean {
  return (
    typeof window !== "undefined" &&
    typeof document !== "undefined"
  );
}

function removeExistingCheckoutScript():
  void {
  const existingScript =
    document.getElementById(
      RAZORPAY_SCRIPT_ID
    );

  existingScript?.remove();
}

function appendCheckoutScript():
  Promise<void> {
  return new Promise(
    (
      resolve,
      reject
    ) => {
      const script =
        document.createElement(
          "script"
        );

      script.id =
        RAZORPAY_SCRIPT_ID;

      script.src =
        RAZORPAY_SCRIPT_SRC;

      script.async =
        true;

      script.addEventListener(
        "load",
        () => {
          resolve();
        },
        {
          once:
            true,
        }
      );

      script.addEventListener(
        "error",
        () => {
          reject(
            new Error(
              "Razorpay Checkout could not be loaded."
            )
          );
        },
        {
          once:
            true,
        }
      );

      document.body.appendChild(
        script
      );
    }
  );
}

export async function loadRazorpayCheckout():
  Promise<RazorpayCheckoutConstructor> {
  if (!isBrowserRuntime()) {
    throw new Error(
      "Razorpay Checkout can only run in the browser."
    );
  }

  if (window.Razorpay) {
    return window.Razorpay;
  }

  removeExistingCheckoutScript();

  await appendCheckoutScript();

  if (!window.Razorpay) {
    throw new Error(
      "Razorpay Checkout loaded without exposing the runtime."
    );
  }

  return window.Razorpay;
}

function createPrefill(
  order:
    WalletFundingCheckoutOrder
): RazorpayCheckoutPrefill {
  const prefill:
    RazorpayCheckoutPrefill = {};

  if (order.customerName) {
    prefill.name =
      order.customerName;
  }

  if (order.customerEmail) {
    prefill.email =
      order.customerEmail;
  }

  if (order.customerPhone) {
    prefill.contact =
      order.customerPhone;
  }

  return prefill;
}

function mapCheckoutResponse(
  response:
    RazorpayCheckoutPaymentResponse,
  order:
    WalletFundingCheckoutOrder
): RazorpayCheckoutSuccess {
  return {
    providerOrderId:
      requireCheckoutText(
        response.razorpay_order_id ||
          order.providerOrderId,
        "Razorpay order id"
      ),

    providerPaymentId:
      requireCheckoutText(
        response.razorpay_payment_id,
        "Razorpay payment id"
      ),

    providerSignature:
      requireCheckoutText(
        response.razorpay_signature,
        "Razorpay signature"
      ),
  };
}

export async function openRazorpayCheckout(
  order:
    WalletFundingCheckoutOrder
): Promise<RazorpayCheckoutSuccess> {
  const Razorpay =
    await loadRazorpayCheckout();

  const publicKeyId =
    requireCheckoutText(
      order.publicKeyId,
      "Razorpay public key"
    );

  const providerOrderId =
    requireCheckoutText(
      order.providerOrderId,
      "Razorpay order id"
    );

  return await new Promise(
    (
      resolve,
      reject
    ) => {
      let settled =
        false;

      function resolveOnce(
        response:
          RazorpayCheckoutPaymentResponse
      ) {
        if (settled) {
          return;
        }

        settled =
          true;

        resolve(
          mapCheckoutResponse(
            response,
            order
          )
        );
      }

      function rejectOnce(
        error:
          Error
      ) {
        if (settled) {
          return;
        }

        settled =
          true;

        reject(
          error
        );
      }

      const checkout =
        new Razorpay({
          key:
            publicKeyId,

          amount:
            order.amountMinor,

          currency:
            order.currency,

          name:
            order.checkoutName,

          description:
            order.checkoutDescription,

          order_id:
            providerOrderId,

          handler:
            resolveOnce,

          prefill:
            createPrefill(
              order
            ),

          notes: {
            source:
              "poster_client_wallet",

            fundingOrderId:
              order.fundingOrderId,

            walletId:
              order.walletId,

            organizationId:
              order.organizationId,
          },

          theme: {
            color:
              "#5B86E5",
          },

          modal: {
            ondismiss:
              () => {
                rejectOnce(
                  new Error(
                    "Razorpay Checkout was closed before payment was completed."
                  )
                );
              },
          },
        });

      checkout.open();
    }
  );
}