"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import useAdminAuth from "@/features/auth/hooks/useAdminAuth";

import AccountProfileForm from "./forms/AccountProfileForm";

import type {
  AdminAccountProfile,
  AdminAccountProfileDraft,
  AdminAccountProfileErrors,
} from "./contracts/account-profile.types";

import {
  createInitialAdminProfile,
  loadStoredAdminProfile,
  saveStoredAdminProfile,
} from "./services/account-profile.service";

import {
  hasAdminAccountProfileErrors,
  validateAdminAccountProfile,
} from "./validation/account-profile.validation";

import styles from "./AccountProfileManager.module.css";

function profileToDraft(
  profile: AdminAccountProfile
): AdminAccountProfileDraft {
  return {
    fullName: profile.fullName,
    displayName:
      profile.displayName,
    jobTitle: profile.jobTitle,
    businessEmail:
      profile.businessEmail,
    primaryPhone:
      profile.primaryPhone,
    alternatePhone:
      profile.alternatePhone,
    signalAccount:
      profile.signalAccount,
    telegramUsername:
      profile.telegramUsername,
    preferredLanguage:
      profile.preferredLanguage,
    timeZone: profile.timeZone,
  };
}

function initials(value: string) {
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
    saved,
    setSaved,
  ] = useState(false);

  useEffect(() => {
    if (!identity) {
      return;
    }

    const timer =
      window.setTimeout(() => {
        const stored =
          loadStoredAdminProfile();

        const nextProfile =
          stored?.userId ===
          identity.account.id
            ? stored
            : createInitialAdminProfile({
                userId:
                  identity.account.id,
                loginEmail:
                  identity.account.email,
                fullName:
                  identity.account.fullName,
                emailVerifiedAt:
                  identity.account
                    .emailVerifiedAt,
                createdAt:
                  identity.account
                    .createdAt,
              });

        setProfile(nextProfile);
        setDraft(
          profileToDraft(nextProfile)
        );
      }, 0);

    return () => {
      window.clearTimeout(timer);
    };
  }, [identity]);

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
            "Admin"
        ),
      [profile]
    );

  if (
    !identity ||
    !profile ||
    !draft
  ) {
    return (
      <div className={styles.loading}>
        Loading account profile…
      </div>
    );
  }

  const save = () => {
    const nextErrors =
      validateAdminAccountProfile(
        draft
      );

    setErrors(nextErrors);
    setSaved(false);

    if (
      hasAdminAccountProfileErrors(
        nextErrors
      )
    ) {
      return;
    }

    const nextProfile =
      saveStoredAdminProfile(
        profile,
        draft
      );

    setProfile(nextProfile);
    setDraft(
      profileToDraft(nextProfile)
    );
    setSaved(true);
  };

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

      {saved ? (
        <div
          className={styles.success}
          role="status"
        >
          Account profile saved locally.
          Backend persistence will replace
          this temporary adapter.
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
          <strong>
            Active
          </strong>
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
          saving={false}
          onChange={(nextDraft) => {
            setDraft(nextDraft);
            setSaved(false);

            if (
              Object.keys(errors)
                .length > 0
            ) {
              setErrors({});
            }
          }}
          onSubmit={save}
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
                <dt>Created</dt>
                <dd>
                  {new Date(
                    profile.createdAt
                  ).toLocaleDateString(
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
