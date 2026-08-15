"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import {
  Bot, Clock, CheckCircle2, XCircle, AlertCircle, Eye,
  RefreshCw, Loader2, ExternalLink, Zap, Calendar, Users,
  ChevronRight, Filter, Search
} from "lucide-react";

type Draft = {
  id: string;
  source_title: string;
  source_url: string;
  category: string;
  apply_status: "open" | "coming_soon" | "closed" | "unknown";
  apply_link: string | null;
  last_date: string | null;
  total_posts: string | null;
  generated_title: string | null;
  status: "pending_review" | "published" | "rejected" | "error";
  error_message: string | null;
  scraped_at: string;
  published_at: string | null;
};

const CATEGORY_COLORS: Record<string, string> = {
  "latest-jobs": "bg-indigo-100 text-indigo-700 border-indigo-200",
  "results": "bg-green-100 text-green-700 border-green-200",
  "admit-card": "bg-orange-100 text-orange-700 border-orange-200",
  "answer-key": "bg-rose-100 text-rose-700 border-rose-200",
  "admission": "bg-purple-100 text-purple-700 border-purple-200",
  "news": "bg-blue-100 text-blue-700 border-blue-200",
};

const STATUS_CONFIG = {
  pending_review: { label: "Pending Review", color: "bg-yellow-100 text-yellow-700 border-yellow-300", icon: Clock },
  published: { label: "Published", color: "bg-green-100 text-green-700 border-green-300", icon: CheckCircle2 },
  rejected: { label: "Rejected", color: "bg-red-100 text-red-600 border-red-300", icon: XCircle },
  error: { label: "Error", color: "bg-gray-100 text-gray-600 border-gray-300", icon: AlertCircle },
};

const APPLY_STATUS_CONFIG = {
  open: { label: "🟢 Apply Open", color: "text-green-600" },
  coming_soon: { label: "🟡 Coming Soon", color: "text-yellow-600" },
  closed: { label: "🔴 Closed", color: "text-red-600" },
  unknown: { label: "⚪ Unknown", color: "text-gray-400" },
};

