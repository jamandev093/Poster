import Link from "next/link";

import styles from "./page.module.css";

export const metadata = {
  title: "Publishers",
  description:
    "Learn how Poster works with publishers while keeping attribution, original destinations, and source rights at the center of discovery.",
};

export default function PublishersPage() {
  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <p className={styles.eyebrow}>
          Publishers
        </p>

        <h1>
          Your content stays connected
          to the original source.
        </h1>

        <p className={styles.lead}>
          Poster helps people discover useful information while
          keeping publishers, attribution, and original destinations
          central to the experience.
        </p>
      </section>

      <section className={styles.editorialSection}>
        <div className={styles.sectionHeading}>
          <p className={styles.eyebrow}>
            What Poster does
          </p>

          <h2>
            Discovery should support publishers,
            not replace them.
          </h2>
        </div>

        <div className={styles.copy}>
          <p>
            Poster is a knowledge discovery platform. It is not
            designed to become the final reading destination for
            every article, report, video, or resource.
          </p>

          <p>
            When Poster helps someone discover useful content,
            the publisher and source remain visible and the person
            can continue directly to the original destination.
          </p>

          <p>
            The goal is to make discovery easier while preserving
            the role of the organizations and people who created
            the original work.
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
              How can publisher content appear on Poster?
            </h2>
          </div>

          <div className={styles.detailCopy}>
            <p>
              Poster can discover or receive content through approved
              methods such as official APIs, authorized RSS or
              syndication feeds, approved embeds, direct agreements,
              and other permitted integrations.
            </p>

            <p>
              Where permission to ingest content is not available,
              Poster can use link-only discovery so the original
              material remains entirely with the publisher.
            </p>
          </div>
        </article>

        <article className={styles.detailRow}>
          <div>
            <span className={styles.number}>
              02
            </span>

            <h2>
              Does Poster republish full articles?
            </h2>
          </div>

          <div className={styles.detailCopy}>
            <p>
              Poster is not intended to copy and republish complete
              publisher works without authorization.
            </p>

            <p>
              Publisher identity and source information should remain
              clear so people understand where the information comes
              from and can continue to the original source.
            </p>
          </div>
        </article>

        <article className={styles.detailRow}>
          <div>
            <span className={styles.number}>
              03
            </span>

            <h2>
              What happens when someone opens my content?
            </h2>
          </div>

          <div className={styles.detailCopy}>
            <p>
              Poster is designed to send people to the original
              publisher when they choose to continue reading,
              watching, learning, or engaging.
            </p>

            <p>
              This keeps the publisher at the center of the content
              relationship while Poster focuses on discovery.
            </p>
          </div>
        </article>

        <article className={styles.detailRow}>
          <div>
            <span className={styles.number}>
              04
            </span>

            <h2>
              What can publishers contact Poster about?
            </h2>
          </div>

          <div className={styles.detailCopy}>
            <p>
              Publishers can contact Poster about attribution,
              incorrect source information, corrections, feed or API
              permissions, removal requests, and questions about how
              a source is represented.
            </p>

            <p>
              Rights holders can also use Poster&apos;s dedicated
              copyright process when a formal copyright or ownership
              concern requires review.
            </p>
          </div>
        </article>
      </section>

      <section className={styles.rightsSection}>
        <div>
          <p className={styles.eyebrow}>
            Content and rights
          </p>

          <h2>
            Need to correct, remove,
            or report something?
          </h2>

          <p>
            Poster provides clear routes for publisher questions,
            source corrections, rights concerns, and formal copyright
            claims.
          </p>
        </div>

        <div className={styles.rightsActions}>
          <Link
            href="/contact"
            className={styles.secondaryAction}
          >
            Contact Poster
          </Link>

          <Link
            href="/copyright"
            className={styles.primaryAction}
          >
            Copyright &amp; Rights
          </Link>
        </div>
      </section>
    </div>
  );
}