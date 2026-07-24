import styles from "./page.module.css";

export const metadata = {
  title: "Copyright & Rights",
  description:
    "Report copyright concerns, understand Poster’s verification process, and learn what actions may follow a rights claim.",
};

export default function CopyrightPage() {
  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.heroCopy}>
          <p className={styles.eyebrow}>
            Copyright &amp; Rights
          </p>

          <h1>
            Concerned about copyrighted
            content appearing on Poster?
          </h1>

          <p className={styles.lead}>
            If you own or represent copyrighted work, Poster provides
            a structured process to report a concern, provide evidence,
            and follow the case through review.
          </p>
        </div>

        <aside className={styles.portalPanel}>
          <p className={styles.portalEyebrow}>
            Copyright &amp; Rights Portal
          </p>

          <h2>
            Submit or manage
            a rights claim.
          </h2>

          <p>
            Start a new claim, provide supporting information,
            or manage an existing copyright case through the
            dedicated portal.
          </p>

          <a
            href="https://copyright.getpostar.com"
            className={styles.portalAction}
          >
            Open Copyright Portal →
          </a>
        </aside>
      </section>

      <section className={styles.editorialSection}>
        <div>
          <p className={styles.eyebrow}>
            What can be reported?
          </p>

          <h2>
            Use the rights process when
            something needs formal review.
          </h2>
        </div>

        <div className={styles.copy}>
          <p>
            You can report a Poster content reference, incorrect
            attribution, a suspected unauthorized use, a copyright
            ownership concern, or another rights-related issue.
          </p>

          <p>
            You can also raise concerns where previously removed
            content appears again or where source information may
            cause confusion about ownership.
          </p>
        </div>
      </section>

      <section className={styles.detailSection}>
        <article className={styles.detailRow}>
          <div>
            <span className={styles.number}>
              01
            </span>

            <h2>
              What information should I provide?
            </h2>
          </div>

          <div className={styles.detailCopy}>
            <p>
              Provide the Poster Content ID or URL where possible,
              the original work URL or source, the claimant or
              rights-holder name, contact information, and evidence
              supporting the claim.
            </p>

            <p>
              Clear evidence helps Poster distinguish verified rights
              concerns from incomplete, uncertain, or unsupported
              submissions.
            </p>
          </div>
        </article>

        <article className={styles.detailRow}>
          <div>
            <span className={styles.number}>
              02
            </span>

            <h2>
              How does Poster verify a claim?
            </h2>
          </div>

          <div className={styles.detailCopy}>
            <p>
              Poster can cross-check the relevant Poster reference,
              original URL or domain, claimant identity, publisher
              information, business email or domain alignment,
              source metadata, and supporting references.
            </p>

            <p>
              Uncertain cases can remain pending for additional
              information or manual review rather than being treated
              as automatically verified.
            </p>
          </div>
        </article>

        <article className={styles.detailRow}>
          <div>
            <span className={styles.number}>
              03
            </span>

            <h2>
              What happens after submission?
            </h2>
          </div>

          <div className={styles.detailCopy}>
            <p>
              Poster reviews the claim, checks the evidence, and may
              request additional information before making an
              operational decision.
            </p>

            <p>
              The goal is to respond appropriately while preserving
              a clear and auditable record of important actions.
            </p>
          </div>
        </article>

        <article className={styles.detailRow}>
          <div>
            <span className={styles.number}>
              04
            </span>

            <h2>
              What actions can follow?
            </h2>
          </div>

          <div className={styles.detailCopy}>
            <p>
              Depending on the review, Poster may remove the relevant
              content reference, remove and prevent re-import,
              request more evidence, dismiss an unsupported claim,
              or resolve the case.
            </p>
          </div>
        </article>
      </section>

      <section className={styles.methodsSection}>
        <div>
          <p className={styles.eyebrow}>
            Responsible discovery
          </p>

          <h2>
            Poster uses approved
            content-access methods.
          </h2>
        </div>

        <div className={styles.methodList}>
          <div>
            <span>
              Official APIs
            </span>

            <p>
              Used where publishers or platforms provide authorized
              access.
            </p>
          </div>

          <div>
            <span>
              Authorized feeds
            </span>

            <p>
              RSS or similar feeds are used where authorization or
              permission is clear.
            </p>
          </div>

          <div>
            <span>
              Embeds and agreements
            </span>

            <p>
              Supported where the source permits embedding or where
              a direct agreement exists.
            </p>
          </div>

          <div>
            <span>
              Link-only discovery
            </span>

            <p>
              Used where the original content should remain entirely
              with the publisher.
            </p>
          </div>
        </div>
      </section>

      <section className={styles.finalSection}>
        <aside className={styles.portalPanelLarge}>
          <div>
            <p className={styles.portalEyebrow}>
              Copyright &amp; Rights Portal
            </p>

            <h2>
              Ready to submit
              or manage a claim?
            </h2>

            <p>
              Use the dedicated portal to submit supporting evidence,
              follow case status, or manage an existing rights claim.
            </p>
          </div>

          <a
            href="https://copyright.getpostar.com"
            className={styles.portalAction}
          >
            Open Copyright Portal →
          </a>
        </aside>
      </section>
    </div>
  );
}