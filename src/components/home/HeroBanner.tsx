"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, MousePointerClick } from "lucide-react";
import { supabase } from "@/lib/supabase";

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
      const { data } = await supabase
        .from("banners")
        .select("id, title, image_url, link_url")
        .eq("status", "active")
        .order("created_at", { ascending: false });

      if (data && data.length > 0) setBanners(data);
      setLoading(false);
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

  // Auto-slide every 4.5 seconds
  useEffect(() => {
    if (banners.length <= 1) return;
    const timer = setInterval(() => goTo(current + 1), 4500);
    return () => clearInterval(timer);
  }, [current, goTo, banners.length]);

  // Loading skeleton
  if (loading) {
    return (
      <div className="w-full bg-white dark:bg-gray-950 px-3 sm:px-4 py-3">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-3 sm:gap-3 sm:h-[220px]">
            <div className="sm:col-span-2 rounded-2xl bg-gray-100 dark:bg-gray-800 animate-pulse aspect-[16/9] sm:aspect-auto sm:h-full" />
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
    <div className="w-full bg-white dark:bg-gray-950 border-b border-gray-100 dark:border-gray-800 px-3 sm:px-4 py-3">
      <div className="max-w-7xl mx-auto">
        {/* Mobile: single full-width banner | Desktop: 3-card grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 sm:gap-3 sm:h-[220px]">

          {/* ── Main (Large) Banner ── */}
          {/* Mobile: image shows at natural height (no crop, no black bars) */}
          {/* Desktop: fixed 220px grid height with object-cover */}
          <div className="sm:col-span-2 relative rounded-2xl overflow-hidden shadow-sm group cursor-pointer sm:h-full">
            <img
              src={main.image_url}
              alt={main.title}
              className="w-full h-auto sm:h-full sm:object-cover object-center block transition-transform duration-700 group-hover:scale-105"
            />
            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />

            {/* Title + CTA */}
            <div className="absolute bottom-0 left-0 right-0 px-4 py-3 flex items-end justify-between">
              <p className="text-white font-bold text-sm sm:text-base leading-tight drop-shadow line-clamp-2 max-w-[60%]">
                {main.title}
              </p>
              {main.link_url && (
                <Link
                  href={main.link_url}
                  className="shrink-0 inline-flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded-lg font-bold text-xs shadow-lg transition-all hover:scale-105"
                >
                  <MousePointerClick className="w-3 h-3" />
                  View
                </Link>
              )}
            </div>

            {/* Prev / Next arrows */}
            {banners.length > 1 && (
              <>
                <button
                  onClick={() => goTo(current - 1)}
                  className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/70 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-all backdrop-blur-sm"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => goTo(current + 1)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/70 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-all backdrop-blur-sm"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>

                {/* Dot indicators */}
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1">
                  {banners.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => goTo(i)}
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
          <div className="hidden sm:flex flex-col gap-3 h-full">
            {/* Small Banner 1 */}
            {banners.length >= 2 && (
              <div className="flex-1 relative rounded-2xl overflow-hidden shadow-sm group cursor-pointer">
                <img
                  src={side1.image_url}
                  alt={side1.title}
                  className="w-full h-full object-cover object-center transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/5 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 px-3 py-2 flex items-end justify-between">
                  <p className="text-white font-bold text-[11px] leading-tight drop-shadow line-clamp-1 max-w-[60%]">
                    {side1.title}
                  </p>
                  {side1.link_url && (
                    <Link
                      href={side1.link_url}
                      className="shrink-0 text-[10px] font-bold bg-white/20 hover:bg-indigo-600 text-white px-2 py-1 rounded-lg backdrop-blur-sm transition-all"
                    >
                      View →
                    </Link>
                  )}
                </div>
              </div>
            )}

            {/* Small Banner 2 */}
            {banners.length >= 3 ? (
              <div className="flex-1 relative rounded-2xl overflow-hidden shadow-sm group cursor-pointer">
                <img
                  src={side2.image_url}
                  alt={side2.title}
                  className="w-full h-full object-cover object-center transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/5 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 px-3 py-2 flex items-end justify-between">
                  <p className="text-white font-bold text-[11px] leading-tight drop-shadow line-clamp-1 max-w-[60%]">
                    {side2.title}
                  </p>
                  {side2.link_url && (
                    <Link
                      href={side2.link_url}
                      className="shrink-0 text-[10px] font-bold bg-white/20 hover:bg-indigo-600 text-white px-2 py-1 rounded-lg backdrop-blur-sm transition-all"
                    >
                      View →
                    </Link>
                  )}
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
  );
}
