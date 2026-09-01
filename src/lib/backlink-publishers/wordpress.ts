/**
 * ═══════════════════════════════════════════════════════════════════
 * WORDPRESS.COM REST API — REAL AUTO-PUBLISHER
 * ═══════════════════════════════════════════════════════════════════
 * Publishes satellite blog posts to your official WordPress.com blog (DA-92)
 * Supports:
 *  1. WORDPRESS_ACCESS_TOKEN (Bearer Token)
 *  2. WORDPRESS_CLIENT_ID + WORDPRESS_CLIENT_SECRET + WORDPRESS_USERNAME + WORDPRESS_PASSWORD (Password Grant)
 *  3. WORDPRESS_USERNAME + WORDPRESS_APP_PASSWORD (Basic Auth)
 */

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://www.rojgarsuvidha.com";

function getWpCredentials() {
  return {
    SITE_URL: process.env.WORDPRESS_SITE_URL?.trim(),
    ACCESS_TOKEN: process.env.WORDPRESS_ACCESS_TOKEN?.trim(),
    CLIENT_ID: process.env.WORDPRESS_CLIENT_ID?.trim(),
    CLIENT_SECRET: process.env.WORDPRESS_CLIENT_SECRET?.trim(),
    USERNAME: process.env.WORDPRESS_USERNAME?.trim(),
    PASSWORD: (process.env.WORDPRESS_PASSWORD || process.env.WORDPRESS_APP_PASSWORD)?.trim(),
    GEMINI_KEY: (process.env.GEMINI_API_KEY_1 || process.env.GEMINI_API_KEY)?.trim(),
  };
}

let cachedAccessToken: string | null = null;

async function getWpAccessToken(): Promise<string | null> {
  const { ACCESS_TOKEN, CLIENT_ID, CLIENT_SECRET, USERNAME, PASSWORD } = getWpCredentials();

  if (ACCESS_TOKEN) return ACCESS_TOKEN;
  if (cachedAccessToken) return cachedAccessToken;

  // Try Password Grant OAuth token exchange for WordPress.com Developer Apps
  if (CLIENT_ID && CLIENT_SECRET && USERNAME && PASSWORD) {
    try {
      const res = await fetch("https://public-api.wordpress.com/oauth2/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          client_id: CLIENT_ID,
          client_secret: CLIENT_SECRET,
          grant_type: "password",
          username: USERNAME,
          password: PASSWORD,
        }).toString(),
        signal: AbortSignal.timeout(10000),
      });
      const data = await res.json();
      if (data.access_token) {
        cachedAccessToken = data.access_token;
        return cachedAccessToken;
      }
    } catch (err: any) {
      console.warn("⚠️ [WordPress] Password grant token error:", err.message);
    }
  }

  return null;
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
  const { SITE_URL, USERNAME, PASSWORD, GEMINI_KEY } = getWpCredentials();

  if (!SITE_URL) {
    console.log("ℹ️ [WordPress Publisher] WORDPRESS_SITE_URL not set — skipping.");
    return null;
  }

  const token = await getWpAccessToken();
  const cleanSite = (SITE_URL || "").trim().replace(/^https?:\/\//, "").replace(/\/+$/, "").trim();
  const contentHtml = await generateWpContent(params.title, params.slug, GEMINI_KEY);

  // Method 1: OAuth Bearer Token
  if (token) {
    try {
      const res = await fetch(
        `https://public-api.wordpress.com/rest/v1.1/sites/${cleanSite}/posts/new`,
        {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${token}`,
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
        console.log(`✅ [WordPress Publisher] Published via Bearer Token: ${data.URL}`);
        return data.URL;
      }
    } catch (err: any) {
      console.warn("⚠️ [WordPress Publisher] Bearer post error:", err.message);
    }
  }

  // Method 2: Basic Auth (Username + Application Password)
  if (USERNAME && PASSWORD) {
    const cleanPass = PASSWORD.replace(/\s+/g, "");
    const authHeader = "Basic " + Buffer.from(`${USERNAME}:${cleanPass}`).toString("base64");

    // Try WP v2 API
    try {
      const res = await fetch(`https://${cleanSite}/wp-json/wp/v2/posts`, {
        method: "POST",
        headers: {
          "Authorization": authHeader,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: `${params.title} — Recruitment 2026`,
          content: contentHtml,
          status: "publish",
        }),
        signal: AbortSignal.timeout(15000),
      });
      const data = await res.json();
      if (res.ok && data?.link) {
        console.log(`✅ [WordPress Publisher] Published via Basic Auth v2: ${data.link}`);
        return data.link;
      }
    } catch (err: any) {
      console.warn("⚠️ [WordPress Publisher] Basic Auth v2 error:", err.message);
    }

    // Try WP.com v1.1 API with Basic Auth
    try {
      const res = await fetch(`https://public-api.wordpress.com/rest/v1.1/sites/${cleanSite}/posts/new`, {
        method: "POST",
        headers: {
          "Authorization": authHeader,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: `${params.title} — Recruitment 2026`,
          content: contentHtml,
          status: "publish",
        }),
        signal: AbortSignal.timeout(15000),
      });
      const data = await res.json();
      if (res.ok && data?.URL) {
        console.log(`✅ [WordPress Publisher] Published via Basic Auth v1.1: ${data.URL}`);
        return data.URL;
      }
    } catch (err: any) {
      console.warn("⚠️ [WordPress Publisher] Basic Auth v1.1 error:", err.message);
    }

    // Method 3: XML-RPC (Always enabled on WordPress.com hosted sites)
    try {
      const xmlPayload = `<?xml version="1.0"?>
<methodCall>
  <methodName>wp.newPost</methodName>
  <params>
    <param><value><int>1</int></value></param>
    <param><value><string>${escapeXml(USERNAME)}</string></value></param>
    <param><value><string>${escapeXml(cleanPass)}</string></value></param>
    <param>
      <value>
        <struct>
          <member><name>post_title</name><value><string>${escapeXml(params.title + " — Recruitment 2026")}</string></value></member>
          <member><name>post_content</name><value><string>${escapeXml(contentHtml)}</string></value></member>
          <member><name>post_status</name><value><string>publish</string></value></member>
        </struct>
      </value>
    </param>
  </params>
</methodCall>`.trim();

      const xmlRes = await fetch(`https://${cleanSite}/xmlrpc.php`, {
        method: "POST",
        headers: { "Content-Type": "text/xml" },
        body: xmlPayload,
        signal: AbortSignal.timeout(15000),
      });
      const xmlText = await xmlRes.text();
      const postIdMatch = xmlText.match(/<string>(\d+)<\/string>/) || xmlText.match(/<integer>(\d+)<\/integer>/);
      if (xmlRes.ok && postIdMatch) {
        const liveUrl = `https://${cleanSite}/?p=${postIdMatch[1]}`;
        console.log(`✅ [WordPress Publisher] Published via XML-RPC: ${liveUrl}`);
        return liveUrl;
      } else {
        console.warn("⚠️ [WordPress Publisher] XML-RPC response:", xmlText.slice(0, 200));
      }
    } catch (xmlErr: any) {
      console.warn("⚠️ [WordPress Publisher] XML-RPC error:", xmlErr.message);
    }
  }

  console.warn("⚠️ [WordPress Publisher] Credentials check:", {
    SITE_URL: !!SITE_URL,
    USERNAME: !!USERNAME,
    PASSWORD_present: !!PASSWORD,
    token_present: !!token,
  });
  console.warn("⚠️ [WordPress Publisher] No valid authentication method succeeded.");
  return null;
}

function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
