import Link from "next/link";

import {
  formatMoneyMinor,
  formatFinancialDateTime,
} from "../payments/payment.formatters";

import {
  getCurrentAdvertiserWallet,
  getCurrentWalletSummary,
} from "../wallet/wallet.selectors";

import AddFundsPanel from "./AddFundsPanel";

import styles from "./WalletDashboard.module.css";

export default function WalletDashboard() {
  const wallet =
    getCurrentAdvertiserWallet();

  const summary =
    getCurrentWalletSummary();

  return (
    <section
      className={
        styles.dashboard
      }
      aria-labelledby="wallet-dashboard-title"
    >
      <div
        className={
          styles.headingRow
        }
      >
        <div>
          <h2 id="wallet-dashboard-title">
            Wallet balance
          </h2>

          <p>
            Add funds, review available balance, and control
            campaign allowances.
          </p>
        </div>
      </div>

      <AddFundsPanel
        wallet={
          wallet
        }
      />

      <div
        className={
          styles.summaryGrid
        }
      >
        <article
          className={
            styles.primaryCard
          }
        >
          <span>
            Available balance
          </span>

          <strong>
            {formatMoneyMinor(
              summary.availableMinor,
              summary.currency
            )}
          </strong>

          <small>
            Available for new campaign allowances
          </small>
        </article>

        <article
          className={
            styles.summaryCard
          }
        >
          <span>
            Total funded
          </span>

          <strong>
            {formatMoneyMinor(
              summary.totalFundedMinor,
              summary.currency
            )}
          </strong>
        </article>

        <article
          className={
            styles.summaryCard
          }
        >
          <span>
            Reserved
          </span>

          <strong>
            {formatMoneyMinor(
              summary.reservedMinor,
              summary.currency
            )}
          </strong>
        </article>

        <article
          className={
            styles.summaryCard
          }
        >
          <span>
            Finalized spend
          </span>

          <strong>
            {formatMoneyMinor(
              summary.finalizedSpendMinor,
              summary.currency
            )}
          </strong>
        </article>

        <article
          className={
            styles.summaryCard
          }
        >
          <span>
            Pending verification
          </span>

          <strong>
            {formatMoneyMinor(
              summary.pendingVerificationMinor,
              summary.currency
            )}
          </strong>
        </article>

        <article
          className={
            styles.summaryCard
          }
        >
          <span>
            Refunded
          </span>

          <strong>
            {formatMoneyMinor(
              summary.refundedMinor,
              summary.currency
            )}
          </strong>
        </article>
      </div>

      <div
        className={
          styles.sectionGrid
        }
      >
        <article
          className={
            styles.sectionCard
          }
        >
          <div
            className={
              styles.sectionHeading
            }
          >
            <div>
              <h3>
                Campaign allowances
              </h3>

              <p>
                Funds assigned or requested for individual
                campaigns.
              </p>
            </div>

            <Link href="/requests/new">
              New campaign
            </Link>
          </div>

          <div
            className={
              styles.allowanceList
            }
          >
            {wallet.allowances.map(
              (
                allowance
              ) => (
                <div
                  key={
                    allowance.id
                  }
                  className={
                    styles.allowanceRow
                  }
                >
                  <div>
                    <strong>
                      {allowance.campaignId ??
                        allowance.requestId ??
                        allowance.id}
                    </strong>

                    <span>
                      {allowance.status.replaceAll(
                        "_",
                        " "
                      )}
                    </span>
                  </div>

                  <div
                    className={
                      styles.allowanceAmounts
                    }
                  >
                    <strong>
                      {formatMoneyMinor(
                        allowance.remainingMinor,
                        allowance.currency
                      )}
                    </strong>

                    <span>
                      remaining of{" "}
                      {formatMoneyMinor(
                        allowance.requestedMinor,
                        allowance.currency
                      )}
                    </span>
                  </div>
                </div>
              )
            )}
          </div>
        </article>

        <article
          className={
            styles.sectionCard
          }
        >
          <div
            className={
              styles.sectionHeading
            }
          >
            <div>
              <h3>
                Recent Wallet activity
              </h3>

              <p>
                Verified funding, campaign spending, credits,
                and refunds.
              </p>
            </div>

            <Link href="/payments/ledger">
              View ledger
            </Link>
          </div>

          <div
            className={
              styles.transactionList
            }
          >
            {wallet.transactions.map(
              (
                transaction
              ) => (
                <div
                  key={
                    transaction.id
                  }
                  className={
                    styles.transactionRow
                  }
                >
                  <div>
                    <strong>
                      {transaction.description}
                    </strong>

                    <span>
                      {formatFinancialDateTime(
                        transaction.occurredAt
                      )}
                    </span>
                  </div>

                  <strong>
                    {transaction.direction ===
                    "debit"
                      ? "−"
                      : "+"}
                    {formatMoneyMinor(
                      transaction.amountMinor,
                      transaction.currency
                    )}
                  </strong>
                </div>
              )
            )}
          </div>
        </article>
      </div>
    </section>
  );
}