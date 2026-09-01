import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const blogName = process.env.TUMBLR_BLOG_NAME?.trim();
  const apiKey = (process.env.TUMBLR_CONSUMER_KEY || process.env.TUMBLR_API_KEY)?.trim();
  const secret = (process.env.TUMBLR_CONSUMER_SECRET || process.env.TUMBLR_SECRET_KEY)?.trim();
  const token = (process.env.TUMBLR_OAUTH_TOKEN || process.env.TUMBLR_ACCESS_TOKEN)?.trim();

  if (!blogName || (!apiKey && !token)) {
    return NextResponse.json({
      ok: false,
      error: "Missing Tumblr ENV vars",
      env: {
        TUMBLR_BLOG_NAME_present: !!blogName,
        TUMBLR_CONSUMER_KEY_present: !!apiKey,
        TUMBLR_CONSUMER_SECRET_present: !!secret,
        TUMBLR_OAUTH_TOKEN_present: !!token,
      }
    });
  }

  const cleanBlog = blogName.replace(/\.tumblr\.com$/, "").trim();
  const blogIdentifier = `${cleanBlog}.tumblr.com`;

  // Attempt 1: OAuth header
  let res1Data: any = null;
  try {
    const res1 = await fetch(`https://api.tumblr.com/v2/blog/${blogIdentifier}/post`, {
      method: "POST",
      headers: {
        "Authorization": `OAuth consumer_key="${apiKey}"`,
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent": "RojgarSuvidhaBot/1.0",
      },
      body: new URLSearchParams({
        type: "text",
        title: "CONCOR MT Recruitment 2026 — Rojgar Suvidha",
        body: '<p>Test post with link <a href="https://www.rojgarsuvidha.com">Rojgar Suvidha</a></p>',
      }).toString(),
    });
    res1Data = { status: res1.status, json: await res1.json() };
  } catch (err: any) {
    res1Data = { error: err.message };
  }

  // Attempt 2: api_key query param
  let res2Data: any = null;
  try {
    const res2 = await fetch(`https://api.tumblr.com/v2/blog/${blogIdentifier}/post?api_key=${apiKey}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent": "RojgarSuvidhaBot/1.0",
      },
      body: new URLSearchParams({
        type: "text",
        title: "CONCOR MT Recruitment 2026 — Rojgar Suvidha",
        body: '<p>Test post with link <a href="https://www.rojgarsuvidha.com">Rojgar Suvidha</a></p>',
      }).toString(),
    });
    res2Data = { status: res2.status, json: await res2.json() };
  } catch (err: any) {
    res2Data = { error: err.message };
  }

  return NextResponse.json({
    env: {
      blogName,
      blogIdentifier,
      apiKey_present: !!apiKey,
      secret_present: !!secret,
    },
    res1Data,
    res2Data,
  });
}
