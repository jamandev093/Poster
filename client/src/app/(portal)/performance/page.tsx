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
            View Backend-derived campaign delivery and Wallet spend visibility.
            Detailed analytics will activate after Client analytics APIs are
            connected.
          </p>
        </div>
      </header>

      <PerformanceDashboard />
    </>
  );
}