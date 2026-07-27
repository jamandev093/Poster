"use client";

import RouteBoundary from "@/components/system/RouteBoundary";

interface AuthErrorProps {
  error:
    Error & {
      digest?:
        string;
    };

  reset:
    () => void;
}

export default function AuthError({
  error,
  reset,
}: AuthErrorProps) {
  void error;

  return (
    <RouteBoundary
      variant="error"
      eyebrow="Account access"
      title="This account page could not be opened"
      description="A temporary error interrupted the account flow. Retry the page or return to sign in."
      actionLabel="Try again"
      onAction={reset}
      secondaryHref="/login"
      secondaryLabel="Go to sign in"
    />
  );
}