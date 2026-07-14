import React from "react";

export default function JobLoading() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pt-24 pb-12 animate-pulse">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Breadcrumb skeleton */}
        <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-1/3 mb-6"></div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            {/* Header Card Skeleton */}
            <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 p-6 sm:p-8">
              <div className="flex flex-col sm:flex-row gap-6 items-start">
                {/* Logo skeleton */}
                <div className="w-20 h-20 bg-gray-200 dark:bg-gray-800 rounded-2xl shrink-0"></div>
                <div className="flex-1 w-full space-y-4">
                  {/* Title skeleton */}
                  <div className="h-8 bg-gray-200 dark:bg-gray-800 rounded w-3/4"></div>
                  {/* Department skeleton */}
                  <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-1/2"></div>
                  {/* Badges skeleton */}
                  <div className="flex flex-wrap gap-2 mt-4">
                    <div className="h-6 bg-gray-200 dark:bg-gray-800 rounded-full w-24"></div>
                    <div className="h-6 bg-gray-200 dark:bg-gray-800 rounded-full w-20"></div>
                    <div className="h-6 bg-gray-200 dark:bg-gray-800 rounded-full w-28"></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Bar Skeleton */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-4">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="h-12 bg-gray-200 dark:bg-gray-800 rounded-xl flex-1"></div>
                <div className="h-12 bg-gray-200 dark:bg-gray-800 rounded-xl flex-1"></div>
                <div className="h-12 bg-gray-200 dark:bg-gray-800 rounded-xl w-full sm:w-16"></div>
              </div>
            </div>

            {/* Tabs Skeleton */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-2 flex gap-2 overflow-hidden">
              <div className="h-10 bg-gray-200 dark:bg-gray-800 rounded-xl w-32"></div>
              <div className="h-10 bg-gray-200 dark:bg-gray-800 rounded-xl w-32 hidden sm:block"></div>
              <div className="h-10 bg-gray-200 dark:bg-gray-800 rounded-xl w-32 hidden md:block"></div>
            </div>

            {/* Content Table Skeleton */}
            <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 p-6 space-y-4">
              <div className="h-6 bg-gray-200 dark:bg-gray-800 rounded w-1/4 mb-6"></div>
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex border-b border-gray-100 dark:border-gray-800 pb-4">
                  <div className="w-1/3 h-4 bg-gray-200 dark:bg-gray-800 rounded"></div>
                  <div className="w-2/3 h-4 bg-gray-200 dark:bg-gray-800 rounded ml-4"></div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Sidebar Skeleton */}
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 p-6 h-64">
              <div className="h-6 bg-gray-200 dark:bg-gray-800 rounded w-1/2 mb-6"></div>
              <div className="space-y-3">
                <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-full"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-5/6"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-4/6"></div>
              </div>
            </div>
            
            <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 p-6 h-80">
              <div className="h-6 bg-gray-200 dark:bg-gray-800 rounded w-2/3 mb-6"></div>
              <div className="space-y-4">
                <div className="h-12 bg-gray-200 dark:bg-gray-800 rounded-xl w-full"></div>
                <div className="h-12 bg-gray-200 dark:bg-gray-800 rounded-xl w-full"></div>
                <div className="h-12 bg-gray-200 dark:bg-gray-800 rounded-xl w-full"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
