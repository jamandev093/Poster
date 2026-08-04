"use client";

import ProgrammaticActions from "./programmatic/ProgrammaticActions";

import {
  countProgrammaticOverview,
  formatProgrammaticFrame,
  formatProgrammaticHealthStatus,
  formatProgrammaticMappingStatus,
  formatProgrammaticProviderStatus,
  formatProgrammaticScreen,
  formatProgrammaticTimestamp,
  getProgrammaticErrorMessage,
  useProgrammaticOverview,
} from "./programmatic";

import styles from "./ProgrammaticManager.module.css";

import ProgrammaticReadinessPanel from "./programmatic/ProgrammaticReadinessPanel";

const BLOCKED_FORMATS = [
  "Banners",
  "Popups",
  "Interstitials",
  "Overlays",
  "Floating ads",
  "Provider-created placements",
  "9:16 vertical creative",
  "All-video three-card slides",
];

export default function ProgrammaticManager() {
  const {
    overview,
    isLoading,
    isRefreshing,
    error,
    refresh,
  } =
    useProgrammaticOverview();

  const counts =
    countProgrammaticOverview(
      overview
    );

  return (
    <div
      className={
        styles.page
      }
    >
      <header
        className={
          styles.header
        }
      >
        <div>
          <div
            className={
              styles.eyebrow
            }
          >
            Monetization
          </div>

          <h2>
            Programmatic
          </h2>

          <p>
            Manage programmatic providers and slot mappings from the Backend.
            Providers remain restricted to Poster-approved sponsored frames.
          </p>
        </div>

        <button
          type="button"
          className={
            styles.secondaryButton
          }
          disabled={
            isRefreshing
          }
          onClick={() =>
            void refresh()
          }
        >
          {isRefreshing
            ? "Refreshing..."
            : "Refresh"}
        </button>
      </header>

      {error ? (
        <section
          className={
            styles.errorPanel
          }
          role="alert"
        >
          <strong>
            Programmatic controls could not be loaded.
          </strong>

          <p>
            {getProgrammaticErrorMessage(
              error
            )}
          </p>
        </section>
      ) : null}

      <section
        className={
          styles.summaryGrid
        }
        aria-label="Programmatic summary"
      >
        <article
          className={
            styles.summaryCard
          }
        >
          <span>
            Providers
          </span>

          <strong>
            {
              counts.providers
            }
          </strong>

          <small>
            Authoritative Backend records
          </small>
        </article>

        <article
          className={
            styles.summaryCard
          }
        >
          <span>
            Enabled providers
          </span>

          <strong>
            {
              counts.enabledProviders
            }
          </strong>

          <small>
            Provider-level activation only
          </small>
        </article>

        <article
          className={
            styles.summaryCard
          }
        >
          <span>
            Slot mappings
          </span>

          <strong>
            {
              counts.slotMappings
            }
          </strong>

          <small>
            Poster-approved screens and frames
          </small>
        </article>

        <article
          className={
            styles.summaryCard
          }
        >
          <span>
            Enabled mappings
          </span>

          <strong>
            {
              counts.enabledSlotMappings
            }
          </strong>

          <small>
            Active mapped slots
          </small>
        </article>
      </section>

      <ProgrammaticReadinessPanel
        overview={
          overview
        }
      />

      <section
        className={
          styles.policyBanner
        }
      >
        <div>
          <strong>
            Programmatic is locked to Poster-controlled placements.
          </strong>

          <p>
            Providers can only fill approved Poster slots. They cannot create
            placements, change formats, add overlays, or alter organic discovery
            surfaces.
          </p>
        </div>
      </section>

      <section
        className={
          styles.grid
        }
      >
        <article
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
              <span
                className={
                  styles.cardLabel
                }
              >
                Providers
              </span>

              <h3>
                Backend provider registry
              </h3>
            </div>
          </div>

          <div
            className={
              styles.tableWrap
            }
          >
            <table
              className={
                styles.table
              }
            >
              <thead>
                <tr>
                  <th>
                    Provider
                  </th>

                  <th>
                    Status
                  </th>

                  <th>
                    Health
                  </th>

                  <th>
                    Updated
                  </th>
                </tr>
              </thead>

              <tbody>
                {overview.providers.map(
                  provider => (
                    <tr
                      key={
                        provider.id
                      }
                    >
                      <td>
                        <strong>
                          {
                            provider.displayName
                          }
                        </strong>

                        <span>
                          {
                            provider.providerKey
                          }
                        </span>
                      </td>

                      <td>
                        {formatProgrammaticProviderStatus(
                          provider.status
                        )}
                      </td>

                      <td>
                        {formatProgrammaticHealthStatus(
                          provider.healthStatus
                        )}
                      </td>

                      <td>
                        {formatProgrammaticTimestamp(
                          provider.updatedAt
                        )}
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>

            {isLoading ? (
              <div
                className={
                  styles.empty
                }
              >
                Loading providers...
              </div>
            ) : overview.providers.length ===
            0 ? (
              <div
                className={
                  styles.empty
                }
              >
                No programmatic providers configured.
              </div>
            ) : null}
          </div>
        </article>

        <article
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
              <span
                className={
                  styles.cardLabel
                }
              >
                Blocked formats
              </span>

              <h3>
                Never allowed in Poster v1
              </h3>
            </div>
          </div>

          <ul
            className={
              styles.blockList
            }
          >
            {BLOCKED_FORMATS.map(
              item => (
                <li
                  key={
                    item
                  }
                >
                  {
                    item
                  }
                </li>
              )
            )}
          </ul>
        </article>
      </section>

      <section
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
            <span
              className={
                styles.cardLabel
              }
            >
              Slot mappings
            </span>

            <h3>
              Approved screens and frames
            </h3>
          </div>
        </div>

        <div
          className={
            styles.tableWrap
          }
        >
          <table
            className={
              styles.table
            }
          >
            <thead>
              <tr>
                <th>
                  Screen
                </th>

                <th>
                  Placement
                </th>

                <th>
                  Frame
                </th>

                <th>
                  Status
                </th>

                <th>
                  Provider ID
                </th>

                <th>
                  Updated
                </th>
              </tr>
            </thead>

            <tbody>
              {overview.slotMappings.map(
                mapping => (
                  <tr
                    key={
                      mapping.id
                    }
                  >
                    <td>
                      {formatProgrammaticScreen(
                        mapping.screen
                      )}
                    </td>

                    <td>
                      {
                        mapping.placement
                      }
                    </td>

                    <td>
                      {formatProgrammaticFrame(
                        mapping.frame
                      )}
                    </td>

                    <td>
                      {formatProgrammaticMappingStatus(
                        mapping.status
                      )}
                    </td>

                    <td>
                      <span
                        className={
                          styles.monoText
                        }
                      >
                        {
                          mapping.providerId
                        }
                      </span>
                    </td>

                    <td>
                      {formatProgrammaticTimestamp(
                        mapping.updatedAt
                      )}
                    </td>
                  </tr>
                )
              )}
            </tbody>
          </table>

          {isLoading ? (
            <div
              className={
                styles.empty
              }
            >
              Loading slot mappings...
            </div>
          ) : overview.slotMappings.length ===
          0 ? (
            <div
              className={
                styles.empty
              }
            >
              No approved programmatic slot mappings configured.
            </div>
          ) : null}
        </div>
      </section>

      <section
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
            <span
              className={
                styles.cardLabel
              }
            >
              Provider operations
            </span>

            <h3>
              Protected provider and slot actions
            </h3>
          </div>
        </div>

        <p
          className={
            styles.helpText
          }
        >
          Provider and slot creation use the protected Backend APIs. No
          browser-local provider state or fake programmatic metrics are used.
        </p>

        <ProgrammaticActions
          providers={
            overview.providers
          }
          onSaved={() =>
            void refresh()
          }
        />
      </section>
    </div>
  );
}