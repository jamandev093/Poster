import styles from "./page.module.css";

export const metadata = {
  title: "Copyright & Rights",

  description:
    "Learn how Poster approaches copyright, rights-holder concerns, source attribution, and claim handling.",
};

export default function CopyrightPage() {
  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <div>
          <p className={styles.eyebrow}>
            Copyright & Rights
          </p>

          <h1>
            Respecting original publishers
            and rights holders.
          </h1>

          <p className={styles.lead}>
            Poster is built around responsible
            discovery, clear attribution, and
            a structured process for copyright
            and rights-related concerns.
          </p>
        </div>

        <a
          href="https://copyright.getpostar.com"
          className={styles.claimAction}
        >
          Submit or Manage a Copyright Claim
        </a>
      </section>

      <section className={styles.editorialSection}>
        <div>
          <p className={styles.eyebrow}>
            Our approach
          </p>

          <h2>
            Discovery should respect
            ownership and source rights.
          </h2>
        </div>

        <div className={styles.copy}>
          <p>
            Poster does not aim to replace
            original publishers or rehost
            protected works without authorization.
          </p>

          <p>
            Content discovery should use
            permitted methods and maintain
            clear connections to the original
            source.
          </p>
        </div>
      </section>

      <section className={styles.process}>
        <article>
          <span>
            01
          </span>

          <h2>
            Submit
          </h2>

          <p>
            Identify the protected work,
            relevant Poster reference, claimant
            information, and supporting evidence.
          </p>
        </article>

        <article>
          <span>
            02
          </span>

          <h2>
            Verify
          </h2>

          <p>
            Poster reviews claimant identity,
            source information, URLs, ownership
            signals, and submitted evidence.
          </p>
        </article>

        <article>
          <span>
            03
          </span>

          <h2>
            Review
          </h2>

          <p>
            The case is assessed before an
            operational decision is made.
          </p>
        </article>

        <article>
          <span>
            04
          </span>

          <h2>
            Act
          </h2>

          <p>
            Appropriate action may include
            removal, prevention of re-import,
            resolution, or dismissal where
            justified.
          </p>
        </article>
      </section>

      <section className={styles.policySection}>
        <p className={styles.eyebrow}>
          Responsible discovery
        </p>

        <h2>
          Poster uses approved
          content-access methods.
        </h2>

        <div className={styles.policyRows}>
          <div>
            <span>
              Official APIs
            </span>

            <strong>
              Used where publishers provide
              authorized access.
            </strong>
          </div>

          <div>
            <span>
              Authorized feeds
            </span>

            <strong>
              RSS or similar feeds are used
              only where permission is clear.
            </strong>
          </div>

          <div>
            <span>
              Embeds and agreements
            </span>

            <strong>
              Supported where permitted by
              the source or direct agreement.
            </strong>
          </div>

          <div>
            <span>
              Link-only discovery
            </span>

            <strong>
              Used where content itself should
              remain entirely with the source.
            </strong>
          </div>
        </div>
      </section>

      <section className={styles.finalSection}>
        <div>
          <p className={styles.eyebrow}>
            Need to report a concern?
          </p>

          <h2>
            Use the Copyright & Rights portal
            to submit or manage a claim.
          </h2>
        </div>

        <a
          href="https://copyright.getpostar.com"
          className={styles.primaryAction}
        >
          Open Copyright Portal
        </a>
      </section>
    </div>
  );
}