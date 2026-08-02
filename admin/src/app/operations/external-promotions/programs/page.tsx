import DeferredOperationsPage from "@/features/operations/DeferredOperationsPage";

const ITEMS = [
  {
    title:
      "Program registration",

    description:
      "External program applications and account references need a durable Backend model before production use.",
  },
  {
    title:
      "Payout methods",

    description:
      "Bank, payout, and settlement details must wait for the payment and finance foundation.",
  },
  {
    title:
      "Platform credentials",

    description:
      "External dashboards, IDs, and API credentials need secure storage and access policy before activation.",
  },
] as const;

export default function ExternalProgramsPage() {
  return (
    <DeferredOperationsPage
      eyebrow="External Promotions"
      title="Programs"
      description="External program management is deferred so Admin does not expose local demonstration records as production data."
      status="Deferred"
      items={ITEMS}
      nextHref="/operations/business-identity"
      nextLabel="Open Business Identity"
    />
  );
}
