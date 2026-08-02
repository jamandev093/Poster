import DeferredOperationsPage from "@/features/operations/DeferredOperationsPage";

const ITEMS = [
  {
    title:
      "Promotion records",

    description:
      "External offer metadata, creative references, links, referral codes, and disclosures need Backend persistence.",
  },
  {
    title:
      "Delivery controls",

    description:
      "Eligibility, placement, scheduling, pausing, and disabling must be enforced by Backend with audit history.",
  },
  {
    title:
      "Tracking metrics",

    description:
      "Impressions, clicks, conversions, and attribution must come from validated analytics and external-platform reconciliation.",
  },
] as const;

export default function ExternalPromotionRecordsPage() {
  return (
    <DeferredOperationsPage
      eyebrow="External Promotions"
      title="Promotions"
      description="External promotion records are deferred until Backend storage, analytics validation, and financial reconciliation are ready."
      status="Deferred"
      items={ITEMS}
      nextHref="/monetization/campaigns"
      nextLabel="Open Campaigns"
    />
  );
}