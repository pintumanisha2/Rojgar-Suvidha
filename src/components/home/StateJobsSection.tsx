import Link from "next/link";
import { createClient } from "@supabase/supabase-js";
import { MapPin, ChevronRight, TrendingUp } from "lucide-react";

const supabaseServer = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const STATES = [
  { code: "UP",  name: "Uttar Pradesh",   emoji: "🏛️", color: "from-orange-500 to-amber-400",   light: "bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800/40" },
  { code: "BH",  name: "Bihar",           emoji: "📖", color: "from-green-600 to-emerald-500",   light: "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800/40" },
  { code: "MP",  name: "Madhya Pradesh",  emoji: "🌿", color: "from-teal-600 to-cyan-500",       light: "bg-teal-50 dark:bg-teal-900/20 border-teal-200 dark:border-teal-800/40" },
  { code: "RJ",  name: "Rajasthan",       emoji: "🏜️", color: "from-yellow-500 to-orange-400",   light: "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800/40" },
  { code: "HR",  name: "Haryana",         emoji: "🌾", color: "from-lime-600 to-green-500",      light: "bg-lime-50 dark:bg-lime-900/20 border-lime-200 dark:border-lime-800/40" },
  { code: "DL",  name: "Delhi",           emoji: "🏙️", color: "from-red-500 to-rose-400",        light: "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800/40" },
  { code: "MH",  name: "Maharashtra",     emoji: "🏭", color: "from-purple-600 to-violet-500",   light: "bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800/40" },
  { code: "WB",  name: "West Bengal",     emoji: "🐟", color: "from-blue-600 to-sky-500",        light: "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800/40" },
  { code: "UK",  name: "Uttarakhand",     emoji: "🏔️", color: "from-indigo-600 to-blue-500",    light: "bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-800/40" },
  { code: "JH",  name: "Jharkhand",       emoji: "⛏️", color: "from-stone-600 to-slate-500",    light: "bg-stone-50 dark:bg-stone-900/20 border-stone-200 dark:border-stone-800/40" },
  { code: "PB",  name: "Punjab",          emoji: "🌾", color: "from-amber-600 to-yellow-500",   light: "bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800/40" },
  { code: "OD",  name: "Odisha",          emoji: "🌊", color: "from-cyan-600 to-teal-500",      light: "bg-cyan-50 dark:bg-cyan-900/20 border-cyan-200 dark:border-cyan-800/40" },
  { code: "CG",  name: "Chhattisgarh",   emoji: "🌳", color: "from-emerald-600 to-green-500",  light: "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800/40" },
  { code: "KA",  name: "Karnataka",       emoji: "💻", color: "from-red-600 to-orange-500",     light: "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800/40" },
  { code: "GU",  name: "Gujarat",         emoji: "🏭", color: "from-fuchsia-600 to-pink-500",  light: "bg-fuchsia-50 dark:bg-fuchsia-900/20 border-fuchsia-200 dark:border-fuchsia-800/40" },
  { code: "AS",  name: "Assam",           emoji: "🍵", color: "from-green-700 to-teal-600",    light: "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800/40" },
];

async function getStateJobCounts(): Promise<Record<string, number>> {
  try {
    const { data } = await supabaseServer
      .from("jobs")
      .select("state_code")
      .neq("status", "draft")
      .not("state_code", "is", null)
      .neq("state_code", "");

    if (!data) return {};

    const counts: Record<string, number> = {};
    data.forEach((row: any) => {
      const code = (row.state_code || "").toUpperCase().trim();
      if (code) counts[code] = (counts[code] || 0) + 1;
    });
    return counts;
  } catch {
    return {};
  }
}

export default async function StateJobsSection() {
  const jobCounts = await getStateJobCounts();
  const totalStatesWithJobs = Object.keys(jobCounts).length;

  return (
    <section className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-600" />
          <h2 className="text-base sm:text-lg font-extrabold text-gray-900 dark:text-white">
            Browse Jobs by State
          </h2>
          <span className="text-xs text-gray-400 ml-1">• {STATES.length} States</span>
        </div>
        <Link
          href="/latest-jobs"
          className="hidden sm:flex items-center gap-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
        >
          View All <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* State Cards Grid */}
      <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 gap-2 sm:gap-3">
        {STATES.map((state) => {
          const count = jobCounts[state.code] || 0;
          return (
            <Link
              key={state.code}
              href={`/state/${state.code.toLowerCase()}`}
              className={`relative flex flex-col items-center justify-center text-center p-2 sm:p-3 rounded-xl border ${state.light} transition-all hover:-translate-y-0.5 hover:shadow-md group overflow-hidden`}
            >
              {/* Gradient top bar */}
              <div className={`absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r ${state.color} opacity-70 group-hover:opacity-100 transition-opacity`} />

              <span className="text-xl sm:text-2xl mb-1 leading-none">{state.emoji}</span>
              <span className="text-[10px] sm:text-[11px] font-extrabold text-gray-800 dark:text-gray-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors leading-tight line-clamp-1">
                {state.name.split(" ")[0]}
              </span>
              {state.name.includes(" ") && (
                <span className="text-[9px] sm:text-[10px] text-gray-500 dark:text-gray-400 leading-tight line-clamp-1">
                  {state.name.split(" ").slice(1).join(" ")}
                </span>
              )}

              {/* Job count badge */}
              {count > 0 ? (
                <span className={`mt-1.5 inline-flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-gradient-to-r ${state.color} text-white shadow-sm`}>
                  <TrendingUp className="w-2.5 h-2.5" />
                  {count}
                </span>
              ) : (
                <span className="mt-1.5 text-[9px] font-medium text-gray-400 dark:text-gray-500">
                  All India
                </span>
              )}
            </Link>
          );
        })}
      </div>
    </section>
  );
}
