"use client";

import {
  useMemo,
  useState,
  type FormEvent,
} from "react";

import {
  createWalletFundingOrder,
} from "../services/wallet-funding.service";

import {
  openRazorpayCheckout,
} from "../services/razorpay-checkout.service";

import {
  verifyWalletFundingPayment,
} from "../services/wallet-payment-verification.service";

import {
  majorToMinorAmount,
} from "../payments/currency.types";

import {
  formatMoneyMinor,
} from "../payments/payment.formatters";

import {
  WALLET_FUNDING_PRESET_AMOUNTS_MINOR,
  validateWalletFundingAmount,
} from "../wallet/wallet.funding.types";

import type {
  AdvertiserWallet,
} from "../wallet/wallet.types";

import styles from "./AddFundsPanel.module.css";

type SubmissionStep =
  | "idle"
  | "creating_order"
  | "checkout"
  | "verifying";

interface AddFundsPanelProps {
  wallet:
    AdvertiserWallet;

  onFundingComplete?:
    () => Promise<void> | void;
}

function minorToInputValue(
  amountMinor:
    number
): string {
  return String(
    amountMinor /
      100
  );
}

function getErrorMessage(
  error:
    unknown
): string {
  if (error instanceof Error) {
    return error.message;
  }

  return "Wallet funding could not be completed.";
}

function getSubmitLabel(
  step:
    SubmissionStep
): string {
  switch (step) {
    case "creating_order":
      return "Creating secure order...";

    case "checkout":
      return "Opening Razorpay...";

    case "verifying":
      return "Verifying payment...";

    case "idle":
      return "Continue with Razorpay";
  }
}

