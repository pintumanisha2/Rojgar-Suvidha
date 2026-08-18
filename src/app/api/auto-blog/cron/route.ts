import { NextResponse } from "next/server";
import { runAutoBlogScraper } from "@/lib/auto-blog-scraper";

export const maxDuration = 300;
export const dynamic = "force-dynamic";
export const revalidate = 0;

/**
 * GET /api/auto-blog/cron
 * Called by Vercel Cron every 30 minutes
 * Also callable manually for testing
 */
export async function GET(request: Request) {
  // Verify cron secret (allows Vercel Cron, Bearer header, or ?key= parameter)
  const authHeader = request.headers.get("authorization");
  const isVercelCron = request.headers.get("x-vercel-cron") === "1";
  const url = new URL(request.url);
  const keyParam = url.searchParams.get("key");

  const cronSecret = process.env.CRON_SECRET || "rojgarsuvidha_auto_blog_2026";

  if (!isVercelCron && authHeader !== `Bearer ${cronSecret}` && keyParam !== cronSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  console.log("⏰ Auto Blog Cron triggered:", new Date().toISOString());

  try {
    const results = await runAutoBlogScraper();
    return NextResponse.json({
      success: true,
      message: `Processed ${results.processed} new posts`,
      ...results,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("Cron error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
