import RouteBoundary from "@/components/system/RouteBoundary";

export default function PortalLoading() {
  return (
    <RouteBoundary
      contained
      variant="loading"
      eyebrow="Client workspace"
      title="Loading workspace"
      description="Preparing the latest requests, campaigns, performance, and financial information."
    />
  );
}