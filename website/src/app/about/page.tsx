import Link from "next/link";

import styles from "./page.module.css";

export const metadata = {
  title: "About",
  description:
    "Learn why Poster exists, what the knowledge discovery platform does, and why original publishers remain central to the experience.",
};

export default function AboutPage() {
  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <p className={styles.eyebrow}>About Poster</p>

        <h1>
          Useful knowledge should be
          easier to discover.
        </h1>

        <p className={styles.lead}>
          Poster exists to help people find relevant information
          without making them search across countless websites,
          platforms, and sources on their own.
        </p>
      </section>

      <section className={styles.problemSection}>
        <div>
          <p className={styles.eyebrow}>Why Poster exists</p>

          <h2>
            More information does not always
            mean better discovery.
          </h2>
        </div>

        <div className={styles.copy}>
          <p>
            The internet contains an enormous amount of valuable
            knowledge, but useful information is spread across
            publishers, organizations, experts, websites, and
            platforms.
          </p>

          <p>
            Finding something trustworthy and relevant can still
            require repeated searching, filtering through noise,
            and visiting many different destinations.
          </p>

          <p>
            Poster is designed to make that discovery process
            simpler by organizing information around relevance,
            interests, trusted sources, search, and what is
            happening now.
          </p>
        </div>
      </section>

      <section className={styles.identitySection}>
        <div>
          <p className={styles.eyebrow}>What Poster is</p>

          <h2>
            A discovery layer between people
            and useful original sources.
          </h2>

          <p>
            Poster helps people discover information that may be
            relevant to them, understand where it comes from, and
            continue directly to the original publisher when they
            want to explore further.
          </p>
        </div>

        <div className={styles.identityList}>
          <article>
            <span>01</span>

            <div>
              <strong>Discovery first</strong>

              <p>
                Help people find useful information without requiring
                them to search everywhere individually.
              </p>
            </div>
          </article>

          <article>
            <span>02</span>

            <div>
              <strong>Relevant to the person</strong>

              <p>
                Organize discovery around interests, relevance,
                search, and useful context.
              </p>
            </div>
          </article>

          <article>
            <span>03</span>

            <div>
              <strong>Connected to the source</strong>

              <p>
                Keep publishers visible and direct people to the
                original destination when they continue.
              </p>
            </div>
          </article>
        </div>
      </section>

      <section className={styles.notSection}>
        <div>
          <p className={styles.eyebrow}>What Poster is not</p>

          <h2>
            Poster is not here to replace
            the people who publish knowledge.
          </h2>
        </div>

        <div className={styles.notList}>
          <p>
            <strong>Not a publishing platform.</strong>
            Poster focuses on discovery rather than becoming the
            final destination for every piece of content.
          </p>

          <p>
            <strong>Not a substitute for publishers.</strong>
            Original publishers and rights holders remain central
            to the content relationship.
          </p>

          <p>
            <strong>Not built around unauthorized republication.</strong>
            Content access should use permitted methods such as
            official APIs, authorized feeds, embeds, agreements,
            or link-only discovery where appropriate.
          </p>
        </div>
      </section>

      <section className={styles.directionSection}>
        <div>
          <p className={styles.eyebrow}>Our direction</p>

          <h2>
            Make useful knowledge easier
            to discover.
          </h2>

          <p>
            Poster is being built around a simple principle:
            improve discovery while keeping trusted original
            sources at the center of the experience.
          </p>
        </div>

        <div className={styles.actions}>
          <Link href="/how-it-works" className={styles.primaryAction}>
            How Poster Works
          </Link>

          <Link href="/get-app" className={styles.secondaryAction}>
            Get the App
          </Link>
        </div>
      </section>
    </div>
  );
}