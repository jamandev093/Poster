"use client";

import {
  FormEvent,
  useState,
} from "react";

import {
  useRouter,
} from "next/navigation";

import {
  PublicCopyrightClaimError,
  submitPublicCopyrightClaim,
} from "./public-copyright.service";

import type {
  PublicCopyrightRelationship,
} from "./public-copyright.types";

import styles from "./CopyrightForms.module.css";

interface CopyrightClaimFormProps {
  initialAffectedContent?: string;
}

interface DeclarationState {
  goodFaith: boolean;
  accurate: boolean;
  authorized: boolean;
}

function readFormValue(
  formData:
    FormData,
  key: string
): string {
  const value =
    formData.get(
      key
    );

  return typeof value === "string"
    ? value.trim()
    : "";
}

function readOptionalFormValue(
  formData:
    FormData,
  key: string
): string | null {
  const value =
    readFormValue(
      formData,
      key
    );

  return value.length > 0
    ? value
    : null;
}

function readRelationship(
  value: string
): PublicCopyrightRelationship {
  if (
    value === "owner" ||
    value === "authorized" ||
    value === "publisher"
  ) {
    return value;
  }

  return "owner";
}

export default function CopyrightClaimForm({
  initialAffectedContent = "",
}: CopyrightClaimFormProps) {
  const router =
    useRouter();

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

  const [
    declarations,
    setDeclarations,
  ] =
    useState<DeclarationState>({
      goodFaith: false,
      accurate: false,
      authorized: false,
    });

  const submitClaim = async (
    event:
      FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (
      isSubmitting
    ) {
      return;
    }

    if (
      !declarations.goodFaith ||
      !declarations.accurate ||
      !declarations.authorized
    ) {
      setError(
        "Please confirm all required declarations before submitting."
      );

      return;
    }

    const formData =
      new FormData(
        event.currentTarget
      );

    setError("");
    setIsSubmitting(
      true
    );

    try {
      const claim =
        await submitPublicCopyrightClaim({
          claimantName:
            readFormValue(
              formData,
              "claimantName"
            ),

          organization:
            readOptionalFormValue(
              formData,
              "organization"
            ),

          email:
            readFormValue(
              formData,
              "email"
            ),

          relationship:
            readRelationship(
              readFormValue(
                formData,
                "relationship"
              )
            ),

          workTitle:
            readFormValue(
              formData,
              "workTitle"
            ),

          originalUrl:
            readOptionalFormValue(
              formData,
              "originalUrl"
            ),

          affectedContent:
            readFormValue(
              formData,
              "affectedContent"
            ),

          explanation:
            readFormValue(
              formData,
              "explanation"
            ),

          evidence:
            readOptionalFormValue(
              formData,
              "evidence"
            ),

          legalName:
            readFormValue(
              formData,
              "legalName"
            ),

          declarations,
        });

      router.push(
        `/submitted?reference=${encodeURIComponent(
          claim.reference
        )}`
      );
    } catch (
      caughtError
    ) {
      if (
        caughtError instanceof
        PublicCopyrightClaimError
      ) {
        const issueText =
          caughtError.issues.length > 0
            ? ` ${caughtError.issues.join(" ")}`
            : "";

        setError(
          `${caughtError.message}${issueText}`
        );
      } else {
        setError(
          "The copyright claim could not be submitted. Please try again."
        );
      }
    } finally {
      setIsSubmitting(
        false
      );
    }
  };

  return (
    <form
      className={styles.form}
      onSubmit={submitClaim}
    >
      <section className={styles.formSection}>
        <div className={styles.sectionHeading}>
          <span className={styles.stepNumber}>
            1
          </span>

          <div>
            <h2>
              Claimant
            </h2>

            <p>
              Identify the rights holder or authorized
              representative for this request.
            </p>
          </div>
        </div>

        <div className={styles.formGrid}>
          <div className={styles.formField}>
            <label htmlFor="claimant-name">
              Rights holder / claimant name *
            </label>

            <input
              id="claimant-name"
              name="claimantName"
              placeholder="Example Publisher"
              autoComplete="name"
              required
            />
          </div>

          <div className={styles.formField}>
            <label htmlFor="organization">
              Organization
            </label>

            <input
              id="organization"
              name="organization"
              placeholder="Company, publisher, or rights owner"
              autoComplete="organization"
            />
          </div>

          <div className={styles.formField}>
            <label htmlFor="email">
              Contact email *
            </label>

            <input
              id="email"
              type="email"
              name="email"
              placeholder="rights@example.com"
              autoComplete="email"
              required
            />
          </div>

          <div className={styles.formField}>
            <label htmlFor="relationship">
              Relationship to the work *
            </label>

            <select
              id="relationship"
              name="relationship"
              defaultValue="owner"
              required
            >
              <option value="owner">
                Rights holder
              </option>

              <option value="authorized">
                Authorized representative
              </option>

              <option value="publisher">
                Publisher / organization
              </option>
            </select>
          </div>
        </div>
      </section>

      <section className={styles.formSection}>
        <div className={styles.sectionHeading}>
          <span className={styles.stepNumber}>
            2
          </span>

          <div>
            <h2>
              Original work
            </h2>

            <p>
              Tell Poster which original work is being
              referenced by the affected Poster record.
            </p>
          </div>
        </div>

        <div className={styles.formGrid}>
          <div className={styles.formField}>
            <label htmlFor="work-title">
              Original work title *
            </label>

            <input
              id="work-title"
              name="workTitle"
              placeholder="Original article, page, video, or work title"
              required
            />
          </div>

          <div className={styles.formField}>
            <label htmlFor="original-url">
              Original publication URL
            </label>

            <input
              id="original-url"
              name="originalUrl"
              type="url"
              placeholder="https://publisher.example/original-work"
            />
          </div>
        </div>
      </section>

      <section className={styles.formSection}>
        <div className={styles.sectionHeading}>
          <span className={styles.stepNumber}>
            3
          </span>

          <div>
            <h2>
              Affected Poster content
            </h2>

            <p>
              Provide the Poster Content ID, Poster URL,
              or original-source URL connected to this
              claim.
            </p>
          </div>
        </div>

        <div className={styles.formField}>
          <label htmlFor="affected-content">
            Affected content *
          </label>

          <input
            id="affected-content"
            name="affectedContent"
            defaultValue={initialAffectedContent}
            placeholder="CNT-1001 or https://..."
            required
          />
        </div>
      </section>

      <section className={styles.formSection}>
        <div className={styles.sectionHeading}>
          <span className={styles.stepNumber}>
            4
          </span>

          <div>
            <h2>
              Explanation and evidence
            </h2>

            <p>
              Explain the concern and provide supporting
              evidence.
            </p>
          </div>
        </div>

        <div className={styles.formField}>
          <label htmlFor="explanation">
            Explanation *
          </label>

          <textarea
            id="explanation"
            name="explanation"
            placeholder="Explain why this Poster record raises a copyright or rights concern."
            rows={5}
            required
          />
        </div>

        <div className={styles.formField}>
          <label htmlFor="evidence">
            Supporting evidence / references
          </label>

          <textarea
            id="evidence"
            name="evidence"
            placeholder="Ownership references, publication details, supporting URLs, licensing information, or other relevant evidence."
            rows={4}
          />
        </div>
      </section>

      <section className={styles.formSection}>
        <div className={styles.sectionHeading}>
          <span className={styles.stepNumber}>
            5
          </span>

          <div>
            <h2>
              Declarations
            </h2>

            <p>
              Confirm the required statements before
              submitting.
            </p>
          </div>
        </div>

        <div className={styles.declarations}>
          <label>
            <input
              type="checkbox"
              checked={declarations.goodFaith}
              onChange={(event) =>
                setDeclarations(
                  current => ({
                    ...current,
                    goodFaith:
                      event.target.checked,
                  })
                )
              }
            />

            <span>
              I have a good-faith belief that the
              affected Poster content is not authorized
              by the rights holder, its agent, or the law.
            </span>
          </label>

          <label>
            <input
              type="checkbox"
              checked={declarations.accurate}
              onChange={(event) =>
                setDeclarations(
                  current => ({
                    ...current,
                    accurate:
                      event.target.checked,
                  })
                )
              }
            />

            <span>
              The information in this request is accurate.
            </span>
          </label>

          <label>
            <input
              type="checkbox"
              checked={declarations.authorized}
              onChange={(event) =>
                setDeclarations(
                  current => ({
                    ...current,
                    authorized:
                      event.target.checked,
                  })
                )
              }
            />

            <span>
              I am the rights holder or authorized to act
              on behalf of the rights holder.
            </span>
          </label>
        </div>

        <div className={styles.formField}>
          <label htmlFor="legal-name">
            Legal name / authorized signer *
          </label>

          <input
            id="legal-name"
            name="legalName"
            placeholder="Full legal name"
            autoComplete="name"
            required
          />
        </div>
      </section>

      {error ? (
        <div
          className={styles.formError}
          role="alert"
        >
          {error}
        </div>
      ) : null}

      <div className={styles.formActions}>
        <button
          type="submit"
          className="primaryButton"
          disabled={isSubmitting}
        >
          {isSubmitting
            ? "Submitting..."
            : "Submit copyright claim"}
        </button>
      </div>
    </form>
  );
}