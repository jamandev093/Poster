"use client";

import {
  ChangeEvent,
  FormEvent,
  useMemo,
  useRef,
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

interface ImportResult {
  added: number;
  duplicates: number;
  invalid: number;
  limitSkipped: number;
}

const MAX_BULK_ITEMS =
  100;

const MAX_FILE_SIZE_BYTES =
  1024 * 1024;

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

function isValidContentId(
  value: string
): boolean {
  return /^CNT-\d+$/i.test(
    value.trim()
  );
}

function isValidHttpUrl(
  value: string
): boolean {
  try {
    const url =
      new URL(
        value.trim()
      );

    return (
      url.protocol ===
        "http:" ||
      url.protocol ===
        "https:"
    );
  } catch {
    return false;
  }
}

function isValidIdentifier(
  value: string
): boolean {
  return (
    isValidContentId(
      value
    ) ||
    isValidHttpUrl(
      value
    )
  );
}

function itemComparisonKey(
  value: string
): string {
  const normalized =
    normalizeItem(
      value
    );

  if (
    isValidContentId(
      normalized
    )
  ) {
    return normalized.toUpperCase();
  }

  if (
    isValidHttpUrl(
      normalized
    )
  ) {
    try {
      const url =
        new URL(
          normalized
        );

      url.hash =
        "";

      url.hostname =
        url.hostname.toLowerCase();

      if (
        url.pathname.length >
          1 &&
        url.pathname.endsWith(
          "/"
        )
      ) {
        url.pathname =
          url.pathname.replace(
            /\/+$/,
            ""
          );
      }

      return url.toString();
    } catch {
      return normalized;
    }
  }

  return normalized.toLowerCase();
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
      isValidIdentifier
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

/*
 * Small CSV parser that understands quoted cells.
 * We only use it to extract claimant-supplied
 * Content IDs and URLs from simple CSV files.
 */
function parseCsvLine(
  line: string
): string[] {
  const cells:
    string[] = [];

  let current =
    "";

  let insideQuotes =
    false;

  for (
    let index = 0;
    index < line.length;
    index += 1
  ) {
    const character =
      line[index];

    if (
      character ===
      "\""
    ) {
      const nextCharacter =
        line[
          index +
            1
        ];

      if (
        insideQuotes &&
        nextCharacter ===
          "\""
      ) {
        current +=
          "\"";

        index +=
          1;
      } else {
        insideQuotes =
          !insideQuotes;
      }

      continue;
    }

    if (
      character ===
        "," &&
      !insideQuotes
    ) {
      cells.push(
        current.trim()
      );

      current =
        "";

      continue;
    }

    current +=
      character;
  }

  cells.push(
    current.trim()
  );

  return cells;
}

function isPossibleHeader(
  value: string
): boolean {
  const normalized =
    value
      .trim()
      .toLowerCase()
      .replace(
        /[\s_-]+/g,
        ""
      );

  return [
    "content",
    "contentid",
    "postercontentid",
    "url",
    "contenturl",
    "posterurl",
    "originalurl",
  ].includes(
    normalized
  );
}

function extractIdentifiersFromFile(
  fileName: string,
  text: string
): string[] {
  const lowerName =
    fileName.toLowerCase();

  if (
    lowerName.endsWith(
      ".csv"
    )
  ) {
    return text
      .split(
        /\r?\n/
      )
      .flatMap(
        (
          line
        ) =>
          parseCsvLine(
            line
          )
      )
      .map(
        (
          value
        ) =>
          value.trim()
      )
      .filter(
        Boolean
      )
      .filter(
        (
          value
        ) =>
          !isPossibleHeader(
            value
          )
      );
  }

  return text
    .split(
      /\r?\n/
    )
    .map(
      (
        value
      ) =>
        value.trim()
    )
    .filter(
      Boolean
    )
    .filter(
      (
        value
      ) =>
        !isPossibleHeader(
          value
        )
    );
}

function importSummaryText(
  result: ImportResult
): string {
  const parts:
    string[] = [];

  parts.push(
    `${result.added} ${
      result.added ===
      1
        ? "item"
        : "items"
    } added`
  );

  if (
    result.duplicates >
    0
  ) {
    parts.push(
      `${result.duplicates} ${
        result.duplicates ===
        1
          ? "duplicate"
          : "duplicates"
      } skipped`
    );
  }

  if (
    result.invalid >
    0
  ) {
    parts.push(
      `${result.invalid} invalid ${
        result.invalid ===
        1
          ? "identifier"
          : "identifiers"
      } skipped`
    );
  }

  if (
    result.limitSkipped >
    0
  ) {
    parts.push(
      `${result.limitSkipped} skipped because the ${MAX_BULK_ITEMS}-item limit was reached`
    );
  }

  return parts.join(
    " · "
  );
}

export default function BulkRemovalForm({
  initialItems = [],
}: BulkRemovalFormProps) {
  const router =
    useRouter();

  const fileInputRef =
    useRef<HTMLInputElement>(
      null
    );

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
    importMessage,
    setImportMessage,
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

  const processIdentifiers = (
    incomingValues:
      string[]
  ): ImportResult => {
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

    const incomingKeys =
      new Set<string>();

    const validUnique:
      string[] = [];

    let duplicates =
      0;

    let invalid =
      0;

    incomingValues.forEach(
      (
        rawValue
      ) => {
        const value =
          normalizeItem(
            rawValue
          );

        if (
          !value
        ) {
          return;
        }

        if (
          !isValidIdentifier(
            value
          )
        ) {
          invalid +=
            1;

          return;
        }

        const key =
          itemComparisonKey(
            value
          );

        if (
          existingKeys.has(
            key
          ) ||
          incomingKeys.has(
            key
          )
        ) {
          duplicates +=
            1;

          return;
        }

        incomingKeys.add(
          key
        );

        validUnique.push(
          value
        );
      }
    );

    const availableSlots =
      Math.max(
        0,
        MAX_BULK_ITEMS -
          items.length
      );

    const accepted =
      validUnique.slice(
        0,
        availableSlots
      );

    const limitSkipped =
      Math.max(
        0,
        validUnique.length -
          accepted.length
      );

    if (
      accepted.length >
      0
    ) {
      const timestamp =
        Date.now();

      setItems(
        (
          current
        ) => [
          ...current,

          ...accepted.map(
            (
              value,
              index
            ) => ({
              id:
                `${timestamp}-${index}-${value}`,

              value,

              selected:
                true,
            })
          ),
        ]
      );
    }

    setConfirmSubmission(
      false
    );

    return {
      added:
        accepted.length,

      duplicates,

      invalid,

      limitSkipped,
    };
  };

  const addPastedItems =
    () => {
      const entered =
        rawItems
          .split(
            /\r?\n/
          )
          .map(
            (
              value
            ) =>
              value.trim()
          )
          .filter(
            Boolean
          );

      if (
        entered.length ===
        0
      ) {
        setImportMessage(
          ""
        );

        setError(
          "Paste at least one Poster Content ID or exact http/https URL."
        );

        return;
      }

      const result =
        processIdentifiers(
          entered
        );

      setImportMessage(
        importSummaryText(
          result
        )
      );

      if (
        result.added >
        0
      ) {
        setRawItems(
          ""
        );

        setError(
          ""
        );
      } else if (
        result.invalid >
        0
      ) {
        setError(
          "No valid new items were added. Use Poster Content IDs such as CNT-10482 or complete http/https URLs."
        );
      } else {
        setError(
          "No new unique items were added."
        );
      }
    };

  const openFilePicker =
    () => {
      fileInputRef.current?.click();
    };

  const handleFileUpload =
    async (
      event:
        ChangeEvent<HTMLInputElement>
    ) => {
      const file =
        event.target.files?.[
          0
        ];

      /*
       * Reset immediately so the same
       * file can be selected again later.
       */
      event.target.value =
        "";

      if (
        !file
      ) {
        return;
      }

      const lowerName =
        file.name.toLowerCase();

      const supported =
        lowerName.endsWith(
          ".txt"
        ) ||
        lowerName.endsWith(
          ".csv"
        );

      if (
        !supported
      ) {
        setImportMessage(
          ""
        );

        setError(
          "Unsupported file type. Upload a .txt or .csv file."
        );

        return;
      }

      if (
        file.size >
        MAX_FILE_SIZE_BYTES
      ) {
        setImportMessage(
          ""
        );

        setError(
          "The file is too large. Upload a .txt or .csv file smaller than 1 MB."
        );

        return;
      }

      try {
        const text =
          await file.text();

        const extracted =
          extractIdentifiersFromFile(
            file.name,
            text
          );

        if (
          extracted.length ===
          0
        ) {
          setImportMessage(
            ""
          );

          setError(
            "No Content IDs or URLs were found in the uploaded file."
          );

          return;
        }

        const result =
          processIdentifiers(
            extracted
          );

        setImportMessage(
          `${file.name}: ${importSummaryText(
            result
          )}`
        );

        if (
          result.added >
          0
        ) {
          setError(
            ""
          );
        } else if (
          result.invalid >
          0
        ) {
          setError(
            "The file did not contain any new valid Poster Content IDs or complete http/https URLs."
          );
        } else {
          setError(
            "The uploaded file did not contain any new unique items."
          );
        }
      } catch {
        setImportMessage(
          ""
        );

        setError(
          "The selected file could not be read. Try another .txt or .csv file."
        );
      }
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

      setError(
        ""
      );

      setImportMessage(
        ""
      );

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
      setError(
        ""
      );

      setConfirmSubmission(
        true
      );

      return;
    }

    /*
     * Frontend-only workflow.
     *
     * Production backend will later:
     * - validate every identifier again server-side,
     * - resolve exact Poster records,
     * - deduplicate by canonical Content ID,
     * - create one CR parent case,
     * - create affected-item child records,
     * - send the case to Admin Copyright,
     * - store item-level outcomes,
     * - notify the claimant.
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
            1. Claimant
          </h2>

          <p>
            Rights holder or authorized
            representative for this request.
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
            Identify the original work or
            collection covered by this request.
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
            3. Affected content
          </h2>

          <p>
            Add up to
            {" "}
            {MAX_BULK_ITEMS}
            {" "}
            known Poster Content IDs or
            exact URLs.
          </p>
        </div>

        {items.length >
        0 ? (
          <div className="notice">
            {items.length}
            {" "}
            {items.length ===
            1
              ? "item attached"
              : "items attached"}
            {" · "}
            {selectedCount}
            {" selected"}
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
            Paste Content IDs / exact URLs
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
                event.target.value
              )
            }
            placeholder={`CNT-10482
CNT-10510
https://publisher.example/article/123`}
          />

          <span className="fieldHelp">
            One identifier per line.
          </span>
        </div>

        <div
          className={
            styles.bulkInputActions
          }
          style={{
            gap: 10,
            flexWrap: "wrap",
          }}
        >
          <input
            ref={
              fileInputRef
            }
            type="file"
            accept=".txt,.csv,text/plain,text/csv"
            onChange={
              handleFileUpload
            }
            style={{
              display:
                "none",
            }}
          />

          <button
            type="button"
            className="secondaryButton"
            onClick={
              openFilePicker
            }
          >
            Upload .txt or .csv
          </button>

          <button
            type="button"
            className="primaryButton"
            onClick={
              addPastedItems
            }
          >
            Add pasted items
          </button>
        </div>

        {importMessage ? (
          <div
            style={{
              marginTop: 12,
              padding: "10px 12px",
              border:
                "1px solid #DDE7F6",
              borderRadius: 8,
              background:
                "#F8FAFC",
              color:
                "#475569",
              fontSize: 12,
              lineHeight: "19px",
            }}
          >
            {
              importMessage
            }
          </div>
        ) : null}

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
            No affected content added yet.
            <br />
            Paste known Content IDs / URLs,
            upload a .txt or .csv file, or
            arrive from Find Your Content
            with matched items already selected.
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
            Explain the copyright concern
            that applies to the selected items.
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
            every selected item.
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
              I confirm that the information
              supplied is accurate to the best
              of my knowledge.
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
              I am the rights holder or am
              authorized to act on behalf of
              the rights holder.
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
              No Poster account is created.
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
            as one copyright case.
          </p>

          <p>
            Submission does not automatically
            remove content. Each affected item
            is reviewed before action.
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