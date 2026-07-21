import CopyrightClaimForm from "@/features/copyright/CopyrightClaimForm";

interface CopyrightRequestPageProps {
  searchParams: Promise<{
    content?: string;
  }>;
}

export default async function CopyrightRequestPage({
  searchParams,
}: CopyrightRequestPageProps) {
  const params =
    await searchParams;

  const requestedContent =
    params.content?.trim() ??
    "";

  const initialAffectedContent =
    /^CNT-\d+$/i.test(
      requestedContent
    )
      ? requestedContent.toUpperCase()
      : "";

  return (
    <>
      <header className="pageHeader">
        <div>
          <div className="pageEyebrow">
            Copyright
          </div>

          <h1 className="pageTitle">
            Submit Claim
          </h1>

          <p className="pageDescription">
            Report one affected Poster content record.
            For multiple records, use Bulk Removal Request.
          </p>
        </div>
      </header>

      {initialAffectedContent ? (
        <div
          className="notice"
          style={{
            marginBottom: 16,
          }}
        >
          <strong>
            {initialAffectedContent}
          </strong>
          {" "}
          was selected through Find Your Content
          and is already attached below.
        </div>
      ) : null}

      <CopyrightClaimForm
        initialAffectedContent={
          initialAffectedContent
        }
      />
    </>
  );
}