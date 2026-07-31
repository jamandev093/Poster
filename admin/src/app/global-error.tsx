"use client";

interface GlobalErrorProps {
  error: Error & {
    digest?: string;
  };
  reset: () => void;
}

export default function GlobalError({
  error,
  reset,
}: GlobalErrorProps) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          padding: "24px",
          color: "#0f172a",
          background: "#f8fafc",
          fontFamily:
            '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        }}
      >
        <main
          role="alert"
          style={{
            width: "min(520px, 100%)",
            padding: "28px",
            textAlign: "center",
            background: "#ffffff",
            border: "1px solid #e2e8f0",
            borderRadius: "12px",
          }}
        >
          <p
            style={{
              margin: "0 0 8px",
              color: "#5b86e5",
              fontSize: "12px",
              fontWeight: 700,
              textTransform: "uppercase",
            }}
          >
            Poster Admin
          </p>

          <h1
            style={{
              margin: 0,
              fontSize: "22px",
            }}
          >
            The Admin application encountered an error
          </h1>

          <p
            style={{
              margin: "12px 0 0",
              color: "#64748b",
              lineHeight: 1.6,
            }}
          >
            Retry the application. A persistent failure
            should be investigated through production
            monitoring and server logs.
          </p>

          {error.digest ? (
            <p
              style={{
                color: "#64748b",
                fontSize: "12px",
              }}
            >
              Reference: {error.digest}
            </p>
          ) : null}

          <button
            type="button"
            onClick={reset}
            style={{
              minHeight: "40px",
              marginTop: "20px",
              padding: "0 16px",
              color: "#ffffff",
              background: "#5b86e5",
              border: "1px solid #5b86e5",
              borderRadius: "7px",
              font: "inherit",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Retry application
          </button>
        </main>
      </body>
    </html>
  );
}
