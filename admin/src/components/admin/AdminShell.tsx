"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ReactNode,
  useMemo,
  useState,
} from "react";

import useAdminAuth from "@/features/auth/hooks/useAdminAuth";

interface AdminShellProps {
  children: ReactNode;
}

const primaryItems = [
  ["/", "Dashboard"],
  ["/content", "Content"],
  ["/sources", "Sources"],
  ["/copyright", "Copyright"],
] as const;

const monetizationItems = [
  [
    "/monetization/campaigns",
    "Campaigns",
  ],
  [
    "/monetization/analytics",
    "Analytics",
  ],
  [
    "/monetization/sponsorships",
    "Direct Sponsorship",
  ],
  [
    "/monetization/affiliate",
    "Affiliate",
  ],
  [
    "/monetization/poster-promotion",
    "Poster Promotion",
  ],
] as const;

const operationsItems = [
  [
    "/operations/business-identity",
    "Business Identity",
  ],
  [
    "/operations/external-promotions/programs",
    "Programs",
  ],
  [
    "/operations/external-promotions/promotions",
    "Promotions",
  ],
  [
    "/operations/external-promotions/earnings",
    "Earnings",
  ],
] as const;

const utilityItems = [
  ["/reports", "Reports"],
  ["/users", "Users"],
  ["/account", "Account"],
  [
    "/system-status",
    "System Status",
  ],
] as const;

const titleItems = [
  ...primaryItems,
  ...monetizationItems,
  ...operationsItems,
  ...utilityItems,
] as const;

function active(
  pathname: string,
  href: string
) {
  return href === "/"
    ? pathname === "/"
    : pathname === href ||
        pathname.startsWith(
          `${href}/`
        );
}


function isPublicRoute(
  pathname: string
) {
  return (
    pathname === "/login" ||
    pathname.startsWith("/login/") ||
    pathname === "/forbidden" ||
    pathname.startsWith("/forbidden/") ||
    pathname === "/copyright-request" ||
    pathname.startsWith(
      "/copyright-request/"
    ) ||
    pathname === "/advertise" ||
    pathname.startsWith(
      "/advertise/"
    )
  );
}

export default function AdminShell({
  children,
}: AdminShellProps) {
  const pathname =
    usePathname();

  const {
    identity,
  } = useAdminAuth();

  const operatorName =
    identity?.account.fullName ??
    "Admin";

  const operatorInitials =
    useMemo(
      () =>
        operatorName
          .split(/\s+/)
          .filter(Boolean)
          .slice(0, 2)
          .map((part) =>
            part
              .charAt(0)
              .toUpperCase()
          )
          .join(""),
      [operatorName]
    );

  const [
    open,
    setOpen,
  ] =
    useState(false);

  if (
    isPublicRoute(
      pathname
    )
  ) {
    return (
      <>
        {children}
      </>
    );
  }

  const title =
    titleItems.find(
      ([href]) =>
        active(
          pathname,
          href
        )
    )?.[1] ??
    "Poster Admin";

  const closeNavigation =
    () => {
      setOpen(false);
    };

  return (
    <div className="shell">
      <aside
        className={`sidebar ${
          open
            ? "sidebar-open"
            : ""
        }`}
      >
        <div className="brand">
          <div className="brand-mark">
            P
          </div>

          <div className="brand-copy">
            <strong>
              Poster
            </strong>

            <span>
              Admin
            </span>
          </div>
        </div>

        <nav
          className="nav"
          aria-label="Admin navigation"
        >
          {primaryItems.map(
            ([
              href,
              label,
            ]) => {
              const isActive =
                active(
                  pathname,
                  href
                );

              return (
                <Link
                  key={href}
                  href={href}
                  aria-current={
                    isActive
                      ? "page"
                      : undefined
                  }
                  className={`nav-link ${
                    isActive
                      ? "nav-active"
                      : ""
                  }`}
                  onClick={
                    closeNavigation
                  }
                >
                  <span className="nav-dot" />

                  <span>
                    {label}
                  </span>
                </Link>
              );
            }
          )}

          <div className="nav-group">
            <div className="nav-group-title">
              Monetization
            </div>

            {monetizationItems.map(
              ([
                href,
                label,
              ]) => {
                const isActive =
                  active(
                    pathname,
                    href
                  );

                return (
                  <Link
                    key={href}
                    href={href}
                    aria-current={
                      isActive
                        ? "page"
                        : undefined
                    }
                    className={`nav-link nav-sub-link ${
                      isActive
                        ? "nav-active"
                        : ""
                    }`}
                    onClick={
                      closeNavigation
                    }
                  >
                    <span className="nav-dot" />

                    <span>
                      {label}
                    </span>
                  </Link>
                );
              }
            )}
          </div>

          <div className="nav-group">
          <div className="nav-group-title">
            Operations
          </div>

          {operationsItems.map(
            ([
              href,
              label,
            ]) => {
              const isActive =
                active(
                  pathname,
                  href
                );

              return (
                <Link
                  key={href}
                  href={href}
                  aria-current={
                    isActive
                      ? "page"
                      : undefined
                  }
                  className={`nav-link nav-sub-link ${
                    isActive
                      ? "nav-active"
                      : ""
                  }`}
                  onClick={
                    closeNavigation
                  }
                >
                  <span className="nav-dot" />

                  <span>
                    {label}
                  </span>
                </Link>
              );
            }
          )}
        </div>

        {utilityItems.map(
            ([
              href,
              label,
            ]) => {
              const isActive =
                active(
                  pathname,
                  href
                );

              return (
                <Link
                  key={href}
                  href={href}
                  aria-current={
                    isActive
                      ? "page"
                      : undefined
                  }
                  className={`nav-link ${
                    isActive
                      ? "nav-active"
                      : ""
                  }`}
                  onClick={
                    closeNavigation
                  }
                >
                  <span className="nav-dot" />

                  <span>
                    {label}
                  </span>
                </Link>
              );
            }
          )}
        </nav>

        <div className="sidebar-foot">
          <div className="health">
            <i />

            <div>
              <strong>
                Admin healthy
              </strong>

              <span>
                Authentication connected
              </span>
            </div>
          </div>
        </div>
      </aside>

      {open ? (
        <button
          type="button"
          className="backdrop"
          aria-label="Close navigation"
          onClick={
            closeNavigation
          }
        />
      ) : null}

      <div className="workspace">
        <header className="topbar">
          <div className="topbar-left">
            <button
              type="button"
              className="menu"
              aria-label={
                open
                  ? "Close navigation"
                  : "Open navigation"
              }
              aria-expanded={
                open
              }
              onClick={() =>
                setOpen(
                  (value) =>
                    !value
                )
              }
            >
              <span />
              <span />
              <span />
            </button>

            <div className="topbar-copy">
              <small>
                Poster operations
              </small>

              <h1>
                {title}
              </h1>
            </div>
          </div>

          <Link
            href="/account"
            className="operator operator-link"
            aria-label="Open Admin account profile"
          >
            <div className="operator-mark">
              {operatorInitials || "A"}
            </div>

            <div>
              <strong>
                {operatorName}
              </strong>

              <span>
                Account profile
              </span>
            </div>
          </Link>
        </header>

        <main className="main">
          {children}
        </main>
      </div>
    </div>
  );
}



