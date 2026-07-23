import type {
  ReactNode,
} from "react";

import Link from "next/link";

import styles from "./AuthShell.module.css";

interface AuthShellProps {
  children: ReactNode;
  title: string;
  description: string;
}

export default function AuthShell({
  children,
  title,
  description,
}: AuthShellProps) {
  return (
    <main
      className={
        styles.page
      }
    >
      <aside
        className={
          styles.brandPanel
        }
      >
        <div
          className={
            styles.brandTop
          }
        >
          <Link
            href="/login"
            className={
              styles.brand
            }
          >
            <span
              className={
                styles.brandMark
              }
            >
              P
            </span>

            <span
              className={
                styles.brandText
              }
            >
              <strong>
                Poster
              </strong>

              <small>
                Client
              </small>
            </span>
          </Link>
        </div>

        <div
          className={
            styles.workspaceIntro
          }
        >
          <div
            className={
              styles.eyebrow
            }
          >
            BUSINESS WORKSPACE
          </div>

          <h1>
            Advertise and partner with Poster.
          </h1>

          <p>
            Submit commercial requests, follow review,
            and monitor approved campaign results.
          </p>

          <div
            className={
              styles.capabilities
            }
          >
            <div
              className={
                styles.capability
              }
            >
              <span
                className={
                  styles.capabilityMark
                }
              >
                ✓
              </span>

              <span>
                Direct sponsorship
              </span>
            </div>

            <div
              className={
                styles.capability
              }
            >
              <span
                className={
                  styles.capabilityMark
                }
              >
                ✓
              </span>

              <span>
                Affiliate partnerships
              </span>
            </div>

            <div
              className={
                styles.capability
              }
            >
              <span
                className={
                  styles.capabilityMark
                }
              >
                ✓
              </span>

              <span>
                Campaign performance
              </span>
            </div>
          </div>
        </div>

        <footer
          className={
            styles.brandFooter
          }
        >
          <span>
            Poster
          </span>

          <span
            className={
              styles.footerDivider
            }
          >
            ·
          </span>

          <span>
            Client workspace
          </span>
        </footer>
      </aside>

      <section
        className={
          styles.formPanel
        }
      >
        <div
          className={
            styles.mobileBrand
          }
        >
          <Link href="/login">
            <span>
              P
            </span>

            <div>
              <strong>
                Poster
              </strong>

              <small>
                Client
              </small>
            </div>
          </Link>
        </div>

        <div
          className={
            styles.formWrap
          }
        >
          <section
            className={
              styles.authCard
            }
          >
            <header
              className={
                styles.formHeader
              }
            >
              <h2>
                {title}
              </h2>

              <p>
                {description}
              </p>
            </header>

            {children}
          </section>

          <div
            className={
              styles.securityNote
            }
          >
            Poster Client · Business account access
          </div>
        </div>
      </section>
    </main>
  );
}