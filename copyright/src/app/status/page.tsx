"use client";

import {
  FormEvent,
  useState,
} from "react";

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

interface DemoClaim {
  reference: string;
  email: string;
  kind: "single" | "bulk";
  status: string;
  affectedCount: number;
  timeline: TimelineEntry[];
  outcome?: string;
  reimportProtection?: string;
  summary?: {
    removed: number;
    blocked: number;
    underReview: number;
    informationRequired: number;
    notMatched: number;
  };
  items?: ClaimItem[];
}

const DEMO_CLAIMS: DemoClaim[] = [
  {
    reference: "CR-DEMO-0001",
    email: "claimant@example.com",
    kind: "single",
    status: "Resolved",
    affectedCount: 1,

    timeline: [
      {
        label: "Submitted",
        detail: "Request received",
        state: "complete",
      },
      {
        label: "Verification",
        detail:
          "Claimant and supporting information checked",
        state: "complete",
      },
      {
        label: "Under review",
        detail: "Affected content reviewed",
        state: "complete",
      },
      {
        label: "Action taken",
        detail: "Content action completed",
        state: "complete",
      },
      {
        label: "Resolved",
        detail: "Final outcome recorded",
        state: "complete",
      },
    ],

    outcome: "Content removed",
    reimportProtection: "Enabled",
  },

  {
    reference: "CR-DEMO-0002",
    email: "rights@example.com",
    kind: "bulk",
    status: "Partially resolved",
    affectedCount: 5,

    timeline: [
      {
        label: "Submitted",
        detail: "Bulk request received",
        state: "complete",
      },
      {
        label: "Verification",
        detail:
          "Claim and affected records checked",
        state: "complete",
      },
      {
        label: "Under review",
        detail:
          "Remaining affected records are being reviewed",
        state: "current",
      },
      {
        label: "Resolved",
        detail:
          "Final outcome pending for remaining records",
        state: "pending",
      },
    ],

    summary: {
      removed: 2,
      blocked: 1,
      underReview: 1,
      informationRequired: 1,
      notMatched: 0,
    },

    items: [
      {
        contentId: "CNT-1001",
        status: "Resolved",
        outcome: "Removed",
      },
      {
        contentId: "CNT-1002",
        status: "Resolved",
        outcome: "Removed",
      },
      {
        contentId: "CNT-1003",
        status: "Resolved",
        outcome: "Removed + re-import blocked",
      },
      {
        contentId: "CNT-1004",
        status: "Under review",
        outcome: "—",
      },
      {
        contentId: "CNT-1005",
        status: "Information required",
        outcome: "Awaiting additional information",
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

function timelineMarkStyle(
  state: TimelineState
) {
  switch (state) {
    case "complete":
      return {
        background: "#F0FDF4",
        color: "#15803D",
      };

    case "current":
      return {
        background: "#EEF4FF",
        color: "#416ECF",
      };

    case "pending":
      return {
        background: "#F1F5F9",
        color: "#64748B",
      };
  }
}

export default function CopyrightStatusPage() {
  const [
    reference,
    setReference,
  ] = useState("");

  const [
    email,
    setEmail,
  ] = useState("");

  const [
    error,
    setError,
  ] = useState("");

  const [
    claim,
    setClaim,
  ] =
    useState<DemoClaim | null>(
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
      setClaim(null);

      setError(
        "Enter your claim reference and the email used for submission."
      );

      return;
    }

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
      setClaim(null);

      /*
       * Keep the response generic.
       * Do not reveal whether the reference
       * or email was the mismatching value.
       */
      setError(
        "We could not verify a matching copyright request with those details."
      );

      return;
    }

    setError("");

    setClaim(
      matchedClaim
    );
  };

  const resetLookup =
    () => {
      setClaim(null);

      setError("");
    };

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
            Track a submitted copyright request
            without creating an account.
          </p>
        </div>
      </header>

      {!claim ? (
        <section className="contentCard">
          <form
            onSubmit={
              checkStatus
            }
          >
            <div
              className="formGrid"
            >
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
                style={{
                  marginTop: 14,
                  padding: "12px 14px",
                  border: "1px solid #FECACA",
                  borderRadius: 8,
                  background: "#FEF2F2",
                  color: "#991B1B",
                  fontSize: 13,
                  lineHeight: "20px",
                }}
                role="alert"
              >
                {error}
              </div>
            ) : null}

            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                marginTop: 18,
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
              marginTop: 18,
              paddingTop: 14,
              borderTop: "1px solid #E2E8F0",
              color: "#64748B",
              fontSize: 12,
              lineHeight: "19px",
            }}
          >
            Frontend test records:
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
      ) : (
        <>
          <section className="contentCard">
            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
                justifyContent: "space-between",
                gap: 20,
                flexWrap: "wrap",
              }}
            >
              <div>
                <div
                  style={{
                    color: "#64748B",
                    fontSize: 12,
                    lineHeight: "18px",
                  }}
                >
                  Claim reference
                </div>

                <h2
                  style={{
                    margin: "3px 0 0",
                    fontSize: 22,
                    lineHeight: "30px",
                  }}
                >
                  {claim.reference}
                </h2>
              </div>

              <div
                style={{
                  padding: "7px 11px",
                  borderRadius: 999,
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
                  fontSize: 12,
                  lineHeight: "18px",
                  fontWeight: 700,
                }}
              >
                {claim.status}
              </div>
            </div>

            <div
              style={{
                display: "flex",
                gap: 24,
                marginTop: 18,
                flexWrap: "wrap",
              }}
            >
              <div>
                <div
                  style={{
                    color: "#64748B",
                    fontSize: 12,
                  }}
                >
                  Request type
                </div>

                <strong
                  style={{
                    display: "block",
                    marginTop: 3,
                    fontSize: 14,
                  }}
                >
                  {claim.kind ===
                  "bulk"
                    ? "Bulk copyright request"
                    : "Copyright claim"}
                </strong>
              </div>

              <div>
                <div
                  style={{
                    color: "#64748B",
                    fontSize: 12,
                  }}
                >
                  Affected content
                </div>

                <strong
                  style={{
                    display: "block",
                    marginTop: 3,
                    fontSize: 14,
                  }}
                >
                  {claim.affectedCount}
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
                marginTop: 18,
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
              Status
            </h2>

            <div
              style={{
                marginTop: 14,
              }}
            >
              {claim.timeline.map(
                (
                  entry,
                  index
                ) => {
                  const markerStyle =
                    timelineMarkStyle(
                      entry.state
                    );

                  return (
                    <div
                      key={
                        entry.label
                      }
                      style={{
                        display: "grid",
                        gridTemplateColumns:
                          "34px minmax(120px, 170px) 1fr",
                        gap: 12,
                        alignItems: "center",
                        padding: "12px 0",
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
                          display: "grid",
                          width: 26,
                          height: 26,
                          placeItems: "center",
                          borderRadius: 999,
                          background:
                            markerStyle.background,
                          color:
                            markerStyle.color,
                          fontSize: 12,
                          fontWeight: 700,
                        }}
                      >
                        {timelineMark(
                          entry.state
                        )}
                      </span>

                      <strong
                        style={{
                          fontSize: 13,
                          lineHeight: "19px",
                        }}
                      >
                        {entry.label}
                      </strong>

                      <span
                        style={{
                          color: "#64748B",
                          fontSize: 13,
                          lineHeight: "20px",
                        }}
                      >
                        {entry.detail}
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
                Outcome
              </h2>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "repeat(auto-fit, minmax(200px, 1fr))",
                  gap: 12,
                  marginTop: 16,
                }}
              >
                <div
                  style={{
                    padding: 16,
                    border: "1px solid #E2E8F0",
                    borderRadius: 8,
                  }}
                >
                  <div
                    style={{
                      color: "#64748B",
                      fontSize: 12,
                    }}
                  >
                    Decision
                  </div>

                  <strong
                    style={{
                      display: "block",
                      marginTop: 5,
                      fontSize: 15,
                    }}
                  >
                    {claim.outcome}
                  </strong>
                </div>

                <div
                  style={{
                    padding: 16,
                    border: "1px solid #E2E8F0",
                    borderRadius: 8,
                  }}
                >
                  <div
                    style={{
                      color: "#64748B",
                      fontSize: 12,
                    }}
                  >
                    Re-import protection
                  </div>

                  <strong
                    style={{
                      display: "block",
                      marginTop: 5,
                      fontSize: 15,
                    }}
                  >
                    {claim.reimportProtection}
                  </strong>
                </div>
              </div>
            </section>
          ) : null}

          {claim.kind ===
            "bulk" &&
          claim.summary &&
          claim.items ? (
            <>
              <section className="contentCard">
                <h2 className="sectionTitle">
                  Bulk outcome
                </h2>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      "repeat(auto-fit, minmax(145px, 1fr))",
                    gap: 10,
                    marginTop: 16,
                  }}
                >
                  {[
                    [
                      "Removed",
                      claim.summary.removed,
                    ],
                    [
                      "Removed + blocked",
                      claim.summary.blocked,
                    ],
                    [
                      "Under review",
                      claim.summary.underReview,
                    ],
                    [
                      "Information required",
                      claim.summary.informationRequired,
                    ],
                    [
                      "Not matched",
                      claim.summary.notMatched,
                    ],
                  ].map(
                    ([
                      label,
                      value,
                    ]) => (
                      <div
                        key={
                          label
                        }
                        style={{
                          padding: 14,
                          border:
                            "1px solid #E2E8F0",
                          borderRadius: 8,
                        }}
                      >
                        <strong
                          style={{
                            display: "block",
                            fontSize: 20,
                            lineHeight: "26px",
                          }}
                        >
                          {value}
                        </strong>

                        <span
                          style={{
                            display: "block",
                            marginTop: 3,
                            color: "#64748B",
                            fontSize: 12,
                            lineHeight: "18px",
                          }}
                        >
                          {label}
                        </span>
                      </div>
                    )
                  )}
                </div>
              </section>

              <section className="contentCard">
                <h2 className="sectionTitle">
                  Affected items
                </h2>

                <div
                  style={{
                    marginTop: 14,
                    border:
                      "1px solid #E2E8F0",
                    borderRadius: 8,
                    overflow: "hidden",
                  }}
                >
                  {claim.items.map(
                    (
                      item,
                      index
                    ) => (
                      <div
                        key={
                          item.contentId
                        }
                        style={{
                          display: "grid",
                          gridTemplateColumns:
                            "minmax(110px, 0.8fr) minmax(130px, 1fr) minmax(180px, 1.5fr)",
                          gap: 12,
                          padding: "12px 14px",
                          borderBottom:
                            index ===
                            claim.items!.length -
                              1
                              ? "0"
                              : "1px solid #E2E8F0",
                        }}
                      >
                        <strong
                          style={{
                            fontSize: 13,
                          }}
                        >
                          {item.contentId}
                        </strong>

                        <span
                          style={{
                            color: "#475569",
                            fontSize: 13,
                          }}
                        >
                          {item.status}
                        </span>

                        <span
                          style={{
                            color: "#64748B",
                            fontSize: 13,
                          }}
                        >
                          {item.outcome}
                        </span>
                      </div>
                    )
                  )}
                </div>
              </section>
            </>
          ) : null}

          <div
            style={{
              padding: "4px 2px",
              color: "#64748B",
              fontSize: 12,
              lineHeight: "19px",
            }}
          >
            This is frontend demonstration data.
            Production claim access will use
            backend verification and secure email
            confirmation before displaying a case.
          </div>
        </>
      )}
    </>
  );
}