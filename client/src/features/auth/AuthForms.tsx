"use client";

import type {
  FormEvent,
} from "react";

import {
  useState,
} from "react";

import Link from "next/link";
import {
  useRouter,
} from "next/navigation";

import {
  getClientAccount,
  updateClientCurrentOrganization,
} from "@/features/account/client-account.service";
import styles from "./AuthForms.module.css";

import {
  loginClient,
  requestClientPasswordReset,
  signupClient,
  verifyClientSignupEmail,
} from "./client-auth.service";

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

  const [
    isSubmitting,
    setIsSubmitting,
  ] =
    useState(false);

  const submit = async (
    event:
      FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    const normalizedEmail =
      email.trim();

    if (
      !normalizedEmail ||
      !password
    ) {
      setError(
        "Enter your business email and password."
      );

      return;
    }

    setError("");
    setIsSubmitting(true);

    try {
      await loginClient({
        email:
          normalizedEmail,
        password,
      });

      router.push(
        "/dashboard"
      );
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Poster could not sign you in. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
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
      <label
        className={
          styles.field
        }
      >
        <span>
          Business email
        </span>
        <input
          type="email"
          value={
            email
          }
          onChange={
            (
              event
            ) =>
              setEmail(
                event.target.value
              )
          }
          placeholder="you@company.com"
          autoComplete="email"
        />
      </label>

      <label
        className={
          styles.field
        }
      >
        <span>
          Password
        </span>
        <input
          type="password"
          value={
            password
          }
          onChange={
            (
              event
            ) =>
              setPassword(
                event.target.value
              )
          }
          placeholder="Enter your password"
          autoComplete="current-password"
        />
      </label>

      {error ? (
        <p
          className={
            styles.error
          }
        >
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        className={
          styles.primaryAction
        }
        disabled={
          isSubmitting
        }
      >
        {isSubmitting
          ? "Signing in..."
          : "Sign in"}
      </button>
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

  const [
    isSubmitting,
    setIsSubmitting,
  ] =
    useState(false);

  const submit = async (
    event:
      FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

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

    setError("");
    setIsSubmitting(true);

    try {
      await signupClient({
        fullName:
          normalizedName,
        email:
          normalizedEmail,
        password,
      });

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
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Poster could not create this Client account. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
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
          disabled={
            isSubmitting
          }
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
          disabled={
            isSubmitting
          }
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
          disabled={
            isSubmitting
          }
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
        disabled={
          isSubmitting
        }
      >
        {isSubmitting
          ? "Creating account..."
          : "Continue"}
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

  const [
    isSubmitting,
    setIsSubmitting,
  ] =
    useState(false);

  const submit = async (
    event:
      FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    const normalizedEmail =
      email
        .trim()
        .toLowerCase();

    if (!normalizedEmail) {
      setError(
        "Open the verification link from the same signup flow or sign up again."
      );

      return;
    }

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
    setResendMessage("");
    setIsSubmitting(true);

    try {
      await verifyClientSignupEmail({
        email:
          normalizedEmail,
        token:
          code,
      });

      router.push(
        "/onboarding/organization"
      );
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Poster could not verify this email. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const resend =
    () => {
      setResendMessage(
        "Use the latest verification code from your email."
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
            setResendMessage("");
          }}
          inputMode="numeric"
          autoComplete="one-time-code"
          placeholder="000000"
          className={
            styles.codeInput
          }
          required
          disabled={
            isSubmitting
          }
        />
      </div>

      <div
        className={
          styles.scopeNote
        }
      >
        <strong>
          Backend-connected verification
        </strong>

        <span>
          Poster Backend verifies the signup code before opening organization setup.
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
        disabled={
          isSubmitting
        }
      >
        {isSubmitting
          ? "Verifying..."
          : "Verify email"}
      </button>

      <button
        type="button"
        className={
          styles.textButton
        }
        onClick={
          resend
        }
        disabled={
          isSubmitting
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
  ] =
    useState<SignupDraft | null>(
      () =>
        readSignupDraft()
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
    useState("");

  const [
    country,
    setCountry,
  ] =
    useState("IN");

  const [
    billingEmail,
    setBillingEmail,
  ] =
    useState(
      () =>
        readSignupDraft()
          ?.businessEmail ??
        ""
    );

  const [
    objective,
    setObjective,
  ] =
    useState("");

  const [
    isSubmitting,
    setIsSubmitting,
  ] =
    useState(false);

  const [
    errorMessage,
    setErrorMessage,
  ] =
    useState("");

  const submit = async (
    event:
      FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    setIsSubmitting(
      true
    );

    setErrorMessage(
      ""
    );

    try {
      const account =
        await getClientAccount();

      await updateClientCurrentOrganization({
        displayName:
          organization.trim(),

        legalName:
          organization.trim(),

        websiteUrl:
          website.trim() ||
          null,

        billingEmail:
          billingEmail.trim() ||
          account.user.email,

        countryCode:
          country
            .trim()
            .toUpperCase() ||
          "IN",

        expectedRowVersion:
          account.organization.rowVersion,
      });

      clearSignupDraft();

      router.push(
        "/dashboard"
      );
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Organization setup could not be saved."
      );
    } finally {
      setIsSubmitting(
        false
      );
    }
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
          autoComplete="organization"
          required
          disabled={
            isSubmitting
          }
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
          placeholder="https://example.com"
          autoComplete="url"
          disabled={
            isSubmitting
          }
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
          placeholder="Media, retail, education..."
          autoComplete="organization-title"
          disabled={
            isSubmitting
          }
        />
      </div>

      <div
        className={
          styles.field
        }
      >
        <label htmlFor="onboarding-country">
          Country
        </label>

        <input
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
          placeholder="IN"
          autoComplete="country"
          maxLength={2}
          required
          disabled={
            isSubmitting
          }
        />
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
          autoComplete="email"
          disabled={
            isSubmitting
          }
        />
      </div>

      <div
        className={
          styles.field
        }
      >
        <label htmlFor="onboarding-objective">
          Primary objective
        </label>

        <textarea
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
          placeholder="Launch campaigns, review performance, and manage Wallet funding."
          disabled={
            isSubmitting
          }
        />
      </div>

      <div
        className={
          styles.scopeNote
        }
      >
        <strong>
          Backend-connected setup
        </strong>

        <span>
          Organization profile is saved through Poster Backend. Payments remain deferred.
        </span>
      </div>

      {errorMessage ? (
        <div
          className={
            styles.error
          }
          role="alert"
        >
          {errorMessage}
        </div>
      ) : null}

      <button
        type="submit"
        className={
          styles.primaryAction
        }
        disabled={
          isSubmitting
        }
      >
        {isSubmitting
          ? "Saving organization..."
          : "Open Client workspace"}
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

  const [
    error,
    setError,
  ] =
    useState("");

  const [
    isSubmitting,
    setIsSubmitting,
  ] =
    useState(false);

  const submit = async (
    event:
      FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    const normalizedEmail =
      email
        .trim()
        .toLowerCase();

    if (!normalizedEmail) {
      setError(
        "Enter your business email."
      );

      return;
    }

    setError("");
    setIsSubmitting(true);

    try {
      await requestClientPasswordReset({
        email:
          normalizedEmail,
      });

      setSubmitted(
        true
      );
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Poster could not start password recovery. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
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
          OK
        </span>

        <h3>
          Check your email
        </h3>

        <p>
          If this Client account exists, Poster has sent password reset instructions to the business email.
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
          ) => {
            setEmail(
              event.target.value
            );

            setError("");
          }}
          required
          autoComplete="email"
          disabled={
            isSubmitting
          }
        />
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
        disabled={
          isSubmitting
        }
      >
        {isSubmitting
          ? "Sending..."
          : "Continue"}
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