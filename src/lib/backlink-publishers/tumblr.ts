/**
 * ═══════════════════════════════════════════════════════════════════
 * TUMBLR API v2 (DA-86) — REAL AUTO-PUBLISHER
 * ═══════════════════════════════════════════════════════════════════
 * Publishes satellite posts to Tumblr (DA-86)
 *
 * Required ENV vars (in Vercel):
 *   TUMBLR_BLOG_NAME   — e.g. "rojgarsuvidha" (or rojgarsuvidha.tumblr.com)
 *   TUMBLR_CONSUMER_KEY — API key from tumblr.com/oauth/apps
 *   TUMBLR_OAUTH_TOKEN  — OAuth access token (or Bearer Token)
 */

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://www.rojgarsuvidha.com";

function getTumblrCredentials() {
  return {
    BLOG_NAME: process.env.TUMBLR_BLOG_NAME?.trim(),
    API_KEY: (process.env.TUMBLR_CONSUMER_KEY || process.env.TUMBLR_API_KEY)?.trim(),
    TOKEN: (process.env.TUMBLR_OAUTH_TOKEN || process.env.TUMBLR_ACCESS_TOKEN)?.trim(),
  };
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
  const { BLOG_NAME, API_KEY, TOKEN } = getTumblrCredentials();

  if (!BLOG_NAME || (!API_KEY && !TOKEN)) {
    console.log("ℹ️ [Tumblr Publisher] TUMBLR_BLOG_NAME or API_KEY not set — skipping.");
    return null;
  }

  const cleanBlog = BLOG_NAME.replace(/\.tumblr\.com$/, "").trim();
  const blogIdentifier = `${cleanBlog}.tumblr.com`;
  const jobUrl = `${BASE_URL}/job/${params.slug}`;

  const bodyHtml = `
    <h2>${params.title}</h2>
    <p>A new government job notification has been released across India. Candidates searching for government vacancies can check complete qualification criteria, application fees, and selection procedures.</p>
    <p><strong>Direct Application Portal:</strong> <a href="${jobUrl}" target="_blank" rel="dofollow"><strong>Rojgar Suvidha — Official Notification & Apply Online</strong></a></p>
    <p>📢 <em>Join Telegram <a href="https://t.me/govermentform">@govermentform</a> for instant sarkari job alerts.</em></p>
  `.trim();

  const authHeader = TOKEN ? `Bearer ${TOKEN}` : `OAuth consumer_key="${API_KEY}"`;

  try {
    const res = await fetch(`https://api.tumblr.com/v2/blog/${blogIdentifier}/post`, {
      method: "POST",
      headers: {
        "Authorization": authHeader,
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent": "RojgarSuvidhaBot/1.0",
      },
      body: new URLSearchParams({
        type: "text",
        title: `${params.title} — Recruitment 2026`,
        body: bodyHtml,
        tags: "sarkari naukri,govt jobs,recruitment 2026,rojgar suvidha",
      }).toString(),
      signal: AbortSignal.timeout(15000),
    });
    const json = await res.json();

    if (res.ok && (json?.response?.id_string || json?.response?.id)) {
      const postId = json.response.id_string || json.response.id;
      const liveUrl = `https://${blogIdentifier}/post/${postId}`;
      console.log(`✅ [Tumblr Publisher] Published: ${liveUrl}`);
      return liveUrl;
    } else {
      console.warn("⚠️ [Tumblr Publisher] API Error:", JSON.stringify(json));
      return null;
    }
  } catch (err: any) {
    console.warn("⚠️ [Tumblr Publisher] Exception:", err.message);
    return null;
  }
}
