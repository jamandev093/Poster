"use client";

import {
  useMemo,
  useState,
} from "react";

import ExternalProgramDetails from "./ExternalProgramDetails";
import ExternalProgramEditor from "./ExternalProgramEditor";

import {
  programStatusLabel,
  programTypeLabel,
} from "./external-program.constants";

import {
  INITIAL_EXTERNAL_PROGRAMS,
} from "./external-program.mock";

import {
  EMPTY_EXTERNAL_PROGRAM_DRAFT,
  hasExternalProgramErrors,
  validateExternalProgram,
} from "./external-program.validation";

import type {
  ExternalProgramDraft,
  ExternalProgramErrors,
  ExternalProgramRecord,
  ExternalProgramStatus,
} from "./external-program.types";

import styles from "./ExternalProgramsManager.module.css";

type EditorMode =
  | "create"
  | "edit"
  | null;

function nowLabel() {
  return new Date().toLocaleString(
    "en-IN",
    {
      dateStyle: "medium",
      timeStyle: "short",
    }
  );
}

function recordToDraft(
  program: ExternalProgramRecord
): ExternalProgramDraft {
  return {
    programName:
      program.programName,
    platformName:
      program.platformName,
    programType:
      program.programType,

    applicationUrl:
      program.applicationUrl,
    dashboardUrl:
      program.dashboardUrl,

    accountReference:
      program.accountReference,
    trackingId:
      program.trackingId,

    status:
      program.status,

    payoutMethod:
      program.payoutMethod,
    payoutDestinationLabel:
      program.payoutDestinationLabel,
    currency:
      program.currency,
    minimumPayout:
      program.minimumPayout,
    paymentSchedule:
      program.paymentSchedule,

    applicationDate:
      program.applicationDate,
    approvalDate:
      program.approvalDate,
    nextReviewDate:
      program.nextReviewDate,

    notes:
      program.notes,
  };
}

