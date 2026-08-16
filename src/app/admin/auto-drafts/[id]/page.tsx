"use client";

import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, CheckCircle2, XCircle, Eye, Edit2, ExternalLink,
  Loader2, Sparkles, Calendar, Users, Globe, Link2, Clock,
  AlertTriangle, Save, Send, RefreshCw, Check
} from "lucide-react";

const CATEGORY_COLORS: Record<string, { badge: string; label: string }> = {
  "latest-jobs": { badge: "bg-indigo-100 text-indigo-700 border-indigo-200 dark:bg-indigo-950 dark:text-indigo-300", label: "Latest Jobs" },
  "results": { badge: "bg-green-100 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-300", label: "Results" },
  "admit-card": { badge: "bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-950 dark:text-orange-300", label: "Admit Card" },
  "answer-key": { badge: "bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-950 dark:text-rose-300", label: "Answer Key" },
  "admission": { badge: "bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-950 dark:text-purple-300", label: "Admission" },
  "news": { badge: "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300", label: "News" },
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

  // Editable Meta & Link Fields
  const [editTitle, setEditTitle] = useState("");
  const [editSlug, setEditSlug] = useState("");
  const [editMeta, setEditMeta] = useState("");
  const [editHtml, setEditHtml] = useState("");
  const [editCategory, setEditCategory] = useState("latest-jobs");
  const [editApplyStatus, setEditApplyStatus] = useState("unknown"); // open | coming_soon | closed | unknown
  const [editApplyLink, setEditApplyLink] = useState("");
  const [editOfficialLink, setEditOfficialLink] = useState("");
  const [editLastDate, setEditLastDate] = useState("");
  const [editTotalPosts, setEditTotalPosts] = useState("");
  const [editAppFeeGen, setEditAppFeeGen] = useState("");
  const [editStatus, setEditStatus] = useState("active");

  // Action states
  const [savingDraft, setSavingDraft] = useState(false);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);
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
        setEditCategory(data.category || "latest-jobs");
        setEditApplyStatus(data.apply_status || "unknown");
        setEditApplyLink(data.apply_link || "");
        setEditOfficialLink(data.official_link || "");
        setEditLastDate(data.last_date || "");
        setEditTotalPosts(data.total_posts || "");
        setEditAppFeeGen(data.app_fee_gen || "");
      }
      setLoading(false);
    };
    fetchDraft();
  }, [id]);

  // Auto-sync Links into HTML Content
  const handleSyncLinksToHtml = () => {
    let html = editHtml;

    // 1. Prominent Apply Button / Coming Soon Box sync at id="apply" or bottom
    if (editApplyStatus === "open" && editApplyLink) {
      const applyBtnHtml = `
<div id="apply-button-box" style="text-align:center;margin:2rem 0;padding:20px;background:#f0fdf4;border:2px dashed #16a34a;border-radius:12px;">
  <a href="${editApplyLink}" target="_blank" rel="noopener noreferrer" style="display:inline-block;background:linear-gradient(135deg,#15803d,#16a34a);color:white;padding:16px 36px;border-radius:12px;font-size:1.1rem;font-weight:800;text-decoration:none;box-shadow:0 4px 15px rgba(21,128,61,0.3);">
    🔗 Apply Online — Official Link
  </a>
  <p style="color:#64748b;font-size:0.85rem;margin-top:8px;">Official Portal Link • Safe & Verified</p>
</div>`;

      if (html.includes('id="apply-button-box"')) {
        html = html.replace(/<div id="apply-button-box"[\s\S]*?<\/div>/i, applyBtnHtml.trim());
      } else if (html.includes('id="apply"')) {
        html = html.replace(/(<[^>]*id="apply"[^>]*>)/i, `$1\n${applyBtnHtml}`);
      } else {
        html += `\n${applyBtnHtml}`;
      }
    } else if (editApplyStatus === "coming_soon") {
      const comingSoonHtml = `
<div id="apply-button-box" style="background:#fef9c3;border-left:4px solid #d97706;padding:16px 20px;border-radius:8px;margin:1.5rem 0;">
  <strong style="color:#b45309;font-size:1.05rem;">⏳ Apply Online Link — Coming Soon!</strong>
  <p style="margin:8px 0 0;color:#1e293b;">Online apply link abhi activate nahi hua hai. Official link aate hi yahan update ho jayega.</p>
</div>`;

      if (html.includes('id="apply-button-box"')) {
        html = html.replace(/<div id="apply-button-box"[\s\S]*?<\/div>/i, comingSoonHtml.trim());
      } else if (html.includes('id="apply"')) {
        html = html.replace(/(<[^>]*id="apply"[^>]*>)/i, `$1\n${comingSoonHtml}`);
      }
    }

    setEditHtml(html);
    setSaveMsg("⚡ HTML Content updated with latest links!");
    setTimeout(() => setSaveMsg(null), 3000);
  };

  // Save edits to Supabase Draft table
  const handleSaveDraft = async () => {
    setSavingDraft(true);
    setSaveMsg(null);

    const { error } = await supabase.from("auto_blog_drafts").update({
      generated_title: editTitle,
      generated_slug: editSlug,
      generated_meta: editMeta,
      generated_html: editHtml,
      category: editCategory,
      apply_link: editApplyLink,
      official_link: editOfficialLink,
      apply_status: editApplyStatus,
      last_date: editLastDate,
      total_posts: editTotalPosts,
      app_fee_gen: editAppFeeGen,
    }).eq("id", id);

    setSavingDraft(false);
    if (!error) {
      setSaveMsg("✅ Draft saved successfully!");
      setTimeout(() => setSaveMsg(null), 3000);
    } else {
      setSaveMsg(`❌ Save failed: ${error.message}`);
    }
  };

  // Publish Draft Live
  const handlePublish = async () => {
    if (!editTitle || !editSlug) {
      setPublishResult({ ok: false, msg: "Title aur slug dono zaroori hain" });
      return;
    }
    setPublishing(true);
    setPublishResult(null);

    // 1. Save all draft updates first
    await supabase.from("auto_blog_drafts").update({
      generated_title: editTitle,
      generated_slug: editSlug,
      generated_meta: editMeta,
      generated_html: editHtml,
      category: editCategory,
      apply_link: editApplyLink,
      official_link: editOfficialLink,
      apply_status: editApplyStatus,
      last_date: editLastDate,
      total_posts: editTotalPosts,
      app_fee_gen: editAppFeeGen,
    }).eq("id", id);

    // 2. Call publish API endpoint with all override values
    const res = await fetch(`/api/auto-blog/publish/${id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: editTitle,
        slug: editSlug,
        metaDesc: editMeta,
        html: editHtml,
        category: editCategory,
        applyLink: editApplyLink,
        officialLink: editOfficialLink,
        lastDate: editLastDate,
        totalPosts: editTotalPosts,
        appFeeGen: editAppFeeGen,
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

  const catCfg = CATEGORY_COLORS[editCategory] || { badge: "bg-gray-100 text-gray-600 border-gray-200", label: editCategory };
  const alreadyPublished = draft.status === "published";

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100">
      {/* Sticky Header Bar */}
      <div className="sticky top-0 z-30 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-4 sm:px-6 py-3">
        <div className="flex items-center justify-between gap-4 max-w-7xl mx-auto">
          {/* Left Title */}
          <div className="flex items-center gap-3 min-w-0">
            <Link
              href="/admin/auto-drafts"
              className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 transition flex-shrink-0"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="min-w-0">
              <p className="text-xs text-gray-400 font-medium">Auto Draft Review & Edit</p>
              <p className="text-sm font-bold truncate max-w-md">
                {editTitle || draft.source_title}
              </p>
            </div>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Preview / Edit HTML toggle */}
            <div className="flex rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden text-xs sm:text-sm">
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
                <Edit2 className="w-3.5 h-3.5" /> Edit HTML
              </button>
            </div>

            {/* Save Draft Button */}
            <button
              onClick={handleSaveDraft}
              disabled={savingDraft}
              className="flex items-center gap-1.5 border border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium hover:bg-indigo-50 dark:hover:bg-indigo-950/50 transition"
            >
              {savingDraft ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              Save Draft
            </button>

            {!alreadyPublished && (
              <>
                <button
                  onClick={handleReject}
                  disabled={rejecting}
                  className="flex items-center gap-1.5 border border-red-200 text-red-500 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium hover:bg-red-50 transition"
                >
                  <XCircle className="w-4 h-4" /> Reject
                </button>

                <button
                  onClick={handlePublish}
                  disabled={publishing}
                  className="flex items-center gap-1.5 bg-gradient-to-r from-green-500 to-emerald-600 text-white px-4 py-1.5 rounded-lg text-xs sm:text-sm font-bold hover:opacity-90 transition shadow disabled:opacity-60"
                >
                  {publishing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  Publish Live
                </button>
              </>
            )}

            {alreadyPublished && (
              <span className="flex items-center gap-1.5 bg-green-100 text-green-700 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold border border-green-200">
                <CheckCircle2 className="w-4 h-4" /> Published
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Save / Notification Message */}
      {saveMsg && (
        <div className="mx-4 sm:mx-6 mt-4 px-4 py-2.5 rounded-xl text-sm font-medium border bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800 max-w-7xl mx-auto flex items-center justify-between">
          <span>{saveMsg}</span>
        </div>
      )}

      {/* Publish result banner */}
      {publishResult && (
        <div
          className={`mx-4 sm:mx-6 mt-4 px-4 py-3 rounded-xl text-sm font-medium border max-w-7xl mx-auto ${
            publishResult.ok
              ? "bg-green-50 text-green-700 border-green-200 dark:bg-green-950/40 dark:text-green-300"
              : "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-300"
          }`}
        >
          {publishResult.msg}
          {publishResult.ok && (
            <Link
              href={`/job/${editSlug}`}
              target="_blank"
              className="ml-3 underline font-bold"
            >
              Live page dekho ↗
            </Link>
          )}
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Form Column — EDIT METADATA & LINKS */}
        <div className="space-y-4">
          
          {/* Source Link Reference */}
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4">
            <div className="flex items-center justify-between">
              <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${catCfg.badge}`}>
                {catCfg.label}
              </span>
              <a
                href={draft.source_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs text-indigo-500 hover:text-indigo-700 font-medium"
              >
                <ExternalLink className="w-3 h-3" /> Source Page ↗
              </a>
            </div>
          </div>

          {/* EDITABLE LINKS & STATUS SECTION */}
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4 space-y-3.5 shadow-sm">
            <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 flex items-center gap-2">
              <Link2 className="w-4 h-4" /> Edit URLs & Apply Status
            </h3>

            {/* Apply Status */}
            <div>
              <label className="text-xs font-semibold text-gray-600 dark:text-gray-300 block mb-1">Apply Online Status</label>
              <select
                value={editApplyStatus}
                onChange={(e) => setEditApplyStatus(e.target.value)}
                className="w-full text-xs sm:text-sm border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 bg-gray-50 dark:bg-gray-800 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-400"
              >
                <option value="open">🟢 Apply Online Live (Link Active)</option>
                <option value="coming_soon">🟡 Coming Soon (Link Not Active)</option>
                <option value="closed">🔴 Application Closed</option>
                <option value="unknown">⚪ Unknown / Info Only</option>
              </select>
            </div>

            {/* Apply Online Link */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-gray-600 dark:text-gray-300">Apply Online URL</label>
                {editApplyLink && (
                  <a href={editApplyLink} target="_blank" rel="noopener noreferrer" className="text-[11px] text-indigo-500 hover:underline">
                    Test ↗
                  </a>
                )}
              </div>
              <input
                type="url"
                value={editApplyLink}
                onChange={(e) => setEditApplyLink(e.target.value)}
                placeholder="https://apply-link.com or leave empty if coming soon"
                className="w-full text-xs border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 bg-gray-50 dark:bg-gray-800 font-mono focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
            </div>

            {/* Official Website URL */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-gray-600 dark:text-gray-300">Official Website URL</label>
                {editOfficialLink && (
                  <a href={editOfficialLink} target="_blank" rel="noopener noreferrer" className="text-[11px] text-indigo-500 hover:underline">
                    Test ↗
                  </a>
                )}
              </div>
              <input
                type="url"
                value={editOfficialLink}
                onChange={(e) => setEditOfficialLink(e.target.value)}
                placeholder="https://www.official-website.gov.in"
                className="w-full text-xs border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 bg-gray-50 dark:bg-gray-800 font-mono focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
            </div>

            {/* Sync Button */}
            <button
              onClick={handleSyncLinksToHtml}
              className="w-full flex items-center justify-center gap-2 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 py-2 rounded-lg font-bold text-xs hover:bg-indigo-100 transition"
            >
              <Sparkles className="w-3.5 h-3.5" /> ⚡ Sync Links into Blog HTML
            </button>
          </div>

          {/* EDITABLE JOB METADATA */}
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4 space-y-3.5 shadow-sm">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 flex items-center gap-2">
              <Edit2 className="w-3.5 h-3.5" /> Edit Details & Category
            </h3>

            {/* Title */}
            <div>
              <label className="text-xs font-semibold text-gray-600 dark:text-gray-300 block mb-1">SEO Title</label>
              <textarea
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="w-full text-xs sm:text-sm border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 bg-gray-50 dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none font-medium"
                rows={2}
              />
              <p className="text-[10px] text-gray-400 mt-1">{editTitle.length}/60 chars</p>
            </div>

            {/* Category Select */}
            <div>
              <label className="text-xs font-semibold text-gray-600 dark:text-gray-300 block mb-1">Category</label>
              <select
                value={editCategory}
                onChange={(e) => setEditCategory(e.target.value)}
                className="w-full text-xs sm:text-sm border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 bg-gray-50 dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-400 font-medium"
              >
                <option value="latest-jobs">💼 Latest Jobs</option>
                <option value="results">🏆 Results</option>
                <option value="admit-card">🪪 Admit Card</option>
                <option value="answer-key">📋 Answer Key</option>
                <option value="admission">🎓 Admission</option>
                <option value="news">📰 News</option>
              </select>
            </div>

            {/* Total Posts */}
            <div>
              <label className="text-xs font-semibold text-gray-600 dark:text-gray-300 block mb-1">Total Vacancies / Posts</label>
              <input
                type="text"
                value={editTotalPosts}
                onChange={(e) => setEditTotalPosts(e.target.value)}
                placeholder="e.g. 821 Posts"
                className="w-full text-xs border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 bg-gray-50 dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
            </div>

            {/* Last Date */}
            <div>
              <label className="text-xs font-semibold text-gray-600 dark:text-gray-300 block mb-1">Last Date to Apply</label>
              <input
                type="text"
                value={editLastDate}
                onChange={(e) => setEditLastDate(e.target.value)}
                placeholder="e.g. 15 September 2026"
                className="w-full text-xs border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 bg-gray-50 dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
            </div>

            {/* Application Fee */}
            <div>
              <label className="text-xs font-semibold text-gray-600 dark:text-gray-300 block mb-1">Application Fee</label>
              <input
                type="text"
                value={editAppFeeGen}
                onChange={(e) => setEditAppFeeGen(e.target.value)}
                placeholder="e.g. ₹150 (Gen/OBC) | Free (SC/ST)"
                className="w-full text-xs border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 bg-gray-50 dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
            </div>

            {/* Slug */}
            <div>
              <label className="text-xs font-semibold text-gray-600 dark:text-gray-300 block mb-1">Slug (URL)</label>
              <input
                value={editSlug}
                onChange={(e) => setEditSlug(e.target.value)}
                className="w-full text-xs border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 bg-gray-50 dark:bg-gray-800 font-mono focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
            </div>

            {/* Meta Description */}
            <div>
              <label className="text-xs font-semibold text-gray-600 dark:text-gray-300 block mb-1">Meta Description</label>
              <textarea
                value={editMeta}
                onChange={(e) => setEditMeta(e.target.value)}
                className="w-full text-xs sm:text-sm border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 bg-gray-50 dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none"
                rows={3}
              />
              <p className="text-[10px] text-gray-400 mt-1">{editMeta.length}/160 chars</p>
            </div>

            {/* Save & Publish Buttons */}
            <div className="pt-2 space-y-2">
              <button
                onClick={handleSaveDraft}
                disabled={savingDraft}
                className="w-full flex items-center justify-center gap-2 border border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-300 py-2 rounded-xl font-bold text-xs hover:bg-indigo-50 dark:hover:bg-indigo-950 transition"
              >
                {savingDraft ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                Save Draft Changes
              </button>

              {!alreadyPublished && (
                <button
                  onClick={handlePublish}
                  disabled={publishing}
                  className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white py-2.5 rounded-xl font-bold text-xs sm:text-sm hover:opacity-90 transition shadow disabled:opacity-60"
                >
                  {publishing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  Publish Live Now
                </button>
              )}
            </div>
          </div>

          {/* Timestamp */}
          <div className="text-xs text-gray-400 flex items-center gap-2 px-1">
            <Clock className="w-3.5 h-3.5" />
            Scraped: {new Date(draft.scraped_at).toLocaleString("en-IN")}
          </div>
        </div>

        {/* Right Preview / Edit HTML Column */}
        <div className="lg:col-span-2">
          {mode === "preview" ? (
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden shadow-sm">
              <div className="px-5 py-3 border-b border-gray-100 dark:border-gray-800 flex items-center gap-2 text-xs sm:text-sm font-semibold text-gray-600 dark:text-gray-300">
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
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden shadow-sm">
              <div className="px-5 py-3 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between text-xs sm:text-sm font-semibold text-gray-600 dark:text-gray-300">
                <div className="flex items-center gap-2">
                  <Edit2 className="w-4 h-4 text-purple-500" />
                  Edit HTML Code Directly
                </div>
                <button
                  onClick={handleSyncLinksToHtml}
                  className="text-xs text-indigo-500 hover:underline flex items-center gap-1 font-normal"
                >
                  <Sparkles className="w-3 h-3" /> Insert/Sync Link Buttons
                </button>
              </div>
              <textarea
                value={editHtml}
                onChange={(e) => setEditHtml(e.target.value)}
                className="w-full p-4 bg-gray-950 text-green-300 font-mono text-xs focus:outline-none resize-none"
                style={{ height: "calc(100vh - 220px)", minHeight: "450px" }}
                spellCheck={false}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
