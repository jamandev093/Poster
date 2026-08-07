import styles from "./page.module.css";

export const metadata = {
  title: "Get the App",

  description:
    "Learn about Poster mobile app release readiness for Android and iPhone.",

  alternates: {
    canonical: "/get-app",
  },

  openGraph: {
    title: "Get the Poster App",

    description:
      "Discover useful knowledge, personalize your interests, save what matters, and continue to original sources.",

    url: "/get-app",
  },
};

type StoreCardProps = {
  platform: string;
  storeName: string;
  href: string | null;
  pendingText: string;
};

function normalizeOptionalUrl(
  value: string | undefined
) {
  const trimmed =
    value?.trim() ??
    "";

  return trimmed.length > 0
    ? trimmed
    : null;
}

function StoreCard(
  props: StoreCardProps
) {
  if (props.href) {
    return (
      <a
        className={styles.storeCard}
        href={props.href}
        target="_blank"
        rel="noreferrer"
      >
        <span>{props.platform}</span>
        <strong>{props.storeName}</strong>
        <small>Open official store listing</small>
      </a>
    );
  }

  return (
    <div
      className={`${styles.storeCard} ${styles.pendingStore}`}
      aria-disabled="true"
    >
      <span>{props.platform}</span>
      <strong>{props.storeName}</strong>
      <small>{props.pendingText}</small>
    </div>
  );
}

function QrAction(
  props: {
    href: string | null;
  }
) {
  if (props.href) {
    return (
      <a
        className={styles.qrAction}
        href={props.href}
        target="_blank"
        rel="noreferrer"
      >
        Open app QR link
      </a>
    );
  }

  return (
    <span className={styles.qrPending}>
      QR link will be added after official store listings are live.
    </span>
  );
}

export default function GetAppPage() {
  const playStoreUrl =
    normalizeOptionalUrl(
      process.env.NEXT_PUBLIC_POSTER_PLAY_STORE_URL
    );

  const appStoreUrl =
    normalizeOptionalUrl(
      process.env.NEXT_PUBLIC_POSTER_APP_STORE_URL
    );

  const appQrUrl =
    normalizeOptionalUrl(
      process.env.NEXT_PUBLIC_POSTER_APP_QR_URL
    );

  const hasStoreLinks =
    Boolean(
      playStoreUrl ||
      appStoreUrl
    );

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

          <div className={styles.releaseStatus}>
            <span>
              Mobile release status
            </span>

            <strong>
              Store listings are pending official release.
            </strong>

            <p>
              This page will link to the official Android and iPhone
              listings only after the mobile release assets are ready
              and the listings are approved.
            </p>
          </div>

          <div
            className={styles.downloads}
            aria-label="Poster mobile app store availability"
          >
            <StoreCard
              platform="Android"
              storeName="Google Play"
              href={playStoreUrl}
              pendingText="Store listing pending"
            />

            <StoreCard
              platform="iPhone"
              storeName="App Store"
              href={appStoreUrl}
              pendingText="Store listing pending"
            />
          </div>

          <div className={styles.qrPanel}>
            <div>
              <span>
                QR access
              </span>

              <strong>
                {hasStoreLinks
                  ? "Use the official store links above."
                  : "QR access is not published yet."}
              </strong>
            </div>

            <QrAction href={appQrUrl} />
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
