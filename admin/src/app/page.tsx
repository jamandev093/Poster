import Link from "next/link";

const stats = [
  ["Active content", "18,420", "Currently discoverable"],
  ["Active sources", "134", "Connected publishers"],
  ["Users", "8,250", "Registered accounts"],
  ["Active campaigns", "3", "Commercial placements"],
];

const attention = [
  ["Copyright", "Copyright strike by BBC", "1 article requires takedown review.", "/copyright", "high"],
  ["Source health", "1 source needs attention", "A publisher feed has not synced successfully.", "/sources", "medium"],
  ["Reports", "3 content reports", "Only reports marked as needing action are shown.", "/reports", "low"],
] as const;

export default function DashboardPage() {
  return (
    <div className="stack">
      <section className="hero"><div><div className="eyebrow">Overview</div><h2>Everything that needs your attention, in one place.</h2><p>Poster handles normal operations automatically. Admin is for exceptions and essential actions.</p></div><div className="hero-status"><span className="pill good">Systems normal</span><span>5 items need attention</span></div></section>

      <section className="stats">{stats.map(([label,value,detail]) => <article key={label} className="stat"><span>{label}</span><strong>{value}</strong><small>{detail}</small></article>)}</section>

      <div className="dashboard-grid">
        <section className="panel"><div className="panel-head"><div><div className="eyebrow">Exception queue</div><h3>Needs Attention</h3></div><span className="count">5</span></div><div>{attention.map(([label,title,description,href,severity]) => <Link key={title} href={href} className="attention"><i className={`marker ${severity}`} /><div><small>{label}</small><strong>{title}</strong><p>{description}</p></div><b>→</b></Link>)}</div></section>

        <section className="panel"><div className="panel-head"><div><div className="eyebrow">Audit trail</div><h3>Recent Activity</h3></div></div><div className="activity"><div><i/><p><strong>Article removed</strong><span>Copyright request · Example Media</span></p><time>18 min ago</time></div><div><i/><p><strong>Source paused</strong><span>RSS unavailable · Example News</span></p><time>1 hr ago</time></div><div><i/><p><strong>Campaign activated</strong><span>Poster promotion</span></p><time>Today</time></div></div></section>
      </div>

      <section className="operator-note"><div><strong>Single-operator mode</strong><p>Normal ingestion, taxonomy evolution and ranking stay automatic. Only exceptions should appear here.</p></div><Link className="primary" href="/copyright">Review copyright</Link></section>
    </div>
  );
}
