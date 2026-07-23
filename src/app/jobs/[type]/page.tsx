import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { Calendar, ChevronRight, Flame, Sparkles, AlertCircle, Clock, ArrowLeft } from "lucide-react";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

const BASE_URL = "https://www.rojgarsuvidha.com";

// ── Category Config Map ────────────────────────────────────
const categoryConfig: Record<string, {
  title: string;
  heading: string;
  description: string;
  emoji: string;
  searchTerms: string[]; // Terms to search in job title/category
  color: string;
  keywords: string[];
}> = {
  ssc: {
    title: "SSC Jobs 2026 | SSC CGL, CHSL, MTS, GD Constable",
    heading: "SSC Government Jobs 2026",
    description: "Latest Staff Selection Commission (SSC) job notifications 2026 – SSC CGL, SSC CHSL, SSC MTS, SSC GD Constable, SSC CPO & more.",
    emoji: "🏛️",
    searchTerms: ["ssc", "staff selection", "cgl", "chsl", "mts", "gd constable", "cpo"],
    color: "bg-blue-500",
    keywords: ["ssc jobs 2026", "ssc cgl 2026", "ssc chsl 2026", "ssc mts 2026", "ssc gd constable 2026", "ssc cpo 2026", "staff selection commission jobs"],
  },
  railway: {
    title: "Railway Jobs 2026 | RRB NTPC, Group D, ALP",
    heading: "Indian Railway Jobs 2026",
    description: "Latest Railway Recruitment Board (RRB) notifications 2026 – RRB NTPC, RRB Group D, RRB ALP, RPF Constable & more.",
    emoji: "🚂",
    searchTerms: ["railway", "rrb", "ntpc", "group d", "alp", "rpf", "rrb"],
    color: "bg-red-500",
    keywords: ["railway jobs 2026", "rrb ntpc 2026", "rrb group d 2026", "rrb alp 2026", "rpf constable", "indian railway recruitment"],
  },
  banking: {
    title: "Bank Jobs 2026 | IBPS PO, SBI PO, RBI Grade B",
    heading: "Government Bank Jobs 2026",
    description: "Latest Banking sector job notifications 2026 – IBPS PO, IBPS Clerk, SBI PO, SBI Clerk, RBI Grade B & more.",
    emoji: "🏦",
    searchTerms: ["bank", "ibps", "sbi", "rbi", "nabard", "banking"],
    color: "bg-green-500",
    keywords: ["bank jobs 2026", "ibps po 2026", "ibps clerk 2026", "sbi po 2026", "sbi clerk 2026", "rbi grade b 2026", "banking jobs india"],
  },
  upsc: {
    title: "UPSC Jobs 2026 | Civil Services, NDA, CDS",
    heading: "UPSC Government Jobs 2026",
    description: "Latest UPSC notifications 2026 – Civil Services (IAS/IPS), NDA, CDS, CAPF, Engineering Services & more.",
    emoji: "🎖️",
    searchTerms: ["upsc", "civil services", "ias", "ips", "nda", "cds", "capf"],
    color: "bg-purple-500",
    keywords: ["upsc jobs 2026", "upsc civil services 2026", "ias ips recruitment", "nda 2026", "cds 2026", "upsc notification"],
  },
  police: {
    title: "Police Jobs 2026 | UP Police, Bihar Police, CISF",
    heading: "Police & Paramilitary Jobs 2026",
    description: "Latest Police job notifications 2026 – UP Police, Bihar Police, Delhi Police, CISF, CRPF, BSF, SSB & more.",
    emoji: "👮",
    searchTerms: ["police", "cisf", "crpf", "bsf", "ssb", "itbp", "constable"],
    color: "bg-indigo-600",
    keywords: ["police jobs 2026", "up police 2026", "bihar police 2026", "delhi police 2026", "cisf constable", "crpf recruitment 2026"],
  },
  defence: {
    title: "Defence Jobs 2026 | Army, Navy, Airforce, Agniveer",
    heading: "Indian Defence Jobs 2026",
    description: "Latest Defence job notifications 2026 – Indian Army Agniveer, Indian Navy, Indian Airforce, DRDO & more.",
    emoji: "🛡️",
    searchTerms: ["army", "navy", "airforce", "agniveer", "drdo", "defence", "military"],
    color: "bg-orange-500",
    keywords: ["defence jobs 2026", "army agniveer 2026", "indian navy recruitment", "indian airforce jobs", "drdo recruitment 2026"],
  },
  teaching: {
    title: "Teaching Jobs 2026 | CTET, UPTET, KVS, NVS",
    heading: "Government Teaching Jobs 2026",
    description: "Latest Teaching job notifications 2026 – CTET, UPTET, KVS, NVS, TGT, PGT, DSSSB & more.",
    emoji: "📚",
    searchTerms: ["ctet", "tet", "teacher", "teaching", "kvs", "nvs", "dsssb", "tgt", "pgt"],
    color: "bg-yellow-500",
    keywords: ["teaching jobs 2026", "ctet 2026", "uptet 2026", "kvs recruitment", "nvs teacher", "government teacher jobs"],
  },
  "state-psc": {
    title: "State PSC Jobs 2026 | UPPSC, BPSC, MPPSC",
    heading: "State PSC Jobs 2026",
    description: "Latest State Public Service Commission notifications 2026 – UPPSC, BPSC, MPPSC, RPSC, UKPSC & more.",
    emoji: "🏢",
    searchTerms: ["psc", "uppsc", "bpsc", "mppsc", "rpsc", "ukpsc", "state psc"],
    color: "bg-teal-500",
    keywords: ["state psc jobs 2026", "uppsc 2026", "bpsc 2026", "mppsc 2026", "rpsc recruitment", "state government jobs"],
  },
};

