/**
 * Debug endpoint — tests Blogger API connection end-to-end
 * Remove this file after debugging is done
 */
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const BLOG_ID = process.env.BLOGGER_BLOG_ID;
  const CLIENT_ID = process.env.BLOGGER_CLIENT_ID;
  const CLIENT_SECRET = process.env.BLOGGER_CLIENT_SECRET;
  const REFRESH_TOKEN = process.env.BLOGGER_REFRESH_TOKEN;

  // Step 1: Check env vars
  const envCheck = {
    BLOGGER_BLOG_ID: !!BLOG_ID,
    BLOGGER_CLIENT_ID: !!CLIENT_ID,
    BLOGGER_CLIENT_SECRET: !!CLIENT_SECRET,
    REFRESH_TOKEN_present: !!REFRESH_TOKEN,
    REFRESH_TOKEN_preview: REFRESH_TOKEN?.slice(0, 12) + "...",
    REFRESH_TOKEN_length: REFRESH_TOKEN?.length,
  };

  if (!CLIENT_ID || !CLIENT_SECRET || !REFRESH_TOKEN) {
    return NextResponse.json({ step: "env_check_failed", envCheck });
  }

  // Step 2: Get access token
  let tokenData: any = null;
  try {
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        refresh_token: REFRESH_TOKEN,
        grant_type: "refresh_token",
      }).toString(),
    });
    tokenData = await tokenRes.json();
  } catch (e: any) {
    return NextResponse.json({ step: "token_fetch_error", error: e.message, envCheck });
  }

  if (!tokenData?.access_token) {
    return NextResponse.json({ step: "token_failed", tokenData, envCheck });
  }

  // Step 3: Test Blogger API with a draft post
  let bloggerData: any = null;
  try {
    const blogRes = await fetch(
      `https://www.googleapis.com/blogger/v3/blogs/${BLOG_ID}/posts/?isDraft=true`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${tokenData.access_token}`,
        },
        body: JSON.stringify({
          title: "[TEST] Debug Post — Delete Me",
          content: "<p>Test post from debug endpoint. Please delete.</p>",
        }),
      }
    );
    bloggerData = await blogRes.json();
  } catch (e: any) {
    return NextResponse.json({ step: "blogger_api_error", error: e.message, envCheck });
  }

  return NextResponse.json({
    step: "complete",
    envCheck,
    access_token_received: true,
    blogger_response: {
      status: bloggerData?.status,
      url: bloggerData?.url,
      error: bloggerData?.error,
    },
  });
}

