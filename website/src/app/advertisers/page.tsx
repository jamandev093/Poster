import styles from "./page.module.css";

export const metadata = {
  title: "Advertisers",
  description:
    "Learn how sponsorship and affiliate advertising works on Poster and access the Advertiser Portal.",
};

export default function AdvertisersPage() {
  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.heroCopy}>
          <p className={styles.eyebrow}>
            Advertise on Poster
          </p>

          <h1>
            Reach people when they are
            discovering something relevant.
          </h1>

          <p className={styles.lead}>
            Poster supports sponsorship and affiliate campaigns
            designed to fit naturally into a knowledge discovery
            experience.
          </p>
        </div>

        <aside className={styles.portalPanel}>
          <p className={styles.portalEyebrow}>
            Advertiser Portal
          </p>

          <h2>
            Start or manage
            an advertising request.
          </h2>

          <p>
            Submit campaign details, creative, commercial terms,
            and placements. Review campaign status and performance
            from the dedicated Client workspace.
          </p>

          <a
            href="https://client.getpostar.com"
            className={styles.portalAction}
          >
            Open Advertiser Portal →
          </a>
        </aside>
      </section>

      <section className={styles.editorialSection}>
        <div>
          <p className={styles.eyebrow}>
            How advertising works
          </p>

          <h2>
            Submit a request first.
            Poster reviews before activation.
          </h2>
        </div>

        <div className={styles.copy}>
          <p>
            Advertisers begin by submitting a request through
            Poster&apos;s Advertiser Portal.
          </p>

          <p>
            A request can include business information, proposed
            campaign dates, requested placements, commercial terms,
            creative, destination URLs, and conversion definitions
            where applicable.
          </p>

          <p>
            Poster reviews the request before a campaign moves into
            operational setup. Approval does not automatically make
            the campaign live.
          </p>

          <p>
            Poster controls scheduling, placement, activation,
            pausing, completion, and campaign quality standards.
          </p>
        </div>
      </section>

      <section className={styles.commercialSection}>
        <article className={styles.commercialRow}>
          <div>
            <p className={styles.eyebrow}>
              Sponsorship
            </p>

            <h2>
              Direct campaigns with
              agreed commercial terms.
            </h2>
          </div>

          <div className={styles.detailCopy}>
            <p>
              Sponsorship campaigns can define contract value,
              approved placements, campaign dates, creative,
              delivery expectations, and other agreed terms.
            </p>

            <p>
              Approved placements can include areas such as Home,
              Search, or Trending depending on campaign setup and
              Poster review.
            </p>
          </div>
        </article>

        <article className={styles.commercialRow}>
          <div>
            <p className={styles.eyebrow}>
              Affiliate
            </p>

            <h2>
              Performance-based campaigns
              with measurable outcomes.
            </h2>
          </div>

          <div className={styles.detailCopy}>
            <p>
              Affiliate campaigns can use tracked clicks,
              defined conversion events, commission rules,
              and performance reporting.
            </p>

            <p>
              A conversion definition makes it clear what counts
              as a successful outcome, such as a purchase,
              enrollment, registration, or another agreed event.
            </p>
          </div>
        </article>
      </section>

      <section className={styles.measurementSection}>
        <div>
          <p className={styles.eyebrow}>
            What can advertisers measure?
          </p>

          <h2>
            Focus on useful campaign
            performance signals.
          </h2>

          <p className={styles.sectionLead}>
            Poster keeps campaign reporting focused on metrics that
            help advertisers understand delivery, engagement, and
            measurable outcomes.
          </p>
        </div>

        <div className={styles.metricList}>
          <div>
            <span>
              Delivery
            </span>

            <strong>
              Impressions and placement performance
            </strong>

            <p>
              See how often a campaign was shown and where delivery
              occurred.
            </p>
          </div>

          <div>
            <span>
              Engagement
            </span>

            <strong>
              Clicks and click-through rate
            </strong>

            <p>
              Understand how often people chose to continue from
              the campaign to the destination.
            </p>
          </div>

          <div>
            <span>
              Outcomes
            </span>

            <strong>
              Conversion tracking where configured
            </strong>

            <p>
              Measure defined actions when conversion tracking is
              correctly configured for the campaign.
            </p>
          </div>

          <div>
            <span>
              Commercial
            </span>

            <strong>
              Revenue, commission, or delivery terms where relevant
            </strong>

            <p>
              Commercial reporting depends on the campaign model
              and the terms agreed with Poster.
            </p>
          </div>
        </div>
      </section>

      <section className={styles.finalSection}>
        <aside className={styles.portalPanelLarge}>
          <div>
            <p className={styles.portalEyebrow}>
              Advertiser Portal
            </p>

            <h2>
              Ready to submit
              an advertising request?
            </h2>

            <p>
              Use the dedicated Client workspace to submit requests,
              review campaign status, and see performance information.
            </p>
          </div>

          <a
            href="https://client.getpostar.com"
            className={styles.portalAction}
          >
            Open Advertiser Portal →
          </a>
        </aside>
      </section>
    </div>
  );
}