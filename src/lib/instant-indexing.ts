/**
 * Instant Search Engine Indexing
 * ─────────────────────────────────────────────────────────────────────────────
 * Called immediately when a blog post is approved & published from Telegram.
 * Notifies Google, Bing, Yandex within MINUTES (not days) of publication.
 *
 * 3 methods (all run in parallel, any failure is silently caught):
 * 1. Google Sitemap Ping   — asks Google to re-crawl sitemap
 * 2. IndexNow              — Bing, Yandex, Seznam instant protocol
 * 3. Google Indexing API   — direct Google bot notification (requires service account)
 */

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://www.rojgarsuvidha.com";
const SITE_HOST = "www.rojgarsuvidha.com";

// IndexNow API Key — generate at: https://www.bing.com/indexnow/getstarted
// Also add /public/{INDEXNOW_KEY}.txt with just the key value inside
const INDEXNOW_KEY = process.env.INDEXNOW_KEY || "";

// ── Method 1: Google + Bing Sitemap Ping ─────────────────────────────────────
async function pingSitemap(): Promise<void> {
  try {
    const sitemapUrl = encodeURIComponent(`${BASE_URL}/sitemap.xml`);
    await Promise.allSettled([
      fetch(`https://www.google.com/ping?sitemap=${sitemapUrl}`, { signal: AbortSignal.timeout(8000) }),
      fetch(`https://www.bing.com/ping?sitemap=${sitemapUrl}`, { signal: AbortSignal.timeout(8000) }),
    ]);
    console.log(`✅ [Indexing] Sitemap pinged to Google + Bing`);
  } catch (err: any) {
    console.warn(`⚠️ [Indexing] Sitemap ping failed: ${err.message}`);
  }
}

// ── Method 2: IndexNow (Bing, Yandex, Seznam etc.) ───────────────────────────
async function submitIndexNow(pageUrl: string): Promise<void> {
  if (!INDEXNOW_KEY) {
    console.warn("⚠️ [Indexing] INDEXNOW_KEY missing — set it in Vercel env vars");
    return;
  }
  try {
    const res = await fetch("https://api.indexnow.org/indexnow", {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify({
        host: SITE_HOST,
        key: INDEXNOW_KEY,
        keyLocation: `https://${SITE_HOST}/${INDEXNOW_KEY}.txt`,
        urlList: [pageUrl],
      }),
      signal: AbortSignal.timeout(10000),
    });
    console.log(`✅ [Indexing] IndexNow submitted (status: ${res.status}): ${pageUrl}`);
  } catch (err: any) {
    console.warn(`⚠️ [Indexing] IndexNow failed: ${err.message}`);
  }
}

// ── Method 3: Google Indexing API (fastest for Google!) ──────────────────────
// Requires GOOGLE_INDEXING_CREDENTIALS in Vercel env vars (service account JSON)
// Setup guide: https://developers.google.com/search/apis/indexing-api/v3/quickstart
async function submitGoogleIndexingAPI(pageUrl: string): Promise<void> {
  const credsJson = process.env.GOOGLE_INDEXING_CREDENTIALS;
  if (!credsJson) {
    console.warn("⚠️ [Indexing] GOOGLE_INDEXING_CREDENTIALS not set — add service account JSON to Vercel");
    return;
  }
  try {
    const creds = JSON.parse(credsJson);
    const now = Math.floor(Date.now() / 1000);
    const enc = (obj: any) =>
      Buffer.from(JSON.stringify(obj)).toString("base64")
        .replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");

    const header = enc({ alg: "RS256", typ: "JWT" });
    const claim = enc({
      iss: creds.client_email,
      scope: "https://www.googleapis.com/auth/indexing",
      aud: "https://oauth2.googleapis.com/token",
      exp: now + 3600, iat: now,
    });
    const sigInput = `${header}.${claim}`;

    const { createSign } = await import("crypto");
    const sign = createSign("SHA256");
    sign.update(sigInput);
    const sig = sign.sign(creds.private_key).toString("base64")
      .replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");

    // Get OAuth token
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${sigInput}.${sig}`,
      signal: AbortSignal.timeout(10000),
    });
    const { access_token } = await tokenRes.json();
    if (!access_token) return;

    // Notify Google
    const res = await fetch("https://indexing.googleapis.com/v3/urlNotifications:publish", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${access_token}` },
      body: JSON.stringify({ url: pageUrl, type: "URL_UPDATED" }),
      signal: AbortSignal.timeout(10000),
    });
    if (res.ok) {
      console.log(`✅ [Indexing] Google Indexing API: submitted ${pageUrl}`);
    } else {
      const d = await res.json();
      console.warn(`⚠️ [Indexing] Google API error: ${d.error?.message}`);
    }
  } catch (err: any) {
    console.warn(`⚠️ [Indexing] Google Indexing API failed: ${err.message}`);
  }
}

// ── MAIN: Call after publishing any new blog ──────────────────────────────────
/**
 * Instantly notifies Google, Bing, Yandex about a newly published page.
 * All 3 methods run in parallel. Non-blocking — publish flow never delayed.
 */
export async function notifySearchEngines(slug: string): Promise<void> {
  const pageUrl = `${BASE_URL}/job/${slug}`;
  console.log(`🔍 [Indexing] Notifying search engines: ${pageUrl}`);
  await Promise.allSettled([
    pingSitemap(),
    submitIndexNow(pageUrl),
    submitGoogleIndexingAPI(pageUrl),
  ]);
  console.log(`✅ [Indexing] Done: ${slug}`);
}
