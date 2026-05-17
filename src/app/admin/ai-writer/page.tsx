"use client";
// v2 — category selector + human blogger prompts
import { useState } from "react";
import { useRouter } from "next/navigation";
import { 
  Sparkles, Send, Loader2, ArrowLeft, 
  FileText, Copy, Check, Wand2, Info,
  Briefcase, Trophy, CreditCard, Newspaper, GraduationCap, ClipboardList
} from "lucide-react";
import Link from "next/link";

const CATEGORIES = [
  { value: "latest-jobs",  label: "Latest Jobs",   icon: Briefcase,     color: "bg-indigo-100 text-indigo-700 border-indigo-200",    activeColor: "bg-indigo-600 text-white border-indigo-600" },
  { value: "results",      label: "Results",        icon: Trophy,        color: "bg-green-100 text-green-700 border-green-200",       activeColor: "bg-green-600 text-white border-green-600" },
  { value: "admit-cards",  label: "Admit Cards",    icon: CreditCard,    color: "bg-orange-100 text-orange-700 border-orange-200",    activeColor: "bg-orange-500 text-white border-orange-500" },
  { value: "news",         label: "News",           icon: Newspaper,     color: "bg-blue-100 text-blue-700 border-blue-200",          activeColor: "bg-blue-600 text-white border-blue-600" },
  { value: "admission",    label: "Admission",      icon: GraduationCap, color: "bg-purple-100 text-purple-700 border-purple-200",    activeColor: "bg-purple-600 text-white border-purple-600" },
  { value: "answer-key",   label: "Answer Key",     icon: ClipboardList, color: "bg-rose-100 text-rose-700 border-rose-200",          activeColor: "bg-rose-600 text-white border-rose-600" },
];

