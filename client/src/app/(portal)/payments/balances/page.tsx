import type {
  OrganizationId,
} from "@/features/workspace/advertising/advertising.types";

import {
  CampaignBalancesDashboardPanel,
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

export default function CampaignBalancesPage() {
  const organization =
    getCurrentOrganization();

  return (
    <>
      <header className="pageHeader">
        <div>
          <div className="pageEyebrow">
            Campaign funding
          </div>

          <h1 className="pageTitle">
            Campaign balances
          </h1>

          <p className="pageDescription">
            Review funded amounts, available balances,
            reservations, validated spend, credits, refunds,
            and reconciliation details by campaign.
          </p>
        </div>
      </header>

      <CampaignBalancesDashboardPanel
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