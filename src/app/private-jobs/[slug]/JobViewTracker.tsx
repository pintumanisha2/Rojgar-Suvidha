"use client";

import { useEffect } from"react";
import { trackJobView } from"../components/RecommendedJobsSection";

interface Props {
 job: {
 id: string;
 skills_required?: string[];
 };
}

/**
 * Invisible tracker component.
 * Mounts on the Job Details page and saves the job's skills
 * into localStorage so RecommendedJobsSection can personalise the feed.
 */
export default function JobViewTracker({ job }: Props) {
 useEffect(() => {
 trackJobView(job);
 }, [job.id]);

 return null; // renders nothing
}
