import styles from "./page.module.css";

export const metadata = {
  title: "Terms",
  description:
    "Read the terms governing use of Poster’s public website and related services.",
};

export default function TermsPage() {
  return (
    <article className={styles.page}>
      <header className={styles.header}>
        <p className={styles.eyebrow}>
          Legal
        </p>

        <h1>
          Terms
        </h1>

        <p>
          These terms describe the basic conditions
          for using Poster&apos;s website and related
          services.
        </p>
      </header>

      <div className={styles.content}>
        <section>
          <h2>Using Poster</h2>

          <p>
            Poster provides knowledge discovery and
            related services. Users must use Poster
            lawfully and in accordance with applicable
            policies and agreements.
          </p>
        </section>

        <section>
          <h2>Original sources</h2>

          <p>
            Poster is a discovery platform. Content
            discovered through Poster may belong to
            third-party publishers and rights holders.
            Their own terms may apply when users visit
            external services.
          </p>
        </section>

        <section>
          <h2>Accounts and access</h2>

          <p>
            Certain Poster services may require an
            account, verification, authorization, or
            a specific role.
          </p>
        </section>

        <section>
          <h2>Advertising and commercial services</h2>

          <p>
            Sponsorship, affiliate, and other commercial
            arrangements may be governed by separate
            approvals, contracts, campaign terms,
            payment obligations, and policies.
          </p>
        </section>

        <section>
          <h2>Copyright and rights</h2>

          <p>
            Rights-related concerns should use Poster&apos;s
            designated copyright and rights process.
          </p>
        </section>

        <section>
          <h2>Service availability</h2>

          <p>
            Poster services may change, evolve, or be
            modified as the platform develops.
          </p>
        </section>

        <section>
          <h2>Contact</h2>

          <p>
            Questions regarding these terms may be
            submitted through Poster&apos;s public
            contact page.
          </p>
        </section>
      </div>
    </article>
  );
}