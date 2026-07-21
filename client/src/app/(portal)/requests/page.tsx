import Link from "next/link";

import RequestsManager from "@/features/requests/RequestsManager";

export default function RequestsPage() {
  return (
    <>
      <header className="pageHeader">
        <div>
          <div className="pageEyebrow">
            Commercial requests
          </div>

          <h1 className="pageTitle">
            Requests
          </h1>

          <p className="pageDescription">
            Review submitted requests and respond when changes are required.
          </p>
        </div>

        <Link
          href="/requests/new"
          className="primaryButton"
        >
          New request
        </Link>
      </header>

      <RequestsManager />
    </>
  );
}