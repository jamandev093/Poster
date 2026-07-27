"use client";

import Link from "next/link";

import {
  usePathname,
} from "next/navigation";

import styles from "./PaymentsNavigation.module.css";

interface PaymentsNavigationItem {
  href:
    string;

  label:
    string;
}

const paymentNavigationItems:
  PaymentsNavigationItem[] = [
    {
      href:
        "/payments",

      label:
        "Overview",
    },
    {
      href:
        "/payments/invoices",

      label:
        "Invoices",
    },
    {
      href:
        "/payments/history",

      label:
        "Payment history",
    },
    {
      href:
        "/payments/balances",

      label:
        "Campaign balances",
    },
    {
      href:
        "/payments/refunds",

      label:
        "Refunds",
    },
    {
      href:
        "/payments/ledger",

      label:
        "Ledger activity",
    },
  ];

function isPaymentRouteActive(
  pathname:
    string,
  href:
    string
): boolean {
  if (
    href ===
    "/payments"
  ) {
    return pathname ===
      href;
  }

  return (
    pathname ===
      href ||
    pathname.startsWith(
      `${href}/`
    )
  );
}

export function PaymentsNavigation() {
  const pathname =
    usePathname();

  return (
    <nav
      aria-label="Payments workspace"
      className={
        styles.navigation
      }
    >
      {paymentNavigationItems.map(
        (
          item
        ) => {
          const active =
            isPaymentRouteActive(
              pathname,
              item.href
            );

          return (
            <Link
              aria-current={
                active
                  ? "page"
                  : undefined
              }
              className={
                active
                  ? styles.activeLink
                  : styles.link
              }
              href={
                item.href
              }
              key={
                item.href
              }
            >
              {item.label}
            </Link>
          );
        }
      )}
    </nav>
  );
}