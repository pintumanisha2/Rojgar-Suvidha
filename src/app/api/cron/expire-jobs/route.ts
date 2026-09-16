export const dynamic = "force-dynamic";
/**
 * ═══════════════════════════════════════════════════════════════════
 * EXPIRED JOB LIFECYCLE TRANSITION CRON — Runs twice daily (IST)
 * ═══════════════════════════════════════════════════════════════════
 * FIXED: Reads last_date column directly (was wrongly reading tag field)
 *
 * Lifecycle states (automatic, no manual work needed):
 *   active        → last_date > 5 days away
 *   closing_soon  → last_date in 1–5 days (tag = "urgent")
 *   closing_today → last_date = today     (tag = "urgent")
 *   closed        → last_date < today     (banner prepended, SEO preserved)
 *
 * SEO: Pages stay live forever — zero 404s. All SEO equity preserved.
 */

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://www.rojgarsuvidha.com";

// ── Supabase client ───────────────────────────────────────────────────────────
function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

// ── Date helpers ──────────────────────────────────────────────────────────────

/** Parse any reasonable date string → ISO YYYY-MM-DD or null */
function parseToISO(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const s = String(raw).trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
  const dmy = s.match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})/);
  if (dmy) return `${dmy[3]}-${dmy[2].padStart(2, "0")}-${dmy[1].padStart(2, "0")}`;
  try {
    const d = new Date(s);
    if (!isNaN(d.getTime())) return d.toISOString().slice(0, 10);
  } catch {}
  return null;
}

/** Extract last date from important_dates JSON array */
function extractLastDateFromJson(importantDates: any): string | null {
  if (!Array.isArray(importantDates)) return null;
  const ld = importantDates.find((d: any) =>
    /last\s*date|closing|deadline|apply.*last|last.*apply/i.test(d?.label || "")
  );
  return ld ? parseToISO(ld.value) : null;
}

/** Days difference: positive = future, negative = past, 0 = today */
function daysFromToday(isoDate: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(isoDate + "T00:00:00");
  return Math.round((target.getTime() - today.getTime()) / 86400000);
}

// ── Closed banner HTML ────────────────────────────────────────────────────────
function closedBannerHtml(title: string, category: string, lastDateDisplay: string): string {
  const nextUrl   = category === "results"    ? `${BASE_URL}/results`    :
                    category === "admit-card" ? `${BASE_URL}/admit-card` :
                    `${BASE_URL}/results`;
  const nextLabel = category === "results"    ? "Check Merit List"        :
                    category === "admit-card" ? "Download Admit Card"     :
                    "Check Result & Admit Card";
  return `<div style="background:#fef2f2;border:2px solid #fca5a5;border-radius:12px;padding:20px 24px;margin-bottom:28px;text-align:center;">
  <div style="font-size:1.8rem;margin-bottom:6px;">🔒</div>
  <h3 style="color:#991b1b;font-size:1.05rem;font-weight:800;margin:0 0 8px;">Application Window Closed</h3>
  <p style="color:#7f1d1d;font-size:0.88rem;margin:0 0 6px;line-height:1.65;">The last date to apply for <strong>${title}</strong> was <strong>${lastDateDisplay}</strong>. The application window is now closed.</p>
  <p style="color:#7f1d1d;font-size:0.85rem;margin:0 0 14px;">If you had already applied, check your next steps below. New notifications are posted daily on Rojgar Suvidha.</p>
  <div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap;">
    <a href="${nextUrl}" style="display:inline-block;background:#dc2626;color:#fff;font-weight:700;padding:9px 20px;border-radius:8px;text-decoration:none;font-size:0.88rem;">${nextLabel} →</a>
    <a href="${BASE_URL}/latest-jobs" style="display:inline-block;background:#1e40af;color:#fff;font-weight:700;padding:9px 20px;border-radius:8px;text-decoration:none;font-size:0.88rem;">New Jobs 2026 →</a>
  </div>
</div>`;
}

