"use client";

import RouteBoundary from "@/components/system/RouteBoundary";

interface PortalErrorProps {
  error:
    Error & {
      digest?:
        string;
    };

  reset:
    () => void;
}

export default function PortalError({
  error,
  reset,
}: PortalErrorProps) {
  void error;

  return (
    <RouteBoundary
      contained
      variant="error"
      eyebrow="Client workspace"
      title="This workspace view could not be opened"
      description="The current Client page encountered a temporary error. Your request, campaign, and Wallet records have not been changed."
      actionLabel="Try again"
      onAction={reset}
      secondaryHref="/dashboard"
      secondaryLabel="Open dashboard"
    />
  );
}