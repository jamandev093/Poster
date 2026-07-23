"use client";

import type {
  FormEvent,
} from "react";

import {
  useEffect,
  useState,
} from "react";

import Link from "next/link";
import {
  useRouter,
} from "next/navigation";

import styles from "./AuthForms.module.css";

interface VerifyEmailFormProps {
  email?: string;
}

interface SignupDraft {
  fullName: string;
  businessEmail: string;
}

const SIGNUP_DRAFT_KEY =
  "poster-client-signup-draft";

function saveSignupDraft(
  draft: SignupDraft
) {
  if (
    typeof window ===
    "undefined"
  ) {
    return;
  }

  window.sessionStorage.setItem(
    SIGNUP_DRAFT_KEY,
    JSON.stringify(
      draft
    )
  );
}

function readSignupDraft():
  SignupDraft | null {
  if (
    typeof window ===
    "undefined"
  ) {
    return null;
  }

  const raw =
    window.sessionStorage.getItem(
      SIGNUP_DRAFT_KEY
    );

  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(
      raw
    ) as SignupDraft;
  } catch {
    return null;
  }
}

function clearSignupDraft() {
  if (
    typeof window ===
    "undefined"
  ) {
    return;
  }

  window.sessionStorage.removeItem(
    SIGNUP_DRAFT_KEY
  );
}

function PasswordField({
  id,
  label,
  value,
  onChange,
  autoComplete,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (
    value: string
  ) => void;
  autoComplete: string;
}) {
  const [
    visible,
    setVisible,
  ] =
    useState(false);

  return (
    <div
      className={
        styles.field
      }
    >
      <label htmlFor={id}>
        {label}
      </label>

      <div
        className={
          styles.passwordField
        }
      >
        <input
          id={id}
          type={
            visible
              ? "text"
              : "password"
          }
          value={value}
          onChange={(
            event
          ) =>
            onChange(
              event.target.value
            )
          }
          required
          autoComplete={
            autoComplete
          }
        />

        <button
          type="button"
          onClick={() =>
            setVisible(
              (
                current
              ) =>
                !current
            )
          }
          aria-label={
            visible
              ? "Hide password"
              : "Show password"
          }
        >
          {visible
            ? "Hide"
            : "Show"}
        </button>
      </div>
    </div>
  );
}

export function LoginForm() {
  const router =
    useRouter();

  const [
    email,
    setEmail,
  ] =
    useState("");

  const [
    password,
    setPassword,
  ] =
    useState("");

  const [
    error,
    setError,
  ] =
    useState("");

  const submit = (
    event:
      FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (
      !email.trim() ||
      !password
    ) {
      setError(
        "Enter your business email and password."
      );

      return;
    }

    setError("");

    /*
     * Frontend demonstration only.
     *
     * Backend authentication will later:
     * - validate credentials,
     * - create the secure session,
     * - resolve organization membership,
     * - enforce organization-scoped access.
     */
    router.push(
      "/dashboard"
    );
  };

  return (
    <form
      className={
        styles.form
      }
      onSubmit={
        submit
      }
    >
      <div
        className={
          styles.field
        }
      >
        <label htmlFor="login-email">
          Business email
        </label>

        <input
          id="login-email"
          type="email"
          value={email}
          onChange={(
            event
          ) => {
            setEmail(
              event.target.value
            );

            setError("");
          }}
          required
          autoComplete="email"
        />
      </div>

      <PasswordField
        id="login-password"
        label="Password"
        value={password}
        onChange={(
          value
        ) => {
          setPassword(
            value
          );

          setError("");
        }}
        autoComplete="current-password"
      />

      <div
        className={
          styles.linkRow
        }
      >
        <Link href="/forgot-password">
          Forgot password?
        </Link>
      </div>

      {error ? (
        <div
          className={
            styles.error
          }
          role="alert"
        >
          {error}
        </div>
      ) : null}

      <button
        type="submit"
        className={
          styles.primaryAction
        }
      >
        Sign in
      </button>

      <p
        className={
          styles.switchText
        }
      >
        New business partner?
        {" "}

        <Link href="/signup">
          Create Client account
        </Link>
      </p>
    </form>
  );
}

