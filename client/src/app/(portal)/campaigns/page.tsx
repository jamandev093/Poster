import CampaignsManager from "@/features/campaigns/CampaignsManager";

export default function CampaignsPage() {
  return (
    <>
      <header className="pageHeader">
        <div>
          <div className="pageEyebrow">
            Approved work
          </div>

          <h1 className="pageTitle">
            Campaigns
          </h1>

          <p className="pageDescription">
            View campaign delivery, performance, and current status.
          </p>
        </div>
      </header>

      <CampaignsManager />
    </>
  );
}