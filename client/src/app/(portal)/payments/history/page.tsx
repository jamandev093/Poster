import type {
  OrganizationId,
} from "@/features/workspace/advertising/advertising.types";

import {
  PaymentHistoryDashboardPanel,
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

export default function PaymentHistoryPage() {
  const organization =
    getCurrentOrganization();

  return (
    <>
      <header className="pageHeader">
        <div>
          <div className="pageEyebrow">
            Verified transactions
          </div>

          <h1 className="pageTitle">
            Payment history
          </h1>

          <p className="pageDescription">
            Review payment methods, provider references,
            captured amounts, verification, and refund activity.
          </p>
        </div>
      </header>

      <PaymentHistoryDashboardPanel
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