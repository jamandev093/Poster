"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  AdminApiError,
} from "@/features/auth/services/auth-api.service";

import useAdminAuth from "@/features/auth/hooks/useAdminAuth";

import AccountProfileForm from "./forms/AccountProfileForm";

import type {
  AdminAccountProfile,
  AdminAccountProfileDraft,
  AdminAccountProfileErrors,
} from "./contracts/account-profile.types";

import {
  loadAdminProfile,
  profileToDraft,
  updateAdminProfile,
} from "./services/account-profile.service";

import {
  hasAdminAccountProfileErrors,
  validateAdminAccountProfile,
} from "./validation/account-profile.validation";

import styles from "./AccountProfileManager.module.css";

type ProfileState =
  | "loading"
  | "ready"
  | "saving"
  | "error"
  | "conflict";

function initials(
  value: string
) {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) =>
      part.charAt(0).toUpperCase()
    )
    .join("");
}

export default function AccountProfileManager() {
  const {
    identity,
    logout,
    restore,
    updateAccountName,
  } = useAdminAuth();

  const [
    profile,
    setProfile,
  ] =
    useState<
      AdminAccountProfile | null
    >(null);

  const [
    draft,
    setDraft,
  ] =
    useState<
      AdminAccountProfileDraft | null
    >(null);

  const [
    errors,
    setErrors,
  ] =
    useState<
      AdminAccountProfileErrors
    >({});

  const [
    state,
    setState,
  ] =
    useState<ProfileState>(
      "loading"
    );

  const [
    message,
    setMessage,
  ] =
    useState<string | null>(
      null
    );

  const loadProfile =
    useCallback(async () => {
      if (!identity) {
        return;
      }

      setState("loading");
      setMessage(null);

      try {
        const loadedProfile =
          await loadAdminProfile(
            identity.accessToken
          );

        setProfile(
          loadedProfile
        );

        setDraft(
          profileToDraft(
            loadedProfile
          )
        );

        setErrors({});
        setState("ready");
      } catch (error) {
        if (
          error instanceof
            AdminApiError
        ) {
          if (error.status === 401) {
            await restore();

            setMessage(
              "The Admin session was refreshed. Retry loading the profile."
            );
          } else if (
            error.status === 403
          ) {
            setMessage(
              "This account is not permitted to access the Admin profile."
            );
          } else {
            setMessage(
              error.message
            );
          }
        } else {
          setMessage(
            "The Admin profile could not be loaded."
          );
        }

        setState("error");
      }
    }, [
      identity,
      restore,
    ]);

  useEffect(() => {
    const timer =
      window.setTimeout(() => {
        void loadProfile();
      }, 0);

    return () => {
      window.clearTimeout(
        timer
      );
    };
  }, [loadProfile]);

  const roles =
    identity?.access.access
      .platformRoles ?? [];

  const permissions =
    identity?.access.access
      .platformPermissions ?? [];

  const profileInitials =
    useMemo(
      () =>
        initials(
          profile?.displayName ||
            profile?.fullName ||
            identity?.account
              .fullName ||
            "Admin"
        ),
      [
        identity,
        profile,
      ]
    );

  const save =
    async () => {
      if (
        !identity ||
        !profile ||
        !draft
      ) {
        return;
      }

      const nextErrors =
        validateAdminAccountProfile(
          draft
        );

      setErrors(nextErrors);
      setMessage(null);

      if (
        hasAdminAccountProfileErrors(
          nextErrors
        )
      ) {
        return;
      }

      setState("saving");

      try {
        const updatedProfile =
          await updateAdminProfile(
            identity.accessToken,
            profile,
            draft
          );

        setProfile(
          updatedProfile
        );

        setDraft(
          profileToDraft(
            updatedProfile
          )
        );

        updateAccountName(
          updatedProfile.fullName
        );

        setState("ready");

        setMessage(
          "Account profile saved."
        );
      } catch (error) {
        if (
          error instanceof
            AdminApiError &&
          error.status === 409
        ) {
          setState("conflict");

          setMessage(
            "This profile changed after it was loaded. Reload the latest version before saving again."
          );

          return;
        }

        if (
          error instanceof
            AdminApiError &&
          error.status === 401
        ) {
          await restore();

          setMessage(
            "The session expired and was refreshed. Retry saving the profile."
          );
        } else if (
          error instanceof
            AdminApiError &&
          error.status === 403
        ) {
          setMessage(
            "This account is not permitted to update the Admin profile."
          );
        } else if (
          error instanceof
            AdminApiError
        ) {
          setMessage(
            error.message
          );
        } else {
          setMessage(
            "The account profile could not be saved."
          );
        }

        setState("error");
      }
    };

  if (
    state === "loading" ||
    !identity
  ) {
    return (
      <div
        className={styles.loading}
        aria-live="polite"
      >
        Loading account profile…
      </div>
    );
  }

  if (
    !profile ||
    !draft
  ) {
    return (
      <section
        className={styles.errorState}
        role="alert"
      >
        <h1>
          Account profile unavailable
        </h1>

        <p>
          {message ??
            "The profile could not be loaded."}
        </p>

        <button
          type="button"
          onClick={() => {
            void loadProfile();
          }}
        >
          Retry
        </button>
      </section>
    );
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.identity}>
          <div className={styles.avatar}>
            {profileInitials || "A"}
          </div>

          <div>
            <p>Admin account</p>

            <h1>
              {profile.displayName}
            </h1>

            <span>
              {profile.jobTitle ||
                "Administrator"}
            </span>
          </div>
        </div>

        <button
          type="button"
          className={styles.logoutButton}
          onClick={() => {
            void logout();
          }}
        >
          Sign out
        </button>
      </header>

      {message ? (
        <div
          className={
            state === "conflict" ||
            state === "error"
              ? styles.warning
              : styles.success
          }
          role={
            state === "conflict" ||
            state === "error"
              ? "alert"
              : "status"
          }
        >
          <span>{message}</span>

          {state === "conflict" ||
          state === "error" ? (
            <button
              type="button"
              onClick={() => {
                void loadProfile();
              }}
            >
              Reload profile
            </button>
          ) : null}
        </div>
      ) : null}

      <section className={styles.summary}>
        <article>
          <span>Login email</span>

          <strong>
            {profile.loginEmail}
          </strong>

          <small>
            Managed through secure
            authentication workflows
          </small>
        </article>

        <article>
          <span>Account status</span>

          <strong>
            {identity.account.status}
          </strong>

          <small>
            Email{" "}
            {profile.emailVerifiedAt
              ? "verified"
              : "not verified"}
          </small>
        </article>

        <article>
          <span>Current session</span>

          <strong>Active</strong>

          <small>
            Expires{" "}
            {new Date(
              identity.session.expiresAt
            ).toLocaleString("en-IN")}
          </small>
        </article>
      </section>

      <div className={styles.layout}>
        <AccountProfileForm
          draft={draft}
          errors={errors}
          saving={
            state === "saving"
          }
          onChange={(nextDraft) => {
            setDraft(nextDraft);
            setMessage(null);

            if (
              Object.keys(errors)
                .length > 0
            ) {
              setErrors({});
            }
          }}
          onSubmit={() => {
            void save();
          }}
        />

        <aside className={styles.accessPanel}>
          <section>
            <h2>Platform roles</h2>

            {roles.length ? (
              <ul>
                {roles.map((role) => (
                  <li key={role}>
                    {role.replaceAll(
                      "_",
                      " "
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <p>No platform roles.</p>
            )}
          </section>

          <section>
            <h2>Permissions</h2>

            {permissions.length ? (
              <ul>
                {permissions.map(
                  (permission) => (
                    <li key={permission}>
                      {permission}
                    </li>
                  )
                )}
              </ul>
            ) : (
              <p>
                No platform permissions.
              </p>
            )}
          </section>

          <section>
            <h2>Security</h2>

            <dl>
              <div>
                <dt>
                  Account created
                </dt>

                <dd>
                  {new Date(
                    profile.accountCreatedAt
                  ).toLocaleDateString(
                    "en-IN"
                  )}
                </dd>
              </div>

              <div>
                <dt>
                  Profile updated
                </dt>

                <dd>
                  {new Date(
                    profile.updatedAt
                  ).toLocaleString(
                    "en-IN"
                  )}
                </dd>
              </div>

              <div>
                <dt>Last login</dt>

                <dd>
                  {profile.lastLoginAt
                    ? new Date(
                        profile.lastLoginAt
                      ).toLocaleString(
                        "en-IN"
                      )
                    : "Not available"}
                </dd>
              </div>
            </dl>
          </section>
        </aside>
      </div>
    </div>
  );
}
