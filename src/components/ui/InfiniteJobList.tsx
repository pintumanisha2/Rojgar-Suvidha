"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { Calendar, ChevronRight, Flame, Sparkles, AlertCircle, Clock } from "lucide-react";
import JobCardSkeleton from "./JobCardSkeleton";

const statusMap: Record<string, { label: string; dot: string; text: string; bg: string }> = {
  out:    { label: "Out",     dot: "bg-green-500",  text: "text-green-700 dark:text-green-400",   bg: "bg-green-50 dark:bg-green-900/20" },
  active: { label: "Active",  dot: "bg-blue-500",   text: "text-blue-700 dark:text-blue-400",     bg: "bg-blue-50 dark:bg-blue-900/20" },
  last:   { label: "Ending",  dot: "bg-red-500",    text: "text-red-700 dark:text-red-400",       bg: "bg-red-50 dark:bg-red-900/20" },
  soon:   { label: "Closing", dot: "bg-orange-400", text: "text-orange-600 dark:text-orange-400", bg: "bg-orange-50 dark:bg-orange-900/20" },
  new:    { label: "New",     dot: "bg-purple-500", text: "text-purple-700 dark:text-purple-400", bg: "bg-purple-50 dark:bg-purple-900/20" },
};

function InlineTag({ tag }: { tag?: string }) {
  if (tag === "hot")    return <Flame className="w-4 h-4 text-orange-500 shrink-0" />;
  if (tag === "new")    return <Sparkles className="w-4 h-4 text-purple-500 shrink-0" />;
  if (tag === "urgent") return <AlertCircle className="w-4 h-4 text-red-500 shrink-0 animate-pulse" />;
  return null;
}

export default function InfiniteJobList({ initialJobs, category }: { initialJobs: any[], category: string }) {
  const [jobs, setJobs] = useState(initialJobs);
  const [page, setPage] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(initialJobs.length === 15);
  
  const observerTarget = useRef<HTMLDivElement>(null);

  const loadMoreJobs = useCallback(async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);

    const from = page * 15;
    const to = from + 14;

    const { data, error } = await supabase
      .from("jobs")
      .select("*")
      .eq("category", category)
      .neq("status", "draft")
      .order("created_at", { ascending: false })
      .range(from, to);

    if (error) {
      console.error("Error loading more jobs:", error);
    } else {
      if (data && data.length > 0) {
        setJobs(prev => [...prev, ...data]);
        setPage(prev => prev + 1);
        if (data.length < 15) {
          setHasMore(false);
        }
      } else {
        setHasMore(false);
      }
    }
    
    setLoadingMore(false);
  }, [page, loadingMore, hasMore, category]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasMore) {
          loadMoreJobs();
        }
      },
      { threshold: 0.1 }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => observer.disconnect();
  }, [loadMoreJobs, hasMore]);

  if (jobs.length === 0) {
    return (
      <div className="text-center py-20 bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800">
        <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No Jobs Found</h3>
        <p className="text-gray-500 dark:text-gray-400">There are currently no active jobs in this category.</p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
        {jobs.map((job) => {
          let lastDate = "";
          if (job.important_dates && job.important_dates.length > 0) {
            const ldObj = job.important_dates.find((d: any) => d.label === "Last Date");
            if (ldObj) lastDate = ldObj.value;
          }

          const st = statusMap[job.status] || statusMap["active"];

          return (
            <Link
              key={job.slug}
              href={`/job/${job.slug}`}
              className="group bg-white dark:bg-gray-900 rounded-2xl p-5 border border-gray-200 dark:border-gray-800 shadow-sm hover:shadow-xl hover:border-indigo-300 dark:hover:border-indigo-700 hover:-translate-y-1 transition-all duration-300 flex flex-col relative overflow-hidden"
            >
              <div className="flex items-start justify-between mb-3 relative z-10">
                <span className="text-[10px] font-extrabold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-2.5 py-1 rounded-md uppercase tracking-widest">
                  {job.category}
                </span>
                <div className="flex items-center gap-1.5">
                  <InlineTag tag={job.tag} />
                  <span className={`text-[10px] font-bold px-2 py-1 rounded-md ${st.text} ${st.bg}`}>
                    {st.label}
                  </span>
                </div>
              </div>

              <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white mb-3 line-clamp-2 leading-snug group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors relative z-10">
                {job.title}
              </h3>

              <div className="space-y-2 mb-5 relative z-10">
                {lastDate && (
                  <div className="flex items-center gap-2 text-xs font-semibold text-gray-600 dark:text-gray-300">
                    <Calendar className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                    Last Date: <span className={job.status === "last" ? "text-red-500 font-extrabold" : ""}>{lastDate}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-xs font-medium text-gray-500 dark:text-gray-400">
                  <Clock className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                  Posted: {new Date(job.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                </div>
              </div>

              <div className="mt-auto pt-4 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between relative z-10">
                <span className="text-xs font-extrabold text-indigo-600 dark:text-indigo-400">View Details</span>
                <div className="w-8 h-8 rounded-full bg-indigo-50 dark:bg-indigo-900/40 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                  <ChevronRight className="w-4 h-4 text-indigo-600 dark:text-indigo-400 group-hover:text-white" />
                </div>
              </div>
            </Link>
          );
        })}
      </div>
      
      {/* Loading Skeleton Trigger for Infinite Scroll */}
      {hasMore && (
        <div ref={observerTarget} className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6 pt-4">
          <JobCardSkeleton />
          <div className="hidden sm:block"><JobCardSkeleton /></div>
          <div className="hidden lg:block"><JobCardSkeleton /></div>
        </div>
      )}
    </>
  );
}
