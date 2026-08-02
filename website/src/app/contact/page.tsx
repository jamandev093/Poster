import Link from "next/link";

import {
  getPublicBusinessIdentity,
} from "../../features/business-identity";

import styles from "./page.module.css";

export const metadata = {
  title: "Contact",

  description:
    "Contact Poster about general questions, publisher relationships, advertising, copyright, or rights concerns.",

  alternates: {
    canonical:
      "/contact",
  },

  openGraph: {
    title:
      "Contact Poster",

    description:
      "Find the correct contact path for general, publisher, advertising, and copyright enquiries.",

    url:
      "/contact",
  },
};

function EmailLink(
  props: {
    email:
      string | null | undefined;

    fallback:
      string;
  }
) {
  if (
    !props.email
  ) {
    return (
      <span className={styles.unavailableContact}>
        {
          props.fallback
        }
      </span>
    );
  }

  return (
    <a href={`mailto:${props.email}`}>
      {
        props.email
      }
    </a>
  );
}

export default async function ContactPage() {
  const identity =
    await getPublicBusinessIdentity();

  const generalEmail =
    identity?.supportEmail ??
    identity?.officialBusinessEmail;

  const publisherEmail =
    identity?.publisherRelationsEmail ??
    identity?.supportEmail ??
    identity?.officialBusinessEmail;

  const advertisingEmail =
    identity?.advertisingEmail ??
    null;

  const copyrightEmail =
    identity?.copyrightEmail ??
    null;

  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <p className={styles.eyebrow}>
          Contact
        </p>

        <h1>
          Get in touch with Poster.
        </h1>

        <p className={styles.lead}>
          Choose the right path for general questions,
          publisher enquiries, advertising, or copyright
          and rights concerns.
        </p>
      </section>

      <section className={styles.contacts}>
        <article>
          <span>
            General
          </span>

          <div>
            <h2>
              General questions
            </h2>

            <p>
              Questions about Poster, the product, or the company.
            </p>

            <EmailLink
              email={
                generalEmail
              }
              fallback="Official contact is loading from Poster Business Identity."
            />
          </div>
        </article>

        <article>
          <span>
            Publishers
          </span>

          <div>
            <h2>
              Publisher and source enquiries
            </h2>

            <p>
              Questions about attribution, sources,
              corrections, or publisher relationships.
            </p>

            <EmailLink
              email={
                publisherEmail
              }
              fallback="Publisher contact is loading from Poster Business Identity."
            />
          </div>
        </article>

        <article>
          <span>
            Advertising
          </span>

          <div>
            <h2>
              Sponsorship and affiliate enquiries
            </h2>

            <p>
              Learn about commercial opportunities or continue
              to the Advertiser Portal.
            </p>

            {advertisingEmail ? (
              <a href={`mailto:${advertisingEmail}`}>
                {
                  advertisingEmail
                }
              </a>
            ) : (
              <Link href="/advertisers">
                Advertising information →
              </Link>
            )}
          </div>
        </article>

        <article>
          <span>
            Copyright
          </span>

          <div>
            <h2>
              Copyright and rights concerns
            </h2>

            <p>
              Use Poster&apos;s dedicated copyright and rights
              process for formal claims and related requests.
            </p>

            {copyrightEmail ? (
              <a href={`mailto:${copyrightEmail}`}>
                {
                  copyrightEmail
                }
              </a>
            ) : (
              <Link href="/copyright">
                Copyright &amp; Rights →
              </Link>
            )}
          </div>
        </article>
      </section>
    </div>
  );
}