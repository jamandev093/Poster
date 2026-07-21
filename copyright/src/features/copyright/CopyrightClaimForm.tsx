"use client";

import {
  FormEvent,
  useState,
} from "react";

import {
  useRouter,
} from "next/navigation";

import styles from "./CopyrightForms.module.css";

interface CopyrightClaimFormProps {
  initialAffectedContent?: string;
}

interface DeclarationState {
  goodFaith: boolean;
  accurate: boolean;
  authorized: boolean;
}

export default function CopyrightClaimForm({
  initialAffectedContent = "",
}: CopyrightClaimFormProps) {
  const router =
    useRouter();

  const [
    error,
    setError,
  ] = useState("");

  const [
    declarations,
    setDeclarations,
  ] =
    useState<DeclarationState>({
      goodFaith:
        false,

      accurate:
        false,

      authorized:
        false,
    });

  const submitClaim = (
    event:
      FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

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

    setError("");

    /*
     * Frontend-only workflow for now.
     *
     * Backend integration will later:
     * - create the permanent CR reference,
     * - store claimant/evidence/content data,
     * - connect the case to Admin Copyright,
     * - send acknowledgement/status emails.
     */
    router.push(
      "/submitted?type=claim&count=1"
    );
  };

  return (
    <form
      className={
        styles.form
      }
      onSubmit={
        submitClaim
      }
    >
      <section
        className={
          styles.section
        }
      >
        <div
          className={
            styles.sectionHeader
          }
        >
          <h2>
            1. Claimant information
          </h2>

          <p>
            Tell us who owns the rights
            or who is authorized to act
            for the rights holder.
          </p>
        </div>

        <div className="formGrid">
          <div className="formField">
            <label htmlFor="claimant-name">
              Rights holder / claimant name *
            </label>

            <input
              id="claimant-name"
              name="claimantName"
              required
              autoComplete="name"
            />
          </div>

          <div className="formField">
            <label htmlFor="organization">
              Organization
            </label>

            <input
              id="organization"
              name="organization"
              autoComplete="organization"
            />
          </div>

          <div className="formField">
            <label htmlFor="email">
              Contact email *
            </label>

            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
            />
          </div>

          <div className="formField">
            <label htmlFor="relationship">
              Relationship to the work *
            </label>

            <select
              id="relationship"
              name="relationship"
              required
              defaultValue=""
            >
              <option
                value=""
                disabled
              >
                Select
              </option>

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

      <section
        className={
          styles.section
        }
      >
        <div
          className={
            styles.sectionHeader
          }
        >
          <h2>
            2. Original copyrighted work
          </h2>

          <p>
            Identify the original work
            you believe is affected.
          </p>
        </div>

        <div className="formGridSingle">
          <div className="formField">
            <label htmlFor="work-title">
              Work title or description *
            </label>

            <input
              id="work-title"
              name="workTitle"
              required
            />
          </div>

          <div className="formField">
            <label htmlFor="original-url">
              Original publication URL
            </label>

            <input
              id="original-url"
              name="originalUrl"
              type="url"
              placeholder="https://"
            />

            <span className="fieldHelp">
              Provide the original publisher
              or source URL when available.
            </span>
          </div>
        </div>
      </section>

      <section
        className={
          styles.section
        }
      >
        <div
          className={
            styles.sectionHeader
          }
        >
          <h2>
            3. Affected Poster content
          </h2>

          <p>
            Identify the Poster content
            record that should be reviewed.
          </p>
        </div>

        <div className="formField">
          <label htmlFor="affected-content">
            Poster URL or Content ID *
          </label>

          <input
            id="affected-content"
            name="affectedContent"
            required
            defaultValue={
              initialAffectedContent
            }
            placeholder="Poster URL or CNT-..."
          />

          <span className="fieldHelp">
            A content selected through
            Find Your Content can be
            automatically filled here.
            For many records, use Bulk
            Removal Request.
          </span>
        </div>
      </section>

      <section
        className={
          styles.section
        }
      >
        <div
          className={
            styles.sectionHeader
          }
        >
          <h2>
            4. Claim details
          </h2>

          <p>
            Provide enough information
            for the copyright request to
            be reviewed accurately.
          </p>
        </div>

        <div className="formGridSingle">
          <div className="formField">
            <label htmlFor="explanation">
              Explain the copyright concern *
            </label>

            <textarea
              id="explanation"
              name="explanation"
              required
              placeholder="Explain why you believe this Poster content affects copyright that you own or are authorized to represent."
            />
          </div>

          <div className="formField">
            <label htmlFor="evidence">
              Supporting evidence or references
            </label>

            <textarea
              id="evidence"
              name="evidence"
              placeholder="Ownership references, publication details, supporting URLs, licensing information, or other relevant evidence."
            />

            <span className="fieldHelp">
              Supporting information can
              help Poster verify the claim
              accurately.
            </span>
          </div>
        </div>
      </section>

      <section
        className={
          styles.section
        }
      >
        <div
          className={
            styles.sectionHeader
          }
        >
          <h2>
            5. Declarations
          </h2>

          <p>
            Confirm the accuracy and
            authority of this copyright
            request.
          </p>
        </div>

        <div
          className={
            styles.declarations
          }
        >
          <label
            className={
              styles.checkboxRow
            }
          >
            <input
              type="checkbox"
              checked={
                declarations.goodFaith
              }
              onChange={(
                event
              ) =>
                setDeclarations(
                  (
                    current
                  ) => ({
                    ...current,

                    goodFaith:
                      event.target.checked,
                  })
                )
              }
            />

            <span>
              I have a good-faith basis
              for submitting this
              copyright request.
            </span>
          </label>

          <label
            className={
              styles.checkboxRow
            }
          >
            <input
              type="checkbox"
              checked={
                declarations.accurate
              }
              onChange={(
                event
              ) =>
                setDeclarations(
                  (
                    current
                  ) => ({
                    ...current,

                    accurate:
                      event.target.checked,
                  })
                )
              }
            />

            <span>
              I confirm that the
              information supplied in
              this request is accurate
              to the best of my
              knowledge.
            </span>
          </label>

          <label
            className={
              styles.checkboxRow
            }
          >
            <input
              type="checkbox"
              checked={
                declarations.authorized
              }
              onChange={(
                event
              ) =>
                setDeclarations(
                  (
                    current
                  ) => ({
                    ...current,

                    authorized:
                      event.target.checked,
                  })
                )
              }
            />

            <span>
              I am the rights holder or
              am authorized to act on
              behalf of the rights
              holder.
            </span>
          </label>

          <div className="formField">
            <label htmlFor="legal-name">
              Full legal name *
            </label>

            <input
              id="legal-name"
              name="legalName"
              required
              autoComplete="name"
            />

            <span className="fieldHelp">
              Used to confirm the person
              making this copyright
              request. No Poster account
              is created.
            </span>
          </div>
        </div>
      </section>

      {error ? (
        <div
          className={
            styles.error
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
          styles.actions
        }
      >
        <button
          type="submit"
          className="primaryButton"
        >
          Submit copyright claim
        </button>
      </div>
    </form>
  );
}