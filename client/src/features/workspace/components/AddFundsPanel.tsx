"use client";

import {
  useMemo,
  useState,
} from "react";

import {
  createWalletFundingOrder,
} from "../services/wallet-funding.service";

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

interface AddFundsPanelProps {
  wallet:
    AdvertiserWallet;
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

export default function AddFundsPanel({
  wallet,
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
    isSubmitting,
    setIsSubmitting,
  ] =
    useState(
      false
    );

  const [
    errorMessage,
    setErrorMessage,
  ] =
    useState<
      string | null
    >(
      null
    );

  const [
    successMessage,
    setSuccessMessage,
  ] =
    useState<
      string | null
    >(
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
  }

  async function handleSubmit(
    event:
      React.FormEvent<HTMLFormElement>
  ): Promise<void> {
    event.preventDefault();

    setErrorMessage(
      null
    );

    setSuccessMessage(
      null
    );

    if (
      validationMessage
    ) {
      setErrorMessage(
        validationMessage
      );

      return;
    }

    setIsSubmitting(
      true
    );

    try {
      const order =
        await createWalletFundingOrder(
          {
            walletId:
              wallet.id,

            organizationId:
              wallet.organizationId,

            currency:
              wallet.currency,

            amountMinor,
          }
        );

      setSuccessMessage(
        `Funding order ${order.fundingOrderId} is ready for secure Razorpay Checkout.`
      );

      /*
       * The next batch will open Razorpay Checkout using:
       *
       * - order.providerOrderId;
       * - order.publicKeyId;
       * - order.amountMinor;
       * - order.currency.
       *
       * The browser callback will not credit the Wallet.
       * Backend verification and Razorpay webhook processing
       * remain authoritative.
       */
    } catch (
      error
    ) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Wallet funding could not be started."
      );
    } finally {
      setIsSubmitting(
        false
      );
    }
  }

  return (
    <section
      className={
        styles.panel
      }
      aria-labelledby="add-funds-title"
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
              (
                presetAmountMinor
              ) => {
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
                      () =>
                        selectPreset(
                          presetAmountMinor
                        )
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
            <span
              aria-hidden="true"
            >
              
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
              onChange={(
                event
              ) => {
                setAmountInput(
                  event.target.value
                );

                setErrorMessage(
                  null
                );

                setSuccessMessage(
                  null
                );
              }}
              aria-describedby="wallet-funding-help"
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
              Balance after verified payment
            </span>

            <strong>
              {formatMoneyMinor(
                projectedBalanceMinor,
                wallet.currency
              )}
            </strong>
          </div>
        </div>

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
            {isSubmitting
              ? "Preparing secure checkout…"
              : "Continue with Razorpay"}
          </button>

          <p>
            Wallet funds are credited only after Backend
            verification and a valid Razorpay webhook.
          </p>
        </div>
      </form>
    </section>
  );
}