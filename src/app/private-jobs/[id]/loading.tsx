import React from "react";

export default function PrivateJobLoading() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pt-24 pb-12 animate-pulse">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        
        {/* Back Button Skeleton */}
        <div className="h-6 bg-gray-200 dark:bg-gray-800 rounded w-32 mb-6"></div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            
            {/* Main Job Card Skeleton */}
            <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 p-6 sm:p-8">
              <div className="flex flex-col sm:flex-row items-start gap-6">
                <div className="w-24 h-24 bg-gray-200 dark:bg-gray-800 rounded-2xl shrink-0"></div>
                <div className="flex-1 w-full space-y-4">
                  <div className="h-8 bg-gray-200 dark:bg-gray-800 rounded w-3/4"></div>
                  <div className="h-5 bg-gray-200 dark:bg-gray-800 rounded w-1/2"></div>
                  <div className="flex flex-wrap gap-2 mt-4">
                    <div className="h-6 bg-gray-200 dark:bg-gray-800 rounded-full w-24"></div>
                    <div className="h-6 bg-gray-200 dark:bg-gray-800 rounded-full w-20"></div>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8 pt-6 border-t border-gray-100 dark:border-gray-800">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="space-y-2">
                    <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-1/2"></div>
                    <div className="h-5 bg-gray-200 dark:bg-gray-800 rounded w-3/4"></div>
                  </div>
                ))}
              </div>
            </div>

            {/* Description Skeleton */}
            <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 p-6 sm:p-8 space-y-4">
              <div className="h-6 bg-gray-200 dark:bg-gray-800 rounded w-1/4 mb-6"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-full"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-full"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-5/6"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-full"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-4/6"></div>
            </div>
          </div>

          {/* Right Sidebar Skeleton */}
          <div className="space-y-6">
            {/* Apply Card */}
            <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 p-6">
              <div className="h-14 bg-indigo-200 dark:bg-indigo-900/50 rounded-xl w-full mb-4"></div>
              <div className="h-12 bg-gray-200 dark:bg-gray-800 rounded-xl w-full"></div>
            </div>
            
            {/* Company Card */}
            <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 p-6 space-y-4">
              <div className="h-6 bg-gray-200 dark:bg-gray-800 rounded w-1/2 mb-4"></div>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gray-200 dark:bg-gray-800 rounded-full"></div>
                <div className="space-y-2 flex-1">
                  <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded w-1/2"></div>
                </div>
              </div>
              <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-full pt-2"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-5/6"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
