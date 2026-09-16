import { NextResponse } from "next/server";
import { forceProcessSpecificItem } from "@/lib/auto-blog-scraper";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * POST /api/admin/process-sr-url
 *
 * Called by GitHub Actions sr_rss_fetcher.py script.
 * Processes a specific SarkariResult post URL.
 */
export async function POST(request: Request) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET || "rojgarsuvidha_auto_blog_2026";
  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const { url, title, source = "sarkariresult", rawHtml } = body;

  if (!url || !title) {
    return NextResponse.json({ error: "url and title are required" }, { status: 400 });
  }

  if (!url.includes("sarkariresult.com")) {
    return NextResponse.json({ error: "Only sarkariresult.com URLs allowed" }, { status: 400 });
  }

  console.log(`[process-sr-url] Processing: "${title.slice(0, 60)}" → ${url} (has rawHtml: ${Boolean(rawHtml)})`);

  try {
    const result = await forceProcessSpecificItem({
      title,
      link: url,
      source,
      rawHtml,
    });

    if (result.success) {
      console.log(`[process-sr-url] ✅ Success: draftId=${result.draftId}`);
      return NextResponse.json({ success: true, draftId: result.draftId, title: result.title, category: result.category });
    } else {
      console.warn(`[process-sr-url] ⚠️ Failed: ${result.error}`);
      return NextResponse.json({ success: false, error: result.error, title });
    }
  } catch (err: any) {
    console.error(`[process-sr-url] ❌ Error:`, err.message);
    return NextResponse.json(
      { success: false, error: err.message, title },
      { status: 500 }
    );
  }
}

