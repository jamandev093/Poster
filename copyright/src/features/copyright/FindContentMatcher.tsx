"use client";

import {
  useMemo,
  useState,
} from "react";

import {
  useRouter,
} from "next/navigation";

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

  availability:
    ContentAvailability;
}

type MatchStatus =
  | "exact_match"
  | "not_found"
  | "invalid"
  | "duplicate";

interface MatchResult {
  id: string;

  input: string;

  status: MatchStatus;

  record?: DemoContentRecord;
}

/*
 * Frontend demonstration records only.
 *
 * Production Find Your Content will query the
 * Backend using identifiers supplied by the
 * claimant. It will never expose or browse the
 * complete Poster content inventory.
 */
const DEMO_CONTENT:
  DemoContentRecord[] = [
  {
    contentId:
      "CNT-10482",

    title:
      "Cloud Skills for Professionals",

    source:
      "Example Publisher",

    posterUrl:
      "https://poster.example/content/CNT-10482",

    originalUrl:
      "https://example.com/cloud-skills",

    availability:
      "available",
  },

  {
    contentId:
      "CNT-10510",

    title:
      "Modern Learning and Career Development",

    source:
      "Example Learning",

    posterUrl:
      "https://poster.example/content/CNT-10510",

    originalUrl:
      "https://example.com/modern-learning",

    availability:
      "available",
  },

  {
    contentId:
      "CNT-10672",

    title:
      "Artificial Intelligence Research Digest",

    source:
      "Example Research",

    posterUrl:
      "https://poster.example/content/CNT-10672",

    originalUrl:
      "https://example.com/ai-research-digest",

    availability:
      "available",
  },

  {
    contentId:
      "CNT-10840",

    title:
      "Professional Growth Handbook",

    source:
      "Example Knowledge",

    posterUrl:
      "https://poster.example/content/CNT-10840",

    originalUrl:
      "https://example.com/professional-growth",

    availability:
      "available",
  },

  {
    contentId:
      "CNT-10905",

    source:
      "Example Publisher",

    posterUrl:
      "https://poster.example/content/CNT-10905",

    originalUrl:
      "https://example.com/previous-record",

    availability:
      "unavailable",
  },
];

const MAX_IDENTIFIERS =
  100;

const TRACKING_PARAMETERS =
  new Set([
    "fbclid",
    "gclid",
    "dclid",
    "msclkid",
  ]);

function normalizeUrl(
  value: string
): string | null {
  try {
    const url =
      new URL(
        value.trim()
      );

    if (
      url.protocol !==
        "http:" &&
      url.protocol !==
        "https:"
    ) {
      return null;
    }

    url.hash =
      "";

    const keysToRemove:
      string[] = [];

    url.searchParams.forEach(
      (
        _,
        key
      ) => {
        const normalizedKey =
          key.toLowerCase();

        if (
          normalizedKey.startsWith(
            "utm_"
          ) ||
          TRACKING_PARAMETERS.has(
            normalizedKey
          )
        ) {
          keysToRemove.push(
            key
          );
        }
      }
    );

    keysToRemove.forEach(
      (
        key
      ) =>
        url.searchParams.delete(
          key
        )
    );

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

    url.searchParams.sort();

    return url.toString();
  } catch {
    return null;
  }
}

function normalizeIdentifier(
  value: string
):
  | {
      type:
        "content_id";

      value:
        string;
    }
  | {
      type:
        "url";

      value:
        string;
    }
  | null {
  const trimmed =
    value.trim();

  if (
    /^CNT-\d+$/i.test(
      trimmed
    )
  ) {
    return {
      type:
        "content_id",

      value:
        trimmed.toUpperCase(),
    };
  }

  const normalizedUrl =
    normalizeUrl(
      trimmed
    );

  if (
    normalizedUrl
  ) {
    return {
      type:
        "url",

      value:
        normalizedUrl,
    };
  }

  return null;
}

