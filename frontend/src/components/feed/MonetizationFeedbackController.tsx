import React, {
  ReactNode,
  useCallback,
  useRef,
  useState,
} from "react";

import MonetizationFeedbackSheet, {
  MonetizationFeedbackReason,
} from "../dialogs/MonetizationFeedbackSheet";

interface ActiveMonetizationReport {
  itemId: string;

  title: string;

  onSubmit: (
    reason:
      MonetizationFeedbackReason
  ) => void;
}

interface MonetizationFeedbackControllerProps {
  children: (
    openReport: (
      report:
        ActiveMonetizationReport
    ) => void
  ) => ReactNode;
}

export default function MonetizationFeedbackController({
  children,
}: MonetizationFeedbackControllerProps) {
  const [
    activeReport,
    setActiveReport,
  ] =
    useState<
      ActiveMonetizationReport
      | null
    >(null);

  const selectionLockedRef =
    useRef(false);

  const openReport =
    useCallback(
      (
        report:
          ActiveMonetizationReport
      ) => {
        selectionLockedRef.current =
          false;

        setActiveReport(report);
      },
      []
    );

  const closeReport =
    useCallback(() => {
      if (
        selectionLockedRef.current
      ) {
        return;
      }

      setActiveReport(null);
    }, []);

  const handleSelectReason =
    useCallback(
      (
        reason:
          MonetizationFeedbackReason
      ) => {
        if (
          selectionLockedRef.current
        ) {
          return;
        }

        const currentReport =
          activeReport;

        if (!currentReport) {
          return;
        }

        selectionLockedRef.current =
          true;

        setActiveReport(null);

        currentReport.onSubmit(
          reason
        );
      },
      [activeReport]
    );

  return (
    <>
      {children(openReport)}

      <MonetizationFeedbackSheet
        visible={
          activeReport !== null
        }
        title={
          activeReport?.title ??
          "Tell us about this promotion"
        }
        onClose={
          closeReport
        }
        onSelectReason={
          handleSelectReason
        }
      />
    </>
  );
}