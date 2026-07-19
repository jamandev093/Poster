"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ReactNode, useEffect, useState } from "react";

interface AdminShellProps {
  children: ReactNode;
}

const items = [
  ["/", "Dashboard"],
  ["/content", "Content"],
  ["/sources", "Sources"],
  ["/copyright", "Copyright"],
  ["/monetization", "Monetization"],
  ["/reports", "Reports"],
  ["/users", "Users"],
] as const;

function active(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
}

export default function AdminShell({ children }: AdminShellProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  useEffect(() => setOpen(false), [pathname]);
  const title = items.find(([href]) => active(pathname, href))?.[1] ?? "Poster Admin";

  return (
    <div className="shell">
      <aside className={`sidebar ${open ? "sidebar-open" : ""}`}>
        <div className="brand">
          <div className="brand-mark">P</div>
          <div><strong>Poster</strong><span>Admin</span></div>
        </div>

        <nav className="nav" aria-label="Admin navigation">
          {items.map(([href, label]) => (
            <Link key={href} href={href} className={`nav-link ${active(pathname, href) ? "nav-active" : ""}`}>
              <span className="nav-dot" />
              {label}
            </Link>
          ))}
        </nav>

        <div className="sidebar-foot">
          <div className="health"><i /><div><strong>Systems normal</strong><span>No critical issues</span></div></div>
        </div>
      </aside>

      {open ? <button className="backdrop" aria-label="Close navigation" onClick={() => setOpen(false)} /> : null}

      <div className="workspace">
        <header className="topbar">
          <div className="topbar-left">
            <button className="menu" aria-label="Open navigation" onClick={() => setOpen(v => !v)}><span/><span/><span/></button>
            <div><small>Poster Operations</small><h1>{title}</h1></div>
          </div>
          <div className="operator"><div className="avatar">A</div><div><strong>Admin</strong><span>Single operator</span></div></div>
        </header>
        <main className="main">{children}</main>
      </div>
    </div>
  );
}
