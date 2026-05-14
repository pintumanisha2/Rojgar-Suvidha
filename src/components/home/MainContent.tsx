import Link from "next/link";
import { supabase } from "@/lib/supabase";
import {
  FileText, BookOpen, Briefcase, Key, GraduationCap,
  ArrowRight, Flame, Sparkles, AlertCircle, TrendingUp,
  Calendar, Users, Newspaper, ChevronRight,
} from "lucide-react";
import SaveJobButton from "@/components/ui/SaveJobButton";

type StatusKey = "out" | "active" | "last" | "soon" | "new";
type TagType = "hot" | "new" | "urgent";

interface JobItem {
  title: string;
  status: StatusKey;
  tag?: TagType;
  lastDate?: string;
  posts?: string;
  eligibility?: string;
}

interface Section {
  id: string;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  headerBg: string;
  items: JobItem[];
}

const sectionConfig = [
  { id: "results", title: "Results", icon: FileText, headerBg: "from-green-600 to-emerald-500" },
  { id: "admit-card", title: "Admit Cards", icon: BookOpen, headerBg: "from-orange-500 to-amber-500" },
  { id: "latest-jobs", title: "Latest Jobs", icon: Briefcase, headerBg: "from-red-500 to-rose-500" },
  { id: "answer-key", title: "Answer Key", icon: Key, headerBg: "from-purple-600 to-violet-500" },
  { id: "admission", title: "Admission", icon: GraduationCap, headerBg: "from-blue-600 to-sky-500" },
];

const statusMap: Record<StatusKey, { label: string; dot: string; text: string; bg: string }> = {
  out:    { label: "Out",     dot: "bg-green-500",  text: "text-green-700 dark:text-green-400",   bg: "bg-green-50 dark:bg-green-900/20" },
  active: { label: "Active",  dot: "bg-blue-500",   text: "text-blue-700 dark:text-blue-400",     bg: "bg-blue-50 dark:bg-blue-900/20" },
  last:   { label: "Today!",  dot: "bg-red-500",    text: "text-red-700 dark:text-red-400",       bg: "bg-red-50 dark:bg-red-900/20" },
  soon:   { label: "Closing", dot: "bg-orange-400", text: "text-orange-600 dark:text-orange-400", bg: "bg-orange-50 dark:bg-orange-900/20" },
  new:    { label: "New",     dot: "bg-purple-500", text: "text-purple-700 dark:text-purple-400", bg: "bg-purple-50 dark:bg-purple-900/20" },
};

function InlineTag({ tag }: { tag?: TagType }) {
  if (!tag) return null;
  if (tag === "hot")    return <Flame className="w-3 h-3 text-orange-500 shrink-0" />;
  if (tag === "new")    return <Sparkles className="w-3 h-3 text-purple-500 shrink-0" />;
  if (tag === "urgent") return <AlertCircle className="w-3 h-3 text-red-500 shrink-0 animate-pulse" />;
  return null;
}

