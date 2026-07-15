import React from "react";

export default function JobCardSkeleton() {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden animate-pulse">
      {/* Header Skeleton */}
      <div className="bg-gray-200 dark:bg-gray-800 h-10 w-full flex items-center justify-between px-3">
        <div className="flex items-center gap-2 w-1/2">
          <div className="w-4 h-4 rounded-full bg-gray-300 dark:bg-gray-700" />
          <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-1/2" />
        </div>
        <div className="h-4 w-12 bg-gray-300 dark:bg-gray-700 rounded-full" />
      </div>

      {/* List Skeletons */}
      <div className="divide-y divide-gray-50 dark:divide-gray-800/60">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="px-4 py-3 flex flex-col gap-2">
            {/* Title Row */}
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2 flex-1 mt-0.5">
                <div className="w-1.5 h-1.5 rounded-full bg-gray-300 dark:bg-gray-700 shrink-0" />
                <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-3/4" />
                <div className="h-4 w-8 bg-gray-300 dark:bg-gray-700 rounded-md shrink-0" />
              </div>
              <div className="w-6 h-6 rounded-md bg-gray-300 dark:bg-gray-700 shrink-0" />
            </div>
            
            {/* Meta Row */}
            <div className="flex items-center gap-3 ml-3.5 mt-1">
              <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded w-24" />
              <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded w-16" />
            </div>
          </div>
        ))}
      </div>

      {/* Footer Skeleton */}
      <div className="border-t border-gray-100 dark:border-gray-800 px-3 py-2 flex justify-center">
        <div className="h-3 bg-gray-300 dark:bg-gray-700 rounded w-20" />
      </div>
    </div>
  );
}
