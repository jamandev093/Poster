"use client";

import {
  useState,
} from "react";

import type {
  CreateProgrammaticProviderRequest,
  CreateProgrammaticSlotMappingRequest,
  ProgrammaticApprovedFrame,
  ProgrammaticApprovedScreen,
  ProgrammaticMappingStatus,
  ProgrammaticProvider,
  ProgrammaticProviderHealthStatus,
  ProgrammaticProviderStatus,
} from "./programmatic.types";

import {
  createProgrammaticProvider,
  createProgrammaticSlotMapping,
} from "./programmatic.service";

import {
  getProgrammaticErrorMessage,
} from "./programmatic.errors";

import styles from "./ProgrammaticActions.module.css";

const PROVIDER_STATUSES: ProgrammaticProviderStatus[] = [
  "disabled",
  "enabled",
  "paused",
];

const HEALTH_STATUSES: ProgrammaticProviderHealthStatus[] = [
  "unknown",
  "healthy",
  "degraded",
  "unhealthy",
];

const SCREENS: ProgrammaticApprovedScreen[] = [
  "home",
  "search",
  "trending",
];

const FRAMES: ProgrammaticApprovedFrame[] = [
  "full_width_sponsored_card",
  "three_card_sponsored_frame",
];

const MAPPING_STATUSES: ProgrammaticMappingStatus[] = [
  "disabled",
  "enabled",
  "paused",
];

interface ProviderFormState {
  providerKey:
    string;

  displayName:
    string;

  status:
    ProgrammaticProviderStatus;

  healthStatus:
    ProgrammaticProviderHealthStatus;

  notes:
    string;
}

interface MappingFormState {
  providerId:
    string;

  screen:
    ProgrammaticApprovedScreen;

  placement:
    string;

  frame:
    ProgrammaticApprovedFrame;

  status:
    ProgrammaticMappingStatus;

  safetyRulesJson:
    string;

  regionRulesJson:
    string;

  deviceRulesJson:
    string;

  frequencyRulesJson:
    string;

  fallbackRulesJson:
    string;
}

type ModalType =
  | "provider"
  | "mapping"
  | null;

function formatOption(
  value:
    string
): string {
  return value
    .split(
      "_"
    )
    .map(
      word =>
        word.charAt(
          0
        ).toUpperCase() +
        word.slice(
          1
        )
    )
    .join(
      " "
    );
}

function parseJsonObject(
  value:
    string,
  label:
    string
): Record<string, unknown> {
  const trimmed =
    value.trim();

  if (
    trimmed.length ===
    0
  ) {
    return {};
  }

  const parsed =
    JSON.parse(
      trimmed
    ) as unknown;

  if (
    !parsed ||
    typeof parsed !==
      "object" ||
    Array.isArray(
      parsed
    )
  ) {
    throw new Error(
      `${label} must be a JSON object.`
    );
  }

  return parsed as
    Record<string, unknown>;
}

function createInitialProviderForm(): ProviderFormState {
  return {
    providerKey:
      "",

    displayName:
      "",

    status:
      "disabled",

    healthStatus:
      "unknown",

    notes:
      "",
  };
}

function createInitialMappingForm(
  providers:
    readonly ProgrammaticProvider[]
): MappingFormState {
  return {
    providerId:
      providers[0]?.id ??
      "",

    screen:
      "home",

    placement:
      "home_sponsored_card",

    frame:
      "full_width_sponsored_card",

    status:
      "disabled",

    safetyRulesJson:
      "{}",

    regionRulesJson:
      "{}",

    deviceRulesJson:
      "{}",

    frequencyRulesJson:
      "{}",

    fallbackRulesJson:
      "{}",
  };
}

const BLOCKED_PLACEMENT_TERMS = [
  "banner",
  "popup",
  "pop_up",
  "interstitial",
  "overlay",
  "floating",
  "vertical",
  "provider_created",
  "provider-created",
];

function requireTextField(
  label:
    string,
  value:
    string
): string {
  const trimmed =
    value.trim();

  if (trimmed.length === 0) {
    throw new Error(
      `${label} is required.`
    );
  }

  return trimmed;
}

