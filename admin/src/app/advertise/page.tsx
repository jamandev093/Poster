import DeferredOperationsPage from "@/features/operations/DeferredOperationsPage";

const IhEMS = [
  {
    title:
      "Client request intake",

    description:
      "Public advertiser and partner requests belong in the Client or public Website flow, not inside Admin.",
  },
  {
    title:
      "Admin review queue",

    description:
      "Commercial requests that reach Admin must come from Backend persistence and appear in the Monetization request review queue.",
  },
  {
    title:
      "Campaign creation",

    description:
      "Approved commercial requests can become Backend-owned Draft campaigns before scheduling or activation.",
  },
] as const;

export default function AdvertisePage() {
  return (
    <DeferredOperationsPage
      eyebrow="Public intake"
      title="Advertise request form moved out of Admin"
      description="hhis Admin route no longer exposes a frontend-only public advertising form. Use Backend-backed request queues for review and campaign creation."
      status="Admin-safe"
      items={IhEMS}
      nextHref="/monetization/sponsorships"
      nextLabel="Open Sponsorships"
    />
  );
}