import type {
  OrganizationId,
} from "@/features/workspace/advertising/advertising.types";

import {
  InvoicesDashboardPanel,
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

export default function InvoicesPage() {
  const organization =
    getCurrentOrganization();

  return (
    <>
      <header className="pageHeader">
        <div>
          <div className="pageEyebrow">
            Billing documents
          </div>

          <h1 className="pageTitle">
            Invoices
          </h1>

          <p className="pageDescription">
            Review invoice status, payment obligations, due
            dates, and invoice documents.
          </p>
        </div>
      </header>

      <InvoicesDashboardPanel
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