"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import styles from "./FindContentMatcher.module.css";

type ContentAvailability =
  | "available"
  | "unavailable";

interface DemoContentRecord {
  contentId: string;
  title?: string;
  source: string;
  posterUrl: string;
  originalUrl: string;
  availability: ContentAvailability;
}

type MatchStatus =
  | "exact_match"
  | "not_found"
  | "invalid"
  | "duplicate";

type DuplicateReason =
  | "same_identifier"
  | "same_content";

interface MatchResult {
  id: string;
  input: string;
  status: MatchStatus;
  record?: DemoContentRecord;
  duplicateReason?: DuplicateReason;
}

type NormalizedIdentifier =
  | {
      type: "content_id";
      value: string;
    }
  | {
      type: "url";
      value: string;
    };

const MAX_IDENTIFIERS = 100;

const TRACKING_PARAMETERS = new Set([
  "fbclid",
  "gclid",
  "dclid",
  "msclkid",
]);

/*
 * Frontend-only demonstration records.
 *
 * Production behavior will use the Backend
 * content index and identifiers supplied by
 * the claimant.
 *
 * This data must never become a public,
 * browsable Poster content inventory.
 */
const DEMO_CONTENT: DemoContentRecord[] = [
  {
    contentId: "CNT-10482",
    title: "Cloud Skills for Professionals",
    source: "Example Publisher",
    posterUrl:
      "https://poster.example/content/CNT-10482",
    originalUrl:
      "https://example.com/cloud-skills",
    availability: "available",
  },
  {
    contentId: "CNT-10510",
    title:
      "Modern Learning and Career Development",
    source: "Example Learning",
    posterUrl:
      "https://poster.example/content/CNT-10510",
    originalUrl:
      "https://example.com/modern-learning",
    availability: "available",
  },
  {
    contentId: "CNT-10672",
    title:
      "Artificial Intelligence Research Digest",
    source: "Example Research",
    posterUrl:
      "https://poster.example/content/CNT-10672",
    originalUrl:
      "https://example.com/ai-research-digest",
    availability: "available",
  },
  {
    contentId: "CNT-10840",
    title: "Professional Growth Handbook",
    source: "Example Knowledge",
    posterUrl:
      "https://poster.example/content/CNT-10840",
    originalUrl:
      "https://example.com/professional-growth",
    availability: "available",
  },
  {
    contentId: "CNT-10905",
    source: "Example Publisher",
    posterUrl:
      "https://poster.example/content/CNT-10905",
    originalUrl:
      "https://example.com/previous-record",
    availability: "unavailable",
  },
];

function normalizeUrl(
  value: string
): string | null {
  try {
    const url = new URL(
      value.trim()
    );

    if (
      url.protocol !== "http:" &&
      url.protocol !== "https:"
    ) {
      return null;
    }

    // Fragments do not identify a different
    // publisher resource for matching.
    url.hash = "";

    /*
     * Remove only known tracking parameters.
     *
     * Do not remove arbitrary query parameters:
     * some publishers use them to identify
     * genuinely different resources.
     */
    const keysToRemove: string[] = [];

    url.searchParams.forEach(
      (_value, key) => {
        const normalizedKey =
          key.toLowerCase();

        if (
          normalizedKey.startsWith("utm_") ||
          TRACKING_PARAMETERS.has(
            normalizedKey
          )
        ) {
          keysToRemove.push(key);
        }
      }
    );

    keysToRemove.forEach(
      (key) => {
        url.searchParams.delete(key);
      }
    );

    url.hostname =
      url.hostname.toLowerCase();

    if (
      url.pathname.length > 1 &&
      url.pathname.endsWith("/")
    ) {
      url.pathname =
        url.pathname.replace(
          /\/+$/,
          ""
        );
    }

    url.searchParams.sort();

    return url.toString();
  } catch {
    return null;
  }
}

function normalizeIdentifier(
  value: string
): NormalizedIdentifier | null {
  const trimmed =
    value.trim();

  if (
    /^CNT-\d+$/i.test(
      trimmed
    )
  ) {
    return {
      type: "content_id",
      value:
        trimmed.toUpperCase(),
    };
  }

  const normalizedUrl =
    normalizeUrl(trimmed);

  if (
    normalizedUrl
  ) {
    return {
      type: "url",
      value:
        normalizedUrl,
    };
  }

  return null;
}

