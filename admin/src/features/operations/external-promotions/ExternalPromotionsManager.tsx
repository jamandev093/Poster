"use client";

import {
  useMemo,
  useState,
} from "react";

import AdminDrawer from "@/components/admin/AdminDrawer";

import {
  INITIAL_EXTERNAL_PROGRAMS,
} from "../external-programs/external-program.mock";

import ExternalPromotionDetails from "./ExternalPromotionDetails";
import ExternalPromotionEditor from "./ExternalPromotionEditor";

import {
  offerTypeLabel,
  placementLabel,
  promotionStatusLabel,
} from "./external-promotion.constants";

import {
  INITIAL_EXTERNAL_PROMOTIONS,
} from "./external-promotion.mock";

import {
  EMPTY_EXTERNAL_PROMOTION_DRAFT,
  hasExternalPromotionErrors,
  validateExternalPromotion,
} from "./external-promotion.validation";

import type {
  ExternalPromotionDraft,
  ExternalPromotionErrors,
  ExternalPromotionRecord,
  ExternalPromotionStatus,
} from "./external-promotion.types";

import styles from "./ExternalPromotionsManager.module.css";

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

function promotionToDraft(
  promotion: ExternalPromotionRecord
): ExternalPromotionDraft {
  return {
    programId:
      promotion.programId,

    name:
      promotion.name,

    externalOfferId:
      promotion.externalOfferId,

    offerType:
      promotion.offerType,

    conversionGoal:
      promotion.conversionGoal,

    category:
      promotion.category,

    headline:
      promotion.headline,

    description:
      promotion.description,

    callToAction:
      promotion.callToAction,

    mediaType:
      promotion.mediaType,

    mediaUrl:
      promotion.mediaUrl,

    destinationUrl:
      promotion.destinationUrl,

    trackingUrl:
      promotion.trackingUrl,

    referralCode:
      promotion.referralCode,

    disclosure:
      promotion.disclosure,

    placements:
      [...promotion.placements],

    startDate:
      promotion.startDate,

    endDate:
      promotion.endDate,

    status:
      promotion.status,

    notes:
      promotion.notes,
  };
}

function statusAuditAction(
  previousStatus:
    ExternalPromotionStatus,
  nextStatus:
    ExternalPromotionStatus
):
  ExternalPromotionRecord[
    "auditHistory"
  ][number]["action"] {
  if (
    nextStatus === "active" &&
    previousStatus === "paused"
  ) {
    return "resumed";
  }

  if (nextStatus === "active") {
    return "activated";
  }

  if (nextStatus === "paused") {
    return "paused";
  }

  if (nextStatus === "scheduled") {
    return "scheduled";
  }

  if (nextStatus === "ended") {
    return "ended";
  }

  return "updated";
}

