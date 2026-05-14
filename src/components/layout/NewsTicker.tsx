"use client";

import { useState, useEffect } from "react";
import { Radio } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function NewsTicker() {
  const [tickers, setTickers] = useState<{ title: string; url: string }[]>([]);

  useEffect(() => {
    const fetchTickers = async () => {
      const { data } = await supabase
        .from("tickers")
        .select("title, url")
        .eq("status", "active")
        .order("created_at", { ascending: false });

      if (data && data.length > 0) setTickers(data);
    };
    fetchTickers();
  }, []);

  if (tickers.length === 0) return null;

  // Speed: items * 5s per item — feel free to tune px/s below
  const itemCount = tickers.length;
  // ~120px per item at 40px/s → adjust duration for more/fewer items
  const duration = Math.max(18, itemCount * 6);

  // Triple-clone for seamless infinite scroll
  const looped = [...tickers, ...tickers, ...tickers];

  return (
    <>
      <style>{`
        @keyframes ticker-run {
          from { transform: translateX(0); }
          to   { transform: translateX(-33.333%); }
        }
        .ticker-belt {
          display: flex;
          width: max-content;
          animation: ticker-run ${duration}s linear infinite;
          will-change: transform;
        }
        .ticker-belt:hover {
          animation-play-state: paused;
        }
      `}</style>

      <div className="w-full overflow-hidden flex items-stretch h-9 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 border-b border-slate-700/60 dark:border-gray-800">

        {/* ── LIVE Badge ── */}
        <div className="shrink-0 flex items-center gap-1.5 px-3 sm:px-4 bg-red-600 text-white select-none z-10">
          {/* Pulsing dot */}
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-300 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-white" />
          </span>
          <span className="text-[11px] font-black tracking-[0.18em] uppercase">Live</span>
        </div>

        {/* Thin separator */}
        <div className="w-px bg-red-400/40 shrink-0" />

        {/* ── Scrolling Belt ── */}
        <div className="overflow-hidden flex-1 flex items-center">
          <div className="ticker-belt">
            {looped.map((t, i) => (
              <a
                key={i}
                href={t.url}
                className="inline-flex items-center gap-2 text-[12px] sm:text-[13px] font-semibold text-slate-300 hover:text-amber-400 transition-colors duration-200 px-5 sm:px-7 whitespace-nowrap"
              >
                {/* Diamond bullet */}
                <span className="text-red-500 text-[8px]">◆</span>
                {t.title}
              </a>
            ))}
          </div>
        </div>

        {/* Right fade mask */}
        <div className="pointer-events-none absolute right-0 top-0 h-9 w-16 bg-gradient-to-l from-slate-900 to-transparent z-10 hidden sm:block" />
      </div>
    </>
  );
}
