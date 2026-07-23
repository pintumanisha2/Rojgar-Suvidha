import type { Metadata } from "next";
import { MapPin, ArrowLeft, Briefcase, FileText, BookOpen, Key, GraduationCap, ChevronRight } from "lucide-react";
import Link from "next/link";
import MainContent from "@/components/home/MainContent";
import { createClient } from "@supabase/supabase-js";

const supabaseServer = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const revalidate = 120;

const STATE_INFO: Record<string, { name: string; emoji: string; capital: string; color: string }> = {
  up:  { name: "Uttar Pradesh",  emoji: "🏛️", capital: "Lucknow",      color: "from-orange-500 to-amber-400" },
  mp:  { name: "Madhya Pradesh", emoji: "🌿", capital: "Bhopal",       color: "from-teal-600 to-cyan-500" },
  rj:  { name: "Rajasthan",      emoji: "🏜️", capital: "Jaipur",       color: "from-yellow-500 to-orange-400" },
  bh:  { name: "Bihar",          emoji: "📖", capital: "Patna",        color: "from-green-600 to-emerald-500" },
  hr:  { name: "Haryana",        emoji: "🌾", capital: "Chandigarh",   color: "from-lime-600 to-green-500" },
  pb:  { name: "Punjab",         emoji: "🌾", capital: "Chandigarh",   color: "from-amber-600 to-yellow-500" },
  uk:  { name: "Uttarakhand",    emoji: "🏔️", capital: "Dehradun",     color: "from-indigo-600 to-blue-500" },
  jh:  { name: "Jharkhand",      emoji: "⛏️", capital: "Ranchi",       color: "from-stone-600 to-slate-500" },
  mh:  { name: "Maharashtra",    emoji: "🏭", capital: "Mumbai",       color: "from-purple-600 to-violet-500" },
  gu:  { name: "Gujarat",        emoji: "🏭", capital: "Gandhinagar",  color: "from-fuchsia-600 to-pink-500" },
  ka:  { name: "Karnataka",      emoji: "💻", capital: "Bengaluru",    color: "from-red-600 to-orange-500" },
  tn:  { name: "Tamil Nadu",     emoji: "🏛️", capital: "Chennai",      color: "from-cyan-700 to-blue-600" },
  dl:  { name: "Delhi",          emoji: "🏙️", capital: "New Delhi",    color: "from-red-500 to-rose-400" },
  wb:  { name: "West Bengal",    emoji: "🐟", capital: "Kolkata",      color: "from-blue-600 to-sky-500" },
  od:  { name: "Odisha",         emoji: "🌊", capital: "Bhubaneswar",  color: "from-cyan-600 to-teal-500" },
  as:  { name: "Assam",          emoji: "🍵", capital: "Dispur",       color: "from-green-700 to-teal-600" },
  hp:  { name: "Himachal Pradesh",emoji: "🏔️",capital: "Shimla",      color: "from-sky-600 to-blue-500" },
  ch:  { name: "Chandigarh",     emoji: "🏙️", capital: "Chandigarh",   color: "from-slate-600 to-gray-500" },
  cg:  { name: "Chhattisgarh",   emoji: "🌳", capital: "Raipur",       color: "from-emerald-600 to-green-500" },
  ga:  { name: "Goa",            emoji: "🏖️", capital: "Panaji",       color: "from-teal-500 to-cyan-400" },
};

// Popular state-specific orgs for sub-text
const STATE_ORGS: Record<string, string> = {
  up:  "UPPSC • UP Police • UPSSSC",
  mp:  "MPPSC • MP Police • MPPEB",
  rj:  "RPSC • Rajasthan Police • RSMSSB",
  bh:  "BPSC • Bihar Police • BSSC",
  hr:  "HPSC • Haryana Police • HSSC",
  pb:  "PPSC • Punjab Police • PSSSB",
  uk:  "UKPSC • Uttarakhand Police",
  jh:  "JPSC • Jharkhand Police • JSSC",
  mh:  "MPSC • Maharashtra Police",
  gu:  "GPSC • Gujarat Police • GSSSB",
  ka:  "KPSC • Karnataka Police",
  tn:  "TNPSC • TN Police",
  dl:  "DSSSB • Delhi Police",
  wb:  "WBPSC • WB Police • WBSSC",
  od:  "OPSC • Odisha Police",
  as:  "APSC • Assam Police",
  hp:  "HPPSC • Himachal Police",
  cg:  "CGPSC • CG Police",
};

async function getStateStats(stateCode: string) {
  try {
    const upperCode = stateCode.toUpperCase();
    const { data } = await supabaseServer
      .from("jobs")
      .select("category")
      .neq("status", "draft")
      .or(`state_code.eq.${upperCode},state_code.is.null,state_code.eq.,state_code.ilike.%all%`);

    if (!data) return { total: 0, jobs: 0, results: 0, admitCards: 0 };

    return {
      total: data.length,
      jobs: data.filter((d: any) => ["latest-jobs","ssc","railway","banking","upsc","state-psc","defence","police","teaching","psu"].includes(d.category)).length,
      results: data.filter((d: any) => d.category === "result").length,
      admitCards: data.filter((d: any) => d.category === "admit-card").length,
      answerKeys: data.filter((d: any) => d.category === "answer-key").length,
    };
  } catch {
    return { total: 0, jobs: 0, results: 0, admitCards: 0, answerKeys: 0 };
  }
}

export async function generateStaticParams() {
  return Object.keys(STATE_INFO).map(s => ({ state: s }));
}

