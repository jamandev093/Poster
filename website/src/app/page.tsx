import Link from "next/link";

import styles from "./page.module.css";

export default function HomePage() {
  return (
    <>
      <section className={styles.hero}>
        <div className={styles.heroInner}>
          <p className={styles.eyebrow}>
            Discover knowledge that matters
          </p>

          <h1>
            Discover better knowledge.
            <br />
            From sources you can trust.
          </h1>

          <p className={styles.heroDescription}>
            Poster helps you find useful and relevant information
            without searching across dozens of websites yourself.
            Discover on Poster, then continue directly to the
            original source.
          </p>

          <div className={styles.heroActions}>
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

      <section className={styles.problemSection}>
        <div>
          <p className={styles.sectionEyebrow}>
            The problem
          </p>

          <h2>
            Too much information.
            <br />
            Too little useful discovery.
          </h2>
        </div>

        <div className={styles.problemCopy}>
          <p>
            Valuable knowledge is spread across publishers,
            websites, organizations, and platforms. Finding the
            right information at the right time often means
            searching repeatedly and filtering through noise.
          </p>

          <p>
            Poster creates a discovery layer that helps surface
            information around your interests, relevance, trusted
            sources, and what is happening now.
          </p>
        </div>
      </section>

      <section className={styles.principles}>
        <article>
          <span>01</span>

          <h2>Discover</h2>

          <p>
            Find useful information from multiple trusted sources
            through one discovery experience.
          </p>
        </article>

        <article>
          <span>02</span>

          <h2>Personalize</h2>

          <p>
            Shape discovery around your interests, goals, and the
            subjects that matter to you.
          </p>
        </article>

        <article>
          <span>03</span>

          <h2>Go to the source</h2>

          <p>
            Open the original publisher when you want to continue
            reading, watching, learning, or engaging.
          </p>
        </article>
      </section>

      <section className={styles.intentSection}>
        <div className={styles.intentHeading}>
          <p className={styles.sectionEyebrow}>
            What brings you to Poster?
          </p>

          <h2>
            Find the information
            that matters to you.
          </h2>

          <p>
            Poster serves people discovering knowledge, publishers
            whose content is discovered, advertisers reaching
            relevant audiences, and rights holders who need a clear
            way to raise concerns.
          </p>
        </div>

        <div className={styles.intentList}>
          <Link
            href="/get-app"
            className={styles.intentItem}
          >
            <div>
              <span>For people</span>

              <strong>
                I want to discover useful knowledge.
              </strong>

              <p>
                Learn what Poster can help you discover and how to
                get the mobile app.
              </p>
            </div>

            <b>→</b>
          </Link>

          <Link
            href="/publishers"
            className={styles.intentItem}
          >
            <div>
              <span>For publishers</span>

              <strong>
                I want to understand how Poster uses my source.
              </strong>

              <p>
                Learn about attribution, original-source redirects,
                approved discovery methods, corrections, and rights.
              </p>
            </div>

            <b>→</b>
          </Link>

          <Link
            href="/advertisers"
            className={styles.intentItem}
          >
            <div>
              <span>For advertisers</span>

              <strong>
                I want to advertise on Poster.
              </strong>

              <p>
                Understand sponsorship, affiliate campaigns,
                placements, measurement, and how to submit a request.
              </p>
            </div>

            <b>→</b>
          </Link>

          <Link
            href="/copyright"
            className={styles.intentItem}
          >
            <div>
              <span>For rights holders</span>

              <strong>
                I have a copyright or rights concern.
              </strong>

              <p>
                See what can be reported, what evidence is needed,
                how claims are reviewed, and what happens next.
              </p>
            </div>

            <b>→</b>
          </Link>
        </div>
      </section>

      <section className={styles.sourceSection}>
        <div className={styles.sourceStatement}>
          <p className={styles.sectionEyebrow}>
            Our core principle
          </p>

          <h2>
            Discover on Poster.
            <br />
            Continue at the source.
          </h2>

          <p>
            Poster is a discovery platform, not a publishing
            platform. Original publishers remain central to the
            experience.
          </p>

          <Link
            href="/how-it-works"
            className={styles.textLink}
          >
            See how Poster works →
          </Link>
        </div>
      </section>

      <section className={styles.finalSection}>
        <p className={styles.sectionEyebrow}>
          Start with Poster
        </p>

        <h2>
          Find knowledge that is
          more relevant to you.
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