import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { Calendar, ChevronRight, Flame, Sparkles, AlertCircle, Clock } from "lucide-react";
import InfiniteJobList from "@/components/ui/InfiniteJobList";

type StatusKey = "out" | "active" | "last" | "soon" | "new";
type TagType = "hot" | "new" | "urgent";

const statusMap: Record<string, { label: string; dot: string; text: string; bg: string }> = {
  out:    { label: "Out",     dot: "bg-green-500",  text: "text-green-700 dark:text-green-400",   bg: "bg-green-50 dark:bg-green-900/20" },
  active: { label: "Active",  dot: "bg-blue-500",   text: "text-blue-700 dark:text-blue-400",     bg: "bg-blue-50 dark:bg-blue-900/20" },
  last:   { label: "Ending",  dot: "bg-red-500",    text: "text-red-700 dark:text-red-400",       bg: "bg-red-50 dark:bg-red-900/20" },
  soon:   { label: "Closing", dot: "bg-orange-400", text: "text-orange-600 dark:text-orange-400", bg: "bg-orange-50 dark:bg-orange-900/20" },
  new:    { label: "New",     dot: "bg-purple-500", text: "text-purple-700 dark:text-purple-400", bg: "bg-purple-50 dark:bg-purple-900/20" },
};

function InlineTag({ tag }: { tag?: string }) {
  if (tag === "hot")    return <Flame className="w-4 h-4 text-orange-500 shrink-0" />;
  if (tag === "new")    return <Sparkles className="w-4 h-4 text-purple-500 shrink-0" />;
  if (tag === "urgent") return <AlertCircle className="w-4 h-4 text-red-500 shrink-0 animate-pulse" />;
  return null;
}

interface CategoryTemplateProps {
  category: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  colorCls: string; // e.g., "red", "green", "indigo"
  seoContent?: React.ReactNode;
}

