"use client";

import Link from "next/link";

import NewRequestForm from "./NewRequestForm";

import {
  canEditClientCommercialRequest,
  mapClientCommercialRequestToCommercialRequest,
} from "./client-commercial-request.mapper";

import {
  useClientCommercialRequest,
} from "./useClientCommercialRequest";

import {
  getRequestTypeLabel,
} from "@/features/workspace/workspace.formatters";

interface NewRequestBackendEntryProps {
  editRequestId:
    string |
    null;
}

export default function NewRequestBackendEntry({
  editRequestId,
}: NewRequestBackendEntryProps) {
  const {
    request,
    isLoading,
    isRefreshing,
    errorMessage,
    refresh,
  } =
    useClientCommercialRequest(
      editRequestId
    );

  const editableRequest =
    request &&
    canEditClientCommercialRequest(
      request
    )
      ? mapClientCommercialRequestToCommercialRequest(
          request
        )
      : undefined;

  const isEditMode =
    Boolean(
      editRequestId
    );

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

      {isEditMode &&
      isLoading ? (
        <div
          className="statePanel"
          role="status"
        >
          Loading request from Poster Backend.
        </div>
      ) : null}

      {isEditMode &&
      errorMessage ? (
        <div
          className="statePanel"
          role="alert"
        >
          <strong>
            Request could not be loaded
          </strong>

          <p>
            {errorMessage}
          </p>

          <button
            type="button"
            className="secondaryButton"
            onClick={
              () => {
                void refresh();
              }
            }
            disabled={
              isRefreshing
            }
          >
            {isRefreshing
              ? "Refreshing..."
              : "Retry"}
          </button>
        </div>
      ) : null}

      {isEditMode &&
      request &&
      !editableRequest ? (
        <div
          className="statePanel"
          role="status"
        >
          <strong>
            This request cannot be edited
          </strong>

          <p>
            Poster only allows Client corrections when Admin requests changes.
          </p>

          <Link
            href={`/requests/${request.id}`}
            className="secondaryButton"
          >
            View request
          </Link>
        </div>
      ) : null}

      {!isEditMode ||
      editableRequest ? (
        <NewRequestForm
          initialRequest={
            editableRequest
          }
        />
      ) : null}
    </>
  );
}