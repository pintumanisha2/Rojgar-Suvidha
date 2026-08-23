import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";
export const revalidate = 60; // Revalidate every 60 seconds

export async function GET() {
  const baseUrl = "https://www.rojgarsuvidha.com";

  // Fetch blogs from last 48 hours for Google News crawler
  const twoDaysAgo = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();

  const { data: jobs } = await supabase
    .from("jobs")
    .select("title, slug, created_at, updated_at")
    .neq("status", "draft")
    .gte("created_at", twoDaysAgo)
    .order("created_at", { ascending: false });

  const xmlItems = (jobs || []).map((job) => {
    const pubDate = new Date(job.created_at).toISOString();
    const cleanTitle = (job.title || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&apos;");

    return `  <url>
    <loc>${baseUrl}/job/${job.slug}</loc>
    <news:news>
      <news:publication>
        <news:name>Rojgar Suvidha</news:name>
        <news:language>hi</news:language>
      </news:publication>
      <news:publication_date>${pubDate}</news:publication_date>
      <news:title>${cleanTitle}</news:title>
    </news:news>
  </url>`;
  }).join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">
${xmlItems}
</urlset>`;

  return new NextResponse(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
    },
  });
}