function createMatchIndex():
  Map<string, DemoContentRecord> {
  const index =
    new Map<
      string,
      DemoContentRecord
    >();

  DEMO_CONTENT.forEach(
    (record) => {
      index.set(
        `content_id:${record.contentId}`,
        record
      );

      const normalizedPosterUrl =
        normalizeUrl(
          record.posterUrl
        );

      const normalizedOriginalUrl =
        normalizeUrl(
          record.originalUrl
        );

      if (
        normalizedPosterUrl
      ) {
        index.set(
          `url:${normalizedPosterUrl}`,
          record
        );
      }

      if (
        normalizedOriginalUrl
      ) {
        index.set(
          `url:${normalizedOriginalUrl}`,
          record
        );
      }
    }
  );

  return index;
}

const MATCH_INDEX =
  createMatchIndex();

function statusLabel(
  status: MatchStatus
): string {
  switch (status) {
    case "exact_match":
      return "Exact match";

    case "not_found":
      return "Not found";

    case "invalid":
      return "Invalid";

    case "duplicate":
      return "Duplicate";
  }
}

function duplicateMessage(
  result: MatchResult
): string {
  if (
    result.duplicateReason ===
    "same_content"
  ) {
    return (
      "This identifier resolves to the same " +
      "Poster content record as another " +
      "identifier in this lookup."
    );
  }

  return (
    "This identifier was already entered " +
    "in this lookup."
  );
}

