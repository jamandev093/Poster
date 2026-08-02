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
  getPosterPromotionErrorMessage,
} from "./poster-promotion.errors";

import {
  mapPosterPromotionDetailToDraft,
} from "./poster-promotion.mappers";

import {
  mapDraftToUpdatePosterPromotionRequest,
} from "./poster-promotion.request-mappers";

import {
  updatePosterPromotion,
} from "./poster-promotion.service";

import styles from "./PosterPromotionEditAction.module.css";

interface PosterPromotionEditActionProps {
  detail:
    PosterPromotionDetailResponse;

  disabled?:
    boolean;

  onUpdated:
    (
      record:
        PosterPromotionDetailResponse
    ) => void;
}

export default function PosterPromotionEditAction(
  props:
    PosterPromotionEditActionProps
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

  const savePromotion =
    async (
      draft:
        PosterPromotionDraft,
      mode:
        PosterPromotionSaveMode
    ) => {
      setIsSaving(
        true
      );

      setErrorMessage(
        null
      );

      try {
        const updated =
          await updatePosterPromotion(
            props.detail.campaign.id,
            mapDraftToUpdatePosterPromotionRequest(
              draft,
              props.detail,
              mode
            )
          );

        props.onUpdated(
          updated
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
          styles.editButton
        }
        disabled={
          props.disabled ||
          isSaving
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
          : "Edit promotion"}
      </button>

      {errorMessage ? (
        <span
          role="alert"
          style={{
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
          mode="edit"
          initialDraft={
            mapPosterPromotionDetailToDraft(
              props.detail
            )
          }
          onClose={() =>
            setEditorOpen(
              false
            )
          }
          onSaveDraft={draft =>
            void savePromotion(
              draft,
              "draft"
            )
          }
          onSchedule={draft =>
            void savePromotion(
              draft,
              "schedule"
            )
          }
        />
      ) : null}
    </>
  );
}