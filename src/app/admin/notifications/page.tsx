"use client";

import { useState } from "react";
import { BellRing, Send, CheckCircle2, AlertCircle, Bell, Globe, User, Loader2 } from "lucide-react";

const NOTIFICATION_TYPES = [
  { value: "general",      label: "General",       emoji: "🔔" },
  { value: "job_alert",    label: "Job Alert",      emoji: "💼" },
  { value: "form_reminder",label: "Form Reminder",  emoji: "⚠️" },
  { value: "payment",      label: "Payment",        emoji: "✅" },
  { value: "result",       label: "Result",         emoji: "🏆" },
  { value: "admit_card",   label: "Admit Card",     emoji: "📄" },
  { value: "system",       label: "System",         emoji: "⚙️" },
];

export default function AdminNotificationsPage() {
  const [title, setTitle]       = useState("");
  const [body, setBody]         = useState("");
  const [actionUrl, setActionUrl] = useState("/");
  const [notifType, setNotifType] = useState("general");
  const [targetMode, setTargetMode] = useState<"all" | "user">("all");
  const [targetUserId, setTargetUserId] = useState("");
  const [sendPush, setSendPush] = useState(true);
  const [loading, setLoading]   = useState(false);
  const [result, setResult]     = useState<{ type: "success" | "error"; message: string } | null>(null);

  const selectedType = NOTIFICATION_TYPES.find(t => t.value === notifType) || NOTIFICATION_TYPES[0];

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !body) return;
    if (targetMode === "user" && !targetUserId.trim()) {
      setResult({ type: "error", message: "Please enter a User ID to target." });
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const res = await fetch("/api/notifications/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: targetMode === "user" ? targetUserId.trim() : undefined,
          title,
          body,
          icon: selectedType.emoji,
          actionUrl,
          type: notifType,
          sendPush,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setResult({ type: "success", message: `Notification sent! ${targetMode === "all" ? "All users" : "User"} notified.` });
        setTitle(""); setBody(""); setActionUrl("/");
      } else {
        setResult({ type: "error", message: data.error || "Failed to send." });
      }
    } catch (err: any) {
      setResult({ type: "error", message: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
          <BellRing className="w-6 h-6 text-indigo-500" />
          Send Notification
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          In-App bell + Web Push — send to all users or one specific user.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* ─── Form ─── */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 shadow-sm">
          {result && (
            <div className={`p-4 rounded-xl mb-5 flex items-start gap-3 text-sm font-medium ${result.type === "success" ? "bg-green-50 dark:bg-green-900/30 text-green-800 dark:text-green-300" : "bg-red-50 dark:bg-red-900/30 text-red-800 dark:text-red-300"}`}>
              {result.type === "success" ? <CheckCircle2 className="w-5 h-5 shrink-0" /> : <AlertCircle className="w-5 h-5 shrink-0" />}
              {result.message}
            </div>
          )}

          <form onSubmit={handleSend} className="space-y-4">
            {/* Target Mode */}
            <div>
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Send To</label>
              <div className="flex gap-2">
                <button type="button" onClick={() => setTargetMode("all")}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border-2 text-sm font-bold transition-all ${targetMode === "all" ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-300" : "border-gray-200 dark:border-gray-700 text-gray-500 hover:border-gray-300"}`}>
                  <Globe className="w-4 h-4" /> All Users
                </button>
                <button type="button" onClick={() => setTargetMode("user")}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border-2 text-sm font-bold transition-all ${targetMode === "user" ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-300" : "border-gray-200 dark:border-gray-700 text-gray-500 hover:border-gray-300"}`}>
                  <User className="w-4 h-4" /> Specific User
                </button>
              </div>
              {targetMode === "user" && (
                <input
                  type="text"
                  value={targetUserId}
                  onChange={e => setTargetUserId(e.target.value)}
                  placeholder="Paste User UUID here..."
                  className="mt-2 w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none font-mono"
                />
              )}
            </div>

            {/* Type */}
            <div>
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Type</label>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {NOTIFICATION_TYPES.map(t => (
                  <button key={t.value} type="button" onClick={() => setNotifType(t.value)}
                    className={`flex flex-col items-center gap-1 py-2 px-1 rounded-xl border-2 text-xs font-bold transition-all ${notifType === t.value ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-300" : "border-gray-200 dark:border-gray-700 text-gray-500 hover:border-gray-300"}`}>
                    <span className="text-base">{t.emoji}</span>
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Title */}
            <div>
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">
                Title <span className="text-red-500">*</span>
              </label>
              <input type="text" required value={title} onChange={e => setTitle(e.target.value)}
                placeholder="e.g., SSC CGL 2026 Notification Out!"
                className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                maxLength={60} />
              <p className="text-xs text-gray-400 mt-1 text-right">{title.length}/60</p>
            </div>

            {/* Body */}
            <div>
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">
                Message <span className="text-red-500">*</span>
              </label>
              <textarea required value={body} onChange={e => setBody(e.target.value)}
                placeholder="e.g., Apply before last date. Click to check eligibility."
                className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none h-20 resize-none"
                maxLength={150} />
              <p className="text-xs text-gray-400 mt-1 text-right">{body.length}/150</p>
            </div>

            {/* URL */}
            <div>
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Action URL</label>
              <input type="text" value={actionUrl} onChange={e => setActionUrl(e.target.value)}
                placeholder="e.g., /job/ssc-cgl-2026"
                className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
            </div>

            {/* Web Push toggle */}
            <div className="flex items-center gap-3 p-3 bg-indigo-50 dark:bg-indigo-950/20 rounded-xl border border-indigo-100 dark:border-indigo-900/30">
              <input type="checkbox" id="sendPush" checked={sendPush} onChange={e => setSendPush(e.target.checked)}
                className="w-4 h-4 accent-indigo-600 rounded" />
              <label htmlFor="sendPush" className="text-sm font-bold text-indigo-700 dark:text-indigo-300 cursor-pointer">
                Also send Web Push (browser notification)
              </label>
            </div>

            <button type="submit" disabled={loading || !title || !body}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl py-3.5 flex items-center justify-center gap-2 transition-all disabled:opacity-60 shadow-lg shadow-indigo-600/20">
              {loading ? <><Loader2 className="w-5 h-5 animate-spin" /> Sending...</> : <><Send className="w-5 h-5" /> Send Notification</>}
            </button>
          </form>
        </div>

        {/* ─── Live Preview ─── */}
        <div className="space-y-4">
          <h3 className="text-sm font-black text-gray-700 dark:text-gray-300 uppercase tracking-wider">Live Preview</h3>

          {/* In-App Bell Preview */}
          <div>
            <p className="text-xs font-bold text-gray-500 mb-2">📱 In-App Bell</p>
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden shadow-sm">
              <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800 flex items-center gap-2">
                <Bell className="w-4 h-4 text-indigo-600" />
                <span className="text-xs font-black text-gray-700 dark:text-white">Notifications</span>
                <span className="px-1.5 py-0.5 bg-red-100 text-red-600 text-[10px] font-black rounded-md">1 New</span>
              </div>
              <div className="p-3 flex items-start gap-3 bg-indigo-50/40 dark:bg-indigo-950/10">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg border bg-blue-50 border-blue-100 shrink-0">
                  {selectedType.emoji}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-black text-gray-900 dark:text-white leading-tight">{title || "Notification Title"}</p>
                  <p className="text-[11px] text-gray-500 mt-0.5 line-clamp-2">{body || "Aapka message yahan dikhega..."}</p>
                  <p className="text-[10px] text-gray-400 mt-1 font-medium">abhi</p>
                </div>
                <div className="w-2 h-2 bg-indigo-500 rounded-full shrink-0 mt-1" />
              </div>
            </div>
          </div>

          {/* Web Push Preview */}
          {sendPush && (
            <div>
              <p className="text-xs font-bold text-gray-500 mb-2">💻 Web Push (Browser)</p>
              <div className="bg-gray-100 dark:bg-gray-800 rounded-2xl p-4 border border-gray-200 dark:border-gray-700">
                <div className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-md p-3 rounded-xl border border-white/20 dark:border-gray-700/50 flex items-start gap-3">
                  <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/50 rounded-lg shrink-0 flex items-center justify-center">
                    <BellRing className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-400 font-medium mb-0.5">Rojgar Suvidha • Now</p>
                    <h4 className="font-bold text-sm text-gray-900 dark:text-white leading-tight">{title || "Notification Title"}</h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">{body || "Message here..."}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Quick Templates */}
          <div>
            <p className="text-xs font-bold text-gray-500 mb-2">⚡ Quick Templates</p>
            <div className="space-y-2">
              {[
                { title: "SSC CGL 2026 Notification Out! 🏛️", body: "Online apply shuru ho gaya! Last date se pehle apply karein.", type: "job_alert", url: "/jobs/ssc" },
                { title: "IBPS PO 2025 Result Declared 🏆", body: "Apna result abhi check karein. Mains ke liye cutoff bhi check karein.", type: "result", url: "/results" },
                { title: "RRB NTPC Admit Card Out 📄", body: "Apna admit card abhi download karein. Exam date check karein.", type: "admit_card", url: "/admit-card" },
              ].map((tpl, i) => (
                <button key={i} type="button"
                  onClick={() => { setTitle(tpl.title); setBody(tpl.body); setNotifType(tpl.type); setActionUrl(tpl.url); }}
                  className="w-full text-left p-3 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-700 hover:bg-indigo-50 dark:hover:bg-indigo-950/20 transition-all group">
                  <p className="text-xs font-bold text-gray-800 dark:text-gray-200 group-hover:text-indigo-700 dark:group-hover:text-indigo-300 leading-tight">{tpl.title}</p>
                  <p className="text-[11px] text-gray-400 mt-0.5 line-clamp-1">{tpl.body}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
