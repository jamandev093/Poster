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
        detail: "Copyright request received",
        state: "complete",
      },
      {
        label: "Under review",
        detail: "Claim and affected content reviewed",
        state: "complete",
      },
      {
        label: "Action taken",
        detail: "Content removal completed",
        state: "complete",
      },
      {
        label: "Resolved",
        detail: "Final outcome recorded",
        state: "complete",
      },
    ],
    outcome: "Removed",
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
        detail: "Bulk copyright request received",
        state: "complete",
      },
      {
        label: "Under review",
        detail: "Affected items are being reviewed",
        state: "current",
      },
      {
        label: "Resolved",
        detail: "Final outcomes pending for remaining items",
        state: "pending",
      },
    ],
    summary: {
      removed: 2,
      blocked: 1,
      underReview: 1,
      informationRequired: 1,
      noAction: 0,
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
        outcome: "Review in progress",
      },
      {
        contentId: "CNT-1005",
        status: "Information required",
        outcome: "Waiting for claimant information",
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

function timelineClassName(
  state: TimelineState
): string {
  switch (state) {
    case "complete":
      return "statusTimelineMarkComplete";

    case "current":
      return "statusTimelineMarkCurrent";

    case "pending":
      return "statusTimelineMarkPending";
  }
}

function statusBadgeClassName(
  status: string
): string {
  return status === "Resolved"
    ? "statusBadge statusBadgeResolved"
    : "statusBadge statusBadgeProgress";
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
  ] = useState<DemoClaim | null>(
    null
  );

  const checkStatus = (
    event: FormEvent<HTMLFormElement>
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

    /*
     * The production backend will verify the
     * reference and email pair, apply request
     * limits, and return only the matching case.
     *
     * This workflow does not require a separate
     * account, OTP, or verification page.
     */
    const matchedClaim =
      DEMO_CLAIMS.find(
        (candidate) =>
          candidate.reference ===
            normalizedReference &&
          candidate.email.toLowerCase() ===
            normalizedEmail
      );

    if (!matchedClaim) {
      setClaim(null);

      /*
       * Keep this response generic so the page
       * does not reveal whether the claim
       * reference or email was incorrect.
       */
      setError(
        "No matching copyright request was found with those details."
      );

      return;
    }

    setError("");
    setClaim(matchedClaim);
  };

  const resetLookup = () => {
    setClaim(null);
    setReference("");
    setEmail("");
    setError("");
  };

  const bulkSummary =
    claim?.kind === "bulk"
      ? claim.summary
      : undefined;

  const bulkItems =
    claim?.kind === "bulk"
      ? claim.items ?? []
      : [];

  return (
    <>
      <header className="pageHeader pageHeaderLarge">
        <div>
          <div className="pageEyebrow">
            Copyright request status
          </div>

          <h1 className="pageTitle pageTitleLarge">
            {claim
              ? "Your copyright case"
              : "Check your request status"}
          </h1>

          <p className="pageDescription pageDescriptionLarge">
            {claim
              ? "Review the current case status, progress, and recorded outcome for each affected Poster content item."
              : "Enter the claim reference and email used during submission. No Poster account or separate verification screen is required."}
          </p>
        </div>
      </header>

      {!claim ? (
        <>
          <section className="statusLookupSection">
            <div className="statusLookupIntroduction">
              <div className="sectionEyebrow">
                Secure case lookup
              </div>

              <h2 className="sectionTitle sectionTitleLarge">
                Find a submitted copyright request
              </h2>

              <p className="sectionDescription">
                Your claim reference appears on the
                submission confirmation. Use the same
                email address supplied with the request.
              </p>

              <div className="statusPrivacyNotice">
                <strong>
                  Privacy protection
                </strong>

                <span>
                  Incorrect details receive a generic
                  response so the system does not reveal
                  whether a reference or email exists.
                </span>
              </div>
            </div>

            <div className="statusLookupPanel">
              <form
                onSubmit={checkStatus}
                className="statusLookupForm"
              >
                <div className="formGridSingle">
                  <div className="formField">
                    <label htmlFor="claim-reference">
                      Claim reference *
                    </label>

                    <input
                      id="claim-reference"
                      value={reference}
                      onChange={(event) =>
                        setReference(
                          event.target.value
                        )
                      }
                      placeholder="CR-..."
                      autoComplete="off"
                      required
                    />

                    <span className="fieldHelp">
                      Example format: CR-2026-0001
                    </span>
                  </div>

                  <div className="formField">
                    <label htmlFor="claim-email">
                      Email used for submission *
                    </label>

                    <input
                      id="claim-email"
                      type="email"
                      value={email}
                      onChange={(event) =>
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
                    className="statusError"
                    role="alert"
                  >
                    {error}
                  </div>
                ) : null}

                <button
                  type="submit"
                  className="primaryButton statusSubmitButton"
                >
                  Check status
                </button>
              </form>

              <div className="statusDemoRecords">
                <div className="statusDemoLabel">
                  Frontend demonstration records
                </div>

                <div className="statusDemoRecord">
                  <strong>
                    CR-DEMO-0001
                  </strong>

                  <span>
                    claimant@example.com
                  </span>
                </div>

                <div className="statusDemoRecord">
                  <strong>
                    CR-DEMO-0002
                  </strong>

                  <span>
                    rights@example.com
                  </span>
                </div>
              </div>
            </div>
          </section>

          <section className="pageSection">
            <div className="sectionHeading">
              <div>
                <div className="sectionEyebrow">
                  What you can see
                </div>

                <h2 className="sectionTitle sectionTitleLarge">
                  Clear status and item-level outcomes
                </h2>
              </div>

              <p className="sectionIntro">
                A request can remain under review,
                require more information, be resolved
                with removal, include re-import
                protection, or receive different
                outcomes for separate bulk-request
                items.
              </p>
            </div>

            <div className="processList">
              <div className="processRow">
                <span className="processNumber">
                  01
                </span>

                <div>
                  <h3 className="processTitle">
                    Overall case status
                  </h3>

                  <p className="processDescription">
                    See whether the request is submitted,
                    under review, partially resolved, or
                    fully resolved.
                  </p>
                </div>
              </div>

              <div className="processRow">
                <span className="processNumber">
                  02
                </span>

                <div>
                  <h3 className="processTitle">
                    Review progress
                  </h3>

                  <p className="processDescription">
                    Follow the recorded stages from
                    submission through review and final
                    action.
                  </p>
                </div>
              </div>

              <div className="processRow">
                <span className="processNumber">
                  03
                </span>

                <div>
                  <h3 className="processTitle">
                    Individual content outcomes
                  </h3>

                  <p className="processDescription">
                    Bulk cases display separate results
                    for every affected Poster content
                    record.
                  </p>
                </div>
              </div>
            </div>
          </section>

          <SignalContact />
        </>
      ) : (
        <>
          <section className="statusCaseSummary">
            <div className="statusCasePrimary">
              <div className="statusCaseLabel">
                Claim reference
              </div>

              <h2 className="statusCaseReference">
                {claim.reference}
              </h2>

              <div
                className={statusBadgeClassName(
                  claim.status
                )}
              >
                {claim.status}
              </div>
            </div>

            <dl className="statusCaseDetails">
              <div>
                <dt>
                  Request type
                </dt>

                <dd>
                  {claim.kind === "bulk"
                    ? "Bulk copyright request"
                    : "Single copyright claim"}
                </dd>
              </div>

              <div>
                <dt>
                  Affected content
                </dt>

                <dd>
                  {claim.affectedCount}{" "}
                  {claim.affectedCount === 1
                    ? "item"
                    : "items"}
                </dd>
              </div>

              <div>
                <dt>
                  Submitted email
                </dt>

                <dd>
                  {claim.email}
                </dd>
              </div>
            </dl>

            <button
              type="button"
              className="secondaryButton statusResetButton"
              onClick={resetLookup}
            >
              Check another claim
            </button>
          </section>

          <section className="pageSection">
            <div className="sectionHeading">
              <div>
                <div className="sectionEyebrow">
                  Case progress
                </div>

                <h2 className="sectionTitle sectionTitleLarge">
                  Review timeline
                </h2>
              </div>

              <p className="sectionIntro">
                The timeline reflects the current
                processing state of this copyright
                request.
              </p>
            </div>

            <div className="statusTimeline">
              {claim.timeline.map(
                (entry) => (
                  <div
                    key={entry.label}
                    className="statusTimelineRow"
                  >
                    <span
                      className={`statusTimelineMark ${timelineClassName(
                        entry.state
                      )}`}
                    >
                      {timelineMark(
                        entry.state
                      )}
                    </span>

                    <div>
                      <strong>
                        {entry.label}
                      </strong>

                      <p>
                        {entry.detail}
                      </p>
                    </div>
                  </div>
                )
              )}
            </div>
          </section>

          {claim.kind === "single" ? (
            <section className="pageSection">
              <div className="sectionHeading">
                <div>
                  <div className="sectionEyebrow">
                    Content decision
                  </div>

                  <h2 className="sectionTitle sectionTitleLarge">
                    Recorded outcome
                  </h2>
                </div>

                <p className="sectionIntro">
                  This result shows the action recorded
                  for the affected Poster content item.
                </p>
              </div>

              <div className="statusOutcomeGrid">
                <div className="statusOutcomeItem">
                  <span>
                    Content outcome
                  </span>

                  <strong className="statusOutcomeSuccess">
                    {claim.outcome}
                  </strong>

                  <p>
                    The affected Poster content reference
                    is no longer available through
                    discovery.
                  </p>
                </div>

                <div className="statusOutcomeItem">
                  <span>
                    Re-import protection
                  </span>

                  <strong>
                    {claim.reimportProtection}
                  </strong>

                  <p>
                    Poster will prevent the removed
                    content record from being
                    automatically imported again.
                  </p>
                </div>
              </div>
            </section>
          ) : null}

          {claim.kind === "bulk" &&
          bulkSummary ? (
            <section className="pageSection">
              <div className="sectionHeading">
                <div>
                  <div className="sectionEyebrow">
                    Bulk request
                  </div>

                  <h2 className="sectionTitle sectionTitleLarge">
                    Outcome summary
                  </h2>
                </div>

                <p className="sectionIntro">
                  A bulk case can contain several
                  different results while remaining
                  partially resolved.
                </p>
              </div>

              <div className="statusMetrics">
                {[
                  {
                    label: "Removed",
                    value: bulkSummary.removed,
                  },
                  {
                    label: "Removed + blocked",
                    value: bulkSummary.blocked,
                  },
                  {
                    label: "Under review",
                    value: bulkSummary.underReview,
                  },
                  {
                    label: "Information required",
                    value:
                      bulkSummary.informationRequired,
                  },
                  {
                    label: "No action",
                    value: bulkSummary.noAction,
                  },
                ].map((entry) => (
                  <div
                    key={entry.label}
                    className="statusMetric"
                  >
                    <strong>
                      {entry.value}
                    </strong>

                    <span>
                      {entry.label}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          ) : null}

          {claim.kind === "bulk" &&
          bulkItems.length > 0 ? (
            <section className="pageSection">
              <div className="sectionHeading">
                <div>
                  <div className="sectionEyebrow">
                    Affected content
                  </div>

                  <h2 className="sectionTitle sectionTitleLarge">
                    Item-level decisions
                  </h2>
                </div>

                <p className="sectionIntro">
                  Every content record keeps its own
                  review status and outcome.
                </p>
              </div>

              <div className="statusTableWrapper">
                <div className="statusTable">
                  <div className="statusTableHeader">
                    <span>
                      Content ID
                    </span>

                    <span>
                      Status
                    </span>

                    <span>
                      Outcome
                    </span>
                  </div>

                  {bulkItems.map(
                    (item) => (
                      <div
                        key={item.contentId}
                        className="statusTableRow"
                      >
                        <strong>
                          {item.contentId}
                        </strong>

                        <span>
                          {item.status}
                        </span>

                        <span
                          className={
                            item.outcome.startsWith(
                              "Removed"
                            )
                              ? "statusTableOutcomeSuccess"
                              : undefined
                          }
                        >
                          {item.outcome}
                        </span>
                      </div>
                    )
                  )}
                </div>
              </div>
            </section>
          ) : null}

          <SignalContact />

          <div className="statusDevelopmentNotice">
            <strong>
              Development environment:
            </strong>{" "}
            demonstration claim information is
            temporary. Backend and database
            integration will later provide secure,
            permanent case records.
          </div>
        </>
      )}
    </>
  );
}