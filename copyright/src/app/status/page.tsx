"use client";

import {
  FormEvent,
  useState,
} from "react";

import SignalContact from "@/components/SignalContact";

type TimelineState =
  | "complete"
  | "current"
  | "pending";

interface TimelineEntry {
  label: string;
  detail: string;
  state: TimelineState;
}

interface ClaimItem {
  contentId: string;
  status: string;
  outcome: string;
}

interface BulkSummary {
  removed: number;
  blocked: number;
  underReview: number;
  informationRequired: number;
  noAction: number;
}

interface DemoClaim {
  reference: string;
  email: string;
  kind: "single" | "bulk";
  status: string;
  affectedCount: number;
  timeline: TimelineEntry[];
  outcome?: string;
  reimportProtection?: string;
  summary?: BulkSummary;
  items?: ClaimItem[];
}

const DEMO_CLAIMS:
  DemoClaim[] = [
  {
    reference:
      "CR-DEMO-0001",

    email:
      "claimant@example.com",

    kind:
      "single",

    status:
      "Resolved",

    affectedCount:
      1,

    timeline: [
      {
        label:
          "Submitted",

        detail:
          "Copyright request received",

        state:
          "complete",
      },
      {
        label:
          "Under review",

        detail:
          "Claim and affected content reviewed",

        state:
          "complete",
      },
      {
        label:
          "Action taken",

        detail:
          "Content removal completed",

        state:
          "complete",
      },
      {
        label:
          "Resolved",

        detail:
          "Final outcome recorded",

        state:
          "complete",
      },
    ],

    outcome:
      "Removed",

    reimportProtection:
      "Enabled",
  },

  {
    reference:
      "CR-DEMO-0002",

    email:
      "rights@example.com",

    kind:
      "bulk",

    status:
      "Partially resolved",

    affectedCount:
      5,

    timeline: [
      {
        label:
          "Submitted",

        detail:
          "Bulk copyright request received",

        state:
          "complete",
      },
      {
        label:
          "Under review",

        detail:
          "Affected items are being reviewed",

        state:
          "current",
      },
      {
        label:
          "Resolved",

        detail:
          "Final outcomes pending for remaining items",

        state:
          "pending",
      },
    ],

    summary: {
      removed:
        2,

      blocked:
        1,

      underReview:
        1,

      informationRequired:
        1,

      noAction:
        0,
    },

    items: [
      {
        contentId:
          "CNT-1001",

        status:
          "Resolved",

        outcome:
          "Removed",
      },
      {
        contentId:
          "CNT-1002",

        status:
          "Resolved",

        outcome:
          "Removed",
      },
      {
        contentId:
          "CNT-1003",

        status:
          "Resolved",

        outcome:
          "Removed + re-import blocked",
      },
      {
        contentId:
          "CNT-1004",

        status:
          "Under review",

        outcome:
          "Review in progress",
      },
      {
        contentId:
          "CNT-1005",

        status:
          "Information required",

        outcome:
          "Waiting for claimant information",
      },
    ],
  },
];

function timelineMark(
  state: TimelineState
): string {
  switch (state) {
    case "complete":
      return "✓";

    case "current":
      return "●";

    case "pending":
      return "○";
  }
}

function timelineColors(
  state: TimelineState
) {
  switch (state) {
    case "complete":
      return {
        background:
          "#F0FDF4",

        color:
          "#15803D",
      };

    case "current":
      return {
        background:
          "#EEF4FF",

        color:
          "#416ECF",
      };

    case "pending":
      return {
        background:
          "#F1F5F9",

        color:
          "#64748B",
      };
  }
}

