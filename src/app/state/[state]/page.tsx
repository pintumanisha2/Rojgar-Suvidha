import type { Metadata } from "next";
import { MapPin, ArrowLeft, Briefcase, FileText, BookOpen, Key, GraduationCap, ChevronRight, Building2, BadgePercent, HelpCircle } from "lucide-react";
import Link from "next/link";
import MainContent from "@/components/home/MainContent";
import { createClient } from "@supabase/supabase-js";

const supabaseServer = createClient(
  (process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co"),
  (process.env.SUPABASE_SERVICE_ROLE_KEY || "placeholder-key")
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

// Rich info per state: domicile rules, top orgs with links, salary ranges
const STATE_RICH: Record<string, {
  domicile: string;
  reservation: string;
  salaryRange: string;
  topDepts: { name: string; slug: string }[];
  faqs: { q: string; a: string }[];
}> = {
  up: {
    domicile: "UP mein sarkari naukri ke liye UP domicile certificate zaroori hota hai state-level posts ke liye. Aavedan ke samay UP ka niwas praman patra lagana hoga.",
    reservation: "UP mein OBC 27%, SC 21%, ST 2% aur EWS 10% reservation milta hai. Mahilaon ke liye horizontal reservation bhi available hai.",
    salaryRange: "₹18,000 – ₹1,50,000/month",
    topDepts: [
      { name: "UP Police Constable/SI", slug: "up-police" },
      { name: "UPPSC PCS", slug: "uppsc" },
      { name: "UPSSSC PET", slug: "upsssc" },
      { name: "UP Lekhpal", slug: "up-lekhpal" },
    ],
    faqs: [
      { q: "UP mein 12th pass ke liye konsi sarkari naukri hai?", a: "UP Police Constable (60,244 posts), UPSSSC VDO, UP NHM Staff Nurse, UP Forest Guard, UP Post Office GDS — yeh sab 12th pass ke liye hain. Qualification ke hisab se UP Police Constable sabse popular hai jisme ₹21,700/month basic pay milta hai." },
      { q: "UPPSC PCS ke liye age limit kya hai?", a: "UPPSC PCS ke liye age limit 21-40 saal hai. OBC candidates ko 3 saal ki aur SC/ST ko 5 saal ki relaxation milti hai. Ex-servicemen ko additional relaxation available hai." },
      { q: "UP mein OBC certificate kahan se banwaye?", a: "UP OBC certificate tehsildar/SDM office se banta hai. Aavedan mein Form, ration card, niwas praman patra aur jati praman patra lagana hota hai. Online bhi apply kar sakte hain UP e-district portal se." },
    ],
  },
  bh: {
    domicile: "Bihar sarkari naukri ke liye Bihar domicile/mool niwas certificate zaroori hai. Bihar lok seva aayog (BPSC) mein aavedan ke liye Bihar ka niwas praman patra compulsory hai.",
    reservation: "Bihar mein SC 16%, ST 1%, OBC 12%, EBC 18% aur EWS 10% reservation available hai. Mahilaon ke liye 35% horizontal reservation bhi milta hai.",
    salaryRange: "₹18,000 – ₹1,20,000/month",
    topDepts: [
      { name: "BPSC Integrated 70th", slug: "bpsc" },
      { name: "Bihar Police Constable", slug: "bihar-police" },
      { name: "BSSC CGL", slug: "bssc" },
      { name: "Bihar STET", slug: "bihar-stet" },
    ],
    faqs: [
      { q: "Bihar mein graduation ke baad konsi best sarkari naukri hai?", a: "BPSC PCS (Bihar Civil Services), BPSC Teacher, Bihar Police SI, BSSC CGL aur Bank PO — yeh Bihar mein graduation ke baad best options hain. BPSC mein selection ke baad SDM, DSP, BDO jaise posts milte hain." },
      { q: "Bihar Police Constable ki salary kitni hoti hai?", a: "Bihar Police Constable ki basic salary ₹21,700/month hai (Pay Level 3). DA, HRA aur TA milake gross ₹32,000-38,000 per month hota hai. In-hand ₹28,000-34,000 milta hai city ke hisab se." },
      { q: "BPSC ke liye kitni baar attempt allowed hai?", a: "BPSC (Bihar Public Service Commission) ke liye General category mein maximum 7 attempts hain (age limit tak). OBC/SC/ST candidates ke liye age relaxation ke saath attempts aur zyada hote hain." },
    ],
  },
  rj: {
    domicile: "Rajasthan state jobs ke liye Rajasthan domicile certificate compulsory hai. RPSC aur RSMSSB mein aavedan ke liye Rajasthan ka mool niwas praman patra zaroori hai.",
    reservation: "Rajasthan mein OBC 21%, SC 16%, ST 12% aur EWS 10% reservation milta hai. MBC (Most Backward Class) ke liye 5% alag reservation bhi hai.",
    salaryRange: "₹18,000 – ₹1,25,000/month",
    topDepts: [
      { name: "RPSC RAS", slug: "rpsc-ras" },
      { name: "Rajasthan Police Constable", slug: "rajasthan-police" },
      { name: "RSMSSB", slug: "rsmssb" },
      { name: "Rajasthan Patwari", slug: "rajasthan-patwari" },
    ],
    faqs: [
      { q: "Rajasthan mein 10th pass ke liye sarkari naukri?", a: "Rajasthan Police Constable, RSMSSB CHO, Rajasthan Postal Circle GDS, Rajasthan Forest Guard — yeh sab 10th/12th pass ke liye available hain aur har saal badi matra mein vacancies nikalti hain." },
      { q: "RPSC RAS ke liye qualification kya chahiye?", a: "RPSC RAS ke liye kisi bhi recognized university se graduation zaroori hai. Age limit 21-40 saal hai (OBC 3 saal, SC/ST 5 saal relaxation). RPSC RAS ek 3-stage exam hai: Prelims, Mains aur Interview." },
      { q: "Rajasthan mein sarkari teacher kaise bane?", a: "Rajasthan mein sarkari teacher banne ke liye REET (Rajasthan Eligibility Examination for Teacher) qualify karna padta hai. Level 1 ke liye 12th + D.El.Ed aur Level 2 ke liye Graduation + B.Ed compulsory hai." },
    ],
  },
  mp: {
    domicile: "Madhya Pradesh sarkari naukri ke liye MP domicile certificate zaroori hai. MPPSC aur MPPEB mein aavedan ke liye MP ka mool niwas praman patra lagana hoga.",
    reservation: "MP mein SC 16%, ST 20%, OBC 27% aur EWS 10% reservation milta hai. Mahilaon ke liye 33% horizontal reservation bhi available hai.",
    salaryRange: "₹18,000 – ₹1,30,000/month",
    topDepts: [
      { name: "MPPSC State Service", slug: "mppsc" },
      { name: "MP Police Constable", slug: "mp-police" },
      { name: "MPPEB Group 1/2", slug: "mppeb" },
      { name: "MP Patwari", slug: "mp-patwari" },
    ],
    faqs: [
      { q: "MP mein MPPSC ke liye age limit kya hai?", a: "MPPSC State Service ke liye age limit 21-40 saal hai. SC/ST/OBC ko 5 saal relaxation milti hai. MP domicile wale candidates ko extra preference hoti hai state-level posts ke liye." },
      { q: "MP Police Constable ki height kitni chahiye?", a: "MP Police Constable ke liye: General/OBC Male: 167 cm, SC/ST Male: 160 cm. Female: General/OBC 155 cm, SC/ST 150 cm. Chest (Male): 81-86 cm." },
      { q: "MP mein panchayat teacher bharti kab aati hai?", a: "MP Samvida Shikshak bharti MPPEB karwata hai. Iske liye TET/CTET qualify karna zaroori hai. Varg 3 mein 12th + D.El.Ed, Varg 2 mein Graduation + B.Ed chahiye." },
    ],
  },
};

// Default state info for states without specific data
function getStateRichInfo(stateKey: string, stateName: string) {
  return STATE_RICH[stateKey] || {
    domicile: `${stateName} state government jobs ke liye ${stateName} domicile certificate zaroori hota hai. State-level recruitment mein aavedan ke samay mool niwas praman patra compulsory hai.`,
    reservation: `${stateName} mein SC, ST, OBC aur EWS categories ke liye reservation available hai as per Government of India norms. State-specific reservation rules apply hoti hain.`,
    salaryRange: "₹18,000 – ₹1,50,000/month",
    topDepts: [],
    faqs: [
      { q: `${stateName} mein sarkari naukri kaise dhundhe?`, a: `${stateName} mein sarkari naukri ke liye ${stateName} PSC, ${stateName} Police, ${stateName} SSC aur central government departments ko target karein. Rojgar Suvidha par daily updates milte hain.` },
      { q: `${stateName} sarkari naukri ke liye kya qualification chahiye?`, a: `Qualification post ke hisab se vary karti hai. 10th pass ke liye police constable, postal assistant aur Group D posts hain. Graduation ke baad PSC, bank aur central government posts available hain.` },
    ],
  };
}

async function getStateStats(stateCode: string) {
  try {
    const upperCode = stateCode.toUpperCase();
    const { data } = await supabaseServer
      .from("jobs")
      .select("category")
      .neq("status", "draft")
      .or(`state_code.eq.${upperCode},state_code.is.null,state_code.eq.,state_code.ilike.%all%`);

    if (!data) return { total: 0, jobs: 0, results: 0, admitCards: 0, answerKeys: 0 };

    return {
      total: data.length,
      jobs: data.filter((d: any) => ["latest-jobs","ssc","railway","banking","upsc","state-psc","defence","police","teaching","psu"].includes(d.category)).length,
      results: data.filter((d: any) => d.category === "result" || d.category === "results").length,
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
  const currentYear = new Date().getFullYear();

  // Check if state actually has active specific jobs
  const upperCode = stateKey.toUpperCase();
  const { count } = await supabaseServer
    .from("jobs")
    .select("id", { count: "exact", head: true })
    .neq("status", "draft")
    .eq("state_code", upperCode);

  const hasSpecificJobs = (count || 0) > 0;

  return {
    title: `${stateName} Sarkari Naukri ${currentYear} — Latest Govt Jobs in ${stateName} | Rojgar Suvidha`,
    description: `${stateName} mein aaj ki sarkari naukri ${currentYear}. Find all government job vacancies, results, admit cards for ${stateName}.${orgs} Daily updates on Rojgar Suvidha.`,
    alternates: { canonical: `https://www.rojgarsuvidha.com/state/${stateKey}` },
    robots: {
      index: hasSpecificJobs,
      follow: true,
    },
    openGraph: {
      title: `${emoji} ${stateName} Sarkari Naukri ${currentYear} — Rojgar Suvidha`,
      description: `All latest government job vacancies, results and notifications from ${stateName}.${orgs} Direct apply links on Rojgar Suvidha.`,
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
  const richInfo = getStateRichInfo(stateKey, stateName);
  const currentYear = new Date().getFullYear();

  const stats = await getStateStats(stateKey);

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://www.rojgarsuvidha.com" },
      { "@type": "ListItem", position: 2, name: "State Jobs", item: "https://www.rojgarsuvidha.com" },
      { "@type": "ListItem", position: 3, name: `${stateName} Jobs`, item: `https://www.rojgarsuvidha.com/state/${stateKey}` },
    ],
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: richInfo.faqs.map(f => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };

  return (
    <div className="flex-1 bg-gray-50 dark:bg-gray-950 py-4 sm:py-6">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />

      <div className="max-w-7xl mx-auto px-4">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 mb-4 text-sm text-gray-500">
          <Link href="/" className="hover:text-indigo-600 transition-colors font-medium">Home</Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-gray-900 dark:text-white font-bold">{stateName} Jobs {currentYear}</span>
        </div>

        {/* Hero Banner */}
        <div className={`relative bg-gradient-to-br ${gradient} rounded-2xl p-6 md:p-8 text-white overflow-hidden mb-6 shadow-xl`}>
          <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full -mt-16 -mr-16 blur-2xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-black/10 rounded-full -mb-10 -ml-10 blur-2xl pointer-events-none" />
          <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center text-4xl border border-white/30 shadow-inner backdrop-blur-sm shrink-0">
                {emoji}
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <MapPin className="w-4 h-4 text-white/80" />
                  <span className="text-xs font-bold text-white/70 uppercase tracking-widest">State Government Jobs</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-black leading-tight">
                  {stateName} Sarkari Naukri {currentYear}
                </h1>
                {capital && <p className="text-white/80 text-sm mt-1 font-medium">Capital: {capital}</p>}
                {orgs && <p className="text-white/70 text-xs mt-1">{orgs}</p>}
              </div>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              {[
                { icon: Briefcase,  label: "Jobs",       value: stats.jobs },
                { icon: FileText,   label: "Results",    value: stats.results },
                { icon: BookOpen,   label: "Admit Cards",value: stats.admitCards },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} className="bg-white/20 backdrop-blur-sm rounded-xl px-4 py-2.5 text-center border border-white/20 min-w-[70px]">
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
            { href: `/state/${stateKey}#section-results`,     label: "📋 Results" },
            { href: `/state/${stateKey}#section-admit-card`,  label: "🎫 Admit Cards" },
            { href: `/state/${stateKey}#section-answer-key`,  label: "🔑 Answer Keys" },
            { href: `/state/${stateKey}#section-admission`,   label: "🎓 Admission" },
          ].map(link => (
            <a key={link.href} href={link.href} className="flex-shrink-0 px-3 py-1.5 text-xs font-bold bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-full text-gray-700 dark:text-gray-300 hover:border-indigo-500 hover:text-indigo-600 transition-all">
              {link.label}
            </a>
          ))}
        </div>
      </div>

      {/* Job Listings */}
      <MainContent stateCode={stateCode} />

      {/* ── RICH SEO CONTENT SECTION ─────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 mt-8 space-y-6">

        {/* Domicile + Reservation Info */}
        <div className="grid sm:grid-cols-2 gap-5">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800 p-5 shadow-sm">
            <h2 className="font-extrabold text-gray-900 dark:text-white text-sm mb-3 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-indigo-500" /> Domicile / Niwas Praman
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{richInfo.domicile}</p>
          </div>
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800 p-5 shadow-sm">
            <h2 className="font-extrabold text-gray-900 dark:text-white text-sm mb-3 flex items-center gap-2">
              <BadgePercent className="w-4 h-4 text-emerald-500" /> Reservation Policy
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{richInfo.reservation}</p>
            <div className="mt-3 flex items-center gap-2 text-sm font-bold text-gray-700 dark:text-gray-300">
              <Building2 className="w-4 h-4 text-amber-500" />
              Salary Range: <span className="text-indigo-600 dark:text-indigo-400">{richInfo.salaryRange}</span>
            </div>
          </div>
        </div>

        {/* Top Departments */}
        {richInfo.topDepts.length > 0 && (
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800 p-5 shadow-sm">
            <h2 className="font-extrabold text-gray-900 dark:text-white text-sm mb-4 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-indigo-500" /> {stateName} — Top Recruiting Departments
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {richInfo.topDepts.map(dept => (
                <Link key={dept.slug} href={`/jobs/${dept.slug}`} className="flex items-center gap-2 p-3 rounded-xl border border-gray-100 dark:border-zinc-800 hover:border-indigo-300 dark:hover:border-indigo-700 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/20 transition-all group">
                  <Briefcase className="w-4 h-4 text-indigo-400 shrink-0" />
                  <span className="text-xs font-bold text-gray-700 dark:text-gray-300 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 leading-tight">{dept.name}</span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* FAQ Section */}
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800 p-5 shadow-sm">
          <h2 className="font-extrabold text-gray-900 dark:text-white text-sm mb-4 flex items-center gap-2">
            <HelpCircle className="w-4 h-4 text-purple-500" /> {stateName} Sarkari Naukri — Aksar Pooche Jane Wale Sawaal
          </h2>
          <div className="space-y-4">
            {richInfo.faqs.map((faq, i) => (
              <div key={i} className="border-b border-gray-100 dark:border-zinc-800 pb-4 last:border-0 last:pb-0">
                <p className="font-bold text-gray-900 dark:text-white text-sm mb-1.5">Q: {faq.q}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Back to all states */}
        <Link href="/" className="inline-flex items-center gap-2 text-sm font-bold text-indigo-600 dark:text-indigo-400 hover:underline mb-8">
          <ArrowLeft className="w-4 h-4" />
          Browse Other States
        </Link>
      </div>
    </div>
  );
}