export default function FindContentMatcher() {
  const router =
    useRouter();

  const [
    identifiers,
    setIdentifiers,
  ] = useState("");

  const [
    results,
    setResults,
  ] =
    useState<MatchResult[]>([]);

  /*
   * Selection is keyed by canonical Poster
   * Content ID.
   *
   * One content record therefore cannot be
   * selected twice even when the claimant
   * knows several identifiers for it.
   */
  const [
    selected,
    setSelected,
  ] = useState<
    Record<
      string,
      DemoContentRecord
    >
  >({});

  const [
    error,
    setError,
  ] = useState("");

  const selectedRecords =
    useMemo(
      () =>
        Object.values(
          selected
        ),
      [selected]
    );

  const selectedCount =
    selectedRecords.length;

  /*
   * Only unique canonical matches receive
   * exact_match status.
   *
   * Another identifier resolving to the
   * same Content ID becomes a duplicate.
   */
  const exactMatches =
    useMemo(
      () =>
        results.filter(
          (result) =>
            result.status ===
              "exact_match" &&
            Boolean(
              result.record
            )
        ),
      [results]
    );

  const exactMatchCount =
    exactMatches.length;

  const notFoundCount =
    results.filter(
      (result) =>
        result.status ===
        "not_found"
    ).length;

  const invalidCount =
    results.filter(
      (result) =>
        result.status ===
        "invalid"
    ).length;

  const duplicateCount =
    results.filter(
      (result) =>
        result.status ===
        "duplicate"
    ).length;

  const allCurrentMatchesSelected =
    exactMatchCount > 0 &&
    exactMatches.every(
      (result) => {
        if (
          !result.record
        ) {
          return false;
        }

        return Boolean(
          selected[
            result.record.contentId
          ]
        );
      }
    );

  const findMatches =
    () => {
      const entered =
        identifiers
          .split(/\r?\n/)
          .map(
            (value) =>
              value.trim()
          )
          .filter(Boolean);

      if (
        entered.length === 0
      ) {
        setResults([]);

        setError(
          "Enter at least one Poster Content ID or exact URL."
        );

        return;
      }

      if (
        entered.length >
        MAX_IDENTIFIERS
      ) {
        setError(
          `Enter no more than ${MAX_IDENTIFIERS} identifiers in one lookup.`
        );

        return;
      }

      /*
       * First layer:
       * catch repeated/normalized identical input.
       */
      const seenIdentifierKeys =
        new Set<string>();

      /*
       * Second layer:
       * after resolution, canonical Content ID
       * becomes the deduplication key.
       *
       * Example:
       *
       * CNT-10482
       * https://example.com/cloud-skills
       *
       * Both resolve to CNT-10482.
       *
       * Result:
       * 1 exact match
       * 1 duplicate
       */
      const seenResolvedContentIds =
        new Set<string>();

      const nextResults:
        MatchResult[] =
        entered.map(
          (
            input,
            index
          ) => {
            const normalized =
              normalizeIdentifier(
                input
              );

            if (
              !normalized
            ) {
              return {
                id:
                  `invalid-${index}`,
                input,
                status:
                  "invalid",
              };
            }

            const identifierKey =
              `${normalized.type}:${normalized.value}`;

            if (
              seenIdentifierKeys.has(
                identifierKey
              )
            ) {
              return {
                id:
                  `duplicate-identifier-${index}`,
                input,
                status:
                  "duplicate",
                duplicateReason:
                  "same_identifier",
              };
            }

            seenIdentifierKeys.add(
              identifierKey
            );

            const record =
              MATCH_INDEX.get(
                identifierKey
              );

            if (
              !record
            ) {
              return {
                id:
                  `not-found-${index}`,
                input,
                status:
                  "not_found",
              };
            }

            if (
              seenResolvedContentIds.has(
                record.contentId
              )
            ) {
              return {
                id:
                  `duplicate-content-${record.contentId}-${index}`,
                input,
                status:
                  "duplicate",
                record,
                duplicateReason:
                  "same_content",
              };
            }

            seenResolvedContentIds.add(
              record.contentId
            );

            return {
              id:
                `match-${record.contentId}-${index}`,
              input,
              status:
                "exact_match",
              record,
            };
          }
        );

      setResults(
        nextResults
      );

      setError("");
    };

  const toggleRecord = (
    record:
      DemoContentRecord
  ) => {
    setSelected(
      (current) => {
        const next = {
          ...current,
        };

        if (
          next[
            record.contentId
          ]
        ) {
          delete next[
            record.contentId
          ];

          return next;
        }

        if (
          Object.keys(
            next
          ).length >=
          MAX_IDENTIFIERS
        ) {
          return current;
        }

        next[
          record.contentId
        ] =
          record;

        return next;
      }
    );
  };

  const toggleAllCurrentMatches =
    () => {
      setSelected(
        (current) => {
          const next = {
            ...current,
          };

          if (
            allCurrentMatchesSelected
          ) {
            exactMatches.forEach(
              (result) => {
                if (
                  result.record
                ) {
                  delete next[
                    result.record.contentId
                  ];
                }
              }
            );

            return next;
          }

          exactMatches.forEach(
            (result) => {
              if (
                !result.record
              ) {
                return;
              }

              if (
                Object.keys(
                  next
                ).length >=
                MAX_IDENTIFIERS
              ) {
                return;
              }

              next[
                result.record.contentId
              ] =
                result.record;
            }
          );

          return next;
        }
      );
    };

  const clearSelected =
    () => {
      setSelected({});
    };

  const continueSingleClaim =
    () => {
      if (
        selectedRecords.length !==
        1
      ) {
        return;
      }

      const contentId =
        selectedRecords[0]
          .contentId;

      router.push(
        `/request?content=${encodeURIComponent(
          contentId
        )}`
      );
    };

  const continueBulkClaim =
    () => {
      if (
        selectedRecords.length ===
        0
      ) {
        return;
      }

      /*
       * Pass canonical Content IDs only.
       *
       * Raw claimant input never becomes
       * the workflow handoff value.
       */
      const contentIds =
        selectedRecords
          .map(
            (record) =>
              record.contentId
          )
          .join(",");

      router.push(
        `/bulk-removal?items=${encodeURIComponent(
          contentIds
        )}`
      );
    };

  return (
    <div
      className={
        styles.layout
      }
    >
      <section
        className={
          styles.searchCard
        }
      >
        <div
          className={
            styles.sectionHeader
          }
        >
          <h2>
            Enter content you already know
          </h2>

          <p>
            Use a Poster Content ID, exact
            Poster URL, or exact
            original-source URL. Up to 100
            identifiers, one per line.
          </p>
        </div>

        <div
          className={
            styles.restrictionNote
          }
        >
          Exact matching only. Poster does not
          expose or browse its content inventory.
        </div>

        <label
          className={
            styles.inputLabel
          }
          htmlFor="known-content-identifiers"
        >
          Content IDs or exact URLs
        </label>

        <textarea
          id="known-content-identifiers"
          className={
            styles.textarea
          }
          value={
            identifiers
          }
          onChange={(
            event
          ) =>
            setIdentifiers(
              event.target.value
            )
          }
          placeholder={`CNT-10482
https://poster.example/content/CNT-10510
https://example.com/cloud-skills`}
        />

        <div
          className={
            styles.inputFooter
          }
        >
          <span>
            One identifier per line
          </span>

          <button
            type="button"
            className="primaryButton"
            onClick={
              findMatches
            }
          >
            Find exact matches
          </button>
        </div>

        {error ? (
          <div
            className={
              styles.error
            }
            role="alert"
          >
            {error}
          </div>
        ) : null}
      </section>

      {results.length > 0 ? (
        <section
          className={
            styles.resultsCard
          }
        >
          <div
            className={
              styles.resultsHeader
            }
          >
            <div>
              <h2>
                Match results
              </h2>

              <p>
                Only identifiers you supplied
                are checked.
              </p>
            </div>

            <div
              className={
                styles.summary
              }
            >
              <span>
                <strong>
                  {exactMatchCount}
                </strong>
                {" matched"}
              </span>

              <span>
                <strong>
                  {notFoundCount}
                </strong>
                {" not found"}
              </span>

              <span>
                <strong>
                  {invalidCount}
                </strong>
                {" invalid"}
              </span>

              <span>
                <strong>
                  {duplicateCount}
                </strong>
                {" duplicate"}
              </span>
            </div>
          </div>

          {exactMatchCount > 0 ? (
            <div
              className={
                styles.selectBar
              }
            >
              <label
                className={
                  styles.selectAll
                }
              >
                <input
                  type="checkbox"
                  checked={
                    allCurrentMatchesSelected
                  }
                  onChange={
                    toggleAllCurrentMatches
                  }
                />

                <span>
                  Select all matched items
                </span>
              </label>

              <strong>
                {selectedCount}
                {" selected"}
              </strong>
            </div>
          ) : null}

          <div
            className={
              styles.results
            }
          >
            {results.map(
              (result) => {
                const record =
                  result.record;

                const selectable =
                  result.status ===
                    "exact_match" &&
                  Boolean(record);

                const checked =
                  selectable &&
                  record
                    ? Boolean(
                        selected[
                          record.contentId
                        ]
                      )
                    : false;

                return (
                  <div
                    key={
                      result.id
                    }
                    className={
                      styles.resultRow
                    }
                  >
                    <div
                      className={
                        styles.checkboxCell
                      }
                    >
                      {selectable &&
                      record ? (
                        <input
                          type="checkbox"
                          checked={
                            checked
                          }
                          aria-label={`Select ${record.contentId}`}
                          onChange={() =>
                            toggleRecord(
                              record
                            )
                          }
                        />
                      ) : (
                        <span
                          className={
                            styles.checkboxPlaceholder
                          }
                        />
                      )}
                    </div>

                    <div
                      className={
                        styles.resultMain
                      }
                    >
                      {result.status ===
                        "exact_match" &&
                      record ? (
                        <>
                          <div
                            className={
                              styles.resultTitleRow
                            }
                          >
                            <strong>
                              {record.availability ===
                              "available"
                                ? record.title
                                : "Previously identified Poster record"}
                            </strong>

                            <span
                              className={
                                styles.statusMatched
                              }
                            >
                              Exact match
                            </span>
                          </div>

                          <div
                            className={
                              styles.metadata
                            }
                          >
                            <span>
                              {
                                record.contentId
                              }
                            </span>

                            <span>
                              {
                                record.source
                              }
                            </span>

                            <span>
                              {record.availability ===
                              "available"
                                ? "Available through Poster"
                                : "No longer publicly available"}
                            </span>
                          </div>

                          <div
                            className={
                              styles.original
                            }
                          >
                            {record.availability ===
                            "available"
                              ? `Original source: ${
                                  new URL(
                                    record.originalUrl
                                  ).hostname
                                }`
                              : "Minimal information is shown because this record is no longer publicly available."}
                          </div>
                        </>
                      ) : (
                        <>
                          <div
                            className={
                              styles.resultTitleRow
                            }
                          >
                            <strong
                              className={
                                styles.submittedValue
                              }
                            >
                              {
                                result.input
                              }
                            </strong>

                            <span
                              className={
                                result.status ===
                                "invalid"
                                  ? styles.statusInvalid
                                  : styles.statusNeutral
                              }
                            >
                              {statusLabel(
                                result.status
                              )}
                            </span>
                          </div>

                          <div
                            className={
                              styles.original
                            }
                          >
                            {result.status ===
                            "not_found"
                              ? "No exact matching Poster record was found."
                              : result.status ===
                                "duplicate"
                              ? duplicateMessage(
                                  result
                                )
                              : "Enter a valid Poster Content ID or a complete http/https URL."}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                );
              }
            )}
          </div>
        </section>
      ) : null}

      {selectedCount > 0 ? (
        <section
          className={
            styles.selectionCard
          }
        >
          <div>
            <strong>
              {selectedCount}
              {" "}
              {selectedCount === 1
                ? "content item selected"
                : "content items selected"}
            </strong>

            <p>
              Finding a matching record identifies
              the affected content. It does not
              verify copyright ownership.
            </p>
          </div>

          <div
            className={
              styles.selectionActions
            }
          >
            <button
              type="button"
              className="secondaryButton"
              onClick={
                clearSelected
              }
            >
              Clear
            </button>

            {selectedCount === 1 ? (
              <button
                type="button"
                className="secondaryButton"
                onClick={
                  continueSingleClaim
                }
              >
                Submit single claim
              </button>
            ) : null}

            <button
              type="button"
              className="primaryButton"
              onClick={
                continueBulkClaim
              }
            >
              Bulk request
              {" "}
              (
              {selectedCount}
              )
            </button>
          </div>
        </section>
      ) : null}

      <div
        className={
          styles.demoNote
        }
      >
        <p>
          Development environment · Matching data is
          temporary until backend integration.
        </p>
      </div>
    </div>
  );
}