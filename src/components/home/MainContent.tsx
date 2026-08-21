import Link from "next/link";
import { supabase } from "@/lib/supabase";
import {
  FileText, BookOpen, Briefcase, Key, GraduationCap,
  ArrowRight, Flame, Sparkles, AlertCircle, TrendingUp,
  Calendar, Users, Newspaper, ChevronRight,
} from "lucide-react";
import SaveJobButton from "@/components/ui/SaveJobButton";

import { getJobStatusBadge } from "@/lib/jobStatusHelper";

type StatusKey = "out" | "active" | "last" | "soon" | "new";
type TagType = "hot" | "new" | "urgent";

interface JobItem {
  title: string;
  status: StatusKey;
  tag?: TagType;
  lastDate?: string;
  posts?: string;
  eligibility?: string;
  slug: string;
  category?: string;
  important_dates?: any[];
  created_at?: string;
}

interface Section {
  id: string;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  headerBg: string;
  bulletBg: string;
  titleColor: string;
  footerColor: string;
  items: JobItem[];
}

const sectionConfig = [
  { id: "results", title: "Results", icon: FileText, headerBg: "from-emerald-600 to-green-500", bulletBg: "bg-emerald-500", titleColor: "text-emerald-700 dark:text-emerald-400", footerColor: "text-emerald-600 dark:text-emerald-400" },
  { id: "admit-card", title: "Admit Cards", icon: BookOpen, headerBg: "from-orange-600 to-amber-500", bulletBg: "bg-orange-500", titleColor: "text-orange-700 dark:text-orange-400", footerColor: "text-orange-600 dark:text-orange-400" },
  { id: "latest-jobs", title: "Latest Jobs", icon: Briefcase, headerBg: "from-red-600 to-rose-500", bulletBg: "bg-red-500", titleColor: "text-red-700 dark:text-red-400", footerColor: "text-red-600 dark:text-red-400" },
  { id: "answer-key", title: "Answer Key", icon: Key, headerBg: "from-purple-600 to-violet-500", bulletBg: "bg-purple-500", titleColor: "text-purple-700 dark:text-purple-400", footerColor: "text-purple-600 dark:text-purple-400" },
  { id: "admission", title: "Admission", icon: GraduationCap, headerBg: "from-blue-600 to-sky-500", bulletBg: "bg-blue-500", titleColor: "text-blue-700 dark:text-blue-400", footerColor: "text-blue-600 dark:text-blue-400" },
];

const statusMap: Record<StatusKey, { label: string; dot: string; text: string; bg: string }> = {
  out:    { label: "Out",     dot: "bg-emerald-500",  text: "text-emerald-700 dark:text-emerald-300",   bg: "bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-250/50 dark:border-emerald-800/30" },
  active: { label: "Active",  dot: "bg-indigo-500",   text: "text-indigo-700 dark:text-indigo-300",     bg: "bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-250/50 dark:border-indigo-800/30" },
  last:   { label: "Today!",  dot: "bg-red-500",    text: "text-red-700 dark:text-red-300",       bg: "bg-red-50 dark:bg-red-950/40 border border-red-250/50 dark:border-red-800/30" },
  soon:   { label: "Closing", dot: "bg-amber-400", text: "text-amber-700 dark:text-amber-300", bg: "bg-amber-50 dark:bg-amber-950/40 border border-amber-250/50 dark:border-amber-800/30" },
  new:    { label: "New",     dot: "bg-purple-500", text: "text-purple-700 dark:text-purple-300", bg: "bg-purple-50 dark:bg-purple-950/40 border border-purple-250/50 dark:border-purple-800/30" },
};

function InlineTag({ tag }: { tag?: TagType }) {
  if (!tag) return null;
  if (tag === "hot")    return <Flame className="w-3 h-3 text-orange-500 shrink-0" />;
  if (tag === "new")    return <Sparkles className="w-3 h-3 text-purple-500 shrink-0" />;
  if (tag === "urgent") return <AlertCircle className="w-3 h-3 text-red-500 shrink-0 animate-pulse" />;
  return null;
}

