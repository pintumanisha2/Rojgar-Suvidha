import React from "react";
import JobCardSkeleton from "./JobCardSkeleton";

export default function MainContentSkeleton() {
  return (
    <section className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-5">
      {/* Browse Jobs by Sector Skeleton */}
      <div className="mb-6 sm:mb-8">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-5 h-5 bg-gray-200 dark:bg-gray-800 rounded-full animate-pulse" />
          <div className="h-5 w-40 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
        </div>
        <div className="grid grid-cols-4 lg:grid-cols-8 gap-2 sm:gap-3">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="flex flex-col items-center justify-center py-2.5 rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 animate-pulse h-[72px]">
              <div className="w-6 h-6 bg-gray-200 dark:bg-gray-800 rounded mb-1" />
              <div className="w-10 h-3 bg-gray-200 dark:bg-gray-800 rounded" />
            </div>
          ))}
        </div>
      </div>

      {/* Main Grid for Jobs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-5">
        {[1, 2, 3, 4, 5].map((i) => (
          <JobCardSkeleton key={i} />
        ))}
      </div>
    </section>
  );
}