const statusMap: Record<string, { label: string; dot: string; text: string; bg: string }> = {
  out:    { label: "Out",     dot: "bg-green-500",  text: "text-green-700 dark:text-green-400",   bg: "bg-green-50 dark:bg-green-900/20" },
  active: { label: "Active",  dot: "bg-blue-500",   text: "text-blue-700 dark:text-blue-400",     bg: "bg-blue-50 dark:bg-blue-900/20" },
  last:   { label: "Ending",  dot: "bg-red-500",    text: "text-red-700 dark:text-red-400",       bg: "bg-red-50 dark:bg-red-900/20" },
  soon:   { label: "Closing", dot: "bg-orange-400", text: "text-orange-600 dark:text-orange-400", bg: "bg-orange-50 dark:bg-orange-900/20" },
  new:    { label: "New",     dot: "bg-purple-500", text: "text-purple-700 dark:text-purple-400", bg: "bg-purple-50 dark:bg-purple-900/20" },
};

// ── Generate metadata per category ────────────────────────
export async function generateMetadata(
  { params }: { params: Promise<{ type: string }> }
): Promise<Metadata> {
  const { type } = await params;
  const config = categoryConfig[type];
  if (!config) return { title: "Jobs | Rojgar Suvidha" };

  return {
    title: `${config.title} | Rojgar Suvidha`,
    description: config.description,
    keywords: [...config.keywords, "rojgar suvidha", "sarkari naukri", "government jobs"],
    alternates: { canonical: `${BASE_URL}/jobs/${type}` },
    openGraph: {
      title: config.title,
      description: config.description,
      url: `${BASE_URL}/jobs/${type}`,
      type: "website",
      siteName: "Rojgar Suvidha",
      images: [{ url: "/og-image.png", width: 1200, height: 630, alt: config.title }],
    },
  };
}

export const revalidate = 60;

