import { supabase } from"@/lib/supabase";
import PrivateJobsClient from"./components/PrivateJobsClient";
import type { Metadata } from"next";

export const metadata: Metadata = {
  title: "Latest Private Jobs 2026 | WFH, Fresher, BPO & MNC Jobs | Rojgar Suvidha",
  description: "Find the latest verified private sector jobs, work from home (WFH) opportunities, fresher jobs, BPO, and MNC vacancies on Rojgar Suvidha. 100% genuine postings with zero fees.",
  keywords: ["private jobs 2026", "mnc jobs for freshers", "work from home jobs india", "bpo jobs", "corporate jobs", "rojgar suvidha private jobs", "latest it jobs"],
  alternates: { canonical: "https://www.rojgarsuvidha.com/private-jobs" },
  openGraph: {
    title: "Latest Private Jobs 2026 | WFH & MNC Jobs | Rojgar Suvidha",
    description: "Explore thousands of verified private sector jobs. Work from home, BPO, Data Entry, and IT positions available. Apply directly with HRs for free.",
    url: "https://www.rojgarsuvidha.com/private-jobs",
    siteName: "Rojgar Suvidha",
    images: [
      {
        url: "/logo-blue.png",
        width: 800,
        height: 600,
      },
    ],
    type: "website",
  },
};

export const revalidate = 60; // Cache for 60 seconds

export default async function PrivateJobsPage() {
 // Query only approved active private jobs for direct rendering
 const { data: jobs } = await supabase
 .from("private_jobs")
 .select("*")
 .eq("status", "published")
 .order("created_at", { ascending: false });

 return <PrivateJobsClient initialJobs={jobs || []} />;
}
