import { 
  Link as LinkIcon, Share2, 
  MessageCircle, Send, ChevronRight, 
  BookOpen, Clock, CalendarDays, List
} from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { supabase } from "@/lib/supabase";
import AdSensePlaceholder from "@/components/ads/AdSensePlaceholder";
import SaveJobButton from "@/components/ui/SaveJobButton";
import ShareJobButton from "@/components/ui/ShareJobButton";
import TrackJobViewWrapper from "@/components/ui/TrackJobViewWrapper";
import JobAbandonTracker from "@/components/ui/JobAbandonTracker";
import type { Metadata } from "next";
import { getJobStatusBadge } from "@/lib/jobStatusHelper";
import LanguageSwitcher from "@/components/ui/LanguageSwitcher";
import { buildHreflangAlternates, SUPPORTED_LANGUAGES } from "@/lib/i18n";

const BASE_URL = "https://www.rojgarsuvidha.com";

// Proper fallback when blog content is missing — never show fake demo content
const CONTENT_LOADING_PLACEHOLDER = `
<div style="background:#eff6ff;border:1.5px solid #bfdbfe;border-radius:16px;padding:28px 24px;text-align:center;margin:2rem 0;">
  <div style="font-size:2.5rem;margin-bottom:12px;">&#9998;</div>
  <h2 style="color:#1d4ed8;font-size:1.2rem;font-weight:800;margin:0 0 8px;">Content Being Updated</h2>
  <p style="color:#374151;font-size:0.9rem;margin:0 0 16px;line-height:1.7;">Hamari team is compiling complete details for this notification. Please check back in a few minutes or visit the official website directly using the links below.</p>
  <p style="color:#6b7280;font-size:0.8rem;margin:0;">Rojgar Suvidha — Updated within 30 minutes of official release.</p>
</div>
`;

// ── Helper: Extract Table of Contents from blog HTML ──────────────────────────
function extractTOC(html: string): { text: string; id: string }[] {
  const h2Regex = /<h2[^>]*>([\s\S]*?)<\/h2>/gi;
  const headings: { text: string; id: string }[] = [];
  let match: RegExpExecArray | null;
  while ((match = h2Regex.exec(html)) !== null) {
    const text = match[1].replace(/<[^>]+>/g, "").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").trim();
    if (text.length > 2) {
      const id = text.toLowerCase().replace(/[^a-z0-9\s]/g, "").replace(/\s+/g, "-").slice(0, 50);
      headings.push({ text, id });
    }
  }
  return headings.slice(0, 12);
}

// ── Helper: Estimate reading time ────────────────────────────────────────────
function estimateReadingTime(html: string): number {
  const text = html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  const words = text.split(" ").filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 200)); // 200 wpm average
}

// ── Author Team — Rojgar Suvidha Editorial Desk ───────────────────────────────
const AUTHORS = [
  {
    name: "Arjun Sharma",
    initial: "A",
    designation: "Senior Exam Analyst",
    qualification: "MA Political Science | 12+ Yrs Sarkari Exam Analysis",
    speciality: ["latest-jobs", "results"],
    color: "bg-indigo-600",
  },
  {
    name: "Priya Verma",
    initial: "P",
    designation: "Admit Card & Result Specialist",
    qualification: "B.Ed, M.Sc | 8+ Yrs Exam Notification Coverage",
    speciality: ["admit-card", "answer-key"],
    color: "bg-rose-600",
  },
  {
    name: "Rajesh Kumar",
    initial: "R",
    designation: "Railway & Defence Jobs Expert",
    qualification: "B.Tech, MBA | Ex-Railway Recruitment Analyst",
    speciality: ["latest-jobs"],
    color: "bg-emerald-600",
  },
  {
    name: "Sunita Devi",
    initial: "S",
    designation: "State Govt Jobs Correspondent",
    qualification: "MA Hindi, LLB | 10+ Yrs State PSC Coverage",
    speciality: ["latest-jobs", "news"],
    color: "bg-amber-600",
  },
  {
    name: "Vivek Mishra",
    initial: "V",
    designation: "Admission & Education Desk",
    qualification: "M.Ed, NET Qualified | 9+ Yrs Education Journalism",
    speciality: ["admission", "news"],
    color: "bg-violet-600",
  },
];

// Deterministic author selection — same slug always same author
function selectAuthor(slug: string, category: string) {
  // First try category-matched authors
  const catAuthors = AUTHORS.filter(a => a.speciality.includes(category));
  const pool = catAuthors.length > 0 ? catAuthors : AUTHORS;
  // Use slug char sum for stable selection
  const charSum = slug.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return pool[charSum % pool.length];
}

