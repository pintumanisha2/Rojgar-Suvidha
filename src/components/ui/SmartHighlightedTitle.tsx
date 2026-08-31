"use client";

import React from "react";

interface SmartHighlightedTitleProps {
  title: string;
  className?: string;
  isCard?: boolean;
}

export default function SmartHighlightedTitle({
  title,
  className = "",
  isCard = false,
}: SmartHighlightedTitleProps) {
  if (!title) return null;

  // 1. Extract bracketed vacancy badge e.g. [1,300 Posts], [558 Posts], [23,757 Vacancies]
  let vacancyBadge: string | null = null;
  let remainingTitle = title;

  const bracketMatch = title.match(/^\[(.*?)\]\s*/);
  if (bracketMatch) {
    vacancyBadge = bracketMatch[1];
    remainingTitle = title.replace(bracketMatch[0], "");
  }

  // 2. High-impact action keywords to highlight with gradient text/pills
  const actionKeywords = [
    "Notification Out",
    "Apply Online Form",
    "Apply Online",
    "Admit Card Download",
    "Admit Card",
    "Result Declared",
    "Result Out",
    "Scorecard Link",
    "Scorecard",
    "Answer Key",
    "Merit List",
    "Direct Link",
    "Selection Process",
    "Eligibility",
  ];

  // Build Regex for Action Keywords
  const escapedKeywords = actionKeywords.map((kw) =>
    kw.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
  );
  const actionRegex = new RegExp(`(${escapedKeywords.join("|")})`, "gi");

  // Split title by action keywords and year (2026 / 2025)
  const parts = remainingTitle.split(/(\b202[5-9]\b|Notification Out|Apply Online Form|Apply Online|Admit Card Download|Admit Card|Result Declared|Result Out|Scorecard Link|Scorecard|Answer Key|Merit List|Direct Link)/gi);

  return (
    <span className={`inline-wrap items-baseline gap-1.5 ${className}`}>
      {/* ── Vacancy Badge ── */}
      {vacancyBadge && (
        <span
          className={`inline-flex items-center gap-1 font-black rounded-lg text-white shadow-sm uppercase tracking-wide shrink-0 align-middle ${
            isCard
              ? "px-2 py-0.5 text-[11px] bg-gradient-to-r from-red-600 to-amber-600 mr-1.5"
              : "px-2.5 py-1 text-xs sm:text-sm bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 mr-2 shadow-red-500/20"
          }`}
        >
          <span>🔥</span>
          <span>{vacancyBadge}</span>
        </span>
      )}

      {/* ── Segmented Title Text ── */}
      {parts.map((part, idx) => {
        if (!part) return null;

        // Year Badge e.g. 2026
        if (/^\b202[5-9]\b$/.test(part)) {
          return (
            <span
              key={idx}
              className={`inline-block font-black rounded-md border align-baseline ${
                isCard
                  ? "px-1.5 py-0.2 text-[10px] bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-300/60 mx-1"
                  : "px-2 py-0.5 text-xs sm:text-sm bg-amber-100 dark:bg-amber-950/80 text-amber-900 dark:text-amber-200 border-amber-400/70 font-extrabold mx-1 shadow-xs"
              }`}
            >
              {part}
            </span>
          );
        }

        // Action Keyword Highlight
        const isActionKeyword = actionKeywords.some(
          (kw) => kw.toLowerCase() === part.toLowerCase()
        );

        if (isActionKeyword) {
          return (
            <span
              key={idx}
              className={`font-black bg-gradient-to-r from-indigo-600 via-purple-600 to-violet-600 dark:from-indigo-400 dark:via-purple-300 dark:to-violet-400 bg-clip-text text-transparent underline decoration-indigo-300/80 dark:decoration-indigo-600 decoration-wavy underline-offset-4 ${
                isCard ? "text-xs" : ""
              }`}
            >
              {part}
            </span>
          );
        }

        // Standard Text
        return <span key={idx}>{part}</span>;
      })}
    </span>
  );
}
