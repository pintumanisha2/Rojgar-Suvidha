import { createClient } from "@supabase/supabase-js";
import { sendTelegramBacklinksExcelReport } from "./backlink-exporter";


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
  slug: string,
  category?: string
) {
  try {
    const supabase = getSupabaseClient();
    if (!supabase) return;

    console.log(`🚀 [Backlink Engine] Queuing post-approval backlinks for Job ID: ${jobId} (${slug})`);

    const liveJobUrl = `${BASE_URL}/job/${slug}`;
    const categoryUrl = `${BASE_URL}/${category || "latest-jobs"}`;
    const toolUrl = `${BASE_URL}/resume-builder`;
    const homeUrl = BASE_URL;

    // Anchor text pool — diversity matrix (White-Hat best practice):
    // 40% Brand | 25% CTA | 15% Naked URL | 10% Keyword+Brand | 10% Generic
    const anchors = [
      "Rojgar Suvidha",                                     // Brand (40%)
      "Rojgar Suvidha",
      "Rojgar Suvidha",
      "Rojgar Suvidha",
      "Check Full Eligibility & Apply Online",              // CTA (25%)
      "View Official Notification & Apply",
      "Read Complete Notification on Rojgar Suvidha",
      liveJobUrl,                                           // Naked URL (15%)
      "Sarkari Naukri Rojgar Suvidha 2026",                 // Keyword+Brand (10%)
      "Click Here for Latest Job Alerts",                   // Generic (10%)
    ];

    // Shuffle anchors for variety across runs
    const shuffledAnchors = [...anchors].sort(() => Math.random() - 0.5);
    const pickAnchor = (i: number) => shuffledAnchors[i % shuffledAnchors.length];

    // All 10 available platforms (2 tiers)
    const tier1 = ["blogger", "github"];     // Always include — highest DA
    const tier2 = ["gitlab", "wordpress", "gitbook", "devto"];  // Rotate 2 of 4
    const tier3 = ["telegraph", "notion", "livejournal", "pastebin"]; // Rotate 1 of 4

    // Rotate selection based on job hash for deterministic-but-varied rotation
    const hashSeed = jobId.charCodeAt(0) + jobId.charCodeAt(jobId.length - 1);
    const t2offset = hashSeed % tier2.length;
    const t3offset = (hashSeed + 1) % tier3.length;

    // Pick 2 from tier2 and 1 from tier3 (total = 2 + 2 + 1 = 5)
    const selectedTier2 = [
      tier2[t2offset % tier2.length],
      tier2[(t2offset + 1) % tier2.length],
    ];
    const selectedTier3 = [tier3[t3offset % tier3.length]];

    // Final 5-platform set for this job
    const selectedPlatforms = [...tier1, ...selectedTier2, ...selectedTier3];

    console.log(`📍 [Backlink Engine] Selected platforms for job ${jobId.slice(0, 8)}: ${selectedPlatforms.join(", ")}`);

    // Multi-Page Link Distribution Matrix (Job Article: 3, Category Hub: 1, Tool/Home: 1)
    const targetPageTypes = ["Job Article", "Job Article", "Job Article", "Category Pillar", "Utility Tool"];
    const targetUrls = [liveJobUrl, liveJobUrl, liveJobUrl, categoryUrl, (hashSeed % 2 === 0 ? toolUrl : homeUrl)];

    const platforms = selectedPlatforms.map((platform, i) => ({
      platform,
      anchor: pickAnchor(i),
      targetUrl: targetUrls[i],
      pageType: targetPageTypes[i],
    }));

    const insertRecords: BacklinkRecord[] = platforms.map((p) => ({
      job_id: jobId,
      platform: p.platform,
      backlink_url: p.targetUrl, // target page URL placeholder; updated with real live backlink URL when cron publishes
      anchor_text: p.anchor,
      status: "queued",         // ← QUEUED state — cron will publish & update to 'published'
    }));

    const { error } = await supabase
      .from("backlinks_log")
      .insert(insertRecords);

    if (error) {
      console.warn(`⚠️ [Backlink Engine] Insert note: ${error.message}`);
    } else {
      console.log(`✅ [Backlink Engine] Queued ${insertRecords.length} backlinks for job ID: ${jobId}. Cron will publish one every 2 hours (White-Hat drip velocity).`);
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
      // Fetch backlinks for each job with full metadata for Excel export
      const jobIds = todayJobs.map((j) => j.id);
      const jobsById: Record<string, { title: string; slug: string }> = {};
      todayJobs.forEach((j) => { jobsById[j.id] = { title: j.title, slug: j.slug }; });

      const { data: backlinksData } = await supabase
        .from("backlinks_log")
        .select("job_id, platform, backlink_url, anchor_text, status, created_at")
        .in("job_id", jobIds)
        .order("created_at", { ascending: false });

      const backlinksByJob: Record<string, any[]> = {};
      const allBacklinksToExport: Array<{
        created_at?: string;
        job_title: string;
        slug: string;
        platform: string;
        backlink_url: string;
        anchor_text: string;
        status: string;
      }> = [];

      if (backlinksData) {
        totalBacklinksCount = backlinksData.length;
        backlinksData.forEach((b) => {
          if (!backlinksByJob[b.job_id]) backlinksByJob[b.job_id] = [];
          backlinksByJob[b.job_id].push(b);

          const jobInfo = jobsById[b.job_id];
          if (jobInfo) {
            allBacklinksToExport.push({
              created_at: b.created_at,
              job_title: jobInfo.title,
              slug: jobInfo.slug,
              platform: b.platform,
              backlink_url: b.backlink_url,
              anchor_text: b.anchor_text || "Rojgar Suvidha",
              status: b.status || "Published",
            });
          }
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

      // 3. Send Telegram text message & attached Excel document
      if (BOT_TOKEN && ADMIN_CHAT_ID) {
        // Send main Markdown report text
        await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: ADMIN_CHAT_ID,
            text: messageLines.join("\n"),
            parse_mode: "Markdown",
            disable_web_page_preview: true,
          }),
        });
        console.log(`✅ Sent Daily 9 PM Executive Text Report to Telegram Admin (${ADMIN_CHAT_ID})`);

        // Send attached Daily Excel (.csv) Document
        if (allBacklinksToExport.length > 0) {
          await sendTelegramBacklinksExcelReport(
            BOT_TOKEN,
            ADMIN_CHAT_ID,
            allBacklinksToExport
          );
        }
      }
    }

    return { success: true, publishedCount, backlinksCount: totalBacklinksCount };
  } catch (err: any) {
    console.error("❌ Error generating daily report:", err);
    return { success: false, publishedCount: 0, backlinksCount: 0 };
  }
}
