"use client";

import { useEffect } from "react";

interface Props {
  slug: string;
  title: string;
  category: string;
}

// This component tracks when a user visits a job page and saves it to localStorage
export default function TrackJobView({ slug, title, category }: Props) {
  useEffect(() => {
    try {
      const stored = localStorage.getItem("recently_viewed_jobs") || "[]";
      const existing = JSON.parse(stored);

      // Remove if already in list (move to front)
      const filtered = existing.filter((j: any) => j.slug !== slug);

      // Add to front
      const updated = [
        { slug, title, category, viewedAt: new Date().toISOString() },
        ...filtered,
      ].slice(0, 10); // Keep max 10

      localStorage.setItem("recently_viewed_jobs", JSON.stringify(updated));
      window.dispatchEvent(new Event("recentlyViewedUpdated"));
    } catch {}
  }, [slug, title, category]);

  return null; // Invisible component
}
