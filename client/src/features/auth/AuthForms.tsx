"use client";

import type { FormEvent } from "react";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import styles from "./AuthForms.module.css";

interface VerifyEmailFormProps {
  email?: string;
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
  onChange: (value: string) => void;
  autoComplete: string;
}) {
  const [visible, setVisible] = useState(false);

  return (
    <div className={styles.field}>
      <label htmlFor={id}>{label}</label>

      <div className={styles.passwordField}>
        <input
          id={id}
          type={visible ? "text" : "password"}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          required
          autoComplete={autoComplete}
        />

        <button
          type="button"
          onClick={() => setVisible((current) => !current)}
          aria-label={visible ? "Hide password" : "Show password"}
        >
          {visible ? "Hide" : "Show"}
        </button>
      </div>
    </div>
  );
}

export function LoginForm() {
  const router = useRouter();

  const [email, setEmail] =
    useState("marketing@examplecloud.com");

  const [password, setPassword] =
    useState("ClientDemo123");

  const [remember, setRemember] = useState(true);
  const [error, setError] = useState("");

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!email.trim() || !password) {
      setError("Enter your business email and password.");
      return;
    }

    setError("");

    /*
     * Frontend demonstration.
     * Backend authentication will later create
     * the secure organization-scoped session.
     */
    router.push("/dashboard");
  };

  return (
    <form className={styles.form} onSubmit={submit}>
      <div className={styles.field}>
        <label htmlFor="login-email">Business email</label>

        <input
          id="login-email"
          type="email"
          value={email}
          onChange={(event) => {
            setEmail(event.target.value);
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
        onChange={(value) => {
          setPassword(value);
          setError("");
        }}
        autoComplete="current-password"
      />

      <div className={styles.formOptions}>
        <label className={styles.checkbox}>
          <input
            type="checkbox"
            checked={remember}
            onChange={(event) => setRemember(event.target.checked)}
          />

          <span>Keep me signed in</span>
        </label>

        <Link href="/forgot-password">Forgot password?</Link>
      </div>

      {error ? (
        <div className={styles.error} role="alert">
          {error}
        </div>
      ) : null}

      <button type="submit" className={styles.primaryAction}>
        Sign in
      </button>

      <p className={styles.switchText}>
        New to Poster Client?{" "}
        <Link href="/signup">Create business account</Link>
      </p>

      <p className={styles.demoNote}>
        Frontend demonstration login
      </p>
    </form>
  );
}

export function SignupForm() {
  const router = useRouter();

  const [organization, setOrganization] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [website, setWebsite] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [accepted, setAccepted] = useState(false);
  const [error, setError] = useState("");

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (password.length < 8) {
      setError("Use at least 8 characters for the password.");
      return;
    }

    if (password !== confirmation) {
      setError("The passwords do not match.");
      return;
    }

    if (!accepted) {
      setError("Accept the business account terms to continue.");
      return;
    }

    router.push(
      `/verify-email?email=${encodeURIComponent(email.trim())}`
    );
  };

  return (
    <form className={styles.form} onSubmit={submit}>
      <div className={styles.twoColumns}>
        <div className={styles.field}>
          <label htmlFor="signup-organization">
            Organization
          </label>

          <input
            id="signup-organization"
            value={organization}
            onChange={(event) => setOrganization(event.target.value)}
            required
            autoComplete="organization"
          />
        </div>

        <div className={styles.field}>
          <label htmlFor="signup-name">Full name</label>

          <input
            id="signup-name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            required
            autoComplete="name"
          />
        </div>
      </div>

      <div className={styles.field}>
        <label htmlFor="signup-email">Business email</label>

        <input
          id="signup-email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
          autoComplete="email"
        />
      </div>

      <div className={styles.field}>
        <label htmlFor="signup-website">Organization website</label>

        <input
          id="signup-website"
          type="url"
          value={website}
          onChange={(event) => setWebsite(event.target.value)}
          required
          placeholder="https://"
        />
      </div>

      <PasswordField
        id="signup-password"
        label="Password"
        value={password}
        onChange={(value) => {
          setPassword(value);
          setError("");
        }}
        autoComplete="new-password"
      />

      <PasswordField
        id="signup-confirmation"
        label="Confirm password"
        value={confirmation}
        onChange={(value) => {
          setConfirmation(value);
          setError("");
        }}
        autoComplete="new-password"
      />

      <label className={styles.declaration}>
        <input
          type="checkbox"
          checked={accepted}
          onChange={(event) => {
            setAccepted(event.target.checked);
            setError("");
          }}
        />

        <span>
          I am authorized to create this organization’s primary
          Poster Client account.
        </span>
      </label>

      {error ? (
        <div className={styles.error} role="alert">
          {error}
        </div>
      ) : null}

      <button type="submit" className={styles.primaryAction}>
        Create account
      </button>

      <p className={styles.switchText}>
        Already registered? <Link href="/login">Sign in</Link>
      </p>
    </form>
  );
}

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className={styles.result}>
        <span className={styles.resultMark}>✓</span>

        <h3>Recovery instructions prepared</h3>

        <p>
          A secure password-reset email will be sent when Client
          email services are connected.
        </p>

        <Link href="/login" className={styles.primaryAction}>
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <form className={styles.form} onSubmit={submit}>
      <div className={styles.field}>
        <label htmlFor="forgot-email">Business email</label>

        <input
          id="forgot-email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
          autoComplete="email"
        />
      </div>

      <button type="submit" className={styles.primaryAction}>
        Continue
      </button>

      <p className={styles.switchText}>
        Remembered your password? <Link href="/login">Sign in</Link>
      </p>
    </form>
  );
}

