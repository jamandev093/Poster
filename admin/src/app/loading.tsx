import styles from "./route-boundary.module.css";

export default function Loading() {
  return (
    <main
      className={styles.boundary}
      aria-busy="true"
      aria-live="polite"
    >
      <section className={styles.card}>
        <div
          className={styles.loader}
          aria-hidden="true"
        />

        <p className={styles.eyebrow}>
          Poster Admin
        </p>

        <h1>Loading workspace</h1>

        <p>
          Preparing the latest operational view.
        </p>
      </section>
    </main>
  );
}
