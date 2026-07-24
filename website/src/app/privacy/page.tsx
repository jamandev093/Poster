import styles from "./page.module.css";

export const metadata = {
  title: "Privacy Policy",
  description:
    "Read Poster’s privacy policy for the public website and related services.",
};

export default function PrivacyPage() {
  return (
    <article className={styles.page}>
      <header className={styles.header}>
        <p className={styles.eyebrow}>
          Legal
        </p>

        <h1>
          Privacy Policy
        </h1>

        <p>
          This policy explains how Poster may collect,
          use, protect, and manage information associated
          with its website and services.
        </p>
      </header>

      <div className={styles.content}>
        <section>
          <h2>Information we may collect</h2>

          <p>
            Poster may process information you provide
            directly, including contact details, account
            information, support requests, advertising
            enquiries, and copyright or rights submissions.
          </p>
        </section>

        <section>
          <h2>Technical and usage information</h2>

          <p>
            Technical information may be processed where
            necessary to operate, secure, improve, and
            understand the use of Poster services.
          </p>
        </section>

        <section>
          <h2>How information may be used</h2>

          <p>
            Information may be used to provide services,
            respond to requests, maintain security, improve
            Poster, support business operations, and meet
            applicable legal obligations.
          </p>
        </section>

        <section>
          <h2>Service providers</h2>

          <p>
            Poster may use trusted third-party providers for
            infrastructure, authentication, communications,
            analytics, payments, and other operational needs.
          </p>
        </section>

        <section>
          <h2>Data retention and security</h2>

          <p>
            Information may be retained where reasonably
            necessary for operational, security, contractual,
            legal, or compliance purposes.
          </p>
        </section>

        <section>
          <h2>Your rights</h2>

          <p>
            Privacy rights may vary depending on applicable
            law and location. Relevant requests can be made
            through Poster&apos;s contact channels.
          </p>
        </section>

        <section>
          <h2>Contact</h2>

          <p>
            Privacy-related enquiries may be sent to
            privacy@getpostar.com.
          </p>
        </section>
      </div>
    </article>
  );
}