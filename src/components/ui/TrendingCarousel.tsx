"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { Flame, ArrowRight, ChevronRight, TrendingUp } from "lucide-react";

// Tiny inline shimmer — no big skeleton, just a compact placeholder pill row
function TrendingShimmer() {
  return (
    <div className="min-w-[260px] max-w-[300px] shrink-0 snap-center bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4 animate-pulse">
      <div className="flex justify-between mb-3">
        <div className="h-5 w-20 bg-gray-200 dark:bg-gray-700 rounded-md" />
        <div className="h-5 w-20 bg-gray-100 dark:bg-gray-800 rounded-md" />
      </div>
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full mb-2" />
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-4" />
      <div className="border-t border-gray-100 dark:border-gray-800 pt-3 flex justify-between items-center">
        <div className="h-3 w-16 bg-gray-100 dark:bg-gray-800 rounded" />
        <div className="w-7 h-7 rounded-full bg-gray-100 dark:bg-gray-800" />
      </div>
    </div>
  );
}

export default function TrendingCarousel() {
  const [trendingJobs, setTrendingJobs] = useState<any[]>([]);
  // Start as null — means "still loading". false = done loading.
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    // Hard timeout: if Supabase takes > 3s, silently hide the section
    const timeout = setTimeout(() => {
      setLoading(false);
    }, 3000);

    async function fetchTrending() {
      try {
        const { data } = await supabase
          .from("jobs")
          .select("title, slug, category, created_at, status")
          .eq("status", "hot")
          .order("created_at", { ascending: false })
          .limit(5);

        if (data && data.length > 0) {
          setTrendingJobs(data);
        }
      } catch (err) {
        // Silently fail — no console noise in production
      } finally {
        clearTimeout(timeout);
        setLoading(false);
      }
    }

    fetchTrending();
    return () => clearTimeout(timeout);
  }, []);

  // Hidden while loading (no blank space) — shows compact shimmer only when truly loading
  // Once done: hide if no jobs found
  if (!loading && trendingJobs.length === 0) return null;

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center shrink-0">
            <Flame className="w-3.5 h-3.5 text-red-500 fill-red-500" />
          </div>
          <h2 className="text-base font-extrabold text-gray-900 dark:text-white tracking-tight">
            Trending Today
          </h2>
        </div>
        {!loading && (
          <Link href="/latest-jobs" className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 flex items-center gap-1 group">
            View all <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </Link>
        )}
      </div>

      <div className="flex overflow-x-auto gap-3 pb-3 snap-x snap-mandatory hide-scrollbar -mx-3 px-3 sm:mx-0 sm:px-0">
        {loading ? (
          // Compact shimmer — NOT the large JobCardSkeleton
          <>
            {[1, 2, 3].map((i) => <TrendingShimmer key={i} />)}
          </>
        ) : (
          <>
            {trendingJobs.map((job, index) => (
              <Link
                href={`/job/${job.slug}`}
                key={job.slug}
                className="min-w-[260px] max-w-[300px] shrink-0 snap-center group block bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-4 shadow-sm hover:shadow-md hover:border-indigo-200 dark:hover:border-indigo-800 transition-all relative overflow-hidden"
              >
                {/* Faded rank number */}
                <div className="absolute -right-3 -bottom-3 text-gray-50 dark:text-gray-800/50 font-black text-7xl italic z-0 pointer-events-none select-none">
                  #{index + 1}
                </div>

                <div className="relative z-10 flex flex-col h-full">
                  <div className="flex items-start justify-between mb-2.5">
                    <span className="text-[10px] font-extrabold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-2 py-0.5 rounded-md uppercase tracking-widest">
                      {job.category}
                    </span>
                    <span className="flex items-center gap-1 text-[10px] font-bold text-red-500 bg-red-50 dark:bg-red-900/20 px-2 py-0.5 rounded-md">
                      <TrendingUp className="w-3 h-3" /> Hot
                    </span>
                  </div>

                  <h3 className="font-bold text-sm text-gray-900 dark:text-white line-clamp-2 leading-snug mb-3 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                    {job.title}
                  </h3>

                  <div className="mt-auto pt-3 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
                    <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">Apply Now</span>
                    <div className="w-7 h-7 rounded-full bg-gray-50 dark:bg-gray-800 flex items-center justify-center group-hover:bg-indigo-50 dark:group-hover:bg-indigo-900/40 transition-colors">
                      <ChevronRight className="w-3.5 h-3.5 text-gray-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400" />
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </>
        )}
      </div>
    </div>
  );
}

