"use client";

import {
  FormEvent,
  useMemo,
  useState,
} from "react";
import {
  useRouter,
} from "next/navigation";

import {
  lookupPublicCopyrightContentMatches,
  PublicCopyrightClaimError,
} from "./public-copyright.service";

import type {
  PublicCopyrightContentMatchLookup,
  PublicCopyrightContentMatchResult,
  PublicCopyrightContentMatchStatus,
  PublicCopyrightMatchedContent,
} from "./public-copyright.types";

import styles from "./FindContentMatcher.module.css";

const MAX_IDENTIFIERS =
  100;

function splitIdentifiers(
  value: string
): string[] {
  return value
    .split(
      /[\n,]+/
    )
    .map(
      item =>
        item.trim()
    )
    .filter(
      Boolean
    )
    .slice(
      0,
      MAX_IDENTIFIERS
    );
}

function statusLabel(
  status:
    PublicCopyrightContentMatchStatus
): string {
  switch (status) {
    case "exact_match":
      return "Exact match";

    case "not_found":
      return "No exact match";

    case "invalid":
      return "Invalid input";

    case "duplicate":
      return "Duplicate";

    default:
      return "Checked";
  }
}

function contentStateLabel(
  status: string
): string {
  return status
    .replace(
      /_/g,
      " "
    )
    .replace(
      /\b\w/g,
      character =>
        character.toUpperCase()
    );
}

function resultStatusClassName(
  status:
    PublicCopyrightContentMatchStatus
): string {
  if (
    status ===
    "exact_match"
  ) {
    return styles.statusMatched;
  }

  if (
    status ===
    "invalid"
  ) {
    return styles.statusInvalid;
  }

  return styles.statusNeutral;
}

function safePublicContentId(
  content:
    PublicCopyrightMatchedContent |
    undefined
): string | null {
  return content?.publicId ??
    null;
}

