"use client";

import type {
  ReactNode,
} from "react";

import Link from "next/link";

import {
  usePathname,
} from "next/navigation";

import styles from "./CopyrightShell.module.css";

interface CopyrightShellProps {
  children: ReactNode;
}

interface NavigationItem {
  href: string;

  label: string;

  description: string;
}

const navigation:
  NavigationItem[] = [
  {
    href: "/",

    label:
      "Copyright Center",

    description:
      "Overview",
  },

  {
    href: "/find",

    label:
      "Find Your Content",

    description:
      "Exact matching",
  },

  {
    href: "/request",

    label:
      "Submit Claim",

    description:
      "Single content claim",
  },

  {
    href:
      "/bulk-removal",

    label:
      "Bulk Removal Request",

    description:
      "Multiple content claims",
  },

  {
    href: "/status",

    label:
      "Check Status",

    description:
      "Track your claim",
  },

  {
    href: "/policy",

    label:
      "Copyright Policy",

    description:
      "Policies & process",
  },
];

function isActivePath(
  pathname: string,
  href: string
): boolean {
  if (
    href === "/"
  ) {
    return pathname ===
      "/";
  }

  return pathname ===
      href ||
    pathname.startsWith(
      `${href}/`
    );
}

export default function CopyrightShell({
  children,
}: CopyrightShellProps) {
  const pathname =
    usePathname();

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
            href="/"
            className={
              styles.brandLink
            }
          >
            Poster
          </Link>

          <span
            className={
              styles.brandSection
            }
          >
            Copyright
          </span>
        </div>

        <nav
          className={
            styles.navigation
          }
          aria-label="Copyright navigation"
        >
          {navigation.map(
            (
              item
            ) => {
              const active =
                isActivePath(
                  pathname,
                  item.href
                );

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
                      ? styles.navItemActive
                      : styles.navItem
                  }
                >
                  <span
                    className={
                      styles.navLabel
                    }
                  >
                    {
                      item.label
                    }
                  </span>

                  <span
                    className={
                      styles.navDescription
                    }
                  >
                    {
                      item.description
                    }
                  </span>
                </Link>
              );
            }
          )}
        </nav>

        <div
          className={
            styles.sidebarFooter
          }
        >
          <strong>
            No account required
          </strong>

          <span>
            Submit and track
            copyright requests
            without creating a
            Poster account.
          </span>
        </div>
      </aside>

      <div
        className={
          styles.workspace
        }
      >
        <header
          className={
            styles.mobileHeader
          }
        >
          <Link
            href="/"
            className={
              styles.mobileBrand
            }
          >
            Poster
          </Link>

          <span>
            Copyright
          </span>
        </header>

        <main
          className={
            styles.main
          }
        >
          {
            children
          }
        </main>
      </div>
    </div>
  );
}