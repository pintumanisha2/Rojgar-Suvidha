"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { Search, ArrowLeft, ClipboardCheck, Clock, CheckCircle2, XCircle, Loader2, AlertCircle } from "lucide-react";

type RequestStatus = "pending" | "paid" | "in_progress" | "needs_info" | "completed" | "refund_pending" | "rejected";

interface TrackResult {
  job_title: string;
  status: RequestStatus;
  created_at: string;
  admin_notes: string | null;
  verification_code: string | null;
  tracking_id: string;
}

const STATUS_CONFIG: Record<RequestStatus, { label: string; color: string; bg: string; icon: React.ReactNode; desc: string }> = {
  paid:          { label: "✅ Payment Received",    color: "text-blue-700 dark:text-blue-300",   bg: "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700",     icon: <Clock className="w-5 h-5 text-blue-500" />,    desc: "Aapki payment mil gayi. Hamari team jald kaam shuru karegi." },
  pending:       { label: "⏳ Queue Mein Hai",       color: "text-amber-700 dark:text-amber-300", bg: "bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-700", icon: <Clock className="w-5 h-5 text-amber-500" />,   desc: "Aapka request queue mein hai. 24 ghante mein process hoga." },
  in_progress:   { label: "🔄 Form Fill Ho Raha Hai",color: "text-indigo-700 dark:text-indigo-300",bg: "bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-700",icon: <Loader2 className="w-5 h-5 text-indigo-500 animate-spin" />, desc: "Hamari team abhi aapka form fill kar rahi hai." },
  needs_info:    { label: "⚠️ Document Chahiye",     color: "text-orange-700 dark:text-orange-300",bg: "bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-700",icon: <AlertCircle className="w-5 h-5 text-orange-500" />, desc: "Koi document missing ya blur hai. Team note check karo aur support se contact karo." },
  completed:     { label: "✅ Form Submit Ho Gaya!", color: "text-green-700 dark:text-green-300",  bg: "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700",   icon: <CheckCircle2 className="w-5 h-5 text-green-500" />, desc: "Aapka form successfully submit ho gaya! Dashboard se receipt download karo." },
  refund_pending:{ label: "💸 Refund Processing",    color: "text-pink-700 dark:text-pink-300",   bg: "bg-pink-50 dark:bg-pink-900/20 border-pink-200 dark:border-pink-700",       icon: <XCircle className="w-5 h-5 text-pink-500" />,  desc: "Kisi karan form fill nahi ho saka. Refund process ho raha hai." },
  rejected:      { label: "❌ Could Not Complete",   color: "text-red-700 dark:text-red-300",     bg: "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700",           icon: <XCircle className="w-5 h-5 text-red-500" />,   desc: "Kuch problem aayi. Admin note mein reason dekho ya support se contact karo." },
};