export default function AutoDraftsPage() {
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>("pending_review");
  const [searchQ, setSearchQ] = useState("");
  const [triggeringCron, setTriggeringCron] = useState(false);
  const [cronResult, setCronResult] = useState<string | null>(null);

  const fetchDrafts = async () => {
    setLoading(true);
    let query = supabase
      .from("auto_blog_drafts")
      .select("*")
      .order("scraped_at", { ascending: false })
      .limit(50);

    if (filterStatus !== "all") {
      query = query.eq("status", filterStatus);
    }

    const { data, error } = await query;
    if (!error) setDrafts(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchDrafts();
  }, [filterStatus]);

  const handleManualCron = async () => {
    setTriggeringCron(true);
    setCronResult(null);
    try {
      // Security: Cron secret is handled server-side via /api/auto-blog/trigger
      // Admin panel calls this endpoint which verifies admin session before calling cron
      const res = await fetch("/api/auto-blog/trigger", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        setCronResult(`✅ ${data.message || `${data.processed} posts processed`}`);
        setTimeout(fetchDrafts, 2000);
      } else {
        setCronResult(`❌ ${data.error || "Cron failed"}`);
      }
    } catch (e: any) {
      setCronResult(`❌ ${e.message}`);
    } finally {
      setTriggeringCron(false);
    }
  };

  const handleQuickReject = async (id: string) => {
    if (!confirm("Is draft ko reject kar do?")) return;
    const res = await fetch(`/api/auto-blog/reject/${id}`, { method: "DELETE" });
    if (res.ok) fetchDrafts();
  };

  const filtered = drafts.filter((d) => {
    if (!searchQ) return true;
    return (
      (d.source_title || "").toLowerCase().includes(searchQ.toLowerCase()) ||
      (d.generated_title || "").toLowerCase().includes(searchQ.toLowerCase())
    );
  });

  const pendingCount = drafts.filter((d) => d.status === "pending_review").length;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Auto Blog Drafts
            </h1>
            {pendingCount > 0 && (
              <span className="bg-yellow-400 text-yellow-900 text-xs font-bold px-2.5 py-1 rounded-full animate-pulse">
                {pendingCount} Pending
              </span>
            )}
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            FreeJobAlert → Gemini AI → Review → Publish
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchDrafts}
            className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 transition text-gray-600 dark:text-gray-300"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={handleManualCron}
            disabled={triggeringCron}
            className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 py-2 rounded-xl font-semibold text-sm hover:opacity-90 transition disabled:opacity-60"
          >
            {triggeringCron ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Zap className="w-4 h-4" />
            )}
            Run Scraper Now
          </button>
        </div>
      </div>

      {/* Cron result message */}
      {cronResult && (
        <div
          className={`mb-5 px-4 py-3 rounded-xl text-sm font-medium border ${
            cronResult.startsWith("✅")
              ? "bg-green-50 text-green-700 border-green-200"
              : "bg-red-50 text-red-700 border-red-200"
          }`}
        >
          {cronResult}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        {/* Status filter */}
        <div className="flex gap-2 flex-wrap">
          {[
            { value: "pending_review", label: "Pending" },
            { value: "published", label: "Published" },
            { value: "rejected", label: "Rejected" },
            { value: "error", label: "Error" },
            { value: "all", label: "All" },
          ].map((f) => (
            <button
              key={f.value}
              onClick={() => setFilterStatus(f.value)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition ${
                filterStatus === f.value
                  ? "bg-indigo-600 text-white border-indigo-600"
                  : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-indigo-300"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={searchQ}
            onChange={(e) => setSearchQ(e.target.value)}
            placeholder="Search drafts..."
            className="w-full pl-9 pr-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
        </div>
      </div>

      {/* Drafts List */}
      {loading ? (
        <div className="flex items-center justify-center py-20 text-gray-400">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <Bot className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">Koi draft nahi mila</p>
          <p className="text-sm mt-1">
            &quot;Run Scraper Now&quot; click karo naya draft generate karne ke liye
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((draft) => {
            const statusCfg = STATUS_CONFIG[draft.status] || STATUS_CONFIG.error;
            const StatusIcon = statusCfg.icon;
            const applyStatusCfg =
              APPLY_STATUS_CONFIG[draft.apply_status || "unknown"];

            return (
              <div
                key={draft.id}
                className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4 hover:border-indigo-300 dark:hover:border-indigo-700 transition shadow-sm"
              >
                <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                  {/* Left: Content */}
                  <div className="flex-1 min-w-0">
                    {/* Badges row */}
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      {/* Status badge */}
                      <span
                        className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full border ${statusCfg.color}`}
                      >
                        <StatusIcon className="w-3 h-3" />
                        {statusCfg.label}
                      </span>

                      {/* Category badge */}
                      {draft.category && (
                        <span
                          className={`text-xs font-medium px-2.5 py-1 rounded-full border ${
                            CATEGORY_COLORS[draft.category] ||
                            "bg-gray-100 text-gray-600 border-gray-200"
                          }`}
                        >
                          {draft.category}
                        </span>
                      )}

                      {/* Apply status */}
                      <span
                        className={`text-xs font-medium ${applyStatusCfg.color}`}
                      >
                        {applyStatusCfg.label}
                      </span>
                    </div>

                    {/* Title */}
                    <h3 className="font-bold text-gray-900 dark:text-white text-base leading-tight mb-1 line-clamp-2">
                      {draft.generated_title || draft.source_title}
                    </h3>

                    {/* Meta info */}
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500 dark:text-gray-400 mt-2">
                      {draft.total_posts && (
                        <span className="flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          {draft.total_posts} Posts
                        </span>
                      )}
                      {draft.last_date && (
                        <span className="flex items-center gap-1 text-red-500 dark:text-red-400 font-medium">
                          <Calendar className="w-3 h-3" />
                          Last: {draft.last_date}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(draft.scraped_at).toLocaleString("en-IN", {
                          day: "numeric",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>

                    {/* Error message */}
                    {draft.status === "error" && draft.error_message && (
                      <p className="mt-2 text-xs text-red-500 bg-red-50 dark:bg-red-900/20 px-3 py-1.5 rounded-lg border border-red-100">
                        ❌ {draft.error_message.slice(0, 120)}
                      </p>
                    )}

                    {/* Source link */}
                    <a
                      href={draft.source_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-indigo-500 hover:text-indigo-700 mt-2"
                    >
                      <ExternalLink className="w-3 h-3" />
                      Source: FreeJobAlert
                    </a>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex sm:flex-col gap-2 flex-shrink-0">
                    {draft.status === "pending_review" && (
                      <>
                        <Link
                          href={`/admin/auto-drafts/${draft.id}`}
                          className="flex items-center gap-1.5 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-indigo-700 transition whitespace-nowrap"
                        >
                          <Eye className="w-4 h-4" />
                          Review
                          <ChevronRight className="w-3 h-3" />
                        </Link>
                        <button
                          onClick={() => handleQuickReject(draft.id)}
                          className="flex items-center gap-1.5 border border-red-200 text-red-500 px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-50 transition whitespace-nowrap"
                        >
                          <XCircle className="w-4 h-4" />
                          Reject
                        </button>
                      </>
                    )}
                    {draft.status === "published" && draft.published_at && (
                      <div className="text-xs text-green-600 font-medium text-right">
                        ✅ Published
                        <br />
                        {new Date(draft.published_at).toLocaleDateString("en-IN")}
                      </div>
                    )}
                    {draft.status !== "pending_review" && draft.status !== "published" && (
                      <Link
                        href={`/admin/auto-drafts/${draft.id}`}
                        className="text-xs text-gray-400 hover:text-gray-600 underline"
                      >
                        View
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
