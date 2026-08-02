import DeferredOperationsPage from "@/features/operations/DeferredOperationsPage";

const ITEMS = [
  {
    title:
      "External programs",

    description:
      "External affiliate, referral, publisher, or partner-program registration needs a Backend-owned source before production use.",
  },
  {
    title:
      "External promotions",

    description:
      "Promotion records, tracking links, disclosure, eligibility, and placement decisions must be persisted and audited by Backend.",
  },
  {
    title:
      "External earnings",

    description:
      "Conversions, payout readiness, reconciliation, refunds, reversals, and settlement records are deferred with payment systems.",
  },
] as const;

export default function ExternalPromotionsPage() {
  return (
    <DeferredOperationsPage
      eyebrow="Operations"
      title="External Promotions"
      description="External platform operations are intentionally paused until the payment, payout, reconciliation, and settlement foundation is implemented."
      status="Deferred"
      items={ITEMS}
      nextHref="/monetization/affiliate"
      nextLabel="Open Affiliate campaigns"
    />
  );
}