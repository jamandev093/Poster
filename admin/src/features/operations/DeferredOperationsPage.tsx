import Link from "next/link";

import styles from "./DeferredOperationsPage.module.css";

interface DeferredItem {
  title:
    string;

  description:
    string;
}

interface DeferredOperationsPageProps {
  eyebrow:
    string;

  title:
    string;

  description:
    string;

  status:
    string;

  items:
    readonly DeferredItem[];

  nextHref?:
    string;

  nextLabel?:
    string;
}

export default function DeferredOperationsPage(
  props:
    DeferredOperationsPageProps
) {
  return (
    <main
      className={
        styles.page
      }
    >
      <header
        className={
          styles.header
        }
      >
        <div>
          <p
            className={
              styles.eyebrow
            }
          >
            {
              props.eyebrow
            }
          </p>

          <h1>
            {
              props.title
            }
          </h1>

          <p>
            {
              props.description
            }
          </p>
        </div>

        <span
          className={
            styles.status
          }
        >
          {
            props.status
          }
        </span>
      </header>

      <section
        className={
          styles.panel
        }
      >
        <div>
          <h2>
            Deferred until payment and external-platform systems are ready.
          </h2>

          <p>
            This area is intentionally not using local demonstration records in
            production Admin. External promotion programs, promotion delivery,
            earnings, payouts, reconciliation, and settlement records need an
            authoritative Backend, database schema, audit trail, and payment
            workflow before they are enabled.
          </p>
        </div>

        <div
          className={
            styles.grid
          }
        >
          {props.items.map(
            item => (
              <article
                key={
                  item.title
                }
                className={
                  styles.card
                }
              >
                <h3>
                  {
                    item.title
                  }
                </h3>

                <p>
                  {
                    item.description
                  }
                </p>
              </article>
            )
          )}
        </div>

        <div
          className={
            styles.footer
          }
        >
          <p>
            Current completed alternatives: Affiliate campaigns, Direct
            Sponsorship, Poster Promotion, Programmatic controls, Campaigns,
            Analytics, and Business Identity are handled by Backend-backed
            Admin flows.
          </p>

          {props.nextHref &&
          props.nextLabel ? (
            <Link
              href={
                props.nextHref
              }
              className={
                styles.link
              }
            >
              {
                props.nextLabel
              }
            </Link>
          ) : null}
        </div>
      </section>
    </main>
  );
}