export function SignupForm() {
  const router =
    useRouter();

  const [
    name,
    setName,
  ] =
    useState("");

  const [
    email,
    setEmail,
  ] =
    useState("");

  const [
    password,
    setPassword,
  ] =
    useState("");

  const [
    confirmation,
    setConfirmation,
  ] =
    useState("");

  const [
    accepted,
    setAccepted,
  ] =
    useState(false);

  const [
    error,
    setError,
  ] =
    useState("");

  const submit = (
    event:
      FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    const normalizedName =
      name.trim();

    const normalizedEmail =
      email
        .trim()
        .toLowerCase();

    if (
      !normalizedName ||
      !normalizedEmail
    ) {
      setError(
        "Enter your name and business email."
      );

      return;
    }

    if (
      password.length <
      8
    ) {
      setError(
        "Use at least 8 characters for the password."
      );

      return;
    }

    if (
      password !==
      confirmation
    ) {
      setError(
        "The passwords do not match."
      );

      return;
    }

    if (!accepted) {
      setError(
        "Confirm that you are authorized to create this business account."
      );

      return;
    }

    saveSignupDraft({
      fullName:
        normalizedName,

      businessEmail:
        normalizedEmail,
    });

    router.push(
      `/verify-email?email=${encodeURIComponent(
        normalizedEmail
      )}`
    );
  };

  return (
    <form
      className={
        styles.form
      }
      onSubmit={
        submit
      }
    >
      <div
        className={
          styles.field
        }
      >
        <label htmlFor="signup-name">
          Full name
        </label>

        <input
          id="signup-name"
          value={name}
          onChange={(
            event
          ) => {
            setName(
              event.target.value
            );

            setError("");
          }}
          required
          autoComplete="name"
        />
      </div>

      <div
        className={
          styles.field
        }
      >
        <label htmlFor="signup-email">
          Business email
        </label>

        <input
          id="signup-email"
          type="email"
          value={email}
          onChange={(
            event
          ) => {
            setEmail(
              event.target.value
            );

            setError("");
          }}
          required
          autoComplete="email"
        />
      </div>

      <PasswordField
        id="signup-password"
        label="Password"
        value={password}
        onChange={(
          value
        ) => {
          setPassword(
            value
          );

          setError("");
        }}
        autoComplete="new-password"
      />

      <PasswordField
        id="signup-confirmation"
        label="Confirm password"
        value={
          confirmation
        }
        onChange={(
          value
        ) => {
          setConfirmation(
            value
          );

          setError("");
        }}
        autoComplete="new-password"
      />

      <label
        className={
          styles.declaration
        }
      >
        <input
          type="checkbox"
          checked={
            accepted
          }
          onChange={(
            event
          ) => {
            setAccepted(
              event.target.checked
            );

            setError("");
          }}
        />

        <span>
          I am authorized to create the primary Poster Client
          account for this organization.
        </span>
      </label>

      {error ? (
        <div
          className={
            styles.error
          }
          role="alert"
        >
          {error}
        </div>
      ) : null}

      <button
        type="submit"
        className={
          styles.primaryAction
        }
      >
        Continue
      </button>

      <p
        className={
          styles.switchText
        }
      >
        Already have a Client account?
        {" "}

        <Link href="/login">
          Sign in
        </Link>
      </p>
    </form>
  );
}

export function VerifyEmailForm({
  email = "",
}: VerifyEmailFormProps) {
  const router =
    useRouter();

  const [
    code,
    setCode,
  ] =
    useState("");

  const [
    error,
    setError,
  ] =
    useState("");

  const [
    resendMessage,
    setResendMessage,
  ] =
    useState("");

  const submit = (
    event:
      FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (
      !/^\d{6}$/.test(
        code
      )
    ) {
      setError(
        "Enter the 6-digit verification code."
      );

      return;
    }

    setError("");

    router.push(
      "/onboarding/organization"
    );
  };

  const resend =
    () => {
      /*
       * Do not pretend that an email was sent.
       * Email delivery is not connected yet.
       */
      setResendMessage(
        "Email delivery is not connected in this frontend build."
      );
    };

  return (
    <form
      className={
        styles.form
      }
      onSubmit={
        submit
      }
    >
      {email ? (
        <div
          className={
            styles.emailSummary
          }
        >
          Verification email:
          {" "}

          <strong>
            {email}
          </strong>
        </div>
      ) : null}

      <div
        className={
          styles.field
        }
      >
        <label htmlFor="verification-code">
          Verification code
        </label>

        <input
          id="verification-code"
          value={code}
          onChange={(
            event
          ) => {
            setCode(
              event.target.value
                .replace(
                  /\D/g,
                  ""
                )
                .slice(
                  0,
                  6
                )
            );

            setError("");

            setResendMessage(
              ""
            );
          }}
          inputMode="numeric"
          autoComplete="one-time-code"
          placeholder="000000"
          className={
            styles.codeInput
          }
          required
        />
      </div>

      <div
        className={
          styles.scopeNote
        }
      >
        <strong>
          Frontend test mode
        </strong>

        <span>
          Email delivery is not connected yet. Any 6-digit
          code continues the current frontend flow.
        </span>
      </div>

      {error ? (
        <div
          className={
            styles.error
          }
          role="alert"
        >
          {error}
        </div>
      ) : null}

      {resendMessage ? (
        <div
          className={
            styles.helperMessage
          }
          role="status"
        >
          {resendMessage}
        </div>
      ) : null}

      <button
        type="submit"
        className={
          styles.primaryAction
        }
      >
        Verify email
      </button>

      <button
        type="button"
        className={
          styles.textButton
        }
        onClick={
          resend
        }
      >
        Resend code
      </button>
    </form>
  );
}

