import NewRequestBackendEntry from "@/features/requests/NewRequestBackendEntry";

interface NewRequestPageProps {
  searchParams: Promise<{
    edit?: string;
  }>;
}

export default async function NewRequestPage({
  searchParams,
}: NewRequestPageProps) {
  const params =
    await searchParams;

  const requestedEditId =
    params.edit?.trim() ??
    "";

  return (
    <NewRequestBackendEntry
      editRequestId={
        requestedEditId ||
        null
      }
    />
  );
}