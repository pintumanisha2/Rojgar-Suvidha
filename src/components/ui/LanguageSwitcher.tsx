"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Globe } from "lucide-react";
import { LANGUAGE_CONFIG, SUPPORTED_LANGUAGES, isValidLang } from "@/lib/i18n";

interface LanguageSwitcherProps {
  slug: string;
  currentLang: string;
  availableTranslations?: string[]; // which languages have content
}

export default function LanguageSwitcher({ slug, currentLang, availableTranslations = [] }: LanguageSwitcherProps) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  const allLangs = ["en", ...SUPPORTED_LANGUAGES];

  function getUrl(lang: string) {
    if (lang === "en") return `/job/${slug}`;
    return `/${lang}/job/${slug}`;
  }

  // Auto-detect browser language on first visit (only if on English page)
  useEffect(() => {
    if (currentLang !== "en") return;
    const stored = localStorage.getItem("rs_lang_pref");
    if (stored && isValidLang(stored)) return; // user already chose

    const browserLangs = navigator.languages || [navigator.language];
    for (const bl of browserLangs) {
      const code = bl.split("-")[0].toLowerCase();
      if (isValidLang(code) && availableTranslations.includes(code)) {
        router.replace(getUrl(code));
        return;
      }
    }
  }, []);

  const currentConfig = LANGUAGE_CONFIG[currentLang] || LANGUAGE_CONFIG["en"];

  return (
    <div className="relative inline-block">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors shadow-sm"
        aria-label="Change language"
      >
        <Globe className="h-3.5 w-3.5 text-indigo-500" />
        <span>{currentConfig.nativeLabel}</span>
        <span className="text-gray-400">▼</span>
      </button>

      {open && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />

          {/* Dropdown */}
          <div className="absolute right-0 top-full mt-2 z-50 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl min-w-[180px] overflow-hidden">
            <div className="px-3 py-2 border-b border-gray-100 dark:border-gray-800">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Select Language</p>
            </div>
            {allLangs.map((lang) => {
              const config = LANGUAGE_CONFIG[lang];
              const isAvailable = lang === "en" || availableTranslations.includes(lang);
              const isCurrent = lang === currentLang;

              return (
                <button
                  key={lang}
                  onClick={() => {
                    if (!isAvailable) return;
                    localStorage.setItem("rs_lang_pref", lang);
                    setOpen(false);
                    router.push(getUrl(lang));
                  }}
                  disabled={!isAvailable}
                  className={`w-full flex items-center justify-between px-4 py-2.5 text-sm transition-colors
                    ${isCurrent
                      ? "bg-indigo-50 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-300 font-bold"
                      : isAvailable
                        ? "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 font-medium"
                        : "text-gray-300 dark:text-gray-600 cursor-not-allowed"
                    }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="font-bold" dir={config.dir}>{config.nativeLabel}</span>
                    <span className="text-xs text-gray-400">({config.label})</span>
                  </div>
                  <div className="flex items-center gap-1">
                    {isCurrent && (
                      <span className="w-2 h-2 bg-indigo-500 rounded-full" />
                    )}
                    {!isAvailable && (
                      <span className="text-[10px] text-gray-400 bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded">Soon</span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