function createMatchIndex() {
  const index =
    new Map<
      string,
      DemoContentRecord
    >();

  DEMO_CONTENT.forEach(
    (
      record
    ) => {
      index.set(
        `content_id:${record.contentId}`,
        record
      );

      const posterUrl =
        normalizeUrl(
          record.posterUrl
        );

      const originalUrl =
        normalizeUrl(
          record.originalUrl
        );

      if (
        posterUrl
      ) {
        index.set(
          `url:${posterUrl}`,
          record
        );
      }

      if (
        originalUrl
      ) {
        index.set(
          `url:${originalUrl}`,
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
      return "Invalid identifier";

    case "duplicate":
      return "Duplicate";
  }
}

export default function FindContentMatcher() {
  const router =
    useRouter();

  const [
    identifiers,
    setIdentifiers,
  ] =
    useState(
      ""
    );

  const [
    results,
    setResults,
  ] =
    useState<
      MatchResult[]
    >(
      []
    );

  const [
    selected,
    setSelected,
  ] =
    useState<
      Record<
        string,
        DemoContentRecord
      >
    >(
      {}
    );

  const [
    error,
    setError,
  ] =
    useState(
      ""
    );

  const selectedRecords =
    useMemo(
      () =>
        Object.values(
          selected
        ),
      [
        selected,
      ]
    );

  const selectedCount =
    selectedRecords.length;

  const exactMatches =
    useMemo(
      () =>
        results.filter(
          (
            result
          ) =>
            result.status ===
              "exact_match" &&
            result.record
        ),
      [
        results,
      ]
    );

  const exactMatchCount =
    exactMatches.length;

  const notFoundCount =
    results.filter(
      (
        result
      ) =>
        result.status ===
        "not_found"
    ).length;

  const invalidCount =
    results.filter(
      (
        result
      ) =>
        result.status ===
        "invalid"
    ).length;

  const duplicateCount =
    results.filter(
      (
        result
      ) =>
        result.status ===
        "duplicate"
    ).length;

  const allCurrentMatchesSelected =
    exactMatchCount >
      0 &&
    exactMatches.every(
      (
        result
      ) =>
        result.record
          ? Boolean(
              selected[
                result.record
                  .contentId
              ]
            )
          : false
    );

  const findMatches =
    () => {
      const entered =
        identifiers
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
        setError(
          "Enter at least one Poster Content ID or exact URL."
        );

        setResults(
          []
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

      const seen =
        new Set<
          string
        >();

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

            const lookupKey =
              `${normalized.type}:${normalized.value}`;

            if (
              seen.has(
                lookupKey
              )
            ) {
              return {
                id:
                  `duplicate-${index}`,

                input,

                status:
                  "duplicate",
              };
            }

            seen.add(
              lookupKey
            );

            const record =
              MATCH_INDEX.get(
                lookupKey
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

      setError(
        ""
      );
    };

  const toggleRecord = (
    record:
      DemoContentRecord
  ) => {
    setSelected(
      (
        current
      ) => {
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
        } else {
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
        }

        return next;
      }
    );
  };

  const toggleAllCurrentMatches =
    () => {
      setSelected(
        (
          current
        ) => {
          const next = {
            ...current,
          };

          if (
            allCurrentMatchesSelected
          ) {
            exactMatches.forEach(
              (
                result
              ) => {
                if (
                  result.record
                ) {
                  delete next[
                    result.record
                      .contentId
                  ];
                }
              }
            );

            return next;
          }

          exactMatches.forEach(
            (
              result
            ) => {
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
                result.record
                  .contentId
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
      setSelected(
        {}
      );
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
        selectedRecords[
          0
        ].contentId;

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

      const ids =
        selectedRecords
          .map(
            (
              record
            ) =>
              record.contentId
          )
          .join(
            ","
          );

      router.push(
        `/bulk-removal?items=${encodeURIComponent(
          ids
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
            Enter a Poster Content ID,
            exact Poster URL, or exact
            original-source URL. You can
            enter up to 100 identifiers,
            one per line.
          </p>
        </div>

        <div
          className={
            styles.restrictionNote
          }
        >
          Find Your Content performs exact
          matching only. It does not browse,
          suggest, or expose Poster&apos;s
          content inventory.
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
              event.target
                .value
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
          >
            {
              error
            }
          </div>
        ) : null}
      </section>

      {results.length >
      0 ? (
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
                Only records corresponding
                to the identifiers you
                supplied are shown.
              </p>
            </div>

            <div
              className={
                styles.summary
              }
            >
              <span>
                <strong>
                  {
                    exactMatchCount
                  }
                </strong>
                {" "}
                matched
              </span>

              <span>
                <strong>
                  {
                    notFoundCount
                  }
                </strong>
                {" "}
                not found
              </span>

              <span>
                <strong>
                  {
                    invalidCount
                  }
                </strong>
                {" "}
                invalid
              </span>

              <span>
                <strong>
                  {
                    duplicateCount
                  }
                </strong>
                {" "}
                duplicate
              </span>
            </div>
          </div>

          {exactMatchCount >
          0 ? (
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
                  Select all exact matches
                  from this lookup
                </span>
              </label>

              <strong>
                {
                  selectedCount
                }
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
              (
                result
              ) => {
                const record =
                  result.record;

                const selectable =
                  result.status ===
                    "exact_match" &&
                  record;

                const checked =
                  selectable
                    ? Boolean(
                        selected[
                          record
                            .contentId
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
                      {selectable ? (
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
                      {record ? (
                        <>
                          <div
                            className={
                              styles.resultTitleRow
                            }
                          >
                            <strong>
                              {
                                record.availability ===
                                "available"
                                  ? record.title
                                  : "Previously identified Poster record"
                              }
                            </strong>

                            <span
                              className={
                                result.status ===
                                "exact_match"
                                  ? styles.statusMatched
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

                          {record.availability ===
                          "available" ? (
                            <div
                              className={
                                styles.original
                              }
                            >
                              Original source:
                              {" "}
                              {
                                new URL(
                                  record.originalUrl
                                ).hostname
                              }
                            </div>
                          ) : (
                            <div
                              className={
                                styles.original
                              }
                            >
                              Minimal information is
                              shown because this
                              record is no longer
                              publicly available.
                            </div>
                          )}
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
                              ? "No exact matching Poster record was found. Check the identifier and try again."
                              : result.status ===
                                "duplicate"
                              ? "This identifier was already included in the same lookup."
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

      {selectedCount >
      0 ? (
        <section
          className={
            styles.selectionCard
          }
        >
          <div>
            <strong>
              {
                selectedCount
              }
              {" "}
              {selectedCount ===
              1
                ? "content item selected"
                : "content items selected"}
            </strong>

            <p>
              Matching a Poster record does
              not verify copyright ownership.
              Ownership and authority are
              reviewed through the copyright
              claim process.
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
              Clear selected
            </button>

            {selectedCount ===
            1 ? (
              <button
                type="button"
                className="secondaryButton"
                onClick={
                  continueSingleClaim
                }
              >
                Continue to single claim
              </button>
            ) : null}

            <button
              type="button"
              className="primaryButton"
              onClick={
                continueBulkClaim
              }
            >
              Continue to Bulk Removal
              {" "}
              (
              {
                selectedCount
              }
              )
            </button>
          </div>
        </section>
      ) : null}

      <section
        className={
          styles.demoNote
        }
      >
        <strong>
          Frontend demonstration
        </strong>

        <p>
          Exact matching currently uses a
          small demonstration dataset only.
          Backend integration will later
          replace the data source while
          preserving this exact-match-only
          privacy model.
        </p>
      </section>
    </div>
  );
}