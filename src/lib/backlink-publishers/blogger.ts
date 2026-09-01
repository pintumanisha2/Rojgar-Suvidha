/**
 * ═══════════════════════════════════════════════════════════════════
 * GOOGLE BLOGGER API v3 — REAL AUTO-PUBLISHER
 * ═══════════════════════════════════════════════════════════════════
 * Publishes a Gemini-AI-generated 200-word unique satellite post to
 * your official Blogger (Blogspot) blog after Admin approves a job.
 *
 * Required ENV vars (add to Vercel → Settings → Environment Variables):
 *   BLOGGER_BLOG_ID          — Blog ID from blogger.com/blog/posts/YOUR_ID
 *   BLOGGER_CLIENT_ID        — Google Cloud OAuth 2.0 Client ID
 *   BLOGGER_CLIENT_SECRET    — Google Cloud OAuth 2.0 Client Secret
 *   BLOGGER_REFRESH_TOKEN    — OAuth Refresh Token (one-time setup)
 *   GEMINI_API_KEY           — (already set)
 */

// ⚠️ DO NOT use module-level constants for env vars in Next.js!
// They get evaluated at BUILD TIME and are undefined. Always read at runtime inside functions.
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://www.rojgarsuvidha.com";
const BLOGGER_BLOG_URL = "https://rojgarsuvidhaa.blogspot.com";

// Runtime env getter (evaluated fresh each time — never cached)
function getBloggerCredentials() {
  return {
    BLOG_ID: process.env.BLOGGER_BLOG_ID,
    CLIENT_ID: process.env.BLOGGER_CLIENT_ID,
    CLIENT_SECRET: process.env.BLOGGER_CLIENT_SECRET,
    REFRESH_TOKEN: process.env.BLOGGER_REFRESH_TOKEN,
    GEMINI_KEY: process.env.GEMINI_API_KEY_1 || process.env.GEMINI_API_KEY,
  };
}


/**
 * Get fresh Google OAuth access token using Refresh Token
 */
async function getBloggerAccessToken(): Promise<string | null> {
  const { CLIENT_ID, CLIENT_SECRET, REFRESH_TOKEN } = getBloggerCredentials();
  if (!CLIENT_ID || !CLIENT_SECRET || !REFRESH_TOKEN) {
    console.warn("⚠️ [Blogger] Missing credentials:", { CLIENT_ID: !!CLIENT_ID, CLIENT_SECRET: !!CLIENT_SECRET, REFRESH_TOKEN: !!REFRESH_TOKEN });
    return null;
  }
  try {
    const res = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        refresh_token: REFRESH_TOKEN,
        grant_type: "refresh_token",
      }).toString(),
      signal: AbortSignal.timeout(10000),
    });
    const json = await res.json();
    if (!json.access_token) console.warn("⚠️ [Blogger] Token response error:", JSON.stringify(json));
    return json.access_token || null;
  } catch (err: any) {
    console.warn("⚠️ [Blogger] Failed to get access token:", err.message);
    return null;
  }
}

/**
 * Generate a 400-500 word unique Blogger article using centralized content generator
 * (0% duplicate content across all platforms — unique angle per platform)
 */
async function generateBloggerContent(title: string, slug: string): Promise<string> {
  const jobUrl = `${BASE_URL}/job/${slug}`;
  const defaultHtml = `<p>A new government recruitment notification has been published for <strong>${title}</strong>. Eligible candidates can check complete eligibility, vacancy breakdown, application fee, and last date at <a href="${jobUrl}" rel="nofollow ugc">Rojgar Suvidha</a>.</p><p>Visit the official portal now to read the complete notification and apply online before the last date.</p>`;

  try {
    const { generatePlatformContent } = await import("./content-generator");
    const result = await generatePlatformContent("blogger", title, slug);
    return result.body || defaultHtml;
  } catch {
    return defaultHtml;
  }
}


/**
 * Pick a random anchor text from the diversity matrix
 * 40% Brand | 35% Action CTA | 15% Naked URL | 10% Topic
 */
function pickAnchorText(slug: string): string {
  const roll = Math.random();
  if (roll < 0.40) return "Rojgar Suvidha";
  if (roll < 0.75) return "Check Full Eligibility & Apply Online";
  if (roll < 0.90) return `${BASE_URL}/job/${slug}`;
  return "View Official Notification & Selection Process";
}

/**
 * Publish a real satellite post to Blogger via the Blogger API v3
 * Returns the live Blogspot post URL or null on failure.
 */
export async function publishToBlogger(params: {
  jobId: string;
  title: string;
  slug: string;
  category?: string;
}): Promise<string | null> {
  const { BLOG_ID, GEMINI_KEY } = getBloggerCredentials();
  if (!BLOG_ID) {
    console.warn("⚠️ [Blogger Publisher] BLOGGER_BLOG_ID not set.");
    return null;
  }

  const accessToken = await getBloggerAccessToken();
  if (!accessToken) return null;

  const jobUrl = `${BASE_URL}/job/${params.slug}`;
  const teaserHtml = await generateBloggerContent(params.title, params.slug);
  const anchorText = pickAnchorText(params.slug);


  const categoryLabels: Record<string, string> = {
    "latest-jobs": "Sarkari Naukri",
    "results": "Sarkari Result",
    "admit-card": "Admit Card",
    "answer-key": "Answer Key",
    "admission": "Admission",
  };
  const catLabel = categoryLabels[params.category || "latest-jobs"] || "Government Jobs";

  const postHtml = `
<link rel="canonical" href="${jobUrl}" />
<h2>${params.title}</h2>

${teaserHtml}

<h3>Quick Details</h3>
<ul>
<li><strong>Category:</strong> ${catLabel}</li>
<li><strong>Portal:</strong> <a href="${jobUrl}" rel="canonical">${anchorText}</a></li>
<li><strong>Updated:</strong> ${new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}</li>
</ul>

<p><strong>📢 Subscribe to <a href="https://t.me/govermentform">@govermentform</a> on Telegram for instant alerts.</strong></p>

<p><em>Disclaimer: This is an informational post. For official details, always refer to the official notification at <a href="${jobUrl}">Rojgar Suvidha</a>.</em></p>
`.trim();

  const tags = ["sarkari naukri", "government jobs", "rojgar suvidha", catLabel.toLowerCase(), "apply online 2026"];

  try {
    const res = await fetch(
      `https://www.googleapis.com/blogger/v3/blogs/${BLOG_ID}/posts/`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          kind: "blogger#post",
          title: `${params.title} — Rojgar Suvidha`,
          content: postHtml,
          labels: tags,
        }),
        signal: AbortSignal.timeout(15000),
      }
    );
    const data = await res.json();

    if (res.ok && data.url) {
      console.log(`✅ [Blogger Publisher] Post published: ${data.url}`);
      return data.url;
    } else {
      console.warn("⚠️ [Blogger Publisher] API error:", JSON.stringify(data));
      return null;
    }
  } catch (err: any) {
    console.warn("⚠️ [Blogger Publisher] Exception:", err.message);
    return null;
  }
}
