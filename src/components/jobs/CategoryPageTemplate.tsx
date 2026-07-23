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

        {/* Promotional Banner: Apply For Me */}
        <div className="mb-10 rounded-3xl bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600 p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl relative overflow-hidden group">
          {/* Abstract background shapes */}
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-white/10 rounded-full blur-3xl group-hover:scale-110 transition-transform duration-700"></div>
          <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-white/10 rounded-full blur-3xl group-hover:scale-110 transition-transform duration-700"></div>
          
          <div className="relative z-10 flex-1 text-center md:text-left">
            <span className="inline-block px-3 py-1 bg-yellow-400 text-yellow-900 text-[10px] font-extrabold rounded-full uppercase tracking-wider mb-3 shadow-sm">Exclusive Service</span>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-white mb-2 leading-tight">
              Form Bharne Mein Galti Ka Darr?
            </h3>
            <p className="text-indigo-100 text-sm sm:text-base max-w-xl mx-auto md:mx-0">
              Don't risk your career! Let our experts fill your government job forms with 100% accuracy. Zero errors, zero tension.
            </p>
          </div>
          
          <div className="relative z-10 shrink-0 w-full md:w-auto">
            <Link 
              href="/apply-for-me"
              className="flex items-center justify-center gap-2 bg-yellow-400 hover:bg-yellow-300 text-indigo-900 px-8 py-3.5 rounded-2xl font-extrabold text-sm sm:text-base transition-all shadow-lg hover:shadow-yellow-400/50 hover:-translate-y-1 w-full"
            >
              Use "Apply For Me"
              <ChevronRight className="w-5 h-5" />
            </Link>
          </div>
        </div>

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