export default function FindContentMatcher() {
  const router =
    useRouter();

  const [
    identifiersText,
    setIdentifiersText,
  ] =
    useState("");

  const [
    match,
    setMatch,
  ] =
    useState<PublicCopyrightContentMatchLookup | null>(
      null
    );

  const [
    selectedIds,
    setSelectedIds,
  ] =
    useState<string[]>(
      []
    );

  const [
    error,
    setError,
  ] =
    useState("");

  const [
    isLoading,
    setIsLoading,
  ] =
    useState(
      false
    );

  const parsedIdentifiers =
    useMemo(
      () =>
        splitIdentifiers(
          identifiersText
        ),
      [
        identifiersText,
      ]
    );

  const exactMatches =
    useMemo(
      () =>
        match?.results.filter(
          result =>
            result.status ===
              "exact_match" &&
            result.content
        ) ?? [],
      [
        match,
      ]
    );

  const selectedCount =
    selectedIds.length;

  const findMatches = async (
    event:
      FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (
      isLoading
    ) {
      return;
    }

    if (
      parsedIdentifiers.length ===
      0
    ) {
      setMatch(
        null
      );

      setSelectedIds(
        []
      );

      setError(
        "Enter at least one Poster Content ID, Poster URL, or original-source URL."
      );

      return;
    }

    setError(
      ""
    );

    setIsLoading(
      true
    );

    try {
      const nextMatch =
        await lookupPublicCopyrightContentMatches({
          identifiers:
            parsedIdentifiers,
        });

      setMatch(
        nextMatch
      );

      setSelectedIds(
        nextMatch.results
          .filter(
            result =>
              result.status ===
                "exact_match" &&
              result.content
          )
          .map(
            result =>
              result.content?.publicId
          )
          .filter(
            (
              value
            ): value is string =>
              typeof value ===
              "string"
          )
      );
    } catch (
      caughtError
    ) {
      setMatch(
        null
      );

      setSelectedIds(
        []
      );

      if (
        caughtError instanceof
        PublicCopyrightClaimError
      ) {
        const issueText =
          caughtError.issues.length > 0
            ? ` ${caughtError.issues.join(" ")}`
            : "";

        setError(
          `${caughtError.message}${issueText}`
        );
      } else {
        setError(
          "The content match lookup could not be completed. Please try again."
        );
      }
    } finally {
      setIsLoading(
        false
      );
    }
  };

  const toggleSelected = (
    publicId: string
  ) => {
    setSelectedIds(
      current =>
        current.includes(
          publicId
        )
          ? current.filter(
              item =>
                item !==
                publicId
            )
          : [
              ...current,
              publicId,
            ]
    );
  };

  const clearSelected = () => {
    setSelectedIds(
      []
    );
  };

  const continueSingleClaim = () => {
    const firstSelected =
      selectedIds[0];

    if (
      !firstSelected
    ) {
      return;
    }

    router.push(
      `/request?content=${encodeURIComponent(
        firstSelected
      )}`
    );
  };

  const continueBulkClaim = () => {
    if (
      selectedIds.length ===
      0
    ) {
      return;
    }

    router.push(
      `/bulk-removal?items=${encodeURIComponent(
        selectedIds.join(
          ","
        )
      )}`
    );
  };

  const renderResultDescription = (
    result:
      PublicCopyrightContentMatchResult
  ) => {
    if (
      result.status ===
        "exact_match" &&
      result.content
    ) {
      return (
        <>
          <div
            className={
              styles.resultTitleRow
            }
          >
            <strong>
              {result.content.publicId}
            </strong>

            <span
              className={
                resultStatusClassName(
                  result.status
                )
              }
            >
              {statusLabel(
                result.status
              )}
            </span>
          </div>

          <div
            className={
              styles.resultTitle
            }
          >
            {result.content.title}
          </div>

          <div
            className={
              styles.original
            }
          >
            Publisher: {result.content.publisherName}
          </div>

          <div
            className={
              styles.original
            }
          >
            Original URL: {result.content.originalUrl}
          </div>

          <div
            className={
              styles.original
            }
          >
            Content state: {contentStateLabel(
              result.content.status
            )}
          </div>
        </>
      );
    }

    if (
      result.status ===
      "duplicate"
    ) {
      return (
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
              {result.input}
            </strong>

            <span
              className={
                styles.statusNeutral
              }
            >
              Duplicate
            </span>
          </div>

          <div
            className={
              styles.original
            }
          >
            {result.duplicateOfPublicId
              ? `Already represented by ${result.duplicateOfPublicId}.`
              : "Already checked in this lookup."}
          </div>
        </>
      );
    }

    return (
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
            {result.input}
          </strong>

          <span
            className={
              resultStatusClassName(
                result.status
              )
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
            ? "No exact matching Poster record was found for this identifier."
            : "Enter a valid Poster Content ID, Poster URL, or complete http/https original-source URL."}
        </div>
      </>
    );
  };

  return (
    <div
      className={
        styles.matcher
      }
    >
      <section
        className={
          styles.lookupCard
        }
      >
        <div
          className={
            styles.lookupHeader
          }
        >
          <div>
            <div className="sectionEyebrow">
              Exact content lookup
            </div>

            <h2 className="sectionTitle sectionTitleLarge">
              Match known identifiers
            </h2>

            <p className="sectionDescription">
              Enter Poster Content IDs, Poster URLs, or
              original-source URLs that you already
              possess. Poster returns only exact matching
              records, not a browsable content inventory.
            </p>
          </div>

          <div
            className={
              styles.limitPill
            }
          >
            Up to {MAX_IDENTIFIERS}
          </div>
        </div>

        <form
          onSubmit={findMatches}
          className={
            styles.lookupForm
          }
        >
          <label
            htmlFor="content-identifiers"
            className={
              styles.inputLabel
            }
          >
            Content identifiers
          </label>

          <textarea
            id="content-identifiers"
            value={identifiersText}
            onChange={(event) =>
              setIdentifiersText(
                event.target.value
              )
            }
            className={
              styles.textarea
            }
            rows={8}
            placeholder={`CNT-2003
https://poster.example/content/CNT-2003
https://publisher.example/original-story`}
          />

          <div
            className={
              styles.lookupMeta
            }
          >
            <span>
              {parsedIdentifiers.length}
              {" "}
              {parsedIdentifiers.length === 1
                ? "identifier"
                : "identifiers"}{" "}
              ready to check
            </span>

            <span>
              One identifier per line, or comma-separated.
            </span>
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

          <div
            className={
              styles.actions
            }
          >
            <button
              type="submit"
              className="primaryButton"
              disabled={isLoading}
            >
              {isLoading
                ? "Finding matches..."
                : "Find exact matches"}
            </button>
          </div>
        </form>
      </section>

      {match ? (
        <section
          className={
            styles.summaryCard
          }
        >
          <div
            className={
              styles.summaryGrid
            }
          >
            <div
              className={
                styles.summaryItem
              }
            >
              <span>
                Exact matches
              </span>

              <strong>
                {match.counts.exactMatchCount}
              </strong>
            </div>

            <div
              className={
                styles.summaryItem
              }
            >
              <span>
                Not found
              </span>

              <strong>
                {match.counts.notFoundCount}
              </strong>
            </div>

            <div
              className={
                styles.summaryItem
              }
            >
              <span>
                Invalid
              </span>

              <strong>
                {match.counts.invalidCount}
              </strong>
            </div>

            <div
              className={
                styles.summaryItem
              }
            >
              <span>
                Duplicate
              </span>

              <strong>
                {match.counts.duplicateCount}
              </strong>
            </div>
          </div>
        </section>
      ) : null}

      {match ? (
        <section
          className={
            styles.resultsCard
          }
        >
          <div
            className={
              styles.sectionHeader
            }
          >
            <div>
              <h2>
                Lookup results
              </h2>

              <p>
                Only safe public content fields are shown:
                Content ID, title, publisher, original
                URL, and current content state.
              </p>
            </div>
          </div>

          <div
            className={
              styles.resultList
            }
          >
            {match.results.map(
              (
                result,
                index
              ) => {
                const publicId =
                  safePublicContentId(
                    result.content
                  );

                return (
                  <div
                    key={`${result.input}-${index}`}
                    className={
                      styles.resultCard
                    }
                  >
                    {publicId ? (
                      <label
                        className={
                          styles.resultSelect
                        }
                      >
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(
                            publicId
                          )}
                          onChange={() =>
                            toggleSelected(
                              publicId
                            )
                          }
                          aria-label={`Select ${publicId}`}
                        />

                        <span>
                          Select
                        </span>
                      </label>
                    ) : null}

                    <div
                      className={
                        styles.resultContent
                      }
                    >
                      {renderResultDescription(
                        result
                      )}
                    </div>
                  </div>
                );
              }
            )}
          </div>
        </section>
      ) : null}

      {exactMatches.length > 0 ? (
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
              Matching identifies affected Poster content.
              It does not verify ownership or remove
              content automatically.
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
              onClick={clearSelected}
              disabled={
                selectedCount ===
                0
              }
            >
              Clear
            </button>

            {selectedCount === 1 ? (
              <button
                type="button"
                className="secondaryButton"
                onClick={continueSingleClaim}
              >
                Submit single claim
              </button>
            ) : null}

            <button
              type="button"
              className="primaryButton"
              onClick={continueBulkClaim}
              disabled={
                selectedCount ===
                0
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
          Matching uses Poster Backend exact lookup. This
          page does not expose a searchable public content
          inventory.
        </p>
      </div>
    </div>
  );
}