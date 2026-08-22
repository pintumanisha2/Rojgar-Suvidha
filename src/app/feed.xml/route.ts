import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';
export const revalidate = 60; // Revalidate every 60 seconds

function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export async function GET() {
  const baseUrl = 'https://www.rojgarsuvidha.com';

  const { data: items } = await supabase
    .from('jobs')
    .select('id, title, slug, short_info, meta_description, category, created_at, updated_at')
    .neq('status', 'draft')
    .order('created_at', { ascending: false })
    .limit(50);

  const rssItemsXml = (items || []).map((item) => {
    const postUrl = `${baseUrl}/job/${item.slug}`;
    const pubDate = new Date(item.created_at).toUTCString();
    const description = item.meta_description || item.short_info || item.title;
    const category = item.category || 'latest-jobs';

    return `
    <item>
      <title>${escapeXml(item.title)}</title>
      <link>${postUrl}</link>
      <guid isPermaLink="true">${postUrl}</guid>
      <pubDate>${pubDate}</pubDate>
      <category>${escapeXml(category)}</category>
      <description>${escapeXml(description)}</description>
    </item>`;
  }).join('');

  const rssXml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Rojgar Suvidha — Latest Sarkari Naukri &amp; Govt Job Alerts 2026</title>
    <link>${baseUrl}</link>
    <description>Official RSS Feed for Rojgar Suvidha — India's trusted Sarkari Naukri, Results, Admit Cards &amp; Govt Job Notifications.</description>
    <language>en-IN</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${baseUrl}/feed.xml" rel="self" type="application/rss+xml" />
    ${rssItemsXml}
  </channel>
</rss>`;

  return new NextResponse(rssXml.trim(), {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=60, s-maxage=60, stale-while-revalidate=300',
    },
  });
}