export function OrganizationOnboardingForm() {
  const router =
    useRouter();

  const [
    signupDraft,
    setSignupDraft,
  ] =
    useState<SignupDraft | null>(
      null
    );

  const [
    organization,
    setOrganization,
  ] =
    useState("");

  const [
    website,
    setWebsite,
  ] =
    useState("");

  const [
    industry,
    setIndustry,
  ] =
    useState(
      "Professional learning"
    );

  const [
    country,
    setCountry,
  ] =
    useState(
      "India"
    );

  const [
    billingEmail,
    setBillingEmail,
  ] =
    useState("");

  const [
    objective,
    setObjective,
  ] =
    useState(
      "direct_sponsorship"
    );


     useEffect(
  () => {
    const timeoutId =
      window.setTimeout(
        () => {
          const draft =
            readSignupDraft();

          setSignupDraft(
            draft
          );

          if (
            draft?.businessEmail
          ) {
            setBillingEmail(
              draft.businessEmail
            );
          }
        },
        0
      );

    return () => {
      window.clearTimeout(
        timeoutId
      );
    };
  },
  []
);


  const submit = (
    event:
      FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    /*
     * Frontend-only onboarding.
     *
     * Backend integration will later create the organization,
     * connect the verified primary Client account, and enforce
     * organization ownership.
     */
    clearSignupDraft();

    router.push(
      "/dashboard"
    );
  };

  return (
    <form
      className={
        styles.form
      }
      onSubmit={
        submit
      }
    >
      {signupDraft ? (
        <div
          className={
            styles.accountSummary
          }
        >
          <div>
            <span>
              Primary client
            </span>

            <strong>
              {
                signupDraft.fullName
              }
            </strong>
          </div>

          <div>
            <span>
              Business email
            </span>

            <strong>
              {
                signupDraft.businessEmail
              }
            </strong>
          </div>
        </div>
      ) : null}

      <div
        className={
          styles.field
        }
      >
        <label htmlFor="onboarding-organization">
          Organization name
        </label>

        <input
          id="onboarding-organization"
          value={
            organization
          }
          onChange={(
            event
          ) =>
            setOrganization(
              event.target.value
            )
          }
          required
          autoComplete="organization"
        />
      </div>

      <div
        className={
          styles.field
        }
      >
        <label htmlFor="onboarding-website">
          Organization website
        </label>

        <input
          id="onboarding-website"
          type="url"
          value={
            website
          }
          onChange={(
            event
          ) =>
            setWebsite(
              event.target.value
            )
          }
          required
          placeholder="https://"
          autoComplete="url"
        />
      </div>

      <div
        className={
          styles.field
        }
      >
        <label htmlFor="onboarding-industry">
          Industry
        </label>

        <input
          id="onboarding-industry"
          value={
            industry
          }
          onChange={(
            event
          ) =>
            setIndustry(
              event.target.value
            )
          }
          required
        />
      </div>

      <div
        className={
          styles.twoColumns
        }
      >
        <div
          className={
            styles.field
          }
        >
          <label htmlFor="onboarding-country">
            Country
          </label>

          <select
            id="onboarding-country"
            value={
              country
            }
            onChange={(
              event
            ) =>
              setCountry(
                event.target.value
              )
            }
            required
          >
            <option value="India">
              India
            </option>

            <option value="United States">
              United States
            </option>

            <option value="United Kingdom">
              United Kingdom
            </option>

            <option value="Singapore">
              Singapore
            </option>

            <option value="Other">
              Other
            </option>
          </select>
        </div>

        <div
          className={
            styles.field
          }
        >
          <label htmlFor="onboarding-billing-email">
            Billing email
          </label>

          <input
            id="onboarding-billing-email"
            type="email"
            value={
              billingEmail
            }
            onChange={(
              event
            ) =>
              setBillingEmail(
                event.target.value
              )
            }
            required
            autoComplete="email"
          />
        </div>
      </div>

      <div
        className={
          styles.field
        }
      >
        <label htmlFor="onboarding-objective">
          Primary objective
        </label>

        <select
          id="onboarding-objective"
          value={
            objective
          }
          onChange={(
            event
          ) =>
            setObjective(
              event.target.value
            )
          }
        >
          <option value="direct_sponsorship">
            Direct sponsorship
          </option>

          <option value="affiliate">
            Affiliate partnership
          </option>

          <option value="both">
            Sponsorship and affiliate
          </option>
        </select>
      </div>

      <div
        className={
          styles.scopeNote
        }
      >
        <strong>
          Initial workspace
        </strong>

        <span>
          One organization and one primary Client account.
          Team access will be added later.
        </span>
      </div>

      <button
        type="submit"
        className={
          styles.primaryAction
        }
      >
        Open Client workspace
      </button>
    </form>
  );
}

