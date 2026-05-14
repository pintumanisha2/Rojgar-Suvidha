import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { Newspaper, Clock, ChevronRight } from "lucide-react";
import type { Metadata } from "next";

export const revalidate = 60;

const BASE_URL = "https://www.rojgarsuvidha.com";

export const metadata: Metadata = {
  title: "Employment News 2025-2026 | Sarkari Naukri Samachar | Rojgar Suvidha",
  description: "Latest Employment News 2025-2026: Get daily sarkari naukri samachar, exam notifications, recruitment alerts, and government job updates in Hindi and English. Stay informed with Rojgar Suvidha.",
  keywords: [
    "employment news", "employment news 2025", "employment news 2026",
    "rojgar samachar", "sarkari naukri samachar", "naukri news today",
    "government job news", "exam notification 2025", "exam notification 2026",
    "recruitment news", "sarkari news", "daily government news",
    "rojgar suvidha news"
  ],
  openGraph: {
    title: "Employment News 2025-2026 | Sarkari Naukri Samachar",
    description: "Daily employment news, exam notifications, and sarkari naukri samachar for India.",
    url: `${BASE_URL}/news`,
    siteName: "Rojgar Suvidha",
    type: "website",
  },
  alternates: { canonical: `${BASE_URL}/news` },
};

export default async function NewsPage() {
  // Fetch News from Supabase
  const { data: newsItems } = await supabase
    .from("jobs")
    .select("id, title, slug, short_info, banner_url, created_at")
    .eq("category", "news")
    .neq("status", "draft")
    .order("created_at", { ascending: false });

  return (
    <div className="flex-1 bg-gray-50 dark:bg-gray-950 py-10 px-4 min-h-screen">
      <div className="max-w-6xl mx-auto">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 mb-10 bg-white dark:bg-gray-900 p-8 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-5">
            <div className="bg-rose-100 dark:bg-rose-900/30 p-4 rounded-2xl shrink-0">
              <Newspaper className="w-10 h-10 text-rose-600 dark:text-rose-400" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 dark:text-white mb-2">Employment News</h1>
              <p className="text-gray-500 dark:text-gray-400 text-lg">Daily updates, exam notifications, and recruitment news.</p>
            </div>
          </div>
        </div>

        {/* Professional News Grid */}
        {newsItems && newsItems.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {newsItems.map((news) => (
              <Link
                key={news.id}
                href={`/job/${news.slug}`}
                className="group flex flex-col bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 hover:border-rose-300 dark:hover:border-rose-700 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden hover:-translate-y-1"
              >
                {/* Thumbnail Image */}
                <div className="relative w-full aspect-[16/9] bg-gray-100 dark:bg-gray-800 overflow-hidden">
                  {news.banner_url ? (
                    <img 
                      src={news.banner_url} 
                      alt={news.title} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-rose-400 to-orange-400 flex items-center justify-center">
                       <Newspaper className="w-12 h-12 text-white/50" />
                    </div>
                  )}
                  {/* Category Badge overlay on image */}
                  <div className="absolute top-3 left-3 bg-white/90 dark:bg-black/80 backdrop-blur-sm text-rose-600 dark:text-rose-400 text-xs font-bold px-3 py-1.5 rounded-lg shadow-sm">
                    NEWS
                  </div>
                </div>

                {/* Content */}
                <div className="p-5 md:p-6 flex flex-col flex-1">
                  <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 dark:text-gray-400 mb-3">
                    <Clock className="w-3.5 h-3.5" />
                    {new Date(news.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </div>

                  <h2 className="text-xl font-bold text-gray-900 dark:text-white leading-snug mb-3 group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors line-clamp-2">
                    {news.title}
                  </h2>

                  {news.short_info && (
                    <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2 mb-4 leading-relaxed">
                      {news.short_info}
                    </p>
                  )}

                  <div className="mt-auto pt-4 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between text-rose-600 dark:text-rose-400">
                    <span className="text-sm font-bold">Read Article</span>
                    <ChevronRight className="w-5 h-5 transform group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 p-16 text-center shadow-sm">
            <div className="text-5xl mb-6">🗞️</div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">No News Yet</h2>
            <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">
              We haven't published any news articles yet. Stay tuned for the latest employment updates!
            </p>
          </div>
        )}

      </div>
    </div>
  );
}
