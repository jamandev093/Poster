"use client";

import {
  FormEvent,
  useMemo,
  useState,
} from "react";

import {
  useRouter,
} from "next/navigation";

import styles from "./CopyrightForms.module.css";

interface BulkItem {
  id: string;

  value: string;

  selected: boolean;
}

interface BulkRemovalFormProps {
  initialItems?: string[];
}

interface DeclarationState {
  goodFaith: boolean;

  accurate: boolean;

  authorized: boolean;
}

const MAX_BULK_ITEMS =
  100;

function normalizeItem(
  value: string
): string {
  const trimmed =
    value.trim();

  if (
    /^CNT-\d+$/i.test(
      trimmed
    )
  ) {
    return trimmed.toUpperCase();
  }

  return trimmed;
}

function itemComparisonKey(
  value: string
): string {
  return normalizeItem(
    value
  ).toLowerCase();
}

function createInitialItems(
  values: string[]
): BulkItem[] {
  const seen =
    new Set<string>();

  return values
    .map(
      normalizeItem
    )
    .filter(
      Boolean
    )
    .filter(
      (
        value
      ) => {
        const key =
          itemComparisonKey(
            value
          );

        if (
          seen.has(
            key
          )
        ) {
          return false;
        }

        seen.add(
          key
        );

        return true;
      }
    )
    .slice(
      0,
      MAX_BULK_ITEMS
    )
    .map(
      (
        value,
        index
      ) => ({
        id:
          `initial-${index}-${value}`,

        value,

        selected:
          true,
      })
    );
}

