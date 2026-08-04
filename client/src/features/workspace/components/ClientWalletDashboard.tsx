"use client";

import AddFundsPanel from "./AddFundsPanel";
import ClientCampaignWalletAllocationPanel from "./ClientCampaignWalletAllocationPanel";

import {
  mapClientWalletApiOverviewToAdvertiserWallet,
} from "../wallet/wallet-api.adapter";

import {
  useClientWalletOverview,
} from "../hooks/useClientWalletOverview";

import type {
  ClientWalletApiLedgerEntry,
  ClientWalletApiMoney,
} from "../services/client-wallet-read.service";

import styles from "./ClientWalletDashboard.module.css";

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

function formatDateTime(
  value:
    string | null
): string {
  if (!value) {
    return "—";
  }

  const date =
    new Date(
      value
    );

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat(
    "en-IN",
    {
      dateStyle:
        "medium",

      timeStyle:
        "short",
    }
  ).format(
    date
  );
}

function formatStatus(
  value:
    string
): string {
  return value
    .replaceAll("_", " ")
    .trim();
}

function getLedgerTitle(
  entry:
    ClientWalletApiLedgerEntry
): string {
  if (entry.providerReference) {
    return entry.providerReference;
  }

  if (entry.campaignId) {
    return `Campaign ${entry.campaignId}`;
  }

  if (entry.fundingOrderId) {
    return `Funding order ${entry.fundingOrderId}`;
  }

  return entry.entryType.replaceAll("_", " ");
}

