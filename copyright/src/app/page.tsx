import Link from "next/link";

const workflowSteps = [
  {
    number:
      "1",

    title:
      "Identify",

    description:
      "Use Find Your Content when you already have a Poster Content ID or exact content URL.",
  },

  {
    number:
      "2",

    title:
      "Submit",

    description:
      "Submit a normal copyright claim or group many known affected records into one bulk request.",
  },

  {
    number:
      "3",

    title:
      "Verify and review",

    description:
      "Claimant information, supporting evidence, and affected content can be verified before action is taken.",
  },

  {
    number:
      "4",

    title:
      "Track the outcome",

    description:
      "Once backend services are connected, claimants can securely follow review and resolution status.",
  },
] as const;

export default function CopyrightCenterPage() {
  return (
    <>
      <header className="pageHeader">
        <div>
          <div className="pageEyebrow">
            Poster Copyright
          </div>

          <h1 className="pageTitle">
            Copyright Center
          </h1>

          <p className="pageDescription">
            Find content you already know
            about, report a copyright
            concern, submit many affected
            records together, and follow
            the outcome of a submitted
            request without creating an
            account.
          </p>
        </div>
      </header>

      <section className="contentCard">
        <h2 className="sectionTitle">
          What do you need to do?
        </h2>

        <p className="sectionDescription">
          Choose the path that best matches
          the information you already have
          and the number of affected Poster
          content records involved.
        </p>

        <div
          style={{
            display:
              "grid",

            gridTemplateColumns:
              "repeat(auto-fit, minmax(230px, 1fr))",

            gap:
              12,

            marginTop:
              20,
          }}
        >
          <Link
            href="/find"
            style={{
              padding:
                18,

              border:
                "1px solid #DBE7FB",

              borderRadius:
                10,

              textDecoration:
                "none",

              background:
                "#F8FAFF",
            }}
          >
            <strong>
              Find Your Content
            </strong>

            <p
              style={{
                margin:
                  "6px 0 0",

                color:
                  "#64748B",

                fontSize:
                  14,

                lineHeight:
                  "21px",
              }}
            >
              Enter a Poster Content ID,
              Poster URL, or exact
              original-source URL you
              already possess and check
              for an exact matching record.
            </p>
          </Link>

          <Link
            href="/request"
            style={{
              padding:
                18,

              border:
                "1px solid #E2E8F0",

              borderRadius:
                10,

              textDecoration:
                "none",

              background:
                "#FFFFFF",
            }}
          >
            <strong>
              Submit Claim
            </strong>

            <p
              style={{
                margin:
                  "6px 0 0",

                color:
                  "#64748B",

                fontSize:
                  14,

                lineHeight:
                  "21px",
              }}
            >
              Best for one affected
              content record or a smaller,
              straightforward copyright
              request.
            </p>
          </Link>

          <Link
            href="/bulk-removal"
            style={{
              padding:
                18,

              border:
                "1px solid #E2E8F0",

              borderRadius:
                10,

              textDecoration:
                "none",

              background:
                "#FFFFFF",
            }}
          >
            <strong>
              Bulk Removal Request
            </strong>

            <p
              style={{
                margin:
                  "6px 0 0",

                color:
                  "#64748B",

                fontSize:
                  14,

                lineHeight:
                  "21px",
              }}
            >
              Submit many known Poster
              Content IDs or exact URLs
              together as one copyright
              case.
            </p>
          </Link>
        </div>
      </section>

      <section className="contentCard">
        <h2 className="sectionTitle">
          Find only content you already know
        </h2>

        <p className="sectionDescription">
          Find Your Content is designed
          for exact matching. It does not
          provide public browsing of
          Poster&apos;s content inventory,
          broad publisher searches,
          content suggestions, or similar
          record discovery.
        </p>

        <div
          className="notice"
          style={{
            marginTop:
              18,
          }}
        >
          You provide a Poster Content ID,
          Poster URL, or exact original
          source URL that you already
          possess. Poster checks only for
          the corresponding exact record.
        </div>
      </section>

      <section className="contentCard">
        <h2 className="sectionTitle">
          How copyright requests work
        </h2>

        <p className="sectionDescription">
          Finding an exact Poster record
          identifies the affected content.
          It does not automatically verify
          copyright ownership or remove
          content.
        </p>

        <div
          style={{
            display:
              "grid",

            gridTemplateColumns:
              "repeat(auto-fit, minmax(180px, 1fr))",

            gap:
              12,

            marginTop:
              18,
          }}
        >
          {workflowSteps.map(
            (
              step
            ) => (
              <div
                key={
                  step.number
                }
                style={{
                  padding:
                    16,

                  border:
                    "1px solid #E2E8F0",

                  borderRadius:
                    8,

                  background:
                    "#FFFFFF",
                }}
              >
                <strong
                  style={{
                    color:
                      "#5B86E5",

                    fontSize:
                      13,
                  }}
                >
                  {
                    step.number
                  }
                </strong>

                <div
                  style={{
                    marginTop:
                      5,

                    fontWeight:
                      600,
                  }}
                >
                  {
                    step.title
                  }
                </div>

                <p
                  style={{
                    margin:
                      "5px 0 0",

                    color:
                      "#64748B",

                    fontSize:
                      13,

                    lineHeight:
                      "20px",
                  }}
                >
                  {
                    step.description
                  }
                </p>
              </div>
            )
          )}
        </div>
      </section>

      <section className="contentCard">
        <h2 className="sectionTitle">
          Bulk copyright requests
        </h2>

        <p className="sectionDescription">
          A rights holder can submit many
          known affected records as one
          case instead of completing the
          same claimant information for
          every item separately.
        </p>

        <div
          style={{
            marginTop:
              18,

            display:
              "grid",

            gap:
              8,

            color:
              "#475569",

            fontSize:
              13,

            lineHeight:
              "20px",
          }}
        >
          <div>
            ✓ Paste multiple known Content
            IDs or exact URLs.
          </div>

          <div>
            ✓ Select affected items using
            square checkboxes.
          </div>

          <div>
            ✓ Duplicate entries are not
            added twice.
          </div>

          <div>
            ✓ Submit selected records
            together as one copyright case.
          </div>

          <div>
            ✓ Each affected item can later
            receive its own review outcome.
          </div>
        </div>
      </section>

      <section className="contentCard">
        <h2 className="sectionTitle">
          No account required
        </h2>

        <p className="sectionDescription">
          Copyright requests remain
          separate from Poster consumer
          accounts. Claimants do not need
          to create a username or password
          to report a copyright concern.
        </p>

        <p
          style={{
            margin:
              "10px 0 0",

            color:
              "#64748B",

            fontSize:
              13,

            lineHeight:
              "21px",
          }}
        >
          Once backend and email services
          are connected, claim verification,
          secure status access, permanent
          claim references, and notifications
          will use the contact information
          supplied with the request.
        </p>
      </section>

      <section className="contentCard">
        <h2 className="sectionTitle">
          Already submitted a request?
        </h2>

        <p className="sectionDescription">
          Use Check Status to follow a
          submitted copyright case once
          secure verification and backend
          claim lookup are connected.
        </p>

        <div
          style={{
            marginTop:
              16,
          }}
        >
          <Link
            href="/status"
            className="secondaryButton"
            style={{
              display:
                "inline-block",

              textDecoration:
                "none",
            }}
          >
            Check Status
          </Link>
        </div>
      </section>
    </>
  );
}