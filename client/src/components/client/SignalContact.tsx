"use client";

const SIGNAL_URL =
  process.env.NEXT_PUBLIC_SIGNAL_CONTACT_URL?.trim() ?? "";

const SIGNAL_LABEL =
  process.env.NEXT_PUBLIC_SIGNAL_CONTACT_LABEL?.trim() ||
  "Contact us on Signal";

export default function SignalContact() {
  if (!SIGNAL_URL) {
    return (
      <div
        aria-disabled="true"
        style={{
          padding: "12px 13px",
          border: "1px solid #D8E3F5",
          borderRadius: 10,
          background: "#F8FAFF",
        }}
      >
        <strong
          style={{
            display: "block",
            color: "#0F172A",
            fontSize: 13,
            lineHeight: "19px",
          }}
        >
          Contact us on Signal
        </strong>

        <span
          style={{
            display: "block",
            marginTop: 3,
            color: "#94A3B8",
            fontSize: 11,
            lineHeight: "17px",
          }}
        >
          Signal contact setup pending
        </span>
      </div>
    );
  }

  return (
    <a
      href={SIGNAL_URL}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        display: "block",
        padding: "12px 13px",
        border: "1px solid #C9DAFA",
        borderRadius: 10,
        background: "#F8FAFF",
      }}
    >
      <strong
        style={{
          display: "block",
          color: "#285CC4",
          fontSize: 13,
          lineHeight: "19px",
        }}
      >
        {SIGNAL_LABEL}
      </strong>

      <span
        style={{
          display: "block",
          marginTop: 3,
          color: "#64748B",
          fontSize: 11,
          lineHeight: "17px",
        }}
      >
        Campaign and account support
      </span>
    </a>
  );
}