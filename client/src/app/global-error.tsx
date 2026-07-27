"use client";

import RouteBoundary from "@/components/system/RouteBoundary";

interface GlobalErrorProps {
  error:
    Error & {
      digest?:
        string;
    };

  reset:
    () => void;
}

export default function GlobalError({
  error,
  reset,
}: GlobalErrorProps) {
  void error;

  return (
    <html lang="en">
      <body>
        <RouteBoundary
          variant="error"
          eyebrow="Poster Client"
          title="The application encountered a problem"
          description="Poster Client could not complete the current operation. Retry the application or return to sign in."
          actionLabel="Retry application"
          onAction={reset}
          secondaryHref="/login"
          secondaryLabel="Go to sign in"
        />
      </body>
    </html>
  );
}