export default function ClientWalletDashboard() {
  const {
    overview,
    isLoading,
    errorMessage,
    refresh,
  } =
    useClientWalletOverview(
      10
    );

  const wallet =
    overview?.wallet ??
    null;

  const fundingPanelWallet =
    overview
      ? mapClientWalletApiOverviewToAdvertiserWallet(
          overview
        )
      : null;

  return (
    <section
      className={
        styles.shell
      }
      aria-labelledby="client-wallet-title"
      aria-busy={
        isLoading
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
            Wallet
          </p>

          <h1
            id="client-wallet-title"
            className={
              styles.title
            }
          >
            Wallet balance
          </h1>

          <p
            className={
              styles.description
            }
          >
            Read authoritative Wallet balance, funding,
            ledger, payment, invoice, refund, and campaign
            allocation data from the Backend.
          </p>
        </div>

        <div
          className={
            styles.actions
          }
        >
          <button
            type="button"
            className={
              styles.button
            }
            onClick={
              () => {
                void refresh();
              }
            }
            disabled={
              isLoading
            }
          >
            {isLoading
              ? "Refreshing..."
              : "Refresh"}
          </button>
        </div>
      </div>

      {errorMessage ? (
        <div
          className={
            styles.error
          }
          role="alert"
        >
          {errorMessage}
        </div>
      ) : null}

      {isLoading && !overview ? (
        <div
          className={
            styles.status
          }
        >
          Loading Wallet data from Backend...
        </div>
      ) : null}

      {!isLoading && !wallet ? (
        <div
          className={
            styles.empty
          }
        >
          No Wallet record was returned for this Client
          organization yet.
        </div>
      ) : null}

      {wallet ? (
        <>
          <div
            className={
              styles.grid
            }
          >
            <article
              className={
                styles.card
              }
            >
              <p
                className={
                  styles.label
                }
              >
                Available
              </p>
              <p
                className={
                  styles.value
                }
              >
                {formatMoney(
                  wallet.availableBalance
                )}
              </p>
            </article>

            <article
              className={
                styles.card
              }
            >
              <p
                className={
                  styles.label
                }
              >
                Reserved
              </p>
              <p
                className={
                  styles.value
                }
              >
                {formatMoney(
                  wallet.reservedBalance
                )}
              </p>
            </article>

            <article
              className={
                styles.card
              }
            >
              <p
                className={
                  styles.label
                }
              >
                Credited
              </p>
              <p
                className={
                  styles.value
                }
              >
                {formatMoney(
                  wallet.totalCredited
                )}
              </p>
            </article>

            <article
              className={
                styles.card
              }
            >
              <p
                className={
                  styles.label
                }
              >
                Spent
              </p>
              <p
                className={
                  styles.value
                }
              >
                {formatMoney(
                  wallet.totalSpent
                )}
              </p>
            </article>

            <article
              className={
                styles.card
              }
            >
              <p
                className={
                  styles.label
                }
              >
                Refunded
              </p>
              <p
                className={
                  styles.value
                }
              >
                {formatMoney(
                  wallet.totalRefunded
                )}
              </p>
            </article>
          </div>

          <div
            className={
              styles.panels
            }
          >
            <div
              className={
                styles.panel
              }
            >
              <div
                className={
                  styles.panelHeader
                }
              >
                <div>
                  <h2
                    className={
                      styles.panelTitle
                    }
                  >
                    Recent Wallet activity
                  </h2>
                  <p
                    className={
                      styles.panelMeta
                    }
                  >
                    Generated{" "}
                    {formatDateTime(
                      overview?.generatedAt ??
                        null
                    )}
                  </p>
                </div>
              </div>

              <div
                className={
                  styles.list
                }
              >
                {overview?.ledgerEntries.length ? (
                  overview.ledgerEntries.map(
                    entry => (
                      <article
                        key={
                          entry.id
                        }
                        className={
                          styles.item
                        }
                      >
                        <div
                          className={
                            styles.itemTop
                          }
                        >
                          <span
                            className={
                              styles.itemTitle
                            }
                          >
                            {getLedgerTitle(
                              entry
                            )}
                          </span>
                          <span
                            className={
                              styles.itemAmount
                            }
                          >
                            {formatMoney(
                              entry.amount
                            )}
                          </span>
                        </div>

                        <span
                          className={
                            styles.badge
                          }
                        >
                          {formatStatus(
                            entry.status
                          )}
                        </span>

                        <span
                          className={
                            styles.itemMeta
                          }
                        >
                          {formatStatus(
                            entry.entryType
                          )}{" "}
                          ·{" "}
                          {formatDateTime(
                            entry.createdAt
                          )}
                        </span>
                      </article>
                    )
                  )
                ) : (
                  <div
                    className={
                      styles.empty
                    }
                  >
                    No ledger entries returned yet.
                  </div>
                )}
              </div>
            </div>

            <div
              className={
                styles.panel
              }
            >
              {fundingPanelWallet ? (
                <AddFundsPanel
                  wallet={
                    fundingPanelWallet
                  }
                  onFundingComplete={
                    refresh
                  }
                />
              ) : (
                <div
                  className={
                    styles.empty
                  }
                >
                  Add funds becomes available after the
                  Wallet record is loaded.
                </div>
              )}
            </div>

            <div
              className={
                styles.panel
              }
            >
              <ClientCampaignWalletAllocationPanel
                wallet={
                  wallet
                }
                allocations={
                  overview?.campaignAllocations ??
                  []
                }
                onAllocationChange={
                  refresh
                }
              />
            </div>
          </div>

          <div
            className={
              styles.grid
            }
          >
            <article
              className={
                styles.card
              }
            >
              <p
                className={
                  styles.label
                }
              >
                Funding orders
              </p>
              <p
                className={
                  styles.value
                }
              >
                {overview?.fundingOrders.length ?? 0}
              </p>
            </article>

            <article
              className={
                styles.card
              }
            >
              <p
                className={
                  styles.label
                }
              >
                Payments
              </p>
              <p
                className={
                  styles.value
                }
              >
                {overview?.payments.length ?? 0}
              </p>
            </article>

            <article
              className={
                styles.card
              }
            >
              <p
                className={
                  styles.label
                }
              >
                Invoices
              </p>
              <p
                className={
                  styles.value
                }
              >
                {overview?.invoices.length ?? 0}
              </p>
            </article>

            <article
              className={
                styles.card
              }
            >
              <p
                className={
                  styles.label
                }
              >
                Refunds
              </p>
              <p
                className={
                  styles.value
                }
              >
                {overview?.refunds.length ?? 0}
              </p>
            </article>

            <article
              className={
                styles.card
              }
            >
              <p
                className={
                  styles.label
                }
              >
                Allocations
              </p>
              <p
                className={
                  styles.value
                }
              >
                {overview?.campaignAllocations.length ?? 0}
              </p>
            </article>
          </div>
        </>
      ) : null}
    </section>
  );
}