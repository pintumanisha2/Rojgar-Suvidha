"use client";

import { useState, useEffect } from "react";
import { Bookmark } from "lucide-react";

export default function SaveJobButton({ jobSlug, jobTitle }: { jobSlug: string; jobTitle: string }) {
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    // Check if job is already saved
    const savedJobs = JSON.parse(localStorage.getItem("saved_jobs") || "[]");
    setIsSaved(savedJobs.some((job: any) => job.slug === jobSlug));
  }, [jobSlug]);

  const toggleSave = (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent navigating to the job link
    e.stopPropagation();

    const savedJobs = JSON.parse(localStorage.getItem("saved_jobs") || "[]");
    
    if (isSaved) {
      // Remove from saved
      const newSaved = savedJobs.filter((job: any) => job.slug !== jobSlug);
      localStorage.setItem("saved_jobs", JSON.stringify(newSaved));
      setIsSaved(false);
    } else {
      // Add to saved
      savedJobs.push({ slug: jobSlug, title: jobTitle, savedAt: new Date().toISOString() });
      localStorage.setItem("saved_jobs", JSON.stringify(savedJobs));
      setIsSaved(true);
    }
    
    // Dispatch a custom event so other components (like a Navbar badge) can update
    window.dispatchEvent(new Event('savedJobsUpdated'));
  };

  return (
    <button 
      onClick={toggleSave}
      className={`p-1.5 rounded-md transition-colors ${
        isSaved 
          ? "bg-indigo-100 text-indigo-600 dark:bg-indigo-900/40 dark:text-indigo-400" 
          : "text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-300"
      }`}
      title={isSaved ? "Remove from Saved Jobs" : "Save for Later"}
    >
      <Bookmark className={`w-4 h-4 ${isSaved ? "fill-current" : ""}`} />
    </button>
  );
}
