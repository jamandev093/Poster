"use client";

import Link from "next/link";

import {
  majorToMinorAmount,
} from "@/features/workspace/payments/currency.types";

import {
  formatMoneyMinor,
} from "@/features/workspace/payments/payment.formatters";

import {
  calculateBalanceAfterAllowance,
  canRequestCampaignAllowance,
} from "@/features/workspace/wallet/wallet.types";

import type {
  SupportedCurrency,
} from "@/features/workspace/payments/currency.types";

import styles from "./CampaignAllowanceField.module.css";

interface CampaignAllowanceFieldProps {
  value:
    string;

  availableMinor:
    number;

  currency:
    SupportedCurrency;

  onChange:
    (
      value:
        string
    ) => void;
}

export default function CampaignAllowanceField({
  value,
  availableMinor,
  currency,
  onChange,
}: CampaignAllowanceFieldProps) {
  const parsedMajor =
    Number(
      value
    );

  const requestedMinor =
    Number.isFinite(
      parsedMajor
    ) &&
    parsedMajor >= 0
      ? majorToMinorAmount(
          parsedMajor,
          currency
        )
      : 0;

  const hasValue =
    value.trim().length >
    0;

  const validAllowance =
    hasValue &&
    canRequestCampaignAllowance(
      availableMinor,
      requestedMinor
    );

  const insufficientBalance =
    hasValue &&
    requestedMinor >
      availableMinor;

  const balanceAfterMinor =
    validAllowance
      ? calculateBalanceAfterAllowance(
          availableMinor,
          requestedMinor
        )
      : availableMinor;

  return (
    <section
      className={
        styles.card
      }
      aria-labelledby="campaign-allowance-title"
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
            CAMPAIGN FUNDING
          </span>

          <h3 id="campaign-allowance-title">
            Campaign allowance
          </h3>

          <p>
            Set the maximum Wallet amount this campaign may
            use after approval.
          </p>
        </div>

        <Link
          href="/wallet"
          className={
            styles.walletLink
          }
        >
          Open Wallet
        </Link>
      </div>

      <div
        className={
          styles.balanceGrid
        }
      >
        <div>
          <span>
            Available in Wallet
          </span>

          <strong>
            {formatMoneyMinor(
              availableMinor,
              currency
            )}
          </strong>
        </div>

        <div>
          <span>
            Requested allowance
          </span>

          <strong>
            {formatMoneyMinor(
              requestedMinor,
              currency
            )}
          </strong>
        </div>

        <div
          className={
            styles.remainingBalance
          }
        >
          <span>
            Available after allowance
          </span>

          <strong>
            {formatMoneyMinor(
              balanceAfterMinor,
              currency
            )}
          </strong>
        </div>
      </div>

      <div
        className={
          styles.field
        }
      >
        <label htmlFor="request-budget">
          Campaign allowance *
        </label>

        <div
          className={
            insufficientBalance
              ? styles.moneyInputError
              : styles.moneyInput
          }
        >
          <span
            aria-hidden="true"
          >
            
          </span>

          <input
            id="request-budget"
            type="number"
            min="1"
            max={
              Math.floor(
                availableMinor /
                  100
              )
            }
            step="1"
            inputMode="numeric"
            value={
              value
            }
            onChange={(
              event
            ) =>
              onChange(
                event.target.value
              )
            }
            placeholder="50000"
            aria-describedby="campaign-allowance-help"
            aria-invalid={
              insufficientBalance
            }
            required
          />
        </div>

        <small id="campaign-allowance-help">
          This amount is requested now. Funds are reserved only
          after Backend approval or campaign scheduling.
        </small>
      </div>

      {insufficientBalance ? (
        <div
          className={
            styles.warning
          }
          role="alert"
        >
          <span>
            The requested allowance exceeds your available
            Wallet balance.
          </span>

          <Link href="/wallet">
            Add funds
          </Link>
        </div>
      ) : validAllowance ? (
        <div
          className={
            styles.validStatus
          }
          role="status"
        >
          <strong>
            OK
          </strong>

          <span>
            {requestedMinor ===
            availableMinor
              ? "This allowance will use your full available Wallet balance."
              : "Allowance is within your available Wallet balance."}
          </span>
        </div>
      ) : null}
    </section>
  );
}
