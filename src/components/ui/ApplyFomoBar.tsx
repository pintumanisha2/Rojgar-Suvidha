"use client";
// ── ApplyFomoBar ──────────────────────────────────────────────────────────────
// Shows "X people used Apply For Me for this job" — increases every few minutes
// Used on: /apply/[id] form page AND /job/[slug] detail page

import { useEffect, useRef, useState } from "react";
import { Users, Zap, Clock } from "lucide-react";

// ── Deterministic base count per form/job ─────────────────────────────────────
const CATEGORY_SEEDS: Record<string, [number, number]> = {
  ssc:        [847,  2341],
  railway:    [623,  1876],
  banking:    [412,   987],
  upsc:       [234,   678],
  police:     [521,  1234],
  defence:    [387,   876],
  "state-psc":[198,   543],
  teaching:   [156,   423],
  "latest-jobs":[312, 876],
  results:    [45,    120],
  "admit-card":[23,    67],
  default:    [87,    312],
};

function getSlugSeed(identifier: string, category = "default"): number {
  const range = CATEGORY_SEEDS[category] ?? CATEGORY_SEEDS.default;
  const [min, max] = range;
  const hash = identifier
    .split("")
    .reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const ratio = (hash % 1000) / 1000;
  return Math.floor(min + ratio * (max - min));
}

// ── Live viewer pseudo-count ───────────────────────────────────────────────────
function getLiveViewers(identifier: string): number {
  const hash = identifier.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  const base = 15 + (hash % 31); // 15–45
  // Slightly oscillate with time so it looks "live"
  const minute = Math.floor(Date.now() / (3 * 60 * 1000)); // changes every 3 min
  const oscillate = ((minute * 7 + hash) % 11) - 5; // ±5
  return Math.max(8, base + oscillate);
}

interface ApplyFomoBarProps {
  /** form id (from custom_forms) OR job slug */
  identifier: string;
  /** category of the job — controls seed range */
  category?: string;
  /** optional last date string to show urgency */
  lastDate?: string;
  /** compact = single line for apply form page */
  compact?: boolean;
}

export default function ApplyFomoBar({
  identifier,
  category = "default",
  lastDate,
  compact = false,
}: ApplyFomoBarProps) {
  const baseSeed              = getSlugSeed(identifier, category);
  const [count, setCount]     = useState(baseSeed);
  const [viewers, setViewers] = useState(() => getLiveViewers(identifier));
  const [daysLeft, setDaysLeft] = useState<number | null>(null);
  const accRef                = useRef(0); // fractional accumulator

  // Add 1 apply every ~4-8 minutes (realistic: not too fast)
  // Rate: ~200-300 per day total across all jobs
  const RATE_PER_SECOND = 1 / (60 * 5); // 1 per 5 minutes

  useEffect(() => {
    // Live viewers refresh every 3 minutes
    const viewerTimer = setInterval(() => {
      setViewers(getLiveViewers(identifier));
    }, 3 * 60 * 1000);

    // Apply count tick every 10 seconds
    const countTimer = setInterval(() => {
      accRef.current += 10 * RATE_PER_SECOND;
      const whole = Math.floor(accRef.current);
      if (whole > 0) {
        accRef.current -= whole;
        setCount((prev) => prev + whole);
      }
    }, 10_000);

    return () => {
      clearInterval(viewerTimer);
      clearInterval(countTimer);
    };
  }, [identifier]);

  // Days left calculation
  useEffect(() => {
    if (!lastDate) return;
    try {
      const target = new Date(lastDate);
      if (!isNaN(target.getTime())) {
        const diff = Math.ceil((target.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
        if (diff >= 0) setDaysLeft(diff);
      }
    } catch {}
  }, [lastDate]);

  const isUrgent = daysLeft !== null && daysLeft <= 5;

  if (compact) {
    // ── Compact version: single line for /apply/[id] page ─────────────────
    return (
      <div className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold
        ${isUrgent
          ? "bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40"
          : "bg-indigo-50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/30"
        }`}>
        <span className="flex items-center gap-1.5 shrink-0">
          <span className="relative flex h-2 w-2">
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75
              ${isUrgent ? "bg-red-400" : "bg-green-400"}`} />
            <span className={`relative inline-flex rounded-full h-2 w-2
              ${isUrgent ? "bg-red-500" : "bg-green-500"}`} />
          </span>
        </span>

        <span className={isUrgent ? "text-red-700 dark:text-red-400" : "text-indigo-700 dark:text-indigo-300"}>
          <span className="font-black">{count.toLocaleString("en-IN")}</span> aspirants ne is job ke liye Apply For Me use kiya
        </span>

        {isUrgent && daysLeft !== null && (
          <span className="ml-auto shrink-0 text-xs font-black text-red-600 dark:text-red-400 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            {daysLeft === 0 ? "Aaj last day!" : `${daysLeft} din baaki`}
          </span>
        )}
      </div>
    );
  }

  // ── Full version: 2-row card for job detail page ──────────────────────────
  return (
    <div className={`rounded-2xl border overflow-hidden
      ${isUrgent
        ? "border-red-200 dark:border-red-900/40 bg-red-50/50 dark:bg-red-950/10"
        : "border-indigo-100 dark:border-indigo-900/30 bg-indigo-50/30 dark:bg-indigo-950/10"
      }`}>

      {/* Row 1: Apply count */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-white/50 dark:border-zinc-800/50">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0
          ${isUrgent ? "bg-red-100 dark:bg-red-900/30" : "bg-indigo-100 dark:bg-indigo-900/30"}`}>
          <Users className={`w-4 h-4 ${isUrgent ? "text-red-600 dark:text-red-400" : "text-indigo-600 dark:text-indigo-400"}`} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-black text-gray-400 uppercase tracking-wider leading-none mb-0.5">
            Apply For Me Users
          </p>
          <p className={`text-sm font-black leading-tight
            ${isUrgent ? "text-red-700 dark:text-red-300" : "text-gray-900 dark:text-white"}`}>
            <span className="text-base">{count.toLocaleString("en-IN")}</span> aspirants ne ye form bhara
          </p>
        </div>
        <Zap className="w-4 h-4 text-yellow-500 shrink-0 animate-pulse" />
      </div>

      {/* Row 2: Live viewers + urgency */}
      <div className="flex items-center justify-between gap-2 px-4 py-2.5">
        <span className="flex items-center gap-1.5 text-xs font-bold text-gray-500 dark:text-gray-400">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
          </span>
          <span className="font-black text-green-600 dark:text-green-400">{viewers}</span> log abhi dekh rahe hain
        </span>

        {isUrgent && daysLeft !== null ? (
          <span className="text-xs font-black text-red-600 dark:text-red-400 flex items-center gap-1 animate-pulse">
            <Clock className="w-3 h-3" />
            {daysLeft === 0 ? "Aaj last day!" : `Sirf ${daysLeft} din baaki!`}
          </span>
        ) : daysLeft !== null ? (
          <span className="text-xs font-semibold text-gray-400 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {daysLeft} din baaki
          </span>
        ) : null}
      </div>
    </div>
  );
}
