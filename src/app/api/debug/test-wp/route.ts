import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const SITE_URL = process.env.WORDPRESS_SITE_URL;
  const USERNAME = process.env.WORDPRESS_USERNAME;
  const PASSWORD = process.env.WORDPRESS_PASSWORD || process.env.WORDPRESS_APP_PASSWORD;
  const ACCESS_TOKEN = process.env.WORDPRESS_ACCESS_TOKEN;

  const envInfo = {
    WORDPRESS_SITE_URL: SITE_URL || "(missing)",
    WORDPRESS_USERNAME: USERNAME || "(missing)",
    PASSWORD_present: !!PASSWORD,
    PASSWORD_length: PASSWORD ? PASSWORD.length : 0,
    ACCESS_TOKEN_present: !!ACCESS_TOKEN,
  };

  if (!SITE_URL) {
    return NextResponse.json({ ok: false, error: "WORDPRESS_SITE_URL is missing in Vercel env", envInfo });
  }

  const cleanSite = SITE_URL.replace(/^https?:\/\//, "").replace(/\/$/, "");
  const logs: string[] = [];

  // Method 1: Basic Auth with Username + Application Password (REST API v2)
  if (USERNAME && PASSWORD) {
    try {
      // Clean spaces from application password if any
      const cleanPass = PASSWORD.replace(/\s+/g, "");
      const authHeader = "Basic " + Buffer.from(`${USERNAME}:${cleanPass}`).toString("base64");
      
      logs.push(`Trying WP REST API v2 on https://${cleanSite}/wp-json/wp/v2/posts ...`);
      
      const res = await fetch(`https://${cleanSite}/wp-json/wp/v2/posts`, {
        method: "POST",
        headers: {
          "Authorization": authHeader,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: `[TEST] Rojgar Suvidha Backlink Test — ${new Date().toISOString()}`,
          content: "<p>Test backlink post from Rojgar Suvidha. <a href='https://www.rojgarsuvidha.com'>Rojgar Suvidha</a></p>",
          status: "publish",
        }),
      });
      const data = await res.json();
      logs.push(`WP v2 Response Status: ${res.status}`);
      
      if (res.ok && data?.link) {
        return NextResponse.json({ ok: true, method: "Basic Auth (v2)", postUrl: data.link, logs, envInfo });
      } else {
        logs.push(`WP v2 Error Data: ${JSON.stringify(data)}`);
      }
    } catch (e: any) {
      logs.push(`WP v2 Exception: ${e.message}`);
    }

    // Method 1b: Try WP.com Public API v1.1 with Basic Auth
    try {
      const cleanPass = PASSWORD.replace(/\s+/g, "");
      const authHeader = "Basic " + Buffer.from(`${USERNAME}:${cleanPass}`).toString("base64");
      
      logs.push(`Trying WP.com Public API v1.1 on https://public-api.wordpress.com/rest/v1.1/sites/${cleanSite}/posts/new ...`);
      
      const res = await fetch(`https://public-api.wordpress.com/rest/v1.1/sites/${cleanSite}/posts/new`, {
        method: "POST",
        headers: {
          "Authorization": authHeader,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: `[TEST] Rojgar Suvidha Backlink Test — ${new Date().toISOString()}`,
          content: "<p>Test backlink post from Rojgar Suvidha. <a href='https://www.rojgarsuvidha.com'>Rojgar Suvidha</a></p>",
          status: "publish",
        }),
      });
      const data = await res.json();
      logs.push(`WP v1.1 Response Status: ${res.status}`);
      
      if (res.ok && data?.URL) {
        return NextResponse.json({ ok: true, method: "Basic Auth (v1.1)", postUrl: data.URL, logs, envInfo });
      } else {
        logs.push(`WP v1.1 Error Data: ${JSON.stringify(data)}`);
      }
    } catch (e: any) {
      logs.push(`WP v1.1 Exception: ${e.message}`);
    }
  }

  return NextResponse.json({ ok: false, message: "All attempts failed", logs, envInfo });
}
