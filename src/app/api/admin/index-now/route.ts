import { NextResponse } from "next/server";
import { notifySearchEngines } from "@/lib/instant-indexing";

/**
 * POST /api/admin/index-now
 * Full instant indexing — all 5 methods:
 * 1. Sitemap ping (Google + Bing + Yandex)
 * 2. IndexNow multi (Bing, Yandex, Seznam, Naver) — uses correct key from env
 * 3. Google Indexing API (direct Googlebot notification via service account)
 * 4. Category page warm-up
 * 5. PubSubHub ping (Google Discover / News)
 *
 * Called automatically when any blog is published.
 * Expected: Googlebot visits within 2–15 minutes.
 */
export async function POST(req: Request) {
  try {
    const { url, urls, slug, category } = await req.json();

    // Support both slug-based and URL-based calls
    let targetSlug: string | null = null;
    let targetCategory: string = category || "latest-jobs";

    if (slug) {
      targetSlug = slug;
    } else {
      // Extract slug from URL like /job/ssc-cgl-2026 or https://...
      const rawUrl: string = Array.isArray(urls) ? urls[0] : (url || "");
      const match = rawUrl.match(/\/job\/([^/?#]+)/);
      if (match?.[1]) targetSlug = match[1];
    }

    if (!targetSlug) {
      return NextResponse.json({ error: "No slug or URL provided" }, { status: 400 });
    }

    console.log(`🚀 [index-now route] Full instant indexing for slug: ${targetSlug}`);

    // Fire all 5 indexing methods via the master notifySearchEngines function
    await notifySearchEngines(targetSlug, targetCategory);

    return NextResponse.json({
      success: true,
      slug: targetSlug,
      message: `All 5 indexing methods fired for /job/${targetSlug}. Googlebot expected within 2–15 minutes.`,
    });
  } catch (err: any) {
    console.error("Indexing API exception:", err);
    return NextResponse.json({ error: err.message || "Instant indexing failed" }, { status: 500 });
  }
}
