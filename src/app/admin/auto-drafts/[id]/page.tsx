"use client";

import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, CheckCircle2, XCircle, Eye, Edit2, ExternalLink,
  Loader2, Sparkles, Calendar, Users, Globe, Link2, Clock,
  AlertTriangle, Save, Send
} from "lucide-react";

const CATEGORY_COLORS: Record<string, { badge: string; label: string }> = {
  "latest-jobs": { badge: "bg-indigo-100 text-indigo-700 border-indigo-200", label: "Latest Jobs" },
  "results": { badge: "bg-green-100 text-green-700 border-green-200", label: "Results" },
  "admit-card": { badge: "bg-orange-100 text-orange-700 border-orange-200", label: "Admit Card" },
  "answer-key": { badge: "bg-rose-100 text-rose-700 border-rose-200", label: "Answer Key" },
  "admission": { badge: "bg-purple-100 text-purple-700 border-purple-200", label: "Admission" },
  "news": { badge: "bg-blue-100 text-blue-700 border-blue-200", label: "News" },
};

function generateSlug(title: string): string {
  return title.toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim()
    .slice(0, 80);
}

export default function AutoDraftDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [draft, setDraft] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<"preview" | "edit">("preview");

  // Editable fields
  const [editTitle, setEditTitle] = useState("");
  const [editSlug, setEditSlug] = useState("");
  const [editMeta, setEditMeta] = useState("");
  const [editHtml, setEditHtml] = useState("");
  const [editStatus, setEditStatus] = useState("active");

  // Publish state
  const [publishing, setPublishing] = useState(false);
  const [publishResult, setPublishResult] = useState<{ ok: boolean; msg: string } | null>(null);
  const [rejecting, setRejecting] = useState(false);

  const previewRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchDraft = async () => {
      const { data, error } = await supabase
        .from("auto_blog_drafts")
        .select("*")
        .eq("id", id)
        .single();

      if (!error && data) {
        setDraft(data);
        setEditTitle(data.generated_title || data.source_title || "");
        setEditSlug(data.generated_slug || generateSlug(data.generated_title || data.source_title || ""));
        setEditMeta(data.generated_meta || "");
        setEditHtml(data.generated_html || "");
      }
      setLoading(false);
    };
    fetchDraft();
  }, [id]);

  // Auto-update slug when title changes
  useEffect(() => {
    if (editTitle) setEditSlug(generateSlug(editTitle));
  }, [editTitle]);

  const handlePublish = async () => {
    if (!editTitle || !editSlug) {
      setPublishResult({ ok: false, msg: "Title aur slug dono zaroori hain" });
      return;
    }
    setPublishing(true);
    setPublishResult(null);

    // Save edits to draft first
    await supabase.from("auto_blog_drafts").update({
      generated_title: editTitle,
      generated_slug: editSlug,
      generated_meta: editMeta,
      generated_html: editHtml,
    }).eq("id", id);

    const res = await fetch(`/api/auto-blog/publish/${id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: editTitle,
        slug: editSlug,
        metaDesc: editMeta,
        postStatus: editStatus,
      }),
    });
    const data = await res.json();

    if (data.success) {
      setPublishResult({ ok: true, msg: `✅ Published! /job/${data.slug}` });
      setDraft((prev: any) => ({ ...prev, status: "published" }));
    } else {
      setPublishResult({ ok: false, msg: `❌ ${data.error}` });
    }
    setPublishing(false);
  };

  const handleReject = async () => {
    if (!confirm("Is draft ko reject kar do?")) return;
    setRejecting(true);
    await fetch(`/api/auto-blog/reject/${id}`, { method: "DELETE" });
    router.push("/admin/auto-drafts");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  if (!draft) {
    return (
      <div className="p-8 text-center">
        <p className="text-gray-500">Draft not found</p>
        <Link href="/admin/auto-drafts" className="text-indigo-600 mt-4 inline-block">← Back</Link>
      </div>
    );
  }

  const catCfg = CATEGORY_COLORS[draft.category] || { badge: "bg-gray-100 text-gray-600 border-gray-200", label: draft.category };
  const alreadyPublished = draft.status === "published";

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Top Bar */}
      <div className="sticky top-0 z-30 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-6 py-3">
        <div className="flex items-center justify-between gap-4 max-w-7xl mx-auto">
          {/* Left */}
          <div className="flex items-center gap-3 min-w-0">
            <Link
              href="/admin/auto-drafts"
              className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 transition flex-shrink-0"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="min-w-0">
              <p className="text-xs text-gray-400 font-medium">Auto Draft Review</p>
              <p className="text-sm font-bold text-gray-900 dark:text-white truncate max-w-sm">
                {editTitle || draft.source_title}
              </p>
            </div>
          </div>

          {/* Right — Actions */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Preview / Edit toggle */}
            <div className="flex rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden text-sm">
              <button
                onClick={() => setMode("preview")}
                className={`px-3 py-1.5 flex items-center gap-1.5 font-medium transition ${mode === "preview" ? "bg-indigo-600 text-white" : "text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"}`}
              >
                <Eye className="w-3.5 h-3.5" /> Preview
              </button>
              <button
                onClick={() => setMode("edit")}
                className={`px-3 py-1.5 flex items-center gap-1.5 font-medium transition ${mode === "edit" ? "bg-indigo-600 text-white" : "text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"}`}
              >
                <Edit2 className="w-3.5 h-3.5" /> Edit
              </button>
            </div>

            {!alreadyPublished && (
              <>
                <button
                  onClick={handleReject}
                  disabled={rejecting}
                  className="flex items-center gap-1.5 border border-red-200 text-red-500 px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-red-50 transition"
                >
                  <XCircle className="w-4 h-4" /> Reject
                </button>
                <button
                  onClick={handlePublish}
                  disabled={publishing}
                  className="flex items-center gap-1.5 bg-gradient-to-r from-green-500 to-emerald-600 text-white px-4 py-1.5 rounded-lg text-sm font-bold hover:opacity-90 transition shadow disabled:opacity-60"
                >
                  {publishing ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                  Publish Live
                </button>
              </>
            )}

            {alreadyPublished && (
              <span className="flex items-center gap-1.5 bg-green-100 text-green-700 px-3 py-1.5 rounded-lg text-sm font-semibold border border-green-200">
                <CheckCircle2 className="w-4 h-4" /> Published
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Publish result */}
      {publishResult && (
        <div
          className={`mx-6 mt-4 px-4 py-3 rounded-xl text-sm font-medium border max-w-7xl mx-auto ${
            publishResult.ok
              ? "bg-green-50 text-green-700 border-green-200"
              : "bg-red-50 text-red-700 border-red-200"
          }`}
        >
          {publishResult.msg}
          {publishResult.ok && (
            <Link
              href={`/job/${editSlug}`}
              target="_blank"
              className="ml-3 underline"
            >
              Live page dekho →
            </Link>
          )}
        </div>
      )}

      <div className="max-w-7xl mx-auto px-6 py-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Sidebar — Meta Info + Edit Fields */}
        <div className="space-y-4">
          {/* Source Info */}
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">Source Info</h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-start gap-2">
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${catCfg.badge}`}>
                  {catCfg.label}
                </span>
              </div>
              {draft.total_posts && (
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                  <Users className="w-3.5 h-3.5 text-indigo-400" />
                  <span className="font-semibold text-red-500">{draft.total_posts}</span> Posts
                </div>
              )}
              {draft.last_date && (
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                  <Calendar className="w-3.5 h-3.5 text-red-400" />
                  Last Date: <span className="font-semibold text-red-500">{draft.last_date}</span>
                </div>
              )}
              {draft.app_fee_gen && (
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                  <span className="w-3.5 h-3.5 text-yellow-400 font-bold text-xs">₹</span>
                  Fee: {draft.app_fee_gen}
                </div>
              )}

              {/* Apply status */}
              <div className={`mt-2 px-3 py-2 rounded-lg text-sm font-semibold border ${
                draft.apply_status === "open"
                  ? "bg-green-50 border-green-200 text-green-700"
                  : draft.apply_status === "coming_soon"
                    ? "bg-yellow-50 border-yellow-200 text-yellow-700"
                    : "bg-gray-50 border-gray-200 text-gray-500"
              }`}>
                {draft.apply_status === "open" ? "🟢 Apply Link Live" : draft.apply_status === "coming_soon" ? "🟡 Coming Soon" : "⚪ Unknown"}
                {draft.apply_link && (
                  <a href={draft.apply_link} target="_blank" rel="noopener noreferrer" className="ml-2 text-xs underline">
                    Open ↗
                  </a>
                )}
              </div>

              <a
                href={draft.source_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-xs text-indigo-500 hover:text-indigo-700 mt-1"
              >
                <ExternalLink className="w-3 h-3" />
                View Source
              </a>
            </div>
          </div>

          {/* Edit Meta Fields */}
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3 flex items-center gap-2">
              <Edit2 className="w-3.5 h-3.5" /> Edit Before Publish
            </h3>

            <div>
              <label className="text-xs font-semibold text-gray-500 block mb-1">Title</label>
              <textarea
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="w-full text-sm border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none"
                rows={2}
              />
              <p className="text-xs text-gray-400 mt-1">{editTitle.length}/60 chars</p>
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-500 block mb-1">Slug (URL)</label>
              <input
                value={editSlug}
                onChange={(e) => setEditSlug(e.target.value)}
                className="w-full text-xs border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-400 font-mono"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-500 block mb-1">Meta Description</label>
              <textarea
                value={editMeta}
                onChange={(e) => setEditMeta(e.target.value)}
                className="w-full text-sm border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none"
                rows={3}
              />
              <p className="text-xs text-gray-400 mt-1">{editMeta.length}/160 chars</p>
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-500 block mb-1">Publish Status</label>
              <select
                value={editStatus}
                onChange={(e) => setEditStatus(e.target.value)}
                className="w-full text-sm border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-400"
              >
                <option value="active">🟢 Active (Live)</option>
                <option value="draft">⚪ Draft (Hidden)</option>
              </select>
            </div>

            {!alreadyPublished && (
              <button
                onClick={handlePublish}
                disabled={publishing}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white py-2.5 rounded-xl font-bold text-sm hover:opacity-90 transition disabled:opacity-60"
              >
                {publishing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                Publish Live Now
              </button>
            )}
          </div>

          {/* Scraped at info */}
          <div className="text-xs text-gray-400 flex items-center gap-2 px-1">
            <Clock className="w-3.5 h-3.5" />
            Scraped: {new Date(draft.scraped_at).toLocaleString("en-IN")}
          </div>
        </div>

        {/* Right — Preview or Edit HTML */}
        <div className="lg:col-span-2">
          {mode === "preview" ? (
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
              <div className="px-5 py-3 border-b border-gray-100 dark:border-gray-800 flex items-center gap-2 text-sm font-semibold text-gray-600 dark:text-gray-300">
                <Eye className="w-4 h-4 text-indigo-500" />
                Blog Preview
                <span className="ml-auto text-xs text-gray-400 font-normal">
                  {editHtml.replace(/<[^>]+>/g, " ").trim().split(/\s+/).filter(Boolean).length} words
                </span>
              </div>
              <div
                ref={previewRef}
                className="p-6 prose prose-sm max-w-none dark:prose-invert overflow-auto max-h-[calc(100vh-200px)]"
                style={{ fontFamily: "Inter, system-ui, sans-serif", lineHeight: 1.7 }}
                dangerouslySetInnerHTML={{ __html: editHtml || "<p class='text-gray-400'>No content generated</p>" }}
              />
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
              <div className="px-5 py-3 border-b border-gray-100 dark:border-gray-800 flex items-center gap-2 text-sm font-semibold text-gray-600 dark:text-gray-300">
                <Edit2 className="w-4 h-4 text-purple-500" />
                Edit HTML Content
              </div>
              <textarea
                value={editHtml}
                onChange={(e) => setEditHtml(e.target.value)}
                className="w-full p-4 bg-gray-950 text-green-300 font-mono text-xs focus:outline-none resize-none"
                style={{ height: "calc(100vh - 220px)", minHeight: "400px" }}
                spellCheck={false}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