// ── Main handler ──────────────────────────────────────────────────────────────
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getSupabase();
  if (!supabase) return NextResponse.json({ ok: false, reason: "No Supabase" });

  const todayISO = new Date().toISOString().split("T")[0];

  try {
    const { data: jobs, error: fetchErr } = await supabase
      .from("jobs")
      .select("id, title, slug, blog_content, category, status, tag, last_date, important_dates")
      .in("status", ["active", "closing_today", "closing_soon"])
      .not("blog_content", "is", null);

    if (fetchErr) {
      console.error("❌ [Expire Cron] Fetch error:", fetchErr.message);
      return NextResponse.json({ ok: false, error: fetchErr.message }, { status: 500 });
    }
    if (!jobs || jobs.length === 0) {
      return NextResponse.json({ ok: true, message: "No active jobs to process", date: todayISO });
    }

    let closedCount = 0, urgentCount = 0, skippedCount = 0;
    const errors: string[] = [];

    for (const job of jobs) {
      try {
        // Resolve last date — direct column first, fallback to important_dates JSON
        const rawLastDate = job.last_date || extractLastDateFromJson(job.important_dates);
        const isoLastDate = parseToISO(rawLastDate);
        if (!isoLastDate) { skippedCount++; continue; }

        const days = daysFromToday(isoLastDate);

        // ── CLOSED (days < 0) ─────────────────────────────────────────────────
        if (days < 0) {
          if (job.status === "closed") { skippedCount++; continue; }
          if ((job.blog_content || "").includes("Application Window Closed")) {
            if (job.status !== "closed") await supabase.from("jobs").update({ status: "closed" }).eq("id", job.id);
            skippedCount++; continue;
          }
          const banner = closedBannerHtml(job.title, job.category || "latest-jobs", rawLastDate || isoLastDate);
          const { error } = await supabase.from("jobs").update({
            blog_content: banner + (job.blog_content || ""),
            status: "closed",
            tag: null,
            updated_at: new Date().toISOString(),
          }).eq("id", job.id);
          if (!error) { closedCount++; console.log(`🔒 Closed: ${job.slug} (${Math.abs(days)}d ago)`); }
          else errors.push(`${job.slug}: ${error.message}`);
          continue;
        }

        // ── CLOSING TODAY (days === 0) ─────────────────────────────────────────
        if (days === 0) {
          await supabase.from("jobs").update({ status: "closing_today", tag: "urgent", updated_at: new Date().toISOString() }).eq("id", job.id);
          urgentCount++;
          console.log(`⚡ Closing TODAY: ${job.slug}`);
          continue;
        }

        // ── CLOSING SOON (days 1–5) ────────────────────────────────────────────
        if (days <= 5) {
          if (job.status !== "closing_soon" || job.tag !== "urgent") {
            await supabase.from("jobs").update({ status: "closing_soon", tag: "urgent", updated_at: new Date().toISOString() }).eq("id", job.id);
            urgentCount++;
            console.log(`⏰ Closing soon (${days}d): ${job.slug}`);
          } else skippedCount++;
          continue;
        }

        // ── ACTIVE (days > 5) — reset if stuck in closing_soon ────────────────
        if (job.status === "closing_soon" || job.status === "closing_today") {
          await supabase.from("jobs").update({
            status: "active",
            tag: job.tag === "urgent" ? null : job.tag,
            updated_at: new Date().toISOString(),
          }).eq("id", job.id);
        } else skippedCount++;

      } catch (jobErr: any) {
        errors.push(`${job.slug}: ${jobErr.message}`);
      }
    }

    console.log(`✅ [Expire Cron] Closed:${closedCount} Urgent:${urgentCount} Skipped:${skippedCount}`);
    return NextResponse.json({ ok: true, date: todayISO, checked: jobs.length, closed: closedCount, urgent: urgentCount, skipped: skippedCount, ...(errors.length ? { errors } : {}) });

  } catch (err: any) {
    console.error("❌ [Expire Cron] Fatal:", err.message);
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
