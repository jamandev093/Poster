import CampaignDetailsBackendEntry from "@/features/campaigns/CampaignDetailsBackendEntry";

interface CampaignDetailsPageProps {
  params: Promise<{
    campaignId: string;
  }>;
}

export default async function CampaignDetailsPage({
  params,
}: CampaignDetailsPageProps) {
  const {
    campaignId,
  } =
    await params;

  return (
    <CampaignDetailsBackendEntry
      campaignId={
        campaignId
      }
    />
  );
}