export default function ExternalPromotionsManager() {
  const [
    promotions,
    setPromotions,
  ] = useState<
    ExternalPromotionRecord[]
  >(INITIAL_EXTERNAL_PROMOTIONS);

  const [
    selectedPromotionId,
    setSelectedPromotionId,
  ] = useState<string | null>(
    null
  );

  const [
    editorMode,
    setEditorMode,
  ] = useState<EditorMode>(null);

  const [
    draft,
    setDraft,
  ] = useState<
    ExternalPromotionDraft
  >({
    ...EMPTY_EXTERNAL_PROMOTION_DRAFT,
    placements: [
      ...EMPTY_EXTERNAL_PROMOTION_DRAFT
        .placements,
    ],
  });

  const [
    errors,
    setErrors,
  ] = useState<
    ExternalPromotionErrors
  >({});

  const [
    search,
    setSearch,
  ] = useState("");

  const [
    statusFilter,
    setStatusFilter,
  ] = useState<
    ExternalPromotionStatus | "all"
  >("all");

  const approvedPrograms =
    useMemo(
      () =>
        INITIAL_EXTERNAL_PROGRAMS
          .filter(
            (program) =>
              program.status ===
              "approved"
          )
          .map((program) => ({
            id: program.id,
            programName:
              program.programName,
            platformName:
              program.platformName,
          })),
      []
    );

  const selectedPromotion =
    promotions.find(
      (promotion) =>
        promotion.id ===
        selectedPromotionId
    ) ?? null;

  const drawerOpen = Boolean(
    selectedPromotion || editorMode
  );

  const drawerTitle = editorMode
    ? editorMode === "create"
      ? "Add external promotion"
      : "Edit external promotion"
    : selectedPromotion
      ? `${selectedPromotion.name} details`
      : "External promotion";

  const programNameById =
    useMemo(
      () =>
        new Map(
          INITIAL_EXTERNAL_PROGRAMS.map(
            (program) => [
              program.id,
              program.programName,
            ]
          )
        ),
      []
    );

  const visiblePromotions =
    useMemo(() => {
      const query =
        search.trim().toLowerCase();

      return promotions.filter(
        (promotion) => {
          const matchesStatus =
            statusFilter === "all" ||
            promotion.status ===
              statusFilter;

          const programName =
            programNameById.get(
              promotion.programId
            ) ?? "";

          const searchable = [
            promotion.name,
            promotion.headline,
            promotion.category,
            promotion.externalOfferId,
            programName,
            offerTypeLabel(
              promotion.offerType
            ),
            promotionStatusLabel(
              promotion.status
            ),
            promotion.placements
              .map(placementLabel)
              .join(" "),
          ]
            .join(" ")
            .toLowerCase();

          return (
            matchesStatus &&
            (!query ||
              searchable.includes(
                query
              ))
          );
        }
      );
    }, [
      promotions,
      programNameById,
      search,
      statusFilter,
    ]);

  const activeCount =
    promotions.filter(
      (promotion) =>
        promotion.status === "active"
    ).length;

  const scheduledCount =
    promotions.filter(
      (promotion) =>
        promotion.status ===
        "scheduled"
    ).length;

  const totalImpressions =
    promotions.reduce(
      (total, promotion) =>
        total +
        promotion.metrics.impressions,
      0
    );

  const totalValidClicks =
    promotions.reduce(
      (total, promotion) =>
        total +
        promotion.metrics.validClicks,
      0
    );

  const totalConversions =
    promotions.reduce(
      (total, promotion) =>
        total +
        promotion.metrics.conversions,
      0
    );

  const openCreate = () => {
    setDraft({
      ...EMPTY_EXTERNAL_PROMOTION_DRAFT,
      placements: [
        ...EMPTY_EXTERNAL_PROMOTION_DRAFT
          .placements,
      ],
    });

    setErrors({});
    setSelectedPromotionId(null);
    setEditorMode("create");
  };

  const openEdit = (
    promotion:
      ExternalPromotionRecord
  ) => {
    setDraft(
      promotionToDraft(promotion)
    );

    setErrors({});
    setSelectedPromotionId(
      promotion.id
    );
    setEditorMode("edit");
  };

  const closeOverlay = () => {
    setEditorMode(null);
    setSelectedPromotionId(null);
    setErrors({});
  };

  const submitPromotion = () => {
    const nextErrors =
      validateExternalPromotion(
        draft
      );

    setErrors(nextErrors);

    if (
      hasExternalPromotionErrors(
        nextErrors
      )
    ) {
      return;
    }

    const timestamp =
      nowLabel();

    if (editorMode === "create") {
      const nextPromotion:
        ExternalPromotionRecord = {
        id:
          `external-promotion-${Date.now()}`,

        ...draft,

        placements:
          [...draft.placements],

        metrics: {
          impressions: 0,
          validClicks: 0,
          conversions: 0,
        },

        createdAt: timestamp,
        updatedAt: timestamp,

        auditHistory: [
          {
            id:
              `external-promotion-audit-${Date.now()}`,

            action:
              draft.status ===
              "scheduled"
                ? "scheduled"
                : draft.status ===
                    "active"
                  ? "activated"
                  : "created",

            message:
              `External promotion created with ${promotionStatusLabel(
                draft.status
              )} status.`,

            actor: "Admin",
            occurredAt: timestamp,
          },
        ],
      };

      setPromotions(
        (current) => [
          nextPromotion,
          ...current,
        ]
      );

      setSelectedPromotionId(
        nextPromotion.id
      );

      setEditorMode(null);
      return;
    }

    if (
      editorMode === "edit" &&
      selectedPromotion
    ) {
      const statusChanged =
        selectedPromotion.status !==
        draft.status;

      setPromotions(
        (current) =>
          current.map(
            (promotion) => {
              if (
                promotion.id !==
                selectedPromotion.id
              ) {
                return promotion;
              }

              return {
                ...promotion,
                ...draft,

                placements:
                  [...draft.placements],

                updatedAt:
                  timestamp,

                auditHistory: [
                  {
                    id:
                      `external-promotion-audit-${Date.now()}`,

                    action:
                      statusChanged
                        ? statusAuditAction(
                            promotion.status,
                            draft.status
                          )
                        : "updated",

                    message:
                      statusChanged
                        ? `Promotion status changed from ${promotionStatusLabel(
                            promotion.status
                          )} to ${promotionStatusLabel(
                            draft.status
                          )}.`
                        : "External promotion details updated.",

                    actor:
                      "Admin",

                    occurredAt:
                      timestamp,
                  },

                  ...promotion.auditHistory,
                ],
              };
            }
          )
      );

      setEditorMode(null);
    }
  };

  const changeStatus = (
    status:
      ExternalPromotionStatus
  ) => {
    if (!selectedPromotion) {
      return;
    }

    const timestamp =
      nowLabel();

    setPromotions(
      (current) =>
        current.map(
          (promotion) => {
            if (
              promotion.id !==
              selectedPromotion.id
            ) {
              return promotion;
            }

            return {
              ...promotion,
              status,
              updatedAt:
                timestamp,

              auditHistory: [
                {
                  id:
                    `external-promotion-audit-${Date.now()}`,

                  action:
                    statusAuditAction(
                      promotion.status,
                      status
                    ),

                  message:
                    `Promotion status changed from ${promotionStatusLabel(
                      promotion.status
                    )} to ${promotionStatusLabel(
                      status
                    )}.`,

                  actor:
                    "Admin",

                  occurredAt:
                    timestamp,
                },

                ...promotion.auditHistory,
              ],
            };
          }
        )
    );
  };

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>
            External Promotions
          </p>

          <h1>Promotions</h1>

          <p
            className={
              styles.description
            }
          >
            Manage external products,
            services and commercial offers
            selected directly by Poster
            Admin.
          </p>
        </div>

        <button
          type="button"
          className={
            styles.primaryButton
          }
          onClick={openCreate}
        >
          Add promotion
        </button>
      </header>

      <section className={styles.metrics}>
        <Metric
          label="Total promotions"
          value={promotions.length}
          detail="All external promotion records"
        />

        <Metric
          label="Active"
          value={activeCount}
          detail="Currently eligible for delivery"
        />

        <Metric
          label="Scheduled"
          value={scheduledCount}
          detail="Prepared for future delivery"
        />

        <Metric
          label="Impressions"
          value={totalImpressions}
          detail="Poster-owned delivery metric"
        />

        <Metric
          label="Valid clicks"
          value={totalValidClicks}
          detail="Validated outbound clicks"
        />

        <Metric
          label="Conversions"
          value={totalConversions}
          detail="Externally confirmed outcomes"
        />
      </section>

      <section className={styles.toolbar}>
        <label
          className={
            styles.searchField
          }
        >
          <span className={styles.srOnly}>
            Search promotions
          </span>

          <input
            type="search"
            value={search}
            placeholder="Search promotions, offers, programs or categories"
            onChange={(event) => {
              setSearch(
                event.target.value
              );
            }}
          />
        </label>

        <label
          className={
            styles.filterField
          }
        >
          <span>Status</span>

          <select
            value={statusFilter}
            onChange={(event) => {
              setStatusFilter(
                event.target
                  .value as
                  | ExternalPromotionStatus
                  | "all"
              );
            }}
          >
            <option value="all">
              All statuses
            </option>

            <option value="draft">
              Draft
            </option>

            <option value="scheduled">
              Scheduled
            </option>

            <option value="active">
              Active
            </option>

            <option value="paused">
              Paused
            </option>

            <option value="ended">
              Ended
            </option>
          </select>
        </label>
      </section>

      <section
        className={
          styles.tableCard
        }
      >
        <header
          className={
            styles.tableHeader
          }
        >
          <div>
            <h2>
              External promotions
            </h2>

            <p>
              {visiblePromotions.length}{" "}
              {visiblePromotions.length ===
              1
                ? "record"
                : "records"}
            </p>
          </div>
        </header>

        {visiblePromotions.length ? (
          <div
            className={
              styles.tableScroll
            }
          >
            <table>
              <thead>
                <tr>
                  <th scope="col">Promotion</th>
                  <th scope="col">Program</th>
                  <th scope="col">Offer</th>
                  <th scope="col">Placements</th>
                  <th scope="col">Status</th>
                  <th scope="col">Impressions</th>
                  <th scope="col">Valid clicks</th>
                  <th scope="col">Conversions</th>
                  <th scope="col" aria-label="Actions" />
                </tr>
              </thead>

              <tbody>
                {visiblePromotions.map(
                  (promotion) => (
                    <tr
                      key={
                        promotion.id
                      }
                    >
                      <td>
                        <strong>
                          {
                            promotion.name
                          }
                        </strong>

                        <span>
                          {
                            promotion.headline
                          }
                        </span>
                      </td>

                      <td>
                        {programNameById.get(
                          promotion.programId
                        ) ??
                          "Unknown program"}
                      </td>

                      <td>
                        {offerTypeLabel(
                          promotion.offerType
                        )}
                      </td>

                      <td>
                        {promotion.placements
                          .map(
                            placementLabel
                          )
                          .join(", ")}
                      </td>

                      <td>
                        <span
                          className={
                            styles.status
                          }
                          data-status={
                            promotion.status
                          }
                        >
                          {promotionStatusLabel(
                            promotion.status
                          )}
                        </span>
                      </td>

                      <td>
                        {promotion.metrics.impressions.toLocaleString(
                          "en-IN"
                        )}
                      </td>

                      <td>
                        {promotion.metrics.validClicks.toLocaleString(
                          "en-IN"
                        )}
                      </td>

                      <td>
                        {promotion.metrics.conversions.toLocaleString(
                          "en-IN"
                        )}
                      </td>

                      <td>
                        <button
                          type="button"
                          className={
                            styles.viewButton
                          }
                          onClick={() => {
                            setSelectedPromotionId(
                              promotion.id
                            );

                            setEditorMode(
                              null
                            );
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
          <div
            className={
              styles.emptyState
            }
          >
            <h3>
              No promotions found
            </h3>

            <p>
              Adjust the filters or create
              a new external promotion.
            </p>
          </div>
        )}
      </section>

      <AdminDrawer
        open={drawerOpen}
        title={drawerTitle}
        width="wide"
        showHeader={false}
        onClose={closeOverlay}
      >
        {editorMode ? (
          <div className={styles.editor}>
            <header className={styles.editorHeader}>
              <div>
                <p>External Promotions</p>

                <h2>
                  {editorMode === "create"
                    ? "Add promotion"
                    : "Edit promotion"}
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

            <ExternalPromotionEditor
              draft={draft}
              errors={errors}
              approvedPrograms={approvedPrograms}
              submitLabel={
                editorMode === "create"
                  ? "Create promotion"
                  : "Save changes"
              }
              onChange={setDraft}
              onSubmit={submitPromotion}
              onCancel={closeOverlay}
            />
          </div>
        ) : selectedPromotion ? (
          <ExternalPromotionDetails
            promotion={selectedPromotion}
            programName={
              programNameById.get(
                selectedPromotion.programId
              ) ?? "Unknown program"
            }
            onClose={closeOverlay}
            onEdit={() => {
              openEdit(selectedPromotion);
            }}
            onStatusChange={changeStatus}
          />
        ) : null}
      </AdminDrawer>
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

      <strong>
        {value.toLocaleString(
          "en-IN"
        )}
      </strong>

      <small>{detail}</small>
    </div>
  );
}




