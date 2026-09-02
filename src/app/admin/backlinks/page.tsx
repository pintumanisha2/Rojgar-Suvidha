"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Link2, ExternalLink, RefreshCw, CheckCircle2, ShieldCheck, Sparkles, Filter, BarChart3, Send } from "lucide-react";

export default function AdminBacklinksPage() {
  const [backlinks, setBacklinks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterPlatform, setFilterPlatform] = useState<string>("all");
  const [triggeringJobId, setTriggeringJobId] = useState<string | null>(null);
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
            slug
          )
        `)
        .order("created_at", { ascending: false })
        .limit(100);

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

  const filteredBacklinks = backlinks.filter((b) =>
    filterPlatform === "all" ? true : b.platform === filterPlatform
  );

  const totalCount = backlinks.length;
  const bloggerCount = backlinks.filter((b) => b.platform === "blogger").length;
  const mediumCount = backlinks.filter((b) => b.platform === "medium").length;
  const pinterestCount = backlinks.filter((b) => b.platform === "pinterest").length;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-zinc-950 p-6 rounded-2xl border border-gray-200 dark:border-zinc-800 shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300 text-xs font-bold px-2.5 py-0.5 rounded-md uppercase tracking-wider flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" /> White-Hat Engine
            </span>
            <span className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 text-xs font-bold px-2.5 py-0.5 rounded-md">
              0% Google Penalty Risk
            </span>
          </div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white flex items-center gap-2">
            <Link2 className="w-6 h-6 text-indigo-600" /> Backlinks & Syndication Manager
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Track external backlinks generated across Blogger, Medium, Pinterest, Tumblr, and Reddit.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
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
          <p className="text-xs text-gray-500 font-medium">Total Backlinks Logged</p>
          <p className="text-2xl font-black text-gray-900 dark:text-white mt-1">{totalCount}</p>
        </div>
        <div className="bg-white dark:bg-zinc-950 p-5 rounded-2xl border border-gray-200 dark:border-zinc-800 shadow-sm">
          <p className="text-xs text-gray-500 font-medium">Google Blogspot (DA 98)</p>
          <p className="text-2xl font-black text-amber-600 mt-1">{bloggerCount}</p>
        </div>
        <div className="bg-white dark:bg-zinc-950 p-5 rounded-2xl border border-gray-200 dark:border-zinc-800 shadow-sm">
          <p className="text-xs text-gray-500 font-medium">Medium.com (DA 95)</p>
          <p className="text-2xl font-black text-indigo-600 mt-1">{mediumCount}</p>
        </div>
        <div className="bg-white dark:bg-zinc-950 p-5 rounded-2xl border border-gray-200 dark:border-zinc-800 shadow-sm">
          <p className="text-xs text-gray-500 font-medium">Pinterest Pins (DA 94)</p>
          <p className="text-2xl font-black text-red-600 mt-1">{pinterestCount}</p>
        </div>
      </div>

      {/* Table Container */}
      <div className="bg-white dark:bg-zinc-950 rounded-2xl border border-gray-200 dark:border-zinc-800 overflow-hidden shadow-sm">
        <div className="p-4 border-b border-gray-100 dark:border-zinc-900 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <span className="text-xs font-bold text-gray-700 dark:text-gray-300">Filter by Platform:</span>
            <select
              value={filterPlatform}
              onChange={(e) => setFilterPlatform(e.target.value)}
              className="text-xs bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-lg px-2.5 py-1 font-semibold text-gray-800 dark:text-gray-200 focus:outline-none"
            >
              <option value="all">All Platforms</option>
              <option value="blogger">Google Blogspot</option>
              <option value="medium">Medium</option>
              <option value="pinterest">Pinterest</option>
            </select>
          </div>
          <span className="text-xs text-gray-400 font-medium">Showing {filteredBacklinks.length} records</span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-xs text-gray-500 font-medium">
            Loading backlinks database log...
          </div>
        ) : filteredBacklinks.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <p className="text-sm font-bold text-gray-700 dark:text-gray-300">No Backlinks Logged Yet</p>
            <p className="text-xs text-gray-500 max-w-md mx-auto">
              Backlinks are generated automatically when a blog post is approved and published via Telegram!
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 dark:bg-zinc-900 text-gray-500 font-bold border-b border-gray-100 dark:border-zinc-900 uppercase tracking-wider">
                <tr>
                  <th className="p-3.5">Blog Post Title</th>
                  <th className="p-3.5">Platform</th>
                  <th className="p-3.5">Backlink Live URL</th>
                  <th className="p-3.5">Anchor Text</th>
                  <th className="p-3.5">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-zinc-900">
                {filteredBacklinks.map((b) => {
                  const jobTitle = b.jobs?.title || "Job Update";
                  const jobSlug = b.jobs?.slug;
                  return (
                    <tr key={b.id} className="hover:bg-gray-50 dark:hover:bg-zinc-900/40 transition-colors">
                      <td className="p-3.5 font-bold text-gray-900 dark:text-white max-w-[280px] truncate">
                        {jobSlug ? (
                          <a href={`/job/${jobSlug}`} target="_blank" rel="noreferrer" className="hover:text-indigo-600">
                            {jobTitle}
                          </a>
                        ) : (
                          jobTitle
                        )}
                      </td>
                      <td className="p-3.5 font-extrabold uppercase">
                        <span className={`px-2 py-0.5 rounded text-[10px] ${
                          b.platform === "blogger" ? "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300" :
                          b.platform === "medium" ? "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-300" :
                          "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300"
                        }`}>
                          {b.platform}
                        </span>
                      </td>
                      <td className="p-3.5">
                        <a
                          href={b.backlink_url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-indigo-600 dark:text-indigo-400 font-medium hover:underline flex items-center gap-1 max-w-[260px] truncate"
                        >
                          <ExternalLink className="w-3 h-3 shrink-0" />
                          <span className="truncate">{b.backlink_url}</span>
                        </a>
                      </td>
                      <td className="p-3.5 text-gray-600 dark:text-gray-400 font-medium max-w-[220px] truncate">
                        "{b.anchor_text}"
                      </td>
                      <td className="p-3.5 text-gray-400 whitespace-nowrap">
                        {new Date(b.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
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
