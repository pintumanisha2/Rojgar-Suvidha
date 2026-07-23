"use client";
// ── ApplyFomoBar ──────────────────────────────────────────────────────────────
// Shows "X people used Apply For Me for this job" — increases dynamically
// Used on: /apply/[id] form page AND /job/[slug] detail page

import { useEffect, useRef, useState } from "react";
import { Users, Zap, Clock } from "lucide-react";

function hashString(str: string): number {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 33) ^ str.charCodeAt(i);
  }
  return Math.abs(hash);
}

// ── Deterministic base count per form/job ─────────────────────────────────────
const CATEGORY_SEEDS: Record<string, [number, number]> = {
  ssc:          [680, 2450],
  railway:      [520, 1980],
  banking:      [380, 1420],
  upsc:         [290, 1150],
  police:       [450, 1680],
  defence:      [360, 1290],
  "state-psc":  [210,  890],
  teaching:     [180,  760],
  "latest-jobs":[340, 1250],
  results:      [85,   320],
  "admit-card": [65,   240],
  default:      [120,  650],
};

function getSlugSeed(identifier: string, category = "default"): number {
  const range = CATEGORY_SEEDS[category] ?? CATEGORY_SEEDS.default;
  const [min, max] = range;
  const hash = hashString(identifier);
  const ratio = (hash % 1000) / 1000;
  return Math.floor(min + ratio * (max - min));
}

// ── Live viewer pseudo-count with smooth real-time oscillation ────────────────
function getLiveViewers(identifier: string, step = 0): number {
  const hash = hashString(identifier);
  const base = 16 + (hash % 34); // 16–50 viewers
  // Real-time oscillation every few seconds
  const oscillate = Math.floor(Math.sin((step + (hash % 10)) * 0.5) * 6); // ±6
  return Math.max(9, base + oscillate);
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
  const baseSeed                = getSlugSeed(identifier, category);
  const [count, setCount]       = useState(baseSeed);
  const [step, setStep]         = useState(0);
  const [viewers, setViewers]   = useState(() => getLiveViewers(identifier, 0));
  const [daysLeft, setDaysLeft] = useState<number | null>(null);
  const accRef                  = useRef(0);

  // Add 1 apply every ~3-6 minutes realistically
  const RATE_PER_SECOND = 1 / (60 * 4);

  useEffect(() => {
    // Live viewers fluctuate every 5 seconds dynamically
    const viewerTimer = setInterval(() => {
      setStep((prev) => {
        const nextStep = prev + 1;
        setViewers(getLiveViewers(identifier, nextStep));
        return nextStep;
      });
    }, 5000);

    // Apply count tick every 8 seconds
    const countTimer = setInterval(() => {
      accRef.current += 8 * RATE_PER_SECOND;
      const whole = Math.floor(accRef.current);
      if (whole > 0) {
        accRef.current -= whole;
        setCount((prev) => prev + whole);
      }
    }, 8000);

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
    <div className={`rounded-2xl border overflow-hidden transition-colors duration-300
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
            APPLY FOR ME USERS
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
          <span className="font-black text-green-600 dark:text-green-400 transition-all duration-300">{viewers}</span> log abhi dekh rahe hain
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
