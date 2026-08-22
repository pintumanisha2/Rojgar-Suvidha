import Link from "next/link";
import { supabase } from "@/lib/supabase";

interface SimilarJobsWidgetProps {
  currentJobId: string;
  category: string;
  stateCode?: string | null;
  lang?: string;
}

export default async function SimilarJobsWidget({
  currentJobId,
  category,
  stateCode,
  lang = "en",
}: SimilarJobsWidgetProps) {
  let query = supabase
    .from("jobs")
    .select("id, title, slug, category, state_code, created_at")
    .neq("id", currentJobId)
    .neq("status", "draft")
    .order("created_at", { ascending: false })
    .limit(5);

  if (category) {
    query = query.eq("category", category);
  } else if (stateCode) {
    query = query.eq("state_code", stateCode);
  }

  const { data: similarJobs } = await query;

  if (!similarJobs || similarJobs.length === 0) return null;

  const prefix = lang === "en" ? "" : `/${lang}`;

  return (
    <section className="mt-10 pt-8 border-t border-slate-200 dark:border-slate-800">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
          <span>🔥</span> समान भर्ती विज्ञापन / Related Job Updates
        </h3>
        <Link
          href={`${prefix}/latest-jobs`}
          className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
        >
          सभी देखें →
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {similarJobs.map((job) => (
          <Link
            key={job.id}
            href={`${prefix}/job/${job.slug}`}
            className="group block p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-blue-500 dark:hover:border-blue-500 transition-all shadow-sm hover:shadow-md"
          >
            <div className="flex items-start justify-between gap-2">
              <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 line-clamp-2 transition-colors">
                {job.title}
              </h4>
              <span className="shrink-0 text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300">
                {job.category || "Job"}
              </span>
            </div>
            <div className="mt-2 flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
              {job.state_code && (
                <span className="uppercase font-medium">📍 {job.state_code}</span>
              )}
              <span>📅 {new Date(job.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