export default function AddFundsPanel({
  wallet,
  onFundingComplete,
}: AddFundsPanelProps) {
  const [
    amountInput,
    setAmountInput,
  ] =
    useState(
      minorToInputValue(
        WALLET_FUNDING_PRESET_AMOUNTS_MINOR[
          1
        ]
      )
    );

  const [
    submissionStep,
    setSubmissionStep,
  ] =
    useState<SubmissionStep>(
      "idle"
    );

  const [
    errorMessage,
    setErrorMessage,
  ] =
    useState<string | null>(
      null
    );

  const [
    successMessage,
    setSuccessMessage,
  ] =
    useState<string | null>(
      null
    );

  const [
    statusMessage,
    setStatusMessage,
  ] =
    useState<string | null>(
      null
    );

  const parsedMajorAmount =
    Number(
      amountInput
    );

  const amountMinor =
    Number.isFinite(
      parsedMajorAmount
    )
      ? majorToMinorAmount(
          parsedMajorAmount,
          wallet.currency
        )
      : 0;

  const validationMessage =
    useMemo(
      () =>
        validateWalletFundingAmount(
          amountMinor
        ),
      [
        amountMinor,
      ]
    );

  const projectedBalanceMinor =
    wallet.amounts
      .availableMinor +
    amountMinor;

  const isSubmitting =
    submissionStep !==
    "idle";

  function selectPreset(
    presetAmountMinor:
      number
  ): void {
    setAmountInput(
      minorToInputValue(
        presetAmountMinor
      )
    );

    setErrorMessage(
      null
    );

    setSuccessMessage(
      null
    );

    setStatusMessage(
      null
    );
  }

  async function handleSubmit(
    event:
      FormEvent<HTMLFormElement>
  ): Promise<void> {
    event.preventDefault();

    setErrorMessage(
      null
    );

    setSuccessMessage(
      null
    );

    setStatusMessage(
      null
    );

    if (validationMessage) {
      setErrorMessage(
        validationMessage
      );

      return;
    }

    try {
      setSubmissionStep(
        "creating_order"
      );

      setStatusMessage(
        "Creating a secure Razorpay Wallet funding order..."
      );

      const order =
        await createWalletFundingOrder({
          walletId:
            wallet.id,

          organizationId:
            wallet.organizationId,

          currency:
            wallet.currency,

          amountMinor,
        });

      setSubmissionStep(
        "checkout"
      );

      setStatusMessage(
        "Opening Razorpay Checkout..."
      );

      const checkoutResult =
        await openRazorpayCheckout(
          order
        );

      setSubmissionStep(
        "verifying"
      );

      setStatusMessage(
        "Verifying payment with Poster Backend..."
      );

      const verification =
        await verifyWalletFundingPayment({
          fundingOrderId:
            order.fundingOrderId,

          providerOrderId:
            checkoutResult.providerOrderId,

          providerPaymentId:
            checkoutResult.providerPaymentId,

          providerSignature:
            checkoutResult.providerSignature,

          amountMinor:
            order.amountMinor,

          currency:
            order.currency,
        });

      if (onFundingComplete) {
        await onFundingComplete();
      }

      setSuccessMessage(
        verification.replay
          ? "This payment was already verified. Wallet data has been refreshed."
          : "Payment verified by Poster Backend. Wallet data has been refreshed."
      );

      setStatusMessage(
        null
      );
    } catch (error) {
      setStatusMessage(
        null
      );

      setErrorMessage(
        getErrorMessage(
          error
        )
      );
    } finally {
      setSubmissionStep(
        "idle"
      );
    }
  }

  return (
    <section
      className={
        styles.panel
      }
      aria-labelledby="add-funds-title"
      aria-busy={
        isSubmitting
      }
    >
      <div
        className={
          styles.heading
        }
      >
        <div>
          <span
            className={
              styles.eyebrow
            }
          >
            RAZORPAY
          </span>

          <h3 id="add-funds-title">
            Add funds
          </h3>

          <p>
            Add verified funds to your Poster Wallet for
            campaign allowances.
          </p>
        </div>

        <span
          className={
            styles.secureBadge
          }
        >
          Secure checkout
        </span>
      </div>

      <form
        className={
          styles.form
        }
        onSubmit={
          handleSubmit
        }
      >
        <fieldset
          className={
            styles.presetFieldset
          }
          disabled={
            isSubmitting
          }
        >
          <legend>
            Choose an amount
          </legend>

          <div
            className={
              styles.presetGrid
            }
          >
            {WALLET_FUNDING_PRESET_AMOUNTS_MINOR.map(
              presetAmountMinor => {
                const selected =
                  presetAmountMinor ===
                  amountMinor;

                return (
                  <button
                    key={
                      presetAmountMinor
                    }
                    type="button"
                    className={
                      selected
                        ? styles.presetButtonSelected
                        : styles.presetButton
                    }
                    aria-pressed={
                      selected
                    }
                    onClick={
                      () => {
                        selectPreset(
                          presetAmountMinor
                        );
                      }
                    }
                  >
                    {formatMoneyMinor(
                      presetAmountMinor,
                      wallet.currency
                    )}
                  </button>
                );
              }
            )}
          </div>
        </fieldset>

        <div
          className={
            styles.customAmount
          }
        >
          <label htmlFor="wallet-funding-amount">
            Custom amount
          </label>

          <div
            className={
              styles.moneyInput
            }
          >
            <span aria-hidden="true">
              
            </span>

            <input
              id="wallet-funding-amount"
              type="number"
              min="100"
              max="1000000"
              step="1"
              inputMode="numeric"
              value={
                amountInput
              }
              onChange={event => {
                setAmountInput(
                  event.target.value
                );

                setErrorMessage(
                  null
                );

                setSuccessMessage(
                  null
                );

                setStatusMessage(
                  null
                );
              }}
              aria-describedby="wallet-funding-help"
              disabled={
                isSubmitting
              }
              required
            />
          </div>

          <small id="wallet-funding-help">
            Minimum 100 · Maximum 10,00,000 per transaction
          </small>
        </div>

        <div
          className={
            styles.summary
          }
        >
          <div>
            <span>
              Current available balance
            </span>

            <strong>
              {formatMoneyMinor(
                wallet.amounts
                  .availableMinor,
                wallet.currency
              )}
            </strong>
          </div>

          <div>
            <span>
              Amount to add
            </span>

            <strong>
              {formatMoneyMinor(
                amountMinor,
                wallet.currency
              )}
            </strong>
          </div>

          <div
            className={
              styles.projectedBalance
            }
          >
            <span>
              Balance after Backend verification
            </span>

            <strong>
              {formatMoneyMinor(
                projectedBalanceMinor,
                wallet.currency
              )}
            </strong>
          </div>
        </div>

        {statusMessage ? (
          <p
            className={
              styles.statusMessage
            }
            role="status"
          >
            {statusMessage}
          </p>
        ) : null}

        {errorMessage ? (
          <p
            className={
              styles.errorMessage
            }
            role="alert"
          >
            {errorMessage}
          </p>
        ) : null}

        {successMessage ? (
          <p
            className={
              styles.successMessage
            }
            role="status"
          >
            {successMessage}
          </p>
        ) : null}

        <div
          className={
            styles.actions
          }
        >
          <button
            type="submit"
            className={
              styles.submitButton
            }
            disabled={
              isSubmitting ||
              Boolean(
                validationMessage
              )
            }
          >
            {getSubmitLabel(
              submissionStep
            )}
          </button>

          <p>
            Browser payment callbacks are submitted to
            Poster Backend for signature verification. Razorpay
            webhooks remain the final reconciliation source.
          </p>
        </div>
      </form>
    </section>
  );
}