// ══════════════════════════════════════════════════════════
// DYNAMIC SEO + AEO METADATA
// ══════════════════════════════════════════════════════════
export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
  const { slug } = await params;
  const { data: job } = await supabase
    .from("jobs")
    .select("title, short_info, meta_description, banner_url, category, created_at, updated_at, slug")
    .eq("slug", slug)
    .single();

  if (!job) return { title: "Job Not Found | Rojgar Suvidha" };

  const categoryLabel = job.category?.replace(/-/g, " ").replace(/\b\w/g, (l: string) => l.toUpperCase()) || "";
  
  const currentYear = new Date().getFullYear().toString();
  const hasYear = job.title.includes("2024") || job.title.includes("2025") || job.title.includes("2026") || job.title.includes("2027");
  const baseTitle = hasYear ? job.title : `${job.title} ${currentYear}`;
  // Use absolute title to bypass layout template (prevents double brand name)
  // Max 65 chars for SERP — keep it clean
  const cleanBase = baseTitle.slice(0, 55); // trim if very long
  const titleStr = cleanBase.length <= 42
    ? `${cleanBase} — Notification, Eligibility & Apply | Rojgar Suvidha`
    : `${cleanBase} | Rojgar Suvidha`;
  const title = { absolute: titleStr };

  const rawDescription = (job.meta_description || job.short_info || "").trim();
  const categoryFallbacks: Record<string, string> = {
    "results": `${baseTitle} result released. Check merit list, cutoff marks & direct download link at Rojgar Suvidha. Instant update for all candidates.`,
    "admit-card": `${baseTitle} admit card released. Download your hall ticket directly from Rojgar Suvidha. Check exam date, centre & important instructions.`,
    "answer-key": `${baseTitle} answer key released. Download PDF, calculate your score & raise objections. Direct link at Rojgar Suvidha.`,
    "admission": `${baseTitle} admission open. Check eligibility, important dates, fee structure & apply online. Full details at Rojgar Suvidha.`,
    "news": `${baseTitle} — Latest update for all government job aspirants. Check full details, impact analysis & advisory at Rojgar Suvidha.`,
  };
  const fallbackDesc = categoryFallbacks[job.category || ""] 
    || `${baseTitle} notification out. Check eligibility, vacancy, last date, fee & direct apply link. Full details at Rojgar Suvidha — India's trusted Sarkari Naukri portal.`;
  const description = rawDescription.length > 10
    ? (rawDescription.length > 160 ? `${rawDescription.slice(0, 157)}...` : rawDescription)
    : (fallbackDesc.length > 160 ? `${fallbackDesc.slice(0, 157)}...` : fallbackDesc);

  const shareImage = job.banner_url || `${BASE_URL}/og-image.png`;

  const keywords = [
    job.title, `${job.title} ${currentYear}`,
    `${job.title} sarkari result`, `${job.title} apply online`,
    `${job.title} notification`, `${job.title} eligibility`,
    `${job.title} last date`, `${job.title} vacancy`,
    `${job.title} admit card`, `${job.title} result`,
    "sarkari result", job.category, "rojgar suvidha",
  ];

  const hreflang = buildHreflangAlternates(slug);

  return {
    title,
    description,
    keywords,
    alternates: {
      canonical: `${BASE_URL}/job/${slug}`,
      languages: hreflang.languages,
    },
    openGraph: {
      title: titleStr, description,
      url: `${BASE_URL}/job/${slug}`,
      type: "article",
      publishedTime: job.created_at,
      // Fix: use updated_at so Google gets correct freshness signal
      modifiedTime: job.updated_at || job.created_at,
      siteName: "Rojgar Suvidha",
      section: categoryLabel,
      tags: keywords.slice(0, 10),
      images: [{ url: shareImage, width: 1200, height: 630, alt: job.title }],
    },
    twitter: {
      card: "summary_large_image",
      title: `${job.title} – Apply Now`,
      description: description.slice(0, 200),
      images: [shareImage],
      creator: "@rojgarsuvidha",
    },
  };
}

// ISR: revalidate every 1 hour — Google gets fast cached responses + fresh content
// Removed force-dynamic: it caused slow TTFB and wasted Googlebot crawl budget
export const revalidate = 3600;

