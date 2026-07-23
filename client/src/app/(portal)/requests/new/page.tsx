import NewRequestForm from "@/features/requests/NewRequestForm";

import {
  getRequestTypeLabel,
} from "@/features/workspace/workspace.formatters";

import {
  clientCanEditRequest,
  getRequestById,
} from "@/features/workspace/workspace.selectors";

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
      ? getRequestById(
          requestedEditId
        )
      : undefined;

  const editableRequest =
    requestedRecord &&
    clientCanEditRequest(
      requestedRecord
    )
      ? requestedRecord
      : undefined;

  return (
    <>
      <header className="pageHeader">
        <div>
          <div className="pageEyebrow">
            {editableRequest
              ? editableRequest.id
              : "Advertising request"}
          </div>

          <h1 className="pageTitle">
            {editableRequest
              ? "Update requested changes"
              : "Submit advertising request"}
          </h1>

          <p className="pageDescription">
            {editableRequest
              ? `${getRequestTypeLabel(
                  editableRequest.type
                )} · Correct the items Poster requested and resubmit for review.`
              : "Send a Direct Sponsorship or Affiliate proposal to Poster for review."}
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