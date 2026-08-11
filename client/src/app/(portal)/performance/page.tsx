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
            View Backend-derived campaign delivery, validated analytics, and
            Wallet spend visibility.
          </p>
        </div>
      </header>

      <PerformanceDashboard />
    </>
  );
}