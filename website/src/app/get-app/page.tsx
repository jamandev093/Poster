import styles from "./page.module.css";

export const metadata = {
  title: "Get the App",
  description:
    "Discover what Poster can help you do and learn about the upcoming mobile app for Android and iPhone.",
};

export default function GetAppPage() {
  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.heroCopy}>
          <p className={styles.eyebrow}>
            Get Poster
          </p>

          <h1>
            A simpler way to discover
            useful knowledge.
          </h1>

          <p className={styles.description}>
            Poster brings relevant discovery, search, trending
            information, saved discoveries, and original sources
            into one mobile experience.
          </p>

          <div className={styles.downloads}>
            <div>
              <span>Android</span>
              <strong>Google Play</strong>
              <small>Coming soon</small>
            </div>

            <div>
              <span>iPhone</span>
              <strong>App Store</strong>
              <small>Coming soon</small>
            </div>
          </div>
        </div>

        <aside className={styles.appOverview}>
          <p className={styles.overviewEyebrow}>
            What you can do
          </p>

          <div>
            <strong>Discover</strong>
            <span>
              Find useful information around your interests.
            </span>
          </div>

          <div>
            <strong>Search</strong>
            <span>
              Explore topics and sources when you need something specific.
            </span>
          </div>

          <div>
            <strong>Trending</strong>
            <span>
              See information gaining attention across discovery.
            </span>
          </div>

          <div>
            <strong>Save</strong>
            <span>
              Bookmark discoveries you want to return to later.
            </span>
          </div>

          <div>
            <strong>Visit the source</strong>
            <span>
              Continue directly to the original publisher.
            </span>
          </div>
        </aside>
      </section>

      <section className={styles.whySection}>
        <div>
          <p className={styles.eyebrow}>
            Why use Poster?
          </p>

          <h2>
            Spend less time searching
            everywhere yourself.
          </h2>
        </div>

        <div className={styles.copy}>
          <p>
            Useful information is spread across countless sources.
            Poster is designed to help organize discovery around
            relevance and your interests.
          </p>

          <p>
            Rather than replacing publishers, Poster helps you find
            something worth exploring and then continue to the source
            that created it.
          </p>
        </div>
      </section>
    </div>
  );
}