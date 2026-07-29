import { supabase } from "@/lib/supabase";
import type { Metadata } from "next";
import NewsPortal from "@/components/news/NewsPortal";

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
    "rojgar suvidha news",
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
  const { data: newsItems } = await supabase
    .from("jobs")
    .select("id, title, slug, short_info, banner_url, created_at")
    .in("category", ["news", "news-updates"])
    .neq("status", "draft")
    .order("created_at", { ascending: false });

  return <NewsPortal newsItems={newsItems ?? []} />;
}
