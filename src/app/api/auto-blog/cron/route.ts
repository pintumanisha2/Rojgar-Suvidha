import { NextResponse } from "next/server";
import { runAutoBlogScraper } from "@/lib/auto-blog-scraper";

export const maxDuration = 300; // 5 minutes for Vercel Pro / 60s for hobby

/**
 * GET /api/auto-blog/cron
 * Called by Vercel Cron every 30 minutes
 * Also callable manually for testing
 */
export async function GET(request: Request) {
  // Verify cron secret (prevents unauthorized calls)
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
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
