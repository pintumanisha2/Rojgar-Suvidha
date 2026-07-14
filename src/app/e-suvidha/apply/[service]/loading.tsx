import React from "react";

export default function ESuvidhaLoading() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pt-24 pb-12 animate-pulse">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        
        {/* Back Button Skeleton */}
        <div className="h-6 bg-gray-200 dark:bg-gray-800 rounded w-32 mb-6"></div>

        <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 p-6 sm:p-8 space-y-8">
          
          {/* Header Skeleton */}
          <div className="flex flex-col md:flex-row gap-6 items-start">
            <div className="w-16 h-16 bg-gray-200 dark:bg-gray-800 rounded-2xl shrink-0"></div>
            <div className="flex-1 w-full space-y-3">
              <div className="h-8 bg-gray-200 dark:bg-gray-800 rounded w-2/3"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-1/2"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-full mt-2"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-5/6"></div>
            </div>
          </div>

          {/* Alert Box Skeleton */}
          <div className="h-16 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-900/30"></div>

          {/* Form Fields Skeleton */}
          <div className="space-y-6">
            <div className="h-6 bg-gray-200 dark:bg-gray-800 rounded w-1/4 mb-4"></div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-1/3"></div>
                <div className="h-12 bg-gray-200 dark:bg-gray-800 rounded-xl w-full"></div>
              </div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-1/3"></div>
                <div className="h-12 bg-gray-200 dark:bg-gray-800 rounded-xl w-full"></div>
              </div>
            </div>

            {/* Extra Fields */}
            <div className="space-y-2 pt-4">
              <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-1/4"></div>
              <div className="h-12 bg-gray-200 dark:bg-gray-800 rounded-xl w-full"></div>
            </div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-1/4"></div>
              <div className="h-12 bg-gray-200 dark:bg-gray-800 rounded-xl w-full"></div>
            </div>
          </div>

          {/* Document Upload Skeleton */}
          <div className="pt-8 border-t border-gray-100 dark:border-gray-800 space-y-6">
            <div className="h-6 bg-gray-200 dark:bg-gray-800 rounded w-1/3 mb-2"></div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-32 bg-gray-100 dark:bg-gray-800/50 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700"></div>
              ))}
            </div>
          </div>

          {/* Submit Button Skeleton */}
          <div className="pt-6">
            <div className="h-14 bg-indigo-200 dark:bg-indigo-900/50 rounded-xl w-full"></div>
          </div>
        </div>
      </div>
    </div>
  );
}
