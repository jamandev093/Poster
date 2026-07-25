import Link from "next/link";

interface SubmittedPageProps {
  searchParams: Promise<{
    type?: string;
    count?: string;
  }>;
}

export default async function SubmittedPage({
  searchParams,
}: SubmittedPageProps) {
  const params = await searchParams;

  const isBulk = params.type === "bulk";

  const parsedCount = Number(params.count);

  const count =
    Number.isFinite(parsedCount) && parsedCount > 0
      ? Math.min(Math.floor(parsedCount), 100)
      : 1;

  const itemLabel =
    count === 1
      ? "affected content item"
      : "affected content items";

  return (
    <>
      <header className="pageHeader">
        <div>
          <div className="pageEyebrow">
            Submission complete
          </div>

          <h1 className="pageTitle">
            Your request has been submitted
          </h1>

          <p className="pageDescription">
            Poster has received your copyright request.
            Keep the reference below so you can return
            later and check the case status.
          </p>
        </div>
      </header>

      <section className="contentCard submittedSummary">
        <div className="submittedStatus">
          <span
            className="submittedStatusIcon"
            aria-hidden="true"
          >
            ✓
          </span>

          <div>
            <div className="submittedStatusLabel">
              Request received
            </div>

            <h2 className="submittedStatusTitle">
              {isBulk
                ? "Bulk copyright request"
                : "Single copyright claim"}
            </h2>
          </div>
        </div>

        <dl className="submittedDetails">
          <div>
            <dt>Claim reference</dt>

            <dd>CR-DEMO-0001</dd>
          </div>

          <div>
            <dt>Request type</dt>

            <dd>
              {isBulk
                ? "Bulk removal request"
                : "Single content claim"}
            </dd>
          </div>

          <div>
            <dt>Affected content</dt>

            <dd>
              {count} {itemLabel}
            </dd>
          </div>

          <div>
            <dt>Current status</dt>

            <dd>
              <span className="submittedStatusBadge">
                Submitted
              </span>
            </dd>
          </div>
        </dl>
      </section>

      <section className="contentCard">
        <h2 className="sectionTitle">
          What happens next?
        </h2>

        <p className="sectionDescription">
          Submission does not automatically remove
          content. Poster reviews the claimant
          information, affected Poster records,
          original-source details, and supporting
          evidence before taking an operational action.
        </p>

        <ol className="submittedSteps">
          <li>
            <span>1</span>

            <div>
              <strong>Request received</strong>

              <p>
                Your request and affected content
                references are recorded for review.
              </p>
            </div>
          </li>

          <li>
            <span>2</span>

            <div>
              <strong>Identity and evidence review</strong>

              <p>
                Poster may cross-check claimant details,
                original URLs, source information,
                ownership signals, and supporting
                references.
              </p>
            </div>
          </li>

          <li>
            <span>3</span>

            <div>
              <strong>Outcome recorded</strong>

              <p>
                Each affected item may be removed,
                blocked from re-import, remain under
                review, require more information, or
                receive no action.
              </p>
            </div>
          </li>
        </ol>
      </section>

      <section className="contentCard submittedActionsCard">
        <div>
          <h2 className="sectionTitle">
            Save your claim reference
          </h2>

          <p className="sectionDescription">
            You will need the claim reference and the
            email used during submission to check the
            request later.
          </p>
        </div>

        <div className="submittedActions">
          <Link
            href="/status"
            className="primaryButton"
          >
            Check status
          </Link>

          <Link
            href="/"
            className="secondaryButton"
          >
            Return to Copyright Center
          </Link>
        </div>
      </section>

      <div className="submittedDevelopmentNotice">
        <strong>Frontend demonstration:</strong>{" "}
        CR-DEMO-0001 is temporary. The production
        backend will generate permanent references,
        store submissions, connect cases to Poster
        Admin, and send appropriate email updates.
      </div>
    </>
  );
}