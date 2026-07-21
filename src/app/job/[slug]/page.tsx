import { 
  Calendar, CreditCard, Users, GraduationCap, 
  Link as LinkIcon, Download, Globe, ArrowLeft, 
  Share2, UploadCloud, CheckCircle2, ChevronRight,
  MessageCircle, Send
} from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { supabase } from "@/lib/supabase";
import AdSensePlaceholder from "@/components/ads/AdSensePlaceholder";
import SaveJobButton from "@/components/ui/SaveJobButton";
import ShareJobButton from "@/components/ui/ShareJobButton";
import TrackJobViewWrapper from "@/components/ui/TrackJobViewWrapper";
import JobAbandonTracker from "@/components/ui/JobAbandonTracker";
import AgeCalculator from "@/components/ui/AgeCalculator";
import type { Metadata } from "next";
import MatchScoreCard from "@/components/ui/MatchScoreCard";
import SocialProofBadges from "@/components/ui/SocialProofBadges";
import PushSubscribeWidget from "@/components/ui/PushSubscribeWidget";
import ApplyFomoBar from "@/components/ui/ApplyFomoBar";

const BASE_URL = "https://www.rojgarsuvidha.com";

const DEMO_BLOG_CONTENT = `
<h2>SSC CGL 2026 Notification Out: Apply Online for 15,000+ Vacancies</h2>
<p>The Staff Selection Commission (SSC) has released the official notification for the Combined Graduate Level (CGL) Examination 2026. Eligible graduates can apply online through the official portal or use our <strong>Apply For Me</strong> service for an error-free application process.</p>

<h3>Important Dates</h3>
<table>
  <thead>
    <tr>
      <th>Event</th>
      <th>Date</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>Application Start Date</td>
      <td><strong>15th May 2026</strong></td>
    </tr>
    <tr>
      <td>Last Date to Apply Online</td>
      <td><strong>14th June 2026</strong></td>
    </tr>
    <tr>
      <td>Last Date for Fee Payment</td>
      <td>15th June 2026</td>
    </tr>
    <tr>
      <td>Tier 1 Exam Date</td>
      <td>August - September 2026</td>
    </tr>
  </tbody>
</table>

<h3>Application Fee</h3>
<ul>
  <li><strong>General / OBC / EWS:</strong> ₹100/-</li>
  <li><strong>SC / ST / PH:</strong> ₹0/- (Exempted)</li>
  <li><strong>All Category Females:</strong> ₹0/- (Exempted)</li>
</ul>
<p><em>Payment Mode:</em> Pay the examination fee via Debit Card, Credit Card, Net Banking, or UPI.</p>

<h3>Age Limit (As on 01-08-2026)</h3>
<p>Minimum Age: <strong>18 Years</strong><br>Maximum Age: <strong>27 - 32 Years</strong> (Post Wise)</p>
<p><em>Age Relaxation Extra as per SSC CGL 2026 Recruitment Rules.</em></p>

<h3>Eligibility Criteria</h3>
<p>Candidates must have passed a <strong>Bachelor's Degree</strong> in any stream from a recognized university in India. For some specific posts like JSO (Junior Statistical Officer), a Bachelor's degree with minimum 60% marks in Mathematics at 12th standard is required.</p>

<h2>How to Apply Online?</h2>
<ol>
  <li>Scroll down to the "Important Links" section below.</li>
  <li>Click on the "Apply Online" link.</li>
  <li>Register using your basic details and Aadhar card.</li>
  <li>Upload your photo and signature strictly according to the SSC guidelines to avoid rejection.</li>
  <li>Pay the fee and print the final receipt.</li>
</ol>
`;

