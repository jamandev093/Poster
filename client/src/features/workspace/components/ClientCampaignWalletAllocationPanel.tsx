"use client";

import {
  type FormEvent,
  useMemo,
  useState,
} from "react";

import {
  useClientWalletAllocationActions,
} from "../hooks/useClientWalletAllocationActions";

import type {
  ClientWalletApiCampaignAllocation,
  ClientWalletApiMoney,
  ClientWalletApiWallet,
} from "../services/client-wallet-read.service";

import styles from "./ClientCampaignWalletAllocationPanel.module.css";

interface ClientCampaignWalletAllocationPanelProps {
  wallet:
    ClientWalletApiWallet |
    null;

  allocations:
    ClientWalletApiCampaignAllocation[];

  onAllocationChange?:
    () => Promise<void> | void;
}

function minorToMajor(
  minorUnits:
    string
): number {
  if (!/^-?[0-9]+$/.test(minorUnits)) {
    return 0;
  }

  return Number(minorUnits) / 100;
}

function formatMoney(
  money:
    ClientWalletApiMoney
): string {
  return new Intl.NumberFormat(
    "en-IN",
    {
      style:
        "currency",

      currency:
        money.currency,

      maximumFractionDigits:
        2,
    }
  ).format(
    minorToMajor(
      money.minorUnits
    )
  );
}

function formatStatus(
  value:
    string
): string {
  return value
    .replaceAll(
      "_",
      " "
    )
    .trim();
}

function normalizePositiveIntegerString(
  value:
    string
): string {
  const normalized =
    value.replace(
      /^0+/,
      ""
    );

  return normalized.length
    ? normalized
    : "0";
}

function comparePositiveIntegerStrings(
  first:
    string,

  second:
    string
): number {
  const normalizedFirst =
    normalizePositiveIntegerString(
      first
    );

  const normalizedSecond =
    normalizePositiveIntegerString(
      second
    );

  if (
    normalizedFirst.length !==
    normalizedSecond.length
  ) {
    return normalizedFirst.length >
      normalizedSecond.length
      ? 1
      : -1;
  }

  if (
    normalizedFirst === normalizedSecond
  ) {
    return 0;
  }

  return normalizedFirst >
    normalizedSecond
    ? 1
    : -1;
}

function parseMajorAmountToMinorUnits(
  value:
    string
): string | null {
  const trimmed =
    value.trim();

  if (
    trimmed.length === 0
  ) {
    return null;
  }

  if (
    !/^[0-9]+(\.[0-9]{1,2})?$/.test(
      trimmed
    )
  ) {
    return null;
  }

  const [
    rupees,
    paise = "",
  ] =
    trimmed.split(
      "."
    );

  const normalizedPaise =
    paise
      .padEnd(
        2,
        "0"
      )
      .slice(
        0,
        2
      );

  const minorUnits =
    normalizePositiveIntegerString(
      `${rupees}${normalizedPaise}`
    );

  return minorUnits === "0"
    ? null
    : minorUnits;
}

function hasPositiveMinorUnits(
  value:
    string
): boolean {
  return (
    /^[1-9][0-9]*$/.test(
      value
    )
  );
}

