import Link from "next/link";

import styles from "./page.module.css";

export const metadata = {
  title: "Publishers",

  description:
    "Learn how Poster works with publishers while keeping original sources at the center of discovery.",
};

export default function PublishersPage() {
  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <p className={styles.eyebrow}>
          Publishers
        </p>

        <h1>
          Keep original sources
          at the center of discovery.
        </h1>

        <p className={styles.lead}>
          Poster helps people discover useful
          information while keeping publishers,
          attribution, and original destinations
          central to the experience.
        </p>
      </section>

      <section className={styles.editorialSection}>
        <div>
          <p className={styles.eyebrow}>
            How Poster works with publishers
          </p>

          <h2>
            Discovery should support
            the original source.
          </h2>
        </div>

        <div className={styles.copy}>
          <p>
            Poster is not designed to replace
            publisher websites or republish
            complete works.
          </p>

          <p>
            Where content is discovered through
            permitted methods, Poster helps
            organize relevance and sends people
            back to the original publisher to
            continue reading or engaging.
          </p>
        </div>
      </section>

      <section className={styles.points}>
        <article>
          <span>01</span>

          <h2>
            Clear attribution
          </h2>

          <p>
            Source identity remains visible so
            people understand where information
            comes from.
          </p>
        </article>

        <article>
          <span>02</span>

          <h2>
            Original destinations
          </h2>

          <p>
            Poster directs people to the original
            publisher rather than trying to
            become the final reading destination.
          </p>
        </article>

        <article>
          <span>03</span>

          <h2>
            Responsible access
          </h2>

          <p>
            Poster uses approved methods such as
            official APIs, authorized feeds,
            embeds, and direct agreements where
            appropriate.
          </p>
        </article>
      </section>

      <section className={styles.policySection}>
        <p className={styles.eyebrow}>
          Content and rights
        </p>

        <h2>
          Publishers and rights holders
          should have a clear path to us.
        </h2>

        <p>
          Poster maintains a process for copyright
          concerns, source corrections, and
          rights-related requests.
        </p>

        <Link
          href="/copyright"
          className={styles.textLink}
        >
          Copyright & Rights →
        </Link>
      </section>

      <section className={styles.finalSection}>
        <div>
          <p className={styles.eyebrow}>
            Publisher questions
          </p>

          <h2>
            Need to contact Poster
            about a source?
          </h2>
        </div>

        <Link
          href="/contact"
          className={styles.primaryAction}
        >
          Contact Poster
        </Link>
      </section>
    </div>
  );
}