export default function CopyrightStatusPage() {
  const [
    reference,
    setReference,
  ] =
    useState("");

  const [
    email,
    setEmail,
  ] =
    useState("");

  const [
    error,
    setError,
  ] =
    useState("");

  const [
    claim,
    setClaim,
  ] =
    useState<
      DemoClaim | null
    >(
      null
    );

  const checkStatus = (
    event:
      FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    const normalizedReference =
      reference
        .trim()
        .toUpperCase();

    const normalizedEmail =
      email
        .trim()
        .toLowerCase();

    if (
      !normalizedReference ||
      !normalizedEmail
    ) {
      setClaim(
        null
      );

      setError(
        "Enter your claim reference and the email used for submission."
      );

      return;
    }

    /*
     * Production backend will check the
     * reference/email pair, apply rate limits,
     * and return only the matching case.
     *
     * There is no separate OTP or verification
     * page in this workflow.
     */
    const matchedClaim =
      DEMO_CLAIMS.find(
        (
          candidate
        ) =>
          candidate.reference ===
            normalizedReference &&
          candidate.email.toLowerCase() ===
            normalizedEmail
      );

    if (
      !matchedClaim
    ) {
      setClaim(
        null
      );

      /*
       * Keep the response generic so it does not
       * reveal whether the reference or email was
       * the incorrect value.
       */
      setError(
        "No matching copyright request was found with those details."
      );

      return;
    }

    setError(
      ""
    );

    setClaim(
      matchedClaim
    );
  };

  const resetLookup =
    () => {
      setClaim(
        null
      );

      setReference(
        ""
      );

      setEmail(
        ""
      );

      setError(
        ""
      );
    };

  const bulkSummary =
    claim?.kind ===
      "bulk"
      ? claim.summary
      : undefined;

  const bulkItems =
    claim?.kind ===
      "bulk"
      ? claim.items ?? []
      : [];

  return (
    <>
      <header className="pageHeader">
        <div>
          <div className="pageEyebrow">
            Copyright
          </div>

          <h1 className="pageTitle">
            Check Status
          </h1>

          <p className="pageDescription">
            Enter your claim reference and
            submitted email to see whether
            affected content was removed,
            remains under review, or requires
            more information.
          </p>
        </div>
      </header>

      {!claim ? (
        <>
          <section className="contentCard">
            <form
              onSubmit={
                checkStatus
              }
            >
              <div className="formGrid">
                <div className="formField">
                  <label htmlFor="claim-reference">
                    Claim reference *
                  </label>

                  <input
                    id="claim-reference"
                    value={
                      reference
                    }
                    onChange={(
                      event
                    ) =>
                      setReference(
                        event.target.value
                      )
                    }
                    placeholder="CR-..."
                    autoComplete="off"
                    required
                  />
                </div>

                <div className="formField">
                  <label htmlFor="claim-email">
                    Email used for submission *
                  </label>

                  <input
                    id="claim-email"
                    type="email"
                    value={
                      email
                    }
                    onChange={(
                      event
                    ) =>
                      setEmail(
                        event.target.value
                      )
                    }
                    placeholder="rights@example.com"
                    autoComplete="email"
                    required
                  />
                </div>
              </div>

              {error ? (
                <div
                  role="alert"
                  style={{
                    marginTop:
                      14,

                    padding:
                      "12px 14px",

                    border:
                      "1px solid #FECACA",

                    borderRadius:
                      8,

                    background:
                      "#FEF2F2",

                    color:
                      "#991B1B",

                    fontSize:
                      13,

                    lineHeight:
                      "20px",
                  }}
                >
                  {
                    error
                  }
                </div>
              ) : null}

              <div
                style={{
                  display:
                    "flex",

                  justifyContent:
                    "flex-end",

                  marginTop:
                    18,
                }}
              >
                <button
                  type="submit"
                  className="primaryButton"
                >
                  Check status
                </button>
              </div>
            </form>

            <div
              style={{
                marginTop:
                  18,

                paddingTop:
                  14,

                borderTop:
                  "1px solid #E2E8F0",

                color:
                  "#64748B",

                fontSize:
                  12,

                lineHeight:
                  "19px",
              }}
            >
              Test records:
              {" "}
              <strong>
                CR-DEMO-0001
              </strong>
              {" / "}
              claimant@example.com
              {" · "}
              <strong>
                CR-DEMO-0002
              </strong>
              {" / "}
              rights@example.com
            </div>
          </section>

          <div
            style={{
              height:
                16,
            }}
          />

          <SignalContact />
        </>
      ) : (
        <>
          <section className="contentCard">
            <div
              style={{
                display:
                  "flex",

                alignItems:
                  "flex-start",

                justifyContent:
                  "space-between",

                gap:
                  20,

                flexWrap:
                  "wrap",
              }}
            >
              <div>
                <div
                  style={{
                    color:
                      "#64748B",

                    fontSize:
                      12,

                    lineHeight:
                      "18px",
                  }}
                >
                  Claim reference
                </div>

                <h2
                  style={{
                    margin:
                      "3px 0 0",

                    fontSize:
                      22,

                    lineHeight:
                      "30px",
                  }}
                >
                  {
                    claim.reference
                  }
                </h2>
              </div>

              <div
                style={{
                  padding:
                    "7px 11px",

                  borderRadius:
                    999,

                  background:
                    claim.status ===
                    "Resolved"
                      ? "#F0FDF4"
                      : "#EEF4FF",

                  color:
                    claim.status ===
                    "Resolved"
                      ? "#15803D"
                      : "#416ECF",

                  fontSize:
                    12,

                  lineHeight:
                    "18px",

                  fontWeight:
                    700,
                }}
              >
                {
                  claim.status
                }
              </div>
            </div>

            <div
              style={{
                display:
                  "flex",

                gap:
                  24,

                marginTop:
                  18,

                flexWrap:
                  "wrap",
              }}
            >
              <div>
                <div
                  style={{
                    color:
                      "#64748B",

                    fontSize:
                      12,
                  }}
                >
                  Request type
                </div>

                <strong
                  style={{
                    display:
                      "block",

                    marginTop:
                      3,

                    fontSize:
                      14,
                  }}
                >
                  {claim.kind ===
                  "bulk"
                    ? "Bulk copyright request"
                    : "Single copyright claim"}
                </strong>
              </div>

              <div>
                <div
                  style={{
                    color:
                      "#64748B",

                    fontSize:
                      12,
                  }}
                >
                  Affected content
                </div>

                <strong
                  style={{
                    display:
                      "block",

                    marginTop:
                      3,

                    fontSize:
                      14,
                  }}
                >
                  {
                    claim.affectedCount
                  }
                  {" "}
                  {claim.affectedCount ===
                  1
                    ? "item"
                    : "items"}
                </strong>
              </div>
            </div>

            <div
              style={{
                marginTop:
                  18,
              }}
            >
              <button
                type="button"
                className="secondaryButton"
                onClick={
                  resetLookup
                }
              >
                Check another claim
              </button>
            </div>
          </section>

          <section className="contentCard">
            <h2 className="sectionTitle">
              Case progress
            </h2>

            <div
              style={{
                marginTop:
                  14,
              }}
            >
              {claim.timeline.map(
                (
                  entry,
                  index
                ) => {
                  const colors =
                    timelineColors(
                      entry.state
                    );

                  return (
                    <div
                      key={
                        entry.label
                      }
                      style={{
                        display:
                          "grid",

                        gridTemplateColumns:
                          "34px minmax(120px, 170px) 1fr",

                        gap:
                          12,

                        alignItems:
                          "center",

                        padding:
                          "12px 0",

                        borderBottom:
                          index ===
                          claim.timeline.length -
                            1
                            ? "0"
                            : "1px solid #E2E8F0",
                      }}
                    >
                      <span
                        style={{
                          display:
                            "grid",

                          width:
                            26,

                          height:
                            26,

                          placeItems:
                            "center",

                          borderRadius:
                            999,

                          background:
                            colors.background,

                          color:
                            colors.color,

                          fontSize:
                            12,

                          fontWeight:
                            700,
                        }}
                      >
                        {timelineMark(
                          entry.state
                        )}
                      </span>

                      <strong
                        style={{
                          fontSize:
                            13,

                          lineHeight:
                            "19px",
                        }}
                      >
                        {
                          entry.label
                        }
                      </strong>

                      <span
                        style={{
                          color:
                            "#64748B",

                          fontSize:
                            13,

                          lineHeight:
                            "20px",
                        }}
                      >
                        {
                          entry.detail
                        }
                      </span>
                    </div>
                  );
                }
              )}
            </div>
          </section>

          {claim.kind ===
          "single" ? (
            <section className="contentCard">
              <h2 className="sectionTitle">
                Content outcome
              </h2>

              <div
                style={{
                  display:
                    "grid",

                  gridTemplateColumns:
                    "repeat(auto-fit, minmax(200px, 1fr))",

                  gap:
                    12,

                  marginTop:
                    16,
                }}
              >
                <div
                  style={{
                    padding:
                      16,

                    border:
                      "1px solid #E2E8F0",

                    borderRadius:
                      8,
                  }}
                >
                  <div
                    style={{
                      color:
                        "#64748B",

                      fontSize:
                        12,
                    }}
                  >
                    Removed or not
                  </div>

                  <strong
                    style={{
                      display:
                        "block",

                      marginTop:
                        5,

                      color:
                        claim.outcome ===
                        "Removed"
                          ? "#15803D"
                          : "#0F172A",

                      fontSize:
                        18,
                    }}
                  >
                    {
                      claim.outcome
                    }
                  </strong>
                </div>

                <div
                  style={{
                    padding:
                      16,

                    border:
                      "1px solid #E2E8F0",

                    borderRadius:
                      8,
                  }}
                >
                  <div
                    style={{
                      color:
                        "#64748B",

                      fontSize:
                        12,
                    }}
                  >
                    Re-import protection
                  </div>

                  <strong
                    style={{
                      display:
                        "block",

                      marginTop:
                        5,

                      fontSize:
                        18,
                    }}
                  >
                    {
                      claim.reimportProtection
                    }
                  </strong>
                </div>
              </div>
            </section>
          ) : null}

          {claim.kind ===
            "bulk" &&
          bulkSummary ? (
            <section className="contentCard">
              <h2 className="sectionTitle">
                Bulk outcome
              </h2>

              <div
                style={{
                  display:
                    "grid",

                  gridTemplateColumns:
                    "repeat(auto-fit, minmax(145px, 1fr))",

                  gap:
                    10,

                  marginTop:
                    16,
                }}
              >
                {[
                  {
                    label:
                      "Removed",

                    value:
                      bulkSummary.removed,
                  },
                  {
                    label:
                      "Removed + blocked",

                    value:
                      bulkSummary.blocked,
                  },
                  {
                    label:
                      "Under review",

                    value:
                      bulkSummary.underReview,
                  },
                  {
                    label:
                      "Information required",

                    value:
                      bulkSummary
                        .informationRequired,
                  },
                  {
                    label:
                      "No action",

                    value:
                      bulkSummary.noAction,
                  },
                ].map(
                  (
                    entry
                  ) => (
                    <div
                      key={
                        entry.label
                      }
                      style={{
                        padding:
                          14,

                        border:
                          "1px solid #E2E8F0",

                        borderRadius:
                          8,
                      }}
                    >
                      <strong
                        style={{
                          display:
                            "block",

                          fontSize:
                            20,

                          lineHeight:
                            "26px",
                        }}
                      >
                        {
                          entry.value
                        }
                      </strong>

                      <span
                        style={{
                          display:
                            "block",

                          marginTop:
                            3,

                          color:
                            "#64748B",

                          fontSize:
                            12,

                          lineHeight:
                            "18px",
                        }}
                      >
                        {
                          entry.label
                        }
                      </span>
                    </div>
                  )
                )}
              </div>
            </section>
          ) : null}

          {claim.kind ===
            "bulk" &&
          bulkItems.length >
            0 ? (
            <section className="contentCard">
              <h2 className="sectionTitle">
                Affected items
              </h2>

              <div
                style={{
                  marginTop:
                    14,

                  border:
                    "1px solid #E2E8F0",

                  borderRadius:
                    8,

                  overflowX:
                    "auto",
                }}
              >
                <div
                  style={{
                    minWidth:
                      620,
                  }}
                >
                  <div
                    style={{
                      display:
                        "grid",

                      gridTemplateColumns:
                        "minmax(120px, 0.8fr) minmax(150px, 1fr) minmax(220px, 1.5fr)",

                      gap:
                        12,

                      padding:
                        "10px 14px",

                      background:
                        "#F8FAFC",

                      color:
                        "#64748B",

                      fontSize:
                        11,

                      lineHeight:
                        "17px",

                      fontWeight:
                        700,

                      textTransform:
                        "uppercase",
                    }}
                  >
                    <span>
                      Content
                    </span>

                    <span>
                      Status
                    </span>

                    <span>
                      Outcome
                    </span>
                  </div>

                  {bulkItems.map(
                    (
                      item,
                      index
                    ) => (
                      <div
                        key={
                          item.contentId
                        }
                        style={{
                          display:
                            "grid",

                          gridTemplateColumns:
                            "minmax(120px, 0.8fr) minmax(150px, 1fr) minmax(220px, 1.5fr)",

                          gap:
                            12,

                          padding:
                            "12px 14px",

                          borderBottom:
                            index ===
                            bulkItems.length -
                              1
                              ? "0"
                              : "1px solid #E2E8F0",
                        }}
                      >
                        <strong
                          style={{
                            fontSize:
                              13,
                          }}
                        >
                          {
                            item.contentId
                          }
                        </strong>

                        <span
                          style={{
                            color:
                              "#475569",

                            fontSize:
                              13,
                          }}
                        >
                          {
                            item.status
                          }
                        </span>

                        <span
                          style={{
                            color:
                              item.outcome.startsWith(
                                "Removed"
                              )
                                ? "#15803D"
                                : "#64748B",

                            fontSize:
                              13,

                            fontWeight:
                              item.outcome.startsWith(
                                "Removed"
                              )
                                ? 650
                                : 400,
                          }}
                        >
                          {
                            item.outcome
                          }
                        </span>
                      </div>
                    )
                  )}
                </div>
              </div>
            </section>
          ) : null}

          <SignalContact />

          <div
            style={{
              padding:
                "8px 2px 2px",

              color:
                "#64748B",

              fontSize:
                12,

              lineHeight:
                "19px",
            }}
          >
            Development environment · Claim
            information is temporary until backend
            and database integration.
          </div>
        </>
      )}
    </>
  );
}