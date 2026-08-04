"use client";

import {
  useCallback,
  useMemo,
  useState,
} from "react";

import styles from "../DirectSponsorshipManager.module.css";

import {
  useDirectSponsorshipTransition,
  type DirectSponsorshipCampaign,
  type DirectSponsorshipTransitionAction,
} from "./index";

export interface DirectSponsorshipActionsProps {
  campaign:
    DirectSponsorshipCampaign;

  refresh:
    () => void;
}

interface ActionDefinition {
  action:
    DirectSponsorshipTransitionAction;

  label:
    string;

  description:
    string;

  tone:
    | "primary"
    | "secondary"
    | "danger";
}

function getAvailableActions(
  campaign:
    DirectSponsorshipCampaign
): readonly ActionDefinition[] {
  switch (
    campaign.status
  ) {
    case "draft":
      return [
        {
          action:
            "schedule",

          label:
            "Schedule",

          description:
            "Schedule this campaign using its current approved dates and placements.",

          tone:
            "primary",
        },

        {
          action:
            "activate",

          label:
            "Activate",

          description:
            "Activate this campaign immediately when readiness and commercial requirements are satisfied.",

          tone:
            "primary",
        },

        {
          action:
            "disable",

          label:
            "Disable",

          description:
            "Permanently disable this campaign while preserving its authoritative history.",

          tone:
            "danger",
        },
      ];

    case "scheduled":
      return [
        {
          action:
            "activate",

          label:
            "Activate",

          description:
            "Activate this scheduled campaign when all delivery requirements are satisfied.",

          tone:
            "primary",
        },

        {
          action:
            "disable",

          label:
            "Disable",

          description:
            "Permanently disable this campaign while preserving its authoritative history.",

          tone:
            "danger",
        },
      ];

    case "active":
      return [
        {
          action:
            "pause",

          label:
            "Pause",

          description:
            "Temporarily pause delivery. The campaign can be resumed later.",

          tone:
            "secondary",
        },

        {
          action:
            "end",

          label:
            "End campaign",

          description:
            "End this campaign permanently while preserving its operational history.",

          tone:
            "danger",
        },

        {
          action:
            "disable",

          label:
            "Disable",

          description:
            "Permanently disable this campaign for an administrative or safety reason.",

          tone:
            "danger",
        },
      ];

    case "paused":
      return [
        {
          action:
            "resume",

          label:
            "Resume",

          description:
            "Resume campaign delivery when readiness and commercial requirements remain satisfied.",

          tone:
            "primary",
        },

        {
          action:
            "end",

          label:
            "End campaign",

          description:
            "End this paused campaign permanently while preserving its operational history.",

          tone:
            "danger",
        },

        {
          action:
            "disable",

          label:
            "Disable",

          description:
            "Permanently disable this campaign for an administrative or safety reason.",

          tone:
            "danger",
        },
      ];

    case "ended":
    case "disabled":
      return [];
  }
}

function actionClass(
  tone:
    ActionDefinition["tone"]
): string {
  switch (
    tone
  ) {
    case "primary":
      return styles.primaryButton;

    case "secondary":
      return styles.secondaryButton;

    case "danger":
      return styles.dangerButton;
  }
}

interface ActionSafetyCheck {
  label:
    string;

  status:
    "ready" |
    "attention";

  message:
    string;
}

function hasSchedule(
  campaign:
    DirectSponsorshipCampaign
): boolean {
  return Boolean(
    campaign.scheduledStartDate &&
    campaign.scheduledEndDate
  );
}

function hasPlacements(
  campaign:
    DirectSponsorshipCampaign
): boolean {
  return campaign.placements.length > 0;
}

function isCommerciallyApproved(
  campaign:
    DirectSponsorshipCampaign
): boolean {
  return campaign.commercialStatus === "approved";
}

function isReadinessReady(
  campaign:
    DirectSponsorshipCampaign
): boolean {
  return campaign.readinessStatus === "ready";
}

function safetyStatus(
  healthy:
    boolean
): "ready" | "attention" {
  return healthy
    ? "ready"
    : "attention";
}

