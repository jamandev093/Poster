import Link from "next/link";

interface SubmittedPageProps {
  searchParams: Promise<{
    reference?: string;

    type?: string;

    count?: string;
  }>;
}

function normalizeReference(
  value:
    string |
    undefined
): string | null {
  const normalized =
    value?.trim().toUpperCase() ??
    "";

  return /^CR-[0-9]{4,}$/.test(
    normalized
  )
    ? normalized
    : null;
}

function normalizeCount(
  value:
    string |
    undefined
): number | null {
  const parsed =
    Number.parseInt(
      value ?? "",
      10
    );

  return Number.isInteger(
    parsed
  ) &&
    parsed > 0 &&
    parsed <= 100
    ? parsed
    : null;
}

export default async function SubmittedPage({
  searchParams,
}: SubmittedPageProps) {
  const params =
    await searchParams;

  const reference =
    normalizeReference(
      params.reference
    );

  const isBulk =
    params.type ===
    "bulk";

  const count =
    normalizeCount(
      params.count
    );

  return (
    <>
      <header className="pageHeader pageHeaderLarge">
        <div>
          <div className="pageEyebrow">
            Copyright request submitted
          </div>

          <h1 className="pageTitle pageTitleLarge">
            {reference
              ? isBulk
                ? "Your bulk request was received"
                : "Your claim was received"
              : "Submission received"}
          </h1>

          <p className="pageDescription pageDescriptionLarge">
            Poster has received the copyright request for
            review. Submission does not automatically
            remove content or establish copyright
            ownership.
          </p>
        </div>
      </header>

      <section className="statusCaseSummary">
        <div className="statusCasePrimary">
          <div className="statusCaseLabel">
            Claim reference
          </div>

          <h2 className="statusCaseReference">
            {reference ??
              "Reference unavailable"}
          </h2>

          <div className="statusBadge statusBadgeProgress">
            Submitted
          </div>
        </div>

        <dl className="statusCaseDetails">
          <div>
            <dt>
              Request type
            </dt>

            <dd>
              {isBulk
                ? "Bulk copyright request"
                : "Single copyright claim"}
            </dd>
          </div>

          {isBulk ? (
            <div>
              <dt>
                Affected items
              </dt>

              <dd>
                {count
                  ? `${count} selected item${
                      count === 1
                        ? ""
                        : "s"
                    }`
                  : "Selected items received"}
              </dd>
            </div>
          ) : null}

          <div>
            <dt>
              Current state
            </dt>

            <dd>
              Awaiting Poster review
            </dd>
          </div>

          <div>
            <dt>
              Next step
            </dt>

            <dd>
              {isBulk
                ? "Identity, evidence, and selected item review"
                : "Identity, evidence, and content review"}
            </dd>
          </div>
        </dl>
      </section>

      <div className="processNotice">
        <strong>
          Save your reference
        </strong>

        <span>
          Use this reference with the same email address
          supplied in the form when checking status later.
        </span>
      </div>

      <section className="pageSection">
        <div className="sectionHeading">
          <div>
            <div className="sectionEyebrow">
              Review process
            </div>

            <h2 className="sectionTitle sectionTitleLarge">
              What happens next
            </h2>
          </div>

          <p className="sectionIntro">
            Poster reviews the submitted case in the
            Admin copyright workspace before any
            operational action is taken.
          </p>
        </div>

        <div className="processList">
          <div className="processRow">
            <span className="processNumber">
              01
            </span>

            <div>
              <h3 className="processTitle">
                Case created
              </h3>

              <p className="processDescription">
                The Backend created a permanent copyright
                case reference and stored the request for
                Admin review.
              </p>
            </div>
          </div>

          <div className="processRow">
            <span className="processNumber">
              02
            </span>

            <div>
              <h3 className="processTitle">
                Review starts
              </h3>

              <p className="processDescription">
                Poster reviews claimant details, affected
                content, original-source information, and
                supporting evidence.
              </p>
            </div>
          </div>

          <div className="processRow">
            <span className="processNumber">
              03
            </span>

            <div>
              <h3 className="processTitle">
                Action is recorded
              </h3>

              <p className="processDescription">
                Authorized outcomes are recorded through
                Backend-managed Admin actions and audit
                history.
              </p>
            </div>
          </div>
        </div>
      </section>

      <div className="pageActions">
        <Link
          href="/status"
          className="primaryButton buttonLink"
        >
          Check status
        </Link>

        <Link
          href={
            isBulk
              ? "/bulk-removal"
              : "/request"
          }
          className="secondaryButton buttonLink"
        >
          {isBulk
            ? "Submit another bulk request"
            : "Submit another claim"}
        </Link>
      </div>
    </>
  );
}