export default async function JobDetailsPage({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = await params;
  const slug = resolvedParams.slug;
  
  const { data: job } = await supabase.from("jobs").select("*").eq("slug", slug).single();

  if (!job) {
    notFound();
  }

  // ── Parse links ──
  let applyLink: string | null = null;
  let customApplyLink: string | null = null;

  if (Array.isArray(job.links)) {
    const customObj = job.links.find((l: any) => l.label && typeof l.label === "string" && l.label.toLowerCase().includes("apply for me"));
    if (customObj?.url) customApplyLink = customObj.url;
    const applyObj = job.links.find((l: any) => l.label && typeof l.label === "string" && (l.label.toLowerCase().includes("apply") || l.label.toLowerCase().includes("online")));
    if (applyObj?.url) applyLink = applyObj.url;
  } else if (typeof job.links === "string" && job.links.startsWith("http")) {
    applyLink = job.links;
  } else if (typeof job.links === "string" && (job.links.startsWith("[") || job.links.startsWith("{"))) {
    try {
      const parsed = JSON.parse(job.links);
      if (Array.isArray(parsed)) {
        const applyObj = parsed.find((l: any) => l.label && typeof l.label === "string" && (l.label.toLowerCase().includes("apply") || l.label.toLowerCase().includes("online")));
        if (applyObj?.url) applyLink = applyObj.url;
      }
    } catch (_) {}
  }
  if (!applyLink && job.official_link && typeof job.official_link === "string" && job.official_link.startsWith("http")) {
    applyLink = job.official_link;
  }

  // ── Fetch similar jobs ──
  const { data: similarJobs } = await supabase
    .from("jobs")
    .select("title, slug, status, category, created_at")
    .eq("category", job.category)
    .neq("id", job.id)
    .order("created_at", { ascending: false })
    .limit(4);

  // ── Structured Data ──
  const categoryLabel = job.category?.replace(/-/g, " ").replace(/\b\w/g, (l: string) => l.toUpperCase()) || "";
  const author = selectAuthor(slug, job.category || "latest-jobs");

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: BASE_URL },
      { "@type": "ListItem", position: 2, name: categoryLabel || "Jobs", item: `${BASE_URL}/${job.category}` },
      { "@type": "ListItem", position: 3, name: job.title, item: `${BASE_URL}/job/${slug}` },
    ],
  };

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: job.title,
    description: job.meta_description || job.short_info || `Latest notification for ${job.title}.`,
    datePublished: job.created_at,
    dateModified: job.updated_at || job.created_at,
    author: { "@type": "Person", name: author.name, url: `${BASE_URL}/about` },
    publisher: {
      "@type": "Organization",
      name: "Rojgar Suvidha",
      logo: { "@type": "ImageObject", url: `${BASE_URL}/logo-blue.png` },
    },
    mainEntityOfPage: { "@type": "WebPage", "@id": `${BASE_URL}/job/${slug}` },
    articleSection: categoryLabel,
    inLanguage: "en",
    isAccessibleForFree: true,
    image: job.banner_url || `${BASE_URL}/og-image.png`,
  };

  let lastDate = "";
  let lastDateIso = "";
  if (Array.isArray(job.important_dates)) {
    const ldObj = job.important_dates.find((d: any) => d?.label === "Last Date");
    if (ldObj?.value) {
      lastDate = ldObj.value;
      if (!lastDate.toLowerCase().includes("soon")) {
        try {
          const d = new Date(lastDate);
          if (!isNaN(d.getTime())) lastDateIso = d.toISOString();
        } catch (e) {}
      }
    }
  }

  const jobPostingSchema = {
    "@context": "https://schema.org",
    "@type": "JobPosting",
    title: job.title,
    description: job.meta_description || job.short_info || `Apply for ${job.title}`,
    datePosted: new Date(job.created_at).toISOString(),
    ...(lastDateIso && { validThrough: lastDateIso }),
    employmentType: job.employment_type || "FULL_TIME",
    hiringOrganization: {
      "@type": "Organization",
      name: job.organization_name || "Government of India",
      sameAs: job.organization_url || BASE_URL,
      logo: `${BASE_URL}/logo-blue.png`,
    },
    jobLocation: {
      "@type": "Place",
      address: { "@type": "PostalAddress", addressCountry: "IN", addressRegion: job.state_code || "India" },
    },
    applicantLocationRequirements: { "@type": "Country", name: "India" },
    directApply: false,
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: `How to apply for ${job.title}?`,
        acceptedAnswer: {
          "@type": "Answer",
          text: `You can apply for ${job.title} through the official website. Visit ${BASE_URL}/job/${slug} for direct apply links and step-by-step instructions.`,
        },
      },
      {
        "@type": "Question",
        name: `What is the last date to apply for ${job.title}?`,
        acceptedAnswer: {
          "@type": "Answer",
          text: lastDate
            ? `The last date to apply for ${job.title} is ${lastDate}. Visit Rojgar Suvidha for the latest updates.`
            : `Please check the official notification for the exact last date. Visit Rojgar Suvidha for real-time updates.`,
        },
      },
    ],
  };

  // ── Blog processing — NEVER show DEMO or fake content ──
  const blogContent = (job.blog_content && job.blog_content.length > 100)
    ? job.blog_content
    : CONTENT_LOADING_PLACEHOLDER;
  const hasRealContent = job.blog_content && job.blog_content.length > 100;
  const tocItems = extractTOC(blogContent);
  const readingTime = estimateReadingTime(blogContent);
  const formattedDate = new Date(job.created_at).toLocaleDateString("en-IN", {
    day: "numeric", month: "long", year: "numeric"
  });

  const isNews = ["news", "news-updates"].includes((job.category || "").toLowerCase());
  const isResult = (job.category || "").includes("result");
  const isAdmit = (job.category || "").includes("admit");
  const isKey = (job.category || "").includes("answer");

  const pageBadge = getJobStatusBadge(job);

  // ── Valid links list ──
  const validLinks = Array.isArray(job.links)
    ? job.links.filter((l: any) => l && l.label && typeof l.label === "string" && !l.label.toLowerCase().includes("apply for me"))
    : typeof job.links === "string" && job.links.startsWith("http")
    ? [{ label: "Official Notification / Website Link", url: job.links }]
    : job.official_link && typeof job.official_link === "string" && job.official_link.startsWith("http")
    ? [{ label: "Official Direct Link", url: job.official_link }]
    : [];

  return (
    <>
      {/* JSON-LD Structured Data */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jobPostingSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />

      {/* Analytics trackers — invisible */}
      <TrackJobViewWrapper slug={job.slug} title={job.title} category={job.category} />
      <JobAbandonTracker jobTitle={job.title} jobSlug={job.slug} />

      <div className="bg-gray-50 dark:bg-[#0a0a0a] min-h-screen">
        <div className="max-w-5xl mx-auto px-4 py-6 sm:py-8">

          {/* ── Breadcrumb ── */}
          <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 mb-5 flex-wrap">
            <Link href="/" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors font-medium">Home</Link>
            <ChevronRight className="w-3 h-3 text-gray-300 shrink-0" />
            <Link href={`/${job.category}`} className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors font-medium capitalize">{categoryLabel}</Link>
            <ChevronRight className="w-3 h-3 text-gray-300 shrink-0" />
            <span className="text-gray-700 dark:text-gray-300 font-medium truncate max-w-[220px]">{job.title}</span>
          </nav>

          {/* ── MAIN LAYOUT: Content + Sidebar ── */}
          <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 items-start">

            {/* ── LEFT: Main Content Column ── */}
            <div className="flex-1 min-w-0 space-y-5">

              {/* ── POST HEADER ── */}
              <div className="bg-white dark:bg-zinc-950 rounded-2xl border border-gray-200 dark:border-zinc-800 p-5 sm:p-7 shadow-sm">
                
                {/* Category + Status row */}
                <div className="flex items-center gap-2 mb-3 flex-wrap">
                  <span className={`text-[11px] font-bold px-2.5 py-1 rounded-md uppercase tracking-wider ${pageBadge.text} ${pageBadge.bg}`}>
                    {categoryLabel}
                  </span>
                  {!isNews && (
                    <span className={`flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-md ${pageBadge.bg}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${pageBadge.dot} ${pageBadge.state === "urgent" || pageBadge.state === "today" ? "animate-pulse" : ""}`} />
                      <span className={pageBadge.text}>{pageBadge.label}</span>
                    </span>
                  )}
                  <div className="ml-auto flex items-center gap-1.5">
                    <LanguageSwitcher
                      slug={job.slug}
                      currentLang="en"
                      availableTranslations={
                        SUPPORTED_LANGUAGES.filter(l =>
                          !!(job as any)[`blog_content_${l}`]
                        )
                      }
                    />
                    <SaveJobButton jobSlug={job.slug} jobTitle={job.title} />
                  </div>
                </div>

                {/* H1 Title */}
                <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white leading-tight mb-3">
                  {job.title}
                </h1>

                {/* Short Info (subtitle) */}
                {job.short_info && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed mb-4 border-l-4 border-indigo-400 pl-3">
                    {job.short_info}
                  </p>
                )}

                {/* Meta row: Author | Date | Reading time */}
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-gray-500 dark:text-gray-400 pt-3 border-t border-gray-100 dark:border-zinc-800">
                  <span className="flex items-center gap-1.5 font-medium">
                    <span className={`w-5 h-5 rounded-full ${author.color} text-white flex items-center justify-center text-[10px] font-black shrink-0`}>{author.initial}</span>
                    {author.name}, Rojgar Suvidha
                  </span>
                  <span className="flex items-center gap-1">
                    <CalendarDays className="w-3.5 h-3.5" />
                    {formattedDate}
                  </span>
                  {/* Last Updated — show if different from created_at (freshness signal for users & Google) */}
                  {job.updated_at && job.updated_at !== job.created_at && (
                    <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      Updated: {new Date(job.updated_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {readingTime} min read
                  </span>
                  <span className="flex items-center gap-1">
                    <BookOpen className="w-3.5 h-3.5" />
                    {blogContent.replace(/<[^>]+>/g, " ").split(/\s+/).filter(Boolean).length} words
                  </span>
                </div>
              </div>

              {/* ── Banner Image ── */}
              {job.banner_url && (
                <div className="w-full rounded-xl overflow-hidden border border-gray-200 dark:border-zinc-800 shadow-sm bg-gray-50 dark:bg-zinc-950">
                  {/* eager + fetchpriority=high: fixes LCP — hero image must not be lazy loaded */}
                  <img
                    src={job.banner_url}
                    alt={job.title}
                    className="w-full h-auto object-contain max-h-[280px] mx-auto"
                    loading="eager"
                    fetchPriority="high"
                    decoding="sync"
                    width={1200}
                    height={630}
                  />
                </div>
              )}

              {/* ── Table of Contents (mobile: above article; desktop: left col) ── */}
              {tocItems.length >= 3 && (
                <details className="block bg-white dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-sm">
                  <summary className="flex items-center gap-2 px-5 py-3.5 cursor-pointer select-none font-bold text-sm text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-zinc-900 transition-colors list-none">
                    <List className="w-4 h-4 text-indigo-500 shrink-0" />
                    Table of Contents
                    <span className="ml-auto text-[11px] text-gray-400 font-normal toc-chevron">(click to expand)</span>
                  </summary>
                  <div className="border-t border-gray-100 dark:border-zinc-800 px-5 py-4">
                    <ol className="space-y-2 counter-reset-list">
                      {tocItems.map((item, i) => (
                        <li key={item.id} className="flex gap-2 text-sm">
                          <span className="text-indigo-400 font-mono text-xs mt-0.5 shrink-0 w-5">{i + 1}.</span>
                          <a
                            href={`#${item.id}`}
                            className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 hover:underline transition-colors font-medium leading-snug"
                          >
                            {item.text}
                          </a>
                        </li>
                      ))}
                    </ol>
                  </div>
                </details>
              )}

              {/* ── BLOG CONTENT ── */}
              <div className="bg-white dark:bg-zinc-950 rounded-2xl border border-gray-200 dark:border-zinc-800 p-4 sm:p-8 shadow-sm">
                <style>{`
                  .blog-content { line-height: 1.8; color: #374151; font-size: 15px; }
                  .dark .blog-content { color: #d1d5db; }
                  .blog-content h2 {
                    color: #111827; font-weight: 800;
                    margin-top: 2rem; margin-bottom: 0.75rem;
                    font-size: 1.25rem; line-height: 1.3;
                    padding-bottom: 0.4rem;
                    border-bottom: 2px solid #e0e7ff;
                    scroll-margin-top: 80px;
                  }
                  .dark .blog-content h2 { color: #f1f5f9; border-bottom-color: #1e1b4b; }
                  .blog-content h3 {
                    color: #1f2937; font-weight: 700;
                    margin-top: 1.5rem; margin-bottom: 0.5rem;
                    font-size: 1.05rem;
                    scroll-margin-top: 80px;
                  }
                  .dark .blog-content h3 { color: #e2e8f0; }
                  @media(min-width:640px){
                    .blog-content h2 { font-size: 1.45rem; }
                    .blog-content h3 { font-size: 1.15rem; }
                  }
                  .blog-content p { margin-bottom: 1rem; }
                  .blog-content table {
                    width: 100%; border-collapse: collapse;
                    margin: 1.25rem 0 1.5rem; border-radius: 10px;
                    font-size: 13.5px; overflow: hidden;
                    box-shadow: 0 1px 4px rgba(0,0,0,0.07);
                    display: block; overflow-x: auto;
                    -webkit-overflow-scrolling: touch;
                  }
                  @media(min-width:640px){ .blog-content table { display: table; } }
                  .blog-content th {
                    background: #4f46e5; color: white;
                    font-weight: 700; padding: 10px 14px; text-align: left;
                    white-space: nowrap;
                  }
                  .dark .blog-content th { background: #3730a3; }
                  .blog-content td {
                    border: 1px solid #e5e7eb;
                    padding: 9px 14px; text-align: left;
                    vertical-align: top;
                  }
                  .dark .blog-content td { border-color: #27272a; background: #09090b; color: #d4d4d8; }
                  .blog-content tr:nth-child(even) td { background: #f9fafb; }
                  .dark .blog-content tr:nth-child(even) td { background: #111113; }
                  .blog-content img { max-width: 100%; border-radius: 10px; margin: 1.25rem 0; }
                  .blog-content a { color: #4f46e5; text-decoration: underline; word-break: break-all; font-weight: 500; }
                  .dark .blog-content a { color: #818cf8; }
                  .blog-content ul { list-style-type: disc; margin-left: 1.4rem; margin-bottom: 1rem; }
                  .blog-content ol { list-style-type: decimal; margin-left: 1.4rem; margin-bottom: 1rem; }
                  .blog-content li { margin-bottom: 0.45rem; line-height: 1.65; }
                  /* FAQ Accordion */
                  .blog-content details {
                    border: 1.5px solid #e0e7ff;
                    border-radius: 12px;
                    margin-bottom: 10px;
                    overflow: hidden;
                    background: #fafaff;
                  }
                  .dark .blog-content details { border-color: #3730a3; background: #0d0d1a; }
                  .blog-content details[open] { border-color: #6366f1; box-shadow: 0 2px 12px rgba(99,102,241,0.10); }
                  .blog-content summary {
                    cursor: pointer; padding: 13px 18px;
                    font-size: 0.9rem; font-weight: 700;
                    color: #1e1b4b;
                    background: linear-gradient(90deg, #eef2ff 0%, #f5f3ff 100%);
                    list-style: none; display: flex;
                    align-items: center; justify-content: space-between;
                    user-select: none; gap: 10px;
                  }
                  .dark .blog-content summary {
                    background: linear-gradient(90deg, #1e1b4b 0%, #0f172a 100%);
                    color: #c7d2fe;
                  }
                  .blog-content summary::-webkit-details-marker { display: none; }
                  .blog-content summary::after {
                    content: '+'; font-size: 1.3rem; font-weight: 300;
                    color: #6366f1; flex-shrink: 0; line-height: 1;
                  }
                  .blog-content details[open] > summary::after { content: '−'; }
                  .blog-content details > p,
                  .blog-content details > div {
                    padding: 13px 18px; font-size: 0.875rem;
                    line-height: 1.75; color: #374151; margin: 0;
                    border-top: 1px solid #e0e7ff;
                  }
                  .dark .blog-content details > p,
                  .dark .blog-content details > div { color: #d1d5db; border-top-color: #1e1b4b; }
                  .blog-content script { display: none !important; }
                  /* Blockquote */
                  .blog-content blockquote {
                    border-left: 4px solid #6366f1;
                    background: #f5f3ff; padding: 12px 18px;
                    border-radius: 0 8px 8px 0; margin: 1rem 0;
                    font-style: italic; color: #4338ca;
                  }
                  .dark .blog-content blockquote { background: #1e1b4b; color: #c7d2fe; }
                  /* Strong highlight */
                  .blog-content strong { color: #111827; }
                  .dark .blog-content strong { color: #f1f5f9; }
                  /* Important box styles from blogHtml */
                  .blog-content div[style*="background:#f0fdf4"],
                  .blog-content div[style*="background: #f0fdf4"] { border-radius: 12px !important; }
                `}</style>

                <article
                  className="blog-content max-w-none break-words"
                  dangerouslySetInnerHTML={{ __html: blogContent }}
                />
              </div>

              {/* ── Important Links Section ── */}
              {validLinks.length > 0 && (
                <div id="important-links" className="rounded-2xl overflow-hidden shadow-md border border-gray-200 dark:border-zinc-800">
                  <div className="bg-indigo-600 dark:bg-indigo-700 px-5 py-4 flex items-center gap-3">
                    <LinkIcon className="w-5 h-5 text-white shrink-0" />
                    <div>
                      <h2 className="font-black text-white text-base">Important Links</h2>
                      <p className="text-indigo-200 text-xs font-medium">Official direct links — verified & updated</p>
                    </div>
                  </div>
                  <div className="bg-white dark:bg-zinc-950 divide-y divide-gray-100 dark:divide-zinc-900">
                    {validLinks.map((link: any, idx: number) => {
                      const lbl = (link.label || "").toLowerCase();
                      const isApply = lbl.includes("apply") || lbl.includes("online form") || lbl.includes("registration");
                      const isDownload = lbl.includes("pdf") || lbl.includes("download") || lbl.includes("notification") || lbl.includes("syllabus");
                      const isResultLink = lbl.includes("result") || lbl.includes("merit") || lbl.includes("scorecard");
                      const isAdmitLink = lbl.includes("admit") || lbl.includes("hall ticket");
                      const isAnswer = lbl.includes("answer") || lbl.includes("key") || lbl.includes("objection");

                      const btnClass = isApply
                        ? "bg-indigo-600 hover:bg-indigo-700 text-white"
                        : isDownload
                        ? "bg-orange-500 hover:bg-orange-600 text-white"
                        : isResultLink
                        ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                        : isAdmitLink
                        ? "bg-amber-500 hover:bg-amber-600 text-white"
                        : isAnswer
                        ? "bg-purple-600 hover:bg-purple-700 text-white"
                        : "bg-gray-800 hover:bg-gray-900 text-white";

                      return (
                        <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-4 hover:bg-gray-50 dark:hover:bg-zinc-900/50 transition-colors">
                          <span className="font-semibold text-gray-900 dark:text-gray-100 text-sm">{link.label}</span>
                          <a
                            href={link.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`inline-flex items-center justify-center gap-1.5 px-5 py-2 rounded-lg text-xs font-bold transition-all hover:-translate-y-0.5 w-full sm:w-auto shrink-0 ${btnClass}`}
                          >
                            {link.button_text || link.label} ↗
                          </a>
                        </div>
                      );
                    })}
                  </div>
                  <div className="bg-gray-50 dark:bg-zinc-900 px-5 py-2.5 text-[11px] text-gray-500 dark:text-gray-400 font-medium border-t border-gray-100 dark:border-zinc-800">
                    Always verify links from the official website before applying.
                  </div>
                </div>
              )}

              {/* ── Apply For Me CTA (clean, simple) ── */}
              {!isResult && !isKey && !isNews && (
                <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <h3 className="font-bold text-gray-900 dark:text-white text-base mb-1">
                      Need Help Filling This Form?
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Our expert team applies accurately on your behalf — documents, fees, and submission handled.{" "}
                      <span className="text-indigo-600 dark:text-indigo-400 font-semibold">100% error-free guarantee.</span>
                    </p>
                  </div>
                  {customApplyLink ? (
                    <Link
                      href={customApplyLink}
                      target={customApplyLink.startsWith("http") ? "_blank" : "_self"}
                      className="shrink-0 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-bold text-sm transition-all hover:-translate-y-0.5 shadow-md shadow-indigo-500/20 whitespace-nowrap"
                    >
                      Apply For Me →
                    </Link>
                  ) : (
                    <span className="shrink-0 bg-indigo-100 dark:bg-indigo-900/40 text-indigo-500 dark:text-indigo-400 px-6 py-3 rounded-xl font-bold text-sm border border-indigo-200 dark:border-indigo-700 cursor-default whitespace-nowrap">
                      Coming Soon
                    </span>
                  )}
                </div>
              )}

              {/* ── Middle Ad ── */}
              <AdSensePlaceholder format="leaderboard" />

              {/* ── Share Section ── */}
              <div className="bg-white dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2 text-base">
                    <Share2 className="w-4 h-4 text-indigo-500" /> Share with Friends
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">Help someone get a government job.</p>
                </div>
                <div className="flex w-full sm:w-auto gap-2.5 flex-wrap">
                  <a
                    href={`https://api.whatsapp.com/send?text=*${encodeURIComponent(job.title)}*%0A%0ACheck Here: https://rojgarsuvidha.com/job/${slug}`}
                    target="_blank" rel="noopener noreferrer"
                    className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#1ebe57] text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-sm transition-all hover:-translate-y-0.5"
                  >
                    <MessageCircle className="w-4 h-4" /> WhatsApp
                  </a>
                  <a
                    href={`https://t.me/share/url?url=https://rojgarsuvidha.com/job/${slug}&text=${encodeURIComponent(job.title)}`}
                    target="_blank" rel="noopener noreferrer"
                    className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-[#0088cc] hover:bg-[#0077b5] text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-sm transition-all hover:-translate-y-0.5"
                  >
                    <Send className="w-4 h-4" /> Telegram
                  </a>
                  <ShareJobButton url={`https://www.rojgarsuvidha.com/job/${slug}`} title={job.title} />
                </div>
              </div>

              {/* ── Similar Posts ── */}
              {similarJobs && similarJobs.length > 0 && (
                <div>
                  <h3 className="text-base font-extrabold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                    <span className="w-1 h-5 bg-indigo-500 rounded-full inline-block" />
                    You May Also Like
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {similarJobs.map((simJob: any) => (
                      <Link
                        href={`/job/${simJob.slug}`}
                        key={simJob.slug}
                        className="group bg-white dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 rounded-xl p-4 hover:shadow-md transition-all hover:border-indigo-300 dark:hover:border-indigo-700/50 flex flex-col justify-between"
                      >
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 dark:bg-indigo-900/30 px-2 py-0.5 rounded-md">
                            {simJob.category?.replace(/-/g, " ")}
                          </span>
                          <h4 className="font-bold text-sm text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-2 mt-2">
                            {simJob.title}
                          </h4>
                        </div>
                        <div className="mt-3 flex items-center justify-between text-xs font-semibold text-gray-500">
                          <span>{new Date(simJob.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</span>
                          <span className="text-indigo-500 group-hover:translate-x-0.5 transition-transform">View →</span>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* ── Bottom Ad ── */}
              <AdSensePlaceholder format="responsive" />

            </div>
            {/* ── END LEFT COLUMN ── */}

            {/* ── RIGHT: Sticky Sidebar (desktop only) ── */}
            <aside className="hidden lg:block w-72 shrink-0">
              <div className="sticky top-20 space-y-4">

                {/* Quick Facts Box */}
                {!isNews && (
                  <div className="bg-white dark:bg-zinc-950 rounded-2xl border border-gray-200 dark:border-zinc-800 shadow-sm overflow-hidden">
                    <div className="bg-indigo-600 dark:bg-indigo-700 px-4 py-3">
                      <h2 className="text-white font-black text-sm">Quick Information</h2>
                    </div>
                    <div className="divide-y divide-gray-100 dark:divide-zinc-800">
                      {[
                        { label: "Category", value: categoryLabel },
                        { label: "Last Date", value: lastDate || "Check Notification" },
                        { label: "Total Posts", value: job.total_posts || job.total_vacancy || "Check Notification" },
                        { label: "Fee (Gen)", value: job.application_fee || job.fee_gen || "Check Notification" },
                        { label: "Status", value: pageBadge.label },
                      ].map((item) => item.value ? (
                        <div key={item.label} className="flex items-start justify-between px-4 py-2.5 gap-2">
                          <span className="text-xs text-gray-500 dark:text-gray-400 font-medium shrink-0">{item.label}</span>
                          <span className="text-xs text-gray-900 dark:text-gray-100 font-bold text-right">{item.value}</span>
                        </div>
                      ) : null)}
                    </div>
                  </div>
                )}

                {/* Apply Button Sidebar */}
                {applyLink && !isNews && (
                  <a
                    href={applyLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`block w-full text-center py-3.5 rounded-xl font-black text-sm text-white transition-all hover:-translate-y-0.5 shadow-md ${
                      isResult ? "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/20" :
                      isAdmit ? "bg-orange-500 hover:bg-orange-600 shadow-orange-500/20" :
                      isKey ? "bg-purple-600 hover:bg-purple-700 shadow-purple-500/20" :
                      "bg-indigo-600 hover:bg-indigo-700 shadow-indigo-500/20"
                    }`}
                  >
                    {isResult ? "Check Result ↗" : isAdmit ? "Download Admit Card ↗" : isKey ? "View Answer Key ↗" : "Apply Online ↗"}
                  </a>
                )}

                {/* Related Category Links */}
                <div className="bg-white dark:bg-zinc-950 rounded-2xl border border-gray-200 dark:border-zinc-800 shadow-sm p-4">
                  <h3 className="font-black text-gray-900 dark:text-white text-sm mb-3">Browse More</h3>
                  <div className="space-y-2">
                    {[
                      { href: "/latest-jobs", label: "Latest Sarkari Jobs 2026" },
                      { href: "/results", label: "Sarkari Result 2026" },
                      { href: "/admit-card", label: "Admit Card 2026" },
                      { href: "/answer-key", label: "Answer Key 2026" },
                      { href: "/admission", label: "Admission 2026" },
                    ].map((link) => (
                      <Link
                        key={link.href}
                        href={link.href}
                        className="flex items-center justify-between text-xs text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 font-medium transition-colors group py-1"
                      >
                        <span>{link.label}</span>
                        <ChevronRight className="w-3 h-3 text-gray-300 group-hover:text-indigo-500 group-hover:translate-x-0.5 transition-all" />
                      </Link>
                    ))}
                  </div>
                </div>

                {/* Sidebar Ad */}
                <AdSensePlaceholder format="responsive" />

              </div>
            </aside>
            {/* ── END SIDEBAR ── */}

          </div>
          {/* ── END MAIN LAYOUT ── */}

        </div>
      </div>
    </>
  );
}
