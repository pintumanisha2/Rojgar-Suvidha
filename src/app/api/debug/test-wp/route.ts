import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const SITE_URL = process.env.WORDPRESS_SITE_URL || "";
  const USERNAME = process.env.WORDPRESS_USERNAME || "";
  const PASSWORD = process.env.WORDPRESS_PASSWORD || process.env.WORDPRESS_APP_PASSWORD || "";

  const cleanSite = SITE_URL.replace(/^https?:\/\//, "").replace(/\/$/, "");
  const cleanPass = PASSWORD.replace(/\s+/g, "");
  const authHeader = "Basic " + Buffer.from(`${USERNAME}:${cleanPass}`).toString("base64");

  const results: any = {
    cleanSite,
    username: USERNAME,
    passLength: cleanPass.length,
    attempts: {}
  };

  // Attempt 1: WP.com REST API v1.1
  try {
    const res = await fetch(`https://public-api.wordpress.com/rest/v1.1/sites/${cleanSite}/posts/new`, {
      method: "POST",
      headers: {
        "Authorization": authHeader,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title: "[TEST] WP.com REST API v1.1 Post",
        content: "<p>Test backlink from <a href='https://www.rojgarsuvidha.com'>Rojgar Suvidha</a></p>",
        status: "publish",
      }),
    });
    const text = await res.text();
    results.attempts.v1_1 = { status: res.status, body: text.slice(0, 300) };
  } catch (e: any) {
    results.attempts.v1_1 = { error: e.message };
  }

  // Attempt 2: WP v2 API
  try {
    const res = await fetch(`https://${cleanSite}/wp-json/wp/v2/posts`, {
      method: "POST",
      headers: {
        "Authorization": authHeader,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title: "[TEST] WP v2 API Post",
        content: "<p>Test backlink from <a href='https://www.rojgarsuvidha.com'>Rojgar Suvidha</a></p>",
        status: "publish",
      }),
    });
    const text = await res.text();
    results.attempts.v2 = { status: res.status, body: text.slice(0, 300) };
  } catch (e: any) {
    results.attempts.v2 = { error: e.message };
  }

  // Attempt 3: XML-RPC
  try {
    const xmlPayload = `<?xml version="1.0"?>
<methodCall>
  <methodName>wp.newPost</methodName>
  <params>
    <param><value><int>1</int></value></param>
    <param><value><string>${USERNAME}</string></value></param>
    <param><value><string>${cleanPass}</string></value></param>
    <param>
      <value>
        <struct>
          <member><name>post_title</name><value><string>[TEST] XML-RPC Post</string></value></member>
          <member><name>post_content</name><value><string>&lt;p&gt;Test backlink from &lt;a href='https://www.rojgarsuvidha.com'&gt;Rojgar Suvidha&lt;/a&gt;&lt;/p&gt;</string></value></member>
          <member><name>post_status</name><value><string>publish</string></value></member>
        </struct>
      </value>
    </param>
  </params>
</methodCall>`.trim();

    const res = await fetch(`https://${cleanSite}/xmlrpc.php`, {
      method: "POST",
      headers: { "Content-Type": "text/xml" },
      body: xmlPayload,
    });
    const text = await res.text();
    results.attempts.xmlrpc = { status: res.status, body: text.slice(0, 300) };
  } catch (e: any) {
    results.attempts.xmlrpc = { error: e.message };
  }

  return NextResponse.json(results);
}
