"use client";

import {
  useState,
} from "react";

import PosterPromotionEditor from "./PosterPromotionEditor";

import type {
  PosterPromotionDraft,
  PosterPromotionStatus,
} from "./poster-promotion.types";

import styles from "./PosterPromotionCreateAction.module.css";

interface PosterPromotionCreateActionProps {
  onCreate:
    (
      draft:
        PosterPromotionDraft,
      status:
        Extract<
          PosterPromotionStatus,
          "draft" | "scheduled"
        >
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

  const completeCreation = (
    draft:
      PosterPromotionDraft,
    status:
      "draft" | "scheduled"
  ) => {
    props.onCreate(
      draft,
      status
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
          styles.createButton
        }
        onClick={() =>
          setEditorOpen(
            true
          )
        }
      >
        Create promotion
      </button>

      {editorOpen ? (
        <PosterPromotionEditor
          mode="create"
          onClose={() =>
            setEditorOpen(
              false
            )
          }
          onSaveDraft={(
            draft
          ) =>
            completeCreation(
              draft,
              "draft"
            )
          }
          onSchedule={(
            draft
          ) =>
            completeCreation(
              draft,
              "scheduled"
            )
          }
        />
      ) : null}
    </>
  );
}
