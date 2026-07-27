"use client";

import RouteBoundary from "@/components/system/RouteBoundary";

interface RootErrorProps {
  error:
    Error & {
      digest?:
        string;
    };

  reset:
    () => void;
}

export default function RootError({
  error,
  reset,
}: RootErrorProps) {
  void error;

  return (
    <RouteBoundary
      variant="error"
      eyebrow="Poster Client"
      title="Poster Client could not be opened"
      description="A temporary application error interrupted this page. Try loading it again."
      actionLabel="Try again"
      onAction={reset}
      secondaryHref="/login"
      secondaryLabel="Go to sign in"
    />
  );
}