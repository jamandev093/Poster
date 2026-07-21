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
            Submit a copyright concern for a single
            or smaller number of affected Poster
            content records. For a large list, use
            Bulk Removal Request.
          </p>
        </div>
      </header>

      <CopyrightClaimForm
        initialAffectedContent={
          initialAffectedContent
        }
      />
    </>
  );
}