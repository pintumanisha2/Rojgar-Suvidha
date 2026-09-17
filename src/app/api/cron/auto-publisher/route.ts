import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://www.rojgarsuvidha.com";

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

/**
 * GET /api/cron/auto-publisher
 * Runs every 15 minutes (via Vercel Cron + GitHub Actions)
 *
 * Rule:
 *  - ONLY publishes drafts where source_site = 'sarkariresult' AND auto_publish_at <= NOW()
 *  - FreeJobAlert / google_trends / ndtv → NEVER auto-published (auto_publish_at = NULL)
 *  - If Admin cancelled (auto_publish_at = NULL after creation) → skipped automatically
 *
 * Flow:
 *  1. Query mature SarkariResult drafts
 *  2. POST /api/auto-blog/publish/[id] for each
 *  3. Notify Admin on Telegram what was auto-published
 */
export async function GET(request: Request) {
  // Auth check — same as other cron routes
  const authHeader = request.headers.get("authorization");
  const isVercelCron = request.headers.get("x-vercel-cron") === "1";
  const url = new URL(request.url);
  const keyParam = url.searchParams.get("key");
  const cronSecret = process.env.CRON_SECRET || "rojgarsuvidha_auto_blog_2026";

  if (!isVercelCron && authHeader !== `Bearer ${cronSecret}` && keyParam !== cronSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getSupabaseAdmin();
  const now = new Date().toISOString();

  console.log(`\n⏰ [Auto-Publisher Cron] Started at ${now}`);

  // 1. Find all mature drafts (window passed, not yet published)
  const { data: matureDrafts, error: fetchError } = await supabase
    .from("auto_blog_drafts")
    .select("id, generated_title, category, source_site, auto_publish_at")
    .eq("status", "pending_review")
    .not("auto_publish_at", "is", null)  // ← Must have timer set
    .lte("auto_publish_at", now)          // ← Timer must have expired
    .order("auto_publish_at", { ascending: true })
    .limit(10); // Process up to 10 per run

  if (fetchError) {
    console.error("[Auto-Publisher] Supabase query error:", fetchError.message);
    return NextResponse.json({ error: fetchError.message }, { status: 500 });
  }

  if (!matureDrafts || matureDrafts.length === 0) {
    console.log("[Auto-Publisher] No mature SarkariResult drafts to publish. Exiting quietly.");
    return NextResponse.json({ success: true, published: 0, message: "No drafts ready" });
  }

  console.log(`[Auto-Publisher] Found ${matureDrafts.length} mature SarkariResult draft(s) to auto-publish.`);

  const publishedTitles: string[] = [];
  const failedIds: string[] = [];

  // 2. Publish each mature draft
  for (const draft of matureDrafts) {
    try {
      console.log(`\n📤 [Auto-Publisher] Publishing draft: "${draft.generated_title}" (ID: ${draft.id})`);

      const publishRes = await fetch(`${BASE_URL}/api/auto-blog/publish/${draft.id}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // Internal call — use service auth header
          "Authorization": `Bearer ${cronSecret}`,
        },
        body: JSON.stringify({ postStatus: "active" }),
        signal: AbortSignal.timeout(45000), // 45s max per publish
      });

      if (publishRes.ok) {
        const result = await publishRes.json();
        console.log(`✅ [Auto-Publisher] Published: "${draft.generated_title}" → /job/${result.slug}`);
        publishedTitles.push(draft.generated_title || draft.id);
      } else {
        const errBody = await publishRes.text().catch(() => "");
        console.error(`❌ [Auto-Publisher] Publish failed for ${draft.id}: HTTP ${publishRes.status} — ${errBody.slice(0, 200)}`);
        failedIds.push(draft.id);

        // Mark as error so it doesn't retry forever
        await supabase
          .from("auto_blog_drafts")
          .update({ status: "error", error_message: `Auto-publisher HTTP ${publishRes.status}` })
          .eq("id", draft.id);
      }
    } catch (err: any) {
      console.error(`❌ [Auto-Publisher] Exception for ${draft.id}:`, err.message);
      failedIds.push(draft.id);
    }
  }

  // 3. Send Admin Telegram summary of what was auto-published
  await notifyAdminAutoPublishSummary(publishedTitles, failedIds);

  return NextResponse.json({
    success: true,
    published: publishedTitles.length,
    failed: failedIds.length,
    publishedTitles,
    failedIds,
    timestamp: now,
  });
}

/**
 * Send a Telegram summary to Admin about what was auto-published.
 * Only sends if something was actually published or failed.
 */
async function notifyAdminAutoPublishSummary(published: string[], failed: string[]) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const adminChatId = process.env.ADMIN_TELEGRAM_ID || process.env.TELEGRAM_ADMIN_CHAT_ID || "6681095051";

  if (!botToken || (published.length === 0 && failed.length === 0)) return;

  const nowIST = new Date(Date.now() + 5.5 * 60 * 60 * 1000);
  const hh = nowIST.getUTCHours();
  const mm = nowIST.getUTCMinutes().toString().padStart(2, "0");
  const ampm = hh >= 12 ? "PM" : "AM";
  const h12 = hh % 12 || 12;
  const istLabel = `${h12}:${mm} ${ampm} IST`;

  let text = `🤖 <b>SARKARI RESULT AUTO-PUBLISHER (${istLabel})</b>\n━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;

  if (published.length > 0) {
    text += `\n✅ <b>Auto-Published (${published.length}):</b>\n`;
    published.forEach((title) => {
      text += `   • "${title.slice(0, 70)}"\n`;
    });
    text += `\n<i>👆 Live hai channel pe — check karo!</i>\n`;
  }

  if (failed.length > 0) {
    text += `\n❌ <b>Failed (${failed.length}):</b>\n`;
    failed.forEach((id) => {
      text += `   • Draft ID: ${id}\n`;
    });
    text += `\n<i>Admin panel se manually publish karo.</i>\n`;
  }

  try {
    await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: adminChatId,
        text,
        parse_mode: "HTML",
      }),
      signal: AbortSignal.timeout(10000),
    });
  } catch (e: any) {
    console.warn("[Auto-Publisher] Failed to send Telegram summary:", e.message);
  }
}
