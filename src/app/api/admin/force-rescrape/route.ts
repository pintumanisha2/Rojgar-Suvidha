import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { runAutoBlogScraper } from "@/lib/auto-blog-scraper";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

/**
 * POST /api/admin/force-rescrape
 * 
 * Deletes SarkariResult URLs from scraped_urls_log for the last N hours,
 * then re-runs the scraper so those posts get processed fresh.
 * 
 * Body:
 *   hours?: number (default: 15) — how many hours back to clear
 *   dryRun?: boolean (default: false)
 */
export async function POST(request: Request) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET || "rojgarsuvidha_auto_blog_2026";
  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const { hours = 15, dryRun = false } = body;

  const supabase = getSupabase();
  const since = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();

  console.log(`[Force-Rescrape] Clearing SarkariResult URLs from scraped_urls_log since ${since} (${hours}h ago)`);

  // 1. Find SarkariResult URLs logged in last N hours
  const { data: loggedUrls, error: fetchError } = await supabase
    .from("scraped_urls_log")
    .select("url, scraped_at")
    .like("url", "%sarkariresult.com%")
    .gte("scraped_at", since)
    .order("scraped_at", { ascending: false });

  if (fetchError) {
    return NextResponse.json({ error: fetchError.message }, { status: 500 });
  }

  const count = loggedUrls?.length || 0;
  console.log(`[Force-Rescrape] Found ${count} SarkariResult URLs in log from last ${hours}h`);

  if (dryRun) {
    return NextResponse.json({
      dryRun: true,
      hours,
      since,
      urlsToDelete: count,
      urls: loggedUrls?.map(u => ({ url: u.url, logged_at: u.scraped_at })) || [],
    });
  }

  if (count === 0) {
    return NextResponse.json({
      success: true,
      message: `No SarkariResult URLs found in log for last ${hours}h — scraper will pick them up naturally`,
      deleted: 0,
    });
  }

  // 2. Delete those URLs from log so scraper can re-process them
  const urlsToDelete = (loggedUrls || []).map(u => u.url);
  const { error: deleteError } = await supabase
    .from("scraped_urls_log")
    .delete()
    .in("url", urlsToDelete);

  if (deleteError) {
    console.error("[Force-Rescrape] Delete error:", deleteError.message);
    return NextResponse.json({ error: `Delete failed: ${deleteError.message}` }, { status: 500 });
  }

  console.log(`[Force-Rescrape] ✅ Deleted ${count} URLs from log. Now running scraper...`);

  // 3. Run the scraper immediately
  let scraperResult: any = null;
  try {
    scraperResult = await runAutoBlogScraper();
    console.log(`[Force-Rescrape] Scraper done: ${scraperResult.processed} processed, ${scraperResult.skipped} skipped`);
  } catch (err: any) {
    console.error("[Force-Rescrape] Scraper error:", err.message);
    return NextResponse.json({
      success: false,
      deleted: count,
      scraperError: err.message,
    }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    hours,
    since,
    deletedFromLog: count,
    scraperResult,
  });
}
