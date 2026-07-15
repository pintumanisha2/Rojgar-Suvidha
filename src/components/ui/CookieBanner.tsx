"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Cookie, X, ShieldCheck } from "lucide-react";

const CONSENT_KEY = "rs_cookie_consent";

export default function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Show only if no consent decision has been saved yet
    const stored = localStorage.getItem(CONSENT_KEY);
    if (!stored) {
      // Small delay so it doesn't flash on first paint
      const t = setTimeout(() => setVisible(true), 1200);
      return () => clearTimeout(t);
    }
  }, []);

  const accept = () => {
    localStorage.setItem(CONSENT_KEY, "all");
    setVisible(false);
    // GA is already enabled by default in layout.tsx
  };

  const acceptEssential = () => {
    localStorage.setItem(CONSENT_KEY, "essential");
    setVisible(false);
    // Disable Google Analytics tracking
    (window as any)[`ga-disable-G-NYNEZYFGD5`] = true;
  };

  if (!visible) return null;

  return (
    <div
      className={`fixed bottom-0 left-0 right-0 z-[9999] px-4 pb-4 sm:pb-6
        transition-all duration-500 ease-out
        ${visible ? "translate-y-0 opacity-100" : "translate-y-full opacity-0"}`}
    >
      <div className="max-w-5xl mx-auto bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-2xl p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4">
        
        {/* Icon */}
        <div className="shrink-0 bg-indigo-100 dark:bg-indigo-900/30 p-3 rounded-xl">
          <Cookie className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
        </div>

        {/* Text */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
            We use cookies &amp; analytics
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
            We use cookies to personalize your experience, remember your preferences, and analyze site traffic.
            By continuing, you agree to our{" "}
            <Link href="/privacy" className="text-indigo-600 dark:text-indigo-400 underline underline-offset-2">
              Privacy Policy
            </Link>
            .
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-row sm:flex-col lg:flex-row items-center gap-2 shrink-0 w-full sm:w-auto">
          <button
            id="cookie-accept-all"
            onClick={accept}
            className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold px-4 py-2.5 rounded-xl transition-colors w-full sm:w-auto justify-center"
          >
            <ShieldCheck className="w-4 h-4" />
            Accept All
          </button>
          <button
            id="cookie-essential-only"
            onClick={acceptEssential}
            className="bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors w-full sm:w-auto text-center"
          >
            Essential Only
          </button>
        </div>

        {/* Close (acts as essential only) */}
        <button
          onClick={acceptEssential}
          className="absolute top-4 right-4 sm:static p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors shrink-0"
          aria-label="Close cookie banner"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
