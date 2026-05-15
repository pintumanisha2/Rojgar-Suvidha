"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Clock, X, ChevronRight } from "lucide-react";

interface ViewedJob {
  slug: string;
  title: string;
  category: string;
  viewedAt: string;
}

export default function RecentlyViewed() {
  const [jobs, setJobs] = useState<ViewedJob[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem("recently_viewed_jobs");
    if (stored) {
      try {
        const parsed: ViewedJob[] = JSON.parse(stored);
        setJobs(parsed.slice(0, 5)); // Max 5
      } catch {}
    }

    // Listen for updates from job detail pages
    const handleUpdate = () => {
      const updated = localStorage.getItem("recently_viewed_jobs");
      if (updated) {
        try { setJobs(JSON.parse(updated).slice(0, 5)); } catch {}
      }
    };
    window.addEventListener("recentlyViewedUpdated", handleUpdate);
    return () => window.removeEventListener("recentlyViewedUpdated", handleUpdate);
  }, []);

  const removeJob = (slug: string) => {
    const updated = jobs.filter(j => j.slug !== slug);
    setJobs(updated);
    localStorage.setItem("recently_viewed_jobs", JSON.stringify(updated));
  };

  if (!mounted || jobs.length === 0) return null;

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-4 mt-2 mb-1">
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-4 py-2.5 bg-gradient-to-r from-slate-600 to-slate-700">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-white" />
            <h3 className="text-white font-bold text-sm">Recently Viewed</h3>
          </div>
          <button
            onClick={() => {
              setJobs([]);
              localStorage.removeItem("recently_viewed_jobs");
            }}
            className="text-white/60 hover:text-white text-xs font-medium transition-colors"
          >
            Clear all
          </button>
        </div>

        <div className="flex overflow-x-auto scrollbar-hide gap-0 divide-x divide-gray-50 dark:divide-gray-800">
          {jobs.map((job) => (
            <div key={job.slug} className="flex-shrink-0 relative group min-w-[180px] max-w-[220px]">
              <Link
                href={`/job/${job.slug}`}
                className="block px-4 py-3 hover:bg-blue-50/50 dark:hover:bg-blue-900/10 transition-colors"
              >
                <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-wider capitalize block mb-0.5">
                  {job.category?.replace(/-/g, " ")}
                </span>
                <p className="text-sm font-bold text-gray-800 dark:text-white line-clamp-2 leading-snug group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                  {job.title}
                </p>
                <span className="text-[10px] text-gray-400 mt-1 block">
                  {new Date(job.viewedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                </span>
              </Link>
              <button
                onClick={() => removeJob(job.slug)}
                className="absolute top-2 right-2 p-1 rounded-full text-gray-300 hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 opacity-0 group-hover:opacity-100 transition-all"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
