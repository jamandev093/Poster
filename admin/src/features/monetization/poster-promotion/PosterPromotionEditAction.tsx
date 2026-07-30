"use client";

import {
  useState,
} from "react";

import PosterPromotionEditor from "./PosterPromotionEditor";

import type {
  PosterPromotionDraft,
} from "./poster-promotion.types";

import styles from "./PosterPromotionEditAction.module.css";

interface PosterPromotionEditActionProps {
  initialDraft:
    PosterPromotionDraft;

  disabled?:
    boolean;

  onSave:
    (
      draft:
        PosterPromotionDraft
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

  const savePromotion = (
    draft:
      PosterPromotionDraft
  ) => {
    props.onSave(
      draft
    );

    setEditorOpen(
      false
    );
  };

  return (
    <>
      <button
        type="button"
        className={
          styles.editButton
        }
        disabled={
          props.disabled
        }
        onClick={() =>
          setEditorOpen(
            true
          )
        }
      >
        Edit promotion
      </button>

      {editorOpen ? (
        <PosterPromotionEditor
          mode="edit"
          initialDraft={
            props.initialDraft
          }
          onClose={() =>
            setEditorOpen(
              false
            )
          }
          onSaveDraft={
            savePromotion
          }
          onSchedule={
            savePromotion
          }
        />
      ) : null}
    </>
  );
}