function requireProviderKey(
  value:
    string
): string {
  const providerKey =
    requireTextField(
      "Provider key",
      value
    ).toLowerCase();

  if (!/^[a-z0-9][a-z0-9_-]{1,62}[a-z0-9]$/.test(providerKey)) {
    throw new Error(
      "Provider key must be 3-64 characters using lowercase letters, numbers, underscores, or hyphens."
    );
  }

  return providerKey;
}

function optionalTextField(
  value:
    string
): string | null {
  const trimmed =
    value.trim();

  return trimmed.length > 0
    ? trimmed
    : null;
}

function hasBlockedPlacementTerm(
  placement:
    string
): boolean {
  const normalized =
    placement.toLowerCase();

  return BLOCKED_PLACEMENT_TERMS.some(
    term =>
      normalized.includes(
        term
      )
  );
}

function hasObjectKeys(
  value:
    Record<string, unknown>
): boolean {
  return Object.keys(
    value
  ).length > 0;
}

function buildProviderRequest(
  form:
    ProviderFormState
): CreateProgrammaticProviderRequest {
  const providerKey =
    requireProviderKey(
      form.providerKey
    );

  const displayName =
    requireTextField(
      "Display name",
      form.displayName
    );

  if (
    form.status === "enabled" &&
    form.healthStatus !== "healthy"
  ) {
    throw new Error(
      "Provider can be enabled only when health status is healthy."
    );
  }

  return {
    providerKey,

    displayName,

    status:
      form.status,

    healthStatus:
      form.healthStatus,

    notes:
      optionalTextField(
        form.notes
      ),
  };
}

function buildMappingRequest(
  form:
    MappingFormState
): CreateProgrammaticSlotMappingRequest {
  const providerId =
    requireTextField(
      "Provider",
      form.providerId
    );

  const placement =
    requireTextField(
      "Placement",
      form.placement
    );

  if (
    hasBlockedPlacementTerm(
      placement
    )
  ) {
    throw new Error(
      "Placement name references a prohibited format. Programmatic may use only Poster-approved sponsored frames."
    );
  }

  const safetyRules =
    parseJsonObject(
      form.safetyRulesJson,
      "Safety rules"
    );

  const regionRules =
    parseJsonObject(
      form.regionRulesJson,
      "Region rules"
    );

  const deviceRules =
    parseJsonObject(
      form.deviceRulesJson,
      "Device rules"
    );

  const frequencyRules =
    parseJsonObject(
      form.frequencyRulesJson,
      "Frequency rules"
    );

  const fallbackRules =
    parseJsonObject(
      form.fallbackRulesJson,
      "Fallback rules"
    );

  if (
    form.status === "enabled" &&
    !hasObjectKeys(
      safetyRules
    )
  ) {
    throw new Error(
      "Enabled slot mappings require explicit safety rules."
    );
  }

  if (
    form.status === "enabled" &&
    !hasObjectKeys(
      fallbackRules
    )
  ) {
    throw new Error(
      "Enabled slot mappings require explicit fallback rules."
    );
  }

  return {
    providerId,

    screen:
      form.screen,

    placement,

    frame:
      form.frame,

    status:
      form.status,

    safetyRules,

    regionRules,

    deviceRules,

    frequencyRules,

    fallbackRules,
  };
}
interface ProgrammaticActionsProps {
  providers:
    readonly ProgrammaticProvider[];

  onSaved:
    () => void;
}