// ══════════════════════════════════════════════════════════
// 🔥 DYNAMIC SEO + AEO METADATA FOR EACH JOB
// ══════════════════════════════════════════════════════════
export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
  const { slug } = await params;
  const { data: job } = await supabase
    .from("jobs")
    .select("title, short_info, meta_description, banner_url, category, created_at, slug")
    .eq("slug", slug)
    .single();

  if (!job) return { title: "Job Not Found | Rojgar Suvidha" };

  const categoryLabel = job.category?.replace(/-/g, " ").replace(/\b\w/g, (l: string) => l.toUpperCase()) || "";
  
  // Smart dynamic title with year (avoid clashing if year is already in title)
  const currentYear = new Date().getFullYear().toString();
  const hasYear = job.title.includes("2024") || job.title.includes("2025") || job.title.includes("2026") || job.title.includes("2027");
  const baseTitle = hasYear ? job.title : `${job.title} ${currentYear}`;
  const title = `${baseTitle} – Apply Online, Eligibility, Vacancy, Last Date`;
  
  // Custom SEO description if written, fallback to short info or template
  const rawDescription = job.meta_description || job.short_info || "";
  const description = rawDescription.trim().length > 10 
    ? (rawDescription.length > 160 ? `${rawDescription.slice(0, 157)}...` : rawDescription)
    : `${job.title} Notification Out. Check eligibility criteria, important dates, vacancy details, age limit, application fee & apply online at Rojgar Suvidha.`;

  // Custom social share image (use banner URL if generated, fallback to logo)
  const shareImage = job.banner_url || `${BASE_URL}/og-image.png`;

  const keywords = [
    job.title,
    `${job.title} ${currentYear}`,
    `${job.title} apply online`, `${job.title} online form`,
    `${job.title} notification`, `${job.title} notification pdf`,
    `${job.title} eligibility`, `${job.title} age limit`,
    `${job.title} last date`, `${job.title} exam date`,
    `${job.title} vacancy`, `${job.title} salary`,
    `${job.title} syllabus`, `${job.title} admit card`,
    `${job.title} result`, `${job.title} answer key`,
    "sarkari naukri", "government jobs", "sarkari result",
    job.category, "rojgar suvidha",
  ];

  return {
    title,
    description,
    keywords,
    alternates: { canonical: `${BASE_URL}/job/${slug}` },
    openGraph: {
      title,
      description,
      url: `${BASE_URL}/job/${slug}`,
      type: "article",
      publishedTime: job.created_at,
      modifiedTime: job.created_at,
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

export const revalidate = 60;

export default async function JobDetailsPage({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = await params;
  const slug = resolvedParams.slug;
  
  const { data: job } = await supabase.from("jobs").select("*").eq("slug", slug).single();

  if (!job) {
    notFound();
  }

  const customApplyLink = job.links?.find((l: any) => l.label.toLowerCase().includes('apply for me'))?.url;
  const applyLinkObj = job.links?.find((l: any) => l.label && (l.label.toLowerCase().includes("apply") || l.label.toLowerCase().includes("online")));
  const applyLink = applyLinkObj ? applyLinkObj.url : null;

  // Fetch similar jobs (same category)
  const { data: similarJobs } = await supabase
    .from("jobs")
    .select("title, slug, status, category, created_at")
    .eq("category", job.category)
    .neq("id", job.id)
    .order("created_at", { ascending: false })
    .limit(3);

  // ── Build JSON-LD Structured Data ──
  const categoryLabel = job.category?.replace(/-/g, " ").replace(/\b\w/g, (l: string) => l.toUpperCase()) || "";

  // 1. BreadcrumbList Schema (SEO - better search appearance)
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: BASE_URL },
      { "@type": "ListItem", position: 2, name: categoryLabel || "Jobs", item: `${BASE_URL}/${job.category}` },
      { "@type": "ListItem", position: 3, name: job.title, item: `${BASE_URL}/job/${slug}` },
    ],
  };

  // 2. Article Schema (SEO + GEO - AI engines love this)
  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: job.title,
    description: job.meta_description || job.short_info || `Latest notification for ${job.title}. Apply online now.`,
    datePublished: job.created_at,
    dateModified: job.updated_at || job.created_at,
    author: { "@type": "Organization", name: "Rojgar Suvidha", url: BASE_URL },
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

  // 3. JobPosting Schema (SEO - Google Jobs integration)
  let lastDate = "";
  let lastDateIso = "";
  if (job.important_dates && job.important_dates.length > 0) {
    const ldObj = job.important_dates.find((d: any) => d.label === "Last Date");
    if (ldObj && ldObj.value) {
      lastDate = ldObj.value;
      if (!lastDate.toLowerCase().includes("soon")) {
        // Try to parse standard dates, fallback to string if invalid
        try {
          const d = new Date(lastDate);
          if (!isNaN(d.getTime())) lastDateIso = d.toISOString();
        } catch (e) {}
      }
    }
  }

  // Ensure description is HTML or clean text for Google Jobs
  const jobDescriptionHTML = job.content 
    ? job.content 
    : `<p>${job.meta_description || job.short_info || `Apply for ${job.title}`}</p>`;
  
  const jobPostingSchema = {
    "@context": "https://schema.org",
    "@type": "JobPosting",
    title: job.title,
    description: jobDescriptionHTML,
    datePosted: new Date(job.created_at).toISOString(),
    ...(lastDateIso && { validThrough: lastDateIso }),
    employmentType: job.employment_type || "FULL_TIME",
    hiringOrganization: {
      "@type": "Organization",
      name: job.organization_name || "Government of India",
      sameAs: job.organization_url || BASE_URL,
      logo: `${BASE_URL}/logo-blue.png`
    },
    jobLocation: {
      "@type": "Place",
      address: {
        "@type": "PostalAddress",
        addressCountry: "IN",
        addressRegion: job.state_code || "India",
      },
    },
    ...(job.salary && {
      baseSalary: {
        "@type": "MonetaryAmount",
        currency: "INR",
        value: {
          "@type": "QuantitativeValue",
          value: job.salary,
          unitText: "MONTH"
        }
      }
    }),
    applicantLocationRequirements: {
      "@type": "Country",
      name: "India",
    },
    directApply: false,
  };

  // 4. FAQPage Schema for AEO (auto-generate from job data)
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: `How to apply for ${job.title}?`,
        acceptedAnswer: {
          "@type": "Answer",
          text: `You can apply for ${job.title} through the official website or use Rojgar Suvidha's 'Apply For Me' service. Visit ${BASE_URL}/job/${slug} for direct apply links, step-by-step instructions, and eligibility details.`,
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
      {
        "@type": "Question",
        name: `What is the eligibility for ${job.title}?`,
        acceptedAnswer: {
          "@type": "Answer",
          text: `The eligibility criteria for ${job.title} includes educational qualification, age limit, and nationality requirements. Check the full details on Rojgar Suvidha's official job page.`,
        },
      },
    ],
  };

  return (
    <>
      {/* JSON-LD Structured Data */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jobPostingSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />

      {/* Track this job visit for Recently Viewed feature (client-side) */}
      <TrackJobViewWrapper slug={job.slug} title={job.title} category={job.category} />
      <JobAbandonTracker jobTitle={job.title} jobSlug={job.slug} />

      <div className="bg-gray-50 dark:bg-[#000000] min-h-screen py-8 px-4">
        <div className="max-w-4xl mx-auto space-y-6">
          
          {/* Semantic Breadcrumb (SEO + accessibility) */}
          <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm text-gray-500 mb-2">
            <Link href="/" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors font-medium">Home</Link>
            <span className="text-gray-300">/</span>
            <Link href={`/${job.category}`} className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors font-medium capitalize">{categoryLabel}</Link>
            <span className="text-gray-300">/</span>
            <span className="text-gray-700 dark:text-gray-300 font-semibold truncate max-w-[200px]">{job.title}</span>
          </nav>

          {/* Top Level Quick Action CTA Bar */}
          <div className="bg-white dark:bg-zinc-950 border border-indigo-100 dark:border-indigo-900/50 rounded-2xl p-4 sm:p-5 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-sm font-black text-gray-900 dark:text-white mb-1">Quick Application Actions</h2>
              <p className="text-xs text-gray-500 font-medium">Direct official application link & premium form filling service.</p>
            </div>
            <div className="flex gap-2.5 shrink-0">
              {applyLink && (
                <a 
                  href={applyLink} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-xl shadow-md shadow-emerald-500/20 transition-all hover:-translate-y-0.5 active:translate-y-0 text-center flex-1 sm:flex-none"
                >
                  Apply Official ↗
                </a>
              )}
              {customApplyLink ? (
                <Link 
                  href={customApplyLink} 
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black rounded-xl shadow-md shadow-indigo-500/20 transition-all hover:-translate-y-0.5 active:translate-y-0 text-center flex-1 sm:flex-none"
                >
                  Apply For Me ✨
                </Link>
              ) : (
                <Link 
                  href="/apply-for-me" 
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black rounded-xl shadow-md shadow-indigo-500/20 transition-all hover:-translate-y-0.5 active:translate-y-0 text-center flex-1 sm:flex-none"
                >
                  Apply For Me ✨
                </Link>
              )}
            </div>
          </div>

          {/* 1. Header Section */}
          <div className="bg-white dark:bg-zinc-950 rounded-2xl border border-gray-200 dark:border-zinc-900 p-6 md:p-8 shadow-sm relative overflow-hidden mb-6">
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50 dark:bg-indigo-900/20 rounded-full blur-3xl -mt-20 -mr-20 pointer-events-none" />
            
            <div className="relative z-10">
              <div className="flex items-center justify-between gap-2 mb-4">
                <div className="inline-flex items-center gap-2">
                  <span className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-bold px-2.5 py-1 rounded-md border border-green-200 dark:border-green-800/50 uppercase tracking-wider">
                    {job.status === "out" ? "Out Now" : job.status}
                  </span>
                  <span className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-widest">{job.category.replace("-", " ")}</span>
                </div>
                <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm rounded-full shadow-sm border border-gray-200 dark:border-zinc-800">
                  <SaveJobButton jobSlug={job.slug} jobTitle={job.title} />
                </div>
              </div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 dark:text-white mb-3 leading-tight">
                {job.title}
              </h1>
              {job.short_info && (
                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed mb-4">
                  <span className="font-semibold text-gray-900 dark:text-gray-200">Short Information:</span> {job.short_info}
                </p>
              )}
              {job.important_dates && job.important_dates.length > 0 && (
                 <p className="text-xs text-gray-500 font-bold bg-gray-50 dark:bg-zinc-900 inline-block px-3 py-1 rounded-full border border-gray-200 dark:border-zinc-800">
                    Last Updated: {new Date(job.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
              )}
            </div>
          </div>

          <SocialProofBadges slug={job.slug} lastDate={lastDate} />

          {/* 🔥 FOMO Bar — live Apply For Me count + live viewers for this job */}
          <ApplyFomoBar
            identifier={job.slug}
            category={job.category || "default"}
            lastDate={lastDate}
          />
          
          <MatchScoreCard job={{
            title: job.title,
            category: job.category,
            education: job.eligibility || job.education || job.content,
            ageLimit: job.age_limit || job.age_details || job.content,
            last_date: lastDate,
            appFeeGen: job.application_fee || job.fee_detail || job.content,
            totalPosts: job.total_posts || job.total_vacancy
          }} />

          <PushSubscribeWidget delay={20000} />

          {/* 2. Job Banner (Thumbnail) */}
          {job.banner_url && (
            <div className="w-full rounded-2xl overflow-hidden border border-gray-200 dark:border-zinc-900 shadow-sm bg-gray-50 dark:bg-zinc-950 mb-6">
              <img 
                src={job.banner_url} 
                alt={job.title} 
                className="w-full h-auto object-contain max-h-[250px] sm:max-h-[350px] mx-auto" 
              />
            </div>
          )}

          {/* 3. Blog Post Content Area (Primary Details / Tables) */}
          <div className="bg-white dark:bg-zinc-950 rounded-2xl border border-gray-200 dark:border-zinc-900 p-4 sm:p-8 shadow-sm">
             <style>{`
              .blog-content { line-height: 1.75; color: #374151; font-size: 15px; }
              .dark .blog-content { color: #d1d5db; }
              .blog-content h1, .blog-content h2 { color: #111827; font-weight: 800; margin-top: 1.5rem; margin-bottom: 0.75rem; font-size: 1.15rem; }
              .blog-content h3 { color: #1f2937; font-weight: 700; margin-top: 1.25rem; margin-bottom: 0.5rem; font-size: 1rem; }
              @media(min-width:640px){
                .blog-content h1, .blog-content h2 { font-size: 1.5rem; margin-top: 2rem; }
                .blog-content h3 { font-size: 1.15rem; }
              }
              .dark .blog-content h1, .dark .blog-content h2, .dark .blog-content h3 { color: #f9fafb; }
              .blog-content p { margin-bottom: 0.9rem; }
              /* ── Table: always scrollable horizontally on mobile ── */
              .blog-content table { width: 100%; border-collapse: collapse; margin-bottom: 1.5rem; border-radius: 8px; font-size: 13px; display: block; overflow-x: auto; -webkit-overflow-scrolling: touch; white-space: nowrap; }
              .blog-content thead, .blog-content tbody, .blog-content tr { display: table; width: 100%; table-layout: fixed; }
              .blog-content th, .blog-content td { border: 1px solid #e5e7eb; padding: 8px 12px; text-align: left; white-space: normal; word-break: break-word; }
              @media(min-width:640px){
                .blog-content table { display: table; overflow-x: visible; white-space: normal; }
                .blog-content thead, .blog-content tbody, .blog-content tr { display: table-row-group; width: auto; }
                .blog-content tr { display: table-row; }
                .blog-content th, .blog-content td { padding: 12px 14px; font-size: 14px; }
              }
              .blog-content th { background-color: #4f46e5; color: white; font-weight: 700; }
              .dark .blog-content table, .dark .blog-content th, .dark .blog-content td { border-color: #18181b; }
              .dark .blog-content th { background-color: #1e1b4b; }
              .dark .blog-content td { background-color: #000000; color: #d1d5db; }
              /* ── Hide AI-generated Table of Contents ── */
              .blog-content div[style*='background:#f9fafb'],
              .blog-content div[style*="background:#f9fafb"],
              .blog-content div[style*='background: #f9fafb'],
              .blog-content div[style*="background: #f9fafb"] { display: none !important; }
              /* ── Other styles ── */
              .blog-content img { max-width: 100%; border-radius: 8px; margin: 1rem 0; }
              .blog-content a { color: #4f46e5; text-decoration: underline; word-break: break-all; }
              .dark .blog-content a { color: #818cf8; }
              .blog-content ul { list-style-type: disc; margin-left: 1.25rem; margin-bottom: 0.9rem; }
              .blog-content ol { list-style-type: decimal; margin-left: 1.25rem; margin-bottom: 0.9rem; }
              .blog-content li { margin-bottom: 0.4rem; }
             `}</style>
             
             <article
               className="blog-content max-w-none break-words"
               dangerouslySetInnerHTML={{ __html: job.blog_content || DEMO_BLOG_CONTENT }}
             />

             <div className="bg-orange-50 dark:bg-orange-900/10 border-l-4 border-orange-500 p-4 rounded-r-lg mt-8">
               <p className="text-sm text-orange-800 dark:text-orange-200">
                 <em>Note: If you do not have time or find the process complicated, you can use our premium <strong className="font-bold">Apply For Me</strong> service. Just upload your documents securely, and our expert team will accurately fill out and submit your form.</em>
               </p>
             </div>
          </div>

          {/* Middle Banner Ad */}
          <AdSensePlaceholder format="leaderboard" />

          {/* 4. Promo Banner ("Apply For Me" service callout) */}
          {(() => {
            const customApplyLink = job.links?.find((l: any) => l.label.toLowerCase().includes('apply for me'))?.url;
            return (
              <div className="relative rounded-2xl overflow-hidden mt-8 shadow-2xl shadow-orange-500/10 border border-orange-200/50 dark:border-orange-900/50">
                <div className="absolute inset-0 bg-gradient-to-br from-orange-500 to-rose-600 dark:from-orange-600 dark:to-rose-800 opacity-95"></div>
                <div className="relative p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6">
                  
                  <div className="flex items-center gap-5 w-full sm:w-auto">
                    <div className="bg-white/20 backdrop-blur-md p-4 rounded-2xl shrink-0 shadow-inner">
                      <UploadCloud className="w-8 h-8 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-white mb-1 tracking-wide">Form Bharne Ka Time Nahi?</h3>
                      <p className="text-orange-100 text-sm font-medium">Upload documents & let our expert team safely apply for you.</p>
                    </div>
                  </div>
                  
                  {customApplyLink ? (
                    <Link href={customApplyLink} target={customApplyLink.startsWith("http") ? "_blank" : "_self"} className="shrink-0 w-full sm:w-auto text-center bg-white text-orange-600 hover:scale-105 hover:bg-orange-50 px-8 py-4 rounded-xl font-black shadow-xl transition-all duration-300">
                      Apply For Me Now →
                    </Link>
                  ) : (
                    <span 
                      title="Special 'Apply For Me' service for this job will be activated soon. Stay tuned!"
                      className="shrink-0 w-full sm:w-auto text-center bg-white/20 text-white px-8 py-4 rounded-xl font-bold border border-white/30 cursor-not-allowed"
                    >
                      Coming Soon
                    </span>
                  )}
                </div>
              </div>
            );
          })()}

          {/* 5. Age Calculator (Check Eligibility) */}
          <AgeCalculator />

          {/* 6. Viral Share Module */}
          <div className="bg-white dark:bg-zinc-950 border border-indigo-100 dark:border-indigo-900/50 rounded-2xl p-4 md:p-5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 w-2 h-full bg-gradient-to-b from-[#25D366] to-[#0088cc]"></div>
            <div>
              <h3 className="font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
                <Share2 className="w-5 h-5 text-indigo-500" /> Share with Friends & Study Groups
              </h3>
              <p className="text-xs text-gray-500 mt-1 font-medium">Help someone get a government job by sharing this update.</p>
            </div>
            <div className="flex w-full sm:w-auto gap-3 flex-wrap">
              <a 
                href={`https://api.whatsapp.com/send?text=🔥 *${encodeURIComponent(job.title)}* %0A%0AApply Here: https://rojgarsuvidha.com/job/${slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#1ebe57] text-white px-5 py-2.5 rounded-xl font-bold shadow-md shadow-[#25D366]/20 transition-all hover:-translate-y-0.5"
              >
                <MessageCircle className="w-5 h-5" /> WhatsApp
              </a>
              <a 
                href={`https://t.me/share/url?url=https://rojgarsuvidha.com/job/${slug}&text=🔥 ${encodeURIComponent(job.title)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-[#0088cc] hover:bg-[#0077b5] text-white px-5 py-2.5 rounded-xl font-bold shadow-md shadow-[#0088cc]/20 transition-all hover:-translate-y-0.5"
              >
                <Send className="w-5 h-5" /> Telegram
              </a>
              {/* Copy Link button */}
              <ShareJobButton url={`https://www.rojgarsuvidha.com/job/${slug}`} title={job.title} />
            </div>
          </div>

          {/* Content Banner Ad */}
          <AdSensePlaceholder format="responsive" />

          {/* SIMILAR JOBS SECTION */}
          {similarJobs && similarJobs.length > 0 && (
            <div className="mb-8">
              <h3 className="text-lg font-extrabold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <span className="w-1.5 h-6 bg-indigo-500 rounded-full"></span> 
                You May Also Like
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {similarJobs.map((simJob: any) => (
                  <Link href={`/job/${simJob.slug}`} key={simJob.slug} className="group bg-white dark:bg-zinc-950 border border-gray-200 dark:border-zinc-900 rounded-2xl p-4 hover:shadow-md transition-all hover:border-indigo-300 dark:hover:border-indigo-700/50 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 dark:bg-indigo-900/30 px-2 py-0.5 rounded-md">
                          {simJob.category}
                        </span>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 bg-gray-100 dark:bg-zinc-900 px-2 py-0.5 rounded-md">
                          {simJob.status}
                        </span>
                      </div>
                      <h4 className="font-bold text-sm text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-2">
                        {simJob.title}
                      </h4>
                    </div>
                    <div className="mt-4 flex items-center justify-between text-xs font-semibold text-gray-500">
                      <span>View Details</span>
                      <svg className="w-4 h-4 text-gray-400 group-hover:text-indigo-500 transition-colors group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* 5. Important Links */}
          <div className="bg-white dark:bg-zinc-950 rounded-2xl border border-gray-200 dark:border-zinc-900 overflow-hidden shadow-sm">
            <div className="bg-indigo-50 dark:bg-zinc-900/50 px-5 py-4 border-b border-gray-200 dark:border-zinc-900 flex items-center gap-2">
              <LinkIcon className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <h2 className="font-bold text-gray-900 dark:text-white">Important Links</h2>
            </div>
            
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              {job.links && job.links.length > 0 ? job.links.filter((l: any) => !l.label.toLowerCase().includes('apply for me')).map((link: any, idx: number) => (
                <div key={idx} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-gray-50 dark:hover:bg-gray-800/20 transition-colors">
                  <span className="font-bold text-gray-900 dark:text-gray-200 text-sm">{link.label}</span>
                  <a href={link.url} target="_blank" rel="noopener noreferrer" className={`inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold transition-colors w-full sm:w-auto ${
                    link.label.toLowerCase().includes('apply') || link.label.toLowerCase().includes('online') 
                      ? 'bg-indigo-600 hover:bg-indigo-700 text-white' 
                      : 'bg-gray-100 dark:bg-zinc-900 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}>
                    {link.label.toLowerCase().includes('apply') ? 'Click Here' : <LinkIcon className="w-4 h-4" />}
                  </a>
                </div>
              )) : (
                <div className="p-5 text-center text-gray-500 text-sm">No important links available.</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
