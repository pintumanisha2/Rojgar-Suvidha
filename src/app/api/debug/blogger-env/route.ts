/**
 * Debug endpoint — checks which Blogger env vars are loaded
 * Remove this file after debugging is done
 */
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const vars = {
    BLOGGER_BLOG_ID: !!process.env.BLOGGER_BLOG_ID,
    BLOGGER_CLIENT_ID: !!process.env.BLOGGER_CLIENT_ID,
    BLOGGER_CLIENT_SECRET: !!process.env.BLOGGER_CLIENT_SECRET,
    BLOGGER_REFRESH_TOKEN: !!process.env.BLOGGER_REFRESH_TOKEN,
    BLOGGER_REFRESH_TOKEN_preview: process.env.BLOGGER_REFRESH_TOKEN?.slice(0, 8) + "...",
    GEMINI_API_KEY: !!process.env.GEMINI_API_KEY,
    SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
  };
  return NextResponse.json({ ok: true, envVarsPresent: vars });
}
