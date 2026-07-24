

import styles from "./page.module.css";

export const metadata = {
  title: "Advertisers",

  description:
    "Learn about sponsorship and affiliate opportunities on Poster.",
};

export default function AdvertisersPage() {
  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <div>
          <p className={styles.eyebrow}>
            Advertise on Poster
          </p>

          <h1>
            Reach people through
            relevant discovery.
          </h1>

          <p className={styles.lead}>
            Poster supports sponsorship and
            affiliate opportunities designed to
            fit naturally into a knowledge
            discovery experience.
          </p>
        </div>

        <a
          href="https://client.getpostar.com"
          className={styles.portalAction}
        >
          Open Advertiser Portal
        </a>
      </section>

      <section className={styles.editorialSection}>
        <div>
          <p className={styles.eyebrow}>
            Commercial opportunities
          </p>

          <h2>
            Simple campaign models,
            clear measurement.
          </h2>
        </div>

        <div className={styles.copy}>
          <p>
            Poster supports sponsorship and
            affiliate campaign models without
            turning the discovery experience
            into a crowded advertising feed.
          </p>

          <p>
            Campaigns are reviewed before
            activation and remain subject to
            Poster&apos;s placement, quality,
            and operational controls.
          </p>
        </div>
      </section>

      <section className={styles.models}>
        <article>
          <span>
            Sponsorship
          </span>

          <h2>
            Agreed campaigns with
            defined commercial terms.
          </h2>

          <p>
            Sponsorship campaigns can include
            approved placements, schedules,
            creative, and delivery expectations.
          </p>
        </article>

        <article>
          <span>
            Affiliate
          </span>

          <h2>
            Performance-based
            commercial partnerships.
          </h2>

          <p>
            Affiliate campaigns can use tracked
            clicks and conversions where a clear
            commission model is agreed.
          </p>
        </article>
      </section>

      <section className={styles.measurementSection}>
        <p className={styles.eyebrow}>
          Campaign measurement
        </p>

        <h2>
          Focus on the metrics
          that actually matter.
        </h2>

        <div className={styles.measurementRows}>
          <div>
            <span>
              Delivery
            </span>

            <strong>
              Impressions and placement performance
            </strong>
          </div>

          <div>
            <span>
              Engagement
            </span>

            <strong>
              Clicks and click-through rate
            </strong>
          </div>

          <div>
            <span>
              Outcomes
            </span>

            <strong>
              Conversion tracking where configured
            </strong>
          </div>
        </div>
      </section>

      <section className={styles.finalSection}>
        <div>
          <p className={styles.eyebrow}>
            Ready to begin?
          </p>

          <h2>
            Submit and manage advertising
            requests through the Client portal.
          </h2>
        </div>

        <a
          href="https://client.getpostar.com"
          className={styles.primaryAction}
        >
          Open Advertiser Portal
        </a>
      </section>
    </div>
  );
}