export function ForgotPasswordForm() {
  const [
    email,
    setEmail,
  ] =
    useState("");

  const [
    submitted,
    setSubmitted,
  ] =
    useState(false);

  const submit = (
    event:
      FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    setSubmitted(
      true
    );
  };

  if (submitted) {
    return (
      <div
        className={
          styles.result
        }
      >
        <span
          className={
            styles.resultMark
          }
        >
          ✓
        </span>

        <h3>
          Reset request recorded
        </h3>

        <p>
          Email delivery is not connected in this frontend build.
          Production recovery will send a secure reset link to the
          verified business email.
        </p>

        <Link
          href="/login"
          className={
            styles.primaryAction
          }
        >
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <form
      className={
        styles.form
      }
      onSubmit={
        submit
      }
    >
      <div
        className={
          styles.field
        }
      >
        <label htmlFor="forgot-email">
          Business email
        </label>

        <input
          id="forgot-email"
          type="email"
          value={email}
          onChange={(
            event
          ) =>
            setEmail(
              event.target.value
            )
          }
          required
          autoComplete="email"
        />
      </div>

      <button
        type="submit"
        className={
          styles.primaryAction
        }
      >
        Continue
      </button>

      <p
        className={
          styles.switchText
        }
      >
        Remembered your password?
        {" "}

        <Link href="/login">
          Sign in
        </Link>
      </p>
    </form>
  );
}

export function ResetPasswordForm() {
  const router =
    useRouter();

  const [
    password,
    setPassword,
  ] =
    useState("");

  const [
    confirmation,
    setConfirmation,
  ] =
    useState("");

  const [
    error,
    setError,
  ] =
    useState("");

  const submit = (
    event:
      FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (
      password.length <
      8
    ) {
      setError(
        "Use at least 8 characters for the password."
      );

      return;
    }

    if (
      password !==
      confirmation
    ) {
      setError(
        "The passwords do not match."
      );

      return;
    }

    setError("");

    router.push(
      "/login"
    );
  };

  return (
    <form
      className={
        styles.form
      }
      onSubmit={
        submit
      }
    >
      <div
        className={
          styles.scopeNote
        }
      >
        <strong>
          Frontend test route
        </strong>

        <span>
          Production password reset will require a valid,
          time-limited recovery token before this form can open.
        </span>
      </div>

      <PasswordField
        id="reset-password"
        label="New password"
        value={password}
        onChange={(
          value
        ) => {
          setPassword(
            value
          );

          setError("");
        }}
        autoComplete="new-password"
      />

      <PasswordField
        id="reset-confirmation"
        label="Confirm new password"
        value={
          confirmation
        }
        onChange={(
          value
        ) => {
          setConfirmation(
            value
          );

          setError("");
        }}
        autoComplete="new-password"
      />

      {error ? (
        <div
          className={
            styles.error
          }
          role="alert"
        >
          {error}
        </div>
      ) : null}

      <button
        type="submit"
        className={
          styles.primaryAction
        }
      >
        Save new password
      </button>
    </form>
  );
}