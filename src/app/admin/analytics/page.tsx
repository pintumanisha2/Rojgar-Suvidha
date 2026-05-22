"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import {
  Smartphone, Monitor, TrendingUp, Users, Eye, Globe,
  Tablet, Clock, MousePointerClick, RefreshCw, Wifi,
  Activity, BarChart2, ArrowUpRight, ArrowDownRight, Zap
} from "lucide-react";

interface Row {
  page: string; source: string; browser: string; os: string;
  device_type: string; user_type: string; session_id: string;
  referrer: string | null; time_on_page: number | null;
  scroll_depth: number | null; created_at: string; event: string;
}

type Range = "today" | "7d" | "30d";

const COLORS = {
  web: "#6366f1", app: "#8b5cf6",
  Mobile: "#f59e0b", Desktop: "#3b82f6", Tablet: "#10b981",
  Chrome: "#ef4444", Firefox: "#f97316", Safari: "#06b6d4",
  Edge: "#6366f1", Samsung: "#a855f7", Other: "#6b7280",
  new: "#10b981", returning: "#f59e0b",
  Android: "#22c55e", iOS: "#94a3b8", Windows: "#3b82f6",
  macOS: "#a855f7", Linux: "#f97316",
};

function pct(a: number, total: number) {
  return total ? Math.round((a / total) * 100) : 0;
}

function fmtTime(sec: number | null): string {
  if (!sec) return "—";
  if (sec < 60) return `${sec}s`;
  return `${Math.floor(sec / 60)}m ${sec % 60}s`;
}

function MiniBar({ label, value, total, color }: { label: string; value: number; total: number; color: string }) {
  const p = pct(value, total);
  return (
    <div className="space-y-0.5">
      <div className="flex justify-between text-xs">
        <span className="text-gray-600 dark:text-gray-400 font-medium">{label}</span>
        <span className="font-bold text-gray-800 dark:text-gray-200">{value} <span className="text-gray-400">({p}%)</span></span>
      </div>
      <div className="h-2 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${p}%`, backgroundColor: color }} />
      </div>
    </div>
  );
}

