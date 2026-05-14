"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { 
  Sparkles, Send, Loader2, ArrowLeft, 
  FileText, Copy, Check, Wand2, Info
} from "lucide-react";
import Link from "next/link";

export default function AIWriterPage() {
  const router = useRouter();
  const [rawText, setRawText] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleScan = async () => {
    if (!rawText || rawText.length < 50) {
      alert("Please paste the official notification text first (min 50 chars).");
      return;
    }

    setLoading(true);
    setResult(null);
    try {
      const response = await fetch("/api/admin/scan-notification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rawText }),
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
    
    // Store in localStorage so /admin/jobs/new can pick it up
    localStorage.setItem("ai_generated_job", JSON.stringify(result));
    router.push("/admin/jobs/new?source=ai");
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
            <p className="text-sm text-gray-500 font-medium">Turn messy notifications into professional English blogs</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Input Section */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-800 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <FileText className="h-5 w-5 text-indigo-500" />
                Paste Notification Text
              </h3>
              <button 
                onClick={() => setRawText("")}
                className="text-xs font-bold text-red-500 hover:bg-red-50 px-2 py-1 rounded"
              >
                Clear
              </button>
            </div>
            
            <textarea
              className="w-full h-[400px] p-4 bg-gray-50 dark:bg-gray-800 border-none rounded-2xl text-sm text-gray-800 dark:text-gray-200 placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 outline-none transition-all resize-none"
              placeholder="Paste the official PDF text, news article, or website content here..."
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
            />

            <div className="mt-4 p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl flex items-start gap-3">
              <Info className="h-5 w-5 text-indigo-500 shrink-0 mt-0.5" />
              <p className="text-[11px] text-indigo-700 dark:text-indigo-300 font-medium leading-relaxed">
                Tip: Copy the entire page of a PDF or website. AI will automatically filter the noise and extract only important data (Fee, Dates, Age, Eligibility) and write an English blog.
              </p>
            </div>

            <button
              onClick={handleScan}
              disabled={loading || !rawText}
              className="w-full mt-6 py-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20 transition-all active:scale-95"
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  AI is Scanning & Writing...
                </>
              ) : (
                <>
                  <Wand2 className="h-5 w-5" />
                  Generate Professional Blog
                </>
              )}
            </button>
          </div>
        </div>

        {/* Output Section */}
        <div className="space-y-6">
          {loading ? (
            <div className="h-[500px] bg-white dark:bg-gray-900 rounded-3xl border-2 border-dashed border-indigo-100 dark:border-indigo-900/30 flex flex-col items-center justify-center p-8 text-center">
              <div className="relative mb-6">
                <div className="w-20 h-20 bg-indigo-100 dark:bg-indigo-900/30 rounded-full animate-ping absolute inset-0" />
                <div className="w-20 h-20 bg-indigo-500 rounded-full flex items-center justify-center relative">
                  <Sparkles className="h-10 w-10 text-white animate-pulse" />
                </div>
              </div>
              <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Gemini 2.0 is at work...</h4>
              <p className="text-sm text-gray-500 max-w-xs">Extracting tables, formatting HTML, and optimizing for SEO in professional English.</p>
            </div>
          ) : result ? (
            <div className="bg-white dark:bg-gray-900 rounded-3xl border border-indigo-200 dark:border-indigo-900 p-6 shadow-xl animate-in fade-in zoom-in duration-500">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-extrabold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest text-xs">AI Generated Result</h3>
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
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-xl border border-gray-100 dark:border-gray-700">
                    <label className="text-[10px] font-bold text-gray-400 uppercase">Last Date</label>
                    <p className="font-bold text-indigo-600 text-sm">{result.lastDate}</p>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-xl border border-gray-100 dark:border-gray-700">
                    <label className="text-[10px] font-bold text-gray-400 uppercase">App Fee</label>
                    <p className="font-bold text-emerald-600 text-sm">{result.appFee}</p>
                  </div>
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
                    className="max-h-[300px] overflow-y-auto p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl text-[12px] text-gray-600 dark:text-gray-400 border border-gray-100 dark:border-gray-700 prose-sm prose-indigo dark:prose-invert"
                    dangerouslySetInnerHTML={{ __html: result.blogHtml }}
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="h-[500px] bg-gray-50 dark:bg-gray-800/30 rounded-3xl border border-dashed border-gray-200 dark:border-gray-800 flex flex-col items-center justify-center p-8 text-center text-gray-400">
              <Wand2 className="h-12 w-12 mb-4 opacity-20" />
              <p className="text-sm">Scan results will appear here in professional English.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
