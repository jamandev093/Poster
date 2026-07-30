import Link from "next/link";

import styles from "./OperationsFoundation.module.css";

interface OperationsFoundationProps {
  eyebrow: string;
  title: string;
  description: string;
  activeArea:
    | "business-identity"
    | "programs"
    | "promotions"
    | "earnings";
}

const areas = [
  {
    id: "business-identity",
    href: "/operations/business-identity",
    label: "Business Identity",
    description:
      "Maintain Poster’s reusable business and publisher identity.",
  },
  {
    id: "programs",
    href: "/operations/external-promotions/programs",
    label: "Programs",
    description:
      "Record affiliate program applications, account references and payout methods.",
  },
  {
    id: "promotions",
    href: "/operations/external-promotions/promotions",
    label: "Promotions",
    description:
      "Manage external products and services selected by Poster Admin.",
  },
  {
    id: "earnings",
    href: "/operations/external-promotions/earnings",
    label: "Earnings",
    description:
      "Track pending, approved, reversed and paid commissions.",
  },
] as const;

export default function OperationsFoundation({
  eyebrow,
  title,
  description,
  activeArea,
}: OperationsFoundationProps) {
  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <p className={styles.eyebrow}>
          {eyebrow}
        </p>

        <h1 className={styles.title}>
          {title}
        </h1>

        <p className={styles.description}>
          {description}
        </p>
      </header>

      <section
        className={styles.grid}
        aria-label="Operations workspaces"
      >
        {areas.map((area) => {
          const isActive =
            area.id === activeArea;

          return (
            <Link
              key={area.id}
              href={area.href}
              className={`${styles.card} ${
                isActive
                  ? styles.activeCard
                  : ""
              }`}
              aria-current={
                isActive
                  ? "page"
                  : undefined
              }
            >
              <div>
                <h2>
                  {area.label}
                </h2>

                <p>
                  {area.description}
                </p>
              </div>

              <span aria-hidden="true">
                →
              </span>
            </Link>
          );
        })}
      </section>

      <section className={styles.workspace}>
        <div>
          <p className={styles.workspaceLabel}>
            Development status
          </p>

          <h2>
            Workspace foundation ready
          </h2>

          <p>
            This route is isolated from Client
            Affiliate, Direct Sponsorship and
            Poster Promotion workflows.
          </p>
        </div>

        <span className={styles.status}>
          Foundation
        </span>
      </section>
    </main>
  );
}