export async function generateMetadata({ params }: { params: Promise<{ state: string }> }): Promise<Metadata> {
  const { state } = await params;
  const stateKey = state.toLowerCase();
  const info = STATE_INFO[stateKey];
  const stateName = info?.name || state.toUpperCase();
  const emoji = info?.emoji || "🏛️";
  const orgs = STATE_ORGS[stateKey] ? ` Recruitment by ${STATE_ORGS[stateKey]}.` : "";

  return {
    title: `${stateName} Govt Jobs 2026 | Sarkari Naukri ${stateName} – Rojgar Suvidha`,
    description: `Latest government jobs in ${stateName} 2026. Find all Sarkari Naukri vacancies, results, admit cards and answer keys for ${stateName} on Rojgar Suvidha.${orgs}`,
    alternates: { canonical: `https://www.rojgarsuvidha.com/state/${stateKey}` },
    openGraph: {
      title: `${emoji} ${stateName} Sarkari Naukri 2026 – Rojgar Suvidha`,
      description: `All latest government job vacancies, results and notifications from ${stateName}.${orgs} Direct apply links & daily job updates on Rojgar Suvidha.`,
      url: `https://www.rojgarsuvidha.com/state/${stateKey}`,
    },
  };
}

export default async function StateJobsPage({ params }: { params: Promise<{ state: string }> }) {
  const { state } = await params;
  const stateKey = state.toLowerCase();
  const stateCode = state.toUpperCase();
  const info = STATE_INFO[stateKey];
  const stateName = info?.name || stateCode;
  const emoji = info?.emoji || "🏛️";
  const capital = info?.capital || "";
  const gradient = info?.color || "from-indigo-600 to-violet-500";
  const orgs = STATE_ORGS[stateKey] || "";

  const stats = await getStateStats(stateKey);

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://www.rojgarsuvidha.com" },
      { "@type": "ListItem", position: 2, name: "State Jobs", item: "https://www.rojgarsuvidha.com" },
      { "@type": "ListItem", position: 3, name: stateName, item: `https://www.rojgarsuvidha.com/state/${stateKey}` },
    ],
  };

  return (
    <div className="flex-1 bg-gray-50 dark:bg-gray-950 py-4 sm:py-6">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <div className="max-w-7xl mx-auto px-4">

        {/* Breadcrumb */}
        <div className="flex items-center gap-2 mb-4 text-sm text-gray-500">
          <Link href="/" className="hover:text-indigo-600 transition-colors font-medium">Home</Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <Link href="/" className="hover:text-indigo-600 transition-colors font-medium">State Jobs</Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-gray-900 dark:text-white font-bold">{stateName}</span>
        </div>

        {/* Hero Banner */}
        <div className={`relative bg-gradient-to-br ${gradient} rounded-2xl p-6 md:p-8 text-white overflow-hidden mb-6 shadow-xl`}>
          {/* Decorative blobs */}
          <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full -mt-16 -mr-16 blur-2xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-black/10 rounded-full -mb-10 -ml-10 blur-2xl pointer-events-none" />

          <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              {/* State Emoji Badge */}
              <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center text-4xl border border-white/30 shadow-inner backdrop-blur-sm shrink-0">
                {emoji}
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <MapPin className="w-4 h-4 text-white/80" />
                  <span className="text-xs font-bold text-white/70 uppercase tracking-widest">State Government Jobs</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-black leading-tight">
                  {stateName} Jobs 2026
                </h1>
                {capital && (
                  <p className="text-white/80 text-sm mt-1 font-medium">Capital: {capital}</p>
                )}
                {orgs && (
                  <p className="text-white/70 text-xs mt-1">{orgs}</p>
                )}
              </div>
            </div>

            {/* Stats row */}
            <div className="flex items-center gap-3 flex-wrap">
              {[
                { icon: Briefcase,  label: "Jobs",        value: stats.jobs,       color: "bg-white/20" },
                { icon: FileText,   label: "Results",     value: stats.results,    color: "bg-white/20" },
                { icon: BookOpen,   label: "Admit Cards", value: stats.admitCards, color: "bg-white/20" },
              ].map(({ icon: Icon, label, value, color }) => (
                <div key={label} className={`${color} backdrop-blur-sm rounded-xl px-4 py-2.5 text-center border border-white/20 min-w-[70px]`}>
                  <Icon className="w-4 h-4 mx-auto mb-1 text-white/80" />
                  <div className="text-xl font-black text-white">{value}</div>
                  <div className="text-[10px] text-white/70 font-bold uppercase tracking-wider">{label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Quick category links */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 mb-4 scrollbar-hide">
          {[
            { href: `/state/${stateKey}#section-latest-jobs`, label: "💼 Jobs" },
            { href: `/state/${stateKey}#section-result`, label: "📋 Results" },
            { href: `/state/${stateKey}#section-admit-card`, label: "🎫 Admit Cards" },
            { href: `/state/${stateKey}#section-answer-key`, label: "🔑 Answer Keys" },
            { href: `/state/${stateKey}#section-admission`, label: "🎓 Admission" },
          ].map(link => (
            <a
              key={link.href}
              href={link.href}
              className="flex-shrink-0 px-3 py-1.5 text-xs font-bold bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-full text-gray-700 dark:text-gray-300 hover:border-indigo-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all"
            >
              {link.label}
            </a>
          ))}
        </div>
      </div>

      {/* Job Listings — same grid as homepage but state filtered */}
      <MainContent stateCode={stateCode} />

      {/* Back to all states */}
      <div className="max-w-7xl mx-auto px-4 mt-6">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
        >
          <ArrowLeft className="w-4 h-4" />
          Browse Other States
        </Link>
      </div>
    </div>
  );
}
