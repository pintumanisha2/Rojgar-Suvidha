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

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

export async function GET(request: Request) {
  // Security: only allow Vercel Cron (or internal calls with secret)
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getSupabase();
  if (!supabase) return NextResponse.json({ ok: false, reason: "No Supabase connection" });

  try {
    // 1. Pick ONE queued backlink (oldest first)
    const { data: queuedItem, error: fetchErr } = await supabase
      .from("backlinks_log")
      .select("id, job_id, platform, backlink_url, anchor_text")
      .eq("status", "queued")
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
      .select("title, slug, category")
      .eq("id", queuedItem.job_id)
      .maybeSingle();

    if (!job) {
      // Job was deleted — mark backlink as failed
      await supabase.from("backlinks_log").update({ status: "failed" }).eq("id", queuedItem.id);
      return NextResponse.json({ ok: true, processed: 0, message: "Job not found" });
    }

    // 3. Publish to the right platform
    let publishedUrl: string | null = null;

    if (queuedItem.platform === "blogger") {
      publishedUrl = await publishToBlogger({
        jobId: queuedItem.job_id,
        title: job.title,
        slug: job.slug,
        category: job.category,
      });
    } else if (queuedItem.platform === "telegraph") {
      publishedUrl = await publishToTelegraph({
        jobId: queuedItem.job_id,
        title: job.title,
        slug: job.slug,
        category: job.category,
      });
    } else if (queuedItem.platform === "wordpress") {
      publishedUrl = await publishToWordPress({
        jobId: queuedItem.job_id,
        title: job.title,
        slug: job.slug,
        category: job.category,
      });
    } else if (queuedItem.platform === "github") {
      publishedUrl = await publishToGithub({
        jobId: queuedItem.job_id,
        title: job.title,
        slug: job.slug,
        category: job.category,
      });
    } else if (queuedItem.platform === "devto") {
      publishedUrl = await publishToDevto({
        jobId: queuedItem.job_id,
        title: job.title,
        slug: job.slug,
        category: job.category,
      });
    } else if (queuedItem.platform === "hashnode") {
      publishedUrl = await publishToHashnode({
        jobId: queuedItem.job_id,
        title: job.title,
        slug: job.slug,
        category: job.category,
      });
    } else if (queuedItem.platform === "gitlab") {
      publishedUrl = await publishToGitlab({
        jobId: queuedItem.job_id,
        title: job.title,
        slug: job.slug,
        category: job.category,
      });
    } else if (queuedItem.platform === "tumblr") {
      publishedUrl = await publishToTumblr({
        jobId: queuedItem.job_id,
        title: job.title,
        slug: job.slug,
        category: job.category,
      });
    } else if (queuedItem.platform === "medium") {
      publishedUrl = await publishToMedium({
        jobId: queuedItem.job_id,
        title: job.title,
        slug: job.slug,
        category: job.category,
      });
    } else if (queuedItem.platform === "pinterest") {
      publishedUrl = await publishToPinterest({
        jobId: queuedItem.job_id,
        title: job.title,
        slug: job.slug,
        category: job.category,
      });
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
      await supabase
        .from("backlinks_log")
        .update({
          status: "published",
          backlink_url: publishedUrl,  // Update with real live URL
          published_at: now,
        })
        .eq("id", queuedItem.id);

      console.log(`✅ [Queue Cron] Published ${queuedItem.platform} backlink for job '${job.title}': ${publishedUrl}`);
      return NextResponse.json({ ok: true, processed: 1, platform: queuedItem.platform, url: publishedUrl });
    } else {
      await supabase
        .from("backlinks_log")
        .update({ status: "failed" })
        .eq("id", queuedItem.id);

      const siteUrl = process.env.WORDPRESS_SITE_URL;
      const username = process.env.WORDPRESS_USERNAME;
      const appPass = process.env.WORDPRESS_APP_PASSWORD || process.env.WORDPRESS_PASSWORD;
      const token = process.env.WORDPRESS_ACCESS_TOKEN;
      return NextResponse.json({
        ok: true,
        processed: 0,
        platform: queuedItem.platform,
        message: `Publisher for '${queuedItem.platform}' returned null`,
        debugEnv: {
          WORDPRESS_SITE_URL: siteUrl || "(missing)",
          WORDPRESS_USERNAME: username || "(missing)",
          WORDPRESS_APP_PASSWORD_present: !!appPass,
          WORDPRESS_ACCESS_TOKEN_present: !!token,
        }
      });
    }
  } catch (err: any) {
    console.error("❌ [Queue Cron] Exception:", err.message);
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
