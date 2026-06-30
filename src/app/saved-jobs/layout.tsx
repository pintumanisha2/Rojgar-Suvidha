import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Saved Jobs – Rojgar Suvidha | Your Bookmarked Sarkari Naukri",
  description: "View all your saved and bookmarked government jobs on Rojgar Suvidha. Never miss a deadline – track important dates, apply before the last date, and manage your applications.",
  alternates: { canonical: "https://www.rojgarsuvidha.com/saved-jobs" },
  openGraph: {
    title: "Saved Jobs – Rojgar Suvidha",
    description: "View your bookmarked Sarkari Naukri and government job listings on Rojgar Suvidha.",
    url: "https://www.rojgarsuvidha.com/saved-jobs",
  },
};

export default function SavedJobsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
