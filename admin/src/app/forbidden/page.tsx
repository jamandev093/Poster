"use client";

import useAdminAuth from "@/features/auth/hooks/useAdminAuth";

import styles from "./forbidden.module.css";

export default function ForbiddenPage() {
  const {
    logout,
  } = useAdminAuth();

  return (
    <main className={styles.page}>
      <section className={styles.card}>
        <p>Poster Admin</p>

        <h1>
          Admin access is not permitted
        </h1>

        <span>
          This authenticated account does
          not have the required{" "}
          <strong>admin.access</strong>{" "}
          permission.
        </span>

        <button
          type="button"
          onClick={() => {
            void logout();
          }}
        >
          Sign out
        </button>
      </section>
    </main>
  );
}
