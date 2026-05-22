"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

export default function GlobalBehaviorTracker() {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname) return;

    // We only want to track actual job views to avoid false positives on home/about pages
    const isGovtJobView = pathname.startsWith("/job/") || pathname.startsWith("/latest-jobs");
    const isPrivateJobView = pathname.startsWith("/private-jobs/") && pathname !== "/private-jobs";

    if (!isGovtJobView && !isPrivateJobView) return;

    // Get current counters from local storage
    let govtCount = parseInt(localStorage.getItem("rs_tracker_govt") || "0", 10);
    let privateCount = parseInt(localStorage.getItem("rs_tracker_private") || "0", 10);

    if (isGovtJobView) govtCount += 1;
    if (isPrivateJobView) privateCount += 1;

    localStorage.setItem("rs_tracker_govt", govtCount.toString());
    localStorage.setItem("rs_tracker_private", privateCount.toString());

    // Evaluate preference based on threshold (e.g., if one exceeds the other by 3)
    const currentPreference = localStorage.getItem("rs_job_preference");
    
    if (govtCount - privateCount >= 3 && currentPreference !== "govt") {
      localStorage.setItem("rs_job_preference", "govt");
    } else if (privateCount - govtCount >= 3 && currentPreference !== "private") {
      localStorage.setItem("rs_job_preference", "private");
    }

  }, [pathname]);

  return null; // Silent component
}