export default function ProgrammaticActions(
  props:
    ProgrammaticActionsProps
) {
  const [
    modal,
    setModal,
  ] =
    useState<ModalType>(
      null
    );

  const [
    providerForm,
    setProviderForm,
  ] =
    useState(
      createInitialProviderForm
    );

  const [
    mappingForm,
    setMappingForm,
  ] =
    useState(
      () =>
        createInitialMappingForm(
          props.providers
        )
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
    useState<string | null>(
      null
    );

  const openProviderModal =
    () => {
      setProviderForm(
        createInitialProviderForm()
      );

      setErrorMessage(
        null
      );

      setModal(
        "provider"
      );
    };

  const openMappingModal =
    () => {
      setMappingForm(
        createInitialMappingForm(
          props.providers
        )
      );

      setErrorMessage(
        null
      );

      setModal(
        "mapping"
      );
    };

  const closeModal =
    () => {
      if (
        isSaving
      ) {
        return;
      }

      setModal(
        null
      );
    };

  const saveProvider =
    async () => {
      setIsSaving(
        true
      );

      setErrorMessage(
        null
      );

      try {
        await createProgrammaticProvider(
          buildProviderRequest(
            providerForm
          )
        );

        props.onSaved();

        setModal(
          null
        );
      } catch (
        error
      ) {
        setErrorMessage(
          error instanceof Error
            ? error.message
            : getProgrammaticErrorMessage(
                error
              )
        );
      } finally {
        setIsSaving(
          false
        );
      }
    };

  const saveMapping =
    async () => {
      setIsSaving(
        true
      );

      setErrorMessage(
        null
      );

      try {
        await createProgrammaticSlotMapping(
          buildMappingRequest(
            mappingForm
          )
        );

        props.onSaved();

        setModal(
          null
        );
      } catch (
        error
      ) {
        setErrorMessage(
          error instanceof Error
            ? error.message
            : getProgrammaticErrorMessage(
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
    <div
      className={
        styles.actions
      }
    >
      <div
        className={
          styles.buttonRow
        }
      >
        <button
          type="button"
          className={
            styles.primaryButton
          }
          onClick={
            openProviderModal
          }
        >
          Add provider
        </button>

        <button
          type="button"
          className={
            styles.secondaryButton
          }
          disabled={
            props.providers.length ===
            0
          }
          onClick={
            openMappingModal
          }
        >
          Add slot mapping
        </button>
      </div>

      {props.providers.length === 0 ? (
        <p
          className={
            styles.helpText
          }
        >
          Create a provider before adding Poster-approved slot mappings.
        </p>
      ) : null}

      {errorMessage ? (
        <p
          className={
            styles.errorText
          }
          role="alert"
        >
          {
            errorMessage
          }
        </p>
      ) : null}

      {modal ? (
        <div
          className={
            styles.modalLayer
          }
        >
          <button
            type="button"
            className={
              styles.backdrop
            }
            aria-label="Close programmatic action"
            onClick={
              closeModal
            }
          />

          <section
            className={
              styles.modal
            }
            aria-label="Programmatic action"
          >
            <header
              className={
                styles.modalHeader
              }
            >
              <div>
                <span>
                  Programmatic
                </span>

                <h3>
                  {modal === "provider"
                    ? "Add provider"
                    : "Add slot mapping"}
                </h3>
              </div>

              <button
                type="button"
                className={
                  styles.closeButton
                }
                aria-label="Close"
                onClick={
                  closeModal
                }
              >
                ×
              </button>
            </header>

            <div
              className={
                styles.form
              }
            >
              {errorMessage ? (
                <div
                  className={
                    styles.formError
                  }
                  role="alert"
                >
                  {
                    errorMessage
                  }
                </div>
              ) : null}

              {modal === "provider" ? (
                <div
                  className={
                    styles.fieldGrid
                  }
                >
                  <div
                    className={
                      styles.field
                    }
                  >
                    <label htmlFor="programmatic-provider-key">
                      Provider key
                    </label>

                    <input
                      id="programmatic-provider-key"
                      value={
                        providerForm.providerKey
                      }
                      placeholder="google_ad_manager"
                      onChange={event =>
                        setProviderForm(
                          current => ({
                            ...current,

                            providerKey:
                              event.target.value,
                          })
                        )
                      }
                    />
                  </div>

                  <div
                    className={
                      styles.field
                    }
                  >
                    <label htmlFor="programmatic-display-name">
                      Display name
                    </label>

                    <input
                      id="programmatic-display-name"
                      value={
                        providerForm.displayName
                      }
                      placeholder="Google Ad Manager"
                      onChange={event =>
                        setProviderForm(
                          current => ({
                            ...current,

                            displayName:
                              event.target.value,
                          })
                        )
                      }
                    />
                  </div>

                  <div
                    className={
                      styles.field
                    }
                  >
                    <label htmlFor="programmatic-provider-status">
                      Status
                    </label>

                    <select
                      id="programmatic-provider-status"
                      value={
                        providerForm.status
                      }
                      onChange={event =>
                        setProviderForm(
                          current => ({
                            ...current,

                            status:
                              event.target.value as
                                ProgrammaticProviderStatus,
                          })
                        )
                      }
                    >
                      {PROVIDER_STATUSES.map(
                        status => (
                          <option
                            key={
                              status
                            }
                            value={
                              status
                            }
                          >
                            {formatOption(
                              status
                            )}
                          </option>
                        )
                      )}
                    </select>
                  </div>

                  <div
                    className={
                      styles.field
                    }
                  >
                    <label htmlFor="programmatic-health-status">
                      Health
                    </label>

                    <select
                      id="programmatic-health-status"
                      value={
                        providerForm.healthStatus
                      }
                      onChange={event =>
                        setProviderForm(
                          current => ({
                            ...current,

                            healthStatus:
                              event.target.value as
                                ProgrammaticProviderHealthStatus,
                          })
                        )
                      }
                    >
                      {HEALTH_STATUSES.map(
                        status => (
                          <option
                            key={
                              status
                            }
                            value={
                              status
                            }
                          >
                            {formatOption(
                              status
                            )}
                          </option>
                        )
                      )}
                    </select>
                  </div>

                  <div
                    className={
                      styles.fullField
                    }
                  >
                    <label htmlFor="programmatic-notes">
                      Notes
                    </label>

                    <textarea
                      id="programmatic-notes"
                      value={
                        providerForm.notes
                      }
                      onChange={event =>
                        setProviderForm(
                          current => ({
                            ...current,

                            notes:
                              event.target.value,
                          })
                        )
                      }
                    />

                    <span
                      className={
                        styles.helpText
                      }
                    >
                      Notes are operational only. Do not store secrets or API
                      keys here.
                    </span>
                  </div>
                </div>
              ) : (
                <div
                  className={
                    styles.fieldGrid
                  }
                >
                  <div
                    className={
                      styles.fullField
                    }
                  >
                    <label htmlFor="programmatic-provider-id">
                      Provider
                    </label>

                    <select
                      id="programmatic-provider-id"
                      value={
                        mappingForm.providerId
                      }
                      onChange={event =>
                        setMappingForm(
                          current => ({
                            ...current,

                            providerId:
                              event.target.value,
                          })
                        )
                      }
                    >
                      {props.providers.map(
                        provider => (
                          <option
                            key={
                              provider.id
                            }
                            value={
                              provider.id
                            }
                          >
                            {
                              provider.displayName
                            }
                          </option>
                        )
                      )}
                    </select>
                  </div>

                  <div
                    className={
                      styles.field
                    }
                  >
                    <label htmlFor="programmatic-screen">
                      Screen
                    </label>

                    <select
                      id="programmatic-screen"
                      value={
                        mappingForm.screen
                      }
                      onChange={event =>
                        setMappingForm(
                          current => ({
                            ...current,

                            screen:
                              event.target.value as
                                ProgrammaticApprovedScreen,
                          })
                        )
                      }
                    >
                      {SCREENS.map(
                        screen => (
                          <option
                            key={
                              screen
                            }
                            value={
                              screen
                            }
                          >
                            {formatOption(
                              screen
                            )}
                          </option>
                        )
                      )}
                    </select>
                  </div>

                  <div
                    className={
                      styles.field
                    }
                  >
                    <label htmlFor="programmatic-placement">
                      Placement
                    </label>

                    <input
                      id="programmatic-placement"
                      value={
                        mappingForm.placement
                      }
                      onChange={event =>
                        setMappingForm(
                          current => ({
                            ...current,

                            placement:
                              event.target.value,
                          })
                        )
                      }
                    />
                  </div>

                  <div
                    className={
                      styles.field
                    }
                  >
                    <label htmlFor="programmatic-frame">
                      Frame
                    </label>

                    <select
                      id="programmatic-frame"
                      value={
                        mappingForm.frame
                      }
                      onChange={event =>
                        setMappingForm(
                          current => ({
                            ...current,

                            frame:
                              event.target.value as
                                ProgrammaticApprovedFrame,
                          })
                        )
                      }
                    >
                      {FRAMES.map(
                        frame => (
                          <option
                            key={
                              frame
                            }
                            value={
                              frame
                            }
                          >
                            {formatOption(
                              frame
                            )}
                          </option>
                        )
                      )}
                    </select>
                  </div>

                  <div
                    className={
                      styles.field
                    }
                  >
                    <label htmlFor="programmatic-mapping-status">
                      Status
                    </label>

                    <select
                      id="programmatic-mapping-status"
                      value={
                        mappingForm.status
                      }
                      onChange={event =>
                        setMappingForm(
                          current => ({
                            ...current,

                            status:
                              event.target.value as
                                ProgrammaticMappingStatus,
                          })
                        )
                      }
                    >
                      {MAPPING_STATUSES.map(
                        status => (
                          <option
                            key={
                              status
                            }
                            value={
                              status
                            }
                          >
                            {formatOption(
                              status
                            )}
                          </option>
                        )
                      )}
                    </select>
                  </div>

                  <div
                    className={
                      styles.fullField
                    }
                  >
                    <label htmlFor="programmatic-safety-rules">
                      Safety rules JSON
                    </label>

                    <textarea
                      id="programmatic-safety-rules"
                      value={
                        mappingForm.safetyRulesJson
                      }
                      onChange={event =>
                        setMappingForm(
                          current => ({
                            ...current,

                            safetyRulesJson:
                              event.target.value,
                          })
                        )
                      }
                    />
                  </div>

                  <div
                    className={
                      styles.fullField
                    }
                  >
                    <label htmlFor="programmatic-region-rules">
                      Region rules JSON
                    </label>

                    <textarea
                      id="programmatic-region-rules"
                      value={
                        mappingForm.regionRulesJson
                      }
                      onChange={event =>
                        setMappingForm(
                          current => ({
                            ...current,

                            regionRulesJson:
                              event.target.value,
                          })
                        )
                      }
                    />
                  </div>

                  <div
                    className={
                      styles.fullField
                    }
                  >
                    <label htmlFor="programmatic-device-rules">
                      Device rules JSON
                    </label>

                    <textarea
                      id="programmatic-device-rules"
                      value={
                        mappingForm.deviceRulesJson
                      }
                      onChange={event =>
                        setMappingForm(
                          current => ({
                            ...current,

                            deviceRulesJson:
                              event.target.value,
                          })
                        )
                      }
                    />
                  </div>

                  <div
                    className={
                      styles.fullField
                    }
                  >
                    <label htmlFor="programmatic-frequency-rules">
                      Frequency rules JSON
                    </label>

                    <textarea
                      id="programmatic-frequency-rules"
                      value={
                        mappingForm.frequencyRulesJson
                      }
                      onChange={event =>
                        setMappingForm(
                          current => ({
                            ...current,

                            frequencyRulesJson:
                              event.target.value,
                          })
                        )
                      }
                    />
                  </div>

                  <div
                    className={
                      styles.fullField
                    }
                  >
                    <label htmlFor="programmatic-fallback-rules">
                      Fallback rules JSON
                    </label>

                    <textarea
                      id="programmatic-fallback-rules"
                      value={
                        mappingForm.fallbackRulesJson
                      }
                      onChange={event =>
                        setMappingForm(
                          current => ({
                            ...current,

                            fallbackRulesJson:
                              event.target.value,
                          })
                        )
                      }
                    />

                    <span
                      className={
                        styles.helpText
                      }
                    >
                      All rule fields must be JSON objects. Blocked ad formats
                      remain rejected by the Backend.
                    </span>
                  </div>
                </div>
              )}
            </div>

            <footer
              className={
                styles.formFooter
              }
            >
              <button
                type="button"
                className={
                  styles.secondaryButton
                }
                disabled={
                  isSaving
                }
                onClick={
                  closeModal
                }
              >
                Cancel
              </button>

              <button
                type="button"
                className={
                  styles.primaryButton
                }
                disabled={
                  isSaving
                }
                onClick={() =>
                  modal === "provider"
                    ? void saveProvider()
                    : void saveMapping()
                }
              >
                {isSaving
                  ? "Saving..."
                  : modal === "provider"
                    ? "Create provider"
                    : "Create slot mapping"}
              </button>
            </footer>
          </section>
        </div>
      ) : null}
    </div>
  );
}