"use client";

import {
  FormEvent,
  useState,
} from "react";

import SignalContact from "@/components/SignalContact";

import {
  lookupPublicCopyrightStatus,
  PublicCopyrightClaimError,
} from "@/features/copyright/public-copyright.service";

import type {
  PublicCopyrightStatus,
} from "@/features/copyright/public-copyright.types";

type TimelineState =
  | "complete"
  | "current"
  | "pending";

interface TimelineEntry {
  label: string;

  detail: string;

  state:
    TimelineState;
}

function titleCaseToken(
  value: string
): string {
  return value
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

function requestTypeLabel(
  requestType: string
): string {
  if (
    requestType ===
    "copyright_strike"
  ) {
    return "Single copyright claim";
  }

  return titleCaseToken(
    requestType
  );
}

function statusLabel(
  status: string
): string {
  switch (status) {
    case "needs_action":
      return "Awaiting review";

    case "under_review":
      return "Under review";

    case "information_required":
      return "Information required";

    case "resolved":
      return "Resolved";

    case "dismissed":
      return "No action recorded";

    default:
      return titleCaseToken(
        status
      );
  }
}

function verificationLabel(
  status: string
): string {
  switch (status) {
    case "pending":
      return "Pending verification";

    case "verified":
      return "Verified";

    case "rejected":
      return "Rejected";

    default:
      return titleCaseToken(
        status
      );
  }
}

function actionLabel(
  action:
    string |
    null
): string {
  if (!action) {
    return "No final action recorded yet";
  }

  return titleCaseToken(
    action
  );
}

function formatDateTime(
  value:
    string |
    null
): string {
  if (!value) {
    return "Not yet recorded";
  }

  const date =
    new Date(
      value
    );

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "Recorded";
  }

  return new Intl.DateTimeFormat(
    "en",
    {
      dateStyle:
        "medium",

      timeStyle:
        "short",
    }
  ).format(
    date
  );
}

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
  return (
    status === "resolved" ||
    status === "dismissed"
  )
    ? "statusBadge statusBadgeResolved"
    : "statusBadge statusBadgeProgress";
}

function buildTimeline(
  claim:
    PublicCopyrightStatus
): TimelineEntry[] {
  const isResolved =
    claim.status === "resolved" ||
    claim.status === "dismissed" ||
    claim.resolvedAt !== null ||
    claim.actionTaken !== null;

  const isUnderReview =
    claim.status === "under_review" ||
    claim.status === "information_required" ||
    isResolved;

  return [
    {
      label:
        "Submitted",

      detail:
        `Copyright request received on ${formatDateTime(
          claim.receivedAt
        )}.`,

      state:
        "complete",
    },
    {
      label:
        "Verification",

      detail:
        verificationLabel(
          claim.verificationStatus
        ),

      state:
        claim.verificationStatus === "pending"
          ? "current"
          : "complete",
    },
    {
      label:
        "Review",

      detail:
        isUnderReview
          ? "Poster is reviewing the claim, affected content, and supporting information."
          : "Waiting for Poster review.",

      state:
        isUnderReview
          ? "complete"
          : "pending",
    },
    {
      label:
        "Outcome",

      detail:
        actionLabel(
          claim.actionTaken
        ),

      state:
        isResolved
          ? "complete"
          : "pending",
    },
  ];
}

function normalizeReferenceInput(
  value: string
): string {
  return value
    .trim()
    .toUpperCase();
}

