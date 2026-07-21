export default function CopyrightStatusPage() {
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
            Follow the progress and outcome of a
            submitted copyright request without
            creating an account.
          </p>
        </div>
      </header>

      <section className="contentCard">
        <h2 className="sectionTitle">
          Secure claim lookup
        </h2>

        <p className="sectionDescription">
          We will design the secure lookup and
          search behavior carefully in the next
          step before connecting this screen.
        </p>

        <div className="notice" style={{ marginTop: 18 }}>
          The final status flow will not expose a
          claim using only a guessable reference.
          Verification will be designed before
          status lookup is implemented.
        </div>
      </section>

      <section className="contentCard">
        <h2 className="sectionTitle">
          What a claimant will be able to see
        </h2>

        <div
          style={{
            display: "grid",
            gap: 10,
            marginTop: 18,
          }}
        >
          {[
            ["Submitted", "Request received"],
            ["Verification", "Claim and supporting information being checked"],
            ["Under review", "Affected content being reviewed"],
            ["Action taken", "Removal or other outcome completed where applicable"],
            ["Resolved", "Final outcome available"],
          ].map(([status, description]) => (
            <div
              key={status}
              style={{
                display: "grid",
                gridTemplateColumns: "140px 1fr",
                gap: 16,
                padding: "12px 0",
                borderBottom: "1px solid #E2E8F0",
              }}
            >
              <strong
                style={{
                  fontSize: 13,
                }}
              >
                {status}
              </strong>

              <span
                style={{
                  color: "#64748B",
                  fontSize: 13,
                  lineHeight: "20px",
                }}
              >
                {description}
              </span>
            </div>
          ))}
        </div>
      </section>

      <section className="contentCard">
        <h2 className="sectionTitle">
          Bulk claim outcomes
        </h2>

        <p className="sectionDescription">
          One bulk case can contain many affected
          items, and each item can have a different
          result such as Removed, Removed + re-import
          blocked, Under review, or Not matched.
        </p>
      </section>
    </>
  );
}