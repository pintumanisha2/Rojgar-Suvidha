import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { CheckCircle2, Award, BookOpen, Calendar, ArrowRight, ShieldCheck, User, MessageCircle, Send } from "lucide-react";
import { getAuthorBySlug, AUTHORS } from "@/lib/authors";
import { supabase } from "@/lib/supabase";
import AdSensePlaceholder from "@/components/ads/AdSensePlaceholder";

const BASE_URL = "https://www.rojgarsuvidha.com";

export async function generateStaticParams() {
  return AUTHORS.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
  const { slug } = await params;
  const author = getAuthorBySlug(slug);
  if (!author) return { title: "Author Not Found | Rojgar Suvidha" };

  return {
    title: `${author.name} (${author.role}) — Editorial Profile | Rojgar Suvidha`,
    description: `Read articles and Sarkari recruitment analysis by ${author.name}, ${author.role} at Rojgar Suvidha. ${author.qualification}. ${author.experience}.`,
    alternates: {
      canonical: `${BASE_URL}/author/${author.slug}`,
    },
    openGraph: {
      title: `${author.name} — ${author.role} | Rojgar Suvidha`,
      description: author.bio,
      url: `${BASE_URL}/author/${author.slug}`,
      siteName: "Rojgar Suvidha",
      type: "profile",
    },
  };
}

