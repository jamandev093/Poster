import Link from "next/link";

interface CopyrightAction {
  href: string;
  eyebrow: string;
  title: string;
  description: string;
  action: string;
  featured?: boolean;
}

const primaryActions: CopyrightAction[] = [
  {
    href: "/find",
    eyebrow: "Start here",
    title: "Find affected Poster content",
    description:
      "Search using a Poster Content ID or exact Poster content URL before submitting a concern.",
    action: "Find content",
    featured: true,
  },
  {
    href: "/request",
    eyebrow: "One record",
    title: "Submit a copyright claim",
    description:
      "Report one affected Poster content record and provide information supporting your claim.",
    action: "Submit a claim",
  },
  {
    href: "/bulk-removal",
    eyebrow: "Multiple records",
    title: "Submit a bulk removal request",
    description:
      "Include several related Poster Content IDs in one request while preserving an individual outcome for each record.",
    action: "Start bulk request",
  },
];

const processSteps = [
  {
    number: "01",
    title: "Identify the affected content",
    description:
      "Provide the Poster Content ID or exact Poster URL whenever available.",
  },
  {
    number: "02",
    title: "Explain your relationship to the work",
    description:
      "Tell Poster whether you are the rights holder, an authorized representative, or another relevant party.",
  },
  {
    number: "03",
    title: "Provide supporting information",
    description:
      "Include the original work, source details, claimant information, and evidence supporting the concern.",
  },
  {
    number: "04",
    title: "Poster reviews the request",
    description:
      "Submission does not automatically remove content. Poster reviews the claim before recording an outcome.",
  },
];

export default function CopyrightCenterPage() {
  return (
    <>
      <header className="pageHeader pageHeaderLarge">
        <div>
          <div className="pageEyebrow">
            Poster Copyright & Rights
          </div>

          <h1 className="pageTitle pageTitleLarge">
            Report and track a copyright concern.
          </h1>

          <p className="pageDescription pageDescriptionLarge">
            Find content referenced through Poster,
            submit a single or bulk request, and check
            the progress and outcome of an existing
            copyright case.
          </p>
        </div>
      </header>

      <section
        className="pageSection"
        aria-labelledby="copyright-actions-title"
      >
        <div className="sectionHeading">
          <div>
            <div className="sectionEyebrow">
              Choose the right path
            </div>

            <h2
              id="copyright-actions-title"
              className="sectionTitle sectionTitleLarge"
            >
              What do you need to do?
            </h2>
          </div>

          <p className="sectionIntro">
            Start by identifying whether your concern
            involves one content record, several records,
            or an already-submitted claim.
          </p>
        </div>

        <div className="actionGrid">
          {primaryActions.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={
                item.featured
                  ? "actionCard actionCardFeatured"
                  : "actionCard"
              }
            >
              <span className="actionEyebrow">
                {item.eyebrow}
              </span>

              <strong className="actionTitle">
                {item.title}
              </strong>

              <span className="actionDescription">
                {item.description}
              </span>

              <span className="actionLink">
                {item.action}
                <span aria-hidden="true">→</span>
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section
        className="statusCallout"
        aria-labelledby="existing-claim-title"
      >
        <div>
          <div className="sectionEyebrow">
            Existing request
          </div>

          <h2
            id="existing-claim-title"
            className="sectionTitle"
          >
            Already submitted a claim?
          </h2>

          <p className="sectionDescription">
            Enter the claim reference and submitted
            email to view the current case status,
            timeline, and recorded outcomes.
          </p>
        </div>

        <Link
          href="/status"
          className="primaryButton buttonLink"
        >
          Check claim status
        </Link>
      </section>

      <section
        className="pageSection"
        aria-labelledby="review-process-title"
      >
        <div className="sectionHeading">
          <div>
            <div className="sectionEyebrow">
              Review process
            </div>

            <h2
              id="review-process-title"
              className="sectionTitle sectionTitleLarge"
            >
              What happens after you begin?
            </h2>
          </div>

          <p className="sectionIntro">
            Poster uses a structured process so the
            affected content, claimant, evidence, and
            final action remain clear.
          </p>
        </div>

        <div className="processList">
          {processSteps.map((step) => (
            <article
              key={step.number}
              className="processRow"
            >
              <span className="processNumber">
                {step.number}
              </span>

              <div>
                <h3 className="processTitle">
                  {step.title}
                </h3>

                <p className="processDescription">
                  {step.description}
                </p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <aside className="informationNotice">
        <strong>No account is required.</strong>

        <span>
          Finding a content record does not verify
          ownership. Submitting a request does not
          automatically remove content. Poster reviews
          supporting information before recording an
          operational outcome.
        </span>
      </aside>
    </>
  );
}