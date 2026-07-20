"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ReactNode,
  useState,
} from "react";

interface AdminShellProps {
  children: ReactNode;
}

const items = [
  ["/", "Dashboard"],
  ["/content", "Content"],
  ["/sources", "Sources"],
  ["/copyright", "Copyright"],
  ["/monetization", "Monetization"],
  ["/reports", "Reports"],
  ["/users", "Users"],
  ["/system-status", "System Status"],
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
    pathname ===
      "/copyright-request" ||
    pathname.startsWith(
      "/copyright-request/"
    )
  );
}

export default function AdminShell({
  children,
}: AdminShellProps) {
  const pathname =
    usePathname();

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
    items.find(
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
          {items.map(
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
                Systems normal
              </strong>

              <span>
                No critical issues
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

          <div className="operator">
            <div className="operator-mark">
              A
            </div>

            <div>
              <strong>
                Admin
              </strong>

              <span>
                Single operator
              </span>
            </div>
          </div>
        </header>

        <main className="main">
          {children}
        </main>
      </div>
    </div>
  );
}