"use client";

import {
  type KeyboardEvent as ReactKeyboardEvent,
  type ReactNode,
  useEffect,
  useId,
  useRef,
} from "react";

import styles from "./AdminDrawer.module.css";

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(",");

interface AdminDrawerProps {
  open: boolean;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  closeLabel?: string;
  width?: "standard" | "wide";
  showHeader?: boolean;
  contentPadding?: "default" | "none";
  onClose: () => void;
}

export default function AdminDrawer({
  open,
  title,
  description,
  children,
  footer,
  closeLabel = "Close drawer",
  width = "standard",
  showHeader = true,
  contentPadding = "default",
  onClose,
}: AdminDrawerProps) {
  const titleId = useId();
  const descriptionId = useId();
  const drawerRef = useRef<HTMLElement>(null);
  const previouslyFocusedElementRef =
    useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    previouslyFocusedElementRef.current =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;

    const previousOverflow =
      document.body.style.overflow;

    document.body.style.overflow = "hidden";

    const focusTimer = window.setTimeout(() => {
      const drawer = drawerRef.current;

      if (!drawer) {
        return;
      }

      const firstFocusable =
        drawer.querySelector<HTMLElement>(
          FOCUSABLE_SELECTOR
        );

      (firstFocusable ?? drawer).focus();
    }, 0);

    const handleDocumentKeyDown = (
      event: KeyboardEvent
    ) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      }
    };

    document.addEventListener(
      "keydown",
      handleDocumentKeyDown
    );

    return () => {
      window.clearTimeout(focusTimer);

      document.removeEventListener(
        "keydown",
        handleDocumentKeyDown
      );

      document.body.style.overflow =
        previousOverflow;

      window.setTimeout(() => {
        previouslyFocusedElementRef.current?.focus();
      }, 0);
    };
  }, [open, onClose]);

  if (!open) {
    return null;
  }

  const handleDrawerKeyDown = (
    event: ReactKeyboardEvent<HTMLElement>
  ) => {
    if (event.key !== "Tab") {
      return;
    }

    const drawer = drawerRef.current;

    if (!drawer) {
      return;
    }

    const focusableElements = Array.from(
      drawer.querySelectorAll<HTMLElement>(
        FOCUSABLE_SELECTOR
      )
    ).filter((element) => {
      return (
        !element.hasAttribute("disabled") &&
        element.getAttribute("aria-hidden") !==
          "true"
      );
    });

    if (focusableElements.length === 0) {
      event.preventDefault();
      drawer.focus();
      return;
    }

    const firstElement = focusableElements[0];
    const lastElement =
      focusableElements[
        focusableElements.length - 1
      ];

    if (
      event.shiftKey &&
      document.activeElement === firstElement
    ) {
      event.preventDefault();
      lastElement.focus();
      return;
    }

    if (
      !event.shiftKey &&
      document.activeElement === lastElement
    ) {
      event.preventDefault();
      firstElement.focus();
    }
  };

  return (
    <div
      className={styles.layer}
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <aside
        ref={drawerRef}
        className={`${styles.drawer} ${
          width === "wide"
            ? styles.drawerWide
            : ""
        }`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={
          description
            ? descriptionId
            : undefined
        }
        tabIndex={-1}
        onKeyDown={handleDrawerKeyDown}
      >
        {showHeader ? (
          <header className={styles.header}>
            <div className={styles.heading}>
              <h2 id={titleId}>{title}</h2>

              {description ? (
                <p id={descriptionId}>
                  {description}
                </p>
              ) : null}
            </div>

            <button
              type="button"
              className={styles.closeButton}
              aria-label={closeLabel}
              onClick={onClose}
            >
              <span aria-hidden="true">×</span>
            </button>
          </header>
        ) : (
          <>
            <h2
              id={titleId}
              className={styles.srOnly}
            >
              {title}
            </h2>

            {description ? (
              <p
                id={descriptionId}
                className={styles.srOnly}
              >
                {description}
              </p>
            ) : null}
          </>
        )}

        <div
          className={
            contentPadding === "none"
              ? styles.bodyNoPadding
              : showHeader
                ? styles.body
                : styles.bodyFlush
          }
        >
          {children}
        </div>

        {footer ? (
          <footer className={styles.footer}>
            {footer}
          </footer>
        ) : null}
      </aside>
    </div>
  );
}

