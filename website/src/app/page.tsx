import Link from "next/link";

import styles from "./page.module.css";

export default function HomePage() {
  return (
    <>
      <section
        className={styles.hero}
      >
        <div
          className={styles.heroInner}
        >
          <p
            className={styles.eyebrow}
          >
            Discover knowledge that matters
          </p>

          <h1>
            Discover better knowledge.
            <br />
            From sources you can trust.
          </h1>

          <p
            className={styles.heroDescription}
          >
            Poster helps people discover useful,
            relevant information from trusted
            publishers and takes them directly
            to the original source.
          </p>

          <div
            className={styles.heroActions}
          >
            <Link
              href="/get-app"
              className={styles.primaryAction}
            >
              Get the App
            </Link>

            <Link
              href="/how-it-works"
              className={styles.secondaryAction}
            >
              How Poster Works
            </Link>
          </div>
        </div>
      </section>

      <section
        className={styles.principles}
      >
        <article>
          <span>
            01
          </span>

          <h2>
            Discover
          </h2>

          <p>
            Find useful information across
            trusted sources without having to
            search everywhere yourself.
          </p>
        </article>

        <article>
          <span>
            02
          </span>

          <h2>
            Personalize
          </h2>

          <p>
            Shape discovery around your
            interests, goals, and the subjects
            that matter to you.
          </p>
        </article>

        <article>
          <span>
            03
          </span>

          <h2>
            Go to the source
          </h2>

          <p>
            Poster helps you discover content,
            then sends you to the original
            publisher to continue reading.
          </p>
        </article>
      </section>

      <section
        className={styles.editorialSection}
      >
        <div>
          <p
            className={styles.sectionEyebrow}
          >
            A better discovery layer
          </p>

          <h2>
            Useful information should be
            easier to find.
          </h2>
        </div>

        <div
          className={styles.editorialCopy}
        >
          <p>
            The internet contains an enormous
            amount of valuable knowledge, but
            finding the right information at
            the right time is increasingly
            difficult.
          </p>

          <p>
            Poster is designed to organize
            discovery around relevance,
            trusted sources, and personal
            interests — without replacing the
            publishers who created the
            original work.
          </p>
        </div>
      </section>

      <section
        className={styles.sourceSection}
      >
        <div
          className={styles.sourceStatement}
        >
          <p
            className={styles.sectionEyebrow}
          >
            Original sources remain central
          </p>

          <h2>
            Discover on Poster.
            <br />
            Continue at the source.
          </h2>

          <p>
            Poster is a discovery platform,
            not a publishing platform.
            Content remains connected to its
            original publisher.
          </p>

          <Link
            href="/publishers"
            className={styles.textLink}
          >
            Learn how Poster works with publishers →
          </Link>
        </div>
      </section>

      <section
        className={styles.audienceSection}
      >
        <div
          className={styles.audienceIntro}
        >
          <p
            className={styles.sectionEyebrow}
          >
            Built for a connected ecosystem
          </p>

          <h2>
            Discovery works better when
            everyone has a clear role.
          </h2>
        </div>

        <div
          className={styles.audienceRows}
        >
          <Link
            href="/get-app"
            className={styles.audienceRow}
          >
            <span>
              For people
            </span>

            <strong>
              Discover information that is
              more relevant to you.
            </strong>

            <b>
              →
            </b>
          </Link>

          <Link
            href="/publishers"
            className={styles.audienceRow}
          >
            <span>
              For publishers
            </span>

            <strong>
              Keep original content at the
              center of discovery.
            </strong>

            <b>
              →
            </b>
          </Link>

          <Link
            href="/advertisers"
            className={styles.audienceRow}
          >
            <span>
              For advertisers
            </span>

            <strong>
              Reach audiences through
              relevant sponsorship and
              affiliate opportunities.
            </strong>

            <b>
              →
            </b>
          </Link>
        </div>
      </section>

      <section
        className={styles.finalSection}
      >
        <p
          className={styles.sectionEyebrow}
        >
          Poster
        </p>

        <h2>
          Knowledge discovery,
          built around the source.
        </h2>

        <Link
          href="/get-app"
          className={styles.primaryAction}
        >
          Get the App
        </Link>
      </section>
    </>
  );
}