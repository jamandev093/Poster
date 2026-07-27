import type {
  OrganizationId,
} from "@/features/workspace/advertising/advertising.types";

import {
  LedgerDashboardPanel,
} from "@/features/workspace/components";

import {
  getCurrentOrganization,
} from "@/features/workspace/workspace.selectors";

function normalizeOrganizationId(
  value:
    string
): OrganizationId {
  const normalized =
    value.trim();

  if (
    !normalized.startsWith(
      "ORG-"
    )
  ) {
    throw new Error(
      `Invalid organization ID: ${value}`
    );
  }

  return normalized as
    OrganizationId;
}

export default function LedgerPage() {
  const organization =
    getCurrentOrganization();

  return (
    <>
      <header className="pageHeader">
        <div>
          <div className="pageEyebrow">
            Immutable financial records
          </div>

          <h1 className="pageTitle">
            Financial ledger
          </h1>

          <p className="pageDescription">
            Review credits, debits, balance movements,
            reconciliations, refunds, disputes, and linked
            financial references.
          </p>
        </div>
      </header>

      <LedgerDashboardPanel
        currency="INR"
        organizationId={
          normalizeOrganizationId(
            organization.id
          )
        }
      />
    </>
  );
}