export default function ClientCampaignWalletAllocationPanel({
  wallet,
  allocations,
  onAllocationChange,
}: ClientCampaignWalletAllocationPanelProps) {
  const [
    campaignId,
    setCampaignId,
  ] =
    useState(
      ""
    );

  const [
    amountInput,
    setAmountInput,
  ] =
    useState(
      ""
    );

  const [
    validationMessage,
    setValidationMessage,
  ] =
    useState<string | null>(
      null
    );

  const actions =
    useClientWalletAllocationActions({
      onMutationComplete:
        async () => {
          await onAllocationChange?.();
        },
    });

  const sortedAllocations =
    useMemo(
      () =>
        [
          ...allocations,
        ].sort(
          (
            first,
            second
          ) =>
            new Date(
              second.updatedAt
            ).getTime() -
            new Date(
              first.updatedAt
            ).getTime()
        ),
      [
        allocations,
      ]
    );

  async function handleAllocate(
    event:
      FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (
      !wallet
    ) {
      setValidationMessage(
        "Wallet must be loaded before allocating funds."
      );

      return;
    }

    const trimmedCampaignId =
      campaignId.trim();

    if (
      trimmedCampaignId.length === 0
    ) {
      setValidationMessage(
        "Campaign ID is required."
      );

      return;
    }

    const amountMinorUnits =
      parseMajorAmountToMinorUnits(
        amountInput
      );

    if (
      !amountMinorUnits
    ) {
      setValidationMessage(
        "Enter a valid INR amount greater than zero."
      );

      return;
    }

    if (
      comparePositiveIntegerStrings(
        amountMinorUnits,
        wallet.availableBalance.minorUnits
      ) > 0
    ) {
      setValidationMessage(
        "Allocation cannot exceed available Wallet balance."
      );

      return;
    }

    setValidationMessage(
      null
    );

    try {
      await actions.allocate({
        campaignId:
          trimmedCampaignId,

        amountMinorUnits,

        currency:
          "INR",
      });

      setCampaignId(
        ""
      );

      setAmountInput(
        ""
      );
    } catch {
      // Mutation hook owns the displayed error state.
    }
  }

  async function handleRelease(
    allocation:
      ClientWalletApiCampaignAllocation
  ) {
    if (
      !hasPositiveMinorUnits(
        allocation.reserved.minorUnits
      )
    ) {
      return;
    }

    setValidationMessage(
      null
    );

    try {
      await actions.release({
        campaignId:
          allocation.campaignId,

        amountMinorUnits:
          allocation.reserved.minorUnits,

        expectedRowVersion:
          allocation.rowVersion,
      });
    } catch {
      // Mutation hook owns the displayed error state.
    }
  }

  const isActionDisabled =
    actions.isSubmitting ||
    !wallet;

  return (
    <section
      className={
        styles.panel
      }
      aria-labelledby="client-campaign-wallet-allocation-title"
      aria-busy={
        actions.isSubmitting
      }
    >
      <div
        className={
          styles.header
        }
      >
        <div>
          <p
            className={
              styles.eyebrow
            }
          >
            Campaign allocation
          </p>

          <h2
            id="client-campaign-wallet-allocation-title"
            className={
              styles.title
            }
          >
            Allocate Wallet funds
          </h2>

          <p
            className={
              styles.description
            }
          >
            Reserve available Wallet funds for approved Client campaigns.
          </p>
        </div>

        {wallet ? (
          <div
            className={
              styles.balance
            }
          >
            <span>
              Available
            </span>

            <strong>
              {formatMoney(
                wallet.availableBalance
              )}
            </strong>
          </div>
        ) : null}
      </div>

      <form
        className={
          styles.form
        }
        onSubmit={
          event => {
            void handleAllocate(
              event
            );
          }
        }
      >
        <label
          className={
            styles.field
          }
        >
          <span>
            Campaign ID
          </span>

          <input
            value={
              campaignId
            }
            onChange={
              event => {
                setCampaignId(
                  event.target.value
                );
              }
            }
            placeholder="Campaign UUID"
            disabled={
              isActionDisabled
            }
          />
        </label>

        <label
          className={
            styles.field
          }
        >
          <span>
            Amount
          </span>

          <input
            value={
              amountInput
            }
            onChange={
              event => {
                setAmountInput(
                  event.target.value
                );
              }
            }
            inputMode="decimal"
            placeholder="1000.00"
            disabled={
              isActionDisabled
            }
          />
        </label>

        <button
          type="submit"
          className={
            styles.primaryButton
          }
          disabled={
            isActionDisabled
          }
        >
          {actions.isSubmitting &&
          actions.activeAction === "allocate"
            ? "Allocating..."
            : "Allocate funds"}
        </button>
      </form>

      {validationMessage ? (
        <div
          className={
            styles.error
          }
          role="alert"
        >
          {validationMessage}
        </div>
      ) : null}

      {actions.errorMessage ? (
        <div
          className={
            styles.error
          }
          role="alert"
        >
          {actions.errorMessage}
        </div>
      ) : null}

      {actions.successMessage ? (
        <div
          className={
            styles.success
          }
          role="status"
        >
          {actions.successMessage}
        </div>
      ) : null}

      <div
        className={
          styles.list
        }
      >
        {sortedAllocations.length ? (
          sortedAllocations.map(
            allocation => {
              const canRelease =
                hasPositiveMinorUnits(
                  allocation.reserved.minorUnits
                );

              return (
                <article
                  key={
                    allocation.id
                  }
                  className={
                    styles.allocation
                  }
                >
                  <div
                    className={
                      styles.allocationMain
                    }
                  >
                    <div>
                      <span
                        className={
                          styles.allocationLabel
                        }
                      >
                        Campaign
                      </span>

                      <strong>
                        {
                          allocation.campaignId
                        }
                      </strong>
                    </div>

                    <span
                      className={
                        styles.badge
                      }
                    >
                      {formatStatus(
                        allocation.status
                      )}
                    </span>
                  </div>

                  <div
                    className={
                      styles.moneyGrid
                    }
                  >
                    <div>
                      <span>
                        Reserved
                      </span>

                      <strong>
                        {formatMoney(
                          allocation.reserved
                        )}
                      </strong>
                    </div>

                    <div>
                      <span>
                        Spent
                      </span>

                      <strong>
                        {formatMoney(
                          allocation.spent
                        )}
                      </strong>
                    </div>

                    <div>
                      <span>
                        Released
                      </span>

                      <strong>
                        {formatMoney(
                          allocation.released
                        )}
                      </strong>
                    </div>
                  </div>

                  <button
                    type="button"
                    className={
                      styles.secondaryButton
                    }
                    onClick={
                      () => {
                        void handleRelease(
                          allocation
                        );
                      }
                    }
                    disabled={
                      actions.isSubmitting ||
                      !canRelease
                    }
                  >
                    {actions.isSubmitting &&
                    actions.activeAction === "release"
                      ? "Releasing..."
                      : "Release reserved funds"}
                  </button>
                </article>
              );
            }
          )
        ) : (
          <div
            className={
              styles.empty
            }
          >
            No campaign allocations returned yet.
          </div>
        )}
      </div>
    </section>
  );
}