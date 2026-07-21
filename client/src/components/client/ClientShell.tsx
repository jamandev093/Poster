"use client";

import type { ReactNode } from "react";

import Link from "next/link";
import { usePathname } from "next/navigation";

import SignalContact from "./SignalContact";
import styles from "./ClientShell.module.css";

interface ClientShellProps {
  children: ReactNode;
}

interface NavigationItem {
  href: string;
  label: string;
  description: string;
}

const navigation: NavigationItem[] = [
  {
    href: "/dashboard",
    label: "Dashboard",
    description: "Overview",
  },
  {
    href: "/requests",
    label: "Requests",
    description: "Submitted requests",
  },
  {
    href: "/requests/new",
    label: "New Request",
    description: "Submit a campaign",
  },
  {
    href: "/campaigns",
    label: "Campaigns",
    description: "Approved campaigns",
  },
  {
    href: "/performance",
    label: "Performance",
    description: "Delivery and results",
  },
  {
    href: "/account",
    label: "Account",
    description: "Organization details",
  },
];

function findActiveItem(pathname: string): NavigationItem {
  const matching = navigation
    .filter(
      (item) =>
        pathname === item.href ||
        pathname.startsWith(`${item.href}/`)
    )
    .sort((first, second) => second.href.length - first.href.length);

  return matching[0] ?? navigation[0];
}

export default function ClientShell({
  children,
}: ClientShellProps) {
  const pathname = usePathname();
  const activeItem = findActiveItem(pathname);

  return (
    <div className={styles.shell}>
      <aside className={styles.sidebar}>
        <div className={styles.brand}>
          <div className={styles.brandMark}>P</div>

          <div>
            <Link href="/dashboard" className={styles.brandName}>
              Poster
            </Link>

            <span className={styles.brandSection}>Client</span>
          </div>
        </div>

        <div className={styles.organization}>
          <div className={styles.organizationAvatar}>EC</div>

          <div className={styles.organizationText}>
            <strong>Example Cloud</strong>
            <span>Primary organization</span>
          </div>
        </div>

        <nav
          className={styles.navigation}
          aria-label="Client navigation"
        >
          {navigation.map((item) => {
            const active = activeItem.href === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={
                  active
                    ? styles.navigationItemActive
                    : styles.navigationItem
                }
              >
                <span className={styles.navigationMarker} />

                <span className={styles.navigationText}>
                  <strong>{item.label}</strong>
                  <span>{item.description}</span>
                </span>
              </Link>
            );
          })}
        </nav>

        <div className={styles.support}>
          <SignalContact />
        </div>

        <div className={styles.profile}>
          <div className={styles.profileAvatar}>AM</div>

          <div className={styles.profileText}>
            <strong>Aarav Mehta</strong>
            <span>Primary client</span>
          </div>
        </div>
      </aside>

      <div className={styles.workspace}>
        <header className={styles.topbar}>
          <div>
            <span className={styles.topbarEyebrow}>
              Example Cloud
            </span>

            <strong className={styles.topbarTitle}>
              {activeItem.label}
            </strong>
          </div>

          <div className={styles.topbarStatus}>
            <span className={styles.statusDot} />
            Client workspace
          </div>
        </header>

        <main className={styles.content}>{children}</main>
      </div>
    </div>
  );
}