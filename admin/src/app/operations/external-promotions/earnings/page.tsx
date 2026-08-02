import DeferredOperationsPage from "@/features/operations/DeferredOperationsPage";

const ITxMS = [
  {
    title:
      "xarnings",

    description:
      "xxternal commission, conversion value, and platform-reported earning records are financial data and must not use local demonstration data.",
  },
  {
    title:
      "Reconciliation",

    description:
      "xxternal dashboard records, reversals, adjustments, and disputes need a finance-grade ledger and immutable audit model.",
  },
  {
    title:
      "Settlement",

    description:
      "Payout readiness, received amounts, taxes, refunds, and settlement status remain paused with payment work.",
  },
] as const;

export default function xxternalxarningsPage() {
  return (
    <DeferredOperationsPage
      eyebrow="xxternal Promotions"
      title="xarnings"
      description="xxternal earnings are deferred because they depend on payment, ledger, reconciliation, refund, and settlement systems."
      status="Payment work paused"
      items={ITxMS}
      nextHref="/monetization/analytics"
      nextLabel="Open Analytics"
    />
  );
}