export function ResetPasswordForm() {
  const router = useRouter();

  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState("");

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (password.length < 8) {
      setError("Use at least 8 characters for the password.");
      return;
    }

    if (password !== confirmation) {
      setError("The passwords do not match.");
      return;
    }

    router.push("/login");
  };

  return (
    <form className={styles.form} onSubmit={submit}>
      <PasswordField
        id="reset-password"
        label="New password"
        value={password}
        onChange={(value) => {
          setPassword(value);
          setError("");
        }}
        autoComplete="new-password"
      />

      <PasswordField
        id="reset-confirmation"
        label="Confirm new password"
        value={confirmation}
        onChange={(value) => {
          setConfirmation(value);
          setError("");
        }}
        autoComplete="new-password"
      />

      {error ? (
        <div className={styles.error} role="alert">
          {error}
        </div>
      ) : null}

      <button type="submit" className={styles.primaryAction}>
        Save new password
      </button>
    </form>
  );
}

export function VerifyEmailForm({
  email = "",
}: VerifyEmailFormProps) {
  const router = useRouter();

  const [code, setCode] = useState("");
  const [error, setError] = useState("");

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!/^\d{6}$/.test(code)) {
      setError("Enter the 6-digit verification code.");
      return;
    }

    router.push("/onboarding/organization");
  };

  return (
    <form className={styles.form} onSubmit={submit}>
      {email ? (
        <div className={styles.emailSummary}>
          Verification email: <strong>{email}</strong>
        </div>
      ) : null}

      <div className={styles.field}>
        <label htmlFor="verification-code">
          Verification code
        </label>

        <input
          id="verification-code"
          value={code}
          onChange={(event) => {
            setCode(
              event.target.value.replace(/\D/g, "").slice(0, 6)
            );
            setError("");
          }}
          inputMode="numeric"
          autoComplete="one-time-code"
          placeholder="000000"
          className={styles.codeInput}
          required
        />
      </div>

      {error ? (
        <div className={styles.error} role="alert">
          {error}
        </div>
      ) : null}

      <button type="submit" className={styles.primaryAction}>
        Verify email
      </button>

      <button type="button" className={styles.textButton}>
        Resend code
      </button>

      <p className={styles.demoNote}>
        Any 6-digit code works in this frontend demonstration.
      </p>
    </form>
  );
}

export function OrganizationOnboardingForm() {
  const router = useRouter();

  const [industry, setIndustry] =
    useState("Professional learning");

  const [country, setCountry] = useState("India");
  const [billingEmail, setBillingEmail] = useState("");
  const [objective, setObjective] =
    useState("direct_sponsorship");

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    router.push("/dashboard");
  };

  return (
    <form className={styles.form} onSubmit={submit}>
      <div className={styles.field}>
        <label htmlFor="onboarding-industry">Industry</label>

        <input
          id="onboarding-industry"
          value={industry}
          onChange={(event) => setIndustry(event.target.value)}
          required
        />
      </div>

      <div className={styles.twoColumns}>
        <div className={styles.field}>
          <label htmlFor="onboarding-country">Country</label>

          <select
            id="onboarding-country"
            value={country}
            onChange={(event) => setCountry(event.target.value)}
            required
          >
            <option value="India">India</option>
            <option value="United States">United States</option>
            <option value="United Kingdom">United Kingdom</option>
            <option value="Singapore">Singapore</option>
            <option value="Other">Other</option>
          </select>
        </div>

        <div className={styles.field}>
          <label htmlFor="onboarding-billing-email">
            Billing email
          </label>

          <input
            id="onboarding-billing-email"
            type="email"
            value={billingEmail}
            onChange={(event) => setBillingEmail(event.target.value)}
            required
          />
        </div>
      </div>

      <div className={styles.field}>
        <label htmlFor="onboarding-objective">
          Primary objective
        </label>

        <select
          id="onboarding-objective"
          value={objective}
          onChange={(event) => setObjective(event.target.value)}
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

      <div className={styles.scopeNote}>
        <strong>Initial account</strong>
        <span>
          One organization and one primary client. Team members are
          added only after the platform is stable.
        </span>
      </div>

      <button type="submit" className={styles.primaryAction}>
        Open Client workspace
      </button>
    </form>
  );
}