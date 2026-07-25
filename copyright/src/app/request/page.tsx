import Link from "next/link";

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
    params.content?.trim() ?? "";

  const initialAffectedContent =
    /^CNT-\d+$/i.test(
      requestedContent
    )
      ? requestedContent.toUpperCase()
      : "";

  return (
    <>
      <header className="pageHeader pageHeaderLarge">
        <div>
          <div className="pageEyebrow">
            Single copyright claim
          </div>

          <h1 className="pageTitle">
            Submit a copyright claim
          </h1>

          <p className="pageDescription">
            Report one affected Poster content record.
            Identify the original work, explain your
            relationship to the rights, and provide
            information supporting the request.
          </p>
        </div>

        <Link
          href="/bulk-removal"
          className="secondaryButton buttonLink"
        >
          Report multiple records
        </Link>
      </header>

      <div className="processNotice">
        <strong>Before you submit</strong>

        <span>
          Submission starts a review. It does not
          automatically remove content or establish
          copyright ownership.
        </span>
      </div>

      {initialAffectedContent ? (
        <div className="selectedContentNotice">
          <span className="selectedContentLabel">
            Selected content
          </span>

          <strong>
            {initialAffectedContent}
          </strong>

          <span>
            This record was selected through Find Your
            Content and is already attached to the form.
          </span>
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