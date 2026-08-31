/**
 * ═══════════════════════════════════════════════════════════════════
 * EXPIRED JOB LIFECYCLE TRANSITION CRON — Runs daily at 12:00 AM
 * ═══════════════════════════════════════════════════════════════════
 * - Finds all jobs where last_date < today AND status is still 'active'
 * - Appends an "Application Closed" banner to the top of blog_content
 * - NEVER 404s or deletes — preserves all accumulated SEO equity
 * - Sets status to 'closed' (still public, still indexable)
 *
 * SEO Benefit: Closed pages retain backlinks + rankings, show fresh
 * content banner, and push readers to Admit Card / Result links.
 */

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://www.rojgarsuvidha.com";

const CLOSED_BANNER_HTML = (title: string, category: string) => {
  const nextStepUrl =
    category === "results" ? `${BASE_URL}/results` :
    category === "admit-card" ? `${BASE_URL}/admit-card` :
    `${BASE_URL}/results`;
  const nextStepLabel =
    category === "results" ? "Check Merit List" :
    category === "admit-card" ? "Download Admit Card" :
    "Check Result & Admit Card";

  return `<div style="background:#fff3cd;border:2px solid #ffc107;border-radius:12px;padding:20px 24px;margin-bottom:28px;text-align:center;">
  <div style="font-size:2rem;margin-bottom:8px;">⏰</div>
  <h3 style="color:#856404;font-size:1.1rem;font-weight:800;margin:0 0 8px;">Application Period Closed</h3>
  <p style="color:#533f03;font-size:0.9rem;margin:0 0 14px;line-height:1.7;">The application window for <strong>${title}</strong> is now closed. If you have already applied, track your next steps below.</p>
  <a href="${nextStepUrl}" style="display:inline-block;background:#ffc107;color:#000;font-weight:700;padding:10px 24px;border-radius:8px;text-decoration:none;font-size:0.9rem;">${nextStepLabel} →</a>
</div>`;
};

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getSupabase();
  if (!supabase) return NextResponse.json({ ok: false, reason: "No Supabase" });

  const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD

  try {
    // Find active jobs with a parseable last date that has passed
    // We look for jobs with important_dates containing last_date < today
    // OR tag/short_info containing a date pattern
    const { data: activeJobs } = await supabase
      .from("jobs")
      .select("id, title, slug, blog_content, category, status, tag")
      .eq("status", "active")
      .not("blog_content", "is", null);

    if (!activeJobs || activeJobs.length === 0) {
      return NextResponse.json({ ok: true, expired: 0, checked: 0 });
    }

    let expiredCount = 0;

    for (const job of activeJobs) {
      // Simple last-date heuristic: parse dates from tag field
      // tag field format: "Last Date: 31 Aug 2026" or "last-date-2026-08-31"
      let lastDateStr: string | null = null;

      if (job.tag && typeof job.tag === "string") {
        // Extract date patterns like "2026-08-31" or "31 Aug 2026"
        const isoMatch = job.tag.match(/(\d{4}-\d{2}-\d{2})/);
        if (isoMatch) lastDateStr = isoMatch[1];
      }

      if (!lastDateStr) continue;

      const lastDate = new Date(lastDateStr);
      const isExpired = !isNaN(lastDate.getTime()) && lastDateStr < today;

      if (!isExpired) continue;

      // Check if banner is already prepended
      if (job.blog_content?.includes("Application Period Closed")) continue;

      const banner = CLOSED_BANNER_HTML(job.title, job.category || "latest-jobs");
      const updatedContent = banner + (job.blog_content || "");

      const { error } = await supabase
        .from("jobs")
        .update({
          blog_content: updatedContent,
          status: "closed",
          updated_at: new Date().toISOString(),
        })
        .eq("id", job.id);

      if (!error) {
        expiredCount++;
        console.log(`✅ [Expire Cron] Marked as closed: ${job.slug} (Last Date: ${lastDateStr})`);
      }
    }

    return NextResponse.json({
      ok: true,
      checked: activeJobs.length,
      expired: expiredCount,
      date: today,
    });
  } catch (err: any) {
    console.error("❌ [Expire Cron] Error:", err.message);
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
