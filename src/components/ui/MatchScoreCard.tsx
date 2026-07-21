"use client";
// F2-B: MatchScoreCard — Shows job match score for logged-in users on job detail page

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { calculateMatchScore, type UserProfile, type JobData, type MatchResult } from "@/lib/matchScore";
import Link from "next/link";
import { CheckCircle2, XCircle, AlertCircle, TrendingUp, Zap } from "lucide-react";

interface MatchScoreCardProps {
  job: JobData & { slug?: string };
}

export default function MatchScoreCard({ job }: MatchScoreCardProps) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [result, setResult] = useState<MatchResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDetails, setShowDetails] = useState(false);
  const [showCTABanner, setShowCTABanner] = useState(false);

  useEffect(() => {
    async function fetchAndScore() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) { setLoading(false); return; }

        const { data: profileData } = await supabase
          .from("profiles")
          .select("dob, category, qualification, state, job_preferences, gender")
          .eq("id", session.user.id)
          .single();

        if (!profileData) { setLoading(false); return; }

        const userProfile: UserProfile = {
          dob: profileData.dob,
          category: profileData.category,
          qualification: profileData.qualification,
          state: profileData.state,
          job_preferences: profileData.job_preferences || [],
          gender: profileData.gender,
        };

        setProfile(userProfile);
        const matchResult = calculateMatchScore(job, userProfile);
        setResult(matchResult);

        // Show floating CTA if score is high
        if (matchResult.score >= 80) {
          setTimeout(() => setShowCTABanner(true), 3000);
        }
      } catch (e) {
        console.error("MatchScoreCard error:", e);
      } finally {
        setLoading(false);
      }
    }
    fetchAndScore();
  }, [job]);

  if (loading) return null;
  if (!result) return (
    <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl border border-indigo-100 dark:border-indigo-900/30 p-4 text-center">
      <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400 mb-2">Job Match Score</p>
      <p className="text-xs text-gray-500">
        <Link href="/login" className="text-indigo-600 font-bold underline">Login karein</Link> ya{" "}
        <Link href="/profile-setup" className="text-indigo-600 font-bold underline">profile setup</Link> karein apna job match score dekhne ke liye.
      </p>
    </div>
  );

  const gradeConfig = {
    excellent: { color: "text-green-600 dark:text-green-400",   bg: "bg-green-50 dark:bg-green-900/20",   border: "border-green-200 dark:border-green-800/30", ring: "#16a34a", label: "Excellent Match!" },
    good:      { color: "text-blue-600 dark:text-blue-400",     bg: "bg-blue-50 dark:bg-blue-900/20",     border: "border-blue-200 dark:border-blue-800/30",   ring: "#2563eb", label: "Good Match" },
    fair:      { color: "text-yellow-600 dark:text-yellow-400", bg: "bg-yellow-50 dark:bg-yellow-900/20", border: "border-yellow-200 dark:border-yellow-800/30", ring: "#d97706", label: "Fair Match" },
    low:       { color: "text-red-500 dark:text-red-400",       bg: "bg-red-50 dark:bg-red-900/20",       border: "border-red-200 dark:border-red-800/30",       ring: "#dc2626", label: "Low Match" },
  };
  const cfg = gradeConfig[result.grade];
  const circumference = 2 * Math.PI * 28;
  const offset = circumference - (result.score / 100) * circumference;

  return (
    <>
      {/* Floating High-Match CTA Banner */}
      {showCTABanner && (
        <div className="fixed bottom-20 left-0 right-0 z-40 px-4 flex justify-center pointer-events-none">
          <div className="pointer-events-auto bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-2xl shadow-2xl shadow-green-500/30 px-5 py-4 max-w-sm w-full flex items-center gap-4 animate-in slide-in-from-bottom duration-500">
            <div className="shrink-0 w-10 h-10 bg-white/20 rounded-full flex items-center justify-center text-lg font-black">
              {result.score}%
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-black text-sm leading-tight">Ye job aapke liye perfect hai!</p>
              <p className="text-[11px] text-green-100 mt-0.5">Form galat na ho jaaye — hamare experts se bhara dijiye</p>
            </div>
            <div className="flex flex-col gap-1.5 shrink-0">
              <Link href="/apply-for-me" className="bg-white text-green-700 font-black text-[11px] px-3 py-1.5 rounded-lg whitespace-nowrap">Apply For Me</Link>
              <button onClick={() => setShowCTABanner(false)} className="text-[10px] text-green-200 text-center">Dismiss</button>
            </div>
          </div>
        </div>
      )}

      {/* Match Score Card */}
      <div className={`${cfg.bg} rounded-2xl border ${cfg.border} p-5`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-indigo-500" />
            <p className="text-xs font-black text-gray-700 dark:text-gray-300 uppercase tracking-wider">Your Job Match Score</p>
          </div>
          {result.applyUrgency === "high" && (
            <span className="text-[10px] font-black bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 px-2 py-0.5 rounded-full animate-pulse">⏰ Urgent</span>
          )}
        </div>

        <div className="flex items-center gap-6">
          {/* Score Ring */}
          <div className="shrink-0 relative">
            <svg width="72" height="72" viewBox="0 0 72 72" className="-rotate-90">
              <circle cx="36" cy="36" r="28" fill="none" stroke="#e5e7eb" strokeWidth="6" />
              <circle
                cx="36" cy="36" r="28" fill="none"
                stroke={cfg.ring} strokeWidth="6"
                strokeDasharray={circumference}
                strokeDashoffset={offset}
                strokeLinecap="round"
                style={{ transition: "stroke-dashoffset 1s ease-in-out" }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className={`text-lg font-black ${cfg.color}`}>{result.score}%</span>
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <p className={`text-base font-black ${cfg.color} mb-1`}>{cfg.label}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
              {result.grade === "excellent"
                ? "Bhaiya, ye job bilkul aapke liye bani hai. Jaldi apply karein!"
                : result.grade === "good"
                ? "Ye post aapke liye achi fit hai — serious consideration karein."
                : result.grade === "fair"
                ? "Kuch criteria match hain, kuch nahi. Notification ek baar zaroor padhein."
                : "Is job ke criteria aapki profile se zyada match nahi kar rahe."}
            </p>
          </div>
        </div>

        {/* Expand details */}
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="mt-3 text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
        >
          {showDetails ? "Details chhupao ▲" : "Score breakdown dekho ▼"}
        </button>

        {showDetails && (
          <div className="mt-3 space-y-2">
            {result.reasons.map((r, i) => (
              <div key={i} className="flex items-start gap-2 text-[11px] text-green-700 dark:text-green-400">
                <CheckCircle2 className="h-3.5 w-3.5 shrink-0 mt-0.5 text-green-500" />
                <span>{r}</span>
              </div>
            ))}
            {result.warnings.map((w, i) => (
              <div key={i} className="flex items-start gap-2 text-[11px] text-orange-600 dark:text-orange-400">
                <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5 text-orange-400" />
                <span>{w}</span>
              </div>
            ))}
            {(result.reasons.length + result.warnings.length === 0) && (
              <p className="text-[11px] text-gray-400">Profile complete karein better breakdown ke liye.</p>
            )}
          </div>
        )}

        <div className="mt-4 flex items-center gap-2">
          <Link
            href="/apply-for-me"
            className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black rounded-xl text-center transition-all"
          >
            <Zap className="inline h-3.5 w-3.5 mr-1" />Apply For Me ✨
          </Link>
          <Link
            href="/profile-setup?mode=edit"
            className="px-3 py-2.5 bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 text-gray-600 dark:text-gray-300 text-[11px] font-bold rounded-xl transition-all whitespace-nowrap"
          >
            Update Profile
          </Link>
        </div>
      </div>
    </>
  );
}
