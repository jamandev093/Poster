export default function CopyrightPolicyPage() {
  return (
    <>
      <header className="pageHeader">
        <div>
          <div className="pageEyebrow">
            Copyright
          </div>

          <h1 className="pageTitle">
            Copyright Policy
          </h1>

          <p className="pageDescription">
            How Poster handles copyright reports,
            review, removal, and claim outcomes.
          </p>
        </div>
      </header>

      <section className="contentCard">
        <h2 className="sectionTitle">
          Poster and original sources
        </h2>

        <p className="sectionDescription">
          Poster is a discovery platform designed to
          help users reach original publishers and
          sources. Copyright concerns involving
          content referenced through Poster can be
          reported through this Copyright Center.
        </p>
      </section>

      <section className="contentCard">
        <h2 className="sectionTitle">
          Submitting a claim
        </h2>

        <p className="sectionDescription">
          A claimant should identify the affected
          Poster record, the original copyrighted
          work, their relationship to the rights,
          and information that supports the request.
        </p>
      </section>

      <section className="contentCard">
        <h2 className="sectionTitle">
          Bulk requests
        </h2>

        <p className="sectionDescription">
          Related affected records can be submitted
          together as one copyright case. Each item
          can still receive its own verification,
          review, and outcome.
        </p>
      </section>

      <section className="contentCard">
        <h2 className="sectionTitle">
          Review and possible actions
        </h2>

        <p className="sectionDescription">
          Submission does not automatically remove
          content. Poster may verify claimant
          information, affected records, source
          information, and supporting evidence before
          taking action.
        </p>

        <div
          style={{
            display: "grid",
            gap: 8,
            marginTop: 16,
            color: "#475569",
            fontSize: 13,
            lineHeight: "20px",
          }}
        >
          <div>
            • Content may remain under review.
          </div>

          <div>
            • Content may be removed where appropriate.
          </div>

          <div>
            • Re-import may be prevented where appropriate.
          </div>

          <div>
            • More information may be requested.
          </div>

          <div>
            • A record may be unavailable or not matched.
          </div>
        </div>
      </section>

      <section className="contentCard">
        <h2 className="sectionTitle">
          Status and notifications
        </h2>

        <p className="sectionDescription">
          Claimants can track request outcomes without
          creating a Poster account. Production claim
          access and notifications will use secure
          verification through the submitted contact
          information once backend and email services
          are connected.
        </p>
      </section>

      <section className="contentCard">
        <h2 className="sectionTitle">
          Legal information
        </h2>

        <p className="sectionDescription">
          Final legal notice requirements,
          counter-notice procedures, jurisdictional
          requirements, and formal policy wording
          must be finalized before public production
          launch.
        </p>
      </section>
    </>
  );
}