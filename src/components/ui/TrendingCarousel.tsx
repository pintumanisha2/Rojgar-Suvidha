"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { Flame, ArrowRight, ChevronRight, TrendingUp } from "lucide-react";
import JobCardSkeleton from "./JobCardSkeleton";

export default function TrendingCarousel() {
  const [trendingJobs, setTrendingJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTrending() {
      try {
        // Fetch jobs that are 'hot' or have highest views/recent activity. 
        // For now, we fetch 'hot' status jobs ordered by created_at.
        const { data } = await supabase
          .from("jobs")
          .select("title, slug, category, created_at, status")
          .eq("status", "hot")
          .order("created_at", { ascending: false })
          .limit(5);

        if (data) {
          setTrendingJobs(data);
        }
      } catch (err) {
        console.error("Error fetching trending jobs:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchTrending();
  }, []);

  if (!loading && trendingJobs.length === 0) return null;

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center shrink-0">
            <Flame className="w-4 h-4 text-red-500 fill-red-500" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-extrabold text-gray-900 dark:text-white tracking-tight flex items-center gap-2">
              Trending Today
            </h2>
          </div>
        </div>
        <Link href="/latest-jobs" className="text-sm font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 flex items-center gap-1 group">
          View all <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>

      <div className="flex overflow-x-auto gap-4 pb-4 snap-x snap-mandatory hide-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0">
        {loading ? (
          <>
            {[1, 2, 3].map((i) => (
              <div key={i} className="min-w-[280px] max-w-[320px] shrink-0 snap-center">
                <JobCardSkeleton />
              </div>
            ))}
          </>
        ) : (
          <>
            {trendingJobs.map((job, index) => (
              <Link 
                href={`/job/${job.slug}`} 
                key={job.slug}
                className="min-w-[280px] max-w-[320px] shrink-0 snap-center group block bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5 shadow-sm hover:shadow-md hover:border-indigo-200 dark:hover:border-indigo-800 transition-all relative overflow-hidden"
              >
                {/* Ranking Number Background */}
                <div className="absolute -right-4 -bottom-4 text-gray-50 dark:text-gray-800/50 font-black text-8xl italic z-0 pointer-events-none user-select-none">
                  #{index + 1}
                </div>

                <div className="relative z-10 flex flex-col h-full">
                  <div className="flex items-start justify-between mb-3">
                    <span className="text-[10px] font-extrabold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-2.5 py-1 rounded-md uppercase tracking-widest">
                      {job.category}
                    </span>
                    <span className="flex items-center gap-1 text-[10px] font-bold text-red-500 bg-red-50 dark:bg-red-900/20 px-2 py-1 rounded-md">
                      <TrendingUp className="w-3 h-3" /> High Demand
                    </span>
                  </div>

                  <h3 className="font-bold text-gray-900 dark:text-white line-clamp-2 leading-snug mb-4 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                    {job.title}
                  </h3>

                  <div className="mt-auto pt-4 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
                    <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                      Apply Now
                    </span>
                    <div className="w-8 h-8 rounded-full bg-gray-50 dark:bg-gray-800 flex items-center justify-center group-hover:bg-indigo-50 dark:group-hover:bg-indigo-900/40 transition-colors">
                      <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400" />
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
