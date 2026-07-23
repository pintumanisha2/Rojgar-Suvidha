"use client";
// v4 — Real Content Writer Studio: Smart inputs, stage tracker, quick templates, publish modal, category-aware SEO scorecard
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Sparkles, Send, Loader2, ArrowLeft,
  FileText, Copy, Check, Wand2, Eye, X,
  Briefcase, Trophy, CreditCard, Newspaper, GraduationCap, ClipboardList,
  CheckCircle2, Circle, Zap, BookOpen, Globe, ChevronDown, ChevronUp, UploadCloud
} from "lucide-react";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// ── Category Definitions ──────────────────────────────────────────────────────
const CATEGORIES = [
  { value: "latest-jobs", label: "Latest Jobs",  icon: Briefcase,     color: "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-900/20 dark:text-indigo-300", activeColor: "bg-indigo-600 text-white border-indigo-600" },
  { value: "results",     label: "Results",       icon: Trophy,        color: "bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-300",       activeColor: "bg-green-600 text-white border-green-600" },
  { value: "admit-card",  label: "Admit Cards",   icon: CreditCard,    color: "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-900/20 dark:text-orange-300",  activeColor: "bg-orange-500 text-white border-orange-500" },
  { value: "news",        label: "News",          icon: Newspaper,     color: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300",            activeColor: "bg-blue-600 text-white border-blue-600" },
  { value: "admission",   label: "Admission",     icon: GraduationCap, color: "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/20 dark:text-purple-300",  activeColor: "bg-purple-600 text-white border-purple-600" },
  { value: "answer-key",  label: "Answer Key",    icon: ClipboardList, color: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-900/20 dark:text-rose-300",            activeColor: "bg-rose-600 text-white border-rose-600" },
];

const DRAFT_KEY = "ai_writer_draft_v4";

// ── U2: Writing Stage Tracker ─────────────────────────────────────────────────
const WRITING_STAGES = [
  { label: "Extracting key information...",         icon: "🔍" },
  { label: "Building article structure...",         icon: "🏗️" },
  { label: "Writing content sections...",           icon: "✍️" },
  { label: "Enhancing SEO & highlights...",         icon: "⚡" },
  { label: "Finalizing and formatting...",          icon: "✅" },
];

// ── U3: Smart Quick-Fill Templates ─────────────────────────────────────────────
const QUICK_TEMPLATES: Record<string, { label: string; text: string }[]> = {
  "latest-jobs": [
    { label: "SSC Exam", text: "This is an SSC exam post. Focus on selection stages (Tier 1/2/3/4), negative marking in each tier, sectional cutoffs, and skill tests if applicable. Mention the multi-stage process clearly. The prep section must include subject-wise strategy for General Intelligence, English, Quantitative Aptitude, and General Awareness." },
    { label: "Railway/RRB", text: "This is a Railway/RRB exam. Mention CBT stages (Stage 1 and Stage 2), document verification, and medical test. The competition is very high despite large vacancies. Mention that trade/technical eligibility is strictly verified. Prep strategy should focus on Mathematics, General Intelligence, and General Awareness." },
    { label: "Banking (IBPS/SBI)", text: "This is a Banking exam (IBPS/SBI). Cover Prelims and Mains separately with different section strategies. Mention the interview stage for PO. Focus on English language and Quantitative Aptitude which are typically the elimination rounds. Mention IBPS calendar for other upcoming exams." },
    { label: "State PSC / Civil Services", text: "This is a State Civil Services / PSC exam. Focus on the multi-stage structure (Prelims/Mains/Interview). The competition is lower than UPSC Civil Services but still demanding. Mention domicile requirements and category-wise reservation clearly. Prep strategy must mention state-specific GK and optional subject selection." },
    { label: "Defence / Police", text: "This is a Defence or Police recruitment. Physical standards are CRITICAL — mention height, weight, running limits upfront. The physical test is an elimination round with no second chance. Written exam strategy should come after. Mention medical fitness categories." },
  ],
  "results": [
    { label: "Selection Result", text: "This is a SELECTION RESULT — candidates learned if they made it to the next stage. Open with warmth and emotional awareness. For those who cleared: guide them on document verification and joining. For those who didn't: offer genuinely helpful re-attempt advice without fake motivation." },
    { label: "Scorecard Result", text: "This is a SCORECARD result — candidates can see their marks. Help them understand what each number means. Explain how to calculate their percentage, what the qualifying marks were, and what the next step is." },
    { label: "Merit List", text: "This is a MERIT LIST result. Explain clearly how to check if your name is on the list, what it means to be in the waiting list vs main list, and what happens next for selected candidates." },
  ],
  "admit-cards": [
    { label: "Central Exam", text: "This is an admit card for a CENTRAL government exam. Reporting time is typically 30 minutes before. Mention which photo IDs are accepted. Focus on what NOT to carry (mobiles, smart watches). Be urgent — many candidates wait and find the server down on the last day." },
    { label: "State Exam", text: "This is an admit card for a STATE government exam. Mention that state-specific rules may apply for ID proof. Domicile proof may be required at the center. Reporting time may vary by center. Be very practical about the download process." },
    { label: "University Exam", text: "This is a university/board admit card. Mention that hall ticket must be preserved until results are declared. Photo must match the one submitted during registration. Mention exam center address clearly and how to locate it." },
  ],
  "news": [
    { label: "High Impact News", text: "This is HIGH IMPACT news affecting lakhs of candidates. Open with the most important fact in the very first sentence. Every paragraph must add new information — no repetition. End with clear action candidates must take." },
    { label: "Policy Change", text: "This is a POLICY CHANGE news. Explain what changed, what was the old rule, and what the new rule is. Be clear about the effective date. Guide candidates on how this change affects their applications or preparation." },
    { label: "Exam Date Update", text: "This is an EXAM DATE news (postponement or new announcement). Candidates are anxious — be direct about the new date immediately. Explain the reason if given. Guide them to update their leave/travel plans." },
  ],
  "admission": [
    { label: "Professional Course", text: "This is admission for a PROFESSIONAL course (Engineering/Medical/MBA). Students making a big career decision read this. Explain career prospects honestly, not just admission process. Include placement data if available. The 'Is this course right for me?' section is very important." },
    { label: "Government College", text: "This is admission to a GOVERNMENT INSTITUTION. Emphasize the fee advantage vs private colleges. Mention hostel facilities, scholarship opportunities, and placement record. Many students don't know these benefits — educate them." },
  ],
  "answer-key": [
    { label: "Objection Window Open", text: "The OBJECTION WINDOW IS OPEN. Create urgency — most candidates don't realize they can challenge wrong answers. Explain the objection process step by step. Be honest about which types of objections succeed (clear textbook evidence) vs. which rarely do (ambiguous wording)." },
    { label: "Score Calculator", text: "Focus heavily on helping candidates CALCULATE THEIR EXPECTED SCORE. Explain the exact marking scheme with a worked example. Add a table with different scenario scores. This is what candidates are searching for most right now." },
  ],
};

// ── U5: Category-Aware SEO Score Calculator ──────────────────────────────────
function getSeoScore(result: any, category: string) {
  if (!result) return null;
  const html = result.blogHtml || "";
  const plainText = html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ");
  const wordCount = plainText.split(" ").filter(Boolean).length;
  const primaryKeyword = (result.primaryKeyword || result.title || "").toLowerCase();

  const baseChecks = [
    { label: "Word Count",       ok: wordCount >= 1200,                   detail: `${wordCount.toLocaleString()} words` },
    { label: "Title Length",     ok: result.title?.length >= 40 && result.title?.length <= 70, detail: `${result.title?.length || 0} chars` },
    { label: "Meta Description", ok: result.metaDesc?.length >= 120 && result.metaDesc?.length <= 165, detail: `${result.metaDesc?.length || 0} chars` },
    { label: "FAQ Section",      ok: html.includes("<details"),           detail: html.includes("<details") ? "Found" : "Missing" },
    { label: "Data Tables",      ok: html.includes("<table"),             detail: html.includes("<table") ? "Found" : "Missing" },
    { label: "FAQPage Schema",   ok: html.includes("application/ld+json"), detail: html.includes("application/ld+json") ? "Injected" : "Missing" },
    { label: "Keyword Present",  ok: primaryKeyword ? plainText.toLowerCase().includes(primaryKeyword) : false, detail: primaryKeyword && plainText.toLowerCase().includes(primaryKeyword) ? "Yes" : "Not found" },
    { label: "Internal Links",   ok: html.includes("href='/"),            detail: html.includes("href='/") ? "Yes" : "None" },
    { label: "Highlight Marks",  ok: html.includes("<mark"),              detail: html.includes("<mark") ? "Applied" : "Missing" },
    { label: "Strong Tags",      ok: (html.match(/<strong/g) || []).length >= 5, detail: `${(html.match(/<strong/g) || []).length} found` },
  ];

  const categoryChecks: Record<string, { label: string; ok: boolean; detail: string }[]> = {
    "latest-jobs": [
      { label: "Prep Strategy",  ok: html.includes("id='prep'"),   detail: html.includes("id='prep'") ? "Included" : "Missing" },
      { label: "Cutoff Section", ok: html.includes("id='cutoff'"), detail: html.includes("id='cutoff'") ? "Included" : "Missing" },
      { label: "Salary Section", ok: html.includes("id='salary'"), detail: html.includes("id='salary'") ? "Included" : "Missing" },
    ],
    "results": [
      { label: "How to Check",   ok: html.includes("id='check'"),  detail: html.includes("id='check'") ? "Included" : "Missing" },
      { label: "What's Next",    ok: html.includes("id='next'"),   detail: html.includes("id='next'") ? "Included" : "Missing" },
      { label: "Failed Section", ok: html.includes("id='failed'"), detail: html.includes("id='failed'") ? "Included" : "Missing" },
    ],
    "admit-cards": [
      { label: "Download Steps", ok: html.includes("id='download'"), detail: html.includes("id='download'") ? "Included" : "Missing" },
      { label: "What to Carry",  ok: html.includes("id='carry'"),   detail: html.includes("id='carry'") ? "Included" : "Missing" },
      { label: "Exam Day Tips",  ok: html.includes("id='tips'"),    detail: html.includes("id='tips'") ? "Included" : "Missing" },
    ],
    "news": [
      { label: "Summary Lead",   ok: html.includes("id='summary'"), detail: html.includes("id='summary'") ? "Included" : "Missing" },
      { label: "Impact Section", ok: html.includes("id='impact'"),  detail: html.includes("id='impact'") ? "Included" : "Missing" },
      { label: "What's Next",    ok: html.includes("id='next'"),    detail: html.includes("id='next'") ? "Included" : "Missing" },
    ],
    "answer-key": [
      { label: "Score Calc",     ok: html.includes("id='calculate'"), detail: html.includes("id='calculate'") ? "Included" : "Missing" },
      { label: "Objection Guide",ok: html.includes("id='objection'"), detail: html.includes("id='objection'") ? "Included" : "Missing" },
      { label: "Cutoff Estimate",ok: html.includes("id='cutoff'"),    detail: html.includes("id='cutoff'") ? "Included" : "Missing" },
    ],
    "admission": [
      { label: "About Course",   ok: html.includes("id='about'"),    detail: html.includes("id='about'") ? "Included" : "Missing" },
      { label: "Eligibility",    ok: html.includes("id='eligibility'"), detail: html.includes("id='eligibility'") ? "Included" : "Missing" },
      { label: "How to Apply",   ok: html.includes("id='apply'"),    detail: html.includes("id='apply'") ? "Included" : "Missing" },
    ],
  };

  const allChecks = [...baseChecks, ...(categoryChecks[category] || [])];
  return { checks: allChecks, wordCount, score: allChecks.filter(c => c.ok).length, total: allChecks.length };
}

// ── Slug Generator ──────────────────────────────────────────────────────────
function generateSlug(title: string): string {
  return title.toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim()
    .slice(0, 80);
}

export default function AIWriterPage() {
  const router = useRouter();

  // Core state
  const [rawText, setRawText] = useState("");
  const [category, setCategory] = useState("latest-jobs");
  const [customInstructions, setCustomInstructions] = useState("");
  const [officialLink, setOfficialLink] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [hasDraft, setHasDraft] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);

  // U1: Category meta fields
  const [categoryMeta, setCategoryMeta] = useState<Record<string, string>>({});

  // U2: Writing stage tracker
  const [writingStage, setWritingStage] = useState(0);
  const stageTimerRef = useRef<NodeJS.Timeout | null>(null);

  // U4: Publish modal
  const [showPublish, setShowPublish] = useState(false);
  const [publishLoading, setPublishLoading] = useState(false);
  const [publishStatus, setPublishStatus] = useState<"idle" | "success" | "error">("idle");
  const [publishSlug, setPublishSlug] = useState("");
  const [publishPostStatus, setPublishPostStatus] = useState("active");

  // Load draft + Scout data
  useEffect(() => {
    if (window.location.search.includes("source=scout")) {
      const scoutData = localStorage.getItem("scout_to_ai");
      if (scoutData) { setRawText(scoutData); localStorage.removeItem("scout_to_ai"); }
    }
    const saved = localStorage.getItem(DRAFT_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const ageHours = (Date.now() - (parsed.timestamp || 0)) / (1000 * 60 * 60);
        if (ageHours < 24 && parsed.result) setHasDraft(true);
      } catch {}
    }
  }, []);

  useEffect(() => {
    if (result) {
      localStorage.setItem(DRAFT_KEY, JSON.stringify({ result, category, rawText, timestamp: Date.now() }));
      if (result.title) setPublishSlug(generateSlug(result.title));
    }
  }, [result]);

  const restoreDraft = () => {
    const saved = localStorage.getItem(DRAFT_KEY);
    if (!saved) return;
    try {
      const { result: r, category: c, rawText: t } = JSON.parse(saved);
      setResult(r); setCategory(c || "latest-jobs"); setRawText(t || ""); setHasDraft(false);
    } catch {}
  };

  // U2: Stage timer during loading
  useEffect(() => {
    if (loading) {
      setWritingStage(0);
      let stage = 0;
      stageTimerRef.current = setInterval(() => {
        stage = Math.min(stage + 1, WRITING_STAGES.length - 1);
        setWritingStage(stage);
      }, 16000);
    } else {
      if (stageTimerRef.current) clearInterval(stageTimerRef.current);
    }
    return () => { if (stageTimerRef.current) clearInterval(stageTimerRef.current); };
  }, [loading]);

  // Build customInstructions from categoryMeta fields (U1)
  function buildEnrichedInstructions(): string {
    const metaLines = Object.entries(categoryMeta)
      .filter(([, v]) => v.trim())
      .map(([k, v]) => `${k}: ${v}`)
      .join("\n");
    const combined = [metaLines, customInstructions].filter(Boolean).join("\n\n");
    return combined;
  }

  const handleScan = async () => {
    if (!rawText || rawText.length < 50) {
      alert("Please paste the notification/content text first (min 50 chars).");
      return;
    }
    setLoading(true);
    setResult(null);
    setPublishStatus("idle");
    try {
      const response = await fetch("/api/admin/scan-notification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rawText, category, customInstructions: buildEnrichedInstructions(), officialLink }),
      });
      const data = await response.json();
      if (data.error) throw new Error(data.error);
      setResult(data);
    } catch (err: any) {
      alert(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  // U4: Direct publish to Supabase
  const handlePublish = async () => {
    if (!result || !publishSlug) return;
    setPublishLoading(true);
    setPublishStatus("idle");
    try {
      const { error } = await supabase.from("jobs").insert([{
        title: result.title,
        slug: publishSlug,
        content: result.blogHtml,
        short_description: result.shortInfo || result.metaDesc,
        meta_description: result.metaDesc,
        category: result.category,
        status: publishPostStatus,
        last_date: result.lastDate || null,
        total_posts: result.totalPosts || null,
        application_fee: result.appFeeGen || null,
        official_link: result.officialLink || null,
        created_at: new Date().toISOString(),
      }]);
      if (error) throw error;
      setPublishStatus("success");
      localStorage.removeItem(DRAFT_KEY);

      // F3-B: Auto-trigger category-based push notification
      if (publishPostStatus === "active") {
        fetch("/api/push", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "category-broadcast",
            payload: {
              title: `नई अपडेट: ${result.title}`,
              body: result.shortInfo || result.metaDesc || "Latest notifications on Rojgar Suvidha.",
              url: `/job/${publishSlug}`,
              icon: "/logo-blue.png",
              category: result.category || category
            }
          })
        }).catch(e => console.error("Auto push trigger failed:", e));
      }
    } catch (err: any) {
      console.error("Publish error:", err);
      setPublishStatus("error");
    } finally {
      setPublishLoading(false);
    }
  };

  const selectedCat = CATEGORIES.find(c => c.value === category)!;
  const seo = getSeoScore(result, category);

  // U1: Category-specific meta input fields
  const categoryMetaFields: Record<string, { key: string; label: string; type: string; placeholder: string }[]> = {
    "latest-jobs": [
      { key: "total_posts_hint", label: "Total Posts (hint)", type: "text", placeholder: "e.g. 1248 posts" },
      { key: "last_date_hint",   label: "Last Date (hint)",   type: "text", placeholder: "e.g. 30 July 2025" },
      { key: "app_fee_hint",     label: "Application Fee",    type: "text", placeholder: "e.g. ₹100 General, Free SC/ST" },
    ],
    "results": [
      { key: "result_type",   label: "Result Type",            type: "select", placeholder: "selection|scorecard|merit-list" },
      { key: "next_step",     label: "Next Step After Result",  type: "text",   placeholder: "e.g. Document Verification, Medical" },
      { key: "cutoff_hint",   label: "Cutoff (if known)",      type: "text",   placeholder: "e.g. Gen: 145, OBC: 138" },
    ],
    "admit-cards": [
      { key: "exam_date",      label: "Exam Date",        type: "text", placeholder: "e.g. 20 August 2025" },
      { key: "reporting_time", label: "Reporting Time",   type: "text", placeholder: "e.g. 30 minutes before" },
    ],
    "answer-key": [
      { key: "marking_scheme",   label: "Marking Scheme",   type: "text", placeholder: "e.g. +2 correct, -0.5 wrong" },
      { key: "objection_fee",    label: "Objection Fee",    type: "text", placeholder: "e.g. ₹100 per question" },
      { key: "objection_deadline", label: "Objection Deadline", type: "text", placeholder: "e.g. 25 July 2025" },
    ],
    "news": [
      { key: "impact_level",      label: "Impact Level",           type: "select", placeholder: "high|medium|low" },
      { key: "action_required",   label: "Action Required",        type: "text",   placeholder: "What candidates must do..." },
    ],
    "admission": [
      { key: "total_seats",  label: "Total Seats",       type: "text", placeholder: "e.g. 500 seats" },
      { key: "course_name",  label: "Course Name",       type: "text", placeholder: "e.g. B.Tech, MBA, MBBS" },
    ],
  };

  const currentFields = categoryMetaFields[category] || [];
  const quickTemplates = QUICK_TEMPLATES[category] || [];

  return (
    <div className="max-w-6xl mx-auto pb-20">

      {/* ── Full-Screen Blog Preview Modal ── */}
      {showPreview && result && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-start justify-center p-4 overflow-y-auto"
          onClick={(e) => e.target === e.currentTarget && setShowPreview(false)}
        >
          <div className="bg-white dark:bg-gray-900 rounded-3xl w-full max-w-4xl my-8 shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-800 sticky top-0 bg-white dark:bg-gray-900 z-10">
              <div>
                <p className="text-xs font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">Full Blog Preview</p>
                <p className="text-sm font-bold text-gray-900 dark:text-white mt-0.5 line-clamp-1">{result.title}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-gray-400">{seo ? `${seo.wordCount.toLocaleString()} words` : ""}</span>
                <button onClick={() => setShowPreview(false)} className="p-2 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 text-gray-500 transition-colors">
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
            <div className="p-8 blog-content max-w-none" style={{ maxHeight: "78vh", overflowY: "auto" }} dangerouslySetInnerHTML={{ __html: result.blogHtml }} />
          </div>
        </div>
      )}

      {/* ── U4: Publish Modal ── */}
      {showPublish && result && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-3xl w-full max-w-md shadow-2xl border border-gray-200 dark:border-gray-800 p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <p className="text-xs font-black text-indigo-600 uppercase tracking-widest">Publish to Site</p>
                <p className="text-sm font-bold text-gray-900 dark:text-white mt-1">One-click publish this blog post</p>
              </div>
              <button onClick={() => setShowPublish(false)} className="p-2 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-500">
                <X className="h-4 w-4" />
              </button>
            </div>

            {publishStatus === "success" ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4 text-3xl">✅</div>
                <h3 className="text-lg font-black text-gray-900 dark:text-white mb-2">Published Successfully!</h3>
                <p className="text-sm text-gray-500 mb-5">Your post is now live on the site.</p>
                <div className="flex gap-3">
                  <a href={`/${category}/${publishSlug}`} target="_blank" rel="noopener noreferrer" className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl text-sm text-center transition-colors">
                    View Live Post →
                  </a>
                  <button onClick={() => { setShowPublish(false); setPublishStatus("idle"); }} className="flex-1 py-3 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-bold rounded-2xl text-sm transition-colors">
                    Close
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-black text-gray-500 uppercase tracking-wider block mb-1.5">Post Title</label>
                  <p className="text-sm font-bold text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-800 p-3 rounded-xl leading-snug">{result.title}</p>
                </div>
                <div>
                  <label className="text-xs font-black text-gray-500 uppercase tracking-wider block mb-1.5">URL Slug</label>
                  <input
                    type="text"
                    value={publishSlug}
                    onChange={(e) => setPublishSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"))}
                    className="w-full p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-800 dark:text-gray-200 font-mono focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                  <p className="text-[10px] text-gray-400 mt-1">/{category}/{publishSlug}</p>
                </div>
                <div>
                  <label className="text-xs font-black text-gray-500 uppercase tracking-wider block mb-1.5">Publish Status</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { value: "active", label: "Active", color: "bg-green-100 text-green-700 border-green-300" },
                      { value: "draft",  label: "Draft",  color: "bg-yellow-100 text-yellow-700 border-yellow-300" },
                      { value: "soon",   label: "Coming Soon", color: "bg-blue-100 text-blue-700 border-blue-300" },
                    ].map(s => (
                      <button
                        key={s.value}
                        onClick={() => setPublishPostStatus(s.value)}
                        className={`py-2 rounded-xl border text-xs font-black transition-all ${publishPostStatus === s.value ? s.color : "bg-gray-50 dark:bg-gray-800 text-gray-500 border-gray-200 dark:border-gray-700"}`}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>
                {publishStatus === "error" && (
                  <p className="text-xs text-red-600 bg-red-50 p-3 rounded-xl">Publish failed. Check Supabase `jobs` table schema and try again.</p>
                )}
                <button
                  onClick={handlePublish}
                  disabled={publishLoading || !publishSlug}
                  className="w-full py-4 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 disabled:opacity-50 text-white font-black rounded-2xl text-sm transition-all shadow-lg shadow-indigo-500/20 active:scale-95 flex items-center justify-center gap-2"
                >
                  {publishLoading ? <><Loader2 className="h-4 w-4 animate-spin" />Publishing...</> : <><UploadCloud className="h-4 w-4" />Publish Now</>}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-8 pb-6 border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center gap-4">
          <Link href="/admin" className="p-2.5 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 text-gray-600 transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
              <Sparkles className="h-6 w-6 text-indigo-500 fill-indigo-500/20" />
              AI Content Writer Studio
            </h2>
            <p className="text-sm text-gray-500 font-medium">Paste any notification — AI thinks, writes, and formats the perfect blog</p>
          </div>
        </div>
        <div className="hidden sm:flex items-center gap-2">
          <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 dark:bg-indigo-900/30 dark:text-indigo-400 px-3 py-1.5 rounded-full tracking-wider uppercase">v4 Writer Brain</span>
        </div>
      </div>

      {/* Draft Restore Banner */}
      {hasDraft && (
        <div className="mb-6 flex items-center justify-between bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 rounded-2xl p-4">
          <div className="flex items-center gap-3">
            <BookOpen className="h-5 w-5 text-amber-600" />
            <div>
              <p className="text-sm font-black text-amber-800 dark:text-amber-400">Unsaved draft found</p>
              <p className="text-xs text-amber-600 dark:text-amber-500">A previously generated blog is saved locally. Restore it?</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={restoreDraft} className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-black rounded-lg transition-colors">Restore</button>
            <button onClick={() => { localStorage.removeItem(DRAFT_KEY); setHasDraft(false); }} className="px-3 py-1.5 bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs font-bold rounded-lg transition-colors">Discard</button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

        {/* ── LEFT: Input Panel ── */}
        <div className="space-y-5">

          {/* Step 1: Category */}
          <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-800 p-5 shadow-sm">
            <h3 className="font-bold text-gray-900 dark:text-white text-sm mb-3 flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px] font-black">1</span>
              Select Content Category
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {CATEGORIES.map((cat) => {
                const Icon = cat.icon;
                const isActive = category === cat.value;
                return (
                  <button
                    key={cat.value}
                    onClick={() => { setCategory(cat.value); setCategoryMeta({}); setShowTemplates(false); }}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-xs font-bold transition-all ${isActive ? cat.activeColor : cat.color + " hover:opacity-80"}`}
                  >
                    <Icon className="h-3.5 w-3.5 shrink-0" />
                    {cat.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* U1: Step 2 — Category-Smart Extra Fields */}
          {currentFields.length > 0 && (
            <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-800 p-5 shadow-sm">
              <h3 className="font-bold text-gray-900 dark:text-white text-sm mb-3 flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-violet-600 text-white flex items-center justify-center text-[10px] font-black">2</span>
                Quick Context Fields
                <span className="text-[10px] font-normal text-gray-400 ml-1">(Helps AI write more precisely)</span>
              </h3>
              <div className="space-y-3">
                {currentFields.map((field) => (
                  <div key={field.key}>
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider block mb-1">{field.label}</label>
                    {field.type === "select" ? (
                      <select
                        value={categoryMeta[field.key] || ""}
                        onChange={e => setCategoryMeta(prev => ({ ...prev, [field.key]: e.target.value }))}
                        className="w-full p-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                      >
                        <option value="">Select...</option>
                        {field.placeholder.split("|").map(opt => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type={field.type}
                        placeholder={field.placeholder}
                        value={categoryMeta[field.key] || ""}
                        onChange={e => setCategoryMeta(prev => ({ ...prev, [field.key]: e.target.value }))}
                        className="w-full p-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs text-gray-800 dark:text-gray-200 placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* U3: Step 3 — Smart Quick-Fill Templates */}
          <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-800 p-5 shadow-sm">
            <h3 className="font-bold text-gray-900 dark:text-white text-sm mb-1 flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px] font-black">{currentFields.length > 0 ? "3" : "2"}</span>
              AI Writing Instructions
              <span className="text-[10px] font-normal text-gray-400 ml-1">(Optional)</span>
            </h3>
            <p className="text-[11px] text-gray-400 mb-3 ml-7">Quick templates based on your selected category, or write your own</p>

            {/* Quick Templates */}
            {quickTemplates.length > 0 && (
              <div className="mb-3">
                <button
                  onClick={() => setShowTemplates(!showTemplates)}
                  className="flex items-center gap-1.5 text-[11px] font-black text-indigo-600 hover:text-indigo-700 mb-2"
                >
                  <Zap className="h-3.5 w-3.5" />
                  Quick Templates for {selectedCat.label}
                  {showTemplates ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                </button>
                {showTemplates && (
                  <div className="grid grid-cols-1 gap-1.5 mb-3">
                    {quickTemplates.map((t) => (
                      <button
                        key={t.label}
                        onClick={() => { setCustomInstructions(t.text); setShowTemplates(false); }}
                        className={`text-left text-[11px] px-3 py-2 rounded-xl border font-medium transition-all ${
                          customInstructions === t.text
                            ? "bg-indigo-600 text-white border-indigo-600"
                            : "bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:border-indigo-400 hover:text-indigo-600"
                        }`}
                      >
                        <span className="font-black">{t.label}</span>
                        <span className="text-gray-400 dark:text-gray-500 ml-2 line-clamp-1">{t.text.slice(0, 60)}...</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            <textarea
              className="w-full h-20 p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-[12px] text-gray-800 dark:text-gray-200 placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 outline-none transition-all resize-none"
              placeholder={`Apni instruction likho... jaise:\n"Ye SSC CGL 2025 result post hai — cutoff aur next steps pe focus karo"`}
              value={customInstructions}
              onChange={(e) => setCustomInstructions(e.target.value)}
            />
            {customInstructions && (
              <button onClick={() => setCustomInstructions("")} className="text-[11px] text-red-400 hover:text-red-600 mt-1 font-medium">Clear instructions</button>
            )}
          </div>

          {/* Official Link */}
          <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-800 p-5 shadow-sm">
            <h3 className="font-bold text-gray-900 dark:text-white text-sm mb-1 flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-green-600 text-white flex items-center justify-center text-[10px] font-black">{currentFields.length > 0 ? "4" : "3"}</span>
              Official Notification Link
              <span className="text-[10px] font-normal text-gray-400 ml-1">(Optional — builds trust)</span>
            </h3>
            <p className="text-[11px] text-gray-400 mb-3 ml-7">Paste the official govt PDF URL — shown as verified source in blog</p>
            <div className="flex gap-2 items-center">
              <Globe className="h-4 w-4 text-gray-400 shrink-0" />
              <input
                type="url"
                className="flex-1 p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-[12px] text-gray-800 dark:text-gray-200 placeholder-gray-400 focus:ring-2 focus:ring-green-500 outline-none transition-all"
                placeholder="e.g. https://ssc.nic.in/notice/notifications/2025/cgl-notice.pdf"
                value={officialLink}
                onChange={(e) => setOfficialLink(e.target.value)}
              />
              {officialLink && <button onClick={() => setOfficialLink("")} className="text-[11px] text-red-400 hover:text-red-600 font-medium whitespace-nowrap">Clear</button>}
            </div>
            {officialLink && <p className="text-[11px] text-green-600 dark:text-green-400 mt-2 ml-6 font-medium">✓ Official source box will appear in the blog</p>}
          </div>

          {/* Content Textarea */}
          <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-800 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2 text-sm">
                <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px] font-black">{currentFields.length > 0 ? "5" : "4"}</span>
                <FileText className="h-4 w-4 text-indigo-500" />
                Paste Content / Notification Text
              </h3>
              <button onClick={() => setRawText("")} className="text-xs font-bold text-red-500 hover:bg-red-50 px-2 py-1 rounded">Clear</button>
            </div>
            <textarea
              className="w-full h-[280px] p-4 bg-gray-50 dark:bg-gray-800 border-none rounded-2xl text-sm text-gray-800 dark:text-gray-200 placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 outline-none transition-all resize-none"
              placeholder={
                category === "latest-jobs" ? "Paste the official job notification PDF text here..." :
                category === "results"     ? "Paste the result notification or result page content here..." :
                category === "admit-cards" ? "Paste the admit card notification or download page content here..." :
                category === "news"        ? "Paste the news article or press release text here..." :
                category === "admission"   ? "Paste the admission notification or prospectus text here..." :
                category === "answer-key"  ? "Paste the answer key notification or objection details here..." :
                "Paste content here..."
              }
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
            />
            <div className="flex items-center justify-between mt-3">
              <p className="text-[10px] text-gray-400">{rawText.length} chars pasted</p>
              <p className="text-[10px] text-gray-400">Min 50 chars required</p>
            </div>
            <button
              onClick={handleScan}
              disabled={loading || !rawText}
              className="w-full mt-4 py-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20 transition-all active:scale-95"
            >
              {loading ? <><Loader2 className="h-5 w-5 animate-spin" />AI is Writing...</> : <><Wand2 className="h-5 w-5" />Generate {selectedCat.label} Blog</>}
            </button>
          </div>
        </div>

        {/* ── RIGHT: Output Panel ── */}
        <div className="space-y-6">
          {loading ? (
            /* U2: Stage Tracker */
            <div className="bg-white dark:bg-gray-900 rounded-3xl border-2 border-dashed border-indigo-100 dark:border-indigo-900/30 p-8">
              <div className="text-center mb-8">
                <div className="relative w-20 h-20 mx-auto mb-5">
                  <div className="w-20 h-20 bg-indigo-100 dark:bg-indigo-900/30 rounded-full animate-ping absolute inset-0" />
                  <div className="w-20 h-20 bg-indigo-500 rounded-full flex items-center justify-center relative">
                    <Sparkles className="h-10 w-10 text-white animate-pulse" />
                  </div>
                </div>
                <h4 className="text-lg font-black text-gray-900 dark:text-white mb-1">Content Writer Brain Active</h4>
                <p className="text-xs text-gray-400">Writing your {selectedCat.label} blog with full editorial intelligence</p>
              </div>
              <div className="space-y-3">
                {WRITING_STAGES.map((stage, i) => {
                  const isDone = i < writingStage;
                  const isActive = i === writingStage;
                  return (
                    <div key={stage.label} className={`flex items-center gap-3 p-3 rounded-2xl transition-all ${isActive ? "bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800" : ""}`}>
                      <div className="w-7 h-7 shrink-0 flex items-center justify-center">
                        {isDone ? (
                          <CheckCircle2 className="h-6 w-6 text-green-500" />
                        ) : isActive ? (
                          <Loader2 className="h-5 w-5 text-indigo-500 animate-spin" />
                        ) : (
                          <Circle className="h-5 w-5 text-gray-300 dark:text-gray-700" />
                        )}
                      </div>
                      <span className={`text-sm font-medium ${isDone ? "text-green-600 dark:text-green-400 line-through opacity-70" : isActive ? "text-indigo-700 dark:text-indigo-300 font-bold" : "text-gray-400"}`}>
                        {stage.label}
                      </span>
                    </div>
                  );
                })}
              </div>
              <p className="text-center text-xs text-gray-400 mt-6">Latest Jobs blogs take ~60-90 seconds (Prep + Cutoff sections added)</p>
            </div>
          ) : result ? (
            <div className="bg-white dark:bg-gray-900 rounded-3xl border border-indigo-200 dark:border-indigo-900 p-6 shadow-xl animate-in fade-in zoom-in duration-500">
              {/* Output Header */}
              <div className="flex items-center justify-between mb-5">
                <div>
                  <p className="text-[10px] font-extrabold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">Blog Generated</p>
                  <p className="text-[11px] text-gray-400 mt-0.5">Category: <strong>{selectedCat.label}</strong></p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowPublish(true)}
                    className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white text-xs font-black rounded-full shadow-md transition-all active:scale-95 flex items-center gap-2"
                  >
                    <UploadCloud className="h-3.5 w-3.5" /> Publish
                  </button>
                  <button
                    onClick={() => {
                      if (!result) return;
                      localStorage.setItem("ai_generated_job", JSON.stringify(result));
                      router.push("/admin/jobs/new?source=ai");
                    }}
                    className="px-3 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 text-gray-700 dark:text-gray-300 text-xs font-bold rounded-full transition-all flex items-center gap-1.5"
                  >
                    <Send className="h-3 w-3" /> Manual Edit
                  </button>
                </div>
              </div>

              {/* Extracted Metadata */}
              <div className="space-y-4 mb-5">
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase">Extracted Title</label>
                  <p className="font-bold text-gray-900 dark:text-white leading-tight mt-1">{result.title}</p>
                </div>
                <div className="grid grid-cols-2 gap-2.5">
                  {[
                    { label: "Last Date", value: result.lastDate, color: "text-red-600" },
                    { label: "Total Posts", value: result.totalPosts, color: "text-indigo-600" },
                    { label: "Category", value: result.category, color: "text-gray-800 dark:text-gray-200" },
                    { label: "Fee (Gen)", value: result.appFeeGen, color: "text-emerald-600" },
                  ].filter(m => m.value).map((m) => (
                    <div key={m.label} className="bg-gray-50 dark:bg-gray-800 p-3 rounded-xl border border-gray-100 dark:border-gray-700">
                      <label className="text-[10px] font-black text-gray-400 uppercase">{m.label}</label>
                      <p className={`font-bold text-sm mt-0.5 ${m.color}`}>{m.value}</p>
                    </div>
                  ))}
                </div>

                {/* Content Intelligence Summary */}
                {result.contentFeatures && (
                  <div className="bg-violet-50 dark:bg-violet-900/20 rounded-2xl p-3 border border-violet-100 dark:border-violet-900/30">
                    <p className="text-[10px] font-black text-violet-600 uppercase tracking-widest mb-2">Content Intelligence Detected</p>
                    <div className="flex flex-wrap gap-1.5">
                      {[
                        result.contentFeatures.hasPhysicalTest && "Physical Test",
                        result.contentFeatures.hasFeeWaiver && "Fee Waiver",
                        result.contentFeatures.isUrgent && "Urgent Deadline",
                        result.contentFeatures.isBanking && "Banking Exam",
                        result.contentFeatures.isRailway && "Railway Exam",
                        result.contentFeatures.isGroupA && "Group-A Level",
                        result.contentFeatures.hasAgeRelaxation && "Age Relaxation",
                        result.contentFeatures.hasMultiplePosts && "Multiple Posts",
                      ].filter(Boolean).map(tag => (
                        <span key={tag as string} className="text-[10px] font-black px-2 py-0.5 bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300 rounded-full">{tag as string}</span>
                      ))}
                      {Object.values(result.contentFeatures).filter(Boolean).filter(v => typeof v === "boolean").length === 0 && (
                        <span className="text-[10px] text-violet-500">Standard government job post detected</span>
                      )}
                    </div>
                  </div>
                )}

                {/* U5: Category-Aware SEO Scorecard */}
                {seo && (() => {
                  return (
                    <div className="bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-4 border border-gray-100 dark:border-gray-700">
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest">SEO Quality Score</p>
                        <span className={`text-xs font-black px-2.5 py-1 rounded-full ${
                          seo.score >= seo.total * 0.9 ? "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400" :
                          seo.score >= seo.total * 0.7 ? "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400" :
                          seo.score >= seo.total * 0.5 ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-400" :
                          "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400"
                        }`}>
                          {seo.score}/{seo.total} {seo.score >= seo.total * 0.9 ? "Excellent" : seo.score >= seo.total * 0.7 ? "Good" : seo.score >= seo.total * 0.5 ? "Fair" : "Needs Work"}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-1.5">
                        {seo.checks.map((c) => (
                          <div key={c.label} className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium ${c.ok ? "bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400" : "bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400"}`}>
                            <span className="shrink-0">{c.ok ? "✓" : "✗"}</span>
                            <span className="truncate">{c.label}: {c.detail}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })()}

                {/* Blog HTML Preview */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase">Blog Content Preview</label>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setShowPreview(true)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-900/30 dark:hover:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 text-xs font-bold rounded-lg transition-colors"
                      >
                        <Eye className="h-3.5 w-3.5" /> Full Preview
                      </button>
                      <button
                        onClick={() => { navigator.clipboard.writeText(result.blogHtml); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
                        className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-gray-400 transition-colors"
                      >
                        {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  <div
                    className="max-h-[200px] overflow-y-auto p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl text-[12px] text-gray-600 dark:text-gray-400 border border-gray-100 dark:border-gray-700"
                    dangerouslySetInnerHTML={{ __html: result.blogHtml }}
                  />
                </div>
              </div>
            </div>
          ) : (
            /* Empty state */
            <div className="h-[560px] bg-gray-50 dark:bg-gray-800/30 rounded-3xl border border-dashed border-gray-200 dark:border-gray-800 flex flex-col items-center justify-center p-8 text-center text-gray-400">
              <Wand2 className="h-12 w-12 mb-4 opacity-20" />
              <p className="text-sm font-medium">Select a category, paste content, and generate.</p>
              <p className="text-xs mt-1 opacity-60">Supports: Jobs, Results, Admit Cards, News, Admission, Answer Key</p>
              <div className="mt-6 grid grid-cols-2 gap-3 text-left max-w-xs w-full">
                {[
                  "Content Intelligence Engine",
                  "Auto-Highlight Numbers",
                  "Category-Smart Inputs",
                  "One-Click Publish",
                  "Category-Aware SEO Check",
                  "Quick Expert Templates",
                  "90-Day Prep Strategy",
                  "Expected Cutoff Section",
                  "Physical Fitness Callout",
                  "Auto Internal Links",
                ].map(f => (
                  <div key={f} className="flex items-center gap-2 text-[11px] text-gray-500 dark:text-gray-500">
                    <span className="text-indigo-400">✦</span> {f}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
