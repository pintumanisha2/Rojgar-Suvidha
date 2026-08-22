import { NextResponse } from "next/server";
import { notifySearchEngines } from "@/lib/instant-indexing";
import { supabase } from "@/lib/supabase";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://www.rojgarsuvidha.com";
const SITE_HOST = "www.rojgarsuvidha.com";
const INDEXNOW_KEY = process.env.INDEXNOW_KEY || "81903AC6E158EBDBEA77300DC1D07ED1";

/**
 * POST /api/admin/index-now
 * Full instant indexing — 5 Real-Time Push Methods:
 *  1. Google Indexing API
 *  2. WebSub RSS & Sitemap Ping
 *  3. IndexNow Multi (Bing, Yandex, Seznam, Naver)
 *  4. Edge Warm-up & Cache Pre-fetch
 *  5. Bulk submission if { action: "bulk" }
 */
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { action, url, urls, slug, category } = body;

    // Handle Bulk Indexing for ALL active blogs in database
    if (action === "bulk") {
      console.log("🚀 [index-now route] Executing BULK indexing for all active blogs...");

      const { data: jobs, error } = await supabase
        .from("jobs")
        .select("slug, category, created_at")
        .neq("status", "draft")
        .order("created_at", { ascending: false });

      if (error || !jobs) {
        return NextResponse.json({ error: error?.message || "Failed to fetch jobs" }, { status: 500 });
      }

      const blogUrls = jobs.map((j) => `${BASE_URL}/job/${j.slug}`);
      const categoryUrls = [
        `${BASE_URL}/latest-jobs`,
        `${BASE_URL}/results`,
        `${BASE_URL}/admit-card`,
        `${BASE_URL}/answer-key`,
        `${BASE_URL}/admission`,
        `${BASE_URL}/news`,
      ];
      const feedUrls = [`${BASE_URL}/sitemap.xml`, `${BASE_URL}/feed.xml`, `${BASE_URL}/rss.xml`];
      const allUrlsToSubmit = Array.from(new Set([...blogUrls, ...categoryUrls, ...feedUrls]));

      // 1. Bulk IndexNow Push
      const indexNowEndpoints = [
        "https://api.indexnow.org/indexnow",
        "https://www.bing.com/indexnow",
        "https://search.seznam.cz/indexnow",
        "https://yandex.com/indexnow",
      ];
      const payload = JSON.stringify({
        host: SITE_HOST,
        key: INDEXNOW_KEY,
        keyLocation: `https://${SITE_HOST}/${INDEXNOW_KEY}.txt`,
        urlList: allUrlsToSubmit,
      });

      await Promise.allSettled(
        indexNowEndpoints.map((ep) =>
          fetch(ep, {
            method: "POST",
            headers: { "Content-Type": "application/json; charset=utf-8" },
            body: payload,
            signal: AbortSignal.timeout(10000),
          })
        )
      );

      // 2. WebSub Ping
      const rssFeedUrl = encodeURIComponent(`${BASE_URL}/feed.xml`);
      const sitemapUrl = encodeURIComponent(`${BASE_URL}/sitemap.xml`);
      await Promise.allSettled([
        fetch("https://pubsubhubbub.appspot.com/", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: `hub.mode=publish&hub.url=${rssFeedUrl}`,
          signal: AbortSignal.timeout(8000),
        }),
        fetch("https://pubsubhubbub.appspot.com/", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: `hub.mode=publish&hub.url=${sitemapUrl}`,
          signal: AbortSignal.timeout(8000),
        }),
      ]);

      return NextResponse.json({
        success: true,
        action: "bulk",
        totalSubmitted: allUrlsToSubmit.length,
        totalBlogs: jobs.length,
        message: `Bulk indexing executed for ${jobs.length} blogs & ${allUrlsToSubmit.length} total URLs. Bing/Yandex/Google notified.`,
      });
    }

    // Support single slug-based and URL-based calls
    let targetSlug: string | null = null;
    let targetCategory: string = category || "latest-jobs";

    if (slug) {
      targetSlug = slug;
    } else {
      const rawUrl: string = Array.isArray(urls) ? urls[0] : (url || "");
      const match = rawUrl.match(/\/job\/([^/?#]+)/);
      if (match?.[1]) targetSlug = match[1];
    }

    if (!targetSlug) {
      return NextResponse.json({ error: "No slug or URL provided" }, { status: 400 });
    }

    console.log(`🚀 [index-now route] Full instant indexing for slug: ${targetSlug}`);
    await notifySearchEngines(targetSlug, targetCategory);

    return NextResponse.json({
      success: true,
      slug: targetSlug,
      message: `All 5 indexing layers fired for /job/${targetSlug}. Googlebot expected within 2–15 minutes.`,
    });
  } catch (err: any) {
    console.error("Indexing API exception:", err);
    return NextResponse.json({ error: err.message || "Instant indexing failed" }, { status: 500 });
  }
}