function getActionSafetyChecks(
  campaign:
    DirectSponsorshipCampaign,
  action:
    DirectSponsorshipTransitionAction
): readonly ActionSafetyCheck[] {
  const baseChecks:
    ActionSafetyCheck[] = [
    {
      label:
        "Authoritative record",

      status:
        "ready",

      message:
        `Backend row version ${campaign.rowVersion} will be used to prevent stale updates.`,
    },
    {
      label:
        "Required audit reason",

      status:
        "ready",

      message:
        "This action cannot be submitted without a written Admin reason.",
    },
  ];

  if (
    action === "schedule" ||
    action === "activate"
  ) {
    return [
      {
        label:
          "Commercial approval",

        status:
          safetyStatus(
            isCommerciallyApproved(
              campaign
            )
          ),

        message:
          isCommerciallyApproved(
            campaign
          )
            ? "Commercial approval is present."
            : "Commercial approval is not ready. Backend may reject this action.",
      },
      {
        label:
          "Readiness",

        status:
          safetyStatus(
            isReadinessReady(
              campaign
            )
          ),

        message:
          isReadinessReady(
            campaign
          )
            ? "Readiness is marked ready."
            : "Readiness is not marked ready. Backend may reject this action.",
      },
      {
        label:
          "Schedule",

        status:
          safetyStatus(
            hasSchedule(
              campaign
            )
          ),

        message:
          hasSchedule(
            campaign
          )
            ? "Start and end dates are present."
            : "Start and end dates are missing.",
      },
      {
        label:
          "Placements",

        status:
          safetyStatus(
            hasPlacements(
              campaign
            )
          ),

        message:
          hasPlacements(
            campaign
          )
            ? "At least one Poster-approved placement is present."
            : "No placement is attached to this sponsorship.",
      },
      {
        label:
          "Delivery eligibility",

        status:
          safetyStatus(
            campaign.deliveryEligible
          ),

        message:
          campaign.deliveryEligible
            ? "Backend reports this campaign as delivery eligible."
            : "Backend reports this campaign as not delivery eligible.",
      },
      ...baseChecks,
    ];
  }

  if (
    action === "pause" ||
    action === "resume"
  ) {
    return [
      {
        label:
          "Operational state",

        status:
          "ready",

        message:
          "This action changes delivery state without deleting campaign history.",
      },
      {
        label:
          "Delivery impact",

        status:
          action === "resume" &&
          !campaign.deliveryEligible
            ? "attention"
            : "ready",

        message:
          action === "resume" &&
          !campaign.deliveryEligible
            ? "Resume may be rejected because Backend says the campaign is not delivery eligible."
            : "Delivery impact is explicit and auditable.",
      },
      ...baseChecks,
    ];
  }

  return [
    {
      label:
        "Permanent history",

      status:
        "attention",

      message:
        action === "disable"
          ? "Disable is an administrative safety action and should only be used when the campaign should not run again."
          : "End permanently closes campaign delivery while preserving operational history.",
    },
    {
      label:
        "Audit trail",

      status:
        "ready",

      message:
        "Backend records the Admin identity, reason, and lifecycle change.",
    },
    ...baseChecks,
  ];
}
export default function DirectSponsorshipActions(
  props:
    DirectSponsorshipActionsProps
) {
  const {
    campaign,
    refresh,
  } =
    props;

  const [
    selectedAction,
    setSelectedAction,
  ] =
    useState<
      ActionDefinition |
      null
    >(
      null
    );

  const [
    reason,
    setReason,
  ] =
    useState(
      ""
    );

  const [
    reasonError,
    setReasonError,
  ] =
    useState<
      string |
      null
    >(
      null
    );

  const handleMutationSuccess =
    useCallback(
      () => {
        refresh();
      },
      [
        refresh,
      ]
    );

  const handleConflict =
    useCallback(
      () => {
        refresh();
      },
      [
        refresh,
      ]
    );

  const {
    clearError,
    error,
    execute,
    isPending,
    pendingCampaignId,
  } =
    useDirectSponsorshipTransition({
      onConflict:
        handleConflict,

      onSuccess:
        handleMutationSuccess,
    });

  const availableActions =
    useMemo(
      () =>
        getAvailableActions(
          campaign
        ),
      [
        campaign,
      ]
    );

  const isCampaignPending =
    pendingCampaignId ===
    campaign.id;

  const openAction = (
    action:
      ActionDefinition
  ) => {
    clearError();

    setReason(
      ""
    );

    setReasonError(
      null
    );

    setSelectedAction(
      action
    );
  };

  const closeDialog =
    () => {
      if (
        isPending
      ) {
        return;
      }

      clearError();

      setSelectedAction(
        null
      );

      setReason(
        ""
      );

      setReasonError(
        null
      );
    };

  const confirmAction =
    async () => {
      if (
        !selectedAction
      ) {
        return;
      }

      const normalizedReason =
        reason.trim();

      if (
        normalizedReason.length <
        3
      ) {
        setReasonError(
          "Enter a clear reason containing at least 3 characters."
        );

        return;
      }

      setReasonError(
        null
      );

      const succeeded =
        await execute({
          campaignId:
            campaign.id,

          expectedRowVersion:
            campaign.rowVersion,

          action:
            selectedAction.action,

          reason:
            normalizedReason,
        });

      if (
        succeeded
      ) {
        setSelectedAction(
          null
        );

        setReason(
          ""
        );
      }
    };

  if (
    availableActions.length ===
    0
  ) {
    return (
      <span
        className={
          styles.noActions
        }
      >
        No further lifecycle actions
      </span>
    );
  }

  return (
    <>
      <div
        className={
          styles.actionGroup
        }
        aria-label="Campaign lifecycle actions"
      >
        {availableActions.map(
          action => (
            <button
              key={
                action.action
              }
              type="button"
              className={
                actionClass(
                  action.tone
                )
              }
              disabled={
                isPending
              }
              onClick={() =>
                openAction(
                  action
                )
              }
            >
              {isCampaignPending
                ? "Working…"
                : action.label}
            </button>
          )
        )}
      </div>

      {error &&
      !selectedAction ? (
        <div
          className={
            styles.actionError
          }
          role="alert"
        >
          {
            error
          }
        </div>
      ) : null}

      {selectedAction ? (
        <div
          className={
            styles.confirmLayer
          }
        >
          <button
            type="button"
            className={
              styles.confirmBackdrop
            }
            aria-label="Cancel campaign action"
            disabled={
              isPending
            }
            onClick={
              closeDialog
            }
          />

          <div
            className={
              styles.confirmDialog
            }
            role="dialog"
            aria-modal="true"
            aria-labelledby="direct-sponsorship-action-title"
          >
            <span
              className={
                styles.confirmEyebrow
              }
            >
              Direct Sponsorship action
            </span>

            <h3
              id="direct-sponsorship-action-title"
            >
              {
                selectedAction.label
              }
              {" "}
              this campaign?
            </h3>

            <p>
              <strong>
                {
                  campaign.campaignReference
                }
              </strong>
              {" · "}
              {
                campaign.name
              }
            </p>

            <p
              className={
                styles.confirmWarning
              }
            >
              {
                selectedAction.description
              }
            </p>

            <div
              className={
                styles.actionSafetyPanel
              }
              aria-label="Direct Sponsorship action safety checks"
            >
              <strong>
                Safety checks before applying
              </strong>

              <ul>
                {getActionSafetyChecks(
                  campaign,
                  selectedAction.action
                ).map(
                  check => (
                    <li
                      key={
                        check.label
                      }
                      className={
                        check.status === "ready"
                          ? styles.actionSafetyReady
                          : styles.actionSafetyAttention
                      }
                    >
                      <span>
                        {
                          check.label
                        }
                      </span>

                      <p>
                        {
                          check.message
                        }
                      </p>
                    </li>
                  )
                )}
              </ul>
            </div>
            <label
              className={
                styles.reasonField
              }
            >
              <span>
                Required reason
              </span>

              <textarea
                value={
                  reason
                }
                rows={
                  4
                }
                maxLength={
                  1000
                }
                disabled={
                  isPending
                }
                placeholder="Explain why this lifecycle action is required."
                aria-invalid={
                  reasonError
                    ? true
                    : undefined
                }
                onChange={(
                  event
                ) => {
                  setReason(
                    event.target.value
                  );

                  if (
                    reasonError
                  ) {
                    setReasonError(
                      null
                    );
                  }
                }}
              />
            </label>

            {reasonError ? (
              <p
                className={
                  styles.fieldError
                }
                role="alert"
              >
                {
                  reasonError
                }
              </p>
            ) : null}

            {error ? (
              <div
                className={
                  styles.actionError
                }
                role="alert"
              >
                {
                  error
                }
              </div>
            ) : null}

            <div
              className={
                styles.confirmActions
              }
            >
              <button
                type="button"
                className={
                  styles.secondaryButton
                }
                disabled={
                  isPending
                }
                onClick={
                  closeDialog
                }
              >
                Cancel
              </button>

              <button
                type="button"
                className={
                  actionClass(
                    selectedAction.tone
                  )
                }
                disabled={
                  isPending
                }
                onClick={() => {
                  void confirmAction();
                }}
              >
                {isPending
                  ? "Applying…"
                  : selectedAction.label}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}