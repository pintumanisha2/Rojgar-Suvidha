"use client";

import { useState } from "react";
import { BellRing, Send, CheckCircle2, AlertCircle } from "lucide-react";

export default function PushNotificationsPage() {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [url, setUrl] = useState("/");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  const handleBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !body) return;

    setLoading(true);
    setResult(null);

    try {
      const res = await fetch("/api/push", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "broadcast",
          payload: {
            title,
            body,
            url,
            icon: "/logo-blue.png"
          }
        })
      });

      const data = await res.json();
      
      if (data.success) {
        setResult({ type: 'success', message: data.message });
        setTitle("");
        setBody("");
        setUrl("/");
      } else {
        setResult({ type: 'error', message: data.error || "Failed to send broadcast" });
      }
    } catch (err: any) {
      setResult({ type: 'error', message: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
          <BellRing className="w-6 h-6 text-indigo-500" />
          Push Notifications
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Send instant job alerts to all subscribed students across India.
        </p>
      </div>

      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 md:p-8 shadow-sm">
        {result && (
          <div className={`p-4 rounded-xl mb-6 flex items-start gap-3 ${result.type === 'success' ? 'bg-green-50 dark:bg-green-900/30 text-green-800 dark:text-green-300' : 'bg-red-50 dark:bg-red-900/30 text-red-800 dark:text-red-300'}`}>
            {result.type === 'success' ? <CheckCircle2 className="w-5 h-5 shrink-0" /> : <AlertCircle className="w-5 h-5 shrink-0" />}
            <div>
              <p className="text-sm font-bold">{result.type === 'success' ? 'Success!' : 'Error!'}</p>
              <p className="text-sm">{result.message}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleBroadcast} className="space-y-5">
          <div>
            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">
              Notification Title <span className="text-red-500">*</span>
            </label>
            <input 
              type="text" 
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., SSC CGL 2026 Notification Out!"
              className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
              maxLength={50}
            />
            <p className="text-xs text-gray-400 mt-1 text-right">{title.length}/50</p>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">
              Message Body <span className="text-red-500">*</span>
            </label>
            <textarea 
              required
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="e.g., Check the official notification, eligibility, and apply online before the last date."
              className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none h-24 resize-none"
              maxLength={150}
            />
             <p className="text-xs text-gray-400 mt-1 text-right">{body.length}/150</p>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">
              Target URL (Optional)
            </label>
            <input 
              type="text" 
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="e.g., /job/ssc-cgl-2026"
              className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
            />
            <p className="text-xs text-gray-500 mt-1">When students click the notification, they will be sent to this link.</p>
          </div>

          <div className="pt-4 border-t border-gray-100 dark:border-gray-800">
            <button 
              type="submit"
              disabled={loading || !title || !body}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl py-3.5 px-4 flex items-center justify-center gap-2 transition-all disabled:opacity-70 shadow-lg shadow-indigo-600/20"
            >
              {loading ? (
                "Broadcasting..."
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  Send Broadcast to All Subscribers
                </>
              )}
            </button>
          </div>
        </form>
      </div>
      
      {/* Phone Preview */}
      <div className="mt-8">
        <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-3 text-center uppercase tracking-wider">Preview</h3>
        <div className="max-w-sm mx-auto bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-4 shadow-sm relative overflow-hidden">
           <div className="flex items-start gap-3 relative z-10 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md p-3 rounded-xl border border-white/20 dark:border-gray-700/50">
             <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/50 rounded-lg shrink-0 flex items-center justify-center">
                <BellRing className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
             </div>
             <div>
               <p className="text-xs text-gray-400 font-medium mb-0.5">Rojgar Suvidha • Now</p>
               <h4 className="font-bold text-sm text-gray-900 dark:text-white leading-tight">{title || "Notification Title"}</h4>
               <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 leading-snug line-clamp-2">{body || "Notification message will appear here..."}</p>
             </div>
           </div>
        </div>
      </div>
    </div>
  );
}
