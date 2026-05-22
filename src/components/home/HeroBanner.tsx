"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { ChevronLeft, ChevronRight, MousePointerClick } from "lucide-react";
import { supabase } from "@/lib/supabase";

// Mobile Quick Nav data
const QUICK_CATS = [
  { label: "🔥 Latest Jobs",  id: "section-latest-jobs",  href: "/latest-jobs"  },
  { label: "📄 Results",      id: "section-results",      href: "/results"      },
  { label: "📋 Admit Card",   id: "section-admit-card",   href: "/admit-card"  },
  { label: "🔑 Answer Key",   id: "section-answer-key",   href: "/answer-key"  },
  { label: "🎓 Admission",    id: "section-admission",    href: "/admission"   },
  { label: "📰 News",         id: "section-news",         href: "/news"        },
];

interface Banner {
  id: string;
  title: string;
  image_url: string;
  link_url: string;
}

export default function HeroBanner() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [current, setCurrent] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBanners = async () => {
      try {
        const { data, error } = await supabase
          .from("banners")
          .select("id, title, image_url, link_url")
          .eq("status", "active")
          .order("created_at", { ascending: false });

        // FIX: Only update state if data exists (prevents empty flash)
        if (!error && data && data.length > 0) setBanners(data);
      } catch (err) {
        console.error("Banner fetch error:", err);
      } finally {
        setLoading(false); // FIX: Always stop skeleton, even on network error
      }
    };
    fetchBanners();
  }, []);

  const goTo = useCallback(
    (index: number) => {
      if (banners.length <= 1) return;
      setCurrent((index + banners.length) % banners.length);
    },
    [banners.length]
  );

  // FIX: Auto-slide — use functional update to avoid stale closure
  // Old code: goTo(current + 1) captured stale `current` value in new tabs
  useEffect(() => {
    if (banners.length <= 1) return;
    const timer = setInterval(() => {
      setCurrent(prev => (prev + 1) % banners.length);
    }, 4500);
    return () => clearInterval(timer);
  }, [banners.length]); // No longer depends on `current` — no stale closure

  // Loading skeleton
  if (loading) {
    return (
      <div className="w-full bg-white dark:bg-gray-950 px-3 sm:px-4 py-3">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-3 sm:gap-3 sm:h-[200px]">
            <div className="sm:col-span-2 rounded-2xl bg-gray-100 dark:bg-gray-800 animate-pulse h-[140px] sm:h-[200px]" />
            <div className="hidden sm:flex flex-col gap-3">
              <div className="flex-1 rounded-2xl bg-gray-100 dark:bg-gray-800 animate-pulse" />
              <div className="flex-1 rounded-2xl bg-gray-100 dark:bg-gray-800 animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (banners.length === 0) return null;

  // Pick banners for layout: main = current, side1 = next, side2 = next+1
  const main = banners[current % banners.length];
  const side1 = banners[(current + 1) % banners.length];
  const side2 = banners[(current + 2) % banners.length];

  return (
    <>
    <div className="w-full bg-white dark:bg-gray-950 border-b border-gray-100 dark:border-gray-800 px-3 sm:px-4 py-3">
      <div className="max-w-7xl mx-auto">
        {/* Mobile/Tab: single full-width banner | Desktop: 3-card grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 sm:gap-3 sm:h-[200px]">

          {/* Main Banner - fully clickable */}
          <div className="sm:col-span-2 relative rounded-2xl overflow-hidden shadow-sm group cursor-pointer h-[140px] sm:h-[200px]">
            {/* Wrap entire banner in Link if link_url exists */}
            {main.link_url ? (
              <Link href={main.link_url} className="absolute inset-0 z-10" aria-label={main.title} />
            ) : null}

            <Image
              src={main.image_url}
              alt={main.title}
              fill
              className="object-fill object-center block transition-transform duration-700 group-hover:scale-105"
              priority
            />
            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />

            {/* Title */}
            <div className="absolute bottom-0 left-0 right-0 px-4 py-3 flex items-end justify-between pointer-events-none">
              <p className="text-white font-bold text-sm sm:text-base leading-tight drop-shadow line-clamp-2">
                {main.title}
              </p>
              {main.link_url && (
                <span className="shrink-0 inline-flex items-center gap-1.5 bg-indigo-600 text-white px-3 py-1.5 rounded-lg font-bold text-xs shadow-lg">
                  <MousePointerClick className="w-3 h-3" />
                  View
                </span>
              )}
            </div>

            {/* Prev / Next arrows — higher z-index so they stay clickable above the Link overlay */}
            {banners.length > 1 && (
              <>
                <button
                  onClick={(e) => { e.preventDefault(); goTo(current - 1); }}
                  className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/70 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-all backdrop-blur-sm z-20"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={(e) => { e.preventDefault(); goTo(current + 1); }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/70 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-all backdrop-blur-sm z-20"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>

                {/* Dot indicators */}
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1 z-20">
                  {banners.map((_, i) => (
                    <button
                      key={i}
                      onClick={(e) => { e.preventDefault(); goTo(i); }}
                      className={`rounded-full transition-all duration-300 ${
                        i === current
                          ? "w-5 h-1.5 bg-indigo-400"
                          : "w-1.5 h-1.5 bg-white/50 hover:bg-white/80"
                      }`}
                    />
                  ))}
                </div>
              </>
            )}
          </div>

          {/* ── Right Side: 2 Small Banners (hidden on mobile) ── */}
          <div className="hidden sm:flex flex-col gap-3 sm:h-[200px]">
            {/* Small Banner 1 */}
            {banners.length >= 2 && (
              <div className="flex-1 relative rounded-2xl overflow-hidden shadow-sm group cursor-pointer">
                {/* Full-area clickable link */}
                {side1.link_url && (
                  <Link href={side1.link_url} className="absolute inset-0 z-10" aria-label={side1.title} />
                )}
                <Image
                  src={side1.image_url}
                  alt={side1.title}
                  fill
                  className="object-cover object-center transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/5 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 px-3 py-2 pointer-events-none">
                  <p className="text-white font-bold text-[11px] leading-tight drop-shadow line-clamp-1">
                    {side1.title}
                  </p>
                </div>
              </div>
            )}

            {/* Small Banner 2 */}
            {banners.length >= 3 ? (
              <div className="flex-1 relative rounded-2xl overflow-hidden shadow-sm group cursor-pointer">
                {/* Full-area clickable link */}
                {side2.link_url && (
                  <Link href={side2.link_url} className="absolute inset-0 z-10" aria-label={side2.title} />
                )}
                <Image
                  src={side2.image_url}
                  alt={side2.title}
                  fill
                  className="object-cover object-center transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/5 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 px-3 py-2 pointer-events-none">
                  <p className="text-white font-bold text-[11px] leading-tight drop-shadow line-clamp-1">
                    {side2.title}
                  </p>
                </div>
              </div>
            ) : banners.length === 2 ? (
              /* Fallback placeholder if only 2 banners */
              <div className="flex-1 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
                <p className="text-white/70 text-xs font-bold text-center px-3">
                  Admin se aur banners add karwayein
                </p>
              </div>
            ) : null}
          </div>

        </div>
      </div>
    </div>

    {/* ── Mobile Quick Nav (only on phones, hidden on sm+) ── */}
    <div className="sm:hidden bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800">
      <div className="flex items-center justify-between px-3 pt-2 pb-1">
        <span className="text-[11px] font-extrabold text-gray-400 uppercase tracking-wider">Job categories</span>
        <Link href="/latest-jobs" className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400">All Jobs →</Link>
      </div>
      <div className="flex gap-2 overflow-x-auto scrollbar-hide px-3 pb-3">
        {QUICK_CATS.map((cat) => (
          <button
            key={cat.id}
            onClick={() => {
              const el = document.getElementById(cat.id);
              if (el) {
                const top = el.getBoundingClientRect().top + window.scrollY - 68;
                window.scrollTo({ top, behavior: "smooth" });
              }
            }}
            className="flex-shrink-0 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-indigo-100 hover:text-indigo-700 dark:hover:bg-indigo-900/40 dark:hover:text-indigo-300 px-3 py-1.5 rounded-full text-[11px] font-bold whitespace-nowrap transition-all active:scale-95"
          >
            {cat.label}
          </button>
        ))}
      </div>
    </div>
    </>
  );
}
