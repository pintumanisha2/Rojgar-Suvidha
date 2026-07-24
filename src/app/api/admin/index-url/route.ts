import { NextResponse } from "next/server";

const BASE_URL = "https://www.rojgarsuvidha.com";
const INDEXNOW_KEY = "81903AC6E158EBDBEA77300DC1D07ED1";

/**
 * POST /api/admin/index-url
 * Body: { urls: string[] }  OR  { slug: string }
 *
 * Pings:
 *  1. IndexNow → Bing, Yandex, Seznam (near-instant, 5–10 min on Bing)
 *  2. Google Search Console Ping (sitemap refresh signal)
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();

    // Accept either a single slug or array of full URLs
    let urls: string[] = [];
    if (body.slug) {
      urls = [`${BASE_URL}/job/${body.slug}`];
    } else if (Array.isArray(body.urls)) {
      urls = body.urls.filter((u: string) => typeof u === "string" && u.startsWith("http"));
    }

    if (urls.length === 0) {
      return NextResponse.json({ error: "No valid URLs provided." }, { status: 400 });
    }

    const results: Record<string, any> = {};

    // ── 1. IndexNow — Bing / Yandex / Seznam (fastest, 5–10 min) ─────────────
    try {
      const indexNowPayload = {
        host: "www.rojgarsuvidha.com",
        key: INDEXNOW_KEY,
        keyLocation: `${BASE_URL}/${INDEXNOW_KEY}.txt`,
        urlList: urls,
      };

      // Submit to Bing (which automatically relays to other IndexNow partners)
      const bingRes = await fetch("https://api.indexnow.org/indexnow", {
        method: "POST",
        headers: { "Content-Type": "application/json; charset=utf-8" },
        body: JSON.stringify(indexNowPayload),
        signal: AbortSignal.timeout(10000),
      });

      results.indexnow = {
        status: bingRes.status,
        ok: bingRes.ok || bingRes.status === 202,
        message: bingRes.ok || bingRes.status === 202
          ? `✅ IndexNow: ${urls.length} URL(s) pinged to Bing/Yandex — expect indexing within 5–30 mins`
          : `⚠️ IndexNow returned HTTP ${bingRes.status}`,
      };
    } catch (err: any) {
      results.indexnow = { ok: false, error: err.message };
    }

    // ── 2. Google Sitemap Ping (free, no auth needed) ─────────────────────────
    // Submitting sitemap URL to Google's ping endpoint signals fresh content
    try {
      const sitemapUrl = encodeURIComponent(`${BASE_URL}/sitemap.xml`);
      const googlePingRes = await fetch(
        `https://www.google.com/ping?sitemap=${sitemapUrl}`,
        { signal: AbortSignal.timeout(8000) }
      );
      results.google_sitemap_ping = {
        status: googlePingRes.status,
        ok: googlePingRes.ok,
        message: googlePingRes.ok
          ? `✅ Google Sitemap pinged — Googlebot will recrawl sitemap soon`
          : `⚠️ Google ping returned HTTP ${googlePingRes.status}`,
      };
    } catch (err: any) {
      results.google_sitemap_ping = { ok: false, error: err.message };
    }

    // ── 3. Bing Sitemap Ping ───────────────────────────────────────────────────
    try {
      const sitemapUrl = encodeURIComponent(`${BASE_URL}/sitemap.xml`);
      const bingSitemapRes = await fetch(
        `https://www.bing.com/ping?sitemap=${sitemapUrl}`,
        { signal: AbortSignal.timeout(8000) }
      );
      results.bing_sitemap_ping = {
        ok: bingSitemapRes.ok,
        status: bingSitemapRes.status,
      };
    } catch (err: any) {
      results.bing_sitemap_ping = { ok: false, error: err.message };
    }

    const allOk = results.indexnow?.ok && results.google_sitemap_ping?.ok;
    return NextResponse.json({
      success: allOk,
      urls_submitted: urls,
      results,
      summary: allOk
        ? `🚀 Fast Index triggered! Bing: 5–30 min | Google: 30–90 min`
        : `⚠️ Partial success — check individual results`,
    });
  } catch (err: any) {
    console.error("Index URL error:", err);
    return NextResponse.json({ error: err.message || "Server error" }, { status: 500 });
  }
}