export default function TrackPage() {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<TrackResult | null>(null);
  const [notFound, setNotFound] = useState(false);

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanInput = input.trim().toUpperCase().replace(/\s/g, "");
    if (!cleanInput) return;

    setLoading(true);
    setNotFound(false);
    setResult(null);

    // Accept both "AFM-XXXXXXXX" and "XXXXXXXX" formats
    const trackingId = cleanInput.startsWith("AFM-") ? cleanInput : `AFM-${cleanInput}`;

    const { data, error } = await supabase
      .from("apply_for_me_requests")
      .select("job_title, status, created_at, admin_notes, verification_code, tracking_id")
      .eq("tracking_id", trackingId)
      .single();

    setLoading(false);

    if (error || !data) {
      setNotFound(true);
    } else {
      setResult(data as TrackResult);
    }
  };

  const cfg = result ? (STATUS_CONFIG[result.status] ?? STATUS_CONFIG.pending) : null;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-10 px-4">
      <div className="max-w-lg mx-auto">

        {/* Back */}
        <Link href="/" className="inline-flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-indigo-600 mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Home
        </Link>

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-11 h-11 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-2xl flex items-center justify-center shadow-lg shrink-0">
            <ClipboardCheck className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-gray-900 dark:text-white">Track Your Request</h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">Apply For Me — Status Check</p>
          </div>
        </div>

        {/* Search Box */}
        <form onSubmit={handleTrack} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm p-5 mb-5">
          <label className="block text-sm font-extrabold text-gray-700 dark:text-gray-300 mb-2">
            Tracking ID daalo
          </label>
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-extrabold text-gray-400 select-none">AFM-</span>
              <input
                type="text"
                value={input.startsWith("AFM-") ? input.slice(4) : input}
                onChange={(e) => setInput("AFM-" + e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 8))}
                placeholder="3A9F72C1"
                maxLength={8}
                className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-mono font-bold text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all uppercase"
              />
            </div>
            <button
              type="submit"
              disabled={loading || input.replace("AFM-", "").length < 6}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-4 py-3 rounded-xl font-bold text-sm transition-all active:scale-95 shrink-0"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              {loading ? "Dhundh..." : "Track"}
            </button>
          </div>
          <p className="text-xs text-gray-400 dark:text-gray-600 mt-2">
            Tracking ID aapko payment ke baad success screen par mila tha — jaise: <span className="font-mono font-bold">AFM-3A9F72C1</span>
          </p>
        </form>

        {/* Not Found */}
        {notFound && (
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-red-200 dark:border-red-800 shadow-sm p-6 text-center">
            <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-3" />
            <h3 className="font-extrabold text-gray-900 dark:text-white mb-1">Request Nahi Mila</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              Yeh Tracking ID hamara system nahi pehchanta. Please ID dobara check karo.
            </p>
            <Link href="/dashboard?tab=requests" className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline">
              Dashboard se bhi status dekh sakte ho →
            </Link>
          </div>
        )}

        {/* Result */}
        {result && cfg && (
          <div className="space-y-3">
            {/* Status Card */}
            <div className={`rounded-2xl border p-5 ${cfg.bg}`}>
              <div className="flex items-center gap-3 mb-3">
                {cfg.icon}
                <div>
                  <p className={`font-extrabold text-base ${cfg.color}`}>{cfg.label}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{cfg.desc}</p>
                </div>
              </div>
            </div>

            {/* Details Card */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm p-5 space-y-3">
              <div>
                <p className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider">Job Title</p>
                <p className="font-extrabold text-gray-900 dark:text-white mt-0.5">{result.job_title}</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider">Tracking ID</p>
                  <p className="font-bold text-indigo-600 dark:text-indigo-400 font-mono text-sm mt-0.5">{result.tracking_id}</p>
                </div>
                <div>
                  <p className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider">Submitted</p>
                  <p className="font-bold text-gray-700 dark:text-gray-300 text-sm mt-0.5">
                    {new Date(result.created_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                  </p>
                </div>
              </div>

              {/* Admin Note if any */}
              {result.admin_notes && !result.admin_notes.startsWith("[Cashfree") && (
                <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800 rounded-xl p-3">
                  <p className="text-[10px] font-extrabold text-indigo-500 uppercase tracking-wider mb-1">Team Message</p>
                  <p className="text-sm text-indigo-800 dark:text-indigo-200">{result.admin_notes}</p>
                </div>
              )}

              {/* Verification code reminder */}
              {result.verification_code && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-xl px-3 py-2 flex items-center gap-2">
                  <span className="text-sm">🔐</span>
                  <div>
                    <p className="text-[10px] font-extrabold text-red-500 uppercase tracking-wider">Your Verification Code</p>
                    <p className="font-mono font-extrabold text-red-700 dark:text-red-300">{result.verification_code}</p>
                    <p className="text-[10px] text-red-400">Team call pe yeh code bolegi — nahi bola = Scammer!</p>
                  </div>
                </div>
              )}
            </div>

            <Link href="/dashboard?tab=requests"
              className="block w-full text-center py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-sm transition-all">
              Dashboard par Full History Dekho →
            </Link>
          </div>
        )}

      </div>
    </div>
  );
}
