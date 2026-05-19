"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { ClipboardCheck, Loader2, Download, Clock, CheckCircle2, AlertCircle, RefreshCw } from "lucide-react";

const STATUS_STEPS = ["pending", "in_progress", "completed"];

const STATUS_CONFIG: Record<string, { label: string; desc: string; color: string; bg: string; icon: React.ReactNode }> = {
  pending:     { label: "Request Received",  desc: "Aapki request hume mil gayi. Hum jald kaam shuru karenge.", color: "text-amber-700",  bg: "bg-amber-100 dark:bg-amber-900/30",  icon: <Clock className="w-5 h-5" /> },
  in_progress: { label: "Form Filling",      desc: "Hum abhi aapka form fill kar rahe hain.",                 color: "text-blue-700",   bg: "bg-blue-100 dark:bg-blue-900/30",   icon: <RefreshCw className="w-5 h-5" /> },
  completed:   { label: "Completed! ✅",     desc: "Aapka form bhar diya gaya hai. Receipt download karein.", color: "text-green-700",  bg: "bg-green-100 dark:bg-green-900/30", icon: <CheckCircle2 className="w-5 h-5" /> },
  rejected:    { label: "Rejected",          desc: "Kisi wajah se request process nahi ho payi.",            color: "text-red-700",    bg: "bg-red-100 dark:bg-red-900/30",     icon: <AlertCircle className="w-5 h-5" /> },
};

