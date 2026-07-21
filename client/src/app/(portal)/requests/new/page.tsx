import NewRequestForm from "@/features/requests/NewRequestForm";

import {
  getClientRequestById,
  getRequestTypeLabel,
} from "@/features/requests/request.mock";

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

  const requestedRecord =
    requestedEditId
      ? getClientRequestById(
          requestedEditId
        )
      : undefined;

  const editableRequest =
    requestedRecord?.status ===
    "changes_requested"
      ? requestedRecord
      : undefined;

  return (
    <>
      <header className="pageHeader">
        <div>
          <div className="pageEyebrow">
            {editableRequest
              ? editableRequest.id
              : "Commercial request"}
          </div>

          <h1 className="pageTitle">
            {editableRequest
              ? "Update Request"
              : "New Request"}
          </h1>

          <p className="pageDescription">
            {editableRequest
              ? `${getRequestTypeLabel(
                  editableRequest.type
                )} corrections requested by Admin.`
              : "Submit a direct sponsorship or affiliate proposal."}
          </p>
        </div>
      </header>

      <NewRequestForm
        initialRequest={
          editableRequest
        }
      />
    </>
  );
}