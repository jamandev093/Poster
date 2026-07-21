import BulkRemovalForm from "@/features/copyright/BulkRemovalForm";

interface BulkRemovalPageProps {
  searchParams: Promise<{
    items?: string;
  }>;
}

export default async function BulkRemovalPage({
  searchParams,
}: BulkRemovalPageProps) {
  const params =
    await searchParams;

  const rawItems =
    params.items ??
    "";

  const seen =
    new Set<string>();

  const initialItems =
    rawItems
      .split(",")
      .map(
        (
          value
        ) =>
          value
            .trim()
            .toUpperCase()
      )
      .filter(
        (
          value
        ) =>
          /^CNT-\d+$/.test(
            value
          )
      )
      .filter(
        (
          value
        ) => {
          if (
            seen.has(
              value
            )
          ) {
            return false;
          }

          seen.add(
            value
          );

          return true;
        }
      )
      .slice(
        0,
        100
      );

  return (
    <>
      <header className="pageHeader">
        <div>
          <div className="pageEyebrow">
            Copyright
          </div>

          <h1 className="pageTitle">
            Bulk Removal Request
          </h1>

          <p className="pageDescription">
            Report many affected Poster content
            records in one copyright case. Add your
            URLs or Content IDs, select the records
            that belong in the request, and submit
            them together.
          </p>
        </div>
      </header>

      <div className="notice">
        A bulk request asks Poster to review the
        selected records. Submission itself does
        not automatically remove content. Each
        affected item can receive its own review
        outcome.
      </div>

      <div
        style={{
          height: 16,
        }}
      />

      <BulkRemovalForm
        initialItems={
          initialItems
        }
      />
    </>
  );
}