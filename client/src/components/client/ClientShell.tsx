"use client";

import type {
  ReactNode,
} from "react";

import Link from "next/link";
import {
  usePathname,
} from "next/navigation";

import SignalContact from "./SignalContact";
import styles from "./ClientShell.module.css";

interface ClientShellProps {
  children: ReactNode;
}

type NavigationIcon =
  | "dashboard"
  | "requests"
  | "new"
  | "campaigns"
  | "performance"
  | "account";

interface NavigationItem {
  href: string;
  label: string;
  icon: NavigationIcon;
}

const navigation: NavigationItem[] = [
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: "dashboard",
  },
  {
    href: "/requests",
    label: "Requests",
    icon: "requests",
  },
  {
    href: "/requests/new",
    label: "New request",
    icon: "new",
  },
  {
    href: "/campaigns",
    label: "Campaigns",
    icon: "campaigns",
  },
  {
    href: "/performance",
    label: "Performance",
    icon: "performance",
  },
  {
    href: "/account",
    label: "Account",
    icon: "account",
  },
];

function findActiveItem(
  pathname: string
): NavigationItem {
  const matching =
    navigation
      .filter(
        (
          item
        ) =>
          pathname ===
            item.href ||
          pathname.startsWith(
            `${item.href}/`
          )
      )
      .sort(
        (
          first,
          second
        ) =>
          second.href.length -
          first.href.length
      );

  return (
    matching[0] ??
    navigation[0]
  );
}

function NavIcon({
  name,
}: {
  name: NavigationIcon;
}) {
  if (
    name ===
    "dashboard"
  ) {
    return (
      <svg
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <rect
          x="4"
          y="4"
          width="6"
          height="6"
          rx="1"
        />
        <rect
          x="14"
          y="4"
          width="6"
          height="6"
          rx="1"
        />
        <rect
          x="4"
          y="14"
          width="6"
          height="6"
          rx="1"
        />
        <rect
          x="14"
          y="14"
          width="6"
          height="6"
          rx="1"
        />
      </svg>
    );
  }

  if (
    name ===
    "requests"
  ) {
    return (
      <svg
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path d="M7 5h10" />
        <path d="M7 10h10" />
        <path d="M7 15h7" />
        <path d="M5 3h14a2 2 0 0 1 2 2v14H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z" />
      </svg>
    );
  }

  if (
    name ===
    "new"
  ) {
    return (
      <svg
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path d="M12 5v14" />
        <path d="M5 12h14" />
      </svg>
    );
  }

  if (
    name ===
    "campaigns"
  ) {
    return (
      <svg
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path d="M4 7h16" />
        <path d="M4 12h16" />
        <path d="M4 17h10" />
        <rect
          x="3"
          y="4"
          width="18"
          height="16"
          rx="2"
        />
      </svg>
    );
  }

  if (
    name ===
    "performance"
  ) {
    return (
      <svg
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path d="M4 19V5" />
        <path d="M4 19h16" />
        <path d="m7 15 4-4 3 2 5-6" />
      </svg>
    );
  }

  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <circle
        cx="12"
        cy="8"
        r="4"
      />
      <path d="M4.5 20c.8-4 3.3-6 7.5-6s6.7 2 7.5 6" />
    </svg>
  );
}

export default function ClientShell({
  children,
}: ClientShellProps) {
  const pathname =
    usePathname();

  const activeItem =
    findActiveItem(
      pathname
    );

  return (
    <div className={styles.shell}>
      <aside className={styles.sidebar}>
        <div className={styles.brand}>
          <Link
            href="/dashboard"
            className={styles.brandLink}
          >
            <span className={styles.brandMark}>
              P
            </span>

            <span className={styles.brandText}>
              <strong>
                Poster
              </strong>

              <small>
                Client
              </small>
            </span>
          </Link>
        </div>

        <div className={styles.navSection}>
          <div className={styles.navLabel}>
            Workspace
          </div>

          <nav
            className={styles.navigation}
            aria-label="Client navigation"
          >
            {navigation.map(
              (
                item
              ) => {
                const active =
                  activeItem.href ===
                  item.href;

                return (
                  <Link
                    key={
                      item.href
                    }
                    href={
                      item.href
                    }
                    title={
                      item.label
                    }
                    aria-current={
                      active
                        ? "page"
                        : undefined
                    }
                    className={
                      active
                        ? styles.navigationItemActive
                        : styles.navigationItem
                    }
                  >
                    <span
                      className={
                        styles.navigationIcon
                      }
                    >
                      <NavIcon
                        name={
                          item.icon
                        }
                      />
                    </span>

                    <span>
                      {
                        item.label
                      }
                    </span>
                  </Link>
                );
              }
            )}
          </nav>
        </div>

        <div className={styles.sidebarBottom}>
          <div className={styles.supportLabel}>
            Support
          </div>

          <div className={styles.support}>
            <SignalContact />
          </div>

          <div className={styles.profile}>
            <div className={styles.profileAvatar}>
              AM
            </div>

            <div className={styles.profileText}>
              <strong>
                Aarav Mehta
              </strong>

              <span>
                Example Cloud
              </span>
            </div>
          </div>
        </div>
      </aside>

      <div className={styles.workspace}>
        <header className={styles.topbar}>
          <strong className={styles.topbarTitle}>
            {activeItem.label}
          </strong>

          <div className={styles.organizationContext}>
            <div className={styles.organizationAvatar}>
              EC
            </div>

            <div className={styles.organizationText}>
              <strong>
                Example Cloud
              </strong>

              <span>
                Client account
              </span>
            </div>
          </div>
        </header>

        <main className={styles.content}>
          {children}
        </main>
      </div>
    </div>
  );
}