"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Clock, Search, ChevronRight, ArrowRight, TrendingUp } from "lucide-react";
import BreakingTicker from "./BreakingTicker";

type NewsItem = {
  id: string;
  title: string;
  slug: string;
  short_info: string | null;
  banner_url: string | null;
  created_at: string;
};

const TABS = [
  { id: "all",         label: "All News" },
  { id: "recruitment", label: "Recruitment" },
  { id: "result",      label: "Results" },
  { id: "admit",       label: "Admit Card" },
  { id: "scheme",      label: "Govt Schemes" },
  { id: "exam",        label: "Exam Updates" },
];

const GRADIENTS = [
  "linear-gradient(135deg,#1e3a8a,#4f46e5)",
  "linear-gradient(135deg,#064e3b,#059669)",
  "linear-gradient(135deg,#7f1d1d,#dc2626)",
  "linear-gradient(135deg,#4c1d95,#7c3aed)",
  "linear-gradient(135deg,#0f172a,#1e293b)",
  "linear-gradient(135deg,#78350f,#d97706)",
];

function detectCat(item: NewsItem): string {
  const t = `${item.title} ${item.short_info ?? ""}`.toLowerCase();
  if (/result|scorecard|merit list|selected/.test(t))        return "result";
  if (/admit card|hall ticket|call letter/.test(t))          return "admit";
  if (/scheme|yojana|pm |internship|portal|ministry/.test(t)) return "scheme";
  if (/recruitment|vacancy|bharti|notification|apply/.test(t)) return "recruitment";
  return "exam";
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  const h = Math.floor(m / 60);
  const d = Math.floor(h / 24);
  if (d >= 1) return `${d}d ago`;
  if (h >= 1) return `${h}h ago`;
  return m <= 1 ? "Just now" : `${m}m ago`;
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

// ── Small inline components ───────────────────────────────────────────────────

function NewsBadge({ label = "NEWS" }: { label?: string }) {
  return (
    <div style={{
      position: "absolute", top: 12, left: 12,
      background: "#c81e1e", color: "white",
      fontSize: 10, fontWeight: 800, padding: "4px 10px",
      letterSpacing: "0.12em", textTransform: "uppercase",
      fontFamily: "Inter, system-ui, sans-serif",
    }}>
      {label}
    </div>
  );
}

function TimeMeta({ iso }: { iso: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 4, color: "#9ca3af", fontSize: 11, fontFamily: "Inter, system-ui, sans-serif", fontWeight: 500 }}>
      <Clock size={10} />
      {timeAgo(iso)} · {fmtDate(iso)}
    </div>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────

export default function NewsPortal({ newsItems }: { newsItems: NewsItem[] }) {
  const [activeTab, setActiveTab] = useState("all");
  const [search,    setSearch]    = useState("");

  const filtered = useMemo(() => {
    let items = newsItems;
    if (activeTab !== "all") items = items.filter(n => detectCat(n) === activeTab);
    if (search.trim()) {
      const q = search.toLowerCase();
      items = items.filter(n =>
        n.title.toLowerCase().includes(q) ||
        (n.short_info ?? "").toLowerCase().includes(q)
      );
    }
    return items;
  }, [newsItems, activeTab, search]);

  const hero      = filtered[0];
  const secondary = filtered.slice(1, 3);
  const gridItems = filtered.slice(3);
  const mostRead  = newsItems.slice(0, 6);
  const tickerHeadlines = newsItems.slice(0, 8).map(n => n.title);
  const today = new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  return (
    <div style={{ fontFamily: "Georgia, 'Times New Roman', serif", background: "#f5f5f5", minHeight: "100vh" }}>

      {/* ── Global editorial CSS ─────────────────────────────────────────── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;800;900&family=Inter:wght@400;500;600;700;800&display=swap');

        .np-headline  { font-family: 'Playfair Display', Georgia, serif; }
        .np-body      { font-family: 'Inter', system-ui, sans-serif; }
        .np-clamp2    { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
        .np-clamp3    { display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }

        .np-card {
          background: white; border: 1px solid #e5e7eb;
          transition: box-shadow 0.22s, transform 0.22s;
          overflow: hidden; text-decoration: none; display: block;
        }
        .np-card:hover { box-shadow: 0 6px 28px rgba(0,0,0,0.13); transform: translateY(-3px); }

        .np-hero-card { position: relative; overflow: hidden; display: block; text-decoration: none; }
        .np-hero-overlay {
          position: absolute; inset: 0;
          background: linear-gradient(to top, rgba(0,0,0,0.93) 0%, rgba(0,0,0,0.55) 45%, transparent 100%);
        }
        .np-hero-img { width: 100%; height: 100%; object-fit: cover; transition: transform 0.4s ease; display: block; }
        .np-hero-card:hover .np-hero-img { transform: scale(1.04); }

        .np-sec-img { width: 100%; height: 100%; object-fit: cover; transition: transform 0.3s ease; display: block; }
        .np-card:hover .np-sec-img { transform: scale(1.04); }

        .np-section-label {
          display: inline-flex; align-items: center; gap: 8px;
          font-family: 'Inter', sans-serif; font-size: 11px; font-weight: 800;
          letter-spacing: 0.16em; text-transform: uppercase; color: #c81e1e;
          border-left: 3px solid #c81e1e; padding-left: 10px; margin-bottom: 18px;
        }

        .np-tab {
          font-family: 'Inter', sans-serif; font-size: 13px; font-weight: 600;
          padding: 10px 16px; border: none; cursor: pointer; white-space: nowrap;
          transition: all 0.15s; background: transparent; border-bottom: 3px solid transparent;
        }
        .np-tab-active  { color: #c81e1e; border-bottom-color: #c81e1e; }
        .np-tab-inactive { color: #4b5563; }
        .np-tab-inactive:hover { color: #c81e1e; background: #fef2f2; }

        .np-read-btn {
          font-family: 'Inter', sans-serif; font-size: 11px; font-weight: 700;
          color: #c81e1e; display: inline-flex; align-items: center; gap: 4px;
          margin-top: 10px;
        }
        .np-sidebar-title {
          font-family: 'Inter', sans-serif; font-size: 12px; font-weight: 800;
          text-transform: uppercase; letter-spacing: 0.12em; color: #111827;
          padding-bottom: 10px; border-bottom: 2px solid #c81e1e; margin-bottom: 16px;
        }

        .np-search { background: #f3f4f6; border: 1px solid #e5e7eb; border-radius: 3px; display: flex; align-items: center; gap: 8px; padding: 8px 12px; }
        .np-search input { background: transparent; border: none; outline: none; font-family: 'Inter', sans-serif; font-size: 13px; color: #111; width: 170px; }

        /* Responsive grid helpers */
        @media (max-width: 767px) {
          .np-top-grid   { grid-template-columns: 1fr !important; }
          .np-main-grid  { grid-template-columns: 1fr !important; }
          .np-news-grid  { grid-template-columns: 1fr !important; }
          .np-sidebar    { display: none !important; }
          .np-sec-stack  { display: none !important; }
        }
        @media (min-width: 768px) and (max-width: 1023px) {
          .np-main-grid  { grid-template-columns: 1fr !important; }
          .np-sidebar    { display: none !important; }
        }
      `}</style>

      {/* ── Breaking Ticker ──────────────────────────────────────────────── */}
      <BreakingTicker headlines={tickerHeadlines} />

      {/* ── Masthead ─────────────────────────────────────────────────────── */}
      <div style={{ background: "white", borderBottom: "3px solid #c81e1e" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto", padding: "14px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <div>
            <div className="np-body" style={{ fontSize: 10, fontWeight: 700, color: "#c81e1e", letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: 2 }}>
              Rojgar Suvidha Presents
            </div>
            <h1 className="np-headline" style={{ fontSize: 28, fontWeight: 900, color: "#0f172a", lineHeight: 1, margin: 0 }}>
              Employment News
            </h1>
            <div className="np-body" style={{ fontSize: 11, color: "#6b7280", fontWeight: 500, marginTop: 4 }}>
              {today} &nbsp;·&nbsp; India&apos;s Most Trusted Career Portal
            </div>
          </div>
          <div className="np-search">
            <Search size={14} color="#9ca3af" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search news..."
            />
          </div>
        </div>
      </div>

      {/* ── Category Tabs ────────────────────────────────────────────────── */}
      <div style={{ background: "white", borderBottom: "1px solid #e5e7eb", position: "sticky", top: 0, zIndex: 40 }}>
        <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 20px", display: "flex", alignItems: "center", overflowX: "auto" }}>
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`np-tab ${activeTab === tab.id ? "np-tab-active" : "np-tab-inactive"}`}
            >
              {tab.label}
            </button>
          ))}
          <div className="np-body" style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 6, color: "#c81e1e", fontSize: 11, fontWeight: 700, flexShrink: 0 }}>
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#c81e1e", display: "inline-block" }} />
            LIVE
          </div>
        </div>
      </div>

      {/* ── Page body ────────────────────────────────────────────────────── */}
      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "28px 20px 60px" }}>

        {filtered.length === 0 ? (
          <div style={{ background: "white", border: "1px solid #e5e7eb", padding: "80px 20px", textAlign: "center" }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🗞️</div>
            <h2 className="np-headline" style={{ fontSize: 22, color: "#111827" }}>No Articles Found</h2>
            <p className="np-body" style={{ color: "#6b7280", marginTop: 8 }}>Try a different category or search term.</p>
          </div>
        ) : (
          <>
            {/* ── TOP STORIES: Hero + 2 Secondary ───────────────────── */}
            {hero && (
              <>
                <div className="np-section-label">⚡ Top Stories</div>
                <div
                  className="np-top-grid"
                  style={{ display: "grid", gridTemplateColumns: secondary.length ? "1fr 340px" : "1fr", gap: 20, marginBottom: 36, alignItems: "start" }}
                >
                  {/* Hero */}
                  <Link href={`/job/${hero.slug}`} className="np-hero-card">
                    <div style={{ position: "relative", aspectRatio: "16/8.5", background: hero.banner_url ? undefined : GRADIENTS[0] }}>
                      {hero.banner_url
                        ? <img src={hero.banner_url} alt={hero.title} className="np-hero-img" />
                        : <div style={{ width: "100%", height: "100%", background: GRADIENTS[0] }} />
                      }
                      <div className="np-hero-overlay" />
                      <NewsBadge />
                      {/* Overlay content */}
                      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "24px 24px 20px" }}>
                        <h2 className="np-headline np-clamp3" style={{ color: "white", fontSize: 26, fontWeight: 800, lineHeight: 1.3, margin: 0, marginBottom: 10, textShadow: "0 2px 10px rgba(0,0,0,0.6)" }}>
                          {hero.title}
                        </h2>
                        {hero.short_info && (
                          <p className="np-body np-clamp2" style={{ color: "rgba(255,255,255,0.8)", fontSize: 13, lineHeight: 1.55, margin: 0, marginBottom: 12 }}>
                            {hero.short_info}
                          </p>
                        )}
                        <div className="np-body" style={{ display: "flex", alignItems: "center", gap: 14, color: "rgba(255,255,255,0.65)", fontSize: 11 }}>
                          <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                            <Clock size={10} /> {timeAgo(hero.created_at)}
                          </span>
                          <span style={{ color: "#f87171", fontWeight: 700, letterSpacing: "0.03em" }}>Read Full Story →</span>
                        </div>
                      </div>
                    </div>
                  </Link>

                  {/* Secondary stack */}
                  {secondary.length > 0 && (
                    <div className="np-sec-stack" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                      {secondary.map((item, idx) => (
                        <Link key={item.id} href={`/job/${item.slug}`} className="np-card">
                          <div style={{ position: "relative", aspectRatio: "16/9", background: GRADIENTS[(idx + 1) % GRADIENTS.length], overflow: "hidden" }}>
                            {item.banner_url && <img src={item.banner_url} alt={item.title} className="np-sec-img" />}
                            <NewsBadge />
                          </div>
                          <div style={{ padding: "12px 14px 14px" }}>
                            <TimeMeta iso={item.created_at} />
                            <h3 className="np-headline np-clamp2" style={{ fontSize: 15, fontWeight: 700, color: "#111827", lineHeight: 1.35, margin: "6px 0 0" }}>
                              {item.title}
                            </h3>
                            <div className="np-read-btn">Read More <ChevronRight size={12} /></div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}

            {/* ── Divider ──────────────────────────────────────────── */}
            {gridItems.length > 0 && (
              <div style={{ borderTop: "2px solid #e5e7eb", marginBottom: 28 }} />
            )}

            {/* ── GRID + SIDEBAR ───────────────────────────────────── */}
            {gridItems.length > 0 && (
              <div className="np-main-grid" style={{ display: "grid", gridTemplateColumns: "1fr 310px", gap: 32, alignItems: "start" }}>

                {/* LEFT: News Grid */}
                <div>
                  <div className="np-section-label">📰 Latest News</div>
                  <div className="np-news-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
                    {gridItems.map((item, idx) => (
                      <Link key={item.id} href={`/job/${item.slug}`} className="np-card">
                        <div style={{ position: "relative", aspectRatio: "16/9", background: GRADIENTS[idx % GRADIENTS.length], overflow: "hidden" }}>
                          {item.banner_url && <img src={item.banner_url} alt={item.title} className="np-sec-img" />}
                          <NewsBadge />
                        </div>
                        <div style={{ padding: "14px 16px 16px" }}>
                          <TimeMeta iso={item.created_at} />
                          <h3 className="np-headline np-clamp2" style={{ fontSize: 16, fontWeight: 700, color: "#111827", lineHeight: 1.35, margin: "7px 0 0" }}>
                            {item.title}
                          </h3>
                          {item.short_info && (
                            <p className="np-body np-clamp2" style={{ fontSize: 12, color: "#6b7280", lineHeight: 1.6, margin: "6px 0 0" }}>
                              {item.short_info}
                            </p>
                          )}
                          <div className="np-read-btn">Read Article <ArrowRight size={11} /></div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>

                {/* RIGHT: Sidebar */}
                <div className="np-sidebar" style={{ display: "flex", flexDirection: "column", gap: 20 }}>

                  {/* Most Read */}
                  <div style={{ background: "white", border: "1px solid #e5e7eb", padding: 20 }}>
                    <div className="np-sidebar-title">
                      <TrendingUp size={13} style={{ display: "inline", marginRight: 6, verticalAlign: "middle" }} />
                      Most Read
                    </div>
                    <div>
                      {mostRead.map((item, i) => (
                        <Link
                          key={item.id}
                          href={`/job/${item.slug}`}
                          style={{ textDecoration: "none", display: "flex", gap: 12, alignItems: "flex-start", padding: "11px 0", borderBottom: i < mostRead.length - 1 ? "1px solid #f3f4f6" : "none" }}
                        >
                          <span className="np-headline" style={{ fontSize: 22, fontWeight: 900, color: i < 3 ? "#c81e1e" : "#d1d5db", lineHeight: 1, flexShrink: 0, width: 26 }}>
                            {i + 1}
                          </span>
                          <span className="np-headline np-clamp2" style={{ fontSize: 13, fontWeight: 700, color: "#111827", lineHeight: 1.35 }}>
                            {item.title}
                          </span>
                        </Link>
                      ))}
                    </div>
                  </div>

                  {/* Stay Updated */}
                  <div style={{ background: "linear-gradient(135deg,#0f172a,#1e3a8a)", padding: 22 }}>
                    <div className="np-body" style={{ color: "#f87171", fontSize: 10, fontWeight: 800, letterSpacing: "0.13em", textTransform: "uppercase", marginBottom: 8 }}>
                      🔔 Stay Updated
                    </div>
                    <h3 className="np-headline" style={{ color: "white", fontSize: 18, margin: "0 0 8px", lineHeight: 1.3 }}>
                      Never Miss a Job Alert
                    </h3>
                    <p className="np-body" style={{ color: "#94a3b8", fontSize: 12, lineHeight: 1.65, marginBottom: 16 }}>
                      Daily sarkari naukri updates, exam dates & admit card alerts — directly to you.
                    </p>
                    <Link href="/notifications" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, background: "#c81e1e", color: "white", fontWeight: 700, fontSize: 12, padding: "11px 16px", textDecoration: "none", fontFamily: "Inter, sans-serif" }}>
                      Enable Job Alerts <ArrowRight size={13} />
                    </Link>
                  </div>

                  {/* Ad Placeholder */}
                  <div style={{ background: "#f9fafb", border: "2px dashed #e5e7eb", padding: 28, textAlign: "center" }}>
                    <div className="np-body" style={{ color: "#d1d5db", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.1em" }}>Advertisement</div>
                    <div style={{ color: "#9ca3af", fontSize: 28, margin: "8px 0 4px" }}>🗒️</div>
                    <div className="np-body" style={{ color: "#d1d5db", fontSize: 11 }}>300 × 250</div>
                  </div>

                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* ── Footer strip ─────────────────────────────────────────────────── */}
      <div style={{ background: "#0f172a", borderTop: "3px solid #c81e1e", padding: "14px 20px" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
          <p className="np-body" style={{ color: "#64748b", fontSize: 11, margin: 0 }}>
            © {new Date().getFullYear()} Rojgar Suvidha · Employment News · All rights reserved
          </p>
          <Link href="/" className="np-body" style={{ color: "#94a3b8", fontSize: 11, textDecoration: "none" }}>
            ← Back to Main Portal
          </Link>
        </div>
      </div>
    </div>
  );
}
