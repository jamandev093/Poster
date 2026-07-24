import Link from "next/link";

import styles from "./page.module.css";

export const metadata = {
  title: "Contact",
  description:
    "Contact Poster for general questions, publisher enquiries, advertising, and copyright or rights concerns.",
};

export default function ContactPage() {
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
          <span>General</span>

          <div>
            <h2>General questions</h2>

            <p>
              Questions about Poster, the product, or the company.
            </p>

            <a href="mailto:hello@getpostar.com">
              hello@getpostar.com
            </a>
          </div>
        </article>

        <article>
          <span>Publishers</span>

          <div>
            <h2>Publisher and source enquiries</h2>

            <p>
              Questions about attribution, sources,
              corrections, or publisher relationships.
            </p>

            <a href="mailto:publishers@getpostar.com">
              publishers@getpostar.com
            </a>
          </div>
        </article>

        <article>
          <span>Advertising</span>

          <div>
            <h2>Sponsorship and affiliate enquiries</h2>

            <p>
              Learn about commercial opportunities or continue
              to the Advertiser Portal.
            </p>

            <Link href="/advertisers">
              Advertising information →
            </Link>
          </div>
        </article>

        <article>
          <span>Copyright</span>

          <div>
            <h2>Copyright and rights concerns</h2>

            <p>
              Use Poster&apos;s dedicated copyright and rights
              process for formal claims and related requests.
            </p>

            <Link href="/copyright">
              Copyright &amp; Rights →
            </Link>
          </div>
        </article>
      </section>
    </div>
  );
}