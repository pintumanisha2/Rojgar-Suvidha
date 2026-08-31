import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";
export const revalidate = 0; // Always fresh — Google News crawls every few minutes

const CATEGORY_GENRE: Record<string, string> = {
  "latest-jobs": "PressRelease",
  "results": "PressRelease",
  "admit-card": "PressRelease",
  "answer-key": "PressRelease",
  "admission": "PressRelease",
  "news": "Blog",
};

const CATEGORY_KEYWORDS: Record<string, string> = {
  "latest-jobs": "sarkari naukri, government jobs, recruitment 2026, apply online",
  "results": "sarkari result, exam result, merit list, cutoff marks",
  "admit-card": "admit card download, hall ticket, exam date",
  "answer-key": "answer key, objection, score calculation",
  "admission": "admission 2026, university admission, college admission",
  "news": "sarkari news, government exam news, job news India",
};

export async function GET() {
  const baseUrl = "https://www.rojgarsuvidha.com";

  // Fetch articles from last 48 hours — Google News only indexes recent articles
  const twoDaysAgo = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();

  const { data: jobs } = await supabase
    .from("jobs")
    .select("title, slug, category, created_at, updated_at, state_code")
    .neq("status", "draft")
    .gte("created_at", twoDaysAgo)
    .order("created_at", { ascending: false })
    .limit(1000);

  const escapeXml = (str: string) =>
    (str || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&apos;");

  const xmlItems = (jobs || [])
    .map((job) => {
      const pubDate = new Date(job.created_at).toISOString();
      const cleanTitle = escapeXml(job.title || "");
      const genre = CATEGORY_GENRE[job.category || ""] || "Blog";
      const keywords = CATEGORY_KEYWORDS[job.category || ""] ||
        "sarkari naukri, government jobs, rojgar suvidha";
      const stateKeyword = job.state_code && job.state_code !== "ALL"
        ? `, ${job.state_code} government jobs`
        : "";

      return `  <url>
    <loc>${baseUrl}/job/${job.slug}</loc>
    <lastmod>${pubDate}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
    <news:news>
      <news:publication>
        <news:name>Rojgar Suvidha</news:name>
        <news:language>en</news:language>
      </news:publication>
      <news:publication_date>${pubDate}</news:publication_date>
      <news:title>${cleanTitle}</news:title>
      <news:genres>${genre}</news:genres>
      <news:keywords>${escapeXml(keywords + stateKeyword)}</news:keywords>
    </news:news>
  </url>`;
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset
  xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
  xmlns:news="http://www.google.com/schemas/sitemap-news/0.9"
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9
    http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd
    http://www.google.com/schemas/sitemap-news/0.9
    http://www.google.com/schemas/sitemap-news/0.9/sitemap-news.xsd">
${xmlItems}
</urlset>`;

  return new NextResponse(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
      "X-Robots-Tag": "noindex",
    },
  });
}

