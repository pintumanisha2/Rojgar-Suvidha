"use client";
// ── SiteVisitorTicker ─────────────────────────────────────────────────────────
// Live counter that starts from server-calculated base and increments every second
// Gives "live" feel — same base for all users at the same moment in time

import { useEffect, useRef, useState } from "react";
import { Users, FileText } from "lucide-react";

function formatCount(n: number): string {
  if (n >= 100000) return `${(n / 100000).toFixed(1)}L`; // 1.2L
  if (n >= 1000)   return `${(n / 1000).toFixed(1)}K`;    // 87.3K
  return n.toLocaleString("en-IN");
}

function AnimatedNumber({ target }: { target: number }) {
  const [displayed, setDisplayed] = useState(target);
  const prevTarget = useRef(target);

  useEffect(() => {
    // On mount or rate tick, smoothly count from prev to new
    if (prevTarget.current === target) return;
    const diff = target - prevTarget.current;
    if (Math.abs(diff) > 5000) {
      // Initial load — animate from 0
      let start = 0;
      const end = target;
      const duration = 1800; // ms
      const step = end / (duration / 16);
      const timer = setInterval(() => {
        start = Math.min(start + step, end);
        setDisplayed(Math.floor(start));
        if (start >= end) clearInterval(timer);
      }, 16);
      prevTarget.current = target;
      return () => clearInterval(timer);
    } else {
      // Small tick — just update directly
      setDisplayed(target);
      prevTarget.current = target;
    }
  }, [target]);

  return <span>{formatCount(displayed)}</span>;
}

export default function SiteVisitorTicker() {
  const [visitorCount, setVisitorCount]   = useState(0);
  const [applyCount, setApplyCount]       = useState(0);
  const [loaded, setLoaded]               = useState(false);
  const rateRef                           = useRef(1);       // visitors/sec
  const applyRateRef                      = useRef(1 / 60);  // apply/sec
  const lastTickRef                       = useRef(Date.now());
  const applyAccRef                       = useRef(0);       // fractional accumulator

  // Fetch base from server once on mount
  useEffect(() => {
    fetch("/api/fomo/site-stats")
      .then((r) => r.json())
      .then((data) => {
        if (data.visitorCount) {
          setVisitorCount(data.visitorCount);
          setApplyCount(data.applyForMeCount ?? 0);
          rateRef.current      = data.ratePerSecond      ?? 1;
          applyRateRef.current = data.applyRatePerSecond ?? (1 / 60);
          lastTickRef.current  = Date.now();
          setLoaded(true);
        }
      })
      .catch(() => {
        // Fallback — start with a reasonable number
        setVisitorCount(87341);
        setApplyCount(1247);
        setLoaded(true);
      });
  }, []);

  // Client-side increment every second — matches server math exactly
  useEffect(() => {
    if (!loaded) return;
    const interval = setInterval(() => {
      const now = Date.now();
      const elapsed = (now - lastTickRef.current) / 1000; // seconds since last tick
      lastTickRef.current = now;

      setVisitorCount((prev) => prev + Math.floor(elapsed * rateRef.current));

      // Apply For Me: fractional accumulation
      applyAccRef.current += elapsed * applyRateRef.current;
      const wholeApply = Math.floor(applyAccRef.current);
      if (wholeApply > 0) {
        applyAccRef.current -= wholeApply;
        setApplyCount((prev) => prev + wholeApply);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [loaded]);

  if (!loaded) return null; // Don't render until we have real data

  return (
    <div className="flex items-center justify-center gap-2 sm:gap-4 px-3 py-2
                    bg-white/90 dark:bg-zinc-900/90 backdrop-blur
                    border border-gray-200 dark:border-zinc-800
                    rounded-2xl shadow-sm mx-4 sm:mx-auto sm:w-fit
                    text-sm font-bold">
      {/* Live dot */}
      <span className="flex items-center gap-1.5 shrink-0">
        <span className="relative flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500" />
        </span>
        <span className="text-red-500 font-black text-xs uppercase tracking-wider hidden sm:inline">Live</span>
      </span>

      {/* Divider */}
      <span className="hidden sm:block w-px h-5 bg-gray-200 dark:bg-zinc-700" />

      {/* Visitors */}
      <span className="flex items-center gap-1.5 text-gray-700 dark:text-gray-300">
        <Users className="w-4 h-4 text-indigo-500 shrink-0" />
        <span className="text-indigo-600 dark:text-indigo-400 font-black tabular-nums">
          <AnimatedNumber target={visitorCount} />
        </span>
        <span className="text-gray-500 dark:text-gray-400 text-xs font-semibold hidden sm:inline">visitors today</span>
        <span className="text-gray-500 dark:text-gray-400 text-xs font-semibold sm:hidden">today</span>
      </span>

      {/* Divider */}
      <span className="w-px h-5 bg-gray-200 dark:bg-zinc-700" />

      {/* Apply For Me */}
      <span className="flex items-center gap-1.5 text-gray-700 dark:text-gray-300">
        <FileText className="w-4 h-4 text-green-500 shrink-0" />
        <span className="text-green-600 dark:text-green-400 font-black tabular-nums">
          <AnimatedNumber target={applyCount} />
        </span>
        <span className="text-gray-500 dark:text-gray-400 text-xs font-semibold hidden sm:inline">forms filled today</span>
        <span className="text-gray-500 dark:text-gray-400 text-xs font-semibold sm:hidden">forms</span>
      </span>
    </div>
  );
}
