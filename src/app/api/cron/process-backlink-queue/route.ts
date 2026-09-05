/**
 * ═══════════════════════════════════════════════════════════════════
 * DRIP-FEED BACKLINK QUEUE PROCESSOR — Runs every 15 minutes
 * ═══════════════════════════════════════════════════════════════════
 * - Picks ONE 'queued' backlink from Supabase backlinks_log table
 * - Publishes a REAL post to Blogger or Medium using official APIs
 * - Updates DB status to 'published' with the live URL
 * - Max 4 backlinks per hour — safe, natural drip-feed pattern
 *
 * Cron schedule: every 15 minutes
 * 15 mins x 4 = 4 backlinks per hour = 100% Google-safe rate
 */

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { publishToBlogger } from "@/lib/backlink-publishers/blogger";
import { publishToMedium } from "@/lib/backlink-publishers/medium";
import { publishToPinterest } from "@/lib/backlink-publishers/pinterest";
import { publishToTelegraph } from "@/lib/backlink-publishers/telegraph";
import { publishToWordPress } from "@/lib/backlink-publishers/wordpress";
import { publishToGithub } from "@/lib/backlink-publishers/github";
import { publishToDevto } from "@/lib/backlink-publishers/devto";
import { publishToHashnode } from "@/lib/backlink-publishers/hashnode";
import { publishToGitlab } from "@/lib/backlink-publishers/gitlab";
import { publishToTumblr } from "@/lib/backlink-publishers/tumblr";
import { publishToPastebin } from "@/lib/backlink-publishers/pastebin";
import { publishToNotion } from "@/lib/backlink-publishers/notion";
import { publishToLivejournal } from "@/lib/backlink-publishers/livejournal";
import { publishToGitbook } from "@/lib/backlink-publishers/gitbook";
import { syncBacklinkToGoogleSheet } from "@/lib/backlink-exporter";

// ─── PLATFORM TIER MAP ───────────────────────────────────────────────────────
const PLATFORM_TIER: Record<string, string> = {
  blogger: "DA-95 · Tier 1",
  wordpress: "DA-92 · Tier 1",
  github: "DA-96 · Tier 1",
  devto: "DA-85 · Tier 2",
  hashnode: "DA-82 · Tier 2",
  medium: "DA-95 · Tier 1",
  telegraph: "DA-78 · Tier 2",
  gitlab: "DA-90 · Tier 1",
  notion: "DA-90 · Tier 1",
  gitbook: "DA-79 · Tier 2",
  livejournal: "DA-89 · Tier 1",
  pastebin: "DA-65 · Tier 3",
  tumblr: "DA-98 · Tier 1",
  pinterest: "DA-92 · Tier 1",
};

/**
 * Send an instant real-time Telegram notification to the admin
 * when a backlink is published or fails. Fires and forgets.
 */
async function notifyTelegram(opts: {
  success: boolean;
  jobTitle: string;
  platform: string;
  targetUrl: string;
  publishedUrl?: string | null;
  anchorText?: string;
  queueRemaining: number;
}): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_ADMIN_CHAT_ID || "6681095051";
  if (!token) return;

  // IST = UTC+5:30
  const now = new Date();
  const istTime = new Date(now.getTime() + 5.5 * 60 * 60 * 1000);
  const hours = istTime.getUTCHours();
  const minutes = istTime.getUTCMinutes().toString().padStart(2, "0");
  const ampm = hours >= 12 ? "PM" : "AM";
  const h12 = hours % 12 || 12;
  const dateStr = istTime.toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata", day: "numeric", month: "short", year: "numeric" });
  const istLabel = `${h12}:${minutes} ${ampm} IST (${dateStr})`;

  const tierLabel = PLATFORM_TIER[opts.platform] || opts.platform.toUpperCase();
  const jobShort = opts.jobTitle.length > 60 ? opts.jobTitle.slice(0, 57) + "..." : opts.jobTitle;

  let message: string;
  if (opts.success && opts.publishedUrl) {
    message = [
      `🔗 <b>Backlink Published!</b>`,
      `━━━━━━━━━━━━━━━━━━━━━`,
      `📌 <b>Post:</b> ${jobShort}`,
      `🌐 <b>Platform:</b> ${opts.platform.toUpperCase()} (${tierLabel})`,
      `🕐 <b>Time:</b> ${istLabel}`,
      `🎯 <b>Target:</b> <a href="${opts.targetUrl}">${opts.targetUrl.replace("https://www.rojgarsuvidha.com", "") || "/"}</a>`,
      `🔗 <b>Live URL:</b> <a href="${opts.publishedUrl}">${opts.publishedUrl.slice(0, 60)}...</a>`,
      `📝 <b>Anchor:</b> ${opts.anchorText || "Rojgar Suvidha"}`,
      `⏳ <b>Queue Remaining:</b> ${opts.queueRemaining} backlinks`,
    ].join("\n");
  } else {
    message = [
      `⚠️ <b>Backlink Failed</b>`,
      `━━━━━━━━━━━━━━━━━━━━━`,
      `📌 <b>Post:</b> ${jobShort}`,
      `🌐 <b>Platform:</b> ${opts.platform.toUpperCase()} (${tierLabel})`,
      `🕐 <b>Time:</b> ${istLabel}`,
      `❌ <b>Reason:</b> Publisher returned null (credentials missing or API error)`,
      `⏭️ <b>Next run:</b> in ~15 min`,
    ].join("\n");
  }

  try {
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: "HTML",
        disable_web_page_preview: true,
      }),
      signal: AbortSignal.timeout(8000),
    });
  } catch (e: any) {
    console.warn("⚠️ [Queue Cron] Telegram notify error (non-fatal):", e.message);
  }
}

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

