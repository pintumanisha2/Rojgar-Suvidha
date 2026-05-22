"use client";

import React, { useState } from "react";

interface CompanyLogoProps {
  companyName?: string;
  logoUrl?: string | null;
  className?: string;
  fallbackText?: string;
}

export default function CompanyLogo({
  companyName = "Job",
  logoUrl,
  className = "h-10 w-10 rounded-xl",
  fallbackText,
}: CompanyLogoProps) {
  const [error, setError] = useState(false);

  // Auto-fetch Domain Guesser (e.g. "Flipkart" -> "flipkart.com", "Tech Mahindra" -> "techmahindra.com")
  const cleanName = companyName
    ? companyName.toLowerCase().replace(/[^a-z0-9]/g, "")
    : "";
  const autoLogoUrl = cleanName ? `https://logo.clearbit.com/${cleanName}.com` : null;

  const srcToTry = logoUrl || autoLogoUrl;
  const initialChar = fallbackText || companyName?.charAt(0) || "J";

  if (srcToTry && !error) {
    return (
      <img
        src={srcToTry}
        alt={`${companyName} logo`}
        className={`${className} object-contain bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 p-1 shrink-0 transition-transform duration-200 group-hover:scale-105`}
        onError={() => setError(true)}
      />
    );
  }

  // Fallback styling with nice high-contrast background
  return (
    <div
      className={`${className} bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center font-black text-lg shrink-0 border border-blue-100 dark:border-blue-800/80`}
    >
      {initialChar.toUpperCase()}
    </div>
  );
}
