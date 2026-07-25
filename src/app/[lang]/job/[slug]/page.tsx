import { notFound } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import type { Metadata } from "next";
import {
  LANGUAGE_CONFIG,
  SUPPORTED_LANGUAGES,
  isValidLang,
  buildHreflangAlternates,
  UI_STRINGS,
  BASE_URL,
  type SupportedLang,
} from "@/lib/i18n";
import LanguageSwitcher from "@/components/ui/LanguageSwitcher";
import AdSensePlaceholder from "@/components/ads/AdSensePlaceholder";

// ── Static params generation ─────────────────────────────────────────────────
export async function generateStaticParams() {
  const { data: jobs } = await supabase
    .from("jobs")
    .select("slug")
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(200);

  const params: { lang: string; slug: string }[] = [];
  for (const lang of SUPPORTED_LANGUAGES) {
    for (const job of jobs || []) {
      params.push({ lang, slug: job.slug });
    }
  }
  return params;
}

// ── Dynamic Metadata ─────────────────────────────────────────────────────────
export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string; slug: string }>;
}): Promise<Metadata> {
  const { lang, slug } = await params;

  if (!isValidLang(lang)) return { title: "Not Found" };

  const langConfig = LANGUAGE_CONFIG[lang];
  const { data: job } = await supabase
    .from("jobs")
    .select("title, meta_description, short_info, banner_url, category, created_at")
    .eq("slug", slug)
    .single();

  if (!job) return { title: "Job Not Found | Rojgar Suvidha" };

  const hreflang = buildHreflangAlternates(slug);
  const shareImage = job.banner_url || `${BASE_URL}/og-image.png`;
  const title = `${job.title} – ${langConfig.nativeLabel} | Rojgar Suvidha`;
  const description = job.meta_description || job.short_info || `${job.title} notification details in ${langConfig.label}.`;

  return {
    title,
    description,
    alternates: {
      canonical: `${BASE_URL}/${lang}/job/${slug}`,
      languages: hreflang.languages,
    },
    openGraph: {
      title,
      description,
      url: `${BASE_URL}/${lang}/job/${slug}`,
      type: "article",
      publishedTime: job.created_at,
      siteName: "Rojgar Suvidha",
      images: [{ url: shareImage, width: 1200, height: 630, alt: job.title }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: description.slice(0, 200),
      images: [shareImage],
    },
  };
}

export const revalidate = 3600; // Re-generate every hour

// ── Main Page Component ──────────────────────────────────────────────────────
export default async function MultilingualJobPage({
  params,
}: {
  params: Promise<{ lang: string; slug: string }>;
}) {
  const { lang, slug } = await params;

  // Validate language
  if (!isValidLang(lang)) notFound();

  const langConfig = LANGUAGE_CONFIG[lang];
  const contentColumn = langConfig.contentColumn; // e.g. blog_content_hi

  // Fetch job with all translation columns — use * to avoid TS type errors with dynamic column names
  const { data: job } = await supabase
    .from("jobs")
    .select("*")
    .eq("slug", slug)
    .single();

  if (!job || (job as any).status === "hidden") notFound();

  const ui = UI_STRINGS[lang] || UI_STRINGS.en;
  const isRTL = langConfig.dir === "rtl";

  // Get translated content — fallback to English if translation not yet ready
  const translatedContent = (job as any)[contentColumn];
  const hasTranslation = !!translatedContent;
  const blogContent = translatedContent || job.blog_content;

  // Check which languages have translations available
  const { data: availData } = await supabase
    .from("jobs")
    .select("blog_content_hi, blog_content_bn, blog_content_ur")
    .eq("slug", slug)
    .single();

  const availableTranslations = SUPPORTED_LANGUAGES.filter(
    (l) => !!(availData as any)?.[`blog_content_${l}`]
  );

  // Apply link
  const applyLink = job.links?.find((l: any) =>
    l.label?.toLowerCase().includes("apply")
  )?.url || job.official_link;

  return (
    <div
      className="min-h-screen bg-gray-50 dark:bg-[#030712]"
      dir={isRTL ? "rtl" : "ltr"}
      lang={lang}
    >
      {/* ── Language Banner ── */}
      <div className="bg-indigo-600 text-white py-2 px-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between text-xs">
          <span className="font-medium opacity-80">
            {hasTranslation
              ? ui.translatedBy
              : `English content shown — ${langConfig.nativeLabel} translation coming soon`}
          </span>
          <LanguageSwitcher
            slug={slug}
            currentLang={lang}
            availableTranslations={availableTranslations}
          />
        </div>
      </div>

      {/* ── Back Navigation ── */}
      <div className="max-w-4xl mx-auto px-4 pt-4">
        <Link
          href={`/job/${slug}`}
          className="inline-flex items-center gap-1.5 text-xs text-indigo-600 dark:text-indigo-400 font-bold hover:underline"
        >
          ← English Version
        </Link>
      </div>

      {/* ── Main Content ── */}
      <article className="max-w-4xl mx-auto px-4 py-6">
        {/* hreflang JSON-LD for alternate languages */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Article",
              headline: job.title,
              inLanguage: lang,
              datePublished: job.created_at,
              publisher: {
                "@type": "Organization",
                name: "Rojgar Suvidha",
                url: BASE_URL,
              },
              mainEntityOfPage: `${BASE_URL}/${lang}/job/${slug}`,
            }),
          }}
        />

        {/* Quick info bar */}
        {(job.last_date || job.total_posts || job.application_fee) && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6 p-4 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
            {job.last_date && (
              <div className="text-center">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1">{ui.lastDate}</p>
                <p className="text-sm font-bold text-red-600">{job.last_date}</p>
              </div>
            )}
            {job.total_posts && (
              <div className="text-center">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1">{ui.totalPosts}</p>
                <p className="text-sm font-bold text-indigo-600">{job.total_posts}</p>
              </div>
            )}
            {job.application_fee && (
              <div className="text-center">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1">Fee</p>
                <p className="text-sm font-bold text-gray-800 dark:text-gray-200">{job.application_fee}</p>
              </div>
            )}
          </div>
        )}

        {/* AdSense */}
        <div className="mb-6">
          <AdSensePlaceholder format="responsive" />
        </div>

        {/* Blog content */}
        <div
          className="prose prose-gray dark:prose-invert max-w-none
            prose-headings:font-extrabold prose-headings:text-gray-900 dark:prose-headings:text-white
            prose-p:text-gray-700 dark:prose-p:text-gray-300 prose-p:leading-relaxed
            prose-strong:text-gray-900 dark:prose-strong:text-white
            prose-a:text-indigo-600 prose-a:no-underline hover:prose-a:underline
            prose-table:text-sm prose-th:bg-indigo-600 prose-th:text-white"
          dangerouslySetInnerHTML={{ __html: blogContent || "" }}
        />

        {/* AdSense mid */}
        <div className="my-8">
          <AdSensePlaceholder format="rectangle" />
        </div>

        {/* Apply CTA */}
        {applyLink && (
          <div className="mt-8 p-6 bg-gradient-to-r from-indigo-600 to-violet-600 rounded-2xl text-center">
            <p className="text-white font-black text-lg mb-2">{job.title}</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center mt-4">
              <a
                href={applyLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block bg-white text-indigo-700 font-black px-6 py-3 rounded-xl text-sm hover:bg-gray-100 transition-colors"
              >
                {ui.applyNow} →
              </a>
              <Link
                href="/apply-for-me"
                className="inline-block bg-indigo-800 text-white font-bold px-6 py-3 rounded-xl text-sm hover:bg-indigo-900 transition-colors border border-indigo-400/30"
              >
                {ui.applyForMe}
              </Link>
            </div>
          </div>
        )}

        {/* Language switch footer */}
        <div className="mt-8 p-4 bg-gray-100 dark:bg-gray-800/50 rounded-xl text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 font-medium">{ui.readInLanguage}</p>
          <div className="flex flex-wrap justify-center gap-2">
            <Link href={`/job/${slug}`} className="px-3 py-1.5 text-xs font-bold bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
              🇬🇧 English
            </Link>
            {SUPPORTED_LANGUAGES.map((l) => {
              const cfg = LANGUAGE_CONFIG[l];
              const available = availableTranslations.includes(l);
              return (
                <Link
                  key={l}
                  href={`/${l}/job/${slug}`}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-colors
                    ${l === lang
                      ? "bg-indigo-600 text-white border-indigo-600"
                      : available
                        ? "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
                        : "bg-gray-100 dark:bg-gray-800 text-gray-400 border-gray-200 dark:border-gray-700"
                    }`}
                >
                  {cfg.nativeLabel}
                  {!available && <span className="ml-1 text-[9px]">(soon)</span>}
                </Link>
              );
            })}
          </div>
        </div>
      </article>
    </div>
  );
}