export default async function AuthorProfilePage(
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const author = getAuthorBySlug(slug);

  if (!author) {
    notFound();
  }

  // Fetch recent articles from jobs table matching author's specialty categories
  const { data: recentJobs } = await supabase
    .from("jobs")
    .select("title, slug, category, created_at, state_code, short_info")
    .in("category", author.speciality)
    .order("created_at", { ascending: false })
    .limit(12);

  // JSON-LD ProfilePage + Person Schema for E-E-A-T
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "ProfilePage",
        "@id": `${BASE_URL}/author/${author.slug}`,
        "url": `${BASE_URL}/author/${author.slug}`,
        "name": `${author.name} — Author Profile`,
        "isPartOf": {
          "@type": "WebSite",
          "name": "Rojgar Suvidha",
          "url": BASE_URL,
        },
        "mainEntity": {
          "@id": `${BASE_URL}/author/${author.slug}#person`,
        },
      },
      {
        "@type": "Person",
        "@id": `${BASE_URL}/author/${author.slug}#person`,
        "name": author.name,
        "jobTitle": author.role,
        "description": author.bio,
        "worksFor": {
          "@type": "Organization",
          "name": "Rojgar Suvidha",
          "url": BASE_URL,
        },
        "knowsAbout": ["Sarkari Result", "Government Jobs", "Sarkari Exam", "Admit Card", "Recruitment Notifications"],
        "sameAs": Object.values(author.socials).filter(Boolean),
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <main className="min-h-screen bg-gray-50/50 dark:bg-zinc-950 py-8 sm:py-12">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">

          {/* Breadcrumb Navigation */}
          <nav className="flex items-center gap-2 text-xs font-semibold text-gray-500 dark:text-gray-400 mb-6">
            <Link href="/" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
              Home
            </Link>
            <span>/</span>
            <span className="text-gray-400">Editorial Team</span>
            <span>/</span>
            <span className="text-gray-900 dark:text-white font-bold">{author.name}</span>
          </nav>

          {/* Author Profile Hero Card */}
          <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-gray-200 dark:border-zinc-800 shadow-xl overflow-hidden mb-10">
            {/* Top Decorative Gradient Banner */}
            <div className="h-32 sm:h-40 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 relative">
              <div className="absolute inset-0 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px] opacity-10" />
            </div>

            <div className="px-6 sm:px-10 pb-8 relative">
              {/* Avatar + Main Info Header */}
              <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-6 -mt-16 sm:-mt-20 mb-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-end gap-5">
                  {/* Large Avatar Initial Badge */}
                  <div className={`w-28 h-28 sm:w-36 sm:h-36 rounded-2xl ${author.color} text-white font-black text-4xl sm:text-6xl flex items-center justify-center shadow-2xl border-4 border-white dark:border-zinc-900 shrink-0`}>
                    {author.initial}
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h1 className="text-2xl sm:text-4xl font-black text-gray-900 dark:text-white tracking-tight">
                        {author.name}
                      </h1>
                      <CheckCircle2 className="w-6 h-6 text-indigo-500 fill-indigo-100 dark:fill-indigo-950 shrink-0" />
                    </div>
                    <p className="text-sm sm:text-base font-bold text-indigo-600 dark:text-indigo-400">
                      {author.role}
                    </p>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 dark:text-gray-400 pt-1">
                      <span className="flex items-center gap-1 font-medium bg-gray-100 dark:bg-zinc-800 px-2.5 py-1 rounded-md">
                        <Award className="w-3.5 h-3.5 text-amber-500" />
                        {author.qualification}
                      </span>
                      <span className="flex items-center gap-1 font-medium bg-gray-100 dark:bg-zinc-800 px-2.5 py-1 rounded-md">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                        {author.experience}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Verified E-E-A-T Badge */}
                <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-2xl p-3.5 text-xs text-emerald-800 dark:text-emerald-300 font-semibold flex items-center gap-2.5 shrink-0 self-stretch sm:self-auto">
                  <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <div>
                    <div className="font-bold text-emerald-900 dark:text-emerald-200">Verified Editorial Expert</div>
                    <div className="text-[11px] text-emerald-700 dark:text-emerald-400">Google E-E-A-T Compliant</div>
                  </div>
                </div>
              </div>

              {/* Bio Section */}
              <div className="border-t border-gray-100 dark:border-zinc-800/80 pt-6 mt-6">
                <h2 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">About The Author</h2>
                <p className="text-sm sm:text-base text-gray-700 dark:text-gray-300 leading-relaxed font-normal">
                  {author.bio}
                </p>
              </div>

              {/* Covered Categories */}
              <div className="mt-6 flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold text-gray-400 mr-2">Specialization Desk:</span>
                {author.speciality.map((cat) => (
                  <span
                    key={cat}
                    className="bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wide"
                  >
                    {cat.replace(/-/g, " ")}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Ad Banner */}
          <AdSensePlaceholder format="responsive" />

          {/* Articles Section Header */}
          <div className="flex items-center justify-between gap-4 mb-6 mt-10">
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white flex items-center gap-2">
                <BookOpen className="w-6 h-6 text-indigo-600" />
                Latest Articles & Analysis by {author.name}
              </h2>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
                Verified recruitment notifications, exam schedules, and results published by {author.name}.
              </p>
            </div>
          </div>

          {/* Articles Grid */}
          {recentJobs && recentJobs.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {recentJobs.map((job) => (
                <Link
                  key={job.slug}
                  href={`/job/${job.slug}`}
                  className="group bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl p-5 hover:shadow-xl hover:border-indigo-400 dark:hover:border-indigo-600 transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2.5">
                      <span className="bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900 px-2.5 py-0.5 rounded-md text-[11px] font-bold uppercase tracking-wider">
                        {job.category?.replace(/-/g, " ")}
                      </span>
                      {job.state_code && (
                        <span className="text-[11px] font-bold text-gray-400">
                          State: {job.state_code}
                        </span>
                      )}
                    </div>

                    <h3 className="text-base font-bold text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-2 leading-snug">
                      {job.title}
                    </h3>

                    {job.short_info && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mt-2 leading-relaxed">
                        {job.short_info}
                      </p>
                    )}
                  </div>

                  <div className="mt-4 pt-3 border-t border-gray-100 dark:border-zinc-800/60 flex items-center justify-between text-xs text-gray-500">
                    <span className="flex items-center gap-1 font-medium">
                      <Calendar className="w-3.5 h-3.5 text-gray-400" />
                      {new Date(job.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                    </span>
                    <span className="text-indigo-600 dark:text-indigo-400 font-bold flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                      Read Full Details <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800 p-8 text-center">
              <p className="text-sm text-gray-500">No recent articles found for this author desk.</p>
            </div>
          )}

          {/* Bottom Team Showcase Cards */}
          <div className="mt-16 pt-10 border-t border-gray-200 dark:border-zinc-800">
            <h3 className="text-lg font-extrabold text-gray-900 dark:text-white mb-4">
              Meet Other Editorial Experts at Rojgar Suvidha
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {AUTHORS.filter((a) => a.slug !== author.slug).map((other) => (
                <Link
                  key={other.slug}
                  href={`/author/${other.slug}`}
                  className="group bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl p-4 hover:shadow-lg hover:border-indigo-300 transition-all flex items-center gap-3"
                >
                  <div className={`w-12 h-12 rounded-xl ${other.color} text-white font-black text-lg flex items-center justify-center shrink-0 shadow-md`}>
                    {other.initial}
                  </div>
                  <div className="overflow-hidden">
                    <h4 className="font-bold text-sm text-gray-900 dark:text-white group-hover:text-indigo-600 transition-colors truncate">
                      {other.name}
                    </h4>
                    <p className="text-[11px] text-gray-500 truncate">{other.role}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>

        </div>
      </main>
    </>
  );
}
