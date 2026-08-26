import Link from "next/link";
import { createClient } from "@supabase/supabase-js";
import { MapPin, ChevronRight, TrendingUp } from "lucide-react";

const supabaseServer = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const STATES = [
  { code: "UP",  name: "Uttar Pradesh",   emoji: "🏛️", color: "from-indigo-600 to-violet-600" },
  { code: "BH",  name: "Bihar",           emoji: "📖", color: "from-indigo-600 to-violet-600" },
  { code: "MP",  name: "Madhya Pradesh",  emoji: "🌿", color: "from-indigo-600 to-violet-600" },
  { code: "RJ",  name: "Rajasthan",       emoji: "🏜️", color: "from-indigo-600 to-violet-600" },
  { code: "HR",  name: "Haryana",         emoji: "🤼", color: "from-indigo-600 to-violet-600" },
  { code: "DL",  name: "Delhi",           emoji: "🏙️", color: "from-indigo-600 to-violet-600" },
  { code: "MH",  name: "Maharashtra",     emoji: "🏢", color: "from-indigo-600 to-violet-600" },
  { code: "WB",  name: "West Bengal",     emoji: "🐟", color: "from-indigo-600 to-violet-600" },
  { code: "UK",  name: "Uttarakhand",     emoji: "🏔️", color: "from-indigo-600 to-violet-600" },
  { code: "JH",  name: "Jharkhand",       emoji: "⛏️", color: "from-indigo-600 to-violet-600" },
  { code: "PB",  name: "Punjab",          emoji: "🌾", color: "from-indigo-600 to-violet-600" },
  { code: "OD",  name: "Odisha",          emoji: "🌊", color: "from-indigo-600 to-violet-600" },
  { code: "CG",  name: "Chhattisgarh",   emoji: "🌳", color: "from-indigo-600 to-violet-600" },
  { code: "KA",  name: "Karnataka",       emoji: "💻", color: "from-indigo-600 to-violet-600" },
  { code: "GU",  name: "Gujarat",         emoji: "🏭", color: "from-indigo-600 to-violet-600" },
  { code: "AS",  name: "Assam",           emoji: "🍵", color: "from-indigo-600 to-violet-600" },
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
              className="relative flex flex-col items-center justify-center text-center p-2 sm:p-3 rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 transition-all hover:border-indigo-500 dark:hover:border-indigo-500 hover:-translate-y-0.5 hover:shadow-md group overflow-hidden"
            >
              <span className="text-xl sm:text-2xl mb-1 leading-none">{state.emoji}</span>
              <span className="text-xs font-bold text-gray-800 dark:text-gray-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors leading-tight line-clamp-1">
                {state.name.split(" ")[0]}
              </span>
              {state.name.includes(" ") && (
                <span className="text-[11px] text-gray-500 dark:text-gray-400 leading-tight line-clamp-1">
                  {state.name.split(" ").slice(1).join(" ")}
                </span>
              )}

              {/* Standardized Job count badge */}
              <span className="mt-1.5 inline-flex items-center gap-0.5 text-[11px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200/50 dark:border-indigo-800/40">
                {count > 0 ? `${count} Jobs` : "All India"}
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