export default async function MainContent({ stateCode }: { stateCode?: string }) {
  let query = supabase.from("jobs").select("*").neq("status", "draft").neq("category", "news").order("created_at", { ascending: false });
  
  if (stateCode) {
    // Show jobs for the specific state OR jobs that are All India (null, empty, or 'ALL')
    query = query.or(`state_code.eq.${stateCode},state_code.is.null,state_code.eq.,state_code.ilike.%all%`);
  }

  const { data: dbJobs } = await query;

  // Fetch latest news/blog articles separately
  const { data: newsArticles } = await supabase
    .from("jobs")
    .select("title, slug, created_at, short_info")
    .eq("category", "news")
    .neq("status", "draft")
    .order("created_at", { ascending: false })
    .limit(10);
  
  // Group jobs by category
  const jobsByCategory: Record<string, any[]> = {};
  if (dbJobs) {
    dbJobs.forEach((job: any) => {
      if (!jobsByCategory[job.category]) jobsByCategory[job.category] = [];
      jobsByCategory[job.category].push(job);
    });
  }

  // Map to sections
  const sections = sectionConfig.map(conf => ({
    ...conf,
    items: (jobsByCategory[conf.id] || []).slice(0, 15).map(job => {
      let lastDate = "";
      if (job.important_dates && job.important_dates.length > 0) {
        const ldObj = job.important_dates.find((d: any) => d.label === "Last Date");
        if (ldObj) lastDate = ldObj.value;
      }
      return {
        title: job.title,
        status: job.status as StatusKey,
        tag: job.tag as TagType,
        lastDate,
        slug: job.slug
      };
    })
  }));

  return (
    <section className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-5">

      {/* ── Jobs by Sector (SEO Internal Linking Hub) ── */}
      {!stateCode && (
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center gap-2 mb-3">
            <Briefcase className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-600" />
            <h2 className="text-base sm:text-lg font-extrabold text-gray-900 dark:text-white">Browse Jobs by Sector</h2>
            <span className="text-xs text-gray-400 ml-1">• 8 Categories</span>
          </div>
          <div className="grid grid-cols-4 lg:grid-cols-8 gap-2 sm:gap-3">
            {[
              { href: "/jobs/ssc", label: "SSC", emoji: "🏛️", sub: "CGL·CHSL·MTS", color: "from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-900/10 border-blue-200 dark:border-blue-800/50 hover:border-blue-400" },
              { href: "/jobs/railway", label: "Railway", emoji: "🚂", sub: "NTPC·GroupD", color: "from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-900/10 border-red-200 dark:border-red-800/50 hover:border-red-400" },
              { href: "/jobs/banking", label: "Banking", emoji: "🏦", sub: "IBPS·SBI·RBI", color: "from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-900/10 border-green-200 dark:border-green-800/50 hover:border-green-400" },
              { href: "/jobs/upsc", label: "UPSC", emoji: "🎖️", sub: "IAS·NDA·CDS", color: "from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-900/10 border-purple-200 dark:border-purple-800/50 hover:border-purple-400" },
              { href: "/jobs/police", label: "Police", emoji: "👮", sub: "UP·Delhi·CISF", color: "from-indigo-50 to-indigo-100 dark:from-indigo-900/20 dark:to-indigo-900/10 border-indigo-200 dark:border-indigo-800/50 hover:border-indigo-400" },
              { href: "/jobs/defence", label: "Defence", emoji: "🛡️", sub: "Army·Navy·AF", color: "from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-900/10 border-orange-200 dark:border-orange-800/50 hover:border-orange-400" },
              { href: "/jobs/teaching", label: "Teaching", emoji: "📚", sub: "CTET·KVS·NVS", color: "from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-900/10 border-yellow-200 dark:border-yellow-800/50 hover:border-yellow-400" },
              { href: "/jobs/state-psc", label: "State PSC", emoji: "🏢", sub: "UPPSC·BPSC", color: "from-teal-50 to-teal-100 dark:from-teal-900/20 dark:to-teal-900/10 border-teal-200 dark:border-teal-800/50 hover:border-teal-400" },
            ].map((cat) => (
              <Link
                key={cat.href}
                href={cat.href}
                className={`flex flex-col items-center justify-center text-center p-2 sm:p-3 rounded-xl bg-gradient-to-br ${cat.color} border transition-all hover:-translate-y-0.5 hover:shadow-md group`}
              >
                <span className="text-xl sm:text-2xl mb-1">{cat.emoji}</span>
                <span className="text-[10px] sm:text-xs font-extrabold text-gray-800 dark:text-gray-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors leading-tight line-clamp-1">{cat.label}</span>
                <span className="text-[9px] sm:text-[10px] text-gray-400 mt-0.5 hidden sm:block line-clamp-1">{cat.sub}</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center gap-2 mb-3 sm:mb-4">
        <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-600" />
        <h2 className="text-base sm:text-lg font-extrabold text-gray-900 dark:text-white">
          {stateCode ? `Latest Jobs in ${stateCode}` : "Latest Updates"}
        </h2>
        <span className="text-xs text-gray-400 ml-1">• Updated Daily</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4" id="latest-updates-grid">
        {sections.map((section) => {
          const Icon = section.icon;
          return (
            <div key={section.id} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">

              {/* Header */}
              <div className={`bg-gradient-to-r ${section.headerBg} px-3 py-2.5 flex items-center justify-between`}>
                <div className="flex items-center gap-1.5">
                  <Icon className="w-4 h-4 text-white" />
                  <h3 className="text-white font-bold text-sm">{section.title}</h3>
                </div>
                <span className="bg-white/20 text-white text-[10px] px-1.5 py-0.5 rounded-full font-medium">
                  {section.items.length} posts
                </span>
              </div>

              {/* List */}
              <ul className="divide-y divide-gray-50 dark:divide-gray-800/60">
                {section.items.map((item, i) => {
                  const st = statusMap[item.status];
                  return (
                    <li key={i} className="relative">
                      <Link
                        href={`/job/${item.slug}`}
                        className="flex flex-col px-4 py-2.5 hover:bg-blue-50/50 dark:hover:bg-blue-900/10 transition-all group"
                      >
                        {/* Left accent bar on hover */}
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500 scale-y-0 group-hover:scale-y-100 transition-transform origin-top rounded-r-md" />

                        {/* Row 1: dot + title + tag + status badge + Save button */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2 flex-1 mt-0.5">
                            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${st.dot} ${item.status === "last" ? "animate-pulse" : ""}`} />
                            <span className="flex-1 text-sm font-bold text-blue-700 dark:text-blue-400 group-hover:text-blue-800 dark:group-hover:text-blue-300 transition-colors line-clamp-2 leading-snug group-hover:underline underline-offset-4 decoration-blue-200 dark:decoration-blue-800">
                              {item.title}
                            </span>
                            <InlineTag tag={item.tag} />
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md shrink-0 ${st.text} ${st.bg}`}>
                              {st.label}
                            </span>
                          </div>
                          
                          {/* Save for later button */}
                          <div className="shrink-0 z-10 relative">
                            <SaveJobButton jobSlug={item.slug} jobTitle={item.title} />
                          </div>
                        </div>

                        {/* Row 2: meta info — last date, posts, eligibility */}
                        {(item.lastDate || item.posts || item.eligibility) && (
                          <div className="flex items-center gap-3 mt-1.5 ml-3.5 flex-wrap">
                            {item.lastDate && (
                              <span className={`flex items-center gap-1 text-[11px] font-semibold ${item.lastDate === "Today" ? "text-red-500 animate-pulse" : "text-gray-500 dark:text-gray-400"}`}>
                                <Calendar className="w-3 h-3 shrink-0 opacity-70" />
                                {item.lastDate === "Today" ? "LAST DATE TODAY!" : `Last Date: ${item.lastDate}`}
                              </span>
                            )}
                            {item.posts && (
                              <span className="flex items-center gap-1 text-[11px] font-medium text-gray-500 dark:text-gray-400">
                                <Users className="w-3 h-3 shrink-0 opacity-70" />
                                {item.posts} Posts
                              </span>
                            )}
                            {item.eligibility && (
                              <span className="flex items-center gap-1 text-[11px] font-medium text-gray-500 dark:text-gray-400">
                                <GraduationCap className="w-3 h-3 shrink-0 opacity-70" />
                                {item.eligibility}
                              </span>
                            )}
                          </div>
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>

              {/* Footer */}
              <div className="border-t border-gray-100 dark:border-gray-800 px-3 py-2">
                <Link
                  href={`/${section.id}`}
                  className="flex items-center justify-center gap-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
                >
                  View More <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          );
        })}

        {/* ── Employment News Card (6th) ── */}
        {!stateCode && (
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">

            {/* Header */}
            <div className="bg-gradient-to-r from-rose-600 to-pink-500 px-3 py-2.5 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Newspaper className="w-4 h-4 text-white" />
                <h3 className="text-white font-bold text-sm">Employment News</h3>
              </div>
              <span className="bg-white/20 text-white text-[10px] px-1.5 py-0.5 rounded-full font-medium">
                {(newsArticles || []).length} articles
              </span>
            </div>

            {/* News List */}
            <ul className="divide-y divide-gray-50 dark:divide-gray-800/60">
              {(newsArticles || []).length === 0 ? (
                <li className="px-4 py-6 text-center text-sm text-gray-400">
                  <Newspaper className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  No news articles yet
                </li>
              ) : (
                (newsArticles || []).map((article, i) => (
                  <li key={i} className="relative">
                    <Link
                      href={`/job/${article.slug}`}
                      className="flex items-start gap-2 px-4 py-2.5 hover:bg-rose-50/50 dark:hover:bg-rose-900/10 transition-all group"
                    >
                      {/* Left accent bar */}
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-rose-500 scale-y-0 group-hover:scale-y-100 transition-transform origin-top rounded-r-md" />

                      {/* Rose dot */}
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-400 shrink-0 mt-1.5" />

                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-rose-700 dark:text-rose-400 group-hover:text-rose-800 dark:group-hover:text-rose-300 transition-colors line-clamp-2 leading-snug group-hover:underline underline-offset-4 decoration-rose-200">
                          {article.title}
                        </p>
                        <p className="text-[11px] text-gray-400 mt-0.5">
                          {new Date(article.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </p>
                      </div>

                      <ChevronRight className="w-3.5 h-3.5 text-rose-400 shrink-0 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all mt-0.5" />
                    </Link>
                  </li>
                ))
              )}
            </ul>

            {/* Footer */}
            <div className="border-t border-gray-100 dark:border-gray-800 px-3 py-2">
              <Link
                href="/news"
                className="flex items-center justify-center gap-1 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:underline"
              >
                View All News <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        )}

      </div>
    </section>
  );
}
