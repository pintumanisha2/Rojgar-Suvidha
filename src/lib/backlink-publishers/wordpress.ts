/**
 * ═══════════════════════════════════════════════════════════════════
 * WORDPRESS.COM REST API v1.1 — REAL AUTO-PUBLISHER
 * ═══════════════════════════════════════════════════════════════════
 * Publishes satellite blog posts to your official WordPress.com blog (DA-92)
 *
 * Required ENV vars (in Vercel):
 *   WORDPRESS_SITE_URL     — e.g. "rojgarsuvidha.wordpress.com"
 *   WORDPRESS_ACCESS_TOKEN — OAuth2 Token from developer.wordpress.com/apps
 */

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://www.rojgarsuvidha.com";

function getWpCredentials() {
  return {
    SITE_URL: process.env.WORDPRESS_SITE_URL,
    ACCESS_TOKEN: process.env.WORDPRESS_ACCESS_TOKEN,
    GEMINI_KEY: process.env.GEMINI_API_KEY_1 || process.env.GEMINI_API_KEY,
  };
}

/**
 * Generate unique article for WordPress satellite blog using Gemini AI
 */
async function generateWpContent(title: string, slug: string, geminiKey?: string): Promise<string> {
  const jobUrl = `${BASE_URL}/job/${slug}`;
  const defaultHtml = `<p>A new recruitment notification has been announced for <strong>${title}</strong>. Candidates searching for government vacancies in India can check the complete eligibility details, selection process, and application procedure.</p><p>For full details, official notification PDF, and direct apply link, visit <a href="${jobUrl}" rel="dofollow"><strong>Rojgar Suvidha — Official Notification</strong></a>.</p>`;

  if (!geminiKey) return defaultHtml;

  const prompt = `Write a 200-250 word engaging satellite blog post in English about this government job: "${title}".
Rules:
- Write UNIQUE content, not copied from official site.
- Include key sections: Notification Overview, Who Can Apply, Selection Criteria.
- Include a clear call to action link to "${jobUrl}" with anchor text "Rojgar Suvidha Official Portal".
- Format in HTML (<p>, <h3>, <ul>, <li>, <strong>, <a>).`;

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent?key=${geminiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
        signal: AbortSignal.timeout(20000),
      }
    );
    const data = await res.json();
    const html = data?.candidates?.[0]?.content?.parts?.[0]?.text || defaultHtml;
    return html.trim();
  } catch {
    return defaultHtml;
  }
}

/**
 * Publish a post to WordPress.com via REST API
 * Returns live WordPress post URL or null on failure.
 */
export async function publishToWordPress(params: {
  jobId: string;
  title: string;
  slug: string;
  category?: string;
}): Promise<string | null> {
  const { SITE_URL, ACCESS_TOKEN, GEMINI_KEY } = getWpCredentials();

  if (!SITE_URL || !ACCESS_TOKEN) {
    console.log("ℹ️ [WordPress Publisher] WORDPRESS_SITE_URL or WORDPRESS_ACCESS_TOKEN not set — skipping.");
    return null;
  }

  const jobUrl = `${BASE_URL}/job/${slugToClean(params.slug)}`;
  const contentHtml = await generateWpContent(params.title, params.slug, GEMINI_KEY);

  const cleanSite = SITE_URL.replace(/^https?:\/\//, "").replace(/\/$/, "");

  try {
    const res = await fetch(
      `https://public-api.wordpress.com/rest/v1.1/sites/${cleanSite}/posts/new`,
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${ACCESS_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: `${params.title} — Recruitment 2026`,
          content: contentHtml,
          tags: ["sarkari naukri", "government jobs", "recruitment", "rojgar suvidha"],
          categories: ["Government Jobs"],
          status: "publish",
        }),
        signal: AbortSignal.timeout(15000),
      }
    );
    const data = await res.json();

    if (res.ok && data?.URL) {
      console.log(`✅ [WordPress Publisher] Published: ${data.URL}`);
      return data.URL;
    } else {
      console.warn("⚠️ [WordPress Publisher] API error:", JSON.stringify(data));
      return null;
    }
  } catch (err: any) {
    console.warn("⚠️ [WordPress Publisher] Exception:", err.message);
    return null;
  }
}

function slugToClean(s: string) {
  return s ? s.trim() : "";
}
