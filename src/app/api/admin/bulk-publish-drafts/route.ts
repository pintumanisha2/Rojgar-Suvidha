import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { broadcastJobAlert } from "@/lib/social-publisher";
import { notifySearchEngines } from "@/lib/instant-indexing";
import { revalidatePath } from "next/cache";

export const dynamic = "force-dynamic";
export const maxDuration = 300; // 5 min — enough for bulk publish

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://www.rojgarsuvidha.com";

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

/**
 * POST /api/admin/bulk-publish-drafts
 * Bulk publish all pending_review drafts from a date range.
 * 
 * Body params:
 *   since?: ISO string (default: today midnight IST)
 *   limit?: number (default: 100)
 *   source?: "sarkariresult" | "freejobalert" | "all" (default: "all")
 *   dryRun?: boolean (default: false) — just count, don't publish
 */
export async function POST(request: Request) {
  // Auth
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET || "rojgarsuvidha_auto_blog_2026";
  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const {
    since,
    limit = 100,
    source = "all",
    dryRun = false,
    postStatus = "active",
  } = body;

  // Default: aaj ka midnight IST (UTC+5:30)
  const todayMidnightIST = since || (() => {
    const now = new Date();
    const istOffset = 5.5 * 60 * 60 * 1000;
    const istNow = new Date(now.getTime() + istOffset);
    istNow.setUTCHours(0, 0, 0, 0);
    return new Date(istNow.getTime() - istOffset).toISOString();
  })();

  const supabase = getSupabase();

  // 1. Fetch pending drafts
  let query = supabase
    .from("auto_blog_drafts")
    .select("id, generated_title, source_site, category, created_at")
    .eq("status", "pending_review")
    .gte("created_at", todayMidnightIST)
    .order("created_at", { ascending: true })
    .limit(limit);

  if (source !== "all") {
    query = query.eq("source_site", source);
  }

  const { data: drafts, error: fetchError } = await query;

  if (fetchError) {
    return NextResponse.json({ error: fetchError.message }, { status: 500 });
  }

  const total = drafts?.length || 0;
  console.log(`[Bulk-Publish] Found ${total} pending drafts since ${todayMidnightIST} (source: ${source})`);

  if (dryRun || total === 0) {
    return NextResponse.json({
      dryRun,
      total,
      since: todayMidnightIST,
      source,
      drafts: drafts?.map(d => ({ id: d.id, title: d.generated_title, source: d.source_site, category: d.category, created_at: d.created_at })) || [],
    });
  }

  // 2. Publish each draft
  const published: string[] = [];
  const failed: { id: string; title: string; error: string }[] = [];

  for (const draft of (drafts || [])) {
    try {
      const res = await fetch(`${BASE_URL}/api/auto-blog/publish/${draft.id}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${cronSecret}`,
        },
        body: JSON.stringify({ postStatus }),
        signal: AbortSignal.timeout(45000),
      });

      if (res.ok) {
        const result = await res.json();
        console.log(`✅ [Bulk-Publish] Published: "${draft.generated_title}" → /job/${result.slug}`);
        published.push(draft.generated_title || draft.id);
      } else {
        const errText = await res.text().catch(() => "");
        console.warn(`❌ [Bulk-Publish] Failed: ${draft.id} — HTTP ${res.status}: ${errText.slice(0, 100)}`);
        failed.push({ id: draft.id, title: draft.generated_title || "", error: `HTTP ${res.status}` });
      }

      // Small delay to avoid overwhelming the publish endpoint
      await new Promise(r => setTimeout(r, 500));

    } catch (err: any) {
      console.error(`❌ [Bulk-Publish] Exception for ${draft.id}:`, err.message);
      failed.push({ id: draft.id, title: draft.generated_title || "", error: err.message });
    }
  }

  // 3. Notify admin on Telegram
  await notifyBulkPublishSummary(published, failed, source);

  return NextResponse.json({
    success: true,
    total,
    published: published.length,
    failed: failed.length,
    publishedTitles: published,
    failedItems: failed,
    since: todayMidnightIST,
    source,
  });
}

async function notifyBulkPublishSummary(published: string[], failed: { id: string; title: string; error: string }[], source: string) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const adminChatId = process.env.ADMIN_TELEGRAM_ID || process.env.TELEGRAM_ADMIN_CHAT_ID || "6681095051";
  if (!botToken || (published.length === 0 && failed.length === 0)) return;

  const nowIST = new Date(Date.now() + 5.5 * 60 * 60 * 1000);
  const timeStr = nowIST.toUTCString().split(" ").slice(4, 5).join(" ");

  let text = `🚀 <b>BULK PUBLISH COMPLETE</b>\n`;
  text += `📦 Source: <code>${source}</code> | ⏰ ${timeStr} IST\n`;
  text += `━━━━━━━━━━━━━━━━━━━━━\n`;
  text += `✅ Published: <b>${published.length}</b>\n`;
  text += `❌ Failed: <b>${failed.length}</b>\n`;

  if (published.length > 0 && published.length <= 10) {
    text += `\n<b>Published:</b>\n`;
    published.slice(0, 10).forEach(t => { text += `• ${t.slice(0, 60)}\n`; });
  }
  if (failed.length > 0) {
    text += `\n<b>Failed (check manually):</b>\n`;
    failed.slice(0, 5).forEach(f => { text += `• [${f.id.slice(0, 8)}] ${f.title.slice(0, 40)} — ${f.error}\n`; });
  }

  try {
    await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: adminChatId, text, parse_mode: "HTML" }),
      signal: AbortSignal.timeout(10000),
    });
  } catch (e: any) {
    console.warn("[Bulk-Publish] Telegram notify failed:", e.message);
  }
}
