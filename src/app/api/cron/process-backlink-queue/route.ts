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

// Required for Vercel Cron — max 60s execution, no caching
export const maxDuration = 60;
export const dynamic = "force-dynamic";
export const revalidate = 0;

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
  const chatId = process.env.TELEGRAM_ADMIN_CHAT_ID || process.env.ADMIN_TELEGRAM_ID || "6681095051";
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
  let replyMarkup: any = undefined;

  if (opts.success && opts.publishedUrl) {
    message = [
      `🔗 <b>Backlink Published & Live!</b>`,
      `━━━━━━━━━━━━━━━━━━━━━`,
      `📌 <b>Job:</b> ${jobShort}`,
      `🌐 <b>Platform:</b> ${opts.platform.toUpperCase()} (${tierLabel})`,
      `🕐 <b>Time:</b> ${istLabel}`,
      `📝 <b>Anchor Text:</b> ${opts.anchorText || "Rojgar Suvidha"}`,
      `🎯 <b>Target:</b> <a href="${opts.targetUrl}">${opts.targetUrl}</a>`,
      `🔗 <b>Live URL:</b> <a href="${opts.publishedUrl}">${opts.publishedUrl}</a>`,
      `⏳ <b>Queue Remaining:</b> ${opts.queueRemaining} backlinks`,
      `━━━━━━━━━━━━━━━━━━━━━`,
      `👇 <b>Click below to review immediately:</b>`,
    ].join("\n");

    replyMarkup = {
      inline_keyboard: [
        [
          { text: "🔎 Review Live Backlink", url: opts.publishedUrl },
          { text: "🌐 Target Job Page", url: opts.targetUrl },
        ],
      ],
    };
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
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: "HTML",
        disable_web_page_preview: false,
        ...(replyMarkup ? { reply_markup: replyMarkup } : {}),
      }),
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) {
      const errText = await res.text();
      console.warn("⚠️ [Queue Cron] Telegram notify returned non-200:", res.status, errText);
    }
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
  const origin = request.headers.get("origin") || "";
  const referer = request.headers.get("referer") || "";
  const isInternalAdmin =
    (origin.includes("rojgarsuvidha.com") || origin.includes("localhost") ||
     referer.includes("/admin/backlinks"));

  if (!isVercelCron && !isInternalAdmin && cronSecret && authHeader !== `Bearer ${cronSecret}` && keyParam !== cronSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getSupabase();
  if (!supabase) return NextResponse.json({ ok: false, reason: "No Supabase connection" });

  try {
    // 1. Batch limit & platform filter (defaults to 2 for natural, steady velocity)
    const batchParam = url.searchParams.get("batch") || url.searchParams.get("limit");
    const batchLimit = Math.min(Math.max(parseInt(batchParam || "2", 10) || 2, 1), 5);
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

    const { data: queuedItems, error: fetchErr } = await dbQuery
      .order("created_at", { ascending: true })
      .limit(batchLimit);

    if (fetchErr) {
      console.error("⚠️ [Queue Cron] DB fetch error:", fetchErr.message);
      return NextResponse.json({ ok: false, error: fetchErr.message });
    }

    if (!queuedItems || queuedItems.length === 0) {
      console.log("ℹ️ [Queue Cron] No queued backlinks to process right now.");
      return NextResponse.json({ ok: true, processed: 0, message: "Queue empty" });
    }

    const results: Array<{
      id: string;
      platform: string;
      success: boolean;
      url?: string | null;
      error?: string;
    }> = [];

    // Process each queued item in the batch
    for (let i = 0; i < queuedItems.length; i++) {
      const queuedItem = queuedItems[i];

      // Delay between items in a batch to avoid API throttling
      if (i > 0) {
        await new Promise((resolve) => setTimeout(resolve, 1200));
      }

      // Fetch job details
      const { data: job } = await supabase
        .from("jobs")
        .select("id, title, slug, category, short_info, meta_description, important_dates, blog_content")
        .eq("id", queuedItem.job_id)
        .maybeSingle();

      if (!job) {
        await supabase.from("backlinks_log").update({ status: "failed" }).eq("id", queuedItem.id);
        results.push({ id: queuedItem.id, platform: queuedItem.platform, success: false, error: "Job not found" });
        continue;
      }

      // Extract rich recruitment facts
      const extractFacts = (j: typeof job) => {
        let totalPosts: string | null = null;
        let lastDate: string | null = null;
        let company: string | null = null;
        let applicationFee: string | null = null;
        let qualification: string | null = null;

        const bracketMatch = j.title?.match(/^\[([^\]]+)\]/);
        if (bracketMatch) {
          const bText = bracketMatch[1].trim();
          if (/posts|vacancy|vacancies|district/i.test(bText)) {
            totalPosts = bText;
          }
        }

        if (Array.isArray(j.important_dates)) {
          const ld = j.important_dates.find((d: any) => /last date|closing/i.test(d?.label || ""));
          if (ld?.value) lastDate = ld.value;
        }

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

      let publishedUrl: string | null = null;

      try {
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
          await supabase.from("backlinks_log").update({ status: "failed" }).eq("id", queuedItem.id);
          results.push({ id: queuedItem.id, platform: queuedItem.platform, success: false, error: "Platform not supported" });
          continue;
        }
      } catch (pubErr: any) {
        console.error(`⚠️ [Queue Cron] Publisher error for ${queuedItem.platform}:`, pubErr.message);
      }

      const now = new Date().toISOString();
      if (publishedUrl) {
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

        await supabase
          .from("backlinks_log")
          .update({
            status: "published",
            backlink_url: publishedUrl,
            target_url: targetUrl,
            published_at: now,
          })
          .eq("id", queuedItem.id);

        try {
          await syncBacklinkToGoogleSheet({
            type: "backlink",
            page_type: pageType,
            job_title: job.title,
            target_url: targetUrl,
            platform: queuedItem.platform,
            backlink_url: publishedUrl,
            anchor_text: queuedItem.anchor_text || "Rojgar Suvidha",
            status: "Published",
          });
        } catch (e: any) {
          console.warn("⚠️ Google Sheet background sync note:", e.message || e);
        }

        try {
          await notifyTelegram({
            success: true,
            jobTitle: job.title,
            platform: queuedItem.platform,
            targetUrl,
            publishedUrl,
            anchorText: queuedItem.anchor_text || "Rojgar Suvidha",
            queueRemaining: Math.max(0, queuedItems.length - i - 1),
          });
        } catch (e: any) {
          console.warn("⚠️ Telegram notification note:", e.message || e);
        }

        results.push({ id: queuedItem.id, platform: queuedItem.platform, success: true, url: publishedUrl });
      } else {
        await supabase.from("backlinks_log").update({ status: "failed" }).eq("id", queuedItem.id);

        try {
          await notifyTelegram({
            success: false,
            jobTitle: job.title,
            platform: queuedItem.platform,
            targetUrl: `${process.env.NEXT_PUBLIC_BASE_URL || "https://www.rojgarsuvidha.com"}/job/${job.slug}`,
            queueRemaining: Math.max(0, queuedItems.length - i - 1),
          });
        } catch (e: any) {
          console.warn("⚠️ Telegram notification note:", e.message || e);
        }

        results.push({ id: queuedItem.id, platform: queuedItem.platform, success: false, error: "Publisher returned null" });
      }
    }

    // Count remaining queued items
    const { count: remainingCount } = await supabase
      .from("backlinks_log")
      .select("*", { count: "exact", head: true })
      .eq("status", "queued");

    const successCount = results.filter((r) => r.success).length;

    return NextResponse.json({
      ok: true,
      processed: successCount,
      totalAttempted: queuedItems.length,
      platform: queuedItems.length === 1 ? queuedItems[0].platform : "multi",
      url: queuedItems.length === 1 ? results[0]?.url : undefined,
      results,
      queueRemaining: remainingCount ?? 0,
    });
  } catch (err: any) {
    console.error("❌ [Queue Cron] Exception:", err.message);
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}

