"use client";

import type {
  ReactNode,
} from "react";

import Link from "next/link";

import {
  usePathname,
} from "next/navigation";

import {
  workspaceAccountProfile,
} from "@/features/workspace/workspace.account";

import {
  getCurrentOrganization,
} from "@/features/workspace/workspace.selectors";

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

];

function findActiveItem(
  pathname: string
): NavigationItem {
  const matches =
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
    matches[0] ??
    navigation[0]
  );
}

function getInitials(
  value: string
): string {
  const parts =
    value
      .trim()
      .split(/\s+/)
      .filter(Boolean);

  if (
    parts.length ===
    0
  ) {
    return "PC";
  }

  if (
    parts.length ===
    1
  ) {
    return parts[0]
      .slice(
        0,
        2
      )
      .toUpperCase();
  }

  return `${parts[0][0]}${parts[1][0]}`
    .toUpperCase();
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
        <path d="M6 5h12" />
        <path d="M6 10h12" />
        <path d="M6 15h8" />

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
        <rect
          x="4"
          y="5"
          width="16"
          height="14"
          rx="2"
        />

        <path d="M8 9h8" />
        <path d="M8 13h8" />
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

  const organization =
    getCurrentOrganization();

  const primaryClient =
    workspaceAccountProfile
      .primaryClient;

  const profileInitials =
    getInitials(
      primaryClient.fullName
    );

  return (
    <div
      className={
        styles.shell
      }
    >
      <aside
        className={
          styles.sidebar
        }
      >
        <div
          className={
            styles.brand
          }
        >
          <Link
            href="/dashboard"
            className={
              styles.brandLink
            }
            aria-label="Poster Client dashboard"
          >
            <span
              className={
                styles.brandMark
              }
            >
              P
            </span>

            <span
              className={
                styles.brandText
              }
            >
              <strong>
                Poster
              </strong>

              <small>
                Client
              </small>
            </span>
          </Link>
        </div>

        <nav
          className={
            styles.navigation
          }
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

        <div
          className={
            styles.sidebarBottom
          }
        >
          <div
            className={
              styles.support
            }
          >
            <SignalContact />
          </div>

          <Link
            href="/account"
            className={
              styles.profile
            }
            aria-label={`Open account for ${primaryClient.fullName}`}
          >
            <div
              className={
                styles.profileAvatar
              }
            >
              {
                profileInitials
              }
            </div>

            <div
              className={
                styles.profileText
              }
            >
              <strong>
                {
                  primaryClient.fullName
                }
              </strong>

              <span>
                {
                  organization.name
                }
              </span>
            </div>

            <span
              className={
                styles.profileArrow
              }
              aria-hidden="true"
            >
              â€º
            </span>
          </Link>
        </div>
      </aside>

      <main
        className={
          styles.workspace
        }
      >
        <div
          className={
            styles.content
          }
        >
          {children}
        </div>
      </main>
    </div>
  );
}
