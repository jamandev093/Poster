import Link from "next/link";

import styles from "./page.module.css";

export const metadata = {
  title: "About",

  description:
    "Learn why Poster exists and how it helps people discover useful knowledge from trusted original sources.",
};

export default function AboutPage() {
  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <p className={styles.eyebrow}>
          About Poster
        </p>

        <h1>
          A better way to discover
          useful knowledge.
        </h1>

        <p className={styles.lead}>
          Poster helps people find relevant
          information from trusted sources
          without replacing the publishers
          who created it.
        </p>
      </section>

      <section className={styles.storySection}>
        <div className={styles.sectionHeading}>
          <p className={styles.eyebrow}>
            Why Poster exists
          </p>

          <h2>
            Finding useful information
            should not feel overwhelming.
          </h2>
        </div>

        <div className={styles.copy}>
          <p>
            The internet gives people access
            to more information than ever
            before, but discovering what is
            useful, relevant, and trustworthy
            can still take too much time.
          </p>

          <p>
            Poster is designed to make that
            discovery process simpler by
            organizing information around
            interests, relevance, and trusted
            sources.
          </p>
        </div>
      </section>

      <section className={styles.principles}>
        <article>
          <span>
            01
          </span>

          <h2>
            Discovery first
          </h2>

          <p>
            Poster helps people find useful
            information rather than trying to
            become the destination for every
            piece of content.
          </p>
        </article>

        <article>
          <span>
            02
          </span>

          <h2>
            Original sources matter
          </h2>

          <p>
            Publishers remain at the center.
            Poster connects discovery back to
            the original source.
          </p>
        </article>

        <article>
          <span>
            03
          </span>

          <h2>
            Relevance over noise
          </h2>

          <p>
            The goal is to help people
            discover information that better
            matches their interests and goals.
          </p>
        </article>
      </section>

      <section className={styles.statementSection}>
        <p className={styles.eyebrow}>
          What Poster is
        </p>

        <h2>
          Poster is a discovery platform,
          not a publishing platform.
        </h2>

        <p>
          We help people discover useful
          information and continue to the
          original publisher whenever they
          choose to explore further.
        </p>

        <Link
          href="/how-it-works"
          className={styles.textLink}
        >
          See how Poster works →
        </Link>
      </section>

      <section className={styles.finalSection}>
        <div>
          <p className={styles.eyebrow}>
            Our direction
          </p>

          <h2>
            Make useful knowledge easier
            to discover.
          </h2>
        </div>

        <Link
          href="/get-app"
          className={styles.primaryAction}
        >
          Get the App
        </Link>
      </section>
    </div>
  );
}