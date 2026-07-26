import {
  PaymentDashboardPanel,
} from "@/features/workspace/components";

import type {
  OrganizationId,
} from "@/features/workspace/advertising/advertising.types";

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

export default function PaymentsPage() {
  const organization =
    getCurrentOrganization();

  const organizationId =
    normalizeOrganizationId(
      organization.id
    );

  return (
    <>
      <header className="pageHeader">
        <div>
          <div className="pageEyebrow">
            Campaign funding
          </div>

          <h1 className="pageTitle">
            Payments
          </h1>

          <p className="pageDescription">
            Review verified payments, campaign balances, finalized spend,
            refunds, and settlement records.
          </p>
        </div>
      </header>

      <PaymentDashboardPanel
        currency="INR"
        organizationId={
          organizationId
        }
      />
    </>
  );
}
