import Link from "next/link";
import { CheckCircle2, ShieldCheck, Zap, ArrowRight, Sparkles, BookOpen, Clock, FileText, Search } from "lucide-react";
import type { Metadata } from "next";
import { supabase } from "@/lib/supabase";

const BASE_URL = "https://www.rojgarsuvidha.com";

export const metadata: Metadata = {
  title: "Sarkari Result 2026 – Latest Govt Jobs, Admit Card, Result & Direct Online Apply | Rojgar Suvidha",
  description: "Get fastest Sarkari Result 2026 updates for SSC, Railway, Banking, UPSC, Bihar Police, Defense & State Govt Jobs. Download Admit Cards, Official Notifications & 1-Click Form Filling at Rojgar Suvidha.",
  keywords: [
    "sarkari result", "sarkari result 2026", "sarkari result info", "sarkari result online form",
    "sarkari result admit card", "sarkari result latest jobs", "sarkari result bihar", "sarkari result ssc cgl",
    "sarkari naukri result", "rojgar suvidha sarkari result"
  ],
  alternates: {
    canonical: `${BASE_URL}/sarkari-result`,
  },
  openGraph: {
    title: "Sarkari Result 2026 – Latest Jobs, Admit Card & Direct Apply",
    description: "Fastest Sarkari Result updates with 1-Click Apply For Me service. Download notifications, syllabus & result instantly.",
    url: `${BASE_URL}/sarkari-result`,
    siteName: "Rojgar Suvidha",
    type: "website",
    images: [{ url: `${BASE_URL}/og-image.png`, width: 1200, height: 630, alt: "Rojgar Suvidha - Sarkari Result 2026" }],
  },
};

export const revalidate = 60;

export default async function SarkariResultLandingPage() {
  // Fetch top active jobs
  const { data: latestJobs } = await supabase
    .from("jobs")
    .select("id, title, slug, category, status, created_at")
    .in("status", ["active", "out", "last", "soon"])
    .order("created_at", { ascending: false })
    .limit(10);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 font-sans">
      
      {/* Schema Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebPage",
            "name": "Sarkari Result 2026 - Latest Govt Jobs & Direct Apply",
            "description": "Fastest updates for Sarkari Result, Admit Cards, Official Answer Keys, and Error-free Form Filling at Rojgar Suvidha.",
            "url": `${BASE_URL}/sarkari-result`,
          }),
        }}
      />

      {/* Hero Header */}
      <div className="bg-gradient-to-r from-indigo-900 via-indigo-950 to-gray-900 text-white py-12 px-4 border-b border-indigo-800/50">
        <div className="max-w-5xl mx-auto text-center space-y-4">
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-black bg-amber-400/20 text-amber-300 border border-amber-400/30 uppercase tracking-widest">
            <Sparkles className="w-3.5 h-3.5" /> Sarkari Result 2026 Live Portal
          </span>
          <h1 className="text-2xl sm:text-4xl font-black">
            Sarkari Result 2026 – Latest Vacancies, Admit Card & Direct Online Apply
          </h1>
          <p className="text-gray-300 text-xs sm:text-base max-w-2xl mx-auto">
            Get 10x faster official notification updates + 1-Click <strong>Apply For Me</strong> form filling service with 100% accuracy.
          </p>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="max-w-5xl mx-auto py-10 px-4 space-y-8">
        
        {/* Banner Alert */}
        <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-gray-950 font-black flex items-center justify-center text-lg shrink-0">
              ⚡
            </div>
            <div>
              <h3 className="font-bold text-sm text-gray-900 dark:text-white">Cyber Cafe Se Sasta & Galti-Free Form Fill Up</h3>
              <p className="text-xs text-gray-600 dark:text-gray-400">Rojgar Suvidha ke experts se 1-Click mein sarkari naukri form fill karwayein.</p>
            </div>
          </div>
          <Link
            href="/e-suvidha"
            className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-gray-950 font-black text-xs rounded-xl shadow transition-colors shrink-0"
          >
            Check e-Suvidha →
          </Link>
        </div>

        {/* Latest Jobs Table */}
        <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-800 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-3">
            <h2 className="font-black text-lg text-gray-900 dark:text-white flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-indigo-500" /> Latest Sarkari Result Updates (2026)
            </h2>
            <Link href="/" className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline">
              View All Posts →
            </Link>
          </div>

          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {(latestJobs || []).map((job) => (
              <div key={job.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-gray-50 dark:hover:bg-gray-800/50 px-2 rounded-xl transition-colors">
                <div>
                  <Link href={`/job/${job.slug}`} className="font-bold text-sm text-gray-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                    {job.title}
                  </Link>
                  <p className="text-[10px] text-gray-400 flex items-center gap-2 mt-0.5">
                    <span>Category: {job.category}</span> • <span>{new Date(job.created_at).toLocaleDateString()}</span>
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Link
                    href={`/job/${job.slug}`}
                    className="px-3 py-1.5 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-300 font-bold text-xs rounded-lg border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-600 hover:text-white transition-all"
                  >
                    View & Apply
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Why Rojgar Suvidha Callout */}
        <div className="text-center py-6">
          <Link
            href="/sarkari-result-alternative"
            className="inline-flex items-center gap-2 text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/30 px-4 py-2 rounded-full border border-indigo-200 dark:border-indigo-800 hover:scale-105 transition-transform"
          >
            Why Rojgar Suvidha is better than traditional Sarkari Result sites? Learn More <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

      </div>

    </div>
  );
}
