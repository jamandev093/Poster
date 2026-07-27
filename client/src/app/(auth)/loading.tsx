import RouteBoundary from "@/components/system/RouteBoundary";

export default function AuthLoading() {
  return (
    <RouteBoundary
      variant="loading"
      eyebrow="Account access"
      title="Preparing your account"
      description="Loading the secure Poster Client account page."
    />
  );
}