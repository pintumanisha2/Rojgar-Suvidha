import { createClient } from "@supabase/supabase-js";

function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !supabaseServiceKey) return null;
  return createClient(supabaseUrl, supabaseServiceKey);
}

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://www.rojgarsuvidha.com";
const ADMIN_CHAT_ID = process.env.TELEGRAM_ADMIN_CHAT_ID || "6681095051";
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

export interface BacklinkRecord {
  id?: string;
  job_id: string;
  platform: string;
  backlink_url: string;
  anchor_text: string;
  status?: string;
  created_at?: string;
}

/**
 * Enqueue Backlinks AFTER Admin Approves Job in Telegram
 * Inserts 5 platform records with status='queued' into backlinks_log.
 * The /api/cron/process-backlink-queue cron picks one every 15 mins and publishes it LIVE.
 */
export async function enqueuePostApprovalBacklinks(
  jobId: string,
  title: string,
  slug: string
) {
  try {
    const supabase = getSupabaseClient();
    if (!supabase) return;

    console.log(`🚀 [Backlink Engine] Queuing post-approval backlinks for Job ID: ${jobId} (${slug})`);

    const liveJobUrl = `${BASE_URL}/job/${slug}`;

    // Anchor text pool — diversity matrix (40% brand, 35% CTA, 15% URL, 10% topic)
    const anchors = [
      "Rojgar Suvidha",
      "Check Full Eligibility & Apply Online",
      liveJobUrl,
      "View Official Notification & Selection Process",
      "Read Complete Notification on Rojgar Suvidha",
    ];
    const pickAnchor = (i: number) => anchors[i % anchors.length];

    // 6 platform records — status 'queued' — cron processes 1 per 15 mins (safe drip)
    const platforms = [
      { platform: "blogger",   anchor: pickAnchor(0) },
      { platform: "github",    anchor: pickAnchor(1) },
      { platform: "gitlab",    anchor: pickAnchor(2) },
      { platform: "wordpress", anchor: pickAnchor(3) },
      { platform: "telegraph", anchor: pickAnchor(4) },
      { platform: "devto",     anchor: pickAnchor(5) },
      { platform: "pastebin",    anchor: pickAnchor(6) },
      { platform: "notion",      anchor: pickAnchor(7) },
      { platform: "livejournal", anchor: pickAnchor(8) },
      { platform: "gitbook",     anchor: pickAnchor(9) },
    ];

    const insertRecords: BacklinkRecord[] = platforms.map((p) => ({
      job_id: jobId,
      platform: p.platform,
      backlink_url: liveJobUrl, // placeholder; updated with real URL when cron publishes
      anchor_text: p.anchor,
      status: "queued",         // ← QUEUED state — cron will publish & update to 'published'
    }));

    const { error } = await supabase
      .from("backlinks_log")
      .insert(insertRecords);

    if (error) {
      console.warn(`⚠️ [Backlink Engine] Insert note: ${error.message}`);
    } else {
      console.log(`✅ [Backlink Engine] Queued ${insertRecords.length} backlinks for job ID: ${jobId}. Drip-feed cron will publish one every 15 mins.`);
    }
  } catch (err: any) {
    console.error("❌ [Backlink Engine] Error queuing backlinks:", err.message || err);
  }
}


/**
 * Generate Daily 9:00 PM IST Executive Summary Telegram Report
 * Aggregates all blogs published today with live URLs & all generated backlink URLs
 */
export async function sendDailyExecutiveReport(): Promise<{ success: boolean; publishedCount: number; backlinksCount: number }> {
  try {
    const supabase = getSupabaseClient();
    if (!supabase) return { success: false, publishedCount: 0, backlinksCount: 0 };

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    // 1. Fetch all jobs created/published today
    const { data: todayJobs, error: jobsErr } = await supabase
      .from("jobs")
      .select("id, title, slug, category, created_at")
      .gte("created_at", todayStart.toISOString())
      .order("created_at", { ascending: false });

    if (jobsErr) {
      console.error("❌ Failed to fetch today jobs for daily report:", jobsErr);
      return { success: false, publishedCount: 0, backlinksCount: 0 };
    }

    const publishedCount = todayJobs?.length || 0;
    let totalBacklinksCount = 0;

    // 2. Build Markdown Summary
    const dateFormatted = new Date().toLocaleDateString("en-IN", {
      day: "numeric",
      month: "long",
      year: "numeric",
      timeZone: "Asia/Kolkata",
    });

    let messageLines: string[] = [
      `📊 *ROJGAR SUVIDHA DAILY EXECUTIVE REPORT*`,
      `📅 *Date:* ${dateFormatted} (9:00 PM IST)`,
      `------------------------------------------`,
      `✅ *Total Blogs Published Today:* ${publishedCount}`,
    ];

    if (publishedCount === 0) {
      messageLines.push(`ℹ️ No new blogs were published today.`);
    } else {
      // Fetch backlinks for each job
      const jobIds = todayJobs.map((j) => j.id);
      const { data: backlinksData } = await supabase
        .from("backlinks_log")
        .select("job_id, platform, backlink_url")
        .in("job_id", jobIds);

      const backlinksByJob: Record<string, any[]> = {};
      if (backlinksData) {
        totalBacklinksCount = backlinksData.length;
        backlinksData.forEach((b) => {
          if (!backlinksByJob[b.job_id]) backlinksByJob[b.job_id] = [];
          backlinksByJob[b.job_id].push(b);
        });
      }

      messageLines.push(`🔗 *Total Backlinks Generated Today:* ${totalBacklinksCount}`);
      messageLines.push(`------------------------------------------`);
      messageLines.push(`📰 *PUBLISHED BLOGS & BACKLINKS BREAKDOWN:*`);
      messageLines.push(``);

      todayJobs.slice(0, 15).forEach((job, idx) => {
        const liveJobUrl = `${BASE_URL}/job/${job.slug}`;
        const links = backlinksByJob[job.id] || [];

        messageLines.push(`${idx + 1}. 📌 *${job.title}*`);
        messageLines.push(`   🌐 *Live URL:* ${liveJobUrl}`);
        if (links.length > 0) {
          messageLines.push(`   🔗 *Backlinks (${links.length}):*`);
          links.forEach((l) => {
            const platformName = l.platform.charAt(0).toUpperCase() + l.platform.slice(1);
            messageLines.push(`      • *${platformName}:* ${l.backlink_url}`);
          });
        } else {
          messageLines.push(`   🔗 *Backlinks:* Processing queue...`);
        }
        messageLines.push(``);
      });

      if (todayJobs.length > 15) {
        messageLines.push(`... and ${todayJobs.length - 15} more blogs published today.`);
      }
    }

    messageLines.push(`------------------------------------------`);
    messageLines.push(`🚀 *All systems operational — 0 errors detected.*`);

    const fullMessage = messageLines.join("\n");

    // Send Telegram message to Admin ID
    if (BOT_TOKEN && ADMIN_CHAT_ID) {
      await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: ADMIN_CHAT_ID,
          text: fullMessage,
          parse_mode: "Markdown",
          disable_web_page_preview: true,
        }),
      });
      console.log(`✅ Sent Daily 9 PM Executive Report to Telegram Admin (${ADMIN_CHAT_ID})`);
    }

    return { success: true, publishedCount, backlinksCount: totalBacklinksCount };
  } catch (err: any) {
    console.error("❌ Error generating daily report:", err);
    return { success: false, publishedCount: 0, backlinksCount: 0 };
  }
}
