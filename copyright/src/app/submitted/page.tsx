import Link from "next/link";

interface SubmittedPageProps {
  searchParams: Promise<{
    type?: string;
    count?: string;
  }>;
}

export default async function SubmittedPage({
  searchParams,
}: SubmittedPageProps) {
  const params =
    await searchParams;

  const isBulk =
    params.type === "bulk";

  const parsedCount =
    Number(
      params.count
    );

  const count =
    Number.isFinite(
      parsedCount
    ) &&
    parsedCount > 0
      ? parsedCount
      : 1;

  return (
    <>
      <header className="pageHeader">
        <div>
          <div className="pageEyebrow">
            Submitted
          </div>

          <h1 className="pageTitle">
            Request submitted
          </h1>

          <p className="pageDescription">
            Your copyright request has completed
            the frontend submission flow.
          </p>
        </div>
      </header>

      <section className="contentCard">
        <h2 className="sectionTitle">
          Submission received
        </h2>

        <p className="sectionDescription">
          {isBulk
            ? `${count} affected content ${
                count === 1
                  ? "item was"
                  : "items were"
              } included in this bulk request.`
            : "1 affected content item was included in this request."}
        </p>

        <div
          style={{
            marginTop: 20,
            padding: 16,
            border: "1px solid #E2E8F0",
            borderRadius: 8,
            background: "#F8FAFC",
          }}
        >
          <div
            style={{
              color: "#64748B",
              fontSize: 12,
            }}
          >
            Demonstration reference
          </div>

          <strong
            style={{
              display: "block",
              marginTop: 4,
              fontSize: 20,
            }}
          >
            CR-DEMO-0001
          </strong>
        </div>

        <p
          style={{
            margin: "18px 0 0",
            color: "#64748B",
            fontSize: 13,
            lineHeight: "21px",
          }}
        >
          This reference is demonstration-only
          while the Copyright Web App is
          frontend-only. The backend will later
          create permanent references, store
          submissions, connect them to Admin
          Copyright, and send email updates.
        </p>

        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 10,
            marginTop: 22,
          }}
        >
          <Link
            href="/status"
            className="primaryButton"
            style={{
              textDecoration: "none",
            }}
          >
            Check status
          </Link>

          <Link
            href="/"
            className="secondaryButton"
            style={{
              textDecoration: "none",
            }}
          >
            Copyright Center
          </Link>
        </div>
      </section>
    </>
  );
}