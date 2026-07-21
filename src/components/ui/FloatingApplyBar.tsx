"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ExternalLink, Sparkles, X } from "lucide-react";

interface FloatingApplyBarProps {
  applyLink?: string | null;
  customApplyLink?: string | null;
  jobTitle: string;
  jobSlug: string;
}

export default function FloatingApplyBar({
  applyLink,
  customApplyLink,
  jobTitle,
  jobSlug,
}: FloatingApplyBarProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    // Check if dismissed in current session for this specific job
    if (typeof window !== "undefined") {
      const dismissed = sessionStorage.getItem(`rs_dismissed_apply_bar_${jobSlug}`);
      if (dismissed === "true") {
        setIsDismissed(true);
        return;
      }
    }

    // 3-second delay timer before sliding up
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 3000);

    return () => clearTimeout(timer);
  }, [jobSlug]);

  const handleClose = () => {
    setIsVisible(false);
    setIsDismissed(true);
    if (typeof window !== "undefined") {
      sessionStorage.setItem(`rs_dismissed_apply_bar_${jobSlug}`, "true");
    }
  };

  if (isDismissed || !isVisible) return null;

  const finalApplyForMeLink =
    customApplyLink || `/apply-for-me?jobSlug=${encodeURIComponent(jobSlug)}&jobTitle=${encodeURIComponent(jobTitle)}`;

  return (
    <div
      aria-label="Quick Job Application Actions"
      className="md:hidden fixed bottom-[72px] left-3 right-3 z-40 transition-all duration-500 ease-out transform translate-y-0 opacity-100 animate-in slide-in-from-bottom-5"
    >
      <div className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border border-indigo-200/80 dark:border-indigo-800/80 shadow-[0_8px_32px_rgba(79,70,229,0.25)] rounded-2xl p-3 relative overflow-hidden">
        {/* Glow accent line */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-indigo-500 to-purple-500" />

        {/* Top row: Job title preview & Close Button */}
        <div className="flex items-center justify-between gap-2 mb-2 pr-6">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping shrink-0" />
            <p className="text-[11px] font-extrabold text-gray-900 dark:text-white truncate">
              {jobTitle}
            </p>
          </div>

          <button
            onClick={handleClose}
            className="absolute top-2 right-2 p-1 rounded-full text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            aria-label="Close apply popup"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Action Buttons Row */}
        <div className="flex items-center gap-2">
          {applyLink && (
            <a
              href={applyLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 inline-flex items-center justify-center gap-1 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-black rounded-xl shadow-md transition-all text-center"
            >
              <span>Apply Official</span>
              <ExternalLink className="w-3 h-3 shrink-0" />
            </a>
          )}

          <Link
            href={finalApplyForMeLink}
            target={finalApplyForMeLink.startsWith("http") ? "_blank" : "_self"}
            className="flex-1 inline-flex items-center justify-center gap-1 px-3 py-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 active:scale-95 text-white text-xs font-black rounded-xl shadow-md shadow-indigo-500/20 transition-all text-center"
          >
            <Sparkles className="w-3 h-3 text-yellow-300 shrink-0" />
            <span>Apply For Me</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