export default function AnalyticsPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState<Range>("7d");
  const [activeTab, setActiveTab] = useState<"overview" | "pages" | "audience" | "behavior" | "services">("overview");

  const fetchData = useCallback(async () => {
    setLoading(true);
    const now = new Date();
    let from = new Date();
    if (range === "today") from.setHours(0, 0, 0, 0);
    else if (range === "7d") from.setDate(now.getDate() - 7);
    else from.setDate(now.getDate() - 30);

    const { data } = await supabase
      .from("analytics")
      .select("page,source,browser,os,device_type,user_type,session_id,referrer,time_on_page,scroll_depth,created_at,event")
      .gte("created_at", from.toISOString())
      .order("created_at", { ascending: false });

    setRows((data as Row[]) || []);
    setLoading(false);
  }, [range]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Derived metrics
  const pageviews = rows.filter(r => r.event === "pageview");
  const total = pageviews.length;
  const webViews = pageviews.filter(r => r.source === "web").length;
  const appViews = pageviews.filter(r => r.source === "app").length;

  const uniqueSessions = new Set(pageviews.map(r => r.session_id).filter(Boolean)).size;
  const newUsers = pageviews.filter(r => r.user_type === "new").length;
  const returningUsers = pageviews.filter(r => r.user_type === "returning").length;

  const exitRows = rows.filter(r => r.event === "exit" && r.time_on_page != null);
  const avgTime = exitRows.length
    ? Math.round(exitRows.reduce((s, r) => s + (r.time_on_page || 0), 0) / exitRows.length)
    : null;
  const avgScroll = exitRows.length
    ? Math.round(exitRows.reduce((s, r) => s + (r.scroll_depth || 0), 0) / exitRows.length)
    : null;

  // Today vs yesterday
  const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
  const ydStart = new Date(todayStart); ydStart.setDate(ydStart.getDate() - 1);
  const todayViews = pageviews.filter(r => new Date(r.created_at) >= todayStart).length;
  const ydViews = pageviews.filter(r => new Date(r.created_at) >= ydStart && new Date(r.created_at) < todayStart).length;
  const growthPct = ydViews ? Math.round(((todayViews - ydViews) / ydViews) * 100) : 0;

  // Real-time (last 5 min)
  const realtimeUsers = new Set(
    pageviews.filter(r => new Date(r.created_at) >= new Date(Date.now() - 5 * 60 * 1000)).map(r => r.session_id)
  ).size;

  // Breakdown helpers
  function breakdown(field: keyof Row) {
    const map: Record<string, number> = {};
    pageviews.forEach(r => {
      const val = (r[field] as string) || "Other";
      map[val] = (map[val] || 0) + 1;
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }

  // Top pages breakdown
  const pageMap: Record<string, { web: number; app: number }> = {};
  pageviews.forEach(r => {
    if (!pageMap[r.page]) pageMap[r.page] = { web: 0, app: 0 };
    if (r.source === "web") pageMap[r.page].web++;
    else pageMap[r.page].app++;
  });
  const topPages = Object.entries(pageMap)
    .map(([page, v]) => ({ page, total: v.web + v.app, ...v }))
    .sort((a, b) => b.total - a.total).slice(0, 10);

  // Top referrers
  const refMap: Record<string, number> = {};
  pageviews.filter(r => r.referrer).forEach(r => {
    try {
      const host = new URL(r.referrer!).hostname;
      refMap[host] = (refMap[host] || 0) + 1;
    } catch { }
  });
  const topRefs = Object.entries(refMap).sort((a, b) => b[1] - a[1]).slice(0, 5);

  // Hourly chart (last 24h)
  const hourlyMap: Record<string, { web: number; app: number }> = {};
  pageviews.filter(r => new Date(r.created_at) >= new Date(Date.now() - 86400000)).forEach(r => {
    const h = new Date(r.created_at).getHours().toString().padStart(2, "0");
    if (!hourlyMap[h]) hourlyMap[h] = { web: 0, app: 0 };
    if (r.source === "web") hourlyMap[h].web++;
    else hourlyMap[h].app++;
  });
  const hourlyData = Array.from({ length: 24 }, (_, i) => {
    const h = i.toString().padStart(2, "0");
    return { h, ...(hourlyMap[h] || { web: 0, app: 0 }) };
  });
  const maxHourly = Math.max(...hourlyData.map(h => h.web + h.app), 1);

  const tabs = [
    { id: "overview", label: "Overview", icon: BarChart2 },
    { id: "pages", label: "Pages", icon: Globe },
    { id: "audience", label: "Audience", icon: Users },
    { id: "behavior", label: "Behavior", icon: MousePointerClick },
    { id: "services", label: "Services", icon: Zap },
  ] as const;

  // ── Services deep analytics ──────────────────────────────
  const SERVICE_GROUPS = [
    {
      key: "apply-for-me",
      label: "Apply For Me",
      emoji: "📝",
      color: "#6366f1",
      patterns: ["/apply-for-me", "/apply-for-me/"],
    },
    {
      key: "e-suvidha",
      label: "e-Suvidha",
      emoji: "🏛️",
      color: "#10b981",
      patterns: ["/e-suvidha"],
    },
    {
      key: "e-suvidha-apply",
      label: "e-Suvidha Apply",
      emoji: "📋",
      color: "#059669",
      patterns: ["/e-suvidha/apply"],
    },
    {
      key: "direct-apply",
      label: "Direct Apply Forms",
      emoji: "🚀",
      color: "#f59e0b",
      patterns: ["/apply/"],
    },
    {
      key: "jobs",
      label: "Job Listings",
      emoji: "💼",
      color: "#3b82f6",
      patterns: ["/job/", "/jobs"],
    },
    {
      key: "results",
      label: "Results",
      emoji: "🏆",
      color: "#8b5cf6",
      patterns: ["/result"],
    },
    {
      key: "admit-card",
      label: "Admit Card",
      emoji: "🎫",
      color: "#ec4899",
      patterns: ["/admit-card"],
    },
  ];

  function matchesPatterns(page: string, patterns: string[]) {
    return patterns.some(p => page === p || page.startsWith(p));
  }

  const serviceStats = SERVICE_GROUPS.map(sg => {
    const matched = pageviews.filter(r => matchesPatterns(r.page, sg.patterns));
    const web = matched.filter(r => r.source === "web").length;
    const app = matched.filter(r => r.source === "app").length;
    const total = matched.length;
    const exits = rows.filter(r => r.event === "exit" && matchesPatterns(r.page, sg.patterns));
    const avgT = exits.length ? Math.round(exits.reduce((s, r) => s + (r.time_on_page || 0), 0) / exits.length) : null;
    const avgS = exits.length ? Math.round(exits.reduce((s, r) => s + (r.scroll_depth || 0), 0) / exits.length) : null;
    const todayCount = matched.filter(r => new Date(r.created_at) >= todayStart).length;
    const newU = matched.filter(r => r.user_type === "new").length;
    const retU = matched.filter(r => r.user_type === "returning").length;
    // unique pages within group
    const subPages = [...new Set(matched.map(r => r.page))].slice(0, 5);
    return { ...sg, web, app, total, avgTime: avgT, avgScroll: avgS, todayCount, newU, retU, subPages };
  }).sort((a, b) => b.total - a.total);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
            <Activity className="w-7 h-7 text-indigo-500" /> Deep Analytics
          </h1>
          <p className="text-sm text-gray-500 mt-0.5 flex items-center gap-1.5">
            <span className="inline-flex items-center gap-1 text-green-500 font-bold">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse inline-block" />
              {realtimeUsers} live
            </span>
            · Web vs App · Device · Browser · Behavior
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={fetchData} className="p-2 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition">
            <RefreshCw className="w-4 h-4 text-gray-500" />
          </button>
          <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl">
            {(["today", "7d", "30d"] as const).map(r => (
              <button key={r} onClick={() => setRange(r)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${range === r ? "bg-white dark:bg-gray-700 text-indigo-600 shadow" : "text-gray-500"}`}>
                {r === "today" ? "Aaj" : r === "7d" ? "7 Din" : "30 Din"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="animate-spin rounded-full h-10 w-10 border-4 border-indigo-500 border-t-transparent" />
        </div>
      ) : (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { label: "Total Views", value: total, sub: `${todayViews} aaj`, icon: Eye, color: "#6366f1", growth: growthPct },
              { label: "Sessions", value: uniqueSessions, sub: `${newUsers} new · ${returningUsers} return`, icon: Users, color: "#8b5cf6" },
              { label: "Avg Time", value: fmtTime(avgTime), sub: avgScroll != null ? `${avgScroll}% scroll` : "—", icon: Clock, color: "#f59e0b" },
              { label: "App Users", value: appViews, sub: `${pct(appViews, total)}% of total`, icon: Smartphone, color: "#10b981" },
            ].map(({ label, value, sub, icon: Icon, color, growth }) => (
              <div key={label} className="bg-white dark:bg-gray-900 rounded-2xl p-4 border border-gray-100 dark:border-gray-800 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <div className="p-1.5 rounded-lg" style={{ backgroundColor: color + "20" }}>
                    <Icon className="w-4 h-4" style={{ color }} />
                  </div>
                  {growth !== undefined && (
                    <span className={`text-xs font-bold flex items-center gap-0.5 ${growth >= 0 ? "text-green-500" : "text-red-500"}`}>
                      {growth >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                      {Math.abs(growth)}%
                    </span>
                  )}
                </div>
                <p className="text-xl font-extrabold text-gray-900 dark:text-white">{value}</p>
                <p className="text-[10px] text-gray-400 font-medium mt-0.5">{sub}</p>
                <p className="text-xs text-gray-500 font-semibold mt-1">{label}</p>
              </div>
            ))}
          </div>

          {/* 24h Chart */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-5 border border-gray-100 dark:border-gray-800 shadow-sm">
            <h2 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">24-Hour Traffic (Web 🔵 App 🟣)</h2>
            <div className="flex items-end gap-0.5 h-20">
              {hourlyData.map(({ h, web, app }) => {
                const total = web + app;
                const hp = (total / maxHourly) * 100;
                return (
                  <div key={h} className="flex-1 flex flex-col items-center justify-end group relative" title={`${h}:00 — Web: ${web}, App: ${app}`}>
                    <div className="w-full flex flex-col rounded-sm overflow-hidden" style={{ height: `${hp}%`, minHeight: total > 0 ? 4 : 0 }}>
                      <div className="w-full" style={{ height: `${app > 0 ? pct(app, total) : 0}%`, backgroundColor: "#8b5cf6" }} />
                      <div className="w-full" style={{ height: `${web > 0 ? pct(web, total) : 0}%`, backgroundColor: "#6366f1" }} />
                    </div>
                    <span className="text-[8px] text-gray-300 dark:text-gray-600 mt-0.5">{parseInt(h) % 6 === 0 ? h : ""}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-2xl w-full">
            {tabs.map(({ id, label, icon: Icon }) => (
              <button key={id} onClick={() => setActiveTab(id)}
                className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all ${activeTab === id ? "bg-white dark:bg-gray-700 text-indigo-600 shadow" : "text-gray-500"}`}>
                <Icon className="w-3.5 h-3.5" /> {label}
              </button>
            ))}
          </div>

          {/* TAB: Overview */}
          {activeTab === "overview" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Web vs App */}
              <div className="bg-white dark:bg-gray-900 rounded-2xl p-5 border border-gray-100 dark:border-gray-800 shadow-sm">
                <h2 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-4">🌐 Web vs 📱 App</h2>
                <div className="space-y-3">
                  <MiniBar label="Web" value={webViews} total={total} color={COLORS.web} />
                  <MiniBar label="App" value={appViews} total={total} color={COLORS.app} />
                </div>
              </div>
              {/* New vs Returning */}
              <div className="bg-white dark:bg-gray-900 rounded-2xl p-5 border border-gray-100 dark:border-gray-800 shadow-sm">
                <h2 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-4">👥 New vs Returning</h2>
                <div className="space-y-3">
                  <MiniBar label="New Users" value={newUsers} total={total} color={COLORS.new} />
                  <MiniBar label="Returning" value={returningUsers} total={total} color={COLORS.returning} />
                </div>
              </div>
              {/* Top Referrers */}
              <div className="bg-white dark:bg-gray-900 rounded-2xl p-5 border border-gray-100 dark:border-gray-800 shadow-sm md:col-span-2">
                <h2 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-4">🔗 Top Referrers</h2>
                {topRefs.length === 0 ? <p className="text-gray-400 text-sm">Direct traffic ya koi referrer nahi</p> :
                  <div className="space-y-2">
                    {topRefs.map(([host, count]) => (
                      <MiniBar key={host} label={host} value={count} total={total} color="#6366f1" />
                    ))}
                  </div>
                }
              </div>
            </div>
          )}

          {/* TAB: Pages */}
          {activeTab === "pages" && (
            <div className="bg-white dark:bg-gray-900 rounded-2xl p-5 border border-gray-100 dark:border-gray-800 shadow-sm">
              <h2 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-4">📄 Top Pages — Web 🔵 + App 🟣</h2>
              <div className="space-y-3">
                {topPages.map(({ page, total: t, web, app }) => (
                  <div key={page} className="space-y-1">
                    <div className="flex justify-between text-xs items-center gap-2">
                      <span className="font-medium text-gray-700 dark:text-gray-300 truncate">
                        {page === "/" ? "🏠 Home" : page}
                      </span>
                      <div className="flex items-center gap-2 shrink-0 text-xs font-bold">
                        <span className="text-indigo-500">{web}w</span>
                        <span className="text-violet-500">{app}a</span>
                        <span className="text-gray-500 font-extrabold">{t}</span>
                      </div>
                    </div>
                    <div className="h-2 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden flex">
                      <div className="bg-indigo-500 h-full" style={{ width: `${pct(web, t)}%` }} />
                      <div className="bg-violet-500 h-full" style={{ width: `${pct(app, t)}%` }} />
                    </div>
                  </div>
                ))}
                {topPages.length === 0 && <p className="text-gray-400 text-sm text-center py-4">Koi data nahi</p>}
              </div>
            </div>
          )}

          {/* TAB: Audience */}
          {activeTab === "audience" && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { title: "📱 Device Type", field: "device_type" as keyof Row, colorMap: COLORS },
                { title: "🖥 Browser", field: "browser" as keyof Row, colorMap: COLORS },
                { title: "💻 OS", field: "os" as keyof Row, colorMap: COLORS },
              ].map(({ title, field, colorMap }) => (
                <div key={field} className="bg-white dark:bg-gray-900 rounded-2xl p-5 border border-gray-100 dark:border-gray-800 shadow-sm">
                  <h2 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-4">{title}</h2>
                  <div className="space-y-3">
                    {breakdown(field).map(([val, count]) => (
                      <MiniBar key={val} label={val} value={count} total={total} color={(colorMap as any)[val] || "#6b7280"} />
                    ))}
                    {breakdown(field).length === 0 && <p className="text-gray-400 text-sm">Koi data nahi</p>}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* TAB: Behavior */}
          {activeTab === "behavior" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white dark:bg-gray-900 rounded-2xl p-5 border border-gray-100 dark:border-gray-800 shadow-sm">
                <h2 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-4">⏱ Avg Time on Page</h2>
                <p className="text-4xl font-extrabold text-indigo-500">{fmtTime(avgTime)}</p>
                <p className="text-xs text-gray-400 mt-1">Based on {exitRows.length} sessions</p>
              </div>
              <div className="bg-white dark:bg-gray-900 rounded-2xl p-5 border border-gray-100 dark:border-gray-800 shadow-sm">
                <h2 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-4">📜 Avg Scroll Depth</h2>
                <p className="text-4xl font-extrabold text-emerald-500">{avgScroll != null ? `${avgScroll}%` : "—"}</p>
                <div className="mt-3 h-3 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                  <div className="h-full bg-emerald-400 rounded-full transition-all duration-500" style={{ width: `${avgScroll || 0}%` }} />
                </div>
              </div>
              {/* Pages per Session */}
              <div className="bg-white dark:bg-gray-900 rounded-2xl p-5 border border-gray-100 dark:border-gray-800 shadow-sm md:col-span-2">
                <h2 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-4">📊 Pages per Session</h2>
                <p className="text-4xl font-extrabold text-violet-500">
                  {uniqueSessions ? (total / uniqueSessions).toFixed(1) : "—"}
                </p>
                <p className="text-xs text-gray-400 mt-1">{total} pageviews / {uniqueSessions} sessions</p>
              </div>
            </div>
          )}

          {/* TAB: Services */}
          {activeTab === "services" && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {serviceStats.map(s => (
                  <div key={s.key} className="bg-white dark:bg-gray-900 rounded-2xl p-4 border border-gray-100 dark:border-gray-800 shadow-sm">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xl">{s.emoji}</span>
                      <span className="text-xs font-bold text-gray-600 dark:text-gray-400 truncate">{s.label}</span>
                    </div>
                    <p className="text-2xl font-extrabold" style={{ color: s.color }}>{s.total}</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">{s.todayCount} aaj · {pct(s.app, s.total || 1)}% app</p>
                    <div className="mt-2 h-1.5 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden flex">
                      <div className="h-full" style={{ width: `${pct(s.web, s.total || 1)}%`, backgroundColor: s.color + "aa" }} />
                      <div className="h-full" style={{ width: `${pct(s.app, s.total || 1)}%`, backgroundColor: s.color }} />
                    </div>
                  </div>
                ))}
              </div>

              {serviceStats.map(s => s.total > 0 && (
                <div key={s.key} className="bg-white dark:bg-gray-900 rounded-2xl p-5 border border-gray-100 dark:border-gray-800 shadow-sm">
                  <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                    <h2 className="text-base font-extrabold text-gray-800 dark:text-white flex items-center gap-2">
                      <span className="text-xl">{s.emoji}</span> {s.label}
                      <span className="ml-2 px-2 py-0.5 rounded-full text-xs font-bold text-white" style={{ backgroundColor: s.color }}>
                        {s.total} visits
                      </span>
                    </h2>
                    <span className="text-xs text-gray-400">Aaj: <b className="text-gray-700 dark:text-gray-300">{s.todayCount}</b></span>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                    {[
                      { label: "🌐 Web", value: s.web, color: "#6366f1" },
                      { label: "📱 App", value: s.app, color: s.color },
                      { label: "⏱ Avg Time", value: fmtTime(s.avgTime), color: "#f59e0b" },
                      { label: "📜 Avg Scroll", value: s.avgScroll != null ? `${s.avgScroll}%` : "—", color: "#10b981" },
                    ].map(({ label, value, color }) => (
                      <div key={label} className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3 text-center">
                        <p className="text-lg font-extrabold" style={{ color }}>{value}</p>
                        <p className="text-[10px] text-gray-400 mt-0.5 font-medium">{label}</p>
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div>
                      <p className="text-xs font-bold text-gray-500 mb-2">New vs Returning</p>
                      <div className="space-y-1.5">
                        <MiniBar label="New" value={s.newU} total={s.total} color="#10b981" />
                        <MiniBar label="Returning" value={s.retU} total={s.total} color="#f59e0b" />
                      </div>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-gray-500 mb-2">Web vs App</p>
                      <div className="space-y-1.5">
                        <MiniBar label="Web" value={s.web} total={s.total} color="#6366f1" />
                        <MiniBar label="App" value={s.app} total={s.total} color={s.color} />
                      </div>
                    </div>
                  </div>

                  {s.subPages.length > 0 && (
                    <div>
                      <p className="text-xs font-bold text-gray-500 mb-2">Sub-pages visited</p>
                      <div className="flex flex-wrap gap-1.5">
                        {s.subPages.map(p => (
                          <span key={p} className="px-2 py-0.5 text-[10px] font-mono rounded-lg border border-gray-200 dark:border-gray-700 text-gray-500 bg-gray-50 dark:bg-gray-800">
                            {p}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