export default async function MainContent({ stateCode }: { stateCode?: string }) {
  let query = supabase
    .from("jobs")
    .select("title, slug, status, tag, category, short_info, important_dates, created_at, state_code")
    .neq("status", "draft")
    .neq("category", "news")
    .order("created_at", { ascending: false })
    .limit(120); 
  
  if (stateCode) {
    query = query.or(`state_code.eq.${stateCode},state_code.is.null,state_code.eq.,state_code.ilike.%all%`);
  }

  const { data: dbJobs } = await query;

  const { data: newsArticles } = await supabase
    .from("jobs")
    .select("title, slug, created_at")
    .eq("category", "news")
    .neq("status", "draft")
    .order("created_at", { ascending: false })
    .limit(6); 
  
  const jobsByCategory: Record<string, any[]> = {};
  if (dbJobs) {
    dbJobs.forEach((job: any) => {
      let catKey = job.category;
      if (catKey === "admit-cards") catKey = "admit-card";
      if (!jobsByCategory[catKey]) jobsByCategory[catKey] = [];
      jobsByCategory[catKey].push(job);
    });
  }

  const sections = sectionConfig.map(conf => ({
    ...conf,
    items: (jobsByCategory[conf.id] || []).slice(0, 10).map(job => {
      let lastDate = "";
      if (Array.isArray(job.important_dates) && job.important_dates.length > 0) {
        const ldObj = job.important_dates.find((d: any) => d?.label === "Last Date");
        if (ldObj) lastDate = ldObj.value;
      }
      return {
        title: job.title,
        status: job.status as StatusKey,
        tag: job.tag as TagType,
        lastDate,
        slug: job.slug,
        category: job.category,
        important_dates: job.important_dates,
        created_at: job.created_at,
      } as JobItem;
    })
  }));

  return (
    <section className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-5">

      {!stateCode && (
        <div className="mb-5 sm:mb-8">
          <div className="flex items-center gap-2 mb-3">
            <Briefcase className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-600" />
            <h2 className="text-sm sm:text-lg font-extrabold text-gray-900 dark:text-white">Browse by Sector</h2>
            <span className="text-xs text-gray-400 ml-1 hidden sm:inline">• 8 Categories</span>
          </div>
          <div className="grid grid-cols-4 sm:grid-cols-4 lg:grid-cols-8 gap-1.5 sm:gap-3">
            {[
              { href: "/jobs/ssc", label: "SSC", emoji: "🏛️", color: "from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-900/10 border-blue-200 dark:border-blue-800/50 hover:border-blue-400" },
              { href: "/jobs/railway", label: "Railway", emoji: "🚂", color: "from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-900/10 border-red-200 dark:border-red-800/50 hover:border-red-400" },
              { href: "/jobs/banking", label: "Banking", emoji: "🏦", color: "from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-900/10 border-green-200 dark:border-green-800/50 hover:border-green-400" },
              { href: "/jobs/upsc", label: "UPSC", emoji: "🎖️", color: "from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-900/10 border-purple-200 dark:border-purple-800/50 hover:border-purple-400" },
              { href: "/jobs/police", label: "Police", emoji: "👮", color: "from-indigo-50 to-indigo-100 dark:from-indigo-900/20 dark:to-indigo-900/10 border-indigo-200 dark:border-indigo-800/50 hover:border-indigo-400" },
              { href: "/jobs/defence", label: "Defence", emoji: "🛡️", color: "from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-900/10 border-orange-200 dark:border-orange-800/50 hover:border-orange-400" },
              { href: "/jobs/teaching", label: "Teaching", emoji: "📚", color: "from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-900/10 border-yellow-200 dark:border-yellow-800/50 hover:border-yellow-400" },
              { href: "/jobs/state-psc", label: "State PSC", emoji: "🏢", color: "from-teal-50 to-teal-100 dark:from-teal-900/20 dark:to-teal-900/10 border-teal-200 dark:border-teal-800/50 hover:border-teal-400" },
            ].map((cat) => (
              <Link
                key={cat.href}
                href={cat.href}
                className={`flex flex-col items-center justify-center text-center p-2 sm:p-3 rounded-xl bg-gradient-to-br ${cat.color} border transition-all hover:-translate-y-0.5 hover:shadow-md group`}
              >
                <span className="text-xl sm:text-2xl mb-0.5">{cat.emoji}</span>
                <span className="text-[10px] sm:text-xs font-extrabold text-gray-800 dark:text-gray-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors leading-tight">{cat.label}</span>
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

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4" id="job-sections-grid">
        {sections.map((section) => {
          const Icon = section.icon;
          return (
            <div key={section.id} id={`section-${section.id}`} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden flex flex-col">

              <div className={`bg-gradient-to-r ${section.headerBg} px-3.5 py-2.5 flex items-center justify-between`}>
                <div className="flex items-center gap-2">
                  <Icon className="w-4 h-4 text-white" />
                  <h3 className="text-white font-bold text-sm sm:text-base tracking-tight">{section.title}</h3>
                </div>
                <span className="bg-white/20 text-white text-[11px] px-2 py-0.5 rounded-full font-bold">
                  {section.items.length} posts
                </span>
              </div>

              <ul className="divide-y divide-gray-100 dark:divide-zinc-800/60 flex-1">
                {section.items.map((item, i) => {
                  const st = getJobStatusBadge({
                    category: item.category || section.id,
                    lastDate: item.lastDate,
                    important_dates: item.important_dates,
                    created_at: item.created_at,
                    status: item.status,
                  });

                  const formattedDate = item.lastDate
                    ? `Last Date: ${item.lastDate}`
                    : item.created_at
                      ? new Date(item.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                      : "";

                  return (
                    <li key={i} className="relative">
                      <Link
                        href={`/job/${item.slug}`}
                        className="flex items-start gap-2.5 px-3.5 py-2.5 hover:bg-slate-50 dark:hover:bg-zinc-850/50 transition-all group"
                      >
                        <span className={`w-2 h-2 rounded-full shrink-0 mt-1.5 ${section.bulletBg}`} />

                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <h4 className={`text-[13px] sm:text-[14px] font-bold ${section.titleColor} group-hover:underline leading-snug line-clamp-2`}>
                              {item.title}
                            </h4>
                            <div className="flex items-center gap-1 shrink-0">
                              <InlineTag tag={item.tag} />
                              {st.label && (
                                <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-md shrink-0 ${st.text} ${st.bg}`}>
                                  {st.label}
                                </span>
                              )}
                            </div>
                          </div>

                          {formattedDate && (
                            <p className="text-[11px] font-medium text-gray-400 dark:text-gray-500 mt-0.5">
                              {formattedDate}
                            </p>
                          )}
                        </div>
                      </Link>
                    </li>
                  );
                })}
              </ul>

              <div className="border-t border-gray-100 dark:border-gray-800 px-3 py-2 bg-slate-50/50 dark:bg-zinc-900/50">
                <Link
                  href={`/${section.id}`}
                  className={`flex items-center justify-center gap-1 text-xs font-bold ${section.footerColor} hover:underline`}
                >
                  View All {section.title} <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          );
        })}

        {!stateCode && (
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden flex flex-col">

            <div className="bg-gradient-to-r from-rose-600 to-pink-500 px-3.5 py-2.5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Newspaper className="w-4 h-4 text-white" />
                <h3 className="text-white font-bold text-sm sm:text-base tracking-tight">Employment News</h3>
              </div>
              <span className="bg-white/20 text-white text-[11px] px-2 py-0.5 rounded-full font-bold">
                {(newsArticles || []).length} articles
              </span>
            </div>

            <ul className="divide-y divide-gray-100 dark:divide-zinc-800/60 flex-1">
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
                      className="flex items-start gap-2.5 px-3.5 py-2.5 hover:bg-rose-50/50 dark:hover:bg-rose-900/10 transition-all group"
                    >
                      <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0 mt-1.5" />

                      <div className="flex-1 min-w-0">
                        <h4 className="text-[13px] sm:text-[14px] font-bold text-rose-700 dark:text-rose-400 group-hover:underline leading-snug line-clamp-2">
                          {article.title}
                        </h4>
                        <p className="text-[11px] font-medium text-gray-400 dark:text-gray-500 mt-0.5">
                          {new Date(article.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </p>
                      </div>

                      <ChevronRight className="w-3.5 h-3.5 text-rose-400 shrink-0 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all mt-0.5" />
                    </Link>
                  </li>
                ))
              )}
            </ul>

            <div className="border-t border-gray-100 dark:border-gray-800 px-3 py-2 bg-slate-50/50 dark:bg-zinc-900/50">
              <Link
                href="/news"
                className="flex items-center justify-center gap-1 text-xs font-bold text-rose-600 dark:text-rose-400 hover:underline"
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