export default async function JobsByTypePage({ params }: { params: Promise<{ type: string }> }) {
  const { type } = await params;
  const config = categoryConfig[type];
  
  if (!config) notFound();

  // Fetch all non-draft jobs and filter by search terms in title
  const { data: allJobs } = await supabase
    .from("jobs")
    .select("*")
    .neq("status", "draft")
    .order("created_at", { ascending: false })
    .limit(200);

  // Filter jobs whose title contains any of the search terms (case-insensitive)
  const jobs = (allJobs || []).filter(job => {
    const titleLower = job.title?.toLowerCase() || "";
    const categoryLower = job.category?.toLowerCase() || "";
    return config.searchTerms.some(term => 
      titleLower.includes(term) || categoryLower.includes(term)
    );
  });

  // JSON-LD for this category page
  const categorySchema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: config.heading,
    description: config.description,
    url: `${BASE_URL}/jobs/${type}`,
    publisher: {
      "@type": "Organization",
      name: "Rojgar Suvidha",
      url: BASE_URL,
    },
    numberOfItems: jobs.length,
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: BASE_URL },
      { "@type": "ListItem", position: 2, name: "Category Jobs", item: `${BASE_URL}/latest-jobs` },
      { "@type": "ListItem", position: 3, name: config.heading, item: `${BASE_URL}/jobs/${type}` },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(categorySchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      
      <div className="flex-1 bg-gray-50 dark:bg-gray-950 py-8 px-4 min-h-screen">
        <div className="max-w-5xl mx-auto">

          {/* Back Link */}
          <Link href="/latest-jobs" className="inline-flex items-center gap-1.5 text-sm font-bold text-gray-500 hover:text-indigo-600 transition-colors mb-6">
            <ArrowLeft className="w-4 h-4" /> All Jobs
          </Link>

          {/* Header */}
          <div className={`relative bg-gradient-to-br from-indigo-700 via-indigo-600 to-violet-700 text-white rounded-3xl p-8 mb-8 shadow-xl overflow-hidden`}>
            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_top_right,white,transparent)]" />
            <div className="relative z-10 flex items-center gap-5">
              <div className="text-5xl">{config.emoji}</div>
              <div>
                <h1 className="text-2xl md:text-3xl font-extrabold mb-2">{config.heading}</h1>
                <p className="text-indigo-100 text-sm max-w-2xl">{config.description}</p>
                <div className="mt-3 inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-full text-xs font-bold">
                  📋 {jobs.length} Job{jobs.length !== 1 ? 's' : ''} Found
                </div>
              </div>
            </div>
          </div>

          {/* Jobs Grid */}
          {jobs.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {jobs.map((job) => {
                let lastDate = "";
                if (job.important_dates?.length > 0) {
                  const ldObj = job.important_dates.find((d: any) => d.label === "Last Date");
                  if (ldObj) lastDate = ldObj.value;
                }
                const st = statusMap[job.status] || statusMap["active"];

                return (
                  <Link
                    key={job.id}
                    href={`/job/${job.slug}`}
                    className="group flex flex-col bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 hover:border-indigo-500/40 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 overflow-hidden"
                  >
                    <div className={`h-1.5 w-full bg-gradient-to-r from-indigo-500 to-violet-500`} />
                    <div className="p-5 flex flex-col h-full">
                      <div className="flex items-center justify-between mb-3">
                        <span className={`inline-flex items-center gap-1.5 text-[10px] font-extrabold px-2.5 py-1 rounded-md uppercase tracking-wider ${st.text} ${st.bg}`}>
                          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${st.dot}`} />
                          {st.label}
                        </span>
                        <span className="text-[10px] text-gray-400 font-medium bg-gray-50 dark:bg-gray-800 px-2 py-1 rounded-md capitalize">
                          {job.category?.replace(/-/g, " ")}
                        </span>
                      </div>

                      <h2 className="text-sm font-bold text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-3 leading-snug mb-4 flex-1">
                        {job.title}
                      </h2>

                      {lastDate && (
                        <div className="flex items-center gap-2 bg-red-50 dark:bg-red-900/10 rounded-lg px-3 py-2 mb-3">
                          <Clock className="w-3.5 h-3.5 text-red-500 shrink-0" />
                          <span className="text-xs text-red-600 dark:text-red-400 font-bold">Last Date: {lastDate}</span>
                        </div>
                      )}

                      <div className="pt-3 mt-auto border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
                        <span className="text-xs text-gray-400">
                          {new Date(job.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                        <div className="bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 p-1.5 rounded-lg group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                          <ChevronRight className="w-4 h-4" />
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 p-16 text-center shadow-sm">
              <div className="text-5xl mb-4">{config.emoji}</div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No {config.heading} yet</h2>
              <p className="text-gray-500 text-sm mb-6">New notifications are added daily. Check back soon!</p>
              <Link href="/latest-jobs" className="inline-flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-indigo-700 transition-colors">
                <ArrowLeft className="w-4 h-4" /> View All Jobs
              </Link>
            </div>
          )}

        </div>
      </div>
    </>
  );
}