export default function AIWriterPage() {
  const router = useRouter();
  const [rawText, setRawText] = useState("");
  const [category, setCategory] = useState("latest-jobs");
  const [customInstructions, setCustomInstructions] = useState("");
  const [officialLink, setOfficialLink] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleScan = async () => {
    if (!rawText || rawText.length < 50) {
      alert("Please paste the notification/content text first (min 50 chars).");
      return;
    }

    setLoading(true);
    setResult(null);
    try {
      const response = await fetch("/api/admin/scan-notification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rawText, category, customInstructions, officialLink }),
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

  const handleCreatePost = () => {
    if (!result) return;
    localStorage.setItem("ai_generated_job", JSON.stringify(result));
    router.push("/admin/jobs/new?source=ai");
  };

  const selectedCat = CATEGORIES.find(c => c.value === category)!;
  const loadingMessages: Record<string, string> = {
    "latest-jobs":  "Extracting job details, eligibility & writing full blog...",
    "results":      "Analysing result data & writing result blog...",
    "admit-cards":  "Extracting admit card details & download guide...",
    "news":         "Summarising news & writing impact analysis...",
    "admission":    "Extracting admission details & eligibility...",
    "answer-key":   "Extracting answer key info & objection guide...",
  };

  return (
    <div className="max-w-5xl mx-auto pb-20">
      {/* Header */}
      <div className="flex items-center justify-between mb-8 pb-6 border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center gap-4">
          <Link href="/admin" className="p-2.5 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 text-gray-600 transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
              <Sparkles className="h-6 w-6 text-indigo-500 fill-indigo-500/20" /> 
              AI Super Writer
            </h2>
            <p className="text-sm text-gray-500 font-medium">Paste any notification — AI writes the perfect blog for any category</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Input Section */}
        <div className="space-y-5">

          {/* ── Category Selector ── */}
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
                    onClick={() => setCategory(cat.value)}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-xs font-bold transition-all ${
                      isActive ? cat.activeColor : cat.color + " hover:opacity-80"
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5 shrink-0" />
                    {cat.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── Custom AI Instructions ── */}
          <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-800 p-5 shadow-sm">
            <h3 className="font-bold text-gray-900 dark:text-white text-sm mb-1 flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px] font-black">2</span>
              AI Ko Extra Instructions Do
              <span className="text-[10px] font-normal text-gray-400 ml-1">(Optional)</span>
            </h3>
            <p className="text-[11px] text-gray-400 mb-3 ml-7">AI ko batao ye post kaise likhna hai — category, focus area, ya koi khaas baat</p>

            {/* Quick Instruction Pills */}
            <div className="flex flex-wrap gap-2 mb-3">
              {[
                { label: "📋 Result Section Post", text: "Ye Result section ka post hai. Result announcement, cutoff, merit list aur next steps pe focus karo." },
                { label: "📰 News Section Post", text: "Ye News section ka post hai. News journalism style mein likho — inverted pyramid, facts first, short paragraphs." },
                { label: "🎓 Admission Post", text: "Ye Admission section ka post hai. Students ko guide karo — eligibility, process, documents clearly explain karo." },
                { label: "💼 Latest Jobs Post", text: "Ye Latest Jobs section ka post hai. Job details, eligibility, salary, apply process sab detail mein cover karo." },
                { label: "🎫 Admit Card Post", text: "Ye Admit Card section ka post hai. Download steps, exam date, documents to carry — practical guide style mein likho." },
                { label: "🔑 Answer Key Post", text: "Ye Answer Key section ka post hai. Score calculation, objection process, expected cutoff cover karo." },
              ].map((pill) => (
                <button
                  key={pill.label}
                  onClick={() => setCustomInstructions(pill.text)}
                  className={`text-[11px] px-2.5 py-1.5 rounded-lg border font-medium transition-all ${
                    customInstructions === pill.text
                      ? "bg-indigo-600 text-white border-indigo-600"
                      : "bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:border-indigo-400 hover:text-indigo-600"
                  }`}
                >
                  {pill.label}
                </button>
              ))}
            </div>

            <textarea
              className="w-full h-20 p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-[12px] text-gray-800 dark:text-gray-200 placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 outline-none transition-all resize-none"
              placeholder={`Apni instruction likho... jaise:\n"Ye SSC CGL 2025 result post hai — cutoff aur next steps pe zyada focus karo"`}
              value={customInstructions}
              onChange={(e) => setCustomInstructions(e.target.value)}
            />
            {customInstructions && (
              <button
                onClick={() => setCustomInstructions("")}
                className="text-[11px] text-red-400 hover:text-red-600 mt-1 font-medium"
              >
                Clear instructions
              </button>
            )}
          </div>

          {/* ── Official Notification Link ── */}
          <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-800 p-5 shadow-sm">
            <h3 className="font-bold text-gray-900 dark:text-white text-sm mb-1 flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-green-600 text-white flex items-center justify-center text-[10px] font-black">3</span>
              Official Notification Link
              <span className="text-[10px] font-normal text-gray-400 ml-1">(Optional — builds trust)</span>
            </h3>
            <p className="text-[11px] text-gray-400 mb-3 ml-7">Paste the official govt website URL or PDF link — shown as a verified source in the blog</p>
            <div className="flex gap-2 items-center">
              <span className="text-lg">📄</span>
              <input
                type="url"
                className="flex-1 p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-[12px] text-gray-800 dark:text-gray-200 placeholder-gray-400 focus:ring-2 focus:ring-green-500 outline-none transition-all"
                placeholder="e.g. https://ssc.nic.in/notice/notifications/2025/cgl-notice.pdf"
                value={officialLink}
                onChange={(e) => setOfficialLink(e.target.value)}
              />
              {officialLink && (
                <button
                  onClick={() => setOfficialLink("")}
                  className="text-[11px] text-red-400 hover:text-red-600 font-medium whitespace-nowrap"
                >
                  Clear
                </button>
              )}
            </div>
            {officialLink && (
              <p className="text-[11px] text-green-600 dark:text-green-400 mt-2 ml-7 font-medium">✓ Blog mein official source box add ho jayega</p>
            )}
          </div>

          {/* ── Text Input ── */}
          <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-800 p-6 shadow-sm" id="content-input-section">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2 text-sm">
                <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px] font-black">4</span>
                <FileText className="h-4 w-4 text-indigo-500" />
                Paste Content / Notification Text
              </h3>
              <button 
                onClick={() => setRawText("")}
                className="text-xs font-bold text-red-500 hover:bg-red-50 px-2 py-1 rounded"
              >
                Clear
              </button>
            </div>
            
            <textarea
              className="w-full h-[320px] p-4 bg-gray-50 dark:bg-gray-800 border-none rounded-2xl text-sm text-gray-800 dark:text-gray-200 placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 outline-none transition-all resize-none"
              placeholder={
                category === "latest-jobs"  ? "Paste the official job notification PDF text here..." :
                category === "results"      ? "Paste the result notification or result page content here..." :
                category === "admit-cards"  ? "Paste the admit card notification or download page content here..." :
                category === "news"         ? "Paste the news article or press release text here..." :
                category === "admission"    ? "Paste the admission notification or prospectus text here..." :
                category === "answer-key"   ? "Paste the answer key notification or objection details here..." :
                "Paste content here..."
              }
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
            />

            <div className="mt-4 p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl flex items-start gap-3">
              <Info className="h-4 w-4 text-indigo-500 shrink-0 mt-0.5" />
              <p className="text-[11px] text-indigo-700 dark:text-indigo-300 font-medium leading-relaxed">
                {category === "latest-jobs"  && "AI will extract job title, eligibility, salary, selection process and write a full SEO blog."}
                {category === "results"      && "AI will extract result details, merit list info, cutoff and write a result announcement blog."}
                {category === "admit-cards"  && "AI will extract exam date, admit card download steps and write a complete guide."}
                {category === "news"         && "AI will summarise the news and write an impact analysis blog for aspirants."}
                {category === "admission"    && "AI will extract admission details, eligibility, fee and write a complete admission guide."}
                {category === "answer-key"   && "AI will extract answer key details, objection process and write a guide blog."}
              </p>
            </div>

            <button
              onClick={handleScan}
              disabled={loading || !rawText}
              className="w-full mt-5 py-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20 transition-all active:scale-95"
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  AI is Writing...
                </>
              ) : (
                <>
                  <Wand2 className="h-5 w-5" />
                  Generate {selectedCat.label} Blog
                </>
              )}
            </button>
          </div>
        </div>

        {/* Output Section */}
        <div className="space-y-6">
          {loading ? (
            <div className="h-[560px] bg-white dark:bg-gray-900 rounded-3xl border-2 border-dashed border-indigo-100 dark:border-indigo-900/30 flex flex-col items-center justify-center p-8 text-center">
              <div className="relative mb-6">
                <div className="w-20 h-20 bg-indigo-100 dark:bg-indigo-900/30 rounded-full animate-ping absolute inset-0" />
                <div className="w-20 h-20 bg-indigo-500 rounded-full flex items-center justify-center relative">
                  <Sparkles className="h-10 w-10 text-white animate-pulse" />
                </div>
              </div>
              <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-2">AI is writing your blog...</h4>
              <p className="text-sm text-gray-500 max-w-xs">{loadingMessages[category]}</p>
            </div>
          ) : result ? (
            <div className="bg-white dark:bg-gray-900 rounded-3xl border border-indigo-200 dark:border-indigo-900 p-6 shadow-xl animate-in fade-in zoom-in duration-500">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <p className="text-[10px] font-extrabold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">AI Generated Result</p>
                  <p className="text-[11px] text-gray-400 mt-0.5">Category: <strong>{selectedCat.label}</strong></p>
                </div>
                <button 
                  onClick={handleCreatePost}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-full shadow-md transition-all active:scale-95 flex items-center gap-2"
                >
                  <Send className="h-3.5 w-3.5" /> Use in New Post
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase">Extracted Title</label>
                  <p className="font-bold text-gray-900 dark:text-white leading-tight">{result.title}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  {result.lastDate && (
                    <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-xl border border-gray-100 dark:border-gray-700">
                      <label className="text-[10px] font-bold text-gray-400 uppercase">Last Date / Date</label>
                      <p className="font-bold text-indigo-600 text-sm">{result.lastDate}</p>
                    </div>
                  )}
                  {result.appFee && (
                    <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-xl border border-gray-100 dark:border-gray-700">
                      <label className="text-[10px] font-bold text-gray-400 uppercase">Fee / Key Info</label>
                      <p className="font-bold text-emerald-600 text-sm">{result.appFee}</p>
                    </div>
                  )}
                  {result.totalPosts && (
                    <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-xl border border-gray-100 dark:border-gray-700">
                      <label className="text-[10px] font-bold text-gray-400 uppercase">Posts / Vacancies</label>
                      <p className="font-bold text-gray-800 dark:text-gray-200 text-sm">{result.totalPosts}</p>
                    </div>
                  )}
                  {result.category && (
                    <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-xl border border-gray-100 dark:border-gray-700">
                      <label className="text-[10px] font-bold text-gray-400 uppercase">Category</label>
                      <p className="font-bold text-gray-800 dark:text-gray-200 text-sm">{result.category}</p>
                    </div>
                  )}
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-[10px] font-bold text-gray-400 uppercase">Blog Content (HTML Preview)</label>
                    <button 
                      onClick={() => { navigator.clipboard.writeText(result.blogHtml); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
                      className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 transition-colors"
                    >
                      {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                    </button>
                  </div>
                  <div 
                    className="max-h-[280px] overflow-y-auto p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl text-[12px] text-gray-600 dark:text-gray-400 border border-gray-100 dark:border-gray-700 prose-sm prose-indigo dark:prose-invert"
                    dangerouslySetInnerHTML={{ __html: result.blogHtml }}
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="h-[560px] bg-gray-50 dark:bg-gray-800/30 rounded-3xl border border-dashed border-gray-200 dark:border-gray-800 flex flex-col items-center justify-center p-8 text-center text-gray-400">
              <Wand2 className="h-12 w-12 mb-4 opacity-20" />
              <p className="text-sm font-medium">Select a category, paste content, and generate.</p>
              <p className="text-xs mt-1 opacity-60">Supports: Jobs, Results, Admit Cards, News, Admission, Answer Key</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
