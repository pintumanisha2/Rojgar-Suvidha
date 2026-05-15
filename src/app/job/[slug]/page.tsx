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
import TrackJobView from "@/components/ui/TrackJobView";
import CopyLinkButton from "@/components/ui/CopyLinkButton";
import type { Metadata } from "next";

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
    .select("title, short_info, category, created_at, slug")
    .eq("slug", slug)
    .single();

  if (!job) return { title: "Job Not Found | Rojgar Suvidha" };

  const categoryLabel = job.category?.replace(/-/g, " ").replace(/\b\w/g, (l: string) => l.toUpperCase()) || "";
  
  // SEO-optimized title with year + action keywords
  const title = `${job.title} 2025 – Apply Online, Eligibility, Vacancy, Last Date`;
  
  // Rich description for featured snippets (AEO)
  const description = job.short_info
    ? `${job.short_info.slice(0, 150)}. Check eligibility, important dates, vacancy details & apply online at Rojgar Suvidha.`
    : `${job.title} 2025 Notification Out. Check eligibility criteria, important dates, vacancy count, age limit, application fee & apply online. Latest update from ${categoryLabel} on Rojgar Suvidha.`;

  // Comprehensive keyword coverage
  const keywords = [
    job.title,
    `${job.title} 2025`, `${job.title} 2026`,
    `${job.title} apply online`, `${job.title} online form`,
    `${job.title} notification`, `${job.title} notification pdf`,
    `${job.title} eligibility`, `${job.title} age limit`,
    `${job.title} last date`, `${job.title} exam date`,
    `${job.title} vacancy`, `${job.title} salary`,
    `${job.title} syllabus`, `${job.title} admit card`,
    `${job.title} result`, `${job.title} answer key`,
    `${job.title} ka form kaise bhare`,
    "sarkari naukri 2025", "government jobs", "sarkari result",
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
      images: [{ url: "/og-image.png", width: 1200, height: 630, alt: job.title }],
    },
    twitter: {
      card: "summary_large_image",
      title: `${job.title} 2025 – Apply Now`,
      description: description.slice(0, 200),
      images: ["/og-image.png"],
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
    description: job.short_info || `Latest notification for ${job.title}. Apply online now.`,
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
  if (job.important_dates && job.important_dates.length > 0) {
    const ldObj = job.important_dates.find((d: any) => d.label === "Last Date");
    if (ldObj) lastDate = ldObj.value;
  }
  
  const jobPostingSchema = {
    "@context": "https://schema.org",
    "@type": "JobPosting",
    title: job.title,
    description: job.short_info || `Apply for ${job.title}`,
    datePosted: job.created_at,
    ...(lastDate && { validThrough: lastDate }),
    employmentType: "FULL_TIME",
    hiringOrganization: {
      "@type": "Organization",
      name: "Government of India",
      sameAs: BASE_URL,
    },
    jobLocation: {
      "@type": "Place",
      address: {
        "@type": "PostalAddress",
        addressCountry: "IN",
        addressRegion: job.state_code || "India",
      },
    },
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
      <TrackJobView slug={job.slug} title={job.title} category={job.category} />

      <div className="bg-gray-50 dark:bg-gray-950 min-h-screen py-8 px-4">
        <div className="max-w-4xl mx-auto space-y-6">
          
          {/* Semantic Breadcrumb (SEO + accessibility) */}
          <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm text-gray-500 mb-2">
            <Link href="/" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors font-medium">Home</Link>
            <span className="text-gray-300">/</span>
            <Link href={`/${job.category}`} className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors font-medium capitalize">{categoryLabel}</Link>
            <span className="text-gray-300">/</span>
            <span className="text-gray-700 dark:text-gray-300 font-semibold truncate max-w-[200px]">{job.title}</span>
          </nav>

          {/* 1. Header Section */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 md:p-8 shadow-sm relative overflow-hidden">
            {job.banner_url && (
              <div className="absolute inset-0 opacity-10 dark:opacity-20 pointer-events-none">
                <img src={job.banner_url} alt="Banner" className="w-full h-full object-cover blur-sm" />
              </div>
            )}
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50 dark:bg-indigo-900/20 rounded-full blur-3xl -mt-20 -mr-20 pointer-events-none" />
            
            <div className="relative z-10">
              <div className="flex items-center justify-between gap-2 mb-4">
                <div className="inline-flex items-center gap-2">
                  <span className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-bold px-2.5 py-1 rounded-md border border-green-200 dark:border-green-800/50 uppercase tracking-wider">
                    {job.status === "out" ? "Out Now" : job.status}
                  </span>
                  <span className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-widest">{job.category.replace("-", " ")}</span>
                </div>
                <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-full shadow-sm border border-gray-200 dark:border-gray-700">
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
                 <p className="text-xs text-gray-500 font-bold bg-gray-50 dark:bg-gray-800 inline-block px-3 py-1 rounded-full border border-gray-200 dark:border-gray-700">
                    Last Updated: {new Date(job.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                 </p>
              )}
            </div>
          </div>

          {/* LIVE EXAM PROGRESS TRACKER (TIMELINE) */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 shadow-sm mb-6 overflow-hidden">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-6 uppercase tracking-widest flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" /> Live Status Tracker
            </h3>
            <div className="relative flex flex-col md:flex-row justify-between w-full">
              {/* Progress Line Background */}
              <div className="absolute top-4 md:top-1/2 left-4 md:left-10 md:right-10 md:-translate-y-1/2 w-0.5 h-[calc(100%-2rem)] md:h-0.5 md:w-auto bg-gray-200 dark:bg-gray-800" />
              
              {/* Progress Line Active (Depends on Status) */}
              <div 
                className="absolute top-4 md:top-1/2 left-4 md:left-10 md:-translate-y-1/2 w-0.5 md:h-0.5 md:w-auto bg-green-500 transition-all duration-1000 z-0" 
                style={{ 
                  height: typeof window !== 'undefined' && window.innerWidth < 768 
                    ? (job.status === 'Latest Jobs' ? '20%' : job.status === 'Admit Card' ? '60%' : job.status === 'Result' ? '100%' : '20%')
                    : 'auto',
                  width: typeof window !== 'undefined' && window.innerWidth >= 768 
                    ? (job.status === 'Latest Jobs' ? '20%' : job.status === 'Admit Card' ? '60%' : job.status === 'Result' ? '100%' : '20%')
                    : 'auto'
                }} 
              />

              {[
                { title: "Notification Out", active: true, done: true },
                { title: "Form Open", active: true, done: true },
                { title: "Admit Card", active: job.status === 'Admit Card' || job.status === 'Result', done: job.status === 'Admit Card' || job.status === 'Result' },
                { title: "Result Declared", active: job.status === 'Result', done: job.status === 'Result' },
              ].map((step, index) => (
                <div key={index} className="relative z-10 flex md:flex-col items-center gap-4 md:gap-2 mb-6 md:mb-0 w-full md:w-1/4">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border-4 ${
                    step.done 
                      ? 'bg-green-500 border-green-100 dark:border-green-900/50 text-white shadow-lg shadow-green-500/30' 
                      : 'bg-gray-100 dark:bg-gray-800 border-white dark:border-gray-900 text-gray-400'
                  } transition-all duration-500`}>
                    {step.done ? (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <span className="w-2 h-2 rounded-full bg-gray-300 dark:bg-gray-600" />
                    )}
                  </div>
                  <div className="md:text-center mt-1">
                    <p className={`text-xs md:text-sm font-bold ${step.active ? 'text-gray-900 dark:text-white' : 'text-gray-400 dark:text-gray-600'}`}>
                      {step.title}
                    </p>
                    {step.active && !step.done && (
                      <p className="text-[10px] text-orange-500 font-bold uppercase tracking-wider mt-0.5">Awaiting</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Viral Share Module */}
          <div className="bg-white dark:bg-gray-900 border border-indigo-100 dark:border-indigo-900/50 rounded-2xl p-4 md:p-5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm relative overflow-hidden">
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
              <CopyLinkButton url={`https://rojgarsuvidha.com/job/${slug}`} title={job.title} />
            </div>
          </div>

          {/* Middle Banner Ad */}
          <AdSensePlaceholder format="leaderboard" />

          {/* 2. Promo Banner (User's USP) */}
          {(() => {
            // Find custom Apply For Me link
            const customApplyLink = job.links?.find((l: any) => l.label.toLowerCase().includes('apply for me'))?.url;
            return (
              <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-2xl p-6 shadow-lg shadow-orange-500/20 text-white flex flex-col sm:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                  <div className="bg-white/20 p-3 rounded-xl shrink-0">
                    <UploadCloud className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold mb-1">Form Bharne Ka Time Nahi?</h3>
                    <p className="text-orange-100 text-sm">Upload documents and let our experts apply 100% safely.</p>
                  </div>
                </div>
                {customApplyLink ? (
                  <Link href={customApplyLink} target={customApplyLink.startsWith("http") ? "_blank" : "_self"} className="shrink-0 bg-white text-orange-600 hover:bg-orange-50 px-6 py-3 rounded-xl font-bold shadow-md transition-all">
                    Apply For Me
                  </Link>
                ) : (
                  <span 
                    title="Special 'Apply For Me' service for this job will be activated soon. Stay tuned!"
                    className="shrink-0 bg-white/20 text-white px-6 py-3 rounded-xl font-bold shadow-sm border border-white/30 cursor-not-allowed"
                  >
                    Coming Soon
                  </span>
                )}
              </div>
            );
          })()}

          {/* Blog Post Content Area */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-4 sm:p-8 shadow-sm">
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
              /* Mobile: table scrolls horizontally instead of overflowing */
              .blog-content table { width: 100%; border-collapse: collapse; margin-bottom: 1.5rem; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden; font-size: 13px; }
              .blog-table-wrap { overflow-x: auto; -webkit-overflow-scrolling: touch; margin-bottom: 1.5rem; border-radius: 8px; border: 1px solid #e5e7eb; }
              .blog-table-wrap table { margin-bottom: 0; border: none; border-radius: 0; min-width: 320px; }
              .blog-content th, .blog-content td { border: 1px solid #e5e7eb; padding: 8px 10px; text-align: left; }
              @media(min-width:640px){
                .blog-content th, .blog-content td { padding: 12px 14px; font-size: 14px; }
              }
              .blog-content th { background-color: #f3f4f6; font-weight: 700; }
              .dark .blog-content table, .dark .blog-content th, .dark .blog-content td { border-color: #374151; }
              .dark .blog-table-wrap { border-color: #374151; }
              .dark .blog-content th { background-color: #1f2937; }
              .blog-content img { max-width: 100%; border-radius: 8px; margin: 1rem 0; }
              .blog-content a { color: #4f46e5; text-decoration: underline; word-break: break-all; }
              .dark .blog-content a { color: #818cf8; }
              .blog-content ul { list-style-type: disc; margin-left: 1.25rem; margin-bottom: 0.9rem; }
              .blog-content ol { list-style-type: decimal; margin-left: 1.25rem; margin-bottom: 0.9rem; }
              .blog-content li { margin-bottom: 0.25rem; }
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
                  <Link href={`/job/${simJob.slug}`} key={simJob.slug} className="group bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-4 hover:shadow-md transition-all hover:border-indigo-300 dark:hover:border-indigo-700/50 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 dark:bg-indigo-900/30 px-2 py-0.5 rounded-md">
                          {simJob.category}
                        </span>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-md">
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
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden shadow-sm">
            <div className="bg-indigo-50 dark:bg-gray-800/50 px-5 py-4 border-b border-gray-200 dark:border-gray-800 flex items-center gap-2">
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
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
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
