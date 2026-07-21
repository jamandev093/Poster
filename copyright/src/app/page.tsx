import Link from "next/link";

const primaryActions = [
  {
    href: "/find",
    title: "Find Your Content",
    description:
      "Check a Content ID or exact URL you already have.",
    action: "Find content",
    featured: true,
  },
  {
    href: "/request",
    title: "Submit Claim",
    description:
      "Report one affected Poster content record.",
    action: "Submit claim",
    featured: false,
  },
  {
    href: "/bulk-removal",
    title: "Bulk Removal Request",
    description:
      "Report multiple known content records in one case.",
    action: "Start bulk request",
    featured: false,
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
            Find, report, or track a copyright
            concern without creating an account.
          </p>
        </div>
      </header>

      <section className="contentCard">
        <h2 className="sectionTitle">
          What do you need to do?
        </h2>

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(230px, 1fr))",
            gap: 12,
            marginTop: 18,
          }}
        >
          {primaryActions.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              style={{
                display: "flex",
                minHeight: 170,
                flexDirection: "column",
                padding: 20,
                border: item.featured
                  ? "1px solid #C9DAFA"
                  : "1px solid #E2E8F0",
                borderRadius: 10,
                background: item.featured
                  ? "#F8FAFF"
                  : "#FFFFFF",
                color: "#0F172A",
                textDecoration: "none",
              }}
            >
              <strong
                style={{
                  fontSize: 17,
                  lineHeight: "24px",
                }}
              >
                {item.title}
              </strong>

              <p
                style={{
                  margin: "7px 0 20px",
                  color: "#64748B",
                  fontSize: 14,
                  lineHeight: "21px",
                }}
              >
                {item.description}
              </p>

              <span
                style={{
                  marginTop: "auto",
                  color: "#416ECF",
                  fontSize: 13,
                  lineHeight: "20px",
                  fontWeight: 600,
                }}
              >
                {item.action} →
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section className="contentCard">
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 24,
            flexWrap: "wrap",
          }}
        >
          <div>
            <h2 className="sectionTitle">
              Already submitted a request?
            </h2>

            <p className="sectionDescription">
              Check the current status and outcome
              of your copyright case.
            </p>
          </div>

          <Link
            href="/status"
            className="primaryButton"
            style={{
              display: "inline-block",
              textDecoration: "none",
            }}
          >
            Check Status
          </Link>
        </div>
      </section>

      <div
        style={{
          padding: "4px 2px",
          color: "#64748B",
          fontSize: 12,
          lineHeight: "19px",
        }}
      >
        No account required · Finding a record does
        not verify copyright ownership · Requests
        are reviewed before action is taken.
      </div>
    </>
  );
}