"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { BookmarkMinus, Bookmark, ExternalLink, Calendar, Trash2 } from "lucide-react";

interface SavedJob {
  slug: string;
  title: string;
  savedAt: string;
}

export default function SavedJobsPage() {
  const [savedJobs, setSavedJobs] = useState<SavedJob[]>([]);
  const [isMounted, setIsMounted] = useState(false);
  const [showClearModal, setShowClearModal] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const jobs = JSON.parse(localStorage.getItem("saved_jobs") || "[]");
    // Sort by most recently saved first
    jobs.sort((a: SavedJob, b: SavedJob) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime());
    setSavedJobs(jobs);
  }, []);

  const removeJob = (slug: string) => {
    const updatedJobs = savedJobs.filter(job => job.slug !== slug);
    setSavedJobs(updatedJobs);
    localStorage.setItem("saved_jobs", JSON.stringify(updatedJobs));
    window.dispatchEvent(new Event('savedJobsUpdated'));
  };

  const handleClearAll = () => {
    setSavedJobs([]);
    localStorage.removeItem("saved_jobs");
    window.dispatchEvent(new Event('savedJobsUpdated'));
    setShowClearModal(false);
  };

  if (!isMounted) return null; // Avoid hydration mismatch

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50/20 via-white to-purple-50/20 dark:from-gray-950 dark:via-gray-900 dark:to-indigo-950/20 py-10">
      
      {/* Clear All Confirmation Modal */}
      {showClearModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl border border-gray-100 dark:border-gray-800 w-full max-w-sm p-6 text-center animate-in zoom-in-95 duration-200">
            <div className="w-14 h-14 bg-red-100 dark:bg-red-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-6 h-6 text-red-600" />
            </div>
            <h3 className="text-lg font-black text-gray-900 dark:text-white mb-2">Clear All Saved Jobs?</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 leading-relaxed">
              Are you sure you want to remove all saved jobs from your bookmarks?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowClearModal(false)}
                className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-bold text-sm transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleClearAll}
                className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold text-sm transition-all"
              >
                Clear All
              </button>
            </div>
          </div>
        </div>
      )}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white flex items-center gap-3">
              <Bookmark className="w-8 h-8 text-indigo-500 fill-indigo-100 dark:fill-indigo-900/30" />
              Saved Jobs
            </h1>
            <p className="text-gray-500 mt-2">Jobs you have bookmarked to read or apply for later.</p>
          </div>
          {savedJobs.length > 0 && (
            <button 
              onClick={() => setShowClearModal(true)}
              className="flex items-center gap-2 text-sm font-bold text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 px-4 py-2 rounded-xl transition-colors"
            >
              <Trash2 className="w-4 h-4" /> Clear All
            </button>
          )}
        </div>

        {/* Content */}
        {savedJobs.length === 0 ? (
          <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 p-12 text-center shadow-sm">
            <div className="w-20 h-20 bg-indigo-50 dark:bg-indigo-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
              <Bookmark className="w-10 h-10 text-indigo-300" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No Saved Jobs Yet</h3>
            <p className="text-gray-500 max-w-sm mx-auto mb-8">
              Click the bookmark icon on any job card to save it here for quick access later.
            </p>
            <Link 
              href="/"
              className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-lg shadow-indigo-500/30 transition-all"
            >
              Browse Latest Jobs
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {savedJobs.map((job) => (
              <div 
                key={job.slug} 
                className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 sm:p-6 shadow-sm hover:shadow-md transition-shadow group flex flex-col sm:flex-row gap-4 sm:items-center justify-between"
              >
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 line-clamp-2 leading-snug group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                    {job.title}
                  </h3>
                  <div className="flex items-center gap-2 text-xs font-medium text-gray-500 dark:text-gray-400">
                    <Calendar className="w-3.5 h-3.5" />
                    Saved on: {new Date(job.savedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0 pt-3 sm:pt-0 border-t sm:border-t-0 border-gray-100 dark:border-gray-800 mt-2 sm:mt-0">
                  <Link 
                    href={`/job/${job.slug}`}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-900/30 dark:hover:bg-indigo-900/50 text-indigo-700 dark:text-indigo-400 rounded-xl font-bold transition-colors"
                  >
                    View Details <ExternalLink className="w-4 h-4" />
                  </Link>
                  <button 
                    onClick={() => removeJob(job.slug)}
                    className="p-2.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors"
                    title="Remove from saved"
                  >
                    <BookmarkMinus className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