export default function ExternalProgramsManager() {
  const [
    programs,
    setPrograms,
  ] = useState<
    ExternalProgramRecord[]
  >(INITIAL_EXTERNAL_PROGRAMS);

  const [
    selectedProgramId,
    setSelectedProgramId,
  ] = useState<string | null>(null);

  const [
    editorMode,
    setEditorMode,
  ] = useState<EditorMode>(null);

  const [
    draft,
    setDraft,
  ] = useState<ExternalProgramDraft>(
    EMPTY_EXTERNAL_PROGRAM_DRAFT
  );

  const [
    errors,
    setErrors,
  ] = useState<ExternalProgramErrors>(
    {}
  );

  const [
    search,
    setSearch,
  ] = useState("");

  const [
    statusFilter,
    setStatusFilter,
  ] = useState<
    ExternalProgramStatus | "all"
  >("all");

  const selectedProgram =
    programs.find(
      (program) =>
        program.id === selectedProgramId
    ) ?? null;

  const visiblePrograms = useMemo(() => {
    const query =
      search.trim().toLowerCase();

    return programs.filter(
      (program) => {
        const matchesStatus =
          statusFilter === "all" ||
          program.status === statusFilter;

        const searchable = [
          program.programName,
          program.platformName,
          program.accountReference,
          program.trackingId,
          program.currency,
          programTypeLabel(
            program.programType
          ),
          programStatusLabel(
            program.status
          ),
        ]
          .join(" ")
          .toLowerCase();

        return (
          matchesStatus &&
          (!query ||
            searchable.includes(query))
        );
      }
    );
  }, [
    programs,
    search,
    statusFilter,
  ]);

  const approvedCount =
    programs.filter(
      (program) =>
        program.status === "approved"
    ).length;

  const reviewCount =
    programs.filter(
      (program) =>
        program.status ===
          "under_review" ||
        program.status === "applied"
    ).length;

  const openCreate = () => {
    setDraft({
      ...EMPTY_EXTERNAL_PROGRAM_DRAFT,
    });

    setErrors({});
    setSelectedProgramId(null);
    setEditorMode("create");
  };

  const openEdit = (
    program: ExternalProgramRecord
  ) => {
    setDraft(
      recordToDraft(program)
    );

    setErrors({});
    setSelectedProgramId(program.id);
    setEditorMode("edit");
  };

  const closeOverlay = () => {
    setEditorMode(null);
    setSelectedProgramId(null);
    setErrors({});
  };

  const submitProgram = () => {
    const nextErrors =
      validateExternalProgram(draft);

    setErrors(nextErrors);

    if (
      hasExternalProgramErrors(
        nextErrors
      )
    ) {
      return;
    }

    const timestamp = nowLabel();

    if (editorMode === "create") {
      const nextProgram:
        ExternalProgramRecord = {
        id: `program-${Date.now()}`,

        ...draft,

        createdAt: timestamp,
        updatedAt: timestamp,

        auditHistory: [
          {
            id: `audit-${Date.now()}`,
            action: "created",
            message:
              "External program record created.",
            actor: "Admin",
            occurredAt: timestamp,
          },
        ],
      };

      setPrograms((current) => [
        nextProgram,
        ...current,
      ]);

      setSelectedProgramId(
        nextProgram.id
      );

      setEditorMode(null);
      return;
    }

    if (
      editorMode === "edit" &&
      selectedProgram
    ) {
      const statusChanged =
        selectedProgram.status !==
        draft.status;

      setPrograms((current) =>
        current.map((program) => {
          if (
            program.id !==
            selectedProgram.id
          ) {
            return program;
          }

          return {
            ...program,
            ...draft,
            updatedAt: timestamp,

            auditHistory: [
              {
                id:
                  `audit-${Date.now()}`,
                action: statusChanged
                  ? "status_changed"
                  : "updated",
                message: statusChanged
                  ? `Program status changed from ${programStatusLabel(
                      program.status
                    )} to ${programStatusLabel(
                      draft.status
                    )}.`
                  : "Program details updated.",
                actor: "Admin",
                occurredAt: timestamp,
              },
              ...program.auditHistory,
            ],
          };
        })
      );

      setEditorMode(null);
    }
  };

  const changeStatus = (
    status: ExternalProgramStatus
  ) => {
    if (!selectedProgram) {
      return;
    }

    const timestamp = nowLabel();

    setPrograms((current) =>
      current.map((program) => {
        if (
          program.id !==
          selectedProgram.id
        ) {
          return program;
        }

        return {
          ...program,
          status,
          updatedAt: timestamp,

          auditHistory: [
            {
              id: `audit-${Date.now()}`,
              action: "status_changed",
              message:
                `Program status changed from ${programStatusLabel(
                  program.status
                )} to ${programStatusLabel(
                  status
                )}.`,
              actor: "Admin",
              occurredAt: timestamp,
            },
            ...program.auditHistory,
          ],
        };
      })
    );
  };

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>
            External Promotions
          </p>

          <h1>Programs</h1>

          <p className={styles.description}>
            Manage external affiliate,
            referral and publisher-program
            applications owned and operated
            by Poster.
          </p>
        </div>

        <button
          type="button"
          className={styles.primaryButton}
          onClick={openCreate}
        >
          Add program
        </button>
      </header>

      <section className={styles.metrics}>
        <Metric
          label="Total programs"
          value={programs.length}
          detail="All recorded external programs"
        />

        <Metric
          label="Approved"
          value={approvedCount}
          detail="Eligible for active use"
        />

        <Metric
          label="Awaiting review"
          value={reviewCount}
          detail="Applied or under review"
        />
      </section>

      <section className={styles.toolbar}>
        <label className={styles.searchField}>
          <span className={styles.srOnly}>
            Search programs
          </span>

          <input
            type="search"
            value={search}
            placeholder="Search programs, platforms or IDs"
            onChange={(event) => {
              setSearch(
                event.target.value
              );
            }}
          />
        </label>

        <label className={styles.filterField}>
          <span>Status</span>

          <select
            value={statusFilter}
            onChange={(event) => {
              setStatusFilter(
                event.target
                  .value as
                  | ExternalProgramStatus
                  | "all"
              );
            }}
          >
            <option value="all">
              All statuses
            </option>

            <option value="not_applied">
              Not applied
            </option>

            <option value="applied">
              Applied
            </option>

            <option value="under_review">
              Under review
            </option>

            <option value="approved">
              Approved
            </option>

            <option value="rejected">
              Rejected
            </option>

            <option value="suspended">
              Suspended
            </option>

            <option value="closed">
              Closed
            </option>
          </select>
        </label>
      </section>

      <section className={styles.tableCard}>
        <div className={styles.tableHeader}>
          <div>
            <h2>External programs</h2>

            <p>
              {visiblePrograms.length}{" "}
              {visiblePrograms.length === 1
                ? "record"
                : "records"}
            </p>
          </div>
        </div>

        {visiblePrograms.length ? (
          <div className={styles.tableScroll}>
            <table>
              <thead>
                <tr>
                  <th>Program</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Account reference</th>
                  <th>Currency</th>
                  <th>Next review</th>
                  <th aria-label="Actions" />
                </tr>
              </thead>

              <tbody>
                {visiblePrograms.map(
                  (program) => (
                    <tr key={program.id}>
                      <td>
                        <strong>
                          {program.programName}
                        </strong>

                        <span>
                          {program.platformName}
                        </span>
                      </td>

                      <td>
                        {programTypeLabel(
                          program.programType
                        )}
                      </td>

                      <td>
                        <span
                          className={
                            styles.status
                          }
                          data-status={
                            program.status
                          }
                        >
                          {programStatusLabel(
                            program.status
                          )}
                        </span>
                      </td>

                      <td>
                        {program.accountReference ||
                          "Not issued"}
                      </td>

                      <td>
                        {program.currency}
                      </td>

                      <td>
                        {program.nextReviewDate ||
                          "Not scheduled"}
                      </td>

                      <td>
                        <button
                          type="button"
                          className={
                            styles.viewButton
                          }
                          onClick={() => {
                            setSelectedProgramId(
                              program.id
                            );

                            setEditorMode(null);
                          }}
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <div className={styles.emptyState}>
            <h3>No programs found</h3>

            <p>
              Adjust the filters or create
              a new external program record.
            </p>
          </div>
        )}
      </section>

      {selectedProgram ||
      editorMode ? (
        <>
          <button
            type="button"
            className={styles.backdrop}
            aria-label="Close program panel"
            onClick={closeOverlay}
          />

          <aside
            className={styles.drawer}
            aria-label={
              editorMode
                ? "Program editor"
                : "Program details"
            }
          >
            {editorMode ? (
              <div className={styles.editor}>
                <header
                  className={
                    styles.editorHeader
                  }
                >
                  <div>
                    <p>
                      External Promotions
                    </p>

                    <h2>
                      {editorMode === "create"
                        ? "Add program"
                        : "Edit program"}
                    </h2>
                  </div>

                  <button
                    type="button"
                    onClick={closeOverlay}
                    aria-label="Close editor"
                  >
                    ×
                  </button>
                </header>

                <ExternalProgramEditor
                  draft={draft}
                  errors={errors}
                  submitLabel={
                    editorMode === "create"
                      ? "Create program"
                      : "Save changes"
                  }
                  onChange={setDraft}
                  onSubmit={submitProgram}
                  onCancel={closeOverlay}
                />
              </div>
            ) : selectedProgram ? (
              <ExternalProgramDetails
                program={selectedProgram}
                onClose={closeOverlay}
                onEdit={() => {
                  openEdit(
                    selectedProgram
                  );
                }}
                onStatusChange={
                  changeStatus
                }
              />
            ) : null}
          </aside>
        </>
      ) : null}
    </main>
  );
}

interface MetricProps {
  label: string;
  value: number;
  detail: string;
}

function Metric({
  label,
  value,
  detail,
}: MetricProps) {
  return (
    <div>
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{detail}</small>
    </div>
  );
}
