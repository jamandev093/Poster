import styles from "./page.module.css";

export const metadata = {
  title:
    "Get the App",

  description:
    "Learn about the Poster mobile app and its knowledge discovery experience.",
};

export default function GetAppPage() {
  return (
    <div
      className={styles.page}
    >
      <section
        className={styles.hero}
      >
        <p
          className={styles.eyebrow}
        >
          Get Poster
        </p>

        <h1>
          Knowledge discovery,
          wherever you are.
        </h1>

        <p
          className={styles.description}
        >
          Discover useful information,
          personalize your interests,
          save what matters, and continue
          directly to trusted original
          sources.
        </p>

        <div
          className={styles.downloads}
        >
          <div>
            <strong>
              Google Play
            </strong>

            <span>
              Coming soon
            </span>
          </div>

          <div>
            <strong>
              App Store
            </strong>

            <span>
              Coming soon
            </span>
          </div>
        </div>
      </section>

      <section
        className={styles.features}
      >
        <div>
          <span>
            Discover
          </span>

          <p>
            Find relevant information from
            trusted sources.
          </p>
        </div>

        <div>
          <span>
            Personalize
          </span>

          <p>
            Shape discovery around your
            interests.
          </p>
        </div>

        <div>
          <span>
            Save
          </span>

          <p>
            Keep useful discoveries available
            for later.
          </p>
        </div>

        <div>
          <span>
            Visit the source
          </span>

          <p>
            Continue directly to the original
            publisher.
          </p>
        </div>
      </section>
    </div>
  );
}