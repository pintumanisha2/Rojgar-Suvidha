import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { Calendar, ChevronRight, Flame, Sparkles, AlertCircle, Clock } from "lucide-react";

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
  // Fetch from Supabase
  const { data: jobs } = await supabase
    .from("jobs")
    .select("*")
    .eq("category", category)
    .neq("status", "draft")
    .order("created_at", { ascending: false });

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
              🚀 Use "Apply For Me"
              <ChevronRight className="w-5 h-5" />
            </Link>
          </div>
        </div>

        {/* Grid of Small Premium Cards */}
        {jobs && jobs.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
            {jobs.map((job) => {
              // Extract Last Date
              let lastDate = "";
              if (job.important_dates && job.important_dates.length > 0) {
                const ldObj = job.important_dates.find((d: any) => d.label === "Last Date");
                if (ldObj) lastDate = ldObj.value;
              }

              const st = statusMap[job.status] || statusMap["active"];

              return (
                <Link
                  key={job.id}
                  href={`/job/${job.slug}`}
                  className="group flex flex-col bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 hover:border-indigo-500/30 dark:hover:border-indigo-500/30 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 overflow-hidden relative"
                >
                  {/* Top Gradient Bar */}
                  <div className={`h-1.5 w-full ${st.bg.split(' ')[0].replace('bg-', 'bg-gradient-to-r from-').replace('-50', '-400')} to-indigo-500`} />
                  
                  <div className="p-5 flex flex-col h-full">
                    
                    {/* Badges Row */}
                    <div className="flex items-center justify-between mb-4">
                      <span className={`inline-flex items-center gap-1.5 text-[10px] font-extrabold px-2.5 py-1 rounded-md uppercase tracking-wider ${st.text} ${st.bg}`}>
                        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${st.dot} ${job.status === "last" ? "animate-pulse" : ""}`} />
                        {st.label}
                      </span>
                      
                      {job.tag && (
                        <span className="flex items-center gap-1 text-[10px] font-extrabold text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 px-2 py-1 rounded-md uppercase tracking-wider">
                          <InlineTag tag={job.tag} /> {job.tag}
                        </span>
                      )}
                    </div>
                    
                    {/* Title */}
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-2 leading-snug mb-4 flex-1">
                      {job.title}
                    </h2>
                    
                    {/* Important Info Box */}
                    <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-3 mb-4 space-y-2 border border-gray-100 dark:border-gray-800">
                      {lastDate ? (
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-red-500 shrink-0" />
                          <span className="text-xs text-gray-600 dark:text-gray-400 font-medium">Last Date:</span>
                          <span className="text-xs font-bold text-red-600 dark:text-red-400">{lastDate}</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-gray-400 shrink-0" />
                          <span className="text-xs text-gray-600 dark:text-gray-400 font-medium">Posted:</span>
                          <span className="text-xs font-bold text-gray-700 dark:text-gray-300">
                            {new Date(job.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Bottom CTA */}
                    <div className="pt-3 mt-auto border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
                      <span className="text-xs font-bold text-gray-400 group-hover:text-indigo-500 transition-colors">Click to view</span>
                      <div className="bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 p-1.5 rounded-lg group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                        <ChevronRight className="w-4 h-4" />
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 p-16 text-center shadow-sm">
            <div className="text-5xl mb-6">📄</div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">No Updates Yet</h2>
            <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">
              We haven't posted anything in this category yet. Please check back later for new updates!
            </p>
          </div>
        )}

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
