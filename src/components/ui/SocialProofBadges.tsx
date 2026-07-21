"use client";
// F4-B: SocialProofBadges — Urgency and trust signal badges on job page

import { useEffect, useState } from "react";
import { Eye, Users, ShieldAlert, Award } from "lucide-react";

interface SocialProofBadgesProps {
  slug: string;
  lastDate?: string;
}

export default function SocialProofBadges({ slug, lastDate }: SocialProofBadgesProps) {
  const [data, setData] = useState<{
    weeklyViews: number;
    applyForMeOrders: number;
    totalSubscribers: number;
  } | null>(null);

  const [daysLeft, setDaysLeft] = useState<number | null>(null);

  useEffect(() => {
    async function fetchSocialProof() {
      try {
        const res = await fetch(`/api/social-proof?slug=${slug}`);
        if (res.ok) {
          const json = await res.json();
          setData(json);
        }
      } catch (err) {
        console.error("SocialProofBadges fetch error:", err);
      }
    }
    fetchSocialProof();
  }, [slug]);

  useEffect(() => {
    if (lastDate) {
      try {
        const target = new Date(lastDate);
        if (!isNaN(target.getTime())) {
          const diffTime = target.getTime() - Date.now();
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          if (diffDays >= 0) {
            setDaysLeft(diffDays);
          }
        }
      } catch {}
    }
  }, [lastDate]);

  if (!data) return null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
      {/* Views Badge */}
      <div className="flex items-center gap-3 bg-white dark:bg-zinc-950 border border-gray-100 dark:border-zinc-900 rounded-2xl p-4 shadow-sm">
        <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
          <Eye className="h-5 w-5" />
        </div>
        <div>
          <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Weekly Views</p>
          <p className="text-sm font-black text-gray-900 dark:text-white mt-0.5">
            {data.weeklyViews.toLocaleString()}+ aspirants visited
          </p>
        </div>
      </div>

      {/* Orders Badge */}
      <div className="flex items-center gap-3 bg-white dark:bg-zinc-950 border border-gray-100 dark:border-zinc-900 rounded-2xl p-4 shadow-sm">
        <div className="w-10 h-10 rounded-xl bg-green-50 dark:bg-green-950/40 flex items-center justify-center text-green-600 dark:text-green-400 shrink-0">
          <Award className="h-5 w-5" />
        </div>
        <div>
          <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Form Assistance</p>
          <p className="text-sm font-black text-gray-900 dark:text-white mt-0.5">
            {data.applyForMeOrders} applied via experts
          </p>
        </div>
      </div>

      {/* Urgency Alert or Subscribers Badge */}
      {daysLeft !== null && daysLeft <= 7 ? (
        <div className="flex items-center gap-3 bg-red-50/50 dark:bg-red-950/10 border border-red-100 dark:border-red-900/30 rounded-2xl p-4 shadow-sm animate-pulse">
          <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-red-600 dark:text-red-400 shrink-0">
            <ShieldAlert className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs text-red-500 font-black uppercase tracking-wider">URGENT DEADLINE</p>
            <p className="text-sm font-black text-red-700 dark:text-red-400 mt-0.5">
              Only {daysLeft} {daysLeft === 1 ? "day" : "days"} left to apply!
            </p>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-3 bg-white dark:bg-zinc-950 border border-gray-100 dark:border-zinc-900 rounded-2xl p-4 shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-orange-50 dark:bg-orange-950/40 flex items-center justify-center text-orange-600 dark:text-orange-400 shrink-0">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Instant Alerts</p>
            <p className="text-sm font-black text-gray-900 dark:text-white mt-0.5">
              {data.totalSubscribers.toLocaleString()}+ active subscribers
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
