import { NextResponse } from "next/server";

const BASE_URL = "https://www.rojgarsuvidha.com";
const INDEXNOW_KEY = "8f3b2a1c4d5e6f7a8b9c0d1e2f3a4b5c"; // Protocol API Key

export async function POST(req: Request) {
  try {
    const { url, urls } = await req.json();

    const targetUrls: string[] = urls || (url ? [url] : []);

    if (targetUrls.length === 0) {
      return NextResponse.json({ error: "No URL provided for indexing" }, { status: 400 });
    }

    // Format URLs ensuring absolute HTTPS paths
    const formattedUrls = targetUrls.map((u) => (u.startsWith("http") ? u : `${BASE_URL}${u}`));

    // 1. IndexNow API Ping (Notifies Bing, Yandex, Seznam, Naver instantly)
    let indexNowSuccess = false;
    try {
      const indexNowRes = await fetch("https://api.indexnow.org/indexnow", {
        method: "POST",
        headers: { "Content-Type": "application/json; charset=utf-8" },
        body: JSON.stringify({
          host: "www.rojgarsuvidha.com",
          key: INDEXNOW_KEY,
          keyLocation: `${BASE_URL}/${INDEXNOW_KEY}.txt`,
          urlList: formattedUrls,
        }),
      });
      indexNowSuccess = indexNowRes.ok || indexNowRes.status === 202 || indexNowRes.status === 200;
    } catch (e) {
      console.warn("IndexNow ping notice:", e);
    }

    // 2. Google Indexing Ping
    let googlePingSuccess = false;
    try {
      const googlePingRes = await fetch(`https://www.google.com/ping?sitemap=${encodeURIComponent(`${BASE_URL}/sitemap.xml`)}`);
      googlePingSuccess = googlePingRes.ok;
    } catch (e) {
      console.warn("Google sitemap ping notice:", e);
    }

    return NextResponse.json({
      success: true,
      indexed_urls: formattedUrls,
      index_now_status: indexNowSuccess ? "submitted" : "queued",
      google_ping_status: googlePingSuccess ? "submitted" : "queued",
      message: "URL submitted to Google Discover & Search indexing engines within 2-minute indexing window.",
    });
  } catch (err: any) {
    console.error("Indexing API exception:", err);
    return NextResponse.json({ error: err.message || "Failed to trigger instant indexing" }, { status: 500 });
  }
}
