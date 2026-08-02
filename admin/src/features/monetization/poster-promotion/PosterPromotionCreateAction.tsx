"use client";

import {
  useState,
} from "react";

import PosterPromotionEditor from "./PosterPromotionEditor";

import type {
  PosterPromotionDetailResponse,
  PosterPromotionSaveMode,
} from "./poster-promotion.api-types";

import type {
  PosterPromotionDraft,
} from "./poster-promotion.types";

import {
  createPosterPromotion,
} from "./poster-promotion.service";

import {
  getPosterPromotionErrorMessage,
} from "./poster-promotion.errors";

import {
  mapDraftToCreatePosterPromotionRequest,
} from "./poster-promotion.request-mappers";

import styles from "./PosterPromotionCreateAction.module.css";

interface PosterPromotionCreateActionProps {
  organizationId:
    string;

  onCreated:
    (
      record:
        PosterPromotionDetailResponse
    ) => void;
}

export default function PosterPromotionCreateAction(
  props:
    PosterPromotionCreateActionProps
) {
  const [
    editorOpen,
    setEditorOpen,
  ] =
    useState(
      false
    );

  const [
    isSaving,
    setIsSaving,
  ] =
    useState(
      false
    );

  const [
    errorMessage,
    setErrorMessage,
  ] =
    useState<
      string | null
    >(
      null
    );

  const completeCreation =
    async (
      draft:
        PosterPromotionDraft,
      mode:
        PosterPromotionSaveMode
    ) => {
      if (
        !props.organizationId
      ) {
        setErrorMessage(
          "Set NEXT_PUBLIC_POSTER_ORGANIZATION_ID before creating Poster Promotions."
        );

        return;
      }

      setIsSaving(
        true
      );

      setErrorMessage(
        null
      );

      try {
        const created =
          await createPosterPromotion(
            mapDraftToCreatePosterPromotionRequest(
              draft,
              props.organizationId,
              mode
            )
          );

        props.onCreated(
          created
        );

        setEditorOpen(
          false
        );
      } catch (
        error
      ) {
        setErrorMessage(
          getPosterPromotionErrorMessage(
            error
          )
        );
      } finally {
        setIsSaving(
          false
        );
      }
    };

  return (
    <>
      <button
        type="button"
        className={
          styles.createButton
        }
        disabled={
          isSaving ||
          !props.organizationId
        }
        title={
          props.organizationId
            ? undefined
            : "Set NEXT_PUBLIC_POSTER_ORGANIZATION_ID to enable creation."
        }
        onClick={() => {
          setErrorMessage(
            null
          );

          setEditorOpen(
            true
          );
        }}
      >
        {isSaving
          ? "Saving..."
          : "Create promotion"}
      </button>

      {errorMessage ? (
        <span
          role="alert"
          style={{
            display:
              "block",

            marginTop:
              8,

            color:
              "var(--danger)",

            fontSize:
              12,
          }}
        >
          {
            errorMessage
          }
        </span>
      ) : null}

      {editorOpen ? (
        <PosterPromotionEditor
          mode="create"
          onClose={() =>
            setEditorOpen(
              false
            )
          }
          onSaveDraft={draft =>
            void completeCreation(
              draft,
              "draft"
            )
          }
          onSchedule={draft =>
            void completeCreation(
              draft,
              "schedule"
            )
          }
        />
      ) : null}
    </>
  );
}