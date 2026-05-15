"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

const categories = [
  { label: "🔥 Latest Jobs",  id: "section-latest-jobs",  href: "/latest-jobs",  color: "from-red-500 to-rose-500"    },
  { label: "📄 Results",      id: "section-results",      href: "/results",      color: "from-green-500 to-emerald-500"},
  { label: "📋 Admit Card",   id: "section-admit-card",   href: "/admit-card",   color: "from-orange-500 to-amber-500" },
  { label: "🔑 Answer Key",   id: "section-answer-key",   href: "/answer-key",   color: "from-purple-600 to-violet-500"},
  { label: "🎓 Admission",    id: "section-admission",    href: "/admission",    color: "from-blue-600 to-sky-500"     },
  { label: "📰 News",         id: "section-news",         href: "/news",         color: "from-rose-600 to-pink-500"   },
];

export default function MobileQuickNav() {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isSticky, setIsSticky] = useState(false);
  const navRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);

  // Detect when user scrolls past the banner so we make this sticky
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => setIsSticky(!entry.isIntersecting),
      { threshold: 0, rootMargin: "0px" }
    );
    if (sentinelRef.current) observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, []);

  // Smooth scroll to the section
  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      const offset = 72; // account for sticky nav height
      const top = el.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top, behavior: "smooth" });
      setActiveId(id);
    }
  };

  return (
    <>
      {/* Sentinel — invisible div to detect when nav should become sticky */}
      <div ref={sentinelRef} className="h-0 w-full" />

      {/* Mobile-only quick nav — shown inline AND sticky when scrolled */}
      <div
        ref={navRef}
        className={`sm:hidden z-40 w-full bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 transition-all duration-300 ${
          isSticky
            ? "fixed top-0 left-0 shadow-md"
            : "relative"
        }`}
      >
        {/* Heading row */}
        <div className="flex items-center justify-between px-3 pt-2 pb-1">
          <span className="text-[11px] font-extrabold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            Jump to section
          </span>
          <Link
            href="/latest-jobs"
            className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
          >
            All Jobs →
          </Link>
        </div>

        {/* Horizontally scrollable pills */}
        <div className="flex gap-2 overflow-x-auto scrollbar-hide px-3 pb-2.5">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => scrollTo(cat.id)}
              className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold whitespace-nowrap transition-all active:scale-95 ${
                activeId === cat.id
                  ? `bg-gradient-to-r ${cat.color} text-white shadow-md`
                  : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* When sticky, add spacer so content doesn't jump */}
      {isSticky && <div className="sm:hidden h-[72px]" />}
    </>
  );
}
