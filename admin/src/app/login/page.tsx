"use client";

import {
  type FormEvent,
  useState,
} from "react";

import useAdminAuth from "@/features/auth/hooks/useAdminAuth";

import styles from "./login.module.css";

export default function AdminLoginPage() {
  const {
    login,
    status,
    errorMessage,
  } = useAdminAuth();

  const [
    email,
    setEmail,
  ] = useState("");

  const [
    password,
    setPassword,
  ] = useState("");

  const submitting =
    status === "restoring";

  const submit = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    await login({
      email: email.trim(),
      password,
    });
  };

  return (
    <main className={styles.page}>
      <section className={styles.card}>
        <div className={styles.brand}>
          P
        </div>

        <p className={styles.eyebrow}>
          Poster operations
        </p>

        <h1>Admin sign in</h1>

        <p className={styles.intro}>
          Sign in with an authorized
          Poster administrator account.
        </p>

        <form
          className={styles.form}
          onSubmit={submit}
        >
          <label>
            <span>Business email</span>

            <input
              type="email"
              autoComplete="username"
              required
              value={email}
              onChange={(event) => {
                setEmail(
                  event.target.value
                );
              }}
            />
          </label>

          <label>
            <span>Password</span>

            <input
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(event) => {
                setPassword(
                  event.target.value
                );
              }}
            />
          </label>

          {errorMessage ? (
            <p
              className={styles.error}
              role="alert"
            >
              {errorMessage}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={submitting}
          >
            {submitting
              ? "Signing in…"
              : "Sign in"}
          </button>
        </form>
      </section>
    </main>
  );
}