function normalizeEmailInput(
  value: string
): string {
  return value
    .trim()
    .toLowerCase();
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
    isLoading,
    setIsLoading,
  ] =
    useState(false);

  const [
    claim,
    setClaim,
  ] =
    useState<PublicCopyrightStatus | null>(
      null
    );

  const checkStatus = async (
    event:
      FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (
      isLoading
    ) {
      return;
    }

    const normalizedReference =
      normalizeReferenceInput(
        reference
      );

    const normalizedEmail =
      normalizeEmailInput(
        email
      );

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

    setError(
      ""
    );

    setIsLoading(
      true
    );

    try {
      const status =
        await lookupPublicCopyrightStatus({
          reference:
            normalizedReference,

          email:
            normalizedEmail,
        });

      setClaim(
        status
      );
    } catch (
      caughtError
    ) {
      setClaim(
        null
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
          "No matching copyright request was found with those details."
        );
      }
    } finally {
      setIsLoading(
        false
      );
    }
  };

  const resetLookup = () => {
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

  const timeline =
    claim
      ? buildTimeline(
          claim
        )
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
              ? "Review the current case status, review progress, and recorded outcome for the affected Poster content item."
              : "Enter the claim reference and email used during submission. No Poster account, OTP, or separate verification screen is required."}
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
                      placeholder="CR-900001"
                      autoComplete="off"
                      required
                    />

                    <span className="fieldHelp">
                      Example format: CR-900001
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
                  disabled={isLoading}
                >
                  {isLoading
                    ? "Checking..."
                    : "Check status"}
                </button>
              </form>
            </div>
          </section>

          <section className="pageSection">
            <div className="sectionHeading">
              <div>
                <div className="sectionEyebrow">
                  What you can see
                </div>

                <h2 className="sectionTitle sectionTitleLarge">
                  Safe status and content outcome details
                </h2>
              </div>

              <p className="sectionIntro">
                Poster returns only public case status,
                affected-content summary, verification
                state, review outcome, and re-import
                protection state. Claimant details,
                internal IDs, evidence internals, and
                Admin audit fields stay private.
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
                    See whether the request is awaiting
                    review, under review, requires more
                    information, or has been resolved.
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
                    submission through verification,
                    review, and final outcome.
                  </p>
                </div>
              </div>

              <div className="processRow">
                <span className="processNumber">
                  03
                </span>

                <div>
                  <h3 className="processTitle">
                    Content outcome
                  </h3>

                  <p className="processDescription">
                    View the affected Poster content
                    summary and whether any action or
                    re-import protection has been
                    recorded.
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
                {statusLabel(
                  claim.status
                )}
              </div>
            </div>

            <dl className="statusCaseDetails">
              <div>
                <dt>
                  Request type
                </dt>

                <dd>
                  {requestTypeLabel(
                    claim.requestType
                  )}
                </dd>
              </div>

              <div>
                <dt>
                  Affected content
                </dt>

                <dd>
                  {claim.affectedContent.publicId}
                </dd>
              </div>

              <div>
                <dt>
                  Access check
                </dt>

                <dd>
                  Verified with supplied email
                </dd>
              </div>

              <div>
                <dt>
                  Received
                </dt>

                <dd>
                  {formatDateTime(
                    claim.receivedAt
                  )}
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
                processing state returned by Poster
                Backend.
              </p>
            </div>

            <div className="statusTimeline">
              {timeline.map(
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

          <section className="pageSection">
            <div className="sectionHeading">
              <div>
                <div className="sectionEyebrow">
                  Affected content
                </div>

                <h2 className="sectionTitle sectionTitleLarge">
                  Content summary
                </h2>
              </div>

              <p className="sectionIntro">
                This is the public content summary linked
                to the copyright case.
              </p>
            </div>

            <div className="statusOutcomeGrid">
              <div className="statusOutcomeItem">
                <span>
                  Poster Content ID
                </span>

                <strong>
                  {claim.affectedContent.publicId}
                </strong>

                <p>
                  {claim.affectedContent.title}
                </p>
              </div>

              <div className="statusOutcomeItem">
                <span>
                  Publisher
                </span>

                <strong>
                  {claim.affectedContent.publisherName}
                </strong>

                <p>
                  Original URL: {claim.affectedContent.originalUrl}
                </p>
              </div>

              <div className="statusOutcomeItem">
                <span>
                  Content state
                </span>

                <strong>
                  {titleCaseToken(
                    claim.affectedContent.status
                  )}
                </strong>

                <p>
                  Current public discovery state for the
                  affected content record.
                </p>
              </div>
            </div>
          </section>

          <section className="pageSection">
            <div className="sectionHeading">
              <div>
                <div className="sectionEyebrow">
                  Recorded outcome
                </div>

                <h2 className="sectionTitle sectionTitleLarge">
                  Review result
                </h2>
              </div>

              <p className="sectionIntro">
                Outcomes are recorded through the
                Backend-managed Admin Copyright workflow.
              </p>
            </div>

            <div className="statusOutcomeGrid">
              <div className="statusOutcomeItem">
                <span>
                  Action taken
                </span>

                <strong
                  className={
                    claim.actionTaken
                      ? "statusOutcomeSuccess"
                      : undefined
                  }
                >
                  {actionLabel(
                    claim.actionTaken
                  )}
                </strong>

                <p>
                  {claim.resolvedAt
                    ? `Resolved at ${formatDateTime(
                        claim.resolvedAt
                      )}.`
                    : "The case is still awaiting a final recorded outcome."}
                </p>
              </div>

              <div className="statusOutcomeItem">
                <span>
                  Re-import protection
                </span>

                <strong>
                  {claim.preventReimport
                    ? "Enabled"
                    : "Not enabled"}
                </strong>

                <p>
                  Re-import protection is enabled only
                  when Poster records a prevention action
                  for the affected content.
                </p>
              </div>

              <div className="statusOutcomeItem">
                <span>
                  Verification
                </span>

                <strong>
                  {verificationLabel(
                    claim.verificationStatus
                  )}
                </strong>

                <p>
                  Claimant and content verification state
                  for this copyright case.
                </p>
              </div>
            </div>
          </section>

          <SignalContact />
        </>
      )}
    </>
  );
}