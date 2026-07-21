"use client";

import type {
  CSSProperties,
} from "react";

interface SignalContactProps {
  variant?: "sidebar" | "card";
}

const SIGNAL_CONTACT_URL =
  process.env
    .NEXT_PUBLIC_SIGNAL_CONTACT_URL
    ?.trim() ?? "";

const SIGNAL_CONTACT_LABEL =
  process.env
    .NEXT_PUBLIC_SIGNAL_CONTACT_LABEL
    ?.trim() ||
  "Contact us on Signal";

export default function SignalContact({
  variant = "card",
}: SignalContactProps) {
  const isSidebar =
    variant === "sidebar";

  const containerStyle:
    CSSProperties =
    isSidebar
      ? {
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          gap: 7,
          marginTop: 14,
          paddingTop: 14,
          borderTop:
            "1px solid #E2E8F0",
        }
      : {
          display: "flex",
          alignItems: "center",
          justifyContent:
            "space-between",
          gap: 20,
          flexWrap: "wrap",
          padding: 20,
          border:
            "1px solid #E2E8F0",
          borderRadius: 10,
          background: "#FFFFFF",
        };

  const titleStyle:
    CSSProperties = {
    color: "#0F172A",
    fontSize: isSidebar
      ? 13
      : 15,
    lineHeight: isSidebar
      ? "19px"
      : "22px",
    fontWeight: 700,
  };

  const descriptionStyle:
    CSSProperties = {
    margin: 0,
    color: "#64748B",
    fontSize: isSidebar
      ? 12
      : 13,
    lineHeight: isSidebar
      ? "18px"
      : "20px",
  };

  const linkStyle:
    CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    minHeight: 38,
    padding: "8px 13px",
    border: "1px solid #C9DAFA",
    borderRadius: 8,
    background: "#F8FAFF",
    color: "#285CC4",
    fontSize: 13,
    lineHeight: "19px",
    fontWeight: 650,
    textDecoration: "none",
  };

  return (
    <div style={containerStyle}>
      <div>
        <div style={titleStyle}>
          Need help?
        </div>

        <p style={descriptionStyle}>
          Contact Copyright Support on
          Signal. Include your claim
          reference when asking about a
          submitted request.
        </p>
      </div>

      {SIGNAL_CONTACT_URL ? (
        <a
          href={SIGNAL_CONTACT_URL}
          target="_blank"
          rel="noopener noreferrer"
          style={linkStyle}
        >
          {SIGNAL_CONTACT_LABEL}
        </a>
      ) : (
        <span
          aria-disabled="true"
          style={{
            ...linkStyle,
            cursor: "not-allowed",
            background: "#F8FAFC",
            color: "#94A3B8",
          }}
        >
          Signal contact setup pending
        </span>
      )}
    </div>
  );
}