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

const BLOGGER_BLOG_ID = process.env.BLOGGER_BLOG_ID;
const BLOGGER_CLIENT_ID = process.env.BLOGGER_CLIENT_ID;
const BLOGGER_CLIENT_SECRET = process.env.BLOGGER_CLIENT_SECRET;
const BLOGGER_REFRESH_TOKEN = process.env.BLOGGER_REFRESH_TOKEN;
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://www.rojgarsuvidha.com";
const GEMINI_KEY = process.env.GEMINI_API_KEY_1 || process.env.GEMINI_API_KEY;

/**
 * Get fresh Google OAuth access token using Refresh Token
 */
async function getBloggerAccessToken(): Promise<string | null> {
  if (!BLOGGER_CLIENT_ID || !BLOGGER_CLIENT_SECRET || !BLOGGER_REFRESH_TOKEN) return null;
  try {
    const res = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: BLOGGER_CLIENT_ID,
        client_secret: BLOGGER_CLIENT_SECRET,
        refresh_token: BLOGGER_REFRESH_TOKEN,
        grant_type: "refresh_token",
      }).toString(),
      signal: AbortSignal.timeout(10000),
    });
    const json = await res.json();
    return json.access_token || null;
  } catch (err: any) {
    console.warn("⚠️ [Blogger] Failed to get access token:", err.message);
    return null;
  }
}

/**
 * Generate a 200-word unique teaser using Gemini AI
 * (0% duplicate content — never copies from main blog)
 */
async function generateBloggerTeaser(title: string, slug: string): Promise<string> {
  const jobUrl = `${BASE_URL}/job/${slug}`;
  const defaultHtml = `<p>A new government recruitment notification has been published for <strong>${title}</strong>. Eligible candidates can check complete details including eligibility, vacancy breakdown, application fee, and last date at <a href="${jobUrl}" rel="canonical">Rojgar Suvidha</a>.</p><p>Visit the official portal now to read the complete notification and apply online before the last date.</p>`;

  if (!GEMINI_KEY) return defaultHtml;

  const prompt = `Write a 180-200 word unique, engaging blog teaser in English about this government job notification: "${title}".

Rules:
- DO NOT copy any text from the original notification.
- Write fresh, unique content from a different angle (e.g., why this opportunity matters for job seekers).
- End with: "For complete details, eligibility, and apply online link, visit <a href='${jobUrl}' rel='canonical'>Rojgar Suvidha</a>."
- Return only valid HTML paragraphs. No markdown, no headers.
- 0% plagiarism. Write as an experienced career advisor speaking to Indian government job aspirants.`;

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent?key=${GEMINI_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
        signal: AbortSignal.timeout(20000),
      }
    );
    const data = await res.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
    return text.trim() || defaultHtml;
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
  if (!BLOGGER_BLOG_ID || !BLOGGER_CLIENT_ID || !BLOGGER_CLIENT_SECRET || !BLOGGER_REFRESH_TOKEN) {
    console.log("ℹ️ [Blogger Publisher] Credentials not set — skipping Blogger post.");
    return null;
  }

  const accessToken = await getBloggerAccessToken();
  if (!accessToken) return null;

  const jobUrl = `${BASE_URL}/job/${params.slug}`;
  const teaserHtml = await generateBloggerTeaser(params.title, params.slug);
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
      `https://www.googleapis.com/blogger/v3/blogs/${BLOGGER_BLOG_ID}/posts/`,
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
