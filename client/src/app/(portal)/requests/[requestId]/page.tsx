import RequestDetailsBackendEntry from "@/features/requests/RequestDetailsBackendEntry";

interface RequestDetailsPageProps {
  params: Promise<{
    requestId: string;
  }>;
}

export default async function RequestDetailsPage({
  params,
}: RequestDetailsPageProps) {
  const {
    requestId,
  } =
    await params;

  return (
    <RequestDetailsBackendEntry
      requestId={
        requestId
      }
    />
  );
}