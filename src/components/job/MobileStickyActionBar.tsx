"use client";

import { ExternalLink, Sparkles } from "lucide-react";

interface MobileStickyActionBarProps {
  applyLink?: string | null;
  title: string;
  slug: string;
  category?: string;
}

export default function MobileStickyActionBar({
  applyLink,
  title,
  slug,
  category = "job",
}: MobileStickyActionBarProps) {
  const isResult = category?.includes("result");
  const isAdmit = category?.includes("admit");
  const isKey = category?.includes("answer");

  const primaryLabel = isResult
    ? "रिजल्ट देखें (Check Result)"
    : isAdmit
    ? "एडमिट कार्ड डाउनलोड करें"
    : isKey
    ? "उत्तर कुंजी देखें (Answer Key)"
    : "ऑनलाइन आवेदन करें (Apply)";

  const customApplyUrl = `/e-suvidha/apply/${slug}?title=${encodeURIComponent(title)}`;

  return (
    <div className="md:hidden fixed bottom-[60px] left-0 w-full z-40 px-3 pb-2 pointer-events-none">
      <div className="bg-slate-900/95 dark:bg-zinc-900/95 backdrop-blur-md border border-slate-700/80 rounded-2xl p-2 shadow-2xl flex items-center gap-2 pointer-events-auto">
        {/* Direct Apply / Download Button */}
        {applyLink ? (
          <a
            href={applyLink}
            target="_blank"
            rel="noopener noreferrer"
            className={`flex-1 py-3 px-3 rounded-xl font-black text-xs text-white text-center flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition-all ${
              isResult
                ? "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/30"
                : isAdmit
                ? "bg-amber-500 hover:bg-amber-600 shadow-amber-500/30"
                : isKey
                ? "bg-purple-600 hover:bg-purple-700 shadow-purple-600/30"
                : "bg-blue-600 hover:bg-blue-700 shadow-blue-600/30"
            }`}
          >
            <span className="line-clamp-1">{primaryLabel}</span>
            <ExternalLink className="w-3.5 h-3.5 shrink-0 stroke-[2.5px]" />
          </a>
        ) : (
          <a
            href="#important-links"
            className="flex-1 py-3 px-3 rounded-xl font-black text-xs text-white bg-blue-600 hover:bg-blue-700 text-center flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition-all"
          >
            <span>महत्वपूर्ण लिंक्स देखें</span>
          </a>
        )}

        {/* Apply For Me Button (High-Intent Conversion) */}
        <a
          href={customApplyUrl}
          className="flex-1 py-3 px-3 rounded-xl font-extrabold text-xs text-amber-950 bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-400 hover:from-amber-500 hover:to-yellow-500 text-center flex items-center justify-center gap-1.5 shadow-md shadow-amber-500/20 active:scale-95 transition-all border border-amber-300/40"
        >
          <Sparkles className="w-3.5 h-3.5 shrink-0 text-amber-950 fill-amber-950" />
          <span className="line-clamp-1">फॉर्म भरवाएं (₹99)</span>
        </a>
      </div>
    </div>
  );
}