export default function TrackApplicationPage() {
  const [user, setUser] = useState<any>(null);
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [notLoggedIn, setNotLoggedIn] = useState(false);

  // For guest tracking by mobile
  const [mobileInput, setMobileInput] = useState("");
  const [guestResults, setGuestResults] = useState<any[] | null>(null);
  const [guestLoading, setGuestLoading] = useState(false);
  const [guestError, setGuestError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setNotLoggedIn(true);
        setLoading(false);
        return;
      }
      setUser(session.user);
      const { data } = await supabase
        .from("apply_for_me_requests")
        .select("*")
        .eq("user_id", session.user.id)
        .order("created_at", { ascending: false });
      setRequests(data || []);
      setLoading(false);
    };
    fetchData();
  }, []);

  const handleGuestTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    setGuestLoading(true);
    setGuestError(null);
    setGuestResults(null);

    const { data, error } = await supabase
      .from("apply_for_me_requests")
      .select("*")
      .eq("phone_number", mobileInput.replace(/\D/g, ""))
      .order("created_at", { ascending: false });

    if (error || !data || data.length === 0) {
      setGuestError("Is mobile number par koi application nahi mili. Sahi number daalo.");
    } else {
      setGuestResults(data);
    }
    setGuestLoading(false);
  };

  const RequestCard = ({ req }: { req: any }) => {
    const cfg = STATUS_CONFIG[req.status] || STATUS_CONFIG.pending;
    const stepIdx = STATUS_STEPS.indexOf(req.status);

    const TIMELINE_STEPS = [
      { key: "pending", label: "Application Received", desc: "Aapki request hume mil gayi", icon: "📥", color: "indigo" },
      { key: "in_progress", label: "Form Filling Started", desc: "Team ne kaam shuru kar diya", icon: "✍️", color: "blue" },
      { key: "completed", label: "Form Submitted! ✅", desc: "Sarkari form successfully bhar diya gaya", icon: "🎉", color: "green" },
    ];

    return (
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
        {/* Card Header */}
        <div className="p-5 border-b border-gray-100 dark:border-gray-800 flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h3 className="font-extrabold text-gray-900 dark:text-white text-lg">{req.job_title}</h3>
            <p className="text-xs text-gray-400 mt-0.5">
              Submitted: {new Date(req.created_at).toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
            </p>
          </div>
          <span className={`text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5 ${cfg.bg} ${cfg.color} shrink-0`}>
            {cfg.icon} {cfg.label}
          </span>
        </div>

        {/* Visual Timeline */}
        {req.status !== "rejected" && (
          <div className="px-5 pt-5 pb-2">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Application Timeline</p>
            <div className="relative">
              {/* Vertical line */}
              <div className="absolute left-4 top-4 bottom-4 w-0.5 bg-gray-100 dark:bg-gray-800" />
              <div className="space-y-4">
                {TIMELINE_STEPS.map((step, i) => {
                  const done = i <= stepIdx;
                  const isCurrent = i === stepIdx;
                  return (
                    <div key={step.key} className="flex items-start gap-4 relative">
                      {/* Circle */}
                      <div className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center text-sm shrink-0 transition-all
                        ${done ? "bg-indigo-600 shadow-lg shadow-indigo-600/30" : "bg-gray-100 dark:bg-gray-800"}
                        ${isCurrent ? "ring-4 ring-indigo-100 dark:ring-indigo-900 animate-pulse" : ""}`}>
                        {done ? <span className="text-white text-xs">{i < stepIdx ? "✓" : step.icon}</span>
                               : <span className="text-gray-400 text-xs">{i + 1}</span>}
                      </div>
                      {/* Content */}
                      <div className={`flex-1 pb-2 ${done ? "" : "opacity-40"}`}>
                        <p className={`text-sm font-bold ${done ? "text-gray-900 dark:text-white" : "text-gray-400"}`}>
                          {step.label}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">{step.desc}</p>
                        {isCurrent && (
                          <span className="inline-flex items-center gap-1 mt-1 text-[10px] font-bold bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded-full">
                            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse inline-block" /> Current Status
                          </span>
                        )}
                        {i === 0 && done && (
                          <p className="text-[10px] text-gray-400 mt-0.5">
                            {new Date(req.created_at).toLocaleString("en-IN")}
                          </p>
                        )}
                        {i === stepIdx && i > 0 && req.updated_at && (
                          <p className="text-[10px] text-gray-400 mt-0.5">
                            {new Date(req.updated_at).toLocaleString("en-IN")}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Status Description & Admin Note */}
        <div className="px-5 pb-5 space-y-3 mt-2">
          <div className={`rounded-xl p-4 ${cfg.bg}`}>
            <p className={`text-sm font-bold ${cfg.color}`}>{cfg.desc}</p>
          </div>

          {(() => {
            const displayAdminNote = req.admin_notes ? req.admin_notes.split('--- E-SUVIDHA DETAILS ---')[0].trim() : "";
            if (displayAdminNote && !displayAdminNote.startsWith("[Cashfree")) {
              return (
                <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800 rounded-xl p-4">
                  <p className="text-xs font-bold text-indigo-500 mb-1">💬 Message from Team:</p>
                  <p className="text-sm text-indigo-800 dark:text-indigo-300 font-medium">{displayAdminNote}</p>
                </div>
              );
            }
            return null;
          })()}

          {/* RECEIPT DOWNLOAD */}
          {req.final_receipt_url && (
            <a
              href={req.final_receipt_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-3 w-full py-4 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white rounded-xl font-extrabold text-base shadow-lg shadow-green-500/30 transition-all"
            >
              <Download className="w-5 h-5" />
              Receipt / Confirmation Download Karein
            </a>
          )}
        </div>
      </div>
    );
  };



  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex-1 bg-gray-50 dark:bg-gray-950 py-10 px-4">
      <div className="max-w-3xl mx-auto">

        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center bg-indigo-100 dark:bg-indigo-900/30 p-4 rounded-full mb-4">
            <ClipboardCheck className="w-10 h-10 text-indigo-600 dark:text-indigo-400" />
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 dark:text-white mb-3">
            Track Your Application
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            Apne "Apply For Me" requests ka status aur receipt yahan dekho
          </p>
        </div>

        {/* LOGGED IN: Show all requests */}
        {user && (
          <div className="space-y-5">
            {requests.length === 0 ? (
              <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-16 text-center shadow-sm">
                <ClipboardCheck className="w-14 h-14 text-gray-300 dark:text-gray-700 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Koi Application Nahi Mili</h3>
                <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-sm mx-auto">
                  Abhi tak aapne koi "Apply For Me" request nahi dali hai.
                </p>
                <a href="/apply-for-me"
                  className="inline-block bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-lg shadow-orange-500/30">
                  Pehli Request Daalo
                </a>
              </div>
            ) : (
              requests.map(req => <RequestCard key={req.id} req={req} />)
            )}
          </div>
        )}

        {/* GUEST: Track by Mobile */}
        {notLoggedIn && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 p-8 shadow-sm">
              <h2 className="text-lg font-extrabold text-gray-900 dark:text-white mb-2">Mobile Number se Track Karo</h2>
              <p className="text-sm text-gray-500 mb-5">Wahi mobile number daalo jo aapne "Apply For Me" form submit karte waqt diya tha.</p>
              <form onSubmit={handleGuestTrack} className="flex gap-3">
                <input
                  type="tel"
                  value={mobileInput}
                  onChange={e => setMobileInput(e.target.value)}
                  placeholder="e.g. 9876543210"
                  className="flex-1 bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                  maxLength={10}
                />
                <button type="submit" disabled={guestLoading || mobileInput.length < 10}
                  className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-sm transition-all disabled:opacity-60 flex items-center gap-2">
                  {guestLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Track"}
                </button>
              </form>
              {guestError && <p className="mt-3 text-sm font-bold text-red-500">{guestError}</p>}
            </div>

            {guestResults && (
              <div className="space-y-5">
                <h3 className="font-extrabold text-gray-900 dark:text-white text-lg">{guestResults.length} application(s) mili</h3>
                {guestResults.map(req => <RequestCard key={req.id} req={req} />)}
              </div>
            )}

            <div className="text-center">
              <p className="text-sm text-gray-500">
                Seedha apna Dashboard dekhna chahte ho?{" "}
                <a href="/login" className="font-bold text-indigo-600 hover:underline">Login Karo</a>
              </p>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