export default async function CategoryPageTemplate({ category, title, description, icon: Icon, colorCls, seoContent }: CategoryTemplateProps) {
  // Fetch from Supabase — support both 'admit-card' and 'admit-cards' variations
  const categoryList = category === "admit-card" ? ["admit-card", "admit-cards"] : [category];
  const { data: jobs } = await supabase
    .from("jobs")
    .select("*")
    .in("category", categoryList)
    .neq("status", "draft")
    .order("created_at", { ascending: false })
    .limit(15);

  // Map Color classes dynamically for tailwind to compile properly, we use fixed string checks or pre-defined classes.
  // We'll pass the full class names from the parent instead of generating them here to avoid Tailwind purging issues.
  
  return (
    <div className="flex-1 bg-gray-50 dark:bg-gray-950 py-10 px-4 min-h-screen">
      <div className="max-w-5xl mx-auto">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center gap-5 mb-8 bg-white dark:bg-gray-900 p-8 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800">
          <div className={`p-4 rounded-2xl shrink-0 ${colorCls}`}>
            <Icon className="w-10 h-10" />
          </div>
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 dark:text-white mb-2">{title}</h1>
            <p className="text-gray-500 dark:text-gray-400 text-lg">{description}</p>
          </div>
        </div>

        {/* Category-Smart Banner */}
        {(() => {
          const isAdmission = category === "admission" || category === "admissions";
          const isAdmit = category === "admit-card" || category === "admit-cards";
          const isResult = category === "results";
          const isKey = category === "answer-key";
          const isNews = category === "news" || category === "blogs";

          let badgeText = "Exclusive Service";
          let heading = "Form Bharne Mein Galti Ka Darr?";
          let desc = "Don't risk your career! Let our experts fill your government job forms with 100% accuracy. Zero errors, zero tension.";
          let btnText = "Use 'Apply For Me'";
          let btnHref = "/apply-for-me";
          let bgGradient = "from-indigo-600 via-violet-600 to-purple-600";

          if (isAdmission) {
            badgeText = "University & Entrance Counseling";
            heading = "College & University Admission Form Assistance";
            desc = "Get expert assistance for CUET UG/PG, NEET, JEE Main, B.Ed, and State Counseling application forms. Zero mistakes, 100% accurate submission.";
            btnText = "Apply Admission Form 🎓";
            btnHref = "/apply-for-me";
            bgGradient = "from-blue-600 via-sky-600 to-indigo-600";
          } else if (isAdmit) {
            badgeText = "Official Download Alert";
            heading = "Exam Center Jaane Se Pehle Checked?";
            desc = "Download your official e-call letter / hall ticket and verify exam venue address, shift timing, and photo ID instructions immediately.";
            btnText = "Scroll To Download List 📄";
            btnHref = "#job-cards-list";
            bgGradient = "from-orange-600 via-amber-600 to-red-600";
          } else if (isResult) {
            badgeText = "Result Announcement";
            heading = "Result Out! Check Your Scorecard & Cutoff";
            desc = "Find direct download links for selection merit lists, category-wise cutoffs, and official scorecards.";
            btnText = "View Selection Results 🏆";
            btnHref = "#job-cards-list";
            bgGradient = "from-emerald-600 via-teal-600 to-green-600";
          } else if (isKey) {
            badgeText = "Objection Window";
            heading = "Check Answer Key & Calculate Marks";
            desc = "Verify your responses against official keys and submit question challenges before the objection deadline closes.";
            btnText = "View Answer Keys 🔑";
            btnHref = "#job-cards-list";
            bgGradient = "from-purple-600 via-violet-600 to-indigo-600";
          } else if (isNews) {
            badgeText = "Educational Trends & Insights";
            heading = "Latest Exam Trends & Sarkari Yojana Updates";
            desc = "Read in-depth analysis, exam schedules, syllabus breakdowns, and career guidance written by domain experts.";
            btnText = "Read Trending News 📰";
            btnHref = "#job-cards-list";
            bgGradient = "from-pink-600 via-rose-600 to-red-600";
          }

          return (
            <div className={`mb-10 rounded-3xl bg-gradient-to-r ${bgGradient} p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl relative overflow-hidden group`}>
              <div className="absolute -top-24 -right-24 w-64 h-64 bg-white/10 rounded-full blur-3xl group-hover:scale-110 transition-transform duration-700"></div>
              <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-white/10 rounded-full blur-3xl group-hover:scale-110 transition-transform duration-700"></div>
              
              <div className="relative z-10 flex-1 text-center md:text-left">
                <span className="inline-block px-3 py-1 bg-yellow-400 text-yellow-900 text-[10px] font-extrabold rounded-full uppercase tracking-wider mb-3 shadow-sm">{badgeText}</span>
                <h3 className="text-2xl sm:text-3xl font-extrabold text-white mb-2 leading-tight">
                  {heading}
                </h3>
                <p className="text-indigo-100 text-sm sm:text-base max-w-xl mx-auto md:mx-0">
                  {desc}
                </p>
              </div>
              
              <div className="relative z-10 shrink-0 w-full md:w-auto">
                <Link 
                  href={btnHref}
                  className="flex items-center justify-center gap-2 bg-yellow-400 hover:bg-yellow-300 text-slate-900 px-8 py-3.5 rounded-2xl font-extrabold text-sm sm:text-base transition-all shadow-lg hover:shadow-yellow-400/50 hover:-translate-y-1 w-full"
                >
                  {btnText}
                  <ChevronRight className="w-5 h-5" />
                </Link>
              </div>
            </div>
          );
        })()}

        {/* Grid of Small Premium Cards (Infinite Scroll) */}
        <InfiniteJobList initialJobs={jobs || []} category={category} />

        {/* SEO Content Section */}
        {seoContent && (
          <div className="mt-12 bg-white dark:bg-gray-900 p-8 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 prose dark:prose-invert max-w-none prose-headings:font-bold prose-a:text-indigo-600 dark:prose-a:text-indigo-400">
            {seoContent}
          </div>
        )}
      </div>
    </div>
  );
}