export default function BulkRemovalForm({
  initialItems = [],
}: BulkRemovalFormProps) {
  const router =
    useRouter();

  const [
    rawItems,
    setRawItems,
  ] =
    useState("");

  const [
    items,
    setItems,
  ] =
    useState<
      BulkItem[]
    >(
      () =>
        createInitialItems(
          initialItems
        )
    );

  const [
    error,
    setError,
  ] =
    useState("");

  const [
    confirmSubmission,
    setConfirmSubmission,
  ] =
    useState(
      false
    );

  const [
    declarations,
    setDeclarations,
  ] =
    useState<DeclarationState>({
      goodFaith:
        false,

      accurate:
        false,

      authorized:
        false,
    });

  const selectedCount =
    useMemo(
      () =>
        items.filter(
          (
            item
          ) =>
            item.selected
        ).length,

      [
        items,
      ]
    );

  const allSelected =
    items.length >
      0 &&
    selectedCount ===
      items.length;

  const addItems =
    () => {
      const entered =
        rawItems
          .split(
            /\r?\n/
          )
          .map(
            normalizeItem
          )
          .filter(
            Boolean
          );

      if (
        entered.length ===
        0
      ) {
        setError(
          "Paste at least one Poster URL or Content ID."
        );

        return;
      }

      const existingKeys =
        new Set(
          items.map(
            (
              item
            ) =>
              itemComparisonKey(
                item.value
              )
          )
        );

      const batchKeys =
        new Set<string>();

      const uniqueNewItems =
        entered.filter(
          (
            value
          ) => {
            const key =
              itemComparisonKey(
                value
              );

            if (
              existingKeys.has(
                key
              ) ||
              batchKeys.has(
                key
              )
            ) {
              return false;
            }

            batchKeys.add(
              key
            );

            return true;
          }
        );

      if (
        uniqueNewItems.length ===
        0
      ) {
        setError(
          "No new unique items were found. Duplicate entries were not added."
        );

        return;
      }

      if (
        items.length +
          uniqueNewItems.length >
        MAX_BULK_ITEMS
      ) {
        setError(
          `A bulk request can contain up to ${MAX_BULK_ITEMS} affected items in the current version. Remove some items or submit another bulk request.`
        );

        return;
      }

      const timestamp =
        Date.now();

      setItems(
        (
          current
        ) => [
          ...current,

          ...uniqueNewItems.map(
            (
              value,
              index
            ) => ({
              id:
                `${timestamp}-${index}`,

              value,

              selected:
                true,
            })
          ),
        ]
      );

      setRawItems("");

      setError("");

      setConfirmSubmission(
        false
      );
    };

  const toggleItem = (
    itemId: string
  ) => {
    setItems(
      (
        current
      ) =>
        current.map(
          (
            item
          ) =>
            item.id ===
            itemId
              ? {
                  ...item,

                  selected:
                    !item.selected,
                }
              : item
        )
    );

    setConfirmSubmission(
      false
    );
  };

  const toggleAll =
    () => {
      const nextSelected =
        !allSelected;

      setItems(
        (
          current
        ) =>
          current.map(
            (
              item
            ) => ({
              ...item,

              selected:
                nextSelected,
            })
          )
      );

      setConfirmSubmission(
        false
      );
    };

  const removeSelected =
    () => {
      if (
        selectedCount ===
        0
      ) {
        return;
      }

      setItems(
        (
          current
        ) =>
          current.filter(
            (
              item
            ) =>
              !item.selected
          )
      );

      setError("");

      setConfirmSubmission(
        false
      );
    };

  const submitBulkClaim = (
    event:
      FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (
      selectedCount ===
      0
    ) {
      setError(
        "Select at least one affected content item before submitting."
      );

      setConfirmSubmission(
        false
      );

      return;
    }

    if (
      !declarations.goodFaith ||
      !declarations.accurate ||
      !declarations.authorized
    ) {
      setError(
        "Please confirm all required declarations before submitting."
      );

      setConfirmSubmission(
        false
      );

      return;
    }

    if (
      !confirmSubmission
    ) {
      setError("");

      setConfirmSubmission(
        true
      );

      return;
    }

    /*
     * Frontend-only workflow.
     *
     * Production backend will later:
     * - generate one CR parent case,
     * - create item-level affected records,
     * - deduplicate by canonical Poster Content ID,
     * - send the case to Admin Copyright,
     * - store item-level outcomes,
     * - send claimant notifications.
     */
    router.push(
      `/submitted?type=bulk&count=${selectedCount}`
    );
  };

  return (
    <form
      className={
        styles.form
      }
      onSubmit={
        submitBulkClaim
      }
    >
      <section
        className={
          styles.section
        }
      >
        <div
          className={
            styles.sectionHeader
          }
        >
          <h2>
            1. Claimant information
          </h2>

          <p>
            Enter the rights holder or
            authorized representative
            once for this entire bulk
            copyright request.
          </p>
        </div>

        <div className="formGrid">
          <div className="formField">
            <label htmlFor="bulk-claimant">
              Rights holder / claimant name *
            </label>

            <input
              id="bulk-claimant"
              name="claimantName"
              required
              autoComplete="name"
            />
          </div>

          <div className="formField">
            <label htmlFor="bulk-organization">
              Organization
            </label>

            <input
              id="bulk-organization"
              name="organization"
              autoComplete="organization"
            />
          </div>

          <div className="formField">
            <label htmlFor="bulk-email">
              Contact email *
            </label>

            <input
              id="bulk-email"
              name="email"
              type="email"
              required
              autoComplete="email"
            />
          </div>

          <div className="formField">
            <label htmlFor="bulk-relationship">
              Relationship to the work *
            </label>

            <select
              id="bulk-relationship"
              name="relationship"
              required
              defaultValue=""
            >
              <option
                value=""
                disabled
              >
                Select
              </option>

              <option value="owner">
                Rights holder
              </option>

              <option value="authorized">
                Authorized representative
              </option>

              <option value="publisher">
                Publisher / organization
              </option>
            </select>
          </div>
        </div>
      </section>

      <section
        className={
          styles.section
        }
      >
        <div
          className={
            styles.sectionHeader
          }
        >
          <h2>
            2. Copyright ownership
          </h2>

          <p>
            Identify the original work,
            collection, publication, or
            other copyright material
            covered by this request.
          </p>
        </div>

        <div className="formGridSingle">
          <div className="formField">
            <label htmlFor="bulk-work">
              Work / collection title or description *
            </label>

            <input
              id="bulk-work"
              name="workDescription"
              required
            />
          </div>

          <div className="formField">
            <label htmlFor="bulk-original-url">
              Original publication or rights reference URL
            </label>

            <input
              id="bulk-original-url"
              name="originalUrl"
              type="url"
              placeholder="https://"
            />

            <span className="fieldHelp">
              Provide an original
              publication, publisher, or
              ownership reference when
              available.
            </span>
          </div>
        </div>
      </section>

      <section
        className={
          styles.section
        }
      >
        <div
          className={
            styles.sectionHeader
          }
        >
          <h2>
            3. Affected Poster content
          </h2>

          <p>
            Add the Poster Content IDs or
            exact URLs you already know.
            You can include up to
            {" "}
            {MAX_BULK_ITEMS}
            {" "}
            affected items in one bulk
            request.
          </p>
        </div>

        {items.length >
        0 ? (
          <div className="notice">
            {items.length}
            {" "}
            {items.length ===
            1
              ? "affected item is"
              : "affected items are"}
            {" "}
            currently attached to this
            request.
          </div>
        ) : null}

        <div
          className="formField"
          style={{
            marginTop:
              items.length >
              0
                ? 16
                : 0,
          }}
        >
          <label htmlFor="bulk-items">
            Add Poster URLs / Content IDs
          </label>

          <textarea
            id="bulk-items"
            value={
              rawItems
            }
            onChange={(
              event
            ) =>
              setRawItems(
                event.target
                  .value
              )
            }
            placeholder={`CNT-10482
CNT-10510
https://poster.example/content/...
https://example.com/original-content`}
          />

          <span className="fieldHelp">
            Enter one Content ID or exact
            URL per line. Duplicate values
            are not added twice.
          </span>
        </div>

        <div
          className={
            styles.bulkInputActions
          }
        >
          <button
            type="button"
            className="secondaryButton"
            onClick={
              addItems
            }
          >
            Add items
          </button>
        </div>

        {items.length >
        0 ? (
          <>
            <div
              className={
                styles.selectionToolbar
              }
            >
              <div
                className={
                  styles.selectionToolbarLeft
                }
              >
                <label
                  className={
                    styles.checkboxRow
                  }
                >
                  <input
                    type="checkbox"
                    checked={
                      allSelected
                    }
                    onChange={
                      toggleAll
                    }
                  />

                  <span>
                    Select all listed items
                  </span>
                </label>

                <span
                  className={
                    styles.selectionCount
                  }
                >
                  {
                    selectedCount
                  }
                  {" selected · "}
                  {
                    items.length
                  }
                  {" total"}
                </span>
              </div>

              <div
                className={
                  styles.selectionToolbarRight
                }
              >
                <button
                  type="button"
                  className="dangerButton"
                  disabled={
                    selectedCount ===
                    0
                  }
                  onClick={
                    removeSelected
                  }
                >
                  Remove selected
                </button>
              </div>
            </div>

            <div
              className={
                styles.itemList
              }
            >
              {items.map(
                (
                  item,
                  index
                ) => (
                  <label
                    key={
                      item.id
                    }
                    className={
                      styles.itemRow
                    }
                  >
                    <input
                      type="checkbox"
                      checked={
                        item.selected
                      }
                      onChange={() =>
                        toggleItem(
                          item.id
                        )
                      }
                    />

                    <span
                      className={
                        styles.itemValue
                      }
                    >
                      {
                        item.value
                      }
                    </span>

                    <span
                      className={
                        styles.itemNumber
                      }
                    >
                      #
                      {
                        index +
                        1
                      }
                    </span>
                  </label>
                )
              )}
            </div>
          </>
        ) : (
          <div
            className={
              styles.emptyItems
            }
          >
            No affected content has
            been added yet.
            <br />
            Add known Poster Content
            IDs or exact URLs above,
            or arrive here from Find
            Your Content with matched
            records already selected.
          </div>
        )}
      </section>

      <section
        className={
          styles.section
        }
      >
        <div
          className={
            styles.sectionHeader
          }
        >
          <h2>
            4. Supporting information
          </h2>

          <p>
            Explain why these affected
            records belong in the same
            copyright request and provide
            information that helps review
            them accurately.
          </p>
        </div>

        <div className="formGridSingle">
          <div className="formField">
            <label htmlFor="bulk-reason">
              Reason for request *
            </label>

            <textarea
              id="bulk-reason"
              name="reason"
              required
              placeholder="Explain the copyright concern that applies to these selected Poster content records."
            />
          </div>

          <div className="formField">
            <label htmlFor="bulk-evidence">
              Supporting evidence / references
            </label>

            <textarea
              id="bulk-evidence"
              name="evidence"
              placeholder="Ownership references, publication information, supporting URLs, licensing information, or other relevant evidence."
            />
          </div>
        </div>
      </section>

      <section
        className={
          styles.section
        }
      >
        <div
          className={
            styles.sectionHeader
          }
        >
          <h2>
            5. Declarations
          </h2>

          <p>
            These declarations apply to
            every selected item included
            in this bulk copyright request.
          </p>
        </div>

        <div
          className={
            styles.declarations
          }
        >
          <label
            className={
              styles.checkboxRow
            }
          >
            <input
              type="checkbox"
              checked={
                declarations.goodFaith
              }
              onChange={(
                event
              ) =>
                setDeclarations(
                  (
                    current
                  ) => ({
                    ...current,

                    goodFaith:
                      event.target.checked,
                  })
                )
              }
            />

            <span>
              I have a good-faith basis
              for requesting review of
              the selected content.
            </span>
          </label>

          <label
            className={
              styles.checkboxRow
            }
          >
            <input
              type="checkbox"
              checked={
                declarations.accurate
              }
              onChange={(
                event
              ) =>
                setDeclarations(
                  (
                    current
                  ) => ({
                    ...current,

                    accurate:
                      event.target.checked,
                  })
                )
              }
            />

            <span>
              I confirm that the
              information supplied is
              accurate to the best of
              my knowledge.
            </span>
          </label>

          <label
            className={
              styles.checkboxRow
            }
          >
            <input
              type="checkbox"
              checked={
                declarations.authorized
              }
              onChange={(
                event
              ) =>
                setDeclarations(
                  (
                    current
                  ) => ({
                    ...current,

                    authorized:
                      event.target.checked,
                  })
                )
              }
            />

            <span>
              I am the rights holder or
              am authorized to act on
              behalf of the rights holder.
            </span>
          </label>

          <div className="formField">
            <label htmlFor="bulk-legal-name">
              Full legal name *
            </label>

            <input
              id="bulk-legal-name"
              name="legalName"
              required
              autoComplete="name"
            />

            <span className="fieldHelp">
              Used to confirm the person
              making this request. No
              Poster account is created.
            </span>
          </div>
        </div>
      </section>

      {confirmSubmission ? (
        <div
          className={
            styles.confirmBox
          }
        >
          <strong>
            Submit bulk copyright request?
          </strong>

          <p>
            You are submitting
            {" "}
            <strong
              style={{
                display:
                  "inline",
              }}
            >
              {
                selectedCount
              }
            </strong>
            {" "}
            selected
            {selectedCount ===
            1
              ? " content item"
              : " content items"}
            {" "}
            for review as one copyright
            case.
          </p>

          <p>
            Submission does not
            automatically remove content.
            Each affected item can receive
            its own verification, review,
            and final outcome.
          </p>
        </div>
      ) : null}

      {error ? (
        <div
          className={
            styles.error
          }
          role="alert"
        >
          {
            error
          }
        </div>
      ) : null}

      <div
        className={
          styles.actions
        }
      >
        {confirmSubmission ? (
          <button
            type="button"
            className="secondaryButton"
            onClick={() =>
              setConfirmSubmission(
                false
              )
            }
          >
            Go back
          </button>
        ) : null}

        <button
          type="submit"
          className="primaryButton"
        >
          {confirmSubmission
            ? `Confirm and submit ${selectedCount} ${
                selectedCount ===
                1
                  ? "item"
                  : "items"
              }`
            : `Submit bulk request${
                selectedCount >
                0
                  ? ` (${selectedCount})`
                  : ""
              }`}
        </button>
      </div>
    </form>
  );
}