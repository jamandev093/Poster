import RouteBoundary from "@/components/system/RouteBoundary";

export default function RootLoading() {
  return (
    <RouteBoundary
      variant="loading"
      eyebrow="Poster Client"
      title="Opening Poster Client"
      description="Preparing your secure advertising workspace."
    />
  );
}