import Link from "next/link";

import styles from "./page.module.css";

export const metadata = {
  title: "How Poster Works",
  description:
    "See how Poster discovers permitted source content, understands relevance, personalizes discovery, and sends users to original publishers.",
};

const steps = [
  {
    number: "01",
    title: "Publishers create the original content",
    description:
      "Publishers, organizations, experts, and other sources create and publish information on their own websites and platforms.",
  },
  {
    number: "02",
    title: "Poster discovers permitted sources",
    description:
      "Poster can receive or discover information through approved methods such as official APIs, authorized feeds, embeds, direct agreements, or link-only discovery.",
  },
  {
    number: "03",
    title: "AI helps understand the information",
    description:
      "Poster can classify topics, understand context, organize source information, and identify signals that help determine relevance.",
  },
  {
    number: "04",
    title: "Discovery becomes more relevant",
    description:
      "Interests, relevance signals, search, and discovery systems help surface information that may be more useful to each person.",
  },
  {
    number: "05",
    title: "People discover through Poster",
    description:
      "Useful information can appear through personalized Home discovery, Search, and Trending experiences.",
  },
  {
    number: "06",
    title: "People continue at the original source",
    description:
      "When someone chooses to open a discovery, Poster directs them to the original publisher to continue reading, watching, learning, or engaging.",
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
          From original sources
          to relevant discovery.
        </h1>

        <p className={styles.lead}>
          Poster creates a discovery layer between useful
          information and the people who may benefit from it —
          without replacing the original publisher.
        </p>
      </section>

      <section className={styles.intro}>
        <div>
          <p className={styles.eyebrow}>
            The complete journey
          </p>

          <h2>
            What happens from publication
            to discovery?
          </h2>
        </div>

        <p>
          Poster connects approved source access, AI-assisted
          understanding, relevance, personalization, and
          original-source redirection into one discovery flow.
        </p>
      </section>

      <section className={styles.steps}>
        {steps.map((step) => (
          <article
            key={step.number}
            className={styles.step}
          >
            <span>{step.number}</span>

            <div>
              <h2>{step.title}</h2>

              <p>{step.description}</p>
            </div>
          </article>
        ))}
      </section>

      <section className={styles.principleSection}>
        <p className={styles.eyebrow}>
          The principle behind the system
        </p>

        <h2>
          Poster helps people find the content.
          <br />
          Publishers remain the source.
        </h2>

        <p>
          Poster is not designed to copy the entire publishing
          experience. Its role is to improve discovery and make
          it easier for people to reach useful original sources.
        </p>

        <Link
          href="/publishers"
          className={styles.textLink}
        >
          How Poster works with publishers →
        </Link>
      </section>
    </div>
  );
}