export async function GET(request: Request) {
  // Security: only allow Vercel Cron, Bearer secret, or query param key
  const authHeader = request.headers.get("authorization");
  const isVercelCron = request.headers.get("x-vercel-cron") === "1";
  const url = new URL(request.url);
  const keyParam = url.searchParams.get("key");

  const cronSecret = process.env.CRON_SECRET || "rojgarsuvidha_auto_blog_2026";
  if (!isVercelCron && cronSecret && authHeader !== `Bearer ${cronSecret}` && keyParam !== cronSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getSupabase();
  if (!supabase) return NextResponse.json({ ok: false, reason: "No Supabase connection" });

  try {
    // 1. Filter by platform if specified, else prioritize connected platforms
    const platformParam = url.searchParams.get("platform");
    const CONNECTED_PLATFORMS = [
      "blogger",
      "github",
      "gitlab",
      "wordpress",
      "telegraph",
      "devto",
      "pastebin",
      "notion",
      "livejournal",
      "gitbook",
    ];

    let dbQuery = supabase
      .from("backlinks_log")
      .select("id, job_id, platform, backlink_url, anchor_text")
      .eq("status", "queued");

    if (platformParam) {
      dbQuery = dbQuery.eq("platform", platformParam.toLowerCase());
    } else {
      dbQuery = dbQuery.in("platform", CONNECTED_PLATFORMS);
    }

    const { data: queuedItem, error: fetchErr } = await dbQuery
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (fetchErr) {
      console.error("⚠️ [Queue Cron] DB fetch error:", fetchErr.message);
      return NextResponse.json({ ok: false, error: fetchErr.message });
    }

    if (!queuedItem) {
      console.log("ℹ️ [Queue Cron] No queued backlinks to process right now.");
      return NextResponse.json({ ok: true, processed: 0, message: "Queue empty" });
    }

    // 2. Fetch job details for this backlink
    const { data: job } = await supabase
      .from("jobs")
      .select("id, title, slug, category, short_info, meta_description, important_dates, blog_content")
      .eq("id", queuedItem.job_id)
      .maybeSingle();

    if (!job) {
      // Job was deleted — mark backlink as failed
      await supabase.from("backlinks_log").update({ status: "failed" }).eq("id", queuedItem.id);
      return NextResponse.json({ ok: true, processed: 0, message: "Job not found" });
    }

    // Extract rich recruitment facts for high-authority, factual backlink content
    const extractFacts = (j: typeof job) => {
      let totalPosts: string | null = null;
      let lastDate: string | null = null;
      let company: string | null = null;
      let applicationFee: string | null = null;
      let qualification: string | null = null;

      // 1. From Title bracket e.g. [30 Posts], [1500 Posts], [District Wise]
      const bracketMatch = j.title?.match(/^\[([^\]]+)\]/);
      if (bracketMatch) {
        const bText = bracketMatch[1].trim();
        if (/posts|vacancy|vacancies|district/i.test(bText)) {
          totalPosts = bText;
        }
      }

      // 2. From important_dates array
      if (Array.isArray(j.important_dates)) {
        const ld = j.important_dates.find((d: any) => /last date|closing/i.test(d?.label || ""));
        if (ld?.value) lastDate = ld.value;
      }

      // 3. From blog_content table text
      if (j.blog_content) {
        const clean = j.blog_content.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ");

        const orgMatch = clean.match(/Organization\s+([A-Za-z0-9\s,\-\(\)\.\/]{3,60}?)(?:Post Name|Total Vacanc|Last Date|Application Fee|Qualification)/i);
        if (orgMatch && !company) company = orgMatch[1].trim();

        const vacMatch = clean.match(/Total Vacanc(?:y|ies)\s+([A-Za-z0-9\s,\-\(\)\.\/]{2,40}?)(?:Last Date|Application Fee|Qualification|Salary|Pay Scale)/i);
        if (vacMatch && !totalPosts) totalPosts = vacMatch[1].trim();

        const dateMatch = clean.match(/Last Date to Apply\s+([A-Za-z0-9\s,\-\(\)\.\/]{4,40}?)(?:Application Fee|Qualification|Salary|Pay Scale|Selection Process)/i);
        if (dateMatch && !lastDate) lastDate = dateMatch[1].trim();

        const feeMatch = clean.match(/Application Fee\s+([A-Za-z0-9\s,\-\(\)\.\/:\u20B9]{3,60}?)(?:Salary|Pay Scale|Selection Process|Qualification|Important|Age Limit)/i);
        if (feeMatch && !applicationFee) applicationFee = feeMatch[1].trim();

        const qualMatch = clean.match(/Qualification\s+([A-Za-z0-9\s,\-\(\)\.\/]{3,60}?)(?:Age Limit|Selection Process|Important|Last Date|How to Apply)/i);
        if (qualMatch && !qualification) qualification = qualMatch[1].trim();
      }

      // 4. Fallback search in short_info
      if (!lastDate && j.short_info) {
        const m = j.short_info.match(/last date[^\.\,;]+/i);
        if (m) lastDate = m[0].trim();
      }

      return { totalPosts, lastDate, company, applicationFee, qualification };
    };

    const facts = extractFacts(job);
    const jobPayload = {
      jobId: queuedItem.job_id,
      title: job.title,
      slug: job.slug,
      category: job.category,
      totalPosts: facts.totalPosts,
      qualification: facts.qualification,
      lastDate: facts.lastDate,
      applicationFee: facts.applicationFee,
      company: facts.company,
      shortInfo: job.short_info,
    };

    // 3. Publish to the right platform
    let publishedUrl: string | null = null;

    if (queuedItem.platform === "blogger") {
      publishedUrl = await publishToBlogger(jobPayload);
    } else if (queuedItem.platform === "telegraph") {
      publishedUrl = await publishToTelegraph(jobPayload);
    } else if (queuedItem.platform === "wordpress") {
      publishedUrl = await publishToWordPress(jobPayload);
    } else if (queuedItem.platform === "github") {
      publishedUrl = await publishToGithub(jobPayload);
    } else if (queuedItem.platform === "devto") {
      publishedUrl = await publishToDevto(jobPayload);
    } else if (queuedItem.platform === "hashnode") {
      publishedUrl = await publishToHashnode(jobPayload);
    } else if (queuedItem.platform === "gitlab") {
      publishedUrl = await publishToGitlab(jobPayload);
    } else if (queuedItem.platform === "tumblr") {
      publishedUrl = await publishToTumblr(jobPayload);
    } else if (queuedItem.platform === "pastebin") {
      publishedUrl = await publishToPastebin(jobPayload);
    } else if (queuedItem.platform === "notion") {
      publishedUrl = await publishToNotion(jobPayload);
    } else if (queuedItem.platform === "livejournal") {
      publishedUrl = await publishToLivejournal(jobPayload);
    } else if (queuedItem.platform === "gitbook") {
      publishedUrl = await publishToGitbook(jobPayload);
    } else if (queuedItem.platform === "medium") {
      publishedUrl = await publishToMedium(jobPayload);
    } else if (queuedItem.platform === "pinterest") {
      publishedUrl = await publishToPinterest(jobPayload);
    } else {
      // Platform not yet implemented (reddit, tumblr) — mark as pending for future
      await supabase
        .from("backlinks_log")
        .update({ status: "failed" })
        .eq("id", queuedItem.id);
      return NextResponse.json({ ok: true, processed: 0, message: `Platform '${queuedItem.platform}' not yet implemented` });
    }

    // 4. Update DB with result
    const now = new Date().toISOString();
    if (publishedUrl) {
      // Determine target URL for Google Sheet and target_url column
      let pageType: "Job Article" | "Category Pillar" | "State Hub" | "Utility Tool" | "Homepage" = "Job Article";
      let targetUrl = `${process.env.NEXT_PUBLIC_BASE_URL || "https://www.rojgarsuvidha.com"}/job/${job.slug}`;

      if (queuedItem.backlink_url) {
        if (queuedItem.backlink_url.includes("/resume-builder") || queuedItem.backlink_url.includes("/eligibility") || queuedItem.backlink_url.includes("/e-suvidha")) {
          pageType = "Utility Tool";
          targetUrl = queuedItem.backlink_url;
        } else if (queuedItem.backlink_url.includes("/state/")) {
          pageType = "State Hub";
          targetUrl = queuedItem.backlink_url;
        } else if (queuedItem.backlink_url.includes("/latest-jobs") || queuedItem.backlink_url.includes("/sarkari-result") || queuedItem.backlink_url.includes("/admit-card")) {
          pageType = "Category Pillar";
          targetUrl = queuedItem.backlink_url;
        } else if (queuedItem.backlink_url === process.env.NEXT_PUBLIC_BASE_URL || queuedItem.backlink_url === "https://www.rojgarsuvidha.com") {
          pageType = "Homepage";
          targetUrl = queuedItem.backlink_url;
        }
      }

      // Safe update: guarantees status and real live URL are saved
      const { error: updateErr } = await supabase
        .from("backlinks_log")
        .update({
          status: "published",
          backlink_url: publishedUrl,  // Real live platform link (e.g. Blogger, GitHub, etc.)
        })
        .eq("id", queuedItem.id);

      if (updateErr) {
        console.error("⚠️ [Queue Cron] DB update error:", updateErr.message);
      } else {
        console.log(`✅ [Queue Cron] Published ${queuedItem.platform} backlink for job '${job.title}': ${publishedUrl}`);
        // Optional columns update if migration has been executed
        try {
          await supabase
            .from("backlinks_log")
            .update({ target_url: targetUrl, published_at: now })
            .eq("id", queuedItem.id);
        } catch (_) {}
      }

      // Real-time Auto-Sync to Google Sheet (Method 1 Multi-Tab)
      syncBacklinkToGoogleSheet({
        type: "backlink",
        page_type: pageType,
        job_title: job.title,
        target_url: targetUrl,
        platform: queuedItem.platform,
        backlink_url: publishedUrl,
        anchor_text: queuedItem.anchor_text || "Rojgar Suvidha",
        status: "Published",
      }).catch((e) => console.warn("⚠️ Google Sheet background sync note:", e.message || e));

      // Count remaining queued items for the notification
      const { count: remainingCount } = await supabase
        .from("backlinks_log")
        .select("*", { count: "exact", head: true })
        .eq("status", "queued");

      // 🔔 Real-time Telegram notification — fires instantly
      notifyTelegram({
        success: true,
        jobTitle: job.title,
        platform: queuedItem.platform,
        targetUrl,
        publishedUrl,
        anchorText: queuedItem.anchor_text || "Rojgar Suvidha",
        queueRemaining: remainingCount ?? 0,
      }).catch(() => {});

      return NextResponse.json({ ok: true, processed: 1, platform: queuedItem.platform, url: publishedUrl });
    } else {
      await supabase
        .from("backlinks_log")
        .update({ status: "failed" })
        .eq("id", queuedItem.id);

      // 🔔 Failure Telegram notification
      const { count: remainingCount } = await supabase
        .from("backlinks_log")
        .select("*", { count: "exact", head: true })
        .eq("status", "queued");

      notifyTelegram({
        success: false,
        jobTitle: job.title,
        platform: queuedItem.platform,
        targetUrl: `${process.env.NEXT_PUBLIC_BASE_URL || "https://www.rojgarsuvidha.com"}/job/${job.slug}`,
        queueRemaining: remainingCount ?? 0,
      }).catch(() => {});

      return NextResponse.json({
        ok: true,
        processed: 0,
        platform: queuedItem.platform,
        message: `Publisher for '${queuedItem.platform}' returned null`,
      });
    }
  } catch (err: any) {
    console.error("❌ [Queue Cron] Exception:", err.message);
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
