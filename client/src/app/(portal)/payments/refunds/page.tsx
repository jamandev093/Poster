import type {
  OrganizationId,
} from "@/features/workspace/advertising/advertising.types";

import {
  RefundsDashboardPanel,
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

export default function RefundsPage() {
  const organization =
    getCurrentOrganization();

  return (
    <>
      <header className="pageHeader">
        <div>
          <div className="pageEyebrow">
            Payment adjustments
          </div>

          <h1 className="pageTitle">
            Refunds
          </h1>

          <p className="pageDescription">
            Review refund requests, approval amounts,
            processing status, provider references, and
            completed refunds.
          </p>
        </div>
      </header>

      <RefundsDashboardPanel
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