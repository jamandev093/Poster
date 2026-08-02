import DeferredOperationsPage from "@/features/operations/DeferredOperationsPage";

const ITEMS = [
  {
    title:
      "Earnings",

    description:
      "External commission, conversion value, and platform-reported earning records are financial data and must not use local demonstration data.",
  },
  {
    title:
      "Reconciliation",

    description:
      "External dashboard records, reversals, adjustments, and disputes need a finance-grade ledger and immutable audit model.",
  },
  {
    title:
      "Settlement",

    description:
      "Payout readiness, received amounts, taxes, refunds, and settlement status remain paused with payment work.",
  },
] as const;

export default function ExternalEarningsPage() {
  return (
    <DeferredOperationsPage
      eyebrow="External Promotions"
      title="Earnings"
      description="External earnings are deferred because they depend on payment, ledger, reconciliation, refund, and settlement systems."
      status="Payment work paused"
      items={ITEMS}
      nextHref="/monetization/analytics"
      nextLabel="Open Analytics"
    />
  );
}
