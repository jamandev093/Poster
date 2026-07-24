"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  useEffect,
  useState,
} from "react";

import type {
  ReactNode,
} from "react";

import styles from "./WebsiteShell.module.css";

interface WebsiteShellProps {
  children: ReactNode;
}

interface NavigationItem {
  href: string;
  label: string;
}

const primaryNavigation: NavigationItem[] = [
  {
    href: "/",
    label: "Home",
  },
  {
    href: "/about",
    label: "About",
  },
  {
    href: "/how-it-works",
    label: "How Poster Works",
  },
  {
    href: "/get-app",
    label: "Get App",
  },
  {
    href: "/publishers",
    label: "Publishers",
  },
  {
    href: "/advertisers",
    label: "Advertisers",
  },
  {
    href: "/copyright",
    label: "Copyright & Rights",
  },
  {
    href: "/contact",
    label: "Contact",
  },
];

const legalNavigation: NavigationItem[] = [
  {
    href: "/privacy",
    label: "Privacy Policy",
  },
  {
    href: "/terms",
    label: "Terms",
  },
];

function isActiveRoute(
  pathname: string,
  href: string
): boolean {
  if (href === "/") {
    return pathname === "/";
  }

  return (
    pathname === href ||
    pathname.startsWith(`${href}/`)
  );
}

export default function WebsiteShell({
  children,
}: WebsiteShellProps) {
  const pathname =
    usePathname();

  const [
    mobileMenuOpen,
    setMobileMenuOpen,
  ] =
    useState(false);

  useEffect(
    () => {
      if (!mobileMenuOpen) {
        return;
      }

      const previousOverflow =
        document.body.style.overflow;

      document.body.style.overflow =
        "hidden";

      return () => {
        document.body.style.overflow =
          previousOverflow;
      };
    },
    [
      mobileMenuOpen,
    ]
  );

  const closeMobileMenu =
    () => {
      setMobileMenuOpen(false);
    };

  const renderNavigationItem = (
    item: NavigationItem
  ) => {
    const active =
      isActiveRoute(
        pathname,
        item.href
      );

    return (
      <Link
        key={item.href}
        href={item.href}
        className={
          active
            ? styles.navigationLinkActive
            : styles.navigationLink
        }
        aria-current={
          active
            ? "page"
            : undefined
        }
        onClick={
          closeMobileMenu
        }
      >
        {item.label}
      </Link>
    );
  };

  return (
    <div className={styles.shell}>
      <aside
        className={styles.sidebar}
        aria-label="Website navigation"
      >
        <div
          className={styles.sidebarInner}
        >
          <Link
            href="/"
            className={styles.siteIdentity}
          >
            <strong>
              getpostar.com
            </strong>

            <span>
              Knowledge discovery
            </span>
          </Link>

          <nav
            className={styles.primaryNavigation}
            aria-label="Primary navigation"
          >
            {primaryNavigation.map(
              renderNavigationItem
            )}
          </nav>

          <div
            className={styles.sidebarBottom}
          >
            <div
              className={styles.sidebarDivider}
            />

            <nav
              className={styles.legalNavigation}
              aria-label="Legal navigation"
            >
              {legalNavigation.map(
                renderNavigationItem
              )}
            </nav>

            <p
              className={styles.copyright}
            >
              © 2026 Poster
            </p>
          </div>
        </div>
      </aside>

      <header
        className={styles.mobileHeader}
      >
        <button
          type="button"
          className={styles.menuButton}
          aria-label="Open navigation"
          aria-expanded={
            mobileMenuOpen
          }
          onClick={() =>
            setMobileMenuOpen(true)
          }
        >
          <span />
          <span />
          <span />
        </button>

        <Link
          href="/"
          className={styles.mobileIdentity}
          onClick={
            closeMobileMenu
          }
        >
          getpostar.com
        </Link>
      </header>

      {mobileMenuOpen ? (
        <div
          className={styles.mobileOverlay}
          role="presentation"
          onClick={
            closeMobileMenu
          }
        >
          <aside
            className={styles.mobileDrawer}
            aria-label="Mobile website navigation"
            onClick={(
              event
            ) =>
              event.stopPropagation()
            }
          >
            <div
              className={styles.mobileDrawerHeader}
            >
              <Link
                href="/"
                className={styles.siteIdentity}
                onClick={
                  closeMobileMenu
                }
              >
                <strong>
                  getpostar.com
                </strong>

                <span>
                  Knowledge discovery
                </span>
              </Link>

              <button
                type="button"
                className={styles.closeButton}
                aria-label="Close navigation"
                onClick={
                  closeMobileMenu
                }
              >
                ×
              </button>
            </div>

            <nav
              className={styles.primaryNavigation}
              aria-label="Mobile primary navigation"
            >
              {primaryNavigation.map(
                renderNavigationItem
              )}
            </nav>

            <div
              className={styles.mobileDrawerBottom}
            >
              <div
                className={styles.sidebarDivider}
              />

              <nav
                className={styles.legalNavigation}
                aria-label="Mobile legal navigation"
              >
                {legalNavigation.map(
                  renderNavigationItem
                )}
              </nav>

              <p
                className={styles.copyright}
              >
                © 2026 Poster
              </p>
            </div>
          </aside>
        </div>
      ) : null}

      <main
        className={styles.main}
      >
        {children}
      </main>
    </div>
  );
}