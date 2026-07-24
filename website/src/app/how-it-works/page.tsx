import Link from "next/link";

import styles from "./page.module.css";

export const metadata = {
  title: "How Poster Works",

  description:
    "See how Poster turns trusted sources, relevance, and personalization into a simpler knowledge discovery experience.",
};

const steps = [
  {
    number: "01",
    title: "Sources",
    description:
      "Poster connects with permitted sources through official APIs, authorized feeds, embeds, agreements, and other approved discovery methods.",
  },
  {
    number: "02",
    title: "Understand",
    description:
      "AI helps classify topics, understand context, and organize information so discovery can become more useful.",
  },
  {
    number: "03",
    title: "Personalize",
    description:
      "Poster uses interests and relevance signals to help surface information that better matches each person.",
  },
  {
    number: "04",
    title: "Discover",
    description:
      "Useful information appears across Poster through personalized discovery, search, and trending experiences.",
  },
  {
    number: "05",
    title: "Continue",
    description:
      "When someone opens content, Poster takes them to the original publisher to continue reading or engaging.",
  },
] as const;

export default function HowPosterWorksPage() {
  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <p className={styles.eyebrow}>
          How Poster Works
        </p>

        <h1>
          From trusted sources
          to relevant discovery.
        </h1>

        <p className={styles.lead}>
          Poster helps organize useful
          information around relevance and
          personal interests while keeping
          original publishers at the center.
        </p>
      </section>

      <section className={styles.flowIntro}>
        <div>
          <p className={styles.eyebrow}>
            The discovery flow
          </p>

          <h2>
            Simple for people.
            Structured behind the scenes.
          </h2>
        </div>

        <p>
          Poster connects source discovery,
          classification, relevance, and
          personalization into one experience
          designed to help people find useful
          information more efficiently.
        </p>
      </section>

      <section className={styles.steps}>
        {steps.map(
          (
            step
          ) => (
            <article
              key={step.number}
              className={styles.step}
            >
              <span
                className={styles.stepNumber}
              >
                {step.number}
              </span>

              <h2>
                {step.title}
              </h2>

              <p>
                {step.description}
              </p>
            </article>
          )
        )}
      </section>

      <section className={styles.sourceSection}>
        <p className={styles.eyebrow}>
          Discovery, not republication
        </p>

        <h2>
          Original publishers remain
          part of the experience.
        </h2>

        <p>
          Poster is designed to help people
          discover content while respecting
          the role of the original source.
          Where appropriate, users continue
          directly to the publisher.
        </p>

        <Link
          href="/publishers"
          className={styles.textLink}
        >
          Learn about publishers →
        </Link>
      </section>

      <section className={styles.finalSection}>
        <div>
          <p className={styles.eyebrow}>
            Start discovering
          </p>

          <h2>
            Find information that better
            matches what matters to you.
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