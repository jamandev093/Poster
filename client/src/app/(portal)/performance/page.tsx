import PerformanceDashboard from "@/features/performance/PerformanceDashboard";

export default function PerformancePage() {
  return (
    <>
      <header className="pageHeader">
        <div>
          <div className="pageEyebrow">
            Campaign results
          </div>

          <h1 className="pageTitle">
            Performance
          </h1>

          <p className="pageDescription">
            Track delivery, engagement, conversions, and commission.
          </p>
        </div>
      </header>

      <PerformanceDashboard />
    </>
  );
}