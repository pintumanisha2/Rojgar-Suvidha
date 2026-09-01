/**
 * ═══════════════════════════════════════════════════════════════════
 * TUMBLR API v2 (DA-86) — REAL AUTO-PUBLISHER
 * ═══════════════════════════════════════════════════════════════════
 * Publishes satellite posts to Tumblr (DA-86) using OAuth 1.0a
 */

import crypto from "crypto";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://www.rojgarsuvidha.com";

function getTumblrCredentials() {
  return {
    BLOG_NAME: process.env.TUMBLR_BLOG_NAME?.trim(),
    API_KEY: (process.env.TUMBLR_CONSUMER_KEY || process.env.TUMBLR_API_KEY)?.trim(),
    SECRET: (process.env.TUMBLR_CONSUMER_SECRET || process.env.TUMBLR_SECRET_KEY)?.trim(),
    TOKEN: (process.env.TUMBLR_OAUTH_TOKEN || process.env.TUMBLR_ACCESS_TOKEN)?.trim(),
    TOKEN_SECRET: process.env.TUMBLR_OAUTH_TOKEN_SECRET?.trim() || "",
  };
}

/**
 * Generate standard OAuth 1.0a Authorization header for Tumblr API
 */
function generateOauthHeader(
  method: string,
  url: string,
  bodyParams: Record<string, string>,
  consumerKey: string,
  consumerSecret: string,
  token = "",
  tokenSecret = ""
): string {
  const oauthParams: Record<string, string> = {
    oauth_consumer_key: consumerKey,
    oauth_nonce: crypto.randomBytes(16).toString("hex"),
    oauth_signature_method: "HMAC-SHA1",
    oauth_timestamp: Math.floor(Date.now() / 1000).toString(),
    oauth_version: "1.0",
    ...bodyParams,
  };

  if (token) oauthParams.oauth_token = token;

  const sortedKeys = Object.keys(oauthParams).sort();
  const paramString = sortedKeys
    .map((k) => `${encodeURIComponent(k)}=${encodeURIComponent(oauthParams[k])}`)
    .join("&");

  const baseString = `${method.toUpperCase()}&${encodeURIComponent(url)}&${encodeURIComponent(paramString)}`;
  const signingKey = `${encodeURIComponent(consumerSecret)}&${encodeURIComponent(tokenSecret)}`;

  const signature = crypto.createHmac("sha1", signingKey).update(baseString).digest("base64");
  oauthParams.oauth_signature = signature;

  const headerParts = Object.keys(oauthParams)
    .filter((k) => k.startsWith("oauth_"))
    .map((k) => `${encodeURIComponent(k)}="${encodeURIComponent(oauthParams[k])}"`);

  return `OAuth ${headerParts.join(", ")}`;
}

/**
 * Publish a satellite post to Tumblr (DA-86)
 * Returns live Tumblr URL or null on failure.
 */
export async function publishToTumblr(params: {
  jobId: string;
  title: string;
  slug: string;
  category?: string;
}): Promise<string | null> {
  const { BLOG_NAME, API_KEY, SECRET, TOKEN, TOKEN_SECRET } = getTumblrCredentials();

  if (!BLOG_NAME || !API_KEY) {
    console.log("ℹ️ [Tumblr Publisher] TUMBLR_BLOG_NAME or API_KEY not set — skipping.");
    return null;
  }

  const cleanBlog = BLOG_NAME
    .replace(/^https?:\/\//, "")
    .replace(/^www\.tumblr\.com\//, "")
    .replace(/\.tumblr\.com\/?$/, "")
    .replace(/\/+$/, "")
    .replace(/^@/, "")
    .trim();

  const blogIdentifier = `${cleanBlog}.tumblr.com`;
  const postUrl = `https://api.tumblr.com/v2/blog/${blogIdentifier}/post`;
  const jobUrl = `${BASE_URL}/job/${params.slug}`;

  const bodyHtml = `
    <h2>${params.title}</h2>
    <p>A new government job notification has been released across India. Candidates searching for government vacancies can check complete qualification criteria, application fees, and selection procedures.</p>
    <p><strong>Direct Application Portal:</strong> <a href="${jobUrl}" target="_blank" rel="dofollow"><strong>Rojgar Suvidha — Official Notification & Apply Online</strong></a></p>
    <p>📢 <em>Join Telegram <a href="https://t.me/govermentform">@govermentform</a> for instant sarkari job alerts.</em></p>
  `.trim();

  const bodyParams: Record<string, string> = {
    type: "text",
    title: `${params.title.slice(0, 60)} — Recruitment 2026`,
    body: bodyHtml,
    tags: "sarkari naukri,govt jobs,recruitment 2026,rojgar suvidha",
  };

  const authHeader = generateOauthHeader(
    "POST",
    postUrl,
    bodyParams,
    API_KEY,
    SECRET || "",
    TOKEN || "",
    TOKEN_SECRET || ""
  );

  // Try Candidate 1: OAuth 1.0a HMAC-SHA1
  try {
    const res = await fetch(postUrl, {
      method: "POST",
      headers: {
        "Authorization": authHeader,
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent": "RojgarSuvidhaBot/1.0",
      },
      body: new URLSearchParams(bodyParams).toString(),
      signal: AbortSignal.timeout(15000),
    });

    const json = await res.json();
    if (res.ok && (json?.response?.id_string || json?.response?.id)) {
      const postId = json.response.id_string || json.response.id;
      const liveUrl = `https://${blogIdentifier}/post/${postId}`;
      console.log(`✅ [Tumblr Publisher] Published: ${liveUrl}`);
      return liveUrl;
    } else {
      (globalThis as any)._lastTumblrError = `Status ${res.status}: ${JSON.stringify(json)}`;
      console.warn("⚠️ [Tumblr Publisher] API Error:", res.status, JSON.stringify(json));
    }
  } catch (err: any) {
    (globalThis as any)._lastTumblrError = `Exception: ${err.message}`;
    console.warn("⚠️ [Tumblr Publisher] Exception:", err.message);
  }

  // Try Candidate 2: api_key query param with JSON NPF
  try {
    const res2 = await fetch(`https://api.tumblr.com/v2/blog/${blogIdentifier}/post?api_key=${API_KEY}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "RojgarSuvidhaBot/1.0",
      },
      body: JSON.stringify({
        content: [
          { type: "text", text: params.title, subtype: "heading1" },
          { type: "text", text: `Check official notification and eligibility at Rojgar Suvidha: ${jobUrl}` }
        ]
      }),
      signal: AbortSignal.timeout(15000),
    });
    const json2 = await res2.json();
    if (res2.ok && (json2?.response?.id_string || json2?.response?.id)) {
      const postId = json2.response.id_string || json2.response.id;
      const liveUrl = `https://${blogIdentifier}/post/${postId}`;
      console.log(`✅ [Tumblr Publisher] Published via NPF: ${liveUrl}`);
      return liveUrl;
    } else {
      (globalThis as any)._lastTumblrError += ` | NPF Status ${res2.status}: ${JSON.stringify(json2)}`;
    }
  } catch (err2: any) {
    (globalThis as any)._lastTumblrError += ` | NPF Exception: ${err2.message}`;
  }

  return null;
}
