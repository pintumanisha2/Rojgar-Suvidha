"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Link2, ExternalLink, RefreshCw, CheckCircle2, ShieldCheck, Sparkles, Filter, BarChart3, Send, Clock, Globe, Target } from "lucide-react";

export default function AdminBacklinksPage() {
  const [backlinks, setBacklinks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterPlatform, setFilterPlatform] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [triggerMsg, setTriggerMsg] = useState<string | null>(null);
  const [processingItem, setProcessingItem] = useState(false);

  const fetchBacklinks = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("backlinks_log")
        .select(`
          id,
          platform,
          backlink_url,
          anchor_text,
          status,
          created_at,
          job_id,
          jobs (
            id,
            title,
            slug,
            category
          )
        `)
        .order("created_at", { ascending: false })
        .limit(200);

      if (error) {
        console.warn("Notice fetching backlinks:", error.message);
        setBacklinks([]);
      } else {
        setBacklinks(data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBacklinks();
  }, []);

  const triggerDailyReport = async () => {
    setTriggerMsg("⏳ Sending 9 PM Executive Report to Telegram...");
    try {
      const res = await fetch("/api/cron/daily-report?key=admin9pm");
      const json = await res.json();
      if (json.ok) {
        setTriggerMsg("✅ Daily Executive Report sent to Telegram!");
      } else {
        setTriggerMsg(`❌ Report failed: ${json.error}`);
      }
    } catch (e: any) {
      setTriggerMsg(`❌ Error: ${e.message}`);
    }
    setTimeout(() => setTriggerMsg(null), 5000);
  };

  const handleProcessOneItem = async () => {
    setProcessingItem(true);
    setTriggerMsg("⏳ Processing 1 queued backlink from database...");
    try {
      const res = await fetch("/api/cron/process-backlink-queue");
      const data = await res.json();
      if (data.ok && data.processed > 0) {
        setTriggerMsg(`✅ Published 1 backlink to ${data.platform || "platform"}! Live URL: ${data.url}`);
        fetchBacklinks();
      } else {
        setTriggerMsg(`ℹ️ ${data.message || "Queue is currently empty or no items processed"}`);
      }
    } catch (e: any) {
      setTriggerMsg(`❌ Failed: ${e.message}`);
    } finally {
      setProcessingItem(false);
      setTimeout(() => setTriggerMsg(null), 8000);
    }
  };

  const filteredBacklinks = backlinks.filter((b) => {
    const isLive = b.status === "published" && b.backlink_url && !b.backlink_url.includes("rojgarsuvidha.com");
    const matchesPlatform = filterPlatform === "all" ? true : b.platform === filterPlatform;
    const matchesStatus =
      filterStatus === "all"
        ? true
        : filterStatus === "published"
        ? isLive
        : filterStatus === "queued"
        ? !isLive
        : true;
    return matchesPlatform && matchesStatus;
  });

  const totalCount = backlinks.length;
  const liveCount = backlinks.filter(
    (b) => b.status === "published" && b.backlink_url && !b.backlink_url.includes("rojgarsuvidha.com")
  ).length;
  const queuedCount = backlinks.filter(
    (b) => b.status === "queued" || (b.backlink_url && b.backlink_url.includes("rojgarsuvidha.com"))
  ).length;
  const bloggerCount = backlinks.filter((b) => b.platform === "blogger").length;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-zinc-950 p-6 rounded-2xl border border-gray-200 dark:border-zinc-800 shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300 text-xs font-bold px-2.5 py-0.5 rounded-md uppercase tracking-wider flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" /> Dual-URL Architecture
            </span>
            <span className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 text-xs font-bold px-2.5 py-0.5 rounded-md">
              15-Min Drip Velocity
            </span>
          </div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white flex items-center gap-2">
            <Link2 className="w-6 h-6 text-indigo-600" /> Backlinks & Syndication Hub
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Track both the internal targeted page (what & why) and external live platform publications side-by-side.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0 flex-wrap">
          <button
            onClick={handleProcessOneItem}
            disabled={processingItem}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-md transition-all"
          >
            <Send className={`w-4 h-4 ${processingItem ? "animate-spin" : ""}`} /> {processingItem ? "Publishing..." : "Publish 1 Now"}
          </button>
          <button
            onClick={fetchBacklinks}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 text-gray-700 dark:text-gray-300 text-xs font-bold rounded-xl transition-all"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} /> Refresh
          </button>
          <button
            onClick={triggerDailyReport}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-md transition-all"
          >
            <Sparkles className="w-4 h-4" /> Trigger Telegram 9 PM Report
          </button>
        </div>
      </div>

      {triggerMsg && (
        <div className="p-3 bg-indigo-50 border border-indigo-200 text-indigo-800 rounded-xl text-xs font-bold">
          {triggerMsg}
        </div>
      )}

      {/* Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-zinc-950 p-5 rounded-2xl border border-gray-200 dark:border-zinc-800 shadow-sm">
          <p className="text-xs text-gray-500 font-medium">Total Backlink Records</p>
          <p className="text-2xl font-black text-gray-900 dark:text-white mt-1">{totalCount}</p>
        </div>
        <div className="bg-white dark:bg-zinc-950 p-5 rounded-2xl border border-gray-200 dark:border-zinc-800 shadow-sm">
          <p className="text-xs text-gray-500 font-medium">Published Live External</p>
          <p className="text-2xl font-black text-emerald-600 mt-1">{liveCount}</p>
        </div>
        <div className="bg-white dark:bg-zinc-950 p-5 rounded-2xl border border-gray-200 dark:border-zinc-800 shadow-sm">
          <p className="text-xs text-gray-500 font-medium">In 15-Min Drip Queue</p>
          <p className="text-2xl font-black text-amber-600 mt-1">{queuedCount}</p>
        </div>
        <div className="bg-white dark:bg-zinc-950 p-5 rounded-2xl border border-gray-200 dark:border-zinc-800 shadow-sm">
          <p className="text-xs text-gray-500 font-medium">Blogger Satellite Posts</p>
          <p className="text-2xl font-black text-indigo-600 mt-1">{bloggerCount}</p>
        </div>
      </div>

      {/* Table Container */}
      <div className="bg-white dark:bg-zinc-950 rounded-2xl border border-gray-200 dark:border-zinc-800 overflow-hidden shadow-sm">
        <div className="p-4 border-b border-gray-100 dark:border-zinc-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-400" />
              <span className="text-xs font-bold text-gray-700 dark:text-gray-300">Platform:</span>
              <select
                value={filterPlatform}
                onChange={(e) => setFilterPlatform(e.target.value)}
                className="text-xs bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-lg px-2.5 py-1 font-semibold text-gray-800 dark:text-gray-200 focus:outline-none"
              >
                <option value="all">All Platforms</option>
                <option value="blogger">Google Blogspot</option>
                <option value="github">GitHub</option>
                <option value="gitlab">GitLab</option>
                <option value="wordpress">WordPress</option>
                <option value="gitbook">GitBook</option>
                <option value="devto">Dev.to</option>
                <option value="telegraph">Telegra.ph</option>
                <option value="livejournal">LiveJournal</option>
                <option value="medium">Medium</option>
                <option value="pinterest">Pinterest</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-gray-700 dark:text-gray-300">Status:</span>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="text-xs bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-lg px-2.5 py-1 font-semibold text-gray-800 dark:text-gray-200 focus:outline-none"
              >
                <option value="all">All Statuses</option>
                <option value="published">Published Live</option>
                <option value="queued">In Drip Queue</option>
              </select>
            </div>
          </div>

          <span className="text-xs text-gray-400 font-medium">Showing {filteredBacklinks.length} records</span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-xs text-gray-500 font-medium">
            Loading backlinks database log...
          </div>
        ) : filteredBacklinks.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <p className="text-sm font-bold text-gray-700 dark:text-gray-300">No Backlinks Found</p>
            <p className="text-xs text-gray-500 max-w-md mx-auto">
              Backlinks are queued automatically when a job post is approved in Telegram.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 dark:bg-zinc-900 text-gray-500 font-bold border-b border-gray-100 dark:border-zinc-900 uppercase tracking-wider">
                <tr>
                  <th className="p-3.5">Post Title & Targeted URL</th>
                  <th className="p-3.5">Platform & Tier</th>
                  <th className="p-3.5">Live External Backlink URL</th>
                  <th className="p-3.5">Anchor Text & Strategy</th>
                  <th className="p-3.5">Status & Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-zinc-900">
                {filteredBacklinks.map((b) => {
                  const jobTitle = b.jobs?.title || "Job Update";
                  const jobSlug = b.jobs?.slug;
                  const isLive = b.status === "published" && b.backlink_url && !b.backlink_url.includes("rojgarsuvidha.com");

                  // Determine target URL
                  const defaultJobUrl = jobSlug ? `https://www.rojgarsuvidha.com/job/${jobSlug}` : "https://www.rojgarsuvidha.com";
                  const targetUrl = b.target_url || (b.backlink_url?.includes("rojgarsuvidha.com") ? b.backlink_url : defaultJobUrl);

                  // Extract target path for clean display
                  const targetPath = targetUrl.replace("https://www.rojgarsuvidha.com", "") || "/";

                  return (
                    <tr key={b.id} className="hover:bg-gray-50 dark:hover:bg-zinc-900/40 transition-colors">
                      {/* Column 1: Post Title & Target URL */}
                      <td className="p-3.5 max-w-[280px]">
                        <p className="font-bold text-gray-900 dark:text-white truncate" title={jobTitle}>
                          {jobTitle}
                        </p>
                        <a
                          href={targetUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] text-indigo-600 dark:text-indigo-400 font-semibold hover:underline mt-1 truncate max-w-full"
                          title={`Target Page: ${targetUrl}`}
                        >
                          <Target className="w-3 h-3 shrink-0 text-indigo-500" />
                          <span className="truncate">{targetPath}</span>
                        </a>
                      </td>

                      {/* Column 2: Platform */}
                      <td className="p-3.5">
                        <span className={`inline-block px-2.5 py-1 rounded-md text-[10px] font-extrabold uppercase ${
                          b.platform === "blogger" ? "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300" :
                          b.platform === "github" ? "bg-zinc-800 text-zinc-100 dark:bg-zinc-700 dark:text-zinc-200" :
                          b.platform === "wordpress" ? "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300" :
                          b.platform === "devto" ? "bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300" :
                          b.platform === "telegraph" ? "bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-300" :
                          "bg-gray-100 text-gray-800 dark:bg-zinc-800 dark:text-gray-300"
                        }`}>
                          {b.platform}
                        </span>
                      </td>

                      {/* Column 3: Live External URL */}
                      <td className="p-3.5 max-w-[300px]">
                        {isLive ? (
                          <a
                            href={b.backlink_url}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-semibold hover:underline truncate max-w-full"
                            title={b.backlink_url}
                          >
                            <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                            <span className="truncate">{b.backlink_url}</span>
                          </a>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 rounded-md font-bold text-[10px]">
                            <Clock className="w-3 h-3" /> ⏳ Pending Drip (15-min queue)
                          </span>
                        )}
                      </td>

                      {/* Column 4: Anchor Text */}
                      <td className="p-3.5 max-w-[200px]">
                        <p className="text-gray-700 dark:text-gray-300 font-medium truncate" title={b.anchor_text}>
                          "{b.anchor_text || "Rojgar Suvidha"}"
                        </p>
                      </td>

                      {/* Column 5: Status & Date */}
                      <td className="p-3.5 whitespace-nowrap">
                        <div className="flex flex-col gap-0.5">
                          <span className={`text-[10px] font-bold ${isLive ? "text-emerald-600" : "text-amber-600"}`}>
                            {isLive ? "✅ Published Live" : "⏳ In Drip Queue"}
                          </span>
                          <span className="text-[10px] text-gray-400">
                            {new Date(b.created_at).toLocaleDateString("en-IN", {
                              day: "numeric",
                              month: "short",
                              hour: "2-digit",
                              minute: "2-digit",
                              timeZone: "Asia/Kolkata